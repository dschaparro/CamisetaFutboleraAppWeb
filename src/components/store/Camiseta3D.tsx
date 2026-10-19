"use client";

import { useEffect, useRef, useState } from "react";
import type * as ThreeTipos from "three";
import { dibujarCamiseta, medirContorno, poligonoCamiseta, precargar, type Lado } from "@/components/store/camiseta-dibujo";
import { imagenesDe, type EstadoCamiseta } from "@/lib/personalizacion";

type Vista = { lado: Lado; n: number };

type Escena = {
  actualizar: (e: EstadoCamiseta) => void;
  mirar: (lado: Lado) => void;
  girarAuto: (v: boolean) => void;
  destruir: () => void;
};

const TAM_TEXTURA = 2048;
const TAM_MALLA = 2.6;
const PROFUNDIDAD = 0.34;
const BORDE = 0.05;
const TOPE_UV = 26 / 128;

/** Camiseta en 3D que se arrastra con el mouse o el dedo; se repinta con cada cambio del personalizador. */
export default function Camiseta3D({ estado, vista, auto }: { estado: EstadoCamiseta; vista: Vista; auto: boolean }) {
  const caja = useRef<HTMLDivElement>(null);
  const escena = useRef<Escena | null>(null);
  const ultimo = useRef(estado);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    ultimo.current = estado;
    escena.current?.actualizar(estado);
  }, [estado]);

  useEffect(() => {
    if (vista.n > 0) escena.current?.mirar(vista.lado);
  }, [vista]);

  useEffect(() => {
    escena.current?.girarAuto(auto);
  }, [auto]);

  useEffect(() => {
    let vivo = true;
    const el = caja.current;
    if (!el) return;
    montar(el, ultimo.current).then(
      (s) => {
        if (!vivo) return s.destruir();
        escena.current = s;
      },
      () => vivo && setFallo(true),
    );
    return () => {
      vivo = false;
      escena.current?.destruir();
      escena.current = null;
    };
  }, []);

  return (
    <div className="c3d" ref={caja} aria-label="Camiseta en 3D: arrastra para girarla">
      {fallo && <p className="c3d-fallo">Tu navegador no puede mostrar el modelo 3D. Prueba con Chrome, Edge o Firefox actualizado.</p>}
    </div>
  );
}

async function montar(el: HTMLDivElement, inicial: EstadoCamiseta): Promise<Escena> {
  const THREE: typeof ThreeTipos = await import("three");
  const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camara.position.set(0, 0.05, 5.1);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd5dae6, 1.5));
  const luz = new THREE.DirectionalLight(0xffffff, 1.7);
  luz.position.set(2.5, 3.5, 4);
  scene.add(luz);
  const contra = new THREE.DirectionalLight(0xffffff, 1.2);
  contra.position.set(-2.5, 2, -4);
  scene.add(contra);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 3.2;
  controles.maxDistance = 8;
  controles.minPolarAngle = Math.PI * 0.25;
  controles.maxPolarAngle = Math.PI * 0.75;
  controles.autoRotateSpeed = 2.2;

  // Relieve fino de tela (ruido) para que no se vea plástica.
  const ruido = document.createElement("canvas");
  ruido.width = ruido.height = 256;
  const rc = ruido.getContext("2d");
  if (rc) {
    const id = rc.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 110 + Math.random() * 60;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    rc.putImageData(id, 0, 0);
  }
  const texRuido = new THREE.CanvasTexture(ruido);
  texRuido.wrapS = texRuido.wrapT = THREE.RepeatWrapping;
  texRuido.repeat.set(10, 10);

  const lienzos: Record<Lado, HTMLCanvasElement> = { frente: document.createElement("canvas"), espalda: document.createElement("canvas") };
  const texturas = {} as Record<Lado, ThreeTipos.CanvasTexture>;
  const grupo = new THREE.Group();
  scene.add(grupo);

  /**
   * Altura (0..1) de cada vértice según su distancia exacta al borde de la silueta. Los vértices que quedan
   * justo fuera se pegan al contorno: así el borde de la camiseta es liso, sin escalones de la rejilla.
   */
  function alturasDe(manga: "Corta" | "Larga", lado: Lado, pos: ThreeTipos.BufferAttribute | ThreeTipos.InterleavedBufferAttribute, seg: number) {
    const poly = poligonoCamiseta(manga, lado);
    const alt = new Float32Array(pos.count);
    const px = new Float32Array(pos.count);
    const py = new Float32Array(pos.count);
    const dentro = new Uint8Array(pos.count);
    const celda = 1 / seg;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / TAM_MALLA + 0.5;
      const v = 0.5 - pos.getY(i) / TAM_MALLA;
      px[i] = pos.getX(i);
      py[i] = pos.getY(i);
      const m = medirContorno(poly, u, v);
      if (m.dentro) {
        const t = Math.min(1, m.d / TOPE_UV);
        const q = 1 - (1 - t) * (1 - t);
        alt[i] = 0.65 * Math.sqrt(q) + 0.35 * q;
        dentro[i] = 1;
      } else if (m.d < celda * 1.6) {
        px[i] = (m.qu - 0.5) * TAM_MALLA;
        py[i] = (0.5 - m.qv) * TAM_MALLA;
        dentro[i] = 2;
      }
    }
    return { alt, px, py, dentro };
  }

  /** Aristas que quedan en el borde de la malla recortada (usadas por un solo triángulo). */
  function aristasDeBorde(indices: number[]): Map<number, [number, number]> {
    const cuenta = new Map<number, { n: number; a: number; b: number }>();
    const n = 1 << 20;
    for (let k = 0; k < indices.length; k += 3) {
      for (const [p, q] of [[indices[k], indices[k + 1]], [indices[k + 1], indices[k + 2]], [indices[k + 2], indices[k]]]) {
        const a = Math.min(p, q);
        const b = Math.max(p, q);
        const clave = a * n + b;
        const previo = cuenta.get(clave);
        if (previo) previo.n++;
        else cuenta.set(clave, { n: 1, a, b });
      }
    }
    const borde = new Map<number, [number, number]>();
    cuenta.forEach((v, clave) => v.n === 1 && borde.set(clave, [v.a, v.b]));
    return borde;
  }

  /** Camiseta cerrada: cara delantera, cara trasera y una pared lateral que las une (sin huecos al girar). */
  function construir(manga: "Corta" | "Larga") {
    const seg = 300;
    const base = new THREE.PlaneGeometry(TAM_MALLA, TAM_MALLA, seg, seg);
    const pos = base.attributes.position;
    const dF = alturasDe(manga, "frente", pos, seg);
    const dB = alturasDe(manga, "espalda", pos, seg);
    const orig = base.getIndex()!;

    const cara = (d: ReturnType<typeof alturasDe>, signo: 1 | -1) => {
      const g = base.clone();
      const p = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        p.setX(i, d.px[i]);
        p.setY(i, d.py[i]);
        const u = d.px[i] / TAM_MALLA + 0.5;
        const v = 0.5 - d.py[i] / TAM_MALLA;
        const arruga = Math.sin(u * 38 + v * 9) * 0.012 + Math.sin(v * 31 - u * 6) * 0.01;
        const h = d.alt[i];
        p.setZ(i, signo * (BORDE + h * (PROFUNDIDAD - BORDE + arruga)));
        uv.setXY(i, signo === 1 ? u : 1 - u, 1 - v);
      }
      const nuevo: number[] = [];
      for (let k = 0; k < orig.count; k += 3) {
        const a = orig.getX(k);
        const b = orig.getX(k + 1);
        const c = orig.getX(k + 2);
        const n = (d.dentro[a] === 1 ? 1 : 0) + (d.dentro[b] === 1 ? 1 : 0) + (d.dentro[c] === 1 ? 1 : 0);
        const ok = d.dentro[a] > 0 && d.dentro[b] > 0 && d.dentro[c] > 0;
        if (n > 0 && ok) {
          if (signo === 1) nuevo.push(a, b, c);
          else nuevo.push(a, c, b);
        }
      }
      g.setIndex(nuevo);
      g.computeVertexNormals();
      return { g, nuevo };
    };
    const f = cara(dF, 1);
    const e = cara(dB, -1);

    // Pared: solo donde el borde del frente y el de la espalda coinciden.
    const bf = aristasDeBorde(f.nuevo);
    const be = aristasDeBorde(e.nuevo);
    const pp: number[] = [];
    const uvs: number[] = [];
    const ind: number[] = [];
    const frenteUv = f.g.attributes.uv;
    bf.forEach((par, clave) => {
      if (!be.has(clave)) return;
      const n0 = pp.length / 3;
      for (const i of par) {
        pp.push(dF.px[i], dF.py[i], BORDE);
        uvs.push(frenteUv.getX(i), frenteUv.getY(i));
      }
      for (const i of par) {
        pp.push(dF.px[i], dF.py[i], -BORDE);
        uvs.push(frenteUv.getX(i), frenteUv.getY(i));
      }
      ind.push(n0, n0 + 1, n0 + 2, n0 + 1, n0 + 3, n0 + 2);
    });
    const pared = new THREE.BufferGeometry();
    pared.setAttribute("position", new THREE.Float32BufferAttribute(pp, 3));
    pared.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    pared.setIndex(ind);
    pared.computeVertexNormals();
    base.dispose();
    return { frente: f.g, espalda: e.g, pared };
  }

  (["frente", "espalda"] as Lado[]).forEach((lado) => {
    lienzos[lado].width = lienzos[lado].height = TAM_TEXTURA;
    const t = new THREE.CanvasTexture(lienzos[lado]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texturas[lado] = t;
  });
  const material = (lado: Lado) => new THREE.MeshStandardMaterial({ map: texturas[lado], roughness: 0.88, metalness: 0, side: THREE.DoubleSide, bumpMap: texRuido, bumpScale: 0.6 });
  const geos = construir(inicial.manga);
  const mallas = {
    frente: new THREE.Mesh(geos.frente, material("frente")),
    espalda: new THREE.Mesh(geos.espalda, material("espalda")),
    pared: new THREE.Mesh(geos.pared, material("frente")),
  };
  grupo.add(mallas.frente, mallas.espalda, mallas.pared);

  let mangaActual = inicial.manga;
  function actualizar(e: EstadoCamiseta) {
    if (e.manga !== mangaActual) {
      mangaActual = e.manga;
      const n = construir(e.manga);
      mallas.frente.geometry.dispose();
      mallas.espalda.geometry.dispose();
      mallas.pared.geometry.dispose();
      mallas.frente.geometry = n.frente;
      mallas.espalda.geometry = n.espalda;
      mallas.pared.geometry = n.pared;
    }
    pintar(e);
    // Los escudos y logos reales llegan de internet: se repinta cuando terminan de cargar.
    const mia = ++version;
    precargar(imagenesDe(e)).then(() => mia === version && pintar(e));
  }
  function pintar(e: EstadoCamiseta) {
    (["frente", "espalda"] as Lado[]).forEach((lado) => {
      dibujarCamiseta(lienzos[lado], lado, e, true);
      texturas[lado].needsUpdate = true;
    });
  }
  let version = 0;
  actualizar(inicial);

  function ajustar() {
    const w = el.clientWidth || 600;
    const h = el.clientHeight || 600;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  ajustar();
  const ro = new ResizeObserver(ajustar);
  ro.observe(el);

  let giro: { desde: number; hasta: number; t0: number } | null = null;
  function mirar(lado: Lado) {
    const x = camara.position.x;
    const z = camara.position.z;
    const desde = Math.atan2(x, z);
    let hasta = lado === "frente" ? 0 : Math.PI;
    while (hasta - desde > Math.PI) hasta -= Math.PI * 2;
    while (hasta - desde < -Math.PI) hasta += Math.PI * 2;
    controles.autoRotate = false;
    giro = { desde, hasta, t0: performance.now() };
  }

  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controles.autoRotate = !reducido;
  let raf = 0;
  function bucle() {
    raf = requestAnimationFrame(bucle);
    if (giro) {
      const k = Math.min(1, (performance.now() - giro.t0) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      const ang = giro.desde + (giro.hasta - giro.desde) * e;
      const radio = Math.hypot(camara.position.x, camara.position.z);
      camara.position.x = Math.sin(ang) * radio;
      camara.position.z = Math.cos(ang) * radio;
      if (k >= 1) giro = null;
    }
    controles.update();
    renderer.render(scene, camara);
  }
  bucle();
  controles.addEventListener("start", () => {
    controles.autoRotate = false;
    giro = null;
  });

  return {
    actualizar,
    mirar,
    girarAuto: (v) => {
      if (!reducido) controles.autoRotate = v;
    },
    destruir: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controles.dispose();
      [mallas.frente, mallas.espalda, mallas.pared].forEach((m) => {
        m.geometry.dispose();
        (m.material as ThreeTipos.Material).dispose();
      });
      texturas.frente.dispose();
      texturas.espalda.dispose();
      texRuido.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

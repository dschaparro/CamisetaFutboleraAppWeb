import { LOGO_CHAMPIONS, colorContraste, type EstadoCamiseta } from "@/lib/personalizacion";

export type Lado = "frente" | "espalda";

/** Contorno de la camiseta en coordenadas 0..1 (mitad derecha); la izquierda se refleja. */
function puntos(manga: "Corta" | "Larga", lado: Lado) {
  const cuello = lado === "frente" ? 0.215 : 0.135;
  const largo = manga === "Larga";
  return {
    cuelloY: cuello,
    hombroCuello: [0.6, 0.085],
    hombro: [0.79, 0.15],
    mangaFuera: largo ? [0.985, 0.74] : [0.965, 0.36],
    mangaDentro: largo ? [0.875, 0.77] : [0.855, 0.44],
    axila: largo ? [0.755, 0.43] : [0.755, 0.39],
    cintura: [0.755, 0.9],
  };
}

export function rutaCamiseta(ctx: CanvasRenderingContext2D, W: number, H: number, manga: "Corta" | "Larga", lado: Lado) {
  const p = puntos(manga, lado);
  const X = (x: number) => x * W;
  const Y = (y: number) => y * H;
  const esp = (x: number) => 1 - x;
  ctx.beginPath();
  ctx.moveTo(X(p.hombroCuello[0]), Y(p.hombroCuello[1]));
  ctx.lineTo(X(p.hombro[0]), Y(p.hombro[1]));
  ctx.lineTo(X(p.mangaFuera[0]), Y(p.mangaFuera[1]));
  ctx.lineTo(X(p.mangaDentro[0]), Y(p.mangaDentro[1]));
  ctx.lineTo(X(p.axila[0]), Y(p.axila[1]));
  ctx.lineTo(X(p.cintura[0]), Y(p.cintura[1]));
  ctx.quadraticCurveTo(X(0.5), Y(0.945), X(esp(p.cintura[0])), Y(p.cintura[1]));
  ctx.lineTo(X(esp(p.axila[0])), Y(p.axila[1]));
  ctx.lineTo(X(esp(p.mangaDentro[0])), Y(p.mangaDentro[1]));
  ctx.lineTo(X(esp(p.mangaFuera[0])), Y(p.mangaFuera[1]));
  ctx.lineTo(X(esp(p.hombro[0])), Y(p.hombro[1]));
  ctx.lineTo(X(esp(p.hombroCuello[0])), Y(p.hombroCuello[1]));
  ctx.quadraticCurveTo(X(0.5), Y(p.cuelloY * 2 - p.hombroCuello[1]), X(p.hombroCuello[0]), Y(p.hombroCuello[1]));
  ctx.closePath();
}

function texto(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, tam: number, color: string, borde?: string) {
  ctx.font = `800 ${tam}px "Arial Black", Impact, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (borde) {
    ctx.lineWidth = Math.max(2, tam * 0.06);
    ctx.strokeStyle = borde;
    ctx.lineJoin = "round";
    ctx.strokeText(t, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(t, x, y);
}

/* ---- Imágenes reales (escudos y logos de liga): se cargan una vez y se reutilizan ---- */
const cache = new Map<string, HTMLImageElement | null | "cargando">();

export function precargar(urls: (string | null)[]): Promise<void> {
  const tareas = urls
    .filter((u): u is string => !!u)
    .map(
      (u) =>
        new Promise<void>((ok) => {
          if (cache.has(u) && cache.get(u) !== "cargando") return ok();
          cache.set(u, "cargando");
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.referrerPolicy = "no-referrer";
          img.onload = () => {
            cache.set(u, img);
            ok();
          };
          img.onerror = () => {
            cache.set(u, null);
            ok();
          };
          img.src = u;
        }),
    );
  return Promise.all(tareas).then(() => undefined);
}

function imagenCargada(u: string | null): HTMLImageElement | null {
  const v = u ? cache.get(u) : null;
  return v && v !== "cargando" ? v : null;
}

/** Dibuja la imagen dentro de un cuadro conservando su proporción. */
function ajustada(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, lado: number) {
  const k = Math.min(lado / img.naturalWidth, lado / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

/** Logo real dentro de un cuadro; con `tinte` se pinta de un solo color (marcas de una tinta como adidas o Nike). */
function logo(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, cx: number, cy: number, ancho: number, alto: number, tinte?: string) {
  if (!img) return;
  const k = Math.min(ancho / img.naturalWidth, alto / img.naturalHeight);
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  if (!tinte) {
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  const t = document.createElement("canvas");
  t.width = w;
  t.height = h;
  const c = t.getContext("2d");
  if (!c) return;
  c.drawImage(img, 0, 0, w, h);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = tinte;
  c.fillRect(0, 0, w, h);
  ctx.drawImage(t, cx - w / 2, cy - h / 2, w, h);
}

function escudo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, e: EstadoCamiseta) {
  const img = imagenCargada(e.escudoUrl);
  if (img) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = r * 0.18;
    ctx.shadowOffsetY = r * 0.05;
    ajustada(ctx, img, x, y, r * 2.3);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = e.paleta.detalle;
  ctx.fill();
  texto(ctx, e.iniciales.slice(0, 3), x, y, r * 0.6, e.paleta.detalle === "#FFFFFF" ? "#1B1B1B" : "#FFFFFF");
  ctx.restore();
}

/** Parche de manga: logo real sobre un disco blanco con borde, ligeramente girado como va cosido. */
function parche(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, r: number, e: EstadoCamiseta, giro = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);
  ctx.shadowColor = "rgba(0,0,0,.3)";
  ctx.shadowBlur = r * 0.25;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = "rgba(0,0,0,.28)";
  ctx.stroke();
  if (id === "orgullo") {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#FCD116";
    ctx.fillRect(-r, -r, r * 2, r);
    ctx.fillStyle = "#003893";
    ctx.fillRect(-r, 0, r * 2, r * 0.5);
    ctx.fillStyle = "#CE1126";
    ctx.fillRect(-r, r * 0.5, r * 2, r * 0.5);
  } else {
    const img = imagenCargada(id === "champions" ? LOGO_CHAMPIONS : e.ligaLogoUrl);
    if (img) ajustada(ctx, img, 0, 0, r * 1.62);
  }
  ctx.restore();
}

/** Pinta una cara de la camiseta (frente o espalda) en el canvas. */
export function dibujarCamiseta(canvas: HTMLCanvasElement, lado: Lado, e: EstadoCamiseta, fondoSolido = false) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const p = puntos(e.manga, lado);
  const pa = e.paleta;
  ctx.clearRect(0, 0, W, H);
  // En 3D el borde no debe tener píxeles transparentes (se verían oscuros al girar): se extiende el color base.
  if (fondoSolido) {
    ctx.fillStyle = pa.base;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.save();
  rutaCamiseta(ctx, W, H, e.manga, lado);
  ctx.clip();

  ctx.fillStyle = pa.base;
  ctx.fillRect(0, 0, W, H);

  // Patrón de la camiseta (solo cuerpo: las mangas llevan el color base).
  ctx.save();
  ctx.beginPath();
  ctx.rect(W * 0.245, 0, W * 0.51, H);
  ctx.clip();
  if (pa.patron === "rayas") {
    const n = 9;
    const ancho = (W * 0.51) / n;
    ctx.fillStyle = pa.alt;
    for (let i = 0; i < n; i += 2) ctx.fillRect(W * 0.245 + i * ancho, 0, ancho, H);
  } else if (pa.patron === "franja") {
    ctx.fillStyle = pa.alt;
    ctx.fillRect(W * 0.5 - W * 0.045, 0, W * 0.09, H);
    ctx.fillStyle = pa.detalle;
    ctx.fillRect(W * 0.5 - W * 0.055, 0, W * 0.01, H);
    ctx.fillRect(W * 0.5 + W * 0.045, 0, W * 0.01, H);
  }
  ctx.restore();

  // Puños de las mangas.
  ctx.fillStyle = pa.detalle;
  const mx = [p.mangaFuera, p.mangaDentro];
  for (const lado2 of [1, -1]) {
    const f = (v: number[]) => [lado2 === 1 ? v[0] * W : (1 - v[0]) * W, v[1] * H];
    const a = f(mx[0]);
    const b = f(mx[1]);
    const grosor = 0.045 * H;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const largoV = Math.hypot(dx, dy);
    const nx = (dy / largoV) * grosor;
    const ny = (-dx / largoV) * grosor;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(b[0] + nx, b[1] + ny);
    ctx.lineTo(a[0] + nx, a[1] + ny);
    ctx.closePath();
    ctx.fill();
  }
  // Dobladillo inferior.
  ctx.fillRect(W * 0.24, H * 0.9, W * 0.52, H * 0.012);

  // Sombreado suave de tela (el volumen real lo da la luz 3D).
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(255,255,255,.06)");
  g.addColorStop(1, "rgba(0,0,0,.08)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Cuello (aro en el color de detalle).
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(p.hombroCuello[0] * W, p.hombroCuello[1] * H);
  ctx.quadraticCurveTo(W * 0.5, (p.cuelloY * 2 - p.hombroCuello[1]) * H, (1 - p.hombroCuello[0]) * W, p.hombroCuello[1] * H);
  ctx.lineWidth = H * 0.028;
  ctx.strokeStyle = pa.detalle;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // Costuras.
  ctx.save();
  rutaCamiseta(ctx, W, H, e.manga, lado);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(0,0,0,.22)";
  ctx.stroke();
  ctx.restore();

  if (lado === "frente") {
    if (e.club) escudo(ctx, W * 0.4, H * 0.3, W * 0.05, e);
    const tinteMarca = e.paleta.patron === "rayas" ? e.paleta.detalle : colorContraste(e.paleta.base);
    if (e.club) logo(ctx, imagenCargada(e.paleta.marcaUrl ?? null), W * 0.6, H * 0.295, W * 0.085, H * 0.05, tinteMarca);
    if (e.club) logo(ctx, imagenCargada(e.paleta.patrocinadorUrl ?? null), W * 0.5, H * 0.47, W * 0.27, H * 0.085, e.paleta.patrocinadorUrl?.includes("Spotify") ? "#FFFFFF" : undefined);
    const largaM = e.manga === "Larga";
    if (e.parches.includes("liga")) parche(ctx, "liga", W * (largaM ? 0.875 : 0.832), H * (largaM ? 0.52 : 0.29), W * 0.056, e, -0.3);
    if (e.parches.includes("champions")) parche(ctx, "champions", W * (largaM ? 0.125 : 0.168), H * (largaM ? 0.52 : 0.29), W * 0.056, e, 0.3);
  } else {
    if (e.parches.includes("orgullo")) parche(ctx, "orgullo", W * 0.5, H * 0.205, W * 0.028, e);
    const nombre = e.nombre.trim();
    if (nombre) {
      ctx.save();
      const tam = Math.min(W * 0.085, (W * 0.44) / Math.max(5, nombre.length) * 1.7);
      texto(ctx, nombre, W * 0.5, H * 0.3, tam, e.colorTexto, "rgba(0,0,0,.18)");
      ctx.restore();
    }
    if (e.numero) texto(ctx, e.numero, W * 0.5, H * 0.52, W * (e.numero.length > 1 ? 0.27 : 0.3), e.colorTexto, "rgba(0,0,0,.18)");
  }
}

/** Alto de relieve 0..1: perfil redondeado según la distancia al borde de la silueta (cuerpo y mangas con volumen). */
export function mapaDeAltura(manga: "Corta" | "Larga", lado: Lado, n = 128): Float32Array {
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const ctx = c.getContext("2d");
  const out = new Float32Array(n * n);
  if (!ctx) return out;
  rutaCamiseta(ctx, n, n, manga, lado);
  ctx.fillStyle = "#fff";
  ctx.fill();
  const datos = ctx.getImageData(0, 0, n, n).data;
  const INF = 1e9;
  const d = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) d[i] = datos[i * 4 + 3] > 127 ? INF : 0;
  // Distancia al borde (chaflán 3-4), dos pasadas.
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= n || y >= n ? 0 : d[y * n + x]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const i = y * n + x;
      if (d[i] === 0) continue;
      d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.4, at(x + 1, y - 1) + 1.4);
    }
  for (let y = n - 1; y >= 0; y--)
    for (let x = n - 1; x >= 0; x--) {
      const i = y * n + x;
      if (d[i] === 0) continue;
      d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.4, at(x - 1, y + 1) + 1.4);
    }
  const tope = (n * 26) / 128;
  for (let i = 0; i < n * n; i++) {
    const t = Math.min(1, d[i] / tope);
    out[i] = 0.65 * Math.sqrt(1 - (1 - t) * (1 - t)) + 0.35 * (1 - (1 - t) * (1 - t));
  }
  return out;
}

/* ---- Geometría exacta de la silueta (para el modelo 3D) ---- */

/** Contorno cerrado de la camiseta en coordenadas 0..1 (v hacia abajo), igual al que se dibuja en 2D. */
export function poligonoCamiseta(manga: "Corta" | "Larga", lado: Lado): [number, number][] {
  const p = puntos(manga, lado);
  const esp = (x: number) => 1 - x;
  const pts: [number, number][] = [];
  const curva = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, n: number) => {
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]);
    }
  };
  pts.push([p.hombroCuello[0], p.hombroCuello[1]]);
  pts.push([p.hombro[0], p.hombro[1]]);
  pts.push([p.mangaFuera[0], p.mangaFuera[1]]);
  pts.push([p.mangaDentro[0], p.mangaDentro[1]]);
  pts.push([p.axila[0], p.axila[1]]);
  pts.push([p.cintura[0], p.cintura[1]]);
  curva(p.cintura[0], p.cintura[1], 0.5, 0.945, esp(p.cintura[0]), p.cintura[1], 40);
  pts.push([esp(p.axila[0]), p.axila[1]]);
  pts.push([esp(p.mangaDentro[0]), p.mangaDentro[1]]);
  pts.push([esp(p.mangaFuera[0]), p.mangaFuera[1]]);
  pts.push([esp(p.hombro[0]), p.hombro[1]]);
  pts.push([esp(p.hombroCuello[0]), p.hombroCuello[1]]);
  curva(esp(p.hombroCuello[0]), p.hombroCuello[1], 0.5, p.cuelloY * 2 - p.hombroCuello[1], p.hombroCuello[0], p.hombroCuello[1], 30);
  return pts;
}

/** Posición de un punto respecto del contorno: si está dentro, distancia al borde y el punto más cercano del borde. */
export function medirContorno(poly: [number, number][], u: number, v: number) {
  let dentro = false;
  let mejor = Infinity;
  let qu = u;
  let qv = v;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) dentro = !dentro;
    const dx = xi - xj;
    const dy = yi - yj;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((u - xj) * dx + (v - yj) * dy) / l2));
    const px = xj + t * dx;
    const py = yj + t * dy;
    const d2 = (u - px) * (u - px) + (v - py) * (v - py);
    if (d2 < mejor) {
      mejor = d2;
      qu = px;
      qv = py;
    }
  }
  return { dentro, d: Math.sqrt(mejor), qu, qv };
}

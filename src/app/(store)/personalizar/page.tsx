"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useCatalogo } from "@/components/store/useCatalogo";
import { money } from "@/lib/money";
import {
  COLORES_TEXTO,
  EQUIPACIONES,
  type Equipacion,
  NOMBRE_MAX,
  PALETA_BLANCA,
  PARCHES,
  descripcionPersonalizacion,
  limpiarNombre,
  limpiarNumero,
  LOGO_LIGA,
  imagenesDe,
  paletaDeClub,
  type EstadoCamiseta,
} from "@/lib/personalizacion";
import { dibujarCamiseta, precargar, type Lado } from "@/components/store/camiseta-dibujo";
import { urlImagen } from "@/modules/tienda/domain/types";

const Camiseta3D = dynamic(() => import("@/components/store/Camiseta3D"), {
  ssr: false,
  loading: () => <div className="c3d c3d-carga">Cargando camiseta…</div>,
});

const TALLAS = ["S", "M", "L", "XL"];

const ZONAS: Record<string, string> = {
  "manga-der": "Manga derecha",
  "manga-izq": "Manga izquierda",
  "pecho-der": "Pecho derecho",
  "cuello-espalda": "Cuello (espalda)",
};

/** Personalizador: una camiseta en blanco en 3D que toma los colores del equipo y lleva nombre, número y parches. */
export default function PersonalizarPage() {
  const { catalogo, error } = useCatalogo();
  const { addItem } = useCart();

  const [club, setClub] = useState<string | null>(null);
  const [equip, setEquip] = useState<Equipacion>("local");
  const [modeloId, setModeloId] = useState<string | null>(null);
  const [manga, setManga] = useState<"Corta" | "Larga">("Corta");
  const [talla, setTalla] = useState("M");
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [colorElegido, setColorElegido] = useState<string | null>(null);
  const [parches, setParches] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [vista, setVista] = useState<{ lado: Lado; n: number }>({ lado: "frente", n: 0 });
  const [auto, setAuto] = useState(true);
  const [previa, setPrevia] = useState<string | null>(null);

  const clubes = useMemo(() => {
    const m = new Map<string, { club: string; ligaId: string; iniciales: string }>();
    for (const p of catalogo?.productos ?? []) if (p.personalizable && !m.has(p.club)) m.set(p.club, { club: p.club, ligaId: p.ligaId, iniciales: p.iniciales });
    return [...m.values()];
  }, [catalogo]);

  const modelos = useMemo(() => (catalogo?.productos ?? []).filter((p) => p.personalizable && p.club === club), [catalogo, club]);
  const modelo = modelos.find((p) => p.id === modeloId) ?? modelos.find((p) => p.disponibilidad !== "agotado") ?? modelos[0] ?? null;
  const liga = catalogo?.ligas.find((l) => l.id === (clubes.find((c) => c.club === club)?.ligaId ?? ""));

  const paleta = useMemo(() => (club ? paletaDeClub(club, liga?.colores, equip) : PALETA_BLANCA), [club, liga, equip]);
  const colorTexto = colorElegido ?? paleta.texto;

  const estado: EstadoCamiseta = useMemo(
    () => ({
      club,
      iniciales: modelo?.iniciales ?? "",
      paleta,
      equipacion: equip,
      manga,
      nombre,
      numero,
      colorTexto,
      parches,
      escudoUrl: club && modelo?.escudo ? urlImagen(modelo.escudo) : null,
      ligaLogoUrl: liga ? (LOGO_LIGA[liga.id] ?? null) : null,
    }),
    [club, modelo, paleta, equip, manga, nombre, numero, colorTexto, parches, liga],
  );

  function mirar(lado: Lado) {
    setAuto(false);
    setVista((v) => ({ lado, n: v.n + 1 }));
  }

  function elegirEquipo(c: string | null) {
    setClub(c);
    setModeloId(null);
    setEquip("local");
    setColorElegido(null);
    mirar("frente");
  }

  function alternarParche(id: string) {
    setParches((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const def = PARCHES.find((x) => x.id === id);
    if (def) mirar(def.lado);
  }

  /** Imagen plana de frente y espalda tal como quedaría, lista para ver o descargar. */
  async function verPrevia() {
    await precargar(imagenesDe(estado));
    const lado = 900;
    const salida = document.createElement("canvas");
    salida.width = lado * 2;
    salida.height = lado + 110;
    const ctx = salida.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#F7F5EE";
    ctx.fillRect(0, 0, salida.width, salida.height);
    (["frente", "espalda"] as Lado[]).forEach((l, i) => {
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      dibujarCamiseta(c, l, estado);
      ctx.drawImage(c, i * lado, 0, lado, lado);
      ctx.fillStyle = "#43506B";
      ctx.font = "700 34px Arial";
      ctx.textAlign = "center";
      ctx.fillText(l === "frente" ? "FRENTE" : "ESPALDA", i * lado + lado / 2, lado + 20);
    });
    ctx.fillStyle = "#0A1626";
    ctx.font = "800 38px Arial";
    ctx.fillText(modelo ? modelo.nombre : "Camiseta en blanco", lado, lado + 75);
    try {
      setPrevia(salida.toDataURL("image/png"));
    } catch {
      /* si el navegador bloqueara las imágenes externas, la vista 3D sigue funcionando */
    }
  }

  function agregar() {
    if (!modelo) return;
    addItem({
      slug: modelo.id,
      club: modelo.club,
      name: modelo.nombre,
      initials: modelo.iniciales,
      cat: modelo.categoria,
      size: talla,
      sleeve: manga,
      custom: descripcionPersonalizacion(estado),
      qty: cantidad,
      price: modelo.precioFinal,
    });
  }

  return (
    <div className="wrap pz">
      <div className="crumbs">
        <Link href="/">Inicio</Link> &gt; Personalizar
      </div>
      <h1 className="pz-titulo">Diseña tu camiseta</h1>
      <p className="pz-sub">Empieza con una camiseta en blanco, elige tu equipo y agrégale nombre, número y parches. Arrástrala para verla por todos lados.</p>

      <div className="pz-grid">
        <section className="pz-visor" aria-label="Vista previa 3D">
          <Camiseta3D estado={estado} vista={vista} auto={auto} />
          <div className="pz-vistas">
            <button className={`chip${vista.lado === "frente" && !auto ? " active" : ""}`} onClick={() => mirar("frente")}>Frente</button>
            <button className={`chip${vista.lado === "espalda" && !auto ? " active" : ""}`} onClick={() => mirar("espalda")}>Espalda</button>
            <button className={`chip${auto ? " active" : ""}`} onClick={() => setAuto((a) => !a)}>{auto ? "Detener giro" : "Girar sola"}</button>
            <button className="chip pz-previa" onClick={verPrevia}>Vista previa</button>
          </div>
          <p className="pz-ayuda">Arrastra para girar · rueda o pellizco para acercar</p>
        </section>

        <section className="pz-panel">
          {error && <p className="form-error">No se pudo cargar el catálogo. Recarga la página.</p>}

          <div className="pz-paso">
            <h2><span>1</span> Equipo</h2>
            <div className="pz-equipos">
              <button className={`pz-equipo${club === null ? " sel" : ""}`} onClick={() => elegirEquipo(null)}>
                <i style={{ background: "#F4F4F1" }} />En blanco
              </button>
              {clubes.map((c) => {
                const pa = paletaDeClub(c.club, catalogo?.ligas.find((l) => l.id === c.ligaId)?.colores);
                return (
                  <button key={c.club} className={`pz-equipo${club === c.club ? " sel" : ""}`} onClick={() => elegirEquipo(c.club)}>
                    <i style={{ background: `linear-gradient(135deg, ${pa.base} 55%, ${pa.patron === "liso" ? pa.detalle : pa.alt} 55%)` }} />
                    {c.club}
                  </button>
                );
              })}
            </div>
            {club && (
              <div className="pz-equip" role="radiogroup" aria-label="Equipación">
                {EQUIPACIONES.map((q) => {
                  const pa = paletaDeClub(club, liga?.colores, q.id);
                  return (
                    <button key={q.id} role="radio" aria-checked={equip === q.id} className={`pz-equipo${equip === q.id ? " sel" : ""}`} onClick={() => setEquip(q.id)}>
                      <i style={{ background: `linear-gradient(135deg, ${pa.base} 55%, ${pa.patron === "liso" ? pa.detalle : pa.alt} 55%)` }} />
                      {q.nombre}
                    </button>
                  );
                })}
              </div>
            )}
            {club && modelos.length > 1 && (
              <div className="opt-row" style={{ marginTop: 12 }}>
                {modelos.map((m) => (
                  <button key={m.id} className={`opt-btn${modelo?.id === m.id ? " selected" : ""}`} onClick={() => setModeloId(m.id)}>
                    {m.nombre.replace("Camiseta ", "")} · {money(m.precioFinal)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pz-paso">
            <h2><span>2</span> Nombre y número</h2>
            <div className="pz-campos">
              <div className="field">
                <label htmlFor="pz-nombre">Nombre en la espalda</label>
                <input id="pz-nombre" value={nombre} maxLength={NOMBRE_MAX} placeholder="TU NOMBRE" onChange={(e) => setNombre(limpiarNombre(e.target.value))} onFocus={() => mirar("espalda")} />
              </div>
              <div className="field">
                <label htmlFor="pz-numero">Número</label>
                <input id="pz-numero" inputMode="numeric" value={numero} maxLength={2} placeholder="10" onChange={(e) => setNumero(limpiarNumero(e.target.value))} onFocus={() => mirar("espalda")} />
              </div>
            </div>
            <div className="pz-colores" role="radiogroup" aria-label="Color del texto">
              {COLORES_TEXTO.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={colorTexto === c.id}
                  aria-label={c.nombre}
                  title={c.nombre}
                  className={colorTexto === c.id ? "sel" : ""}
                  style={{ background: c.id }}
                  onClick={() => setColorElegido(c.id)}
                />
              ))}
              <label className="pz-color-libre" title="Elegir cualquier color">
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(colorTexto) ? colorTexto : "#000000"} onChange={(e) => setColorElegido(e.target.value.toUpperCase())} aria-label="Elegir otro color" />
                <span>Otro color</span>
              </label>
            </div>
          </div>

          <div className="pz-paso">
            <h2><span>3</span> Parches</h2>
            <div className="pz-parches">
              {PARCHES.map((p) => (
                <button key={p.id} className={`pz-parche${parches.includes(p.id) ? " sel" : ""}`} aria-pressed={parches.includes(p.id)} disabled={p.id === "liga" && !estado.ligaLogoUrl} onClick={() => alternarParche(p.id)}>
                  <b>{p.id === "liga" && liga && estado.ligaLogoUrl ? `Parche ${liga.nombre}` : p.nombre}</b>
                  <small>{p.id === "liga" && !estado.ligaLogoUrl ? "Elige un club de liga" : ZONAS[p.zona]}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="pz-paso">
            <h2><span>4</span> Manga y talla</h2>
            <div className="opt-row">
              {(["Corta", "Larga"] as const).map((m) => (
                <button key={m} className={`opt-btn${manga === m ? " selected" : ""}`} onClick={() => setManga(m)}>Manga {m.toLowerCase()}</button>
              ))}
            </div>
            <div className="opt-row" style={{ marginTop: 10 }}>
              {TALLAS.map((t) => (
                <button key={t} className={`opt-btn${talla === t ? " selected" : ""}`} onClick={() => setTalla(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="pz-resumen">
            <div>
              <b>{modelo ? modelo.nombre : "Camiseta en blanco"}</b>
              <span>{descripcionPersonalizacion(estado)}</span>
            </div>
            <strong>{modelo ? money(modelo.precioFinal * cantidad) : "—"}</strong>
          </div>
          <div className="detail-cta">
            <div className="qty-stepper">
              <button onClick={() => setCantidad((q) => Math.max(1, q - 1))}>−</button>
              <span>{cantidad}</span>
              <button onClick={() => setCantidad((q) => Math.min(10, q + 1))}>+</button>
            </div>
            <button className="btn btn-gold btn-block" disabled={!modelo || modelo.disponibilidad === "agotado"} onClick={agregar}>
              {!modelo ? "Elige un equipo para continuar" : modelo.disponibilidad === "agotado" ? "Agotada" : "Agregar al carrito"}
            </button>
          </div>
          <p className="pz-nota">El estampado de nombre, número y parches está incluido en el precio y se aplica antes del envío.</p>
        </section>
      </div>
      {previa && (
        <div className="modal-fondo" role="dialog" aria-modal="true" aria-label="Vista previa de tu camiseta" onClick={() => setPrevia(null)}>
          <div className="modal pz-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Así quedaría tu camiseta</h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada en el navegador */}
            <img src={previa} alt="Vista previa de frente y espalda" />
            <div className="pz-modal-acc">
              <a className="btn btn-outline" href={previa} download="mi-camiseta.png">Descargar imagen</a>
              <button className="btn btn-gold" disabled={!modelo || modelo.disponibilidad === "agotado"} onClick={() => { agregar(); setPrevia(null); }}>Agregar al carrito</button>
              <button className="btn btn-ghost" onClick={() => setPrevia(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

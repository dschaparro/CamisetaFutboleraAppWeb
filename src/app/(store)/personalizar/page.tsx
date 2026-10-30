"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import LoaderMarca from "@/components/store/LoaderMarca";
import { urlImagen } from "@/modules/tienda/domain/types";
import s from "@/components/store/personalizar.module.css";

const Camiseta3D = dynamic(() => import("@/components/store/Camiseta3D"), {
  ssr: false,
  loading: () => (
    <div className="c3d c3d-carga">
      <LoaderMarca variante="bloque" titulo="Cargando camiseta" detalle="Preparando el visor 3D…" />
    </div>
  ),
});

const TALLAS = ["S", "M", "L", "XL"];

const ZONAS: Record<string, string> = {
  "manga-der": "Manga derecha",
  "manga-izq": "Manga izquierda",
  "pecho-der": "Pecho derecho",
  "cuello-espalda": "Cuello (espalda)",
};

/** Personalizador: camiseta en blanco en 3D con nombre, número y parches. */
export default function PersonalizarPage() {
  const { catalogo, error } = useCatalogo();
  const { addItem, maxCantidad } = useCart();

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
  useEffect(() => {
    setCantidad((q) => Math.min(q, maxCantidad));
  }, [maxCantidad]);
  const [vista, setVista] = useState<{ lado: Lado; n: number }>({ lado: "frente", n: 0 });
  const [auto, setAuto] = useState(true);
  const [previa, setPrevia] = useState<string | null>(null);

  const clubes = useMemo(() => {
    const m = new Map<string, { club: string; ligaId: string; iniciales: string }>();
    for (const p of catalogo?.productos ?? []) {
      if (p.personalizable && !m.has(p.club)) m.set(p.club, { club: p.club, ligaId: p.ligaId, iniciales: p.iniciales });
    }
    return [...m.values()];
  }, [catalogo]);

  const modelos = useMemo(
    () => (catalogo?.productos ?? []).filter((p) => p.personalizable && p.club === club),
    [catalogo, club],
  );
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
    <div className={s.page}>
      <div className={`wrap ${s.cabezaWrap}`}>
        <header className={s.cabeza} aria-labelledby="tit-personalizar">
          <div className={s.cabezaTexto}>
            <p className={s.eyebrow}>Hecha a tu medida</p>
            <h1 id="tit-personalizar" className={s.titulo}>
              Diseña tu camiseta
            </h1>
            <p className={s.lead}>Elige equipo, nombre, número y parches. La vista 3D se actualiza al instante.</p>
          </div>
          <Link className={s.linkMas} href="/catalogo">
            Ver catálogo
          </Link>
        </header>
      </div>

      <div className={`wrap ${s.workspace}`}>
        <section className={s.visor} aria-label="Vista previa 3D">
          <Camiseta3D estado={estado} vista={vista} auto={auto} />
          <div className={s.vistas}>
            <button
              type="button"
              className={`chip${vista.lado === "frente" && !auto ? " active" : ""}`}
              onClick={() => mirar("frente")}
            >
              Frente
            </button>
            <button
              type="button"
              className={`chip${vista.lado === "espalda" && !auto ? " active" : ""}`}
              onClick={() => mirar("espalda")}
            >
              Espalda
            </button>
            <button type="button" className={`chip${auto ? " active" : ""}`} onClick={() => setAuto((a) => !a)}>
              {auto ? "Detener giro" : "Girar sola"}
            </button>
            <button type="button" className={`chip ${s.previaChip}`} onClick={verPrevia}>
              Vista previa
            </button>
          </div>
          <p className={s.ayuda}>Arrastra para girar · rueda o pellizco para acercar</p>
        </section>

        <section className={s.panel}>
          <div className={s.panelScroll}>
            {error && <p className="form-error">No se pudo cargar el catálogo. Recarga la página.</p>}

            <div className={s.paso}>
              <h2 className={s.pasoTitulo}>
                <span className={s.pasoNum}>1</span> Equipo
              </h2>
              {!catalogo && !error ? (
                <div className={s.skelEquipos} aria-busy="true" aria-label="Cargando equipos">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className={s.skelEquipo} />
                  ))}
                </div>
              ) : (
                <div className={s.equipos}>
                  <button
                    type="button"
                    className={`${s.equipo}${club === null ? ` ${s.equipoSel}` : ""}`}
                    onClick={() => elegirEquipo(null)}
                  >
                    <i style={{ background: "#F4F4F1" }} />
                    En blanco
                  </button>
                  {clubes.map((c) => {
                    const pa = paletaDeClub(c.club, catalogo?.ligas.find((l) => l.id === c.ligaId)?.colores);
                    return (
                      <button
                        key={c.club}
                        type="button"
                        className={`${s.equipo}${club === c.club ? ` ${s.equipoSel}` : ""}`}
                        onClick={() => elegirEquipo(c.club)}
                      >
                        <i
                          style={{
                            background: `linear-gradient(135deg, ${pa.base} 55%, ${pa.patron === "liso" ? pa.detalle : pa.alt} 55%)`,
                          }}
                        />
                        {c.club}
                      </button>
                    );
                  })}
                </div>
              )}
              {club && (
                <div className={s.equipaciones} role="radiogroup" aria-label="Equipación">
                  {EQUIPACIONES.map((q) => {
                    const pa = paletaDeClub(club, liga?.colores, q.id);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        role="radio"
                        aria-checked={equip === q.id}
                        className={`${s.equipo}${equip === q.id ? ` ${s.equipoSel}` : ""}`}
                        onClick={() => setEquip(q.id)}
                      >
                        <i
                          style={{
                            background: `linear-gradient(135deg, ${pa.base} 55%, ${pa.patron === "liso" ? pa.detalle : pa.alt} 55%)`,
                          }}
                        />
                        {q.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
              {club && modelos.length > 1 && (
                <div className="opt-row" style={{ marginTop: 12 }}>
                  {modelos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`opt-btn${modelo?.id === m.id ? " selected" : ""}`}
                      onClick={() => setModeloId(m.id)}
                    >
                      {m.nombre.replace("Camiseta ", "")} · {money(m.precioFinal)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={s.paso}>
              <h2 className={s.pasoTitulo}>
                <span className={s.pasoNum}>2</span> Nombre y número
              </h2>
              <div className={s.campos}>
                <div className="field">
                  <label htmlFor="pz-nombre">Nombre en la espalda</label>
                  <input
                    id="pz-nombre"
                    value={nombre}
                    maxLength={NOMBRE_MAX}
                    placeholder="TU NOMBRE"
                    onChange={(e) => setNombre(limpiarNombre(e.target.value))}
                    onFocus={() => mirar("espalda")}
                  />
                </div>
                <div className="field">
                  <label htmlFor="pz-numero">Número</label>
                  <input
                    id="pz-numero"
                    inputMode="numeric"
                    value={numero}
                    maxLength={2}
                    placeholder="10"
                    onChange={(e) => setNumero(limpiarNumero(e.target.value))}
                    onFocus={() => mirar("espalda")}
                  />
                </div>
              </div>
              <div className={s.colores} role="radiogroup" aria-label="Color del texto">
                {COLORES_TEXTO.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={colorTexto === c.id}
                    aria-label={c.nombre}
                    title={c.nombre}
                    style={{ background: c.id }}
                    onClick={() => setColorElegido(c.id)}
                  />
                ))}
                <label className={s.colorLibre} title="Elegir cualquier color">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(colorTexto) ? colorTexto : "#000000"}
                    onChange={(e) => setColorElegido(e.target.value.toUpperCase())}
                    aria-label="Elegir otro color"
                  />
                  <span>Otro color</span>
                </label>
              </div>
            </div>

            <div className={s.paso}>
              <h2 className={s.pasoTitulo}>
                <span className={s.pasoNum}>3</span> Parches
              </h2>
              <div className={s.parches}>
                {PARCHES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${s.parche}${parches.includes(p.id) ? ` ${s.parcheSel}` : ""}`}
                    aria-pressed={parches.includes(p.id)}
                    disabled={p.id === "liga" && !estado.ligaLogoUrl}
                    onClick={() => alternarParche(p.id)}
                  >
                    <b>{p.id === "liga" && liga && estado.ligaLogoUrl ? `Parche ${liga.nombre}` : p.nombre}</b>
                    <small>{p.id === "liga" && !estado.ligaLogoUrl ? "Elige un club de liga" : ZONAS[p.zona]}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.paso}>
              <h2 className={s.pasoTitulo}>
                <span className={s.pasoNum}>4</span> Manga y talla
              </h2>
              <div className="opt-row">
                {(["Corta", "Larga"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`opt-btn${manga === m ? " selected" : ""}`}
                    onClick={() => setManga(m)}
                  >
                    Manga {m.toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="opt-row" style={{ marginTop: 10 }}>
                {TALLAS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`opt-btn${talla === t ? " selected" : ""}`}
                    onClick={() => setTalla(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={s.compra}>
            <div className={s.resumen}>
              <div>
                <b>{modelo ? modelo.nombre : "Camiseta en blanco"}</b>
                <span>{descripcionPersonalizacion(estado)}</span>
              </div>
              <strong>{modelo ? money(modelo.precioFinal * cantidad) : "—"}</strong>
            </div>
            <div className="detail-cta">
              <div className="qty-stepper">
                <button type="button" onClick={() => setCantidad((q) => Math.max(1, q - 1))} aria-label="Menos">
                  −
                </button>
                <span aria-live="polite">{cantidad}</span>
                <button
                  type="button"
                  className={cantidad >= maxCantidad ? s.qtyMax : undefined}
                  onClick={() => setCantidad((q) => Math.min(maxCantidad, q + 1))}
                  disabled={cantidad >= maxCantidad}
                  aria-label={cantidad >= maxCantidad ? `Máximo ${maxCantidad} unidades` : "Más"}
                >
                  {cantidad >= maxCantidad ? "max" : "+"}
                </button>
              </div>
              <button
                type="button"
                className="btn btn-gold btn-block"
                disabled={!modelo || modelo.disponibilidad === "agotado"}
                onClick={agregar}
              >
                {!modelo
                  ? "Elige un equipo para continuar"
                  : modelo.disponibilidad === "agotado"
                    ? "Agotada"
                    : "Agregar al carrito"}
              </button>
            </div>
            <p className={s.nota}>Nombre, número y parches incluidos en el precio.</p>
          </div>
        </section>
      </div>

      {previa && (
        <div
          className="modal-fondo"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de tu camiseta"
          onClick={() => setPrevia(null)}
        >
          <div className={`modal ${s.modal}`} onClick={(e) => e.stopPropagation()}>
            <h2>Así quedaría tu camiseta</h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen generada en el navegador */}
            <img src={previa} alt="Vista previa de frente y espalda" />
            <div className={s.modalAcc}>
              <a className="btn btn-outline" href={previa} download="mi-camiseta.png">
                Descargar imagen
              </a>
              <button
                type="button"
                className="btn btn-gold"
                disabled={!modelo || modelo.disponibilidad === "agotado"}
                onClick={() => {
                  agregar();
                  setPrevia(null);
                }}
              >
                Agregar al carrito
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setPrevia(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

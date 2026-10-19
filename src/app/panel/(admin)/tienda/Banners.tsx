"use client";

import { useState } from "react";
import { esUrlExterna, POSICIONES, urlImagen, type Banner } from "@/modules/tienda/domain/types";
import { aLocal, api, Cajon, Campo, Check, deLocal, estadoVigencia, fechaCorta, useEdicion } from "./comun";
import s from "./tienda.module.css";

const ENLACES = [
  ["/catalogo", "Catálogo"],
  ["/catalogo/todas?ofertas=1", "Ofertas"],
  ["/catalogo/laliga", "LaLiga"],
  ["/catalogo/betplay", "Liga BetPlay"],
] as const;

/** Vista previa con la misma lógica del carrusel: foto, encuadre, oscurecido y alineación. */
function Previa({ f }: { f: Record<string, unknown> }) {
  const img = String(f.imagen ?? "");
  const centro = f.alineacion === "centro";
  const oscuro = Number(f.oscurecer ?? 55) / 100;
  return (
    <div className={`${s.previa} ${s.ancho}`} style={{ background: `linear-gradient(135deg, ${String(f.color1)}, ${String(f.color2)})`, textAlign: centro ? "center" : "left", justifyItems: centro ? "center" : "start" }}>
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlImagen(img)} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: String(f.posicion ?? "center") }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: centro ? `rgba(5,10,17,${oscuro})` : `linear-gradient(90deg, rgba(5,10,17,${oscuro}) 0%, rgba(5,10,17,${oscuro * 0.5}) 45%, rgba(5,10,17,0) 80%)` }} />
      <div style={{ position: "relative", display: "grid", gap: 6, justifyItems: centro ? "center" : "start" }}>
        {f.antetitulo ? <span style={{ color: String(f.acento) }}>{String(f.antetitulo)}</span> : null}
        <h3>{String(f.titulo) || "Título del banner"}</h3>
        {f.texto ? <p>{String(f.texto)}</p> : null}
        <b style={{ background: String(f.acento) }}>{String(f.boton) || "Botón"} →</b>
      </div>
    </div>
  );
}
function ImagenBanner({ banner, onCambio, onMensaje, onImagen }: { banner: Banner; onCambio: () => void; onMensaje: (ok: boolean, t: string) => void; onImagen: (ref: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setSubiendo(true);
    const fd = new FormData();
    fd.set("archivo", archivo);
    fd.set("destino", "banner");
    fd.set("id", banner.id);
    const r = await api<{ imagenId?: string }>("/api/admin/tienda/imagenes", "POST", fd);
    setSubiendo(false);
    if (r.ok && r.datos.imagenId) onImagen(r.datos.imagenId);
    onMensaje(r.ok, r.ok ? "Imagen del banner actualizada." : (r.campos.archivo ?? r.mensaje));
    onCambio();
  }
  return (
    <div className={`${s.imagenes} ${s.ancho}`}>
      <span className={s.etiqueta}>O sube una foto desde tu equipo</span>
      {banner.imagen && !esUrlExterna(banner.imagen) && (
        <div className={s.imagen}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlImagen(banner.imagen)} alt="Fondo del banner" />
          <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={async () => { await api("/api/admin/tienda/imagenes", "PATCH", { banner: banner.id }); onImagen(""); onCambio(); }}>
            Quitar
          </button>
        </div>
      )}
      <label className={s.subir}>
        {subiendo ? "Subiendo…" : "🖼 Subir imagen (JPG, PNG o WEBP, máx. 2 MB; ideal 1920×720)"}
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={subiendo} onChange={(e) => subir(e.target.files?.[0])} />
      </label>
    </div>
  );
}

export default function Banners({ banners, recargar, mensaje }: { banners: Banner[]; recargar: () => void; mensaje: (ok: boolean, t: string) => void }) {
  const ed = useEdicion("banners", (m) => {
    mensaje(true, m);
    recargar();
  });
  const [borrar, setBorrar] = useState<string | null>(null);
  const f = ed.form;
  const ordenados = [...banners].sort((a, b) => a.orden - b.orden);
  const editando = ed.editando?.id ? banners.find((b) => b.id === ed.editando!.id) : null;

  async function eliminar(id: string) {
    const r = await api(`/api/admin/tienda/banners/${encodeURIComponent(id)}`, "DELETE");
    mensaje(r.ok, r.ok ? "Banner eliminado." : r.mensaje);
    setBorrar(null);
    recargar();
  }

  function nuevo() {
    ed.abrir(null, {
      antetitulo: "",
      titulo: "",
      texto: "",
      boton: "Ver más",
      enlace: "/catalogo",
      color1: "#0A1626",
      color2: "#1B3A66",
      acento: "#E3BE45",
      insignia: "",
      imagen: "",
      posicion: "center",
      oscurecer: "55",
      alineacion: "izquierda",
      orden: String(banners.length + 1),
      desde: aLocal(new Date().toISOString()),
      hasta: aLocal(new Date(Date.now() + 30 * 864e5).toISOString()),
      activo: true,
    });
  }

  return (
    <>
      <div className={s.barra}>
        <p className={s.hint} style={{ flex: 1 }}>
          Banners del carrusel del Inicio. Rotan en el orden indicado y solo se muestran dentro de sus fechas.
        </p>
        <button className="btn btn-gold btn-sm" onClick={nuevo}>
          + Nuevo banner
        </button>
      </div>
      <div className={`card ${s.tablaWrap}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Banner</th>
              <th>Enlace</th>
              <th>Orden</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordenados.map((b) => {
              const est = estadoVigencia(b.desde, b.hasta, b.activo);
              return (
                <tr key={b.id}>
                  <td>
                    <div className={s.celdaProducto}>
                      <div className={s.muestra} style={{ minWidth: 60, background: `linear-gradient(135deg, ${b.colores[0]}, ${b.colores[1]})` }} />
                      <div>
                        <b>{b.titulo}</b>
                        <small>{b.antetitulo}</small>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{b.enlace}</td>
                  <td>{b.orden}</td>
                  <td>
                    {fechaCorta(b.desde)} → {fechaCorta(b.hasta)}
                  </td>
                  <td>
                    <span className={`pill ${est.clase}`}>{est.texto}</span>
                  </td>
                  <td>
                    <div className={s.acciones}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => ed.abrir(b.id, { ...b, imagen: b.imagen ?? "", oscurecer: String(b.oscurecer), color1: b.colores[0], color2: b.colores[1], orden: String(b.orden), desde: aLocal(b.desde), hasta: aLocal(b.hasta) })}
                      >
                        Editar
                      </button>
                      {borrar === b.id ? (
                        <>
                          <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => eliminar(b.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(b.id)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {ed.editando && (
        <Cajon
          titulo={ed.editando.id ? "Editar banner" : "Nuevo banner"}
          onCerrar={ed.cerrar}
          onGuardar={() => ed.guardar((v) => ({ ...v, desde: deLocal(String(v.desde)), hasta: deLocal(String(v.hasta)) }))}
          guardando={ed.guardando}
          error={ed.error}
          extra={editando ? <ImagenBanner banner={editando} onCambio={recargar} onMensaje={mensaje} onImagen={(ref) => ed.set("imagen")(ref)} /> : <p className={s.hint}>También puedes subir una foto propia después de crear el banner.</p>}
        >
          <Previa f={f} />
          <Campo label="Imagen de fondo (URL de internet, Full HD)" error={ed.campos.imagen} hint="Pega una URL https de una foto horizontal (ideal 1920×720 o más). Se adapta sola al espacio." ancho>
            <input value={esUrlExterna(String(f.imagen ?? "")) ? String(f.imagen) : f.imagen ? "(foto subida)" : ""} placeholder="https://…/foto.jpg" onChange={(e) => ed.set("imagen")(e.target.value)} />
          </Campo>
          <Campo label="Encuadre de la foto" hint="Qué parte de la foto se prioriza al recortar">
            <select value={String(f.posicion)} onChange={(e) => ed.set("posicion")(e.target.value)}>
              {POSICIONES.map((p) => (
                <option key={p} value={p}>
                  {{ center: "Centro", top: "Arriba", bottom: "Abajo", left: "Izquierda", right: "Derecha" }[p]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Texto alineado" hint="Izquierda (estilo Disney+) o centrado">
            <select value={String(f.alineacion)} onChange={(e) => ed.set("alineacion")(e.target.value)}>
              <option value="izquierda">A la izquierda</option>
              <option value="centro">Centrado</option>
            </select>
          </Campo>
          <Campo label={`Oscurecer la foto: ${String(f.oscurecer)} %`} error={ed.campos.oscurecer} hint="Más alto = el texto se lee mejor" ancho>
            <input type="range" min={0} max={90} step={5} value={String(f.oscurecer)} onChange={(e) => ed.set("oscurecer")(e.target.value)} />
          </Campo>
          <Campo label="Antetítulo (opcional)" error={ed.campos.antetitulo} ancho>
            <input value={String(f.antetitulo)} placeholder="Temporada 2027 · Nueva colección" onChange={(e) => ed.set("antetitulo")(e.target.value)} />
          </Campo>
          <Campo label="Título" error={ed.campos.titulo} ancho>
            <input value={String(f.titulo)} onChange={(e) => ed.set("titulo")(e.target.value)} />
          </Campo>
          <Campo label="Texto (opcional)" error={ed.campos.texto} ancho>
            <textarea rows={2} value={String(f.texto)} onChange={(e) => ed.set("texto")(e.target.value)} />
          </Campo>
          <Campo label="Texto del botón" error={ed.campos.boton}>
            <input value={String(f.boton)} onChange={(e) => ed.set("boton")(e.target.value)} />
          </Campo>
          <Campo label="Enlace del botón" error={ed.campos.enlace} hint={`Ej. ${ENLACES.map(([e]) => e).join(" · ")} · /producto/RM-27T`}>
            <input value={String(f.enlace)} onChange={(e) => ed.set("enlace")(e.target.value)} />
          </Campo>
          <Campo label="Colores de fondo y acento" error={ed.campos.color1 ?? ed.campos.color2 ?? ed.campos.acento} ancho>
            <div className={s.colores}>
              <input type="color" value={String(f.color1)} onChange={(e) => ed.set("color1")(e.target.value)} aria-label="Color inicial" />
              <input type="color" value={String(f.color2)} onChange={(e) => ed.set("color2")(e.target.value)} aria-label="Color final" />
              <input type="color" value={String(f.acento)} onChange={(e) => ed.set("acento")(e.target.value)} aria-label="Color de acento" />
              <span className={s.hint}>inicio · fin · botón</span>
            </div>
          </Campo>
          <Campo label="Insignia (opcional)" error={ed.campos.insignia} hint="Hasta 4 letras, se ve a la derecha si no hay imagen">
            <input value={String(f.insignia)} maxLength={4} onChange={(e) => ed.set("insignia")(e.target.value.toUpperCase())} />
          </Campo>
          <Campo label="Orden" error={ed.campos.orden}>
            <input inputMode="numeric" value={String(f.orden)} onChange={(e) => ed.set("orden")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Desde" error={ed.campos.desde}>
            <input type="datetime-local" value={String(f.desde)} onChange={(e) => ed.set("desde")(e.target.value)} />
          </Campo>
          <Campo label="Hasta" error={ed.campos.hasta}>
            <input type="datetime-local" value={String(f.hasta)} onChange={(e) => ed.set("hasta")(e.target.value)} />
          </Campo>
          <div className={s.checks}>
            <Check label="Activo" checked={!!f.activo} onChange={ed.set("activo")} />
          </div>
        </Cajon>
      )}
    </>
  );
}

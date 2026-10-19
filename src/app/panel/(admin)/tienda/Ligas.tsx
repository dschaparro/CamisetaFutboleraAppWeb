"use client";

import { useState } from "react";
import { urlImagen, type Liga, type Producto } from "@/modules/tienda/domain/types";
import { api, Cajon, Campo, Check, useEdicion } from "./comun";
import s from "./tienda.module.css";

export default function Ligas({ ligas, productos, recargar, mensaje }: { ligas: Liga[]; productos: Producto[]; recargar: () => void; mensaje: (ok: boolean, t: string) => void }) {
  const ed = useEdicion("ligas", (m) => {
    mensaje(true, m);
    recargar();
  });
  const [borrar, setBorrar] = useState<string | null>(null);
  const f = ed.form;
  const ordenadas = [...ligas].sort((a, b) => a.orden - b.orden);

  async function eliminar(id: string) {
    const r = await api(`/api/admin/tienda/ligas/${encodeURIComponent(id)}`, "DELETE");
    mensaje(r.ok, r.ok ? "Liga eliminada." : (r.campos.liga ?? r.mensaje));
    setBorrar(null);
    recargar();
  }

  return (
    <>
      <div className={s.barra}>
        <p className={s.hint} style={{ flex: 1 }}>
          Las ligas forman las tarjetas grandes del Catálogo y los accesos del Inicio. El orden define cuál sale primero.
        </p>
        <button className="btn btn-gold btn-sm" onClick={() => ed.abrir(null, { id: "", nombre: "", pais: "", descripcion: "", color1: "#13294B", color2: "#0A1626", imagen: "", posicion: "center", orden: String(ligas.length + 1), visible: true })}>
          + Nueva liga
        </button>
      </div>
      <div className={`card ${s.tablaWrap}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Liga</th>
              <th>Tarjeta</th>
              <th>Productos</th>
              <th>Orden</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((l) => {
              const n = productos.filter((p) => p.ligaId === l.id).length;
              return (
                <tr key={l.id} className={l.visible ? "" : s.oculto}>
                  <td>
                    <b>{l.nombre}</b>
                    <small>
                      {l.pais} · {l.descripcion}
                    </small>
                  </td>
                  <td>
                    <div className={s.muestra} style={{ backgroundImage: `linear-gradient(135deg, ${l.colores[0]}cc, ${l.colores[1]}cc)${l.imagen ? `, url("${urlImagen(l.imagen)}")` : ""}`, backgroundSize: "cover", backgroundPosition: l.posicion }} />
                  </td>
                  <td>{n}</td>
                  <td>{l.orden}</td>
                  <td>
                    <span className={`pill ${l.visible ? "pill-ok" : "pill-mute"}`}>{l.visible ? "Visible" : "Oculta"}</span>
                  </td>
                  <td>
                    <div className={s.acciones}>
                      <button className="btn btn-outline btn-sm" onClick={() => ed.abrir(l.id, { ...l, imagen: l.imagen ?? "", color1: l.colores[0], color2: l.colores[1], orden: String(l.orden) })}>
                        Editar
                      </button>
                      {borrar === l.id ? (
                        <>
                          <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => eliminar(l.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(l.id)} title={n > 0 ? "Primero mueve sus productos a otra liga" : undefined}>
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
        <Cajon titulo={ed.editando.id ? `Editar ${String(f.nombre)}` : "Nueva liga"} onCerrar={ed.cerrar} onGuardar={() => ed.guardar()} guardando={ed.guardando} error={ed.error}>
          <Campo label="Código" error={ed.campos.id} hint={ed.editando.id ? "No se puede cambiar" : "Ej. serie-a (va en la URL)"}>
            <input value={String(f.id)} disabled={!!ed.editando.id} onChange={(e) => ed.set("id")(e.target.value.toLowerCase())} />
          </Campo>
          <Campo label="Nombre" error={ed.campos.nombre}>
            <input value={String(f.nombre)} placeholder="Serie A" onChange={(e) => ed.set("nombre")(e.target.value)} />
          </Campo>
          <Campo label="País" error={ed.campos.pais}>
            <input value={String(f.pais)} onChange={(e) => ed.set("pais")(e.target.value)} />
          </Campo>
          <Campo label="Orden" error={ed.campos.orden}>
            <input inputMode="numeric" value={String(f.orden)} onChange={(e) => ed.set("orden")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Texto corto" error={ed.campos.descripcion} ancho>
            <input value={String(f.descripcion)} placeholder="Juventus, Milan, Inter y más" onChange={(e) => ed.set("descripcion")(e.target.value)} />
          </Campo>
          <Campo label="Colores de la tarjeta" error={ed.campos.color1 ?? ed.campos.color2} ancho>
            <div className={s.colores}>
              <input type="color" value={String(f.color1)} onChange={(e) => ed.set("color1")(e.target.value)} aria-label="Color inicial" />
              <input type="color" value={String(f.color2)} onChange={(e) => ed.set("color2")(e.target.value)} aria-label="Color final" />
              <div className={s.muestra} style={{ flex: 1, minHeight: 70, backgroundImage: `linear-gradient(150deg, ${String(f.color1)}d9, ${String(f.color2)}b3)${f.imagen ? `, url("${urlImagen(String(f.imagen))}")` : ""}`, backgroundSize: "cover", backgroundPosition: String(f.posicion ?? "center"), color: "#fff", display: "grid", placeItems: "center", fontWeight: 800 }}>
                {String(f.nombre) || "Vista previa"}
              </div>
            </div>
          </Campo>
          <Campo label="Foto de fondo (URL de internet)" error={ed.campos.imagen} hint="Ej. el estadio de la liga; se mezcla con los colores" ancho>
            <input value={String(f.imagen ?? "")} placeholder="https://…/estadio.jpg" onChange={(e) => ed.set("imagen")(e.target.value)} />
          </Campo>
          <Campo label="Encuadre de la foto">
            <select value={String(f.posicion ?? "center")} onChange={(e) => ed.set("posicion")(e.target.value)}>
              <option value="center">Centro</option>
              <option value="top">Arriba</option>
              <option value="bottom">Abajo</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
            </select>
          </Campo>
          <div className={s.checks}>
            <Check label="Visible en la tienda" checked={!!f.visible} onChange={ed.set("visible")} />
          </div>
        </Cajon>
      )}
    </>
  );
}

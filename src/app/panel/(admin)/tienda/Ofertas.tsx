"use client";

import { useState } from "react";
import type { Liga, Producto, Promocion } from "@/modules/tienda/domain/types";
import { aLocal, api, Cajon, Campo, Check, deLocal, estadoVigencia, fechaCorta, useEdicion } from "./comun";
import s from "./tienda.module.css";

export default function Ofertas({
  promociones,
  productos,
  ligas,
  recargar,
  mensaje,
}: {
  promociones: Promocion[];
  productos: Producto[];
  ligas: Liga[];
  recargar: () => void;
  mensaje: (ok: boolean, t: string) => void;
}) {
  const ed = useEdicion("promociones", (m) => {
    mensaje(true, m);
    recargar();
  });
  const [borrar, setBorrar] = useState<string | null>(null);
  const f = ed.form;
  const seleccion = (f.productoIds as string[] | undefined) ?? [];

  function aQuien(p: Promocion): string {
    if (p.alcance === "todo") return "Toda la tienda";
    if (p.alcance === "liga") return `Liga: ${ligas.find((l) => l.id === p.ligaId)?.nombre ?? "—"}`;
    const nombres = p.productoIds.map((id) => productos.find((x) => x.id === id)?.club ?? id);
    return nombres.length > 2 ? `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más` : nombres.join(", ");
  }

  async function eliminar(id: string) {
    const r = await api(`/api/admin/tienda/promociones/${encodeURIComponent(id)}`, "DELETE");
    mensaje(r.ok, r.ok ? "Oferta eliminada." : r.mensaje);
    setBorrar(null);
    recargar();
  }

  const hoy = new Date();
  const enUnMes = new Date(hoy.getTime() + 30 * 864e5);

  return (
    <>
      <div className={s.barra}>
        <p className={s.hint} style={{ flex: 1 }}>
          Descuentos por porcentaje con fecha. Si a un producto le aplican varias, la tienda usa la de mayor descuento. Se ven con precio tachado en la tienda y se cobran en el pedido.
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => ed.abrir(null, { etiqueta: "", porcentaje: "10", alcance: "productos", productoIds: [], ligaId: ligas[0]?.id ?? "", desde: aLocal(hoy.toISOString()), hasta: aLocal(enUnMes.toISOString()), activa: true })}
        >
          + Nueva oferta
        </button>
      </div>
      <div className={`card ${s.tablaWrap}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Oferta</th>
              <th>Descuento</th>
              <th>Aplica a</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {promociones.length === 0 && (
              <tr>
                <td colSpan={6} className={s.vacio}>
                  No hay ofertas. Crea la primera.
                </td>
              </tr>
            )}
            {promociones.map((p) => {
              const est = estadoVigencia(p.desde, p.hasta, p.activa);
              return (
                <tr key={p.id}>
                  <td>
                    <b>{p.etiqueta}</b>
                  </td>
                  <td>
                    <span className="pill pill-danger">−{p.porcentaje}%</span>
                  </td>
                  <td>{aQuien(p)}</td>
                  <td>
                    {fechaCorta(p.desde)} → {fechaCorta(p.hasta)}
                  </td>
                  <td>
                    <span className={`pill ${est.clase}`}>{est.texto}</span>
                  </td>
                  <td>
                    <div className={s.acciones}>
                      <button className="btn btn-outline btn-sm" onClick={() => ed.abrir(p.id, { ...p, porcentaje: String(p.porcentaje), ligaId: p.ligaId ?? ligas[0]?.id ?? "", desde: aLocal(p.desde), hasta: aLocal(p.hasta) })}>
                        Editar
                      </button>
                      {borrar === p.id ? (
                        <>
                          <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => eliminar(p.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(p.id)}>
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
          titulo={ed.editando.id ? "Editar oferta" : "Nueva oferta"}
          onCerrar={ed.cerrar}
          onGuardar={() => ed.guardar((v) => ({ ...v, desde: deLocal(String(v.desde)), hasta: deLocal(String(v.hasta)) }))}
          guardando={ed.guardando}
          error={ed.error}
        >
          <Campo label="Nombre de la oferta" error={ed.campos.etiqueta} hint="Se muestra al cliente, ej. «Retro week»">
            <input value={String(f.etiqueta)} onChange={(e) => ed.set("etiqueta")(e.target.value)} />
          </Campo>
          <Campo label="Descuento (%)" error={ed.campos.porcentaje}>
            <input inputMode="numeric" value={String(f.porcentaje)} onChange={(e) => ed.set("porcentaje")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Aplica a" error={ed.campos.alcance} ancho>
            <select value={String(f.alcance)} onChange={(e) => ed.set("alcance")(e.target.value)}>
              <option value="productos">Productos específicos</option>
              <option value="liga">Toda una liga</option>
              <option value="todo">Toda la tienda</option>
            </select>
          </Campo>
          {f.alcance === "liga" && (
            <Campo label="Liga" error={ed.campos.ligaId} ancho>
              <select value={String(f.ligaId)} onChange={(e) => ed.set("ligaId")(e.target.value)}>
                {ligas.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </Campo>
          )}
          {f.alcance === "productos" && (
            <Campo label={`Productos (${seleccion.length})`} error={ed.campos.productoIds} ancho>
              <div className={s.listaProductos}>
                {productos.map((p) => (
                  <Check
                    key={p.id}
                    label={`${p.nombre}${p.visible ? "" : " (oculto)"}`}
                    checked={seleccion.includes(p.id)}
                    onChange={(v) => ed.set("productoIds")(v ? [...seleccion, p.id] : seleccion.filter((x) => x !== p.id))}
                  />
                ))}
              </div>
            </Campo>
          )}
          <Campo label="Desde" error={ed.campos.desde}>
            <input type="datetime-local" value={String(f.desde)} onChange={(e) => ed.set("desde")(e.target.value)} />
          </Campo>
          <Campo label="Hasta" error={ed.campos.hasta}>
            <input type="datetime-local" value={String(f.hasta)} onChange={(e) => ed.set("hasta")(e.target.value)} />
          </Campo>
          <div className={s.checks}>
            <Check label="Activa (desmárcala para pausarla)" checked={!!f.activa} onChange={ed.set("activa")} />
          </div>
        </Cajon>
      )}
    </>
  );
}

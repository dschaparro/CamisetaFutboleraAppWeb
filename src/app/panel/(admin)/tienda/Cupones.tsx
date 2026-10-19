"use client";

import { useState } from "react";
import { money } from "@/lib/money";
import type { Cupon } from "@/modules/tienda/domain/types";
import { aLocal, api, Cajon, Campo, Check, deLocal, estadoVigencia, fechaCorta, useEdicion } from "./comun";
import s from "./tienda.module.css";

export default function Cupones({ cupones, recargar, mensaje }: { cupones: Cupon[]; recargar: () => void; mensaje: (ok: boolean, t: string) => void }) {
  const ed = useEdicion("cupones", (m) => {
    mensaje(true, m);
    recargar();
  });
  const [borrar, setBorrar] = useState<string | null>(null);
  const f = ed.form;

  async function eliminar(id: string) {
    const r = await api(`/api/admin/tienda/cupones/${encodeURIComponent(id)}`, "DELETE");
    mensaje(r.ok, r.ok ? "Cupón eliminado." : r.mensaje);
    setBorrar(null);
    recargar();
  }

  return (
    <>
      <div className={s.barra}>
        <p className={s.hint} style={{ flex: 1 }}>
          Códigos que el cliente escribe en el pago. Se aplican sobre el subtotal (después de las ofertas) y el servidor revisa vigencia, compra mínima y usos.
        </p>
        <button
          className="btn btn-gold btn-sm"
          onClick={() => ed.abrir(null, { codigo: "", tipo: "porcentaje", valor: "10", minimoCompra: "0", hasta: aLocal(new Date(Date.now() + 30 * 864e5).toISOString()), usosMaximos: "", activo: true })}
        >
          + Nuevo cupón
        </button>
      </div>
      <div className={`card ${s.tablaWrap}`}>
        <table className={s.tabla}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Compra mínima</th>
              <th>Usos</th>
              <th>Vence</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cupones.length === 0 && (
              <tr>
                <td colSpan={7} className={s.vacio}>
                  No hay cupones.
                </td>
              </tr>
            )}
            {cupones.map((c) => {
              const agotado = c.usosMaximos !== null && c.usos >= c.usosMaximos;
              const est = agotado ? { texto: "Sin usos", clase: "pill-mute" } : estadoVigencia("1970-01-01", c.hasta, c.activo);
              return (
                <tr key={c.id}>
                  <td className="mono">
                    <b>{c.codigo}</b>
                  </td>
                  <td>{c.tipo === "porcentaje" ? `${c.valor}%` : money(c.valor)}</td>
                  <td>{c.minimoCompra ? money(c.minimoCompra) : "—"}</td>
                  <td>
                    {c.usos}
                    {c.usosMaximos !== null ? ` / ${c.usosMaximos}` : " (sin límite)"}
                  </td>
                  <td>{fechaCorta(c.hasta)}</td>
                  <td>
                    <span className={`pill ${est.clase}`}>{est.texto}</span>
                  </td>
                  <td>
                    <div className={s.acciones}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => ed.abrir(c.id, { ...c, valor: String(c.valor), minimoCompra: String(c.minimoCompra), usosMaximos: c.usosMaximos === null ? "" : String(c.usosMaximos), hasta: aLocal(c.hasta) })}
                      >
                        Editar
                      </button>
                      {borrar === c.id ? (
                        <>
                          <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} onClick={() => eliminar(c.id)}>
                            Sí, eliminar
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                            No
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(c.id)}>
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
        <Cajon titulo={ed.editando.id ? `Editar ${String(f.codigo)}` : "Nuevo cupón"} onCerrar={ed.cerrar} onGuardar={() => ed.guardar((v) => ({ ...v, hasta: deLocal(String(v.hasta)) }))} guardando={ed.guardando} error={ed.error}>
          <Campo label="Código" error={ed.campos.codigo} hint="Letras y números, ej. MUNDIAL10">
            <input value={String(f.codigo)} onChange={(e) => ed.set("codigo")(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} />
          </Campo>
          <Campo label="Tipo" error={ed.campos.tipo}>
            <select value={String(f.tipo)} onChange={(e) => ed.set("tipo")(e.target.value)}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="valor">Valor fijo (COP)</option>
            </select>
          </Campo>
          <Campo label={f.tipo === "porcentaje" ? "Descuento (%)" : "Descuento (COP)"} error={ed.campos.valor}>
            <input inputMode="numeric" value={String(f.valor)} onChange={(e) => ed.set("valor")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Compra mínima (COP)" error={ed.campos.minimoCompra} hint="0 = sin mínimo">
            <input inputMode="numeric" value={String(f.minimoCompra)} onChange={(e) => ed.set("minimoCompra")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo label="Válido hasta" error={ed.campos.hasta}>
            <input type="datetime-local" value={String(f.hasta)} onChange={(e) => ed.set("hasta")(e.target.value)} />
          </Campo>
          <Campo label="Usos máximos" error={ed.campos.usosMaximos} hint="Vacío = sin límite">
            <input inputMode="numeric" value={String(f.usosMaximos)} onChange={(e) => ed.set("usosMaximos")(e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <div className={s.checks}>
            <Check label="Activo" checked={!!f.activo} onChange={ed.set("activo")} />
          </div>
        </Cajon>
      )}
    </>
  );
}

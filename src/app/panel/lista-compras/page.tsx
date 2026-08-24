"use client";

import { useState } from "react";
import { SHOPPING_LIST, ShoppingListStatus } from "@/data/shoppingList";

const STATUS_PILL: Record<ShoppingListStatus, string> = {
  Pendiente: "pill-warn",
  Conseguido: "pill-ok",
  "No conseguido": "pill-danger",
};

export default function ListaComprasPage() {
  const [items, setItems] = useState(SHOPPING_LIST);

  function setStatus(idx: number, status: ShoppingListStatus) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, status } : it)));
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Lista de compras</h1>
          <p>Productos sin stock, generados automáticamente por ventas web y manuales (RF-14c–RF-14f)</p>
        </div>
      </div>
      <div className="sl-tabs">
        <div className="chip active">Todos ({items.length})</div>
        <div className="chip">Pendientes ({items.filter((i) => i.status === "Pendiente").length})</div>
        <div className="chip">Conseguidos ({items.filter((i) => i.status === "Conseguido").length})</div>
        <div className="chip">No conseguidos ({items.filter((i) => i.status === "No conseguido").length})</div>
      </div>
      <div className="toolbar">
        <div className="search">🔎 <input placeholder="Buscar por club, talla o venta..." /></div>
      </div>
      <div className="card overflow-x">
        <table>
          <thead>
            <tr><th>Producto</th><th>Talla / temporada</th><th>Personalización</th><th>Origen</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td><b>{i.product}</b></td>
                <td>{i.variant}</td>
                <td>{i.custom}</td>
                <td className="mono" style={{ fontSize: ".78rem" }}>{i.origin}</td>
                <td>
                  <span className={`pill ${STATUS_PILL[i.status]}`}>{i.status}</span>
                  {i.note && <div style={{ fontSize: ".7rem", color: "var(--ink-mute)", marginTop: 3 }}>{i.note}</div>}
                </td>
                <td className="row-actions">
                  {i.status === "Pendiente" ? (
                    <>
                      <button className="btn btn-gold btn-sm" onClick={() => setStatus(idx, "Conseguido")}>Conseguido</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setStatus(idx, "No conseguido")}>No conseguido</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm">Ver compra</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

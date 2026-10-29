"use client";

import { useEffect, useMemo, useState } from "react";
import { IconoBuscar } from "@/components/icons/pago";

type Estado = "Pendiente" | "Conseguido" | "No conseguido";
type Item = { id: number; producto: string; variante: string; personalizacion: string; cantidad: number; origen: string; estado: Estado; nota: string | null };
type Filtro = "Todos" | Estado;

const PILL: Record<Estado, string> = { Pendiente: "pill-warn", Conseguido: "pill-ok", "No conseguido": "pill-danger" };
const FILTROS: Filtro[] = ["Todos", "Pendiente", "Conseguido", "No conseguido"];
const ROTULO: Record<Filtro, string> = { Todos: "Todos", Pendiente: "Pendientes", Conseguido: "Conseguidos", "No conseguido": "No conseguidos" };

export default function ListaComprasPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [ocupado, setOcupado] = useState<number | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/lista-compras")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message ?? "No se pudo cargar la lista");
        if (vivo) setItems(j.items as Item[]);
      })
      .catch((e: unknown) => {
        if (vivo) setError(e instanceof Error ? e.message : "No se pudo cargar la lista");
      });
    return () => {
      vivo = false;
    };
  }, []);

  async function cambiar(id: number, estado: Estado, nota?: string) {
    setOcupado(id);
    try {
      const r = await fetch(`/api/lista-compras/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ estado, nota }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message ?? "No se pudo actualizar");
      setItems((prev) => prev?.map((i) => (i.id === id ? (j.item as Item) : i)) ?? prev);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    } finally {
      setOcupado(null);
    }
  }

  const cuenta = (f: Filtro) => (items ?? []).filter((i) => f === "Todos" || i.estado === f).length;
  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (items ?? []).filter(
      (i) => (filtro === "Todos" || i.estado === filtro) && (!q || `${i.producto} ${i.variante} ${i.personalizacion} ${i.origen}`.toLowerCase().includes(q)),
    );
  }, [items, filtro, busqueda]);

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Lista de compras</h1>
          <p>Productos vendidos sin stock, generados automáticamente por las ventas web y manuales</p>
        </div>
      </div>
      {error && <div className="form-error" style={{ marginTop: 0, marginBottom: 14 }}>{error}</div>}
      <div className="sl-tabs">
        {FILTROS.map((f) => (
          <button key={f} className={`chip${filtro === f ? " active" : ""}`} onClick={() => setFiltro(f)} aria-pressed={filtro === f}>
            {ROTULO[f]} ({items ? cuenta(f) : "…"})
          </button>
        ))}
      </div>
      <div className="toolbar">
        <div className="search"><IconoBuscar size={16} /><input placeholder="Buscar por club, talla o venta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar en la lista de compras" /></div>
      </div>
      <div className="card overflow-x">
        <table>
          <thead>
            <tr><th>Producto</th><th>Talla / manga</th><th>Personalización</th><th>Cant.</th><th>Origen</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {!items && !error && <tr><td colSpan={7} className="panel-vacio">Cargando…</td></tr>}
            {items && visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="panel-vacio">
                  <b>{items.length === 0 ? "Lista vacía" : "Sin resultados"}</b>
                  <span>
                    {items.length === 0
                      ? "No hay nada por conseguir: ninguna venta se ha quedado sin stock."
                      : "Nada con ese filtro. Prueba otro estado o búsqueda."}
                  </span>
                </td>
              </tr>
            )}
            {visibles.map((i) => (
              <tr key={i.id}>
                <td><b>{i.producto}</b></td>
                <td>{i.variante || "—"}</td>
                <td>{i.personalizacion || "—"}</td>
                <td className="tabular">{i.cantidad}</td>
                <td className="mono" style={{ fontSize: ".78rem" }}>{i.origen}</td>
                <td>
                  <span className={`pill ${PILL[i.estado]}`}>{i.estado}</span>
                  {i.nota && <div style={{ fontSize: ".7rem", color: "var(--ink-mute)", marginTop: 3 }}>{i.nota}</div>}
                </td>
                <td className="row-actions">
                  {i.estado === "Pendiente" ? (
                    <>
                      <button className="btn btn-gold btn-sm" disabled={ocupado === i.id} onClick={() => cambiar(i.id, "Conseguido", "Marcado como conseguido")}>Conseguido</button>
                      <button className="btn btn-outline btn-sm" disabled={ocupado === i.id} onClick={() => cambiar(i.id, "No conseguido")}>No conseguido</button>
                    </>
                  ) : (
                    <button className="btn btn-ghost btn-sm" disabled={ocupado === i.id} onClick={() => cambiar(i.id, "Pendiente")}>Volver a pendiente</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: ".75rem", color: "var(--ink-mute)", marginTop: 12 }}>
        Si compras el producto, regístralo en Inventario y compras → «Registrar compra» y elige este ítem: queda «Conseguido» con el número de compra.
      </p>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconoBuscar } from "@/components/icons/pago";
import { money } from "@/lib/money";

type Fila = { id: string; nombre: string; sku: string; proveedor: string; costo: number | null; precio: number; margenPct: number | null; stock: number };
type Resumen = { unidades: number; pendientesPorConseguir: number; proveedores: number; costoPromedio: number | null };
type Datos = { productos: Fila[]; resumen: Resumen; proveedores: string[] };
type ItemLista = { id: number; productoId: string | null; producto: string; variante: string; cantidad: number; origen: string; estado: string };
type Errores = Record<string, string>;

const STOCK_BAJO = 5;

async function llamar(url: string, metodo: string, cuerpo?: unknown): Promise<{ ok: boolean; datos: Record<string, unknown>; campos: Errores; mensaje: string }> {
  try {
    const r = await fetch(url, { method: metodo, headers: { "content-type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    const j = (await r.json().catch(() => ({}))) as { error?: { message?: string; campos?: Errores } } & Record<string, unknown>;
    return { ok: r.ok, datos: j, campos: j.error?.campos ?? {}, mensaje: j.error?.message ?? (r.ok ? "" : "No se pudo completar la acción") };
  } catch {
    return { ok: false, datos: {}, campos: {}, mensaje: "Sin conexión con el servidor" };
  }
}

export default function InventarioCliente() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [soloBajo, setSoloBajo] = useState(false);
  const [editando, setEditando] = useState<Fila | null>(null);
  const [comprando, setComprando] = useState(false);
  const [aviso, setAviso] = useState("");

  const cargar = useCallback(async () => {
    const r = await llamar("/api/inventario", "GET");
    if (r.ok) setDatos(r.datos as unknown as Datos);
    else setError(r.mensaje);
  }, []);
  useEffect(() => {
    let vivo = true;
    void llamar("/api/inventario", "GET").then((r) => {
      if (!vivo) return;
      if (r.ok) setDatos(r.datos as unknown as Datos);
      else setError(r.mensaje);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (datos?.productos ?? []).filter(
      (p) => (!q || p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && (!proveedor || p.proveedor === proveedor) && (!soloBajo || p.stock <= STOCK_BAJO),
    );
  }, [datos, busqueda, proveedor, soloBajo]);

  const r = datos?.resumen;
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Inventario y compras</h1><p>Visible solo para el equipo: los costos nunca se muestran al cliente</p></div>
        <button className="btn btn-gold" onClick={() => setComprando(true)} disabled={!datos}>+ Registrar compra</button>
      </div>

      {aviso && <div className="form-ok">{aviso}</div>}
      {error && <div className="form-error">{error}</div>}

      <div className="stat-strip">
        <div className="stat-chip"><b className="tabular">{r ? r.unidades : "…"}</b><span>Unidades en stock</span></div>
        <div className="stat-chip"><b className="tabular">{r ? r.pendientesPorConseguir : "…"}</b><span>Pendientes por conseguir</span></div>
        <div className="stat-chip"><b className="tabular">{r ? r.proveedores : "…"}</b><span>Proveedores</span></div>
        <div className="stat-chip"><b className="tabular">{r ? (r.costoPromedio === null ? "—" : money(r.costoPromedio)) : "…"}</b><span>Costo promedio por unidad</span></div>
      </div>

      <div className="toolbar">
        <div className="search"><IconoBuscar size={16} /><input placeholder="Buscar producto o SKU..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar producto o SKU" /></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select className="chip" value={proveedor} onChange={(e) => setProveedor(e.target.value)} aria-label="Filtrar por proveedor">
            <option value="">Todos los proveedores</option>
            {datos?.proveedores.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className={`chip${soloBajo ? " active" : ""}`} onClick={() => setSoloBajo((v) => !v)} aria-pressed={soloBajo}>Stock bajo</button>
        </div>
      </div>

      <div className="card overflow-x">
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>SKU</th><th>Proveedor principal</th><th>Costo unitario</th>
              <th>Precio venta</th><th>Margen</th><th>Stock</th><th></th>
            </tr>
          </thead>
          <tbody>
            {!datos && !error && <tr><td colSpan={8} className="panel-vacio">Cargando inventario…</td></tr>}
            {datos && filas.length === 0 && (
              <tr>
                <td colSpan={8} className="panel-vacio">
                  <b>Sin resultados</b>
                  <span>No hay productos con esos filtros. Prueba otra búsqueda o limpia el filtro.</span>
                </td>
              </tr>
            )}
            {filas.map((i) => (
              <tr key={i.id}>
                <td><b>{i.nombre}</b></td>
                <td className="mono">{i.sku}</td>
                <td>{i.proveedor || <span style={{ color: "var(--ink-mute)" }}>Sin proveedor</span>}</td>
                <td className="tabular">{i.costo === null ? <span className="pill pill-warn">Pendiente</span> : money(i.costo)}</td>
                <td className="tabular">{money(i.precio)}</td>
                <td>{i.margenPct === null ? <span style={{ color: "var(--ink-mute)" }}>—</span> : <span className="pill pill-ok">{i.margenPct}%</span>}</td>
                <td>
                  {i.stock === 0 ? <span className="pill pill-warn">Bajo pedido</span> : i.stock <= STOCK_BAJO ? <span className="pill pill-danger">{i.stock} · Stock bajo</span> : <span className="tabular">{i.stock}</span>}
                </td>
                <td><button className="btn btn-outline btn-sm" onClick={() => setEditando(i)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <EditarProducto
          fila={editando}
          onCerrar={() => setEditando(null)}
          onGuardado={async () => {
            setEditando(null);
            setAviso("Producto actualizado.");
            await cargar();
          }}
        />
      )}
      {comprando && datos && (
        <RegistrarCompra
          productos={datos.productos}
          proveedores={datos.proveedores}
          onCerrar={() => setComprando(false)}
          onGuardada={async (texto) => {
            setComprando(false);
            setAviso(texto);
            await cargar();
          }}
        />
      )}
    </>
  );
}

function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{etiqueta}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function EditarProducto({ fila, onCerrar, onGuardado }: { fila: Fila; onCerrar: () => void; onGuardado: () => void | Promise<void> }) {
  const [costo, setCosto] = useState(fila.costo === null ? "" : String(fila.costo));
  const [stock, setStock] = useState(String(fila.stock));
  const [prov, setProv] = useState(fila.proveedor);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await llamar(`/api/inventario/${encodeURIComponent(fila.id)}`, "PATCH", { costo: costo.trim() === "" ? null : costo, stock, proveedor: prov });
    setEnviando(false);
    if (r.ok) await onGuardado();
    else {
      setErrores(r.campos);
      setMensaje(r.mensaje);
    }
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label={`Editar ${fila.nombre}`} onClick={onCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>Editar producto</h2>
        <p className="modal-sub">{fila.nombre} · <span className="mono">{fila.sku}</span></p>
        <div className="form-grid">
          <Campo etiqueta="Costo unitario (COP)" error={errores.costo}><input inputMode="numeric" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Pendiente" /></Campo>
          <Campo etiqueta="Stock" error={errores.stock}><input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></Campo>
          <div style={{ gridColumn: "1/-1" }}><Campo etiqueta="Proveedor principal" error={errores.proveedor}><input value={prov} onChange={(e) => setProv(e.target.value)} maxLength={60} /></Campo></div>
        </div>
        <p className="modal-sub" style={{ marginTop: 10 }}>Para sumar unidades que compraste, usa «Registrar compra»: así queda el historial y el costo.</p>
        {mensaje && <div className="form-error">{mensaje}</div>}
        <div className="modal-acciones">
          <button type="button" className="btn btn-outline" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-gold" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}

function RegistrarCompra({ productos, proveedores, onCerrar, onGuardada }: { productos: Fila[]; proveedores: string[]; onCerrar: () => void; onGuardada: (texto: string) => void | Promise<void> }) {
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [costo, setCosto] = useState("");
  const [prov, setProv] = useState("");
  const [nota, setNota] = useState("");
  const [listaId, setListaId] = useState("");
  const [pendientes, setPendientes] = useState<ItemLista[]>([]);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void llamar("/api/lista-compras", "GET").then((r) => {
      if (r.ok) setPendientes((r.datos.items as ItemLista[]).filter((i) => i.estado === "Pendiente"));
    });
  }, []);

  function elegir(id: string) {
    setProductoId(id);
    setListaId("");
    const p = productos.find((x) => x.id === id);
    if (p) {
      setCosto(p.costo === null ? "" : String(p.costo));
      setProv(p.proveedor);
    }
  }

  const delProducto = pendientes.filter((i) => i.productoId === productoId);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await llamar("/api/inventario/compras", "POST", { productoId, cantidad, costoUnitario: costo, proveedor: prov, nota, listaId: listaId || null });
    setEnviando(false);
    if (r.ok) {
      const c = r.datos.compra as { id: number; cantidad: number; producto: string; stockResultante: number };
      await onGuardada(`Compra #${c.id} registrada: ${c.cantidad} × ${c.producto}. Stock actual: ${c.stockResultante}.`);
    } else {
      setErrores(r.campos);
      setMensaje(r.mensaje);
    }
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label="Registrar compra" onClick={onCerrar}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
        <h2>Registrar compra</h2>
        <p className="modal-sub">Suma las unidades al stock y deja este costo y proveedor como los vigentes del producto.</p>
        <div className="form-grid">
          <div style={{ gridColumn: "1/-1" }}>
            <Campo etiqueta="Producto" error={errores.productoId}>
              <select value={productoId} onChange={(e) => elegir(e.target.value)}>
                <option value="">Elige un producto…</option>
                {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Campo>
          </div>
          <Campo etiqueta="Cantidad" error={errores.cantidad}><input inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} /></Campo>
          <Campo etiqueta="Costo por unidad (COP)" error={errores.costoUnitario}><input inputMode="numeric" value={costo} onChange={(e) => setCosto(e.target.value)} /></Campo>
          <div style={{ gridColumn: "1/-1" }}>
            <Campo etiqueta="Proveedor" error={errores.proveedor}>
              <input list="lista-proveedores" value={prov} onChange={(e) => setProv(e.target.value)} maxLength={60} />
              <datalist id="lista-proveedores">{proveedores.map((p) => <option key={p} value={p} />)}</datalist>
            </Campo>
          </div>
          {delProducto.length > 0 && (
            <div style={{ gridColumn: "1/-1" }}>
              <Campo etiqueta="Resuelve un ítem de la lista de compras" error={errores.listaId}>
                <select value={listaId} onChange={(e) => setListaId(e.target.value)}>
                  <option value="">Ninguno (solo reponer stock)</option>
                  {delProducto.map((i) => <option key={i.id} value={i.id}>{i.variante} × {i.cantidad} · {i.origen}</option>)}
                </select>
              </Campo>
            </div>
          )}
          <div style={{ gridColumn: "1/-1" }}><Campo etiqueta="Nota (opcional)"><input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} /></Campo></div>
        </div>
        {mensaje && <div className="form-error">{mensaje}</div>}
        <div className="modal-acciones">
          <button type="button" className="btn btn-outline" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-gold" disabled={enviando}>{enviando ? "Guardando…" : "Registrar compra"}</button>
        </div>
      </form>
    </div>
  );
}

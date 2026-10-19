"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/money";

const CANALES = ["WhatsApp", "Redes sociales", "Punto físico"] as const;
const MODOS = [
  { id: "anticipado", etiqueta: "Pago anticipado" },
  { id: "abono", etiqueta: "Abono 50%" },
  { id: "contraentrega", etiqueta: "Contra entrega" },
] as const;
const TALLAS = ["S", "M", "L", "XL"];
const MANGAS = ["Corta", "Larga"];
const ENVIO = 18000;
const MAX_LINEAS = 10;

type Producto = { id: string; nombre: string; precio: number; personalizable: boolean; disponibilidad: "disponible" | "pocas" | "agotado" };
type Linea = { slug: string; talla: string; manga: string; personalizacion: string; cantidad: string };
type Errores = Record<string, string>;
const lineaNueva = (slug = ""): Linea => ({ slug, talla: "M", manga: "Corta", personalizacion: "", cantidad: "1" });

export default function VentaManualPage() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [cargaError, setCargaError] = useState("");
  const [canal, setCanal] = useState<(typeof CANALES)[number]>("WhatsApp");
  const [modo, setModo] = useState<(typeof MODOS)[number]["id"]>("anticipado");
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", documento: "", email: "", ciudad: "", direccion: "" });
  const [lineas, setLineas] = useState<Linea[]>([lineaNueva()]);
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState<{ id: string; enLista: number } | null>(null);

  useEffect(() => {
    fetch("/api/venta-manual")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message ?? "No se pudo cargar el catálogo");
        setProductos(j.productos as Producto[]);
      })
      .catch((e: unknown) => setCargaError(e instanceof Error ? e.message : "No se pudo cargar el catálogo"));
  }, []);

  const enPunto = canal === "Punto físico";
  const envio = enPunto ? 0 : ENVIO;
  const detalle = lineas.map((l) => {
    const p = productos?.find((x) => x.id === l.slug);
    const n = Number(l.cantidad);
    return { l, p, subtotal: p && Number.isInteger(n) && n > 0 ? p.precio * n : 0 };
  });
  const subtotal = detalle.reduce((s, d) => s + d.subtotal, 0);
  const total = subtotal + envio;
  const sinStock = detalle.filter((d) => d.p?.disponibilidad === "agotado");

  const campoCliente = (k: keyof typeof cliente) => (e: React.ChangeEvent<HTMLInputElement>) => setCliente((c) => ({ ...c, [k]: e.target.value }));
  const cambiarLinea = (i: number, cambios: Partial<Linea>) => setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambios } : l)));

  function reiniciar() {
    setCliente({ nombre: "", telefono: "", documento: "", email: "", ciudad: "", direccion: "" });
    setLineas([lineaNueva()]);
    setErrores({});
    setMensaje("");
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setMensaje("");
    setHecho(null);
    try {
      const r = await fetch("/api/venta-manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          canal,
          modoPago: modo,
          ...cliente,
          items: lineas.map((l) => ({ slug: l.slug, talla: l.talla, manga: l.manga, personalizacion: l.personalizacion, cantidad: Number(l.cantidad) })),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErrores((j?.error?.campos ?? {}) as Errores);
        setMensaje(j?.error?.message ?? "No se pudo registrar la venta");
        return;
      }
      setErrores({});
      reiniciar();
      setHecho({ id: j.pedido.id as string, enLista: j.enListaDeCompras as number });
    } catch {
      setMensaje("Sin conexión con el servidor");
    } finally {
      setEnviando(false);
    }
  }

  const err = (k: string) => (errores[k] ? <span className="field-error">{errores[k]}</span> : null);

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Registrar venta manual</h1><p>Ventas por redes sociales, WhatsApp o punto físico</p></div>
      </div>
      {hecho && (
        <div className="form-ok">
          Venta registrada: pedido <b>#{hecho.id}</b> (en alistamiento).{" "}
          {hecho.enLista > 0 && <>Se agregaron {hecho.enLista} ítem(s) a la Lista de compras por falta de stock. </>}
          <Link href="/panel/pedidos" style={{ textDecoration: "underline" }}>Ver pedidos</Link>
        </div>
      )}
      {cargaError && <div className="form-error" style={{ marginTop: 0, marginBottom: 14 }}>{cargaError}</div>}
      <form className="two-col" onSubmit={registrar} noValidate>
        <div>
          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Canal de la venta</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>¿Por dónde se hizo la venta?</p>
            <div className="channel-grid">
              {CANALES.map((c) => (
                <button type="button" key={c} className={`channel-btn${canal === c ? " selected" : ""}`} onClick={() => setCanal(c)} aria-pressed={canal === c}>{c}</button>
              ))}
            </div>
            {err("canal")}
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Datos del cliente</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>Igual que en el checkout web, sin necesidad de cuenta.</p>
            <div className="form-grid">
              <div className="field"><label htmlFor="vm-nombre">Nombre completo</label><input id="vm-nombre" value={cliente.nombre} onChange={campoCliente("nombre")} />{err("nombre")}</div>
              <div className="field"><label htmlFor="vm-tel">Celular</label><input id="vm-tel" inputMode="tel" value={cliente.telefono} onChange={campoCliente("telefono")} />{err("telefono")}</div>
              <div className="field"><label htmlFor="vm-doc">Cédula (opcional)</label><input id="vm-doc" inputMode="numeric" value={cliente.documento} onChange={campoCliente("documento")} />{err("documento")}</div>
              <div className="field"><label htmlFor="vm-mail">Correo (opcional)</label><input id="vm-mail" type="email" value={cliente.email} onChange={campoCliente("email")} />{err("email")}</div>
              <div className="field"><label htmlFor="vm-ciudad">Ciudad{enPunto ? " (opcional)" : ""}</label><input id="vm-ciudad" value={cliente.ciudad} onChange={campoCliente("ciudad")} />{err("ciudad")}</div>
              <div className="field"><label htmlFor="vm-dir">Dirección de envío{enPunto ? " (no aplica)" : ""}</label><input id="vm-dir" value={cliente.direccion} onChange={campoCliente("direccion")} disabled={enPunto} />{err("direccion")}</div>
            </div>
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Productos</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>Selecciona el producto, su talla y la personalización, si aplica.</p>
            {err("items")}
            {lineas.map((l, i) => {
              const p = productos?.find((x) => x.id === l.slug);
              return (
                <div key={i} style={{ borderTop: i ? "1px solid var(--border-soft)" : undefined, paddingTop: i ? 14 : 0, marginTop: i ? 14 : 0 }}>
                  <div className="form-grid">
                    <div className="field" style={{ gridColumn: "1/-1" }}>
                      <label htmlFor={`vm-prod-${i}`}>Producto {lineas.length > 1 ? i + 1 : ""}</label>
                      <select id={`vm-prod-${i}`} value={l.slug} onChange={(e) => cambiarLinea(i, { slug: e.target.value })}>
                        <option value="">Elige un producto…</option>
                        {productos?.map((x) => (
                          <option key={x.id} value={x.id}>{x.nombre} — {money(x.precio)}{x.disponibilidad === "agotado" ? " (sin stock)" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field"><label htmlFor={`vm-talla-${i}`}>Talla</label><select id={`vm-talla-${i}`} value={l.talla} onChange={(e) => cambiarLinea(i, { talla: e.target.value })}>{TALLAS.map((t) => <option key={t}>{t}</option>)}</select></div>
                    <div className="field"><label htmlFor={`vm-manga-${i}`}>Manga</label><select id={`vm-manga-${i}`} value={l.manga} onChange={(e) => cambiarLinea(i, { manga: e.target.value })}>{MANGAS.map((m) => <option key={m}>{m}</option>)}</select></div>
                    <div className="field"><label htmlFor={`vm-pers-${i}`}>Personalización (nombre + número)</label><input id={`vm-pers-${i}`} value={l.personalizacion} onChange={(e) => cambiarLinea(i, { personalizacion: e.target.value })} disabled={p ? !p.personalizable : false} placeholder={p && !p.personalizable ? "No personalizable" : "MARTÍNEZ 7"} /></div>
                    <div className="field"><label htmlFor={`vm-cant-${i}`}>Cantidad</label><input id={`vm-cant-${i}`} inputMode="numeric" value={l.cantidad} onChange={(e) => cambiarLinea(i, { cantidad: e.target.value })} /></div>
                  </div>
                  {lineas.length > 1 && <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}>Quitar este producto</button>}
                </div>
              );
            })}
            {lineas.length < MAX_LINEAS && <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setLineas((ls) => [...ls, lineaNueva()])}>+ Agregar otro producto</button>}
            {sinStock.length > 0 && (
              <div className="stock-warn">
                {sinStock.map((d) => d.p?.nombre).join(", ")}: sin stock ahora mismo. Al guardar, se agrega automáticamente a la Lista de Compras para conseguirlo con el proveedor.
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Pago</legend>
            <div className="channel-grid">
              {MODOS.map((m) => (
                <button type="button" key={m.id} className={`channel-btn${modo === m.id ? " selected" : ""}`} onClick={() => setModo(m.id)} aria-pressed={modo === m.id}>{m.etiqueta}</button>
              ))}
            </div>
            {err("modoPago")}
          </fieldset>

          {mensaje && <div className="form-error" style={{ marginBottom: 12 }}>{mensaje}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-gold" disabled={enviando || !productos}>{enviando ? "Registrando…" : "Registrar venta"}</button>
            <button type="button" className="btn btn-outline" onClick={reiniciar}>Limpiar</button>
          </div>
        </div>

        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 14 }}>Resumen de la venta</h3>
          {detalle.every((d) => !d.p) && <p style={{ fontSize: ".82rem", color: "var(--ink-mute)" }}>Elige un producto para ver el total.</p>}
          {detalle.filter((d) => d.p).map((d, i) => (
            <div className="summary-row" key={i}><span>{d.p!.nombre} · {d.l.talla} × {d.l.cantidad || 0}</span><span className="tabular">{money(d.subtotal)}</span></div>
          ))}
          <div className="summary-row"><span>Envío {enPunto ? "(recoge en el punto)" : "estimado"}</span><span className="tabular">{money(envio)}</span></div>
          <div className="summary-row total"><span>Total</span><span className="tabular">{money(total)}</span></div>
          {modo === "abono" && <div className="summary-row"><span>Abono del 50%</span><span className="tabular">{money(Math.round(total / 2))}</span></div>}
        </div>
      </form>
    </>
  );
}

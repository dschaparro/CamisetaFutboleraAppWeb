"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { money } from "@/lib/money";
import { PASOS_PEDIDO, type Pedido } from "@/modules/pedidos/domain/types";

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function ConfirmationPage({ searchParams }: { searchParams: Promise<{ pedido?: string; k?: string }> }) {
  const { pedido: id = "", k = "" } = use(searchParams);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conCuenta, setConCuenta] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tienda/pedidos/${encodeURIComponent(id)}?k=${encodeURIComponent(k)}`)
      .then(async (r) => {
        const d = (await r.json()) as { pedido?: Pedido; error?: { message?: string } };
        if (!r.ok || !d.pedido) throw new Error(d.error?.message ?? "No encontramos ese pedido");
        setPedido(d.pedido);
        setConCuenta(d.pedido.clienteId !== null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id, k]);

  if (!id || error) {
    return (
      <div className="wrap cart-page">
        <div className="cart-vacio">
          <h2>{error ?? "No hay un pedido para mostrar"}</h2>
          <p>Si tienes cuenta, revisa tus pedidos en «Mis pedidos».</p>
          <div className="cart-vacio-acciones">
            <Link className="btn btn-gold" href="/cuenta">
              Mis pedidos
            </Link>
            <Link className="btn btn-outline" href="/catalogo">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (!pedido) {
    return (
      <div className="wrap" style={{ padding: "60px 0", textAlign: "center" }}>
        <span className="spinner" style={{ display: "inline-block" }} /> Cargando tu pedido…
      </div>
    );
  }

  const pendiente = pedido.estado === "Pendiente de pago";
  const fechaDe = (e: string) => pedido.historial.filter((h) => h.estado === e).at(-1)?.fecha;
  const indiceActual = PASOS_PEDIDO.indexOf(pedido.estado);

  return (
    <div className="wrap">
      <div className="confirm-hero">
        <div className="check" style={pendiente ? { background: "var(--warn-bg)", color: "var(--warn)" } : undefined}>
          {pendiente ? "!" : "✓"}
        </div>
        <h1>{pendiente ? "Tu pedido está pendiente de pago" : `¡Gracias por tu compra, ${pedido.contacto.nombre.split(" ")[0]}!`}</h1>
        <p>
          {pendiente
            ? "Reservamos tu pedido, pero el pago aún no se aprobó."
            : `Te avisaremos por correo (${pedido.contacto.email}) y WhatsApp cuando salga.`}
          <br />
          Pedido N.° <span className="order-code">{pedido.id}</span>
        </p>
        {pendiente && (
          <Link className="btn btn-gold" style={{ marginTop: 14 }} href={`/pago/${encodeURIComponent(pedido.id)}?k=${encodeURIComponent(k)}`}>
            Pagar ahora
          </Link>
        )}
      </div>

      {pedido.estado !== "Cancelado" && (
        <div className="timeline">
          {PASOS_PEDIDO.map((paso, i) => {
            const f = fechaDe(paso);
            const clase = i < indiceActual || pedido.estado === "Entregado" ? "done" : i === indiceActual ? "current" : "";
            return (
              <div key={paso} className={`tl-step ${clase}`}>
                <div className="tl-dot">{clase === "done" ? "✓" : clase === "current" ? "●" : i + 1}</div>
                <b>{paso === "Pendiente de pago" ? "Pedido recibido" : paso}</b>
                <span>{f ? fecha(f) : paso === "Entregado" ? "1-2 días hábiles" : "—"}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="confirm-grid">
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".95rem", marginBottom: 14 }}>Productos</h3>
          {pedido.items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border-soft)", fontSize: ".85rem" }}>
              <span>
                {it.nombre} · {it.talla} · {it.personalizacion} ×{it.cantidad}
              </span>
              <span className="tabular">{money(it.precioUnitario * it.cantidad)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span className="tabular">{money(pedido.subtotal)}</span></div>
          <div className="summary-row"><span>Envío</span><span className="tabular">{money(pedido.envio)}</span></div>
          <div className="summary-row total"><span>Total</span><span className="tabular">{money(pedido.total)}</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 12 }}>Envío</h3>
            <div className="info-grid">
              <div><div className="k">Destinatario</div><div className="v">{pedido.contacto.nombre}</div></div>
              <div><div className="k">Ciudad</div><div className="v">{pedido.ciudad}</div></div>
              <div style={{ gridColumn: "1/-1" }}><div className="k">Dirección</div><div className="v">{pedido.direccion}</div></div>
              <div><div className="k">Entrega estimada</div><div className="v">1-2 días hábiles</div></div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 12 }}>Pago</h3>
            <div className="info-grid">
              <div><div className="k">Método</div><div className="v">{pedido.medioPago}</div></div>
              <div>
                <div className="k">Estado</div>
                <div className="v">
                  <span className={`pill ${pedido.estadoPago === "Pagado" ? "pill-ok" : "pill-warn"}`}>{pedido.estadoPago}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 18, textAlign: "center", background: "var(--surface-2)" }}>
            {conCuenta ? (
              <>
                <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>Sigue el estado de tu pedido cuando quieras.</p>
                <Link className="btn btn-navy btn-sm" style={{ marginTop: 8 }} href="/cuenta">Ir a Mis pedidos</Link>
              </>
            ) : (
              <>
                <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>¿Necesitas ayuda con tu pedido?</p>
                <a className="btn btn-navy btn-sm" style={{ marginTop: 8 }} href={`https://wa.me/573223176175?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido ${pedido.id}`)}`} target="_blank" rel="noopener noreferrer">
                  Escríbenos por WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

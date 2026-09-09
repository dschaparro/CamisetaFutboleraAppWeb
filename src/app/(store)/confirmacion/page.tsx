"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { money } from "@/lib/money";

type StoredOrder = {
  id: string;
  name: string;
  city: string;
  address: string;
  payMethod: string;
  subtotal: number;
  total: number;
  items: { club: string; name?: string; size: string; qty: number; custom: string }[];
};

const DEFAULT_ORDER: StoredOrder = {
  id: "CF-2027-00842",
  name: "Laura",
  city: "Bogotá",
  address: "Cra 45 # 12-30, Apto 301",
  payMethod: "Tarjeta (Wompi)",
  subtotal: 510000,
  total: 510000,
  items: [
    { club: "Real Madrid", name: "Camiseta Titular 2027", size: "M", qty: 1, custom: '"GUTIÉRREZ" #10' },
    { club: "Millonarios", name: "Camiseta Titular 2026", size: "L", qty: 2, custom: "Sin personalización" },
    { club: "Selección Colombia", name: "Camiseta Local 2027", size: "S", qty: 1, custom: '"JAMES" #10' },
  ],
};

export default function ConfirmationPage() {
  const [order, setOrder] = useState<StoredOrder>(DEFAULT_ORDER);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("cf_last_order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw));
      } catch {
        return;
      }
    }
  }, []);

  const firstName = order.name.split(" ")[0] || "Cliente";

  return (
    <div className="wrap">
      <div className="confirm-hero">
        <div className="check">✓</div>
        <h1>¡Gracias por tu compra, {firstName}!</h1>
        <p>
          Te enviamos la confirmación y la factura a tu correo y WhatsApp.
          <br />
          Pedido N.° <span className="order-code">{order.id}</span>
        </p>
      </div>

      <div className="timeline">
        <div className="tl-step done"><div className="tl-dot">✓</div><b>Pedido confirmado</b><span>15 ago</span></div>
        <div className="tl-step current"><div className="tl-dot">●</div><b>En alistamiento</b><span>Hoy</span></div>
        <div className="tl-step"><div className="tl-dot">3</div><b>Enviado</b><span>Est. 17 ago</span></div>
        <div className="tl-step"><div className="tl-dot">4</div><b>Entregado</b><span>Est. 18 ago</span></div>
      </div>
      <p style={{ textAlign: "center", fontSize: ".8rem", color: "var(--ink-mute)" }}>
        • Tu proveedor está alistando la personalización
      </p>

      <div className="confirm-grid">
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".95rem", marginBottom: 14 }}>
            Productos
          </h3>
          {order.items.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-soft)", fontSize: ".85rem" }}>
              <span>{i.club} {i.name ? i.name.replace(`Camiseta ${i.club} `, "") : ""} · {i.size}</span>
              <span className="tabular">×{i.qty}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 12 }}>
              Datos de envío
            </h3>
            <div className="info-grid">
              <div><div className="k">Destinatario</div><div className="v">{order.name}</div></div>
              <div><div className="k">Ciudad</div><div className="v">{order.city}</div></div>
              <div style={{ gridColumn: "1/-1" }}><div className="k">Dirección</div><div className="v">{order.address}</div></div>
              <div><div className="k">Mensajería</div><div className="v">Interrapidísimo</div></div>
              <div><div className="k">Entrega estimada</div><div className="v">1-2 días hábiles</div></div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 12 }}>
              Pago
            </h3>
            <div className="info-grid">
              <div><div className="k">Método</div><div className="v">{order.payMethod}</div></div>
              <div><div className="k">Estado</div><div className="v"><span className="pill pill-ok">Aprobado</span></div></div>
              <div><div className="k">Subtotal</div><div className="v tabular">{money(order.subtotal)}</div></div>
              <div><div className="k">Total pagado</div><div className="v tabular">{money(order.total)}</div></div>
            </div>
            <button className="btn btn-outline btn-block" style={{ marginTop: 14 }}>Descargar factura/remisión (PDF)</button>
          </div>
          <div className="card" style={{ padding: 18, textAlign: "center", background: "var(--surface-2)" }}>
            <p style={{ fontSize: ".82rem", color: "var(--ink-soft)" }}>¿Necesitas ayuda con tu pedido?</p>
            <Link className="btn btn-navy btn-sm" style={{ marginTop: 8 }} href="/terminos">Escríbenos por WhatsApp</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

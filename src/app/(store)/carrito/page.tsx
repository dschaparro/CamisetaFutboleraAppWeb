"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal } = useCart();

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 26 }}>
        <h2>Tu carrito de compras</h2>
      </div>
      <p className="section-note">
        {items.length === 0
          ? "Tu carrito está vacío por ahora — explora el catálogo y agrega tu primera camiseta."
          : `${items.reduce((s, i) => s + i.qty, 0)} producto(s) — revisa la personalización antes de continuar al pago.`}
      </p>
      <div className="cart-layout">
        <div>
          <div>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="thumb">{item.initials}</div>
                <div>
                  <div className="name">{item.club} — {item.name.replace(`Camiseta ${item.club} `, "")}</div>
                  <div className="opts">Talla {item.size} · Manga {item.sleeve} · {item.custom}</div>
                  <button className="remove" onClick={() => removeItem(item.id)}>Eliminar</button>
                </div>
                <div className="qty-stepper" style={{ alignSelf: "center" }}>
                  <button onClick={() => updateQty(item.id, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div className="price tabular" style={{ alignSelf: "center" }}>{money(item.price * item.qty)}</div>
              </div>
            ))}
          </div>
          <Link className="btn btn-ghost" href="/" style={{ marginTop: 14, paddingLeft: 0 }}>
            ← Seguir comprando
          </Link>
        </div>
        <div className="card summary-box" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".95rem", marginBottom: 10 }}>
            Resumen del pedido
          </h3>
          <div className="summary-row"><span>Subtotal</span><span className="tabular">{money(subtotal)}</span></div>
          <div className="summary-row"><span>Envío</span><span>Se calcula en el checkout</span></div>
          <div className="promo-row">
            <input placeholder="Código de descuento" />
            <button className="btn btn-outline btn-sm">Aplicar</button>
          </div>
          <div className="summary-row total"><span>Total estimado</span><span className="tabular">{money(subtotal)}</span></div>
          <Link className="btn btn-gold btn-block" href="/checkout" style={{ marginTop: 14 }}>
            Continuar al pago
          </Link>
          <p style={{ fontSize: ".76rem", color: "var(--ink-mute)", marginTop: 12 }}>
            ¿Prefieres abonar? En el siguiente paso puedes pagar un abono y el resto contra entrega,
            según el producto.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const vacio = items.length === 0;
  const unidades = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="wrap cart-page">
      <header className="page-head">
        <p className="eyebrow">Pedido</p>
        <h1>Tu carrito</h1>
        {!vacio && (
          <p className="section-note">
            {unidades} {unidades === 1 ? "producto" : "productos"} — revisa talla y personalización antes de pagar.
          </p>
        )}
      </header>

      {vacio ? (
        <div className="cart-vacio">
          <div className="cart-vacio-ico" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M6 6l-1-3H2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" />
              <circle cx="18" cy="20" r="1.4" fill="currentColor" />
            </svg>
          </div>
          <h2>Aún no hay camisetas</h2>
          <p>Explora el catálogo por liga o busca tu equipo. Cuando agregues algo, el resumen aparece aquí.</p>
          <div className="cart-vacio-acciones">
            <Link className="btn btn-gold" href="/catalogo">
              Ir al catálogo
            </Link>
            <Link className="btn btn-outline" href="/catalogo/todas?ofertas=1">
              Ver ofertas
            </Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="thumb">{item.initials}</div>
                <div>
                  <div className="name">
                    {item.club} — {item.name.replace(`Camiseta ${item.club} `, "")}
                  </div>
                  <div className="opts">
                    Talla {item.size} · Manga {item.sleeve} · {item.custom}
                  </div>
                  <button type="button" className="remove" onClick={() => removeItem(item.id)}>
                    Eliminar
                  </button>
                </div>
                <div className="qty-stepper">
                  <button type="button" onClick={() => updateQty(item.id, -1)} aria-label="Quitar uno">
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateQty(item.id, 1)} aria-label="Agregar uno">
                    +
                  </button>
                </div>
                <div className="price tabular">{money(item.price * item.qty)}</div>
              </div>
            ))}
            <Link className="btn btn-ghost cart-seguir" href="/catalogo">
              ← Seguir comprando
            </Link>
          </div>

          <aside className="card summary-box cart-resumen">
            <h2>Resumen</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span className="tabular">{money(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span>Se calcula en el checkout</span>
            </div>
            <div className="promo-row">
              <input placeholder="Código de descuento" aria-label="Código de descuento" />
              <button type="button" className="btn btn-outline btn-sm">
                Aplicar
              </button>
            </div>
            <div className="summary-row total">
              <span>Total estimado</span>
              <span className="tabular">{money(subtotal)}</span>
            </div>
            <Link className="btn btn-gold btn-block" href="/checkout">
              Continuar al pago
            </Link>
            <p className="cart-nota">Puedes abonar una parte y pagar el resto contra entrega en el siguiente paso.</p>
          </aside>
        </div>
      )}
    </div>
  );
}

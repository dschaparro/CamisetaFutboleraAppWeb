"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";

const SHIPPING = 18000;

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [name, setName] = useState("Laura Ramírez");
  const [city, setCity] = useState("Bogotá");
  const [address, setAddress] = useState("Cra 45 # 12-30, Apto 301");
  const [pay, setPay] = useState<"pasarela" | "contraentrega" | "abono">("pasarela");

  const ship = items.length ? SHIPPING : 0;
  const total = (subtotal || 510000) + ship;

  const payLabels: Record<typeof pay, string> = {
    pasarela: "Tarjeta / PSE (Wompi)",
    contraentrega: "Contra entrega",
    abono: "Abono + saldo contra entrega",
  };

  function confirmOrder() {
    const order = {
      id: "CF-2027-00" + (840 + Math.floor(Math.random() * 50)),
      name,
      city,
      address,
      payMethod: payLabels[pay],
      subtotal: subtotal || 510000,
      total,
      items: items.length
        ? items
        : [{ club: "Real Madrid", name: "Camiseta Titular 2027", size: "M", qty: 1, custom: '"GUTIÉRREZ" #10' }],
    };
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("cf_last_order", JSON.stringify(order));
    }
    clear();
    router.push("/confirmacion");
  }

  return (
    <div className="wrap">
      <div className="checkout-steps" style={{ marginTop: 26 }}>
        <div className="step active"><span className="num">1</span> Carrito</div>
        <div className="sep" />
        <div className="step active"><span className="num">2</span> Datos y pago</div>
        <div className="sep" />
        <div className="step"><span className="num">3</span> Confirmación</div>
      </div>
      <div className="checkout-layout">
        <div>
          <div className="guest-banner">
            <div>
              <b>¿Cómo quieres continuar?</b>
              <span>No es necesario registrarte para comprar. Si creas una cuenta podrás ver el historial de tus pedidos.</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-navy btn-sm">Continuar como invitado</button>
              <button className="btn btn-outline btn-sm">Iniciar sesión</button>
            </div>
          </div>

          <fieldset>
            <legend>Datos de contacto y envío</legend>
            <div className="form-grid">
              <div className="field"><label>Nombre completo</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label>Celular / WhatsApp</label><input defaultValue="300 123 4567" /></div>
              <div className="field"><label>Cédula</label><input defaultValue="1.032.xxx.xxx" /></div>
              <div className="field"><label>Correo electrónico</label><input defaultValue="laura@email.com" /></div>
              <div className="field" style={{ gridColumn: "1/-1" }}><label>Dirección de envío</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
              <div className="field"><label>Ciudad</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Método de pago</legend>
            <label className={`pay-option${pay === "pasarela" ? " selected" : ""}`} onClick={() => setPay("pasarela")}>
              <div className="head"><input type="radio" checked={pay === "pasarela"} readOnly /> Pago en línea — tarjeta o PSE</div>
              <p>Paga ahora de forma segura con la pasarela Wompi. Recibes confirmación inmediata. VISA · Mastercard · PSE · Nequi</p>
            </label>
            <label className={`pay-option${pay === "contraentrega" ? " selected" : ""}`} onClick={() => setPay("contraentrega")}>
              <div className="head"><input type="radio" checked={pay === "contraentrega"} readOnly /> Pago contra entrega</div>
              <p>Pagas en efectivo o transferencia al recibir tu pedido (según cobertura de la mensajería).</p>
            </label>
            <label className={`pay-option${pay === "abono" ? " selected" : ""}`} onClick={() => setPay("abono")}>
              <div className="head"><input type="radio" checked={pay === "abono"} readOnly /> Abono + saldo contra entrega</div>
              <p>Paga un abono ahora en línea para confirmar tu pedido personalizado y el resto al recibirlo.</p>
            </label>
          </fieldset>

          <button className="btn btn-gold btn-block" style={{ padding: 14 }} onClick={confirmOrder}>
            Confirmar y pagar
          </button>
          <p className="legal-note">
            Al confirmar aceptas los <Link href="/terminos">Términos y Condiciones</Link> y la Política de tratamiento de datos.
          </p>
        </div>

        <div className="card summary-box" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".95rem", marginBottom: 10 }}>
            Resumen del pedido
          </h3>
          <div style={{ fontSize: ".83rem", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
            {items.length ? (
              items.map((i) => <div key={i.id}>{i.qty}× {i.club} — {i.size}</div>)
            ) : (
              <div style={{ color: "var(--ink-mute)" }}>No hay productos en el carrito — se usará un pedido de ejemplo.</div>
            )}
          </div>
          <div className="summary-row"><span>Subtotal</span><span className="tabular">{money(subtotal || 510000)}</span></div>
          <div className="summary-row"><span>Envío ({city})</span><span className="tabular">{money(ship)}</span></div>
          <div className="summary-row total"><span>Total</span><span className="tabular">{money(total)}</span></div>
        </div>
      </div>
    </div>
  );
}

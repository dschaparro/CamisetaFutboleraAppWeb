"use client";

import { use, useState } from "react";
import Link from "next/link";
import { PRODUCTS, crestGradient } from "@/data/products";
import { money } from "@/lib/money";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

const SIZES = ["S", "M", "L", "XL"];

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = PRODUCTS.find((p) => p.id === slug) ?? PRODUCTS[0];
  const { addItem } = useCart();
  const router = useRouter();

  const [size, setSize] = useState("M");
  const [sleeve, setSleeve] = useState<"Corta" | "Larga">("Corta");
  const [patch, setPatch] = useState(false);
  const [addName, setAddName] = useState(false);
  const [nameText, setNameText] = useState("");
  const [numText, setNumText] = useState("");
  const [qty, setQty] = useState(1);

  function buildCustom() {
    const parts: string[] = [];
    if (patch) parts.push("Parche de liga");
    if (addName && nameText) parts.push(`"${nameText.toUpperCase()}" #${numText || "—"}`);
    return parts.join(" + ") || "Sin personalización";
  }

  function handleAdd() {
    addItem({
      club: product.club,
      name: product.name,
      initials: product.initials,
      cat: product.cat,
      size,
      sleeve,
      custom: buildCustom(),
      qty,
      price: product.price,
    });
  }

  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Inicio</Link> &gt; <Link href="/">Catálogo</Link> &gt;{" "}
        <Link href="/">Clubes europeos</Link> &gt; {product.club} — {product.name.replace("Camiseta ", "")}
      </div>
      <div className="product-detail">
        <div className="detail-media">
          <div className="crest" style={{ background: crestGradient(product.cat) }}>
            {product.initials}
            {addName && numText && <span className="jersey-num">{numText}</span>}
          </div>
        </div>
        <div className="detail-info">
          <div className="club">{product.club.toUpperCase()}</div>
          <h1>{product.name}</h1>
          <div className="price tabular">{money(product.price)} COP</div>
          <div className="avail">
            Disponible — se confirma con el proveedor al recibir tu pedido · entrega estimada 1-2
            días hábiles en Bogotá
          </div>

          <div className="option-group">
            <div className="label-row">
              <label className="lbl">Talla</label>
              <a className="link" href="#">Guía de tallas</a>
            </div>
            <div className="opt-row">
              {SIZES.map((s) => (
                <button key={s} className={`opt-btn${size === s ? " selected" : ""}`} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <div className="label-row"><label className="lbl">Tipo de manga</label></div>
            <div className="opt-row">
              {(["Corta", "Larga"] as const).map((s) => (
                <button key={s} className={`opt-btn${sleeve === s ? " selected" : ""}`} onClick={() => setSleeve(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {product.personalizable && (
            <div className="option-group">
              <div className="label-row"><label className="lbl">Personaliza tu camiseta</label></div>
              <div className="custom-box">
                <div className="custom-row">
                  <div className="txt">
                    <b>Agregar parche de liga</b>
                    <span>Ej. LaLiga, Champions League — estampado incluido en el precio</span>
                  </div>
                  <button className={`switch${patch ? " on" : ""}`} onClick={() => setPatch((v) => !v)} />
                </div>
                <div className="custom-row">
                  <div className="txt">
                    <b>Agregar nombre y dorsal</b>
                    <span>Estampado en la espalda, se aplica antes del envío</span>
                  </div>
                  <button className={`switch${addName ? " on" : ""}`} onClick={() => setAddName((v) => !v)} />
                </div>
                {addName && (
                  <div className="custom-fields">
                    <div className="field">
                      <label>Nombre en la camiseta</label>
                      <input placeholder="GUTIÉRREZ" maxLength={14} value={nameText} onChange={(e) => setNameText(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Número</label>
                      <input placeholder="10" maxLength={2} value={numText} onChange={(e) => setNumText(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-cta">
            <div className="qty-stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <button className="btn btn-outline btn-block" onClick={handleAdd}>Agregar al carrito</button>
            <button
              className="btn btn-gold btn-block"
              onClick={() => {
                handleAdd();
                router.push("/checkout");
              }}
            >
              Comprar ahora
            </button>
          </div>

          <div className="trust-list">
            <div>Pago 100% seguro</div>
            <div>Cambios por defecto de fábrica</div>
            <div>Envío contra entrega disponible</div>
          </div>
        </div>
      </div>
    </div>
  );
}

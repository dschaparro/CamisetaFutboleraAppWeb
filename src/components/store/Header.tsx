"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="store-header">
      <div className="topline">
        <div className="wrap">
          <span>Envíos a toda Colombia · Personaliza tu camiseta con parche y dorsal</span>
          <span>Pago seguro en línea o contra entrega</span>
        </div>
      </div>
      <div className="mainline">
        <div className="wrap">
          <Link href="/" className="brand">
            <span className="mark">CF</span> CAMISETA FUTBOLERA
          </Link>
          <nav className="store-nav">
            <Link href="/">Inicio</Link>
            <Link href="/">Catálogo</Link>
            <Link href={`/producto/${"RM-27T"}`}>Personalizar</Link>
            <Link href="/confirmacion">Seguimiento de pedido</Link>
            <Link href="/terminos">Contacto</Link>
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            <Link href="/carrito" className="cart-btn">
              🛒 Carrito<span className="cart-badge">{count}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBox from "@/components/store/SearchBox";

export default function Header() {
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [cliente, setCliente] = useState<{ nombre: string } | null>(null);
  const [menu, setMenu] = useState(false);

  async function salir() {
    setMenu(false);
    await fetch("/api/cuenta/salir", { method: "POST" });
    setCliente(null);
    router.push("/");
    router.refresh();
  }

  // Se revisa al cambiar de página para reflejar un ingreso o una salida recientes.
  useEffect(() => {
    let cancelado = false;
    fetch("/api/cuenta/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cliente?: { nombre: string } | null } | null) => {
        if (!cancelado) setCliente(d?.cliente ?? null);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [pathname]);

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
          <SearchBox />
          <nav className="store-nav">
            <Link href="/" className={pathname === "/" ? "current" : ""}>Inicio</Link>
            <Link href="/catalogo" className={pathname.startsWith("/catalogo") ? "current" : ""}>Catálogo</Link>
            <Link href="/catalogo/todas?ofertas=1">Ofertas</Link>
            <Link href="/personalizar" className={pathname.startsWith("/personalizar") ? "current" : ""}>Personalizar</Link>
            <Link href="/cuenta" className={pathname.startsWith("/cuenta") ? "current" : ""}>Mis pedidos</Link>
            <Link href="/terminos">Contacto</Link>
          </nav>
          <div className="header-actions">
            <ThemeToggle />
            {cliente ? (
              <div className="account-menu" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setMenu(false)}>
                <button
                  type="button"
                  className="account-btn"
                  aria-haspopup="menu"
                  aria-expanded={menu}
                  onClick={() => setMenu((m) => !m)}
                  onKeyDown={(e) => e.key === "Escape" && setMenu(false)}
                >
                  👤 {cliente.nombre.split(" ")[0]} ▾
                </button>
                {menu && (
                  <div className="account-drop" role="menu">
                    {[
                      ["pedidos", "🧾 Mis pedidos"],
                      ["datos", "👤 Mis datos"],
                      ["direcciones", "📍 Direcciones"],
                      ["pagos", "💳 Formas de pago"],
                      ["seguridad", "🔒 Cambiar contraseña"],
                    ].map(([id, label]) => (
                      <Link key={id} role="menuitem" href={`/cuenta#${id}`} onClick={() => setMenu(false)}>
                        {label}
                      </Link>
                    ))}
                    <button role="menuitem" type="button" onClick={salir}>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/ingresar" className="account-btn">
                👤 Ingresar
              </Link>
            )}
            <Link href="/carrito" className="cart-btn">
              🛒 Carrito<span className="cart-badge" key={count}>{count}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

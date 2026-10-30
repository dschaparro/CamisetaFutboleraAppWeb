"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import SearchBox from "@/components/store/SearchBox";

function enOfertas(pathname: string, ofertas: string | null) {
  return pathname === "/catalogo/todas" && ofertas === "1";
}

const NAV: { href: string; label: string; match: (p: string, ofertas: string | null) => boolean }[] = [
  { href: "/", label: "Inicio", match: (p) => p === "/" },
  {
    href: "/catalogo",
    label: "Catálogo",
    match: (p, ofertas) => p.startsWith("/catalogo") && !enOfertas(p, ofertas),
  },
  {
    href: "/catalogo/todas?ofertas=1",
    label: "Ofertas",
    match: (p, ofertas) => enOfertas(p, ofertas),
  },
  { href: "/personalizar", label: "Personalizar", match: (p) => p.startsWith("/personalizar") },
];

const AVISOS = [
  "Envíos a toda Colombia",
  "Personaliza con parche y dorsal",
  "Estampado incluido en el precio",
  "Pago seguro · Mercado Pago",
  "Contra entrega disponible",
  "Atención por WhatsApp",
  "Camisetas oficiales y réplicas",
  "Ofertas de temporada",
] as const;

function IconoBuscar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoCarrito() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 6l-1-3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Header() {
  const { count, vaciarLocal } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ofertasParam = searchParams.get("ofertas");
  const router = useRouter();
  const [cliente, setCliente] = useState<{ nombre: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [navAbierta, setNavAbierta] = useState(false);
  const [buscaAbierta, setBuscaAbierta] = useState(false);
  const [rutaMenus, setRutaMenus] = useState(pathname);
  const navId = useId();
  const buscaId = useId();
  const primerLink = useRef<HTMLAnchorElement>(null);
  const buscaInput = useRef<HTMLInputElement>(null);

  // Cierra menús al navegar (ajuste de estado durante render; evita setState en effect).
  if (rutaMenus !== pathname) {
    setRutaMenus(pathname);
    setNavAbierta(false);
    setBuscaAbierta(false);
    setMenu(false);
  }

  async function salir() {
    setMenu(false);
    setNavAbierta(false);
    await fetch("/api/cuenta/salir", { method: "POST" });
    vaciarLocal();
    setCliente(null);
    router.push("/");
    router.refresh();
  }

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

  useEffect(() => {
    if (!navAbierta) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primerLink.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavAbierta(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [navAbierta]);

  useEffect(() => {
    if (buscaAbierta) {
      const t = window.setTimeout(() => buscaInput.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
  }, [buscaAbierta]);

  function links(conFoco = false) {
    return NAV.map((item, i) => (
      <Link
        key={item.href}
        ref={conFoco && i === 0 ? primerLink : undefined}
        href={item.href}
        className={item.match(pathname, ofertasParam) ? "current" : undefined}
        onClick={() => setNavAbierta(false)}
      >
        {item.label}
      </Link>
    ));
  }

  return (
    <header className="store-header">
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido
      </a>
      <div className="topline topline-marquee" aria-label="Avisos de la tienda">
        <div className="topline-marquee-track">
          {[0, 1].map((copia) => (
            <div key={copia} className="topline-marquee-grupo" aria-hidden={copia === 1 ? true : undefined}>
              {AVISOS.map((msg) => (
                <span key={`${copia}-${msg}`} className="topline-marquee-item">
                  {msg}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mainline">
        <div className="wrap header-bar">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navAbierta}
            aria-controls={navId}
            aria-label={navAbierta ? "Cerrar menú" : "Abrir menú"}
            onClick={() => {
              setBuscaAbierta(false);
              setNavAbierta((v) => !v);
            }}
          >
            <span className={`nav-toggle-bars${navAbierta ? " abierto" : ""}`} aria-hidden="true" />
          </button>

          <Link href="/" className="brand" onClick={() => setNavAbierta(false)}>
            <BrandMark size={34} priority />
            <span className="brand-name">Camiseta Futbolera</span>
          </Link>

          <nav className="store-nav store-nav-desk" aria-label="Principal">
            {links()}
          </nav>

          <div className="store-search-desk">
            <SearchBox />
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn busca-toggle"
              aria-expanded={buscaAbierta}
              aria-controls={buscaId}
              aria-label={buscaAbierta ? "Cerrar búsqueda" : "Buscar"}
              onClick={() => {
                setNavAbierta(false);
                setBuscaAbierta((v) => !v);
              }}
            >
              <IconoBuscar />
            </button>
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
                  <span className="account-inicial" aria-hidden="true">
                    {cliente.nombre.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="account-nombre">{cliente.nombre.split(" ")[0]}</span>
                </button>
                {menu && (
                  <div className="account-drop" role="menu">
                    {[
                      ["pedidos", "Mis pedidos"],
                      ["datos", "Mis datos"],
                      ["direcciones", "Direcciones"],
                      ["seguridad", "Cambiar contraseña"],
                    ].map(([id, label]) => (
                      <Link
                        key={id}
                        role="menuitem"
                        href={`/cuenta?seccion=${id}`}
                        onClick={() => setMenu(false)}
                      >
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
              <Link href="/ingresar" className="account-btn account-btn-desk">
                Ingresar
              </Link>
            )}
            <Link href="/carrito" className="cart-btn" aria-label={`Carrito, ${count} productos`}>
              <IconoCarrito />
              <span className="cart-label">Carrito</span>
              {count > 0 && (
                <span className="cart-badge" key={count}>
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div id={buscaId} className={`busca-panel${buscaAbierta ? " abierto" : ""}`} hidden={!buscaAbierta}>
          <div className="wrap">
            <SearchBox inputRef={buscaInput} />
          </div>
        </div>
      </div>

      <div
        className={`nav-drawer-fondo${navAbierta ? " abierto" : ""}`}
        hidden={!navAbierta}
        onClick={() => setNavAbierta(false)}
        aria-hidden="true"
      />
      <nav id={navId} className={`nav-drawer${navAbierta ? " abierto" : ""}`} aria-label="Menú móvil" hidden={!navAbierta}>
        <div className="nav-drawer-head">
          <b>Menú</b>
          <button type="button" className="nav-drawer-cerrar" aria-label="Cerrar" onClick={() => setNavAbierta(false)}>
            ×
          </button>
        </div>
        <div className="store-nav store-nav-mob">{links(true)}</div>
        <Link href="/terminos" className="nav-drawer-extra" onClick={() => setNavAbierta(false)}>
          Ayuda · Términos y envíos
        </Link>
        <div className="nav-drawer-pie">
          {cliente ? (
            <button type="button" className="btn btn-outline btn-block" onClick={salir}>
              Cerrar sesión
            </button>
          ) : (
            <Link href="/ingresar" className="btn btn-gold btn-block" onClick={() => setNavAbierta(false)}>
              Ingresar o crear cuenta
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

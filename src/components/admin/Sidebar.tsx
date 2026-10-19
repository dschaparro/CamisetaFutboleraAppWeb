"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { modulosDe } from "@/modules/identidad/domain/permisos";
import type { Rol } from "@/modules/identidad/domain/types";

const GRUPOS = ["General", "Operación", "Negocio", "Administración"] as const;

/** Íconos de línea (sin emojis) para que el menú se vea sobrio. Se eligen por la ruta del módulo. */
const ICONOS: Record<string, React.ReactNode> = {
  "/panel/dashboard": <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />,
  "/panel/inventario": <path d="m21 8-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" />,
  "/panel/pedidos": <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Zm1 5h8M8 12h8" />,
  "/panel/venta-manual": <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17l-1 3Zm9-13 3 3" />,
  "/panel/lista-compras": <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  "/panel/tienda": <path d="M4 9h16l-1-5H5L4 9Zm1 0v11h14V9M9 20v-6h6v6" />,
  "/panel/reportes": <path d="M5 20V10m7 10V4m7 16v-7" />,
  "/panel/informes-ia": <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3L12 3Zm7 11 .9 2.1 2.1.9-2.1.9L19 20l-.9-2.1-2.1-.9 2.1-.9L19 14Z" />,
  "/panel/usuarios": <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m12-12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm5 12v-1.5a3.5 3.5 0 0 0-2.5-3.3M16.5 5.2a3 3 0 0 1 0 5.6" />,
  tienda: <path d="M3 4h2l2.4 11h10.2l2-8H6.2M10 20.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Zm7 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0Z" />,
};

function Icono({ clave }: { clave: string }) {
  return (
    <span className="ic" aria-hidden="true">
      <svg viewBox="0 0 24 24">{ICONOS[clave] ?? <circle cx="12" cy="12" r="4" />}</svg>
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nombre: string; rol: Rol } | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user?: { nombre: string; rol: Rol } } | null) => {
        if (!cancelled && data?.user) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Vuelve al login principal de la tienda (el mismo «Ingresar» para todos).
    router.push("/ingresar");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="brand" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mark">CF</span>
          <span>CAMISETA FUTBOLERA<small>Panel administrativo</small></span>
        </span>
        <ThemeToggle />
      </div>
      {/* Solo los módulos del rol (tabla en modules/identidad/domain/permisos.ts). */}
      {GRUPOS.map((grupo) => ({ grupo, items: user ? modulosDe(user.rol).filter((m) => m.grupo === grupo) : [] }))
        .filter((section) => section.items.length > 0)
        .map((section) => (
        <div className="side-group" key={section.grupo}>
          <div className="side-title">{section.grupo}</div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`side-link${pathname === item.href ? " current" : ""}`}
            >
              <span><Icono clave={item.href} /> {item.label}</span>
            </Link>
          ))}
        </div>
      ))}
      <div className="side-group">
        <div className="side-title">Tienda</div>
        {/* Pestaña nueva para no perder lo que se está haciendo en el panel. */}
        <Link href="/" target="_blank" rel="noopener" className="side-link" title="Abre la tienda en una pestaña nueva">
          <span><Icono clave="tienda" /> Ver tienda</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className="side-user">
        <div className="av">{user ? user.nombre.slice(0, 1).toUpperCase() : "—"}</div>
        <div>
          <b>{sessionReady ? (user?.nombre ?? "Sesión") : "Cargando…"}</b>
          <span>{user?.rol ?? ""}</span>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-mute)" }} type="button" onClick={logout}>
        Cerrar sesión
      </button>
    </aside>
  );
}

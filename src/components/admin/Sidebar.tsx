"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import type { Rol } from "@/modules/identidad/domain/types";

const NAV = [
  { group: "General", items: [{ href: "/panel/dashboard", icon: "▤", label: "Dashboard" }] },
  {
    group: "Operación",
    items: [
      { href: "/panel/inventario", icon: "📦", label: "Inventario y compras" },
      { href: "/panel/pedidos", icon: "🧾", label: "Pedidos" },
      { href: "/panel/venta-manual", icon: "✎", label: "Venta manual" },
      { href: "/panel/lista-compras", icon: "☑", label: "Lista de compras" },
    ],
  },
  {
    group: "Negocio",
    items: [
      { href: "/panel/reportes", icon: "📊", label: "Reportes" },
      { href: "/panel/informes-ia", icon: "✦", label: "Informes con IA" },
    ],
  },
];

const SOON = [
  { group: "General", label: "Catálogo", icon: "▦" },
  { group: "Operación", label: "Envíos", icon: "🚚" },
  { group: "Negocio", label: "Usuarios y roles", icon: "👤" },
];

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
    router.push("/panel/login");
    router.refresh();
  }

  return (
    <aside className="admin-sidebar">
      <div className="brand" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mark">CF</span> CAMISETA FUTBOLERA
        </span>
        <ThemeToggle />
      </div>
      {NAV.map((section) => (
        <div className="side-group" key={section.group}>
          <div className="side-title">{section.group}</div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`side-link${pathname === item.href ? " current" : ""}`}
            >
              <span><span className="ic">{item.icon}</span> {item.label}</span>
            </Link>
          ))}
          {SOON.filter((s) => s.group === section.group).map((s) => (
            <button key={s.label} className="side-link" disabled title="Aún no implementado en este prototipo">
              <span><span className="ic">{s.icon}</span> {s.label}</span>
              <span className="tag">pronto</span>
            </button>
          ))}
        </div>
      ))}
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

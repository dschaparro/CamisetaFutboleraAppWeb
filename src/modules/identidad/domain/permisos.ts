import type { Rol } from "@/modules/identidad/domain/types";

/**
 * Qué puede ver cada rol del personal. Es la única fuente: la usan el menú
 * lateral (qué mostrar) y proxy.ts (qué bloquear). Para cambiar permisos, se
 * cambia solo esta tabla.
 *
 * - Administrador: todo.
 * - Vendedor: atiende clientes y registra ventas.
 * - Bodega: inventario, compras a proveedores y alistamiento/envío de pedidos.
 * - Marketing: análisis e informes (y más adelante catálogo, ofertas y banners).
 */
export type ModuloPanel = {
  href: string;
  label: string;
  icon: string;
  grupo: "General" | "Operación" | "Negocio" | "Administración";
  roles: readonly Rol[];
};

const TODOS: readonly Rol[] = ["Administrador", "Vendedor", "Bodega", "Marketing"];

export const MODULOS: readonly ModuloPanel[] = [
  { href: "/panel/dashboard", label: "Dashboard", icon: "▤", grupo: "General", roles: TODOS },
  { href: "/panel/inventario", label: "Inventario y compras", icon: "📦", grupo: "Operación", roles: ["Administrador", "Vendedor", "Bodega"] },
  { href: "/panel/pedidos", label: "Pedidos", icon: "🧾", grupo: "Operación", roles: ["Administrador", "Vendedor", "Bodega"] },
  { href: "/panel/venta-manual", label: "Venta manual", icon: "✎", grupo: "Operación", roles: ["Administrador", "Vendedor"] },
  { href: "/panel/lista-compras", label: "Lista de compras", icon: "☑", grupo: "Operación", roles: ["Administrador", "Vendedor", "Bodega"] },
  { href: "/panel/tienda", label: "Tienda online", icon: "🛍", grupo: "Negocio", roles: ["Administrador", "Marketing"] },
  { href: "/panel/reportes", label: "Reportes", icon: "📊", grupo: "Negocio", roles: ["Administrador", "Marketing"] },
  { href: "/panel/informes-ia", label: "Informes con IA", icon: "✦", grupo: "Negocio", roles: ["Administrador", "Marketing"] },
  { href: "/panel/usuarios", label: "Usuarios y roles", icon: "👤", grupo: "Administración", roles: ["Administrador"] },
];

/** APIs del panel que no están ligadas a una página: quién puede llamarlas. */
const APIS: readonly { prefijo: string; roles: readonly Rol[] }[] = [
  { prefijo: "/api/informes", roles: ["Administrador", "Marketing"] },
  { prefijo: "/api/usuarios", roles: ["Administrador"] },
  { prefijo: "/api/pedidos", roles: ["Administrador", "Vendedor", "Bodega"] },
  { prefijo: "/api/inventario", roles: ["Administrador", "Vendedor", "Bodega"] },
  { prefijo: "/api/lista-compras", roles: ["Administrador", "Vendedor", "Bodega"] },
  { prefijo: "/api/venta-manual", roles: ["Administrador", "Vendedor"] },
  { prefijo: "/api/reportes", roles: ["Administrador", "Marketing"] },
  { prefijo: "/api/admin/tienda", roles: ["Administrador", "Marketing"] },
  { prefijo: "/api/auth/me", roles: TODOS },
  { prefijo: "/api/auth/logout", roles: TODOS },
];

function coincide(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

export function modulosDe(rol: Rol): ModuloPanel[] {
  return MODULOS.filter((m) => m.roles.includes(rol));
}

/**
 * ¿Puede este rol abrir esta ruta del panel o llamar esta API?
 * Lo que no está en las tablas se niega: una página o API nueva queda cerrada
 * hasta que se le asignen roles.
 */
export function puedeAcceder(rol: Rol, pathname: string): boolean {
  const modulo = MODULOS.find((m) => coincide(pathname, m.href));
  if (modulo) return modulo.roles.includes(rol);
  const api = APIS.find((a) => coincide(pathname, a.prefijo));
  if (api) return api.roles.includes(rol);
  return false;
}

/** A dónde va cada rol al iniciar sesión (o si intenta abrir algo que no le corresponde). */
export function rutaInicial(rol: Rol): string {
  return modulosDe(rol)[0]?.href ?? "/panel/dashboard";
}

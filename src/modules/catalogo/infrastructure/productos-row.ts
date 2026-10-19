import { CATEGORIAS, ETIQUETAS } from "@/modules/catalogo/domain/types";
import type { Categoria, Etiqueta, Producto, ProductoCambios } from "@/modules/catalogo/domain/types";

export type ProductoRow = {
  id: string;
  sku: string;
  slug: string;
  nombre: string;
  club: string;
  categoria: string;
  precio: number;
  costo: number | null;
  stock: number;
  proveedor: string | null;
  iniciales: string;
  personalizable: boolean;
  retro: boolean;
  etiqueta: string | null;
  visible: boolean;
  updated_at: string;
};

export const COLUMNAS =
  "id,sku,slug,nombre,club,categoria,precio,costo,stock,proveedor,iniciales,personalizable,retro,etiqueta,visible,updated_at";

function esCategoria(v: string): v is Categoria {
  return (CATEGORIAS as readonly string[]).includes(v);
}

function esEtiqueta(v: string): v is Etiqueta {
  return (ETIQUETAS as readonly string[]).includes(v);
}

/** Fila de Supabase → dominio. Descarta filas con categoría desconocida. */
export function toProducto(row: ProductoRow): Producto | null {
  if (!esCategoria(row.categoria)) return null;
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    nombre: row.nombre,
    club: row.club,
    categoria: row.categoria,
    precio: row.precio,
    costo: row.costo,
    stock: row.stock,
    proveedor: row.proveedor,
    iniciales: row.iniciales,
    personalizable: row.personalizable,
    retro: row.retro,
    etiqueta: row.etiqueta !== null && esEtiqueta(row.etiqueta) ? row.etiqueta : null,
    visible: row.visible,
    actualizadoEn: row.updated_at,
  };
}

/**
 * Dominio → columnas de Supabase. Hoy coinciden los nombres; se deja explícito
 * para que un cambio de nombre en dominio no llegue a la base de datos por accidente.
 */
export function toFila(cambios: ProductoCambios & { sku?: string; slug?: string }): Partial<ProductoRow> {
  const fila: Partial<ProductoRow> = {};
  const claves = [
    "sku",
    "slug",
    "nombre",
    "club",
    "categoria",
    "precio",
    "costo",
    "stock",
    "proveedor",
    "iniciales",
    "personalizable",
    "retro",
    "etiqueta",
    "visible",
  ] as const;
  for (const clave of claves) {
    if (clave in cambios) (fila as Record<string, unknown>)[clave] = cambios[clave];
  }
  return fila;
}

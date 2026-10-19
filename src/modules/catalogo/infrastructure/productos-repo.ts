import { getSupabaseConfig } from "@/lib/supabaseClient";
import { SkuDuplicadoError } from "@/modules/catalogo/domain/errors";
import { slugDesdeSku } from "@/modules/catalogo/domain/producto";
import type { Producto, ProductoCambios, ProductoNuevo } from "@/modules/catalogo/domain/types";
import { COLUMNAS, toFila, toProducto, type ProductoRow } from "@/modules/catalogo/infrastructure/productos-row";

/** Llama a la API REST de Supabase (PostgREST) con la secret key. Solo servidor. */
async function rest(
  params: Record<string, string>,
  init: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {},
): Promise<{ status: number; rows: ProductoRow[] }> {
  const { url, secretKey } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/productos", url);
  endpoint.searchParams.set("select", COLUMNAS);
  for (const [k, v] of Object.entries(params)) endpoint.searchParams.set(k, v);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: init.method ?? "GET",
      headers: {
        apikey: secretKey,
        Accept: "application/json",
        ...(init.body !== undefined
          ? { "Content-Type": "application/json", Prefer: "return=representation" }
          : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    const cause = err instanceof Error && "cause" in err && err.cause instanceof Error ? err.cause.message : "";
    const base = err instanceof Error ? err.message : "fetch failed";
    throw new Error(cause ? `${base} (${cause})` : base);
  }

  if (!response.ok) {
    return { status: response.status, rows: [] };
  }
  const rows = (await response.json()) as unknown;
  return { status: response.status, rows: Array.isArray(rows) ? (rows as ProductoRow[]) : [] };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function aProductos(rows: ProductoRow[]): Producto[] {
  return rows.map(toProducto).filter((p): p is Producto => p !== null);
}

function fallo(status: number, accion: string): Error {
  return new Error(`Supabase HTTP ${status} al ${accion} productos`);
}

export async function listarProductos(opciones: { soloVisibles: boolean }): Promise<Producto[]> {
  const params: Record<string, string> = { order: "nombre.asc" };
  if (opciones.soloVisibles) params.visible = "eq.true";
  const { status, rows } = await rest(params);
  if (status >= 400) throw fallo(status, "listar");
  return aProductos(rows);
}

export async function buscarProductoPorSlug(slug: string, opciones: { soloVisibles: boolean }): Promise<Producto | null> {
  const params: Record<string, string> = { slug: `eq.${slug}`, limit: "1" };
  if (opciones.soloVisibles) params.visible = "eq.true";
  const { status, rows } = await rest(params);
  if (status >= 400) throw fallo(status, "buscar");
  return aProductos(rows)[0] ?? null;
}

export async function crearProducto(datos: ProductoNuevo): Promise<Producto> {
  const { status, rows } = await rest({}, { method: "POST", body: toFila({ ...datos, slug: slugDesdeSku(datos.sku) }) });
  // 409 = viola un unique (sku o slug).
  if (status === 409) throw new SkuDuplicadoError(datos.sku);
  if (status >= 400) throw fallo(status, "crear");
  const creado = aProductos(rows)[0];
  if (!creado) throw new Error("Supabase no devolvió el producto creado");
  return creado;
}

/** Devuelve null si no existe un producto con ese id. */
export async function actualizarProducto(id: string, cambios: ProductoCambios): Promise<Producto | null> {
  // Un id que no es uuid no puede existir (y Postgres respondería 400).
  if (!UUID.test(id)) return null;
  const { status, rows } = await rest({ id: `eq.${id}` }, { method: "PATCH", body: toFila(cambios) });
  if (status >= 400) throw fallo(status, "actualizar");
  return aProductos(rows)[0] ?? null;
}

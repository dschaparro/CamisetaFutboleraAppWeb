import { query } from "@/lib/db";
import type { Pedido } from "@/modules/pedidos/domain/types";
import { NoEncontradoError, faltantes, type EstadoLista } from "@/modules/operacion/domain/operacion";

/** Lista de compras: lo que se vendió sin tener stock y hay que conseguir con el proveedor. */

export type ItemLista = {
  id: number;
  productoId: string | null;
  producto: string;
  variante: string;
  personalizacion: string;
  cantidad: number;
  origen: string;
  pedidoId: string | null;
  estado: EstadoLista;
  nota: string | null;
  creadaEn: string;
};

type Fila = Record<string, unknown>;
const aItem = (r: Fila): ItemLista => ({
  id: Number(r.id),
  productoId: (r.producto_id as string | null) ?? null,
  producto: r.producto as string,
  variante: r.variante as string,
  personalizacion: r.personalizacion as string,
  cantidad: r.cantidad as number,
  origen: r.origen as string,
  pedidoId: (r.pedido_id as string | null) ?? null,
  estado: r.estado as EstadoLista,
  nota: (r.nota as string | null) ?? null,
  creadaEn: r.creada_en instanceof Date ? r.creada_en.toISOString() : String(r.creada_en),
});

export async function listarListaCompras(): Promise<ItemLista[]> {
  // Pendientes primero, y dentro de cada estado lo más antiguo arriba.
  return (
    await query(
      "select * from public.lista_compras order by (estado = 'Pendiente') desc, creada_en asc, id asc",
    )
  ).map(aItem);
}

export async function cambiarEstadoLista(id: number, estado: EstadoLista, nota: string | null): Promise<ItemLista> {
  const r = await query(
    "update public.lista_compras set estado = $2, nota = coalesce($3, nota), actualizada_en = now() where id = $1 returning *",
    [id, estado, nota],
  );
  if (!r[0]) throw new NoEncontradoError("ese ítem de la lista de compras");
  return aItem(r[0]);
}

/**
 * Se llama justo ANTES de descontar el stock de un pedido nuevo: lo que no alcanza se agrega
 * a la lista de compras con el origen del pedido (venta web o manual).
 */
export async function registrarFaltantes(pedido: Pedido): Promise<number> {
  const slugs = [...new Set(pedido.items.map((i) => i.slug).filter((s): s is string => !!s))];
  if (slugs.length === 0) return 0;
  const filas = await query<{ id: string; stock: number }>("select id, stock from public.productos where id = any($1::text[])", [slugs]);
  const falta = faltantes(
    pedido.items,
    new Map(filas.map((f) => [f.id, f.stock])),
  );
  const origen = `${pedido.canal && pedido.canal !== "Web" ? "Venta" : "Pedido"} #${pedido.id}`;
  for (const f of falta) {
    await query(
      "insert into public.lista_compras (producto_id, producto, variante, personalizacion, cantidad, origen, pedido_id) values ($1,$2,$3,$4,$5,$6,$7)",
      [f.slug, f.nombre, f.variante, f.personalizacion, f.cantidad, origen, pedido.id],
    );
  }
  return falta.length;
}

import { query, transaccion } from "@/lib/db";
import type { Pedido } from "@/modules/pedidos/domain/types";
import type { PedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Pedidos en PostgreSQL (Supabase): cabecera, artículos e historial de estados. */

type Fila = Record<string, unknown>;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function armar(filas: Fila[]): Promise<Pedido[]> {
  if (filas.length === 0) return [];
  const ids = filas.map((f) => f.id as string);
  const [items, historial] = await Promise.all([
    query("select * from public.pedido_items where pedido_id = any($1::text[]) order by pedido_id, orden", [ids]),
    query("select * from public.pedido_historial where pedido_id = any($1::text[]) order by pedido_id, id", [ids]),
  ]);
  return filas.map((f) => ({
    id: f.id as string,
    clienteId: (f.cliente_id as string | null) ?? null,
    claveAcceso: f.clave_acceso as string,
    contacto: { nombre: f.contacto_nombre as string, email: f.contacto_email as string, telefono: f.contacto_telefono as string },
    creadoEn: iso(f.creado_en),
    estado: f.estado as Pedido["estado"],
    historial: historial
      .filter((h) => h.pedido_id === f.id)
      .map((h) => ({ estado: h.estado as Pedido["estado"], fecha: iso(h.fecha), ...(h.nota ? { nota: h.nota as string } : {}) })),
    medioPago: f.medio_pago as string,
    estadoPago: f.estado_pago as Pedido["estadoPago"],
    ciudad: f.ciudad as string,
    direccion: f.direccion as string,
    items: items
      .filter((i) => i.pedido_id === f.id)
      .map((i) => ({
        nombre: i.nombre as string,
        slug: (i.producto_id as string | null) ?? null,
        talla: i.talla as string,
        manga: i.manga as string,
        personalizacion: i.personalizacion as string,
        cantidad: i.cantidad as number,
        precioUnitario: i.precio_unitario as number,
      })),
    subtotal: f.subtotal as number,
    envio: f.envio as number,
    descuento: f.descuento as number,
    total: f.total as number,
    guia: (f.guia as string | null) ?? null,
    canal: (f.canal as string) ?? "Web",
    documento: (f.documento as string | null) ?? null,
  }));
}

export const pedidosPg: PedidosRepo = {
  async listarTodos() {
    return armar(await query("select * from public.pedidos order by creado_en desc"));
  },
  async listarPorCliente(clienteId) {
    if (!UUID.test(clienteId)) return [];
    return armar(await query("select * from public.pedidos where cliente_id = $1 order by creado_en desc", [clienteId]));
  },
  async buscar(id) {
    return (await armar(await query("select * from public.pedidos where id = $1", [id])))[0] ?? null;
  },
  async guardar(p) {
    await transaccion(async (c) => {
      await c.query(
        `insert into public.pedidos (id, cliente_id, clave_acceso, contacto_nombre, contacto_email, contacto_telefono, creado_en, estado,
           medio_pago, estado_pago, ciudad, direccion, subtotal, envio, descuento, total, guia, canal, documento)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         on conflict (id) do update set cliente_id = excluded.cliente_id, estado = excluded.estado, medio_pago = excluded.medio_pago,
           estado_pago = excluded.estado_pago, ciudad = excluded.ciudad, direccion = excluded.direccion, subtotal = excluded.subtotal,
           envio = excluded.envio, descuento = excluded.descuento, total = excluded.total, guia = excluded.guia, canal = excluded.canal, documento = excluded.documento`,
        [p.id, p.clienteId && UUID.test(p.clienteId) ? p.clienteId : null, p.claveAcceso, p.contacto.nombre, p.contacto.email,
          p.contacto.telefono, p.creadoEn, p.estado, p.medioPago, p.estadoPago, p.ciudad, p.direccion, p.subtotal, p.envio,
          p.descuento, p.total, p.guia, p.canal ?? "Web", p.documento ?? null],
      );
      await c.query("delete from public.pedido_items where pedido_id = $1", [p.id]);
      await c.query("delete from public.pedido_historial where pedido_id = $1", [p.id]);
      for (const [i, it] of p.items.entries()) {
        await c.query(
          "insert into public.pedido_items (pedido_id, orden, nombre, producto_id, talla, manga, personalizacion, cantidad, precio_unitario) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [p.id, i, it.nombre, it.slug, it.talla, it.manga, it.personalizacion, it.cantidad, it.precioUnitario],
        );
      }
      for (const h of p.historial) {
        await c.query("insert into public.pedido_historial (pedido_id, estado, fecha, nota) values ($1,$2,$3,$4)", [p.id, h.estado, h.fecha, h.nota ?? null]);
      }
    });
  },
};

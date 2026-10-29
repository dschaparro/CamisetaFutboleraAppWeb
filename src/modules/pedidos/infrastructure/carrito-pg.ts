import { query, transaccion } from "@/lib/db";
import type { LineaCarrito } from "@/modules/pedidos/domain/carrito";
import type { CarritoRepo } from "@/modules/pedidos/application/puertos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Fila = {
  slug: string;
  talla: string;
  manga: string;
  personalizacion: string;
  cantidad: number;
  club: string;
  nombre: string;
  initials: string;
  cat: string;
  precio: number;
};

function aLinea(f: Fila): LineaCarrito {
  return {
    slug: f.slug,
    talla: f.talla,
    manga: f.manga,
    personalizacion: f.personalizacion,
    cantidad: f.cantidad,
    club: f.club,
    nombre: f.nombre,
    initials: f.initials,
    cat: f.cat,
    precio: f.precio,
  };
}

export const carritoPg: CarritoRepo = {
  async obtener(clienteId) {
    if (!UUID.test(clienteId)) return [];
    const filas = await query<Fila>(
      `select slug, talla, manga, personalizacion, cantidad, club, nombre, initials, cat, precio
       from public.carrito_items where cliente_id = $1::uuid order by actualizado_en desc`,
      [clienteId],
    );
    return filas.map(aLinea);
  },

  async reemplazar(clienteId, lineas) {
    if (!UUID.test(clienteId)) return;
    await transaccion(async (c) => {
      await c.query("delete from public.carrito_items where cliente_id = $1::uuid", [clienteId]);
      for (const l of lineas) {
        await c.query(
          `insert into public.carrito_items
             (cliente_id, slug, talla, manga, personalizacion, cantidad, club, nombre, initials, cat, precio)
           values ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [clienteId, l.slug, l.talla, l.manga, l.personalizacion, l.cantidad, l.club, l.nombre, l.initials, l.cat, l.precio],
        );
      }
    });
  },
};

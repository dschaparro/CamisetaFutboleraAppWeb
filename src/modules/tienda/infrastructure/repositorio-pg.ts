import type pg from "pg";
import { query, transaccion } from "@/lib/db";
import type { Banner, Cupon, Liga, Producto, Promocion } from "@/modules/tienda/domain/types";
import type { Coleccion, DatosTienda, TiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

/** Tienda en PostgreSQL (Supabase). Misma forma que la simulación. */

type Fila = Record<string, unknown>;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

const aLiga = (r: Fila): Liga => ({
  id: r.id as string,
  nombre: r.nombre as string,
  pais: r.pais as string,
  descripcion: r.descripcion as string,
  colores: [r.color1 as string, r.color2 as string],
  imagen: (r.imagen as string | null) ?? null,
  posicion: r.posicion as Liga["posicion"],
  orden: r.orden as number,
  visible: r.visible as boolean,
});

const aProducto = (r: Fila): Producto => ({
  id: r.id as string,
  nombre: r.nombre as string,
  club: r.club as string,
  ligaId: r.liga_id as string,
  categoria: r.categoria as Producto["categoria"],
  precio: r.precio as number,
  costo: (r.costo as number | null) ?? null,
  stock: r.stock as number,
  iniciales: r.iniciales as string,
  personalizable: r.personalizable as boolean,
  retro: r.retro as boolean,
  etiqueta: (r.etiqueta as Producto["etiqueta"]) ?? null,
  descripcion: r.descripcion as string,
  escudo: (r.escudo as string | null) ?? null,
  imagenes: (r.imagenes as string[]) ?? [],
  posicionImagen: r.posicion_imagen as Producto["posicionImagen"],
  visible: r.visible as boolean,
});

const aPromocion = (r: Fila): Promocion => ({
  id: r.id as string,
  etiqueta: r.etiqueta as string,
  porcentaje: r.porcentaje as number,
  alcance: r.alcance as Promocion["alcance"],
  productoIds: (r.producto_ids as string[]) ?? [],
  ligaId: (r.liga_id as string | null) ?? null,
  desde: iso(r.desde),
  hasta: iso(r.hasta),
  activa: r.activa as boolean,
});

const aCupon = (r: Fila): Cupon => ({
  id: r.id as string,
  codigo: r.codigo as string,
  tipo: r.tipo as Cupon["tipo"],
  valor: r.valor as number,
  minimoCompra: r.minimo_compra as number,
  hasta: iso(r.hasta),
  usosMaximos: (r.usos_maximos as number | null) ?? null,
  usos: r.usos as number,
  activo: r.activo as boolean,
});

const aBanner = (r: Fila): Banner => ({
  id: r.id as string,
  antetitulo: r.antetitulo as string,
  titulo: r.titulo as string,
  texto: r.texto as string,
  boton: r.boton as string,
  enlace: r.enlace as string,
  colores: [r.color1 as string, r.color2 as string],
  acento: r.acento as string,
  insignia: r.insignia as string,
  imagen: (r.imagen as string | null) ?? null,
  posicion: r.posicion as Banner["posicion"],
  oscurecer: r.oscurecer as number,
  alineacion: r.alineacion as Banner["alineacion"],
  orden: r.orden as number,
  desde: iso(r.desde),
  hasta: iso(r.hasta),
  activo: r.activo as boolean,
});

/** Columnas y valores de cada colección, en el orden de la tabla. */
const COLUMNAS: { [K in Coleccion]: { tabla: string; cols: string[]; valores: (x: DatosTienda[K][number]) => unknown[] } } = {
  ligas: {
    tabla: "ligas",
    cols: ["id", "nombre", "pais", "descripcion", "color1", "color2", "imagen", "posicion", "orden", "visible"],
    valores: (l) => [l.id, l.nombre, l.pais, l.descripcion, l.colores[0], l.colores[1], l.imagen, l.posicion, l.orden, l.visible],
  },
  productos: {
    tabla: "productos",
    cols: ["id", "nombre", "club", "liga_id", "categoria", "precio", "costo", "stock", "iniciales", "personalizable", "retro", "etiqueta", "descripcion", "escudo", "imagenes", "posicion_imagen", "visible"],
    valores: (p) => [p.id, p.nombre, p.club, p.ligaId, p.categoria, p.precio, p.costo, p.stock, p.iniciales, p.personalizable, p.retro, p.etiqueta, p.descripcion, p.escudo, p.imagenes, p.posicionImagen, p.visible],
  },
  promociones: {
    tabla: "promociones",
    cols: ["id", "etiqueta", "porcentaje", "alcance", "producto_ids", "liga_id", "desde", "hasta", "activa"],
    valores: (p) => [p.id, p.etiqueta, p.porcentaje, p.alcance, p.productoIds, p.ligaId, p.desde, p.hasta, p.activa],
  },
  cupones: {
    tabla: "cupones",
    cols: ["id", "codigo", "tipo", "valor", "minimo_compra", "hasta", "usos_maximos", "usos", "activo"],
    valores: (c) => [c.id, c.codigo, c.tipo, c.valor, c.minimoCompra, c.hasta, c.usosMaximos, c.usos, c.activo],
  },
  banners: {
    tabla: "banners",
    cols: ["id", "antetitulo", "titulo", "texto", "boton", "enlace", "color1", "color2", "acento", "insignia", "imagen", "posicion", "oscurecer", "alineacion", "orden", "desde", "hasta", "activo"],
    valores: (b) => [b.id, b.antetitulo, b.titulo, b.texto, b.boton, b.enlace, b.colores[0], b.colores[1], b.acento, b.insignia, b.imagen, b.posicion, b.oscurecer, b.alineacion, b.orden, b.desde, b.hasta, b.activo],
  },
};

/** Inserta o actualiza una fila por id. */
export async function upsert<K extends Coleccion>(c: pg.PoolClient, coleccion: K, x: DatosTienda[K][number]) {
  const def = COLUMNAS[coleccion];
  const ph = def.cols.map((_, i) => `$${i + 1}`).join(", ");
  const set = def.cols.filter((k) => k !== "id").map((k) => `${k} = excluded.${k}`).join(", ");
  await c.query(`insert into public.${def.tabla} (${def.cols.join(", ")}) values (${ph}) on conflict (id) do update set ${set}`, (def.valores as (v: unknown) => unknown[])(x));
}

export const tiendaPg: TiendaRepo = {
  async leer() {
    const [ligas, productos, promociones, cupones, banners] = await Promise.all([
      query("select * from public.ligas order by orden, nombre"),
      query("select * from public.productos order by created_at, id"),
      query("select * from public.promociones order by desde desc"),
      query("select * from public.cupones order by codigo"),
      query("select * from public.banners order by orden"),
    ]);
    return {
      ligas: ligas.map(aLiga),
      productos: productos.map(aProducto),
      promociones: promociones.map(aPromocion),
      cupones: cupones.map(aCupon),
      banners: banners.map(aBanner),
    };
  },

  async guardar(coleccion, lista) {
    const tabla = COLUMNAS[coleccion].tabla;
    await transaccion(async (c) => {
      for (const x of lista as DatosTienda[typeof coleccion][number][]) await upsert(c, coleccion, x);
      const ids = (lista as { id: string }[]).map((x) => x.id);
      await c.query(`delete from public.${tabla} where not (id = any($1::text[]))`, [ids]);
    });
  },

  async registrarVenta(items, cuponId) {
    await transaccion(async (c) => {
      for (const it of items) {
        if (it.slug) await c.query("update public.productos set stock = greatest(0, stock - $2) where id = $1", [it.slug, it.cantidad]);
      }
      if (cuponId) await c.query("update public.cupones set usos = usos + 1 where id = $1", [cuponId]);
    });
  },

  async imagen(id) {
    const r = await query<{ tipo: string; datos: Buffer }>("select tipo, datos from public.imagenes where id = $1", [id]);
    return r[0] ? { tipo: r[0].tipo, datos: r[0].datos } : null;
  },
  async guardarImagen(id, img) {
    await query("insert into public.imagenes (id, tipo, datos) values ($1, $2, $3) on conflict (id) do update set tipo = excluded.tipo, datos = excluded.datos", [id, img.tipo, img.datos]);
  },
  async borrarImagen(id) {
    await query("delete from public.imagenes where id = $1", [id]);
  },
};

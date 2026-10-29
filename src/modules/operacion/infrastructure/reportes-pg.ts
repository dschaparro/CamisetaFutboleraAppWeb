import { query } from "@/lib/db";
import type { FuentesNegocio } from "@/modules/operacion/domain/fuentes";
import { STOCK_BAJO } from "@/modules/operacion/domain/operacion";

/**
 * Cifras del Dashboard, de Reportes y del Informe con IA, calculadas en la base de datos.
 * Una venta cuenta salvo que el pedido esté Cancelado. «Ingresos» = lo que pagó el cliente (total
 * del pedido); «costo» = costo registrado del producto × unidades (un producto sin costo cuenta 0
 * y se avisa cuántos faltan).
 */

const ZONA = "America/Bogota";
const num = (v: unknown) => Number(v ?? 0);
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Ventana = { ingresos: number; costo: number; pedidos: number };

/** Ingresos, costo y pedidos de [hoy - hasta, hoy - desde) días, sin cancelados. */
async function ventana(desde: number, hasta: number): Promise<Ventana> {
  const [p, c] = await Promise.all([
    query<{ ingresos: string; pedidos: string }>(
      `select coalesce(sum(total), 0) as ingresos, count(*) as pedidos from public.pedidos
       where estado <> 'Cancelado' and creado_en >= now() - make_interval(days => $2) and creado_en < now() - make_interval(days => $1)`,
      [desde, hasta],
    ),
    query<{ costo: string }>(
      `select coalesce(sum(coalesce(pr.costo, 0) * i.cantidad), 0) as costo
       from public.pedido_items i join public.pedidos p on p.id = i.pedido_id
       left join public.productos pr on pr.id = i.producto_id
       where p.estado <> 'Cancelado' and p.creado_en >= now() - make_interval(days => $2) and p.creado_en < now() - make_interval(days => $1)`,
      [desde, hasta],
    ),
  ]);
  return { ingresos: num(p[0]?.ingresos), costo: num(c[0]?.costo), pedidos: num(p[0]?.pedidos) };
}

const pct = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 1000) / 10 : null);
/** Variación porcentual contra el periodo anterior; null si antes no había nada. */
const variacion = (actual: number, anterior: number) => (anterior > 0 ? Math.round(((actual - anterior) / anterior) * 100) : null);

export type Dashboard = {
  ventasMes: number;
  variacionVentas: number | null;
  pedidosActivos: number;
  enAlistamiento: number;
  enviados: number;
  pendientesPago: number;
  margenPct: number | null;
  variacionMargenPts: number | null;
  listaPendientes: number;
  ventas7Dias: { etiqueta: string; total: number }[];
  masVendidos: { nombre: string; unidades: number }[];
  recientes: { id: string; cliente: string; estado: string }[];
  alertas: string[];
};

export async function dashboard(): Promise<Dashboard> {
  const [actual, anterior, estados, dias, top, recientes, lista, viejosLista, lentos, impagos, stock] = await Promise.all([
    ventana(0, 30),
    ventana(30, 60),
    query<{ estado: string; n: string }>("select estado, count(*) as n from public.pedidos where estado in ('Pendiente de pago', 'Alistamiento', 'Enviado') group by estado"),
    query<{ dia: string; dow: number; total: string }>(
      `select d::text as dia, extract(dow from d)::int as dow, coalesce(sum(p.total), 0) as total
       from generate_series((now() at time zone '${ZONA}')::date - 6, (now() at time zone '${ZONA}')::date, interval '1 day') d
       left join public.pedidos p on (p.creado_en at time zone '${ZONA}')::date = d::date and p.estado <> 'Cancelado'
       group by d order by d`,
    ),
    query<{ nombre: string; unidades: string }>(
      `select i.nombre, sum(i.cantidad) as unidades from public.pedido_items i join public.pedidos p on p.id = i.pedido_id
       where p.estado <> 'Cancelado' group by i.nombre order by 2 desc, 1 limit 3`,
    ),
    query<{ id: string; contacto_nombre: string; estado: string }>("select id, contacto_nombre, estado from public.pedidos order by creado_en desc limit 4"),
    query<{ n: string }>("select count(*) as n from public.lista_compras where estado = 'Pendiente'"),
    query<{ n: string }>("select count(*) as n from public.lista_compras where estado = 'Pendiente' and creada_en < now() - interval '2 days'"),
    query<{ id: string }>(
      `select id from public.pedidos p where estado = 'Alistamiento'
       and coalesce((select max(fecha) from public.pedido_historial h where h.pedido_id = p.id and h.estado = 'Alistamiento'), p.creado_en) < now() - interval '3 days'
       order by creado_en limit 5`,
    ),
    query<{ id: string }>("select id from public.pedidos where estado = 'Pendiente de pago' and creado_en < now() - interval '1 day' order by creado_en limit 5"),
    query<{ agotados: string; bajos: string }>(
      `select count(*) filter (where stock = 0) as agotados, count(*) filter (where stock > 0 and stock <= ${STOCK_BAJO}) as bajos from public.productos where visible`,
    ),
  ]);

  const porEstado = Object.fromEntries(estados.map((e) => [e.estado, num(e.n)]));
  const margenActual = pct(actual.ingresos - actual.costo, actual.ingresos);
  const margenAnterior = pct(anterior.ingresos - anterior.costo, anterior.ingresos);

  const alertas: string[] = [];
  if (num(viejosLista[0]?.n) > 0) alertas.push(`${num(viejosLista[0].n)} ítems de la Lista de Compras llevan más de 2 días sin resolver.`);
  for (const p of lentos) alertas.push(`El pedido #${p.id} lleva más de 3 días en alistamiento — verificar con el proveedor.`);
  for (const p of impagos) alertas.push(`El pedido #${p.id} lleva más de un día sin pago.`);
  if (num(stock[0]?.agotados) > 0) alertas.push(`${num(stock[0].agotados)} producto(s) agotado(s) en el catálogo.`);
  if (num(stock[0]?.bajos) > 0) alertas.push(`${num(stock[0].bajos)} producto(s) con stock bajo (${STOCK_BAJO} o menos).`);

  return {
    ventasMes: actual.ingresos,
    variacionVentas: variacion(actual.ingresos, anterior.ingresos),
    pedidosActivos: num(porEstado["Pendiente de pago"]) + num(porEstado["Alistamiento"]) + num(porEstado["Enviado"]),
    enAlistamiento: num(porEstado["Alistamiento"]),
    enviados: num(porEstado["Enviado"]),
    pendientesPago: num(porEstado["Pendiente de pago"]),
    margenPct: margenActual,
    variacionMargenPts: margenActual !== null && margenAnterior !== null ? Math.round((margenActual - margenAnterior) * 10) / 10 : null,
    listaPendientes: num(lista[0]?.n),
    ventas7Dias: dias.map((d) => ({ etiqueta: DIAS[d.dow], total: num(d.total) })),
    masVendidos: top.map((t) => ({ nombre: t.nombre, unidades: num(t.unidades) })),
    recientes: recientes.map((r) => ({ id: r.id, cliente: r.contacto_nombre, estado: r.estado })),
    alertas,
  };
}

export type Reportes = {
  ingresos: number;
  variacionIngresos: number | null;
  costo: number;
  costoPct: number | null;
  utilidad: number;
  margenPct: number | null;
  ticketPromedio: number | null;
  pedidos: number;
  productosSinCosto: number;
  semanas: { etiqueta: string; ingresos: number; costo: number }[];
  categorias: { nombre: string; porcentaje: number }[];
  mejorMargen: { nombre: string; margenPct: number }[];
  proveedores: { nombre: string; total: number }[];
};

const CATEGORIAS: Record<string, string> = { europeo: "Clubes europeos", colombiano: "Fútbol colombiano", seleccion: "Selecciones y otros" };

export async function reportes(): Promise<Reportes> {
  const [actual, anterior, semanas, costosSemana, categorias, margen, proveedores, sinCosto] = await Promise.all([
    ventana(0, 30),
    ventana(30, 60),
    query<{ semana: string; ingresos: string }>(
      `select s::date::text as semana, coalesce(sum(p.total), 0) as ingresos
       from generate_series(date_trunc('week', now() at time zone '${ZONA}') - interval '49 days', date_trunc('week', now() at time zone '${ZONA}'), interval '1 week') s
       left join public.pedidos p on date_trunc('week', p.creado_en at time zone '${ZONA}') = s and p.estado <> 'Cancelado'
       group by s order by s`,
    ),
    query<{ semana: string; costo: string }>(
      `select date_trunc('week', p.creado_en at time zone '${ZONA}')::date::text as semana, sum(coalesce(pr.costo, 0) * i.cantidad) as costo
       from public.pedido_items i join public.pedidos p on p.id = i.pedido_id left join public.productos pr on pr.id = i.producto_id
       where p.estado <> 'Cancelado' group by 1`,
    ),
    query<{ categoria: string | null; total: string }>(
      `select pr.categoria, sum(i.precio_unitario * i.cantidad) as total
       from public.pedido_items i join public.pedidos p on p.id = i.pedido_id left join public.productos pr on pr.id = i.producto_id
       where p.estado <> 'Cancelado' and p.creado_en >= now() - interval '30 days' group by 1`,
    ),
    query<{ nombre: string; precio: number; costo: number }>(
      "select nombre, precio, costo from public.productos where costo is not null and precio > 0 order by (precio - costo)::float / precio desc, nombre limit 4",
    ),
    query<{ proveedor: string; total: string }>(
      "select proveedor, sum(cantidad * costo_unitario) as total from public.compras group by proveedor order by 2 desc, 1 limit 4",
    ),
    query<{ n: string }>("select count(*) as n from public.productos where costo is null and visible"),
  ]);

  const costoPorSemana = new Map(costosSemana.map((c) => [c.semana, num(c.costo)]));
  const totalCat = categorias.reduce((s, c) => s + num(c.total), 0);

  return {
    ingresos: actual.ingresos,
    variacionIngresos: variacion(actual.ingresos, anterior.ingresos),
    costo: actual.costo,
    costoPct: pct(actual.costo, actual.ingresos),
    utilidad: actual.ingresos - actual.costo,
    margenPct: pct(actual.ingresos - actual.costo, actual.ingresos),
    ticketPromedio: actual.pedidos > 0 ? Math.round(actual.ingresos / actual.pedidos) : null,
    pedidos: actual.pedidos,
    productosSinCosto: num(sinCosto[0]?.n),
    semanas: semanas.map((s, i) => ({ etiqueta: `S${i + 1}`, ingresos: num(s.ingresos), costo: costoPorSemana.get(s.semana) ?? 0 })),
    categorias: categorias
      .map((c) => ({ nombre: CATEGORIAS[c.categoria ?? ""] ?? "Otros", porcentaje: Math.round((num(c.total) / totalCat) * 100) }))
      .sort((a, b) => b.porcentaje - a.porcentaje),
    mejorMargen: margen.map((m) => ({ nombre: m.nombre, margenPct: Math.round(((m.precio - m.costo) / m.precio) * 100) })),
    proveedores: proveedores.map((p) => ({ nombre: p.proveedor, total: num(p.total) })),
  };
}

const csv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Todos los pedidos en CSV (con ; y BOM: Excel en español lo abre directo). */
export async function exportarPedidosCsv(): Promise<string> {
  const filas = await query(
    `select p.*, (select string_agg(i.cantidad || 'x ' || i.nombre || ' (' || i.talla || ')', ' | ' order by i.orden) from public.pedido_items i where i.pedido_id = p.id) as articulos
     from public.pedidos p order by p.creado_en desc`,
  );
  const cab = ["Pedido", "Fecha", "Cliente", "Canal", "Ciudad", "Estado", "Medio de pago", "Estado del pago", "Subtotal", "Envío", "Descuento", "Total", "Guía", "Artículos"];
  const lineas = filas.map((r) =>
    [r.id, (r.creado_en as Date).toISOString(), r.contacto_nombre, r.canal, r.ciudad, r.estado, r.medio_pago, r.estado_pago, r.subtotal, r.envio, r.descuento, r.total, r.guia, r.articulos]
      .map(csv)
      .join(";"),
  );
  return `﻿${[cab.map(csv).join(";"), ...lineas].join("\r\n")}\r\n`;
}

/** Fuentes del Informe con IA: los datos reales del sistema. */
export async function fuentesDelSistema(): Promise<FuentesNegocio> {
  const [pedidos, inventario, lista, catalogo] = await Promise.all([
    query(
      `select p.id, p.total, p.estado_pago, p.estado, coalesce((select sum(cantidad) from public.pedido_items i where i.pedido_id = p.id), 0) as items
       from public.pedidos p order by p.creado_en desc limit 500`,
    ),
    query("select id, nombre, proveedor, costo, precio, stock from public.productos order by nombre"),
    query("select producto, variante, origen, estado from public.lista_compras order by creada_en desc limit 200"),
    query("select club, categoria, retro from public.productos where visible"),
  ]);
  return {
    fuente: "sistema",
    pedidos: pedidos.map((p) => ({ id: p.id as string, items: num(p.items), total: p.total as number, pago: p.estado_pago as string, estado: p.estado as string })),
    inventario: inventario.map((p) => ({
      nombre: p.nombre as string,
      sku: `CF-${p.id}`,
      proveedor: (p.proveedor as string) || "Sin proveedor",
      costo: (p.costo as number | null) ?? 0,
      precio: p.precio as number,
      stock: p.stock as number,
    })),
    listaCompras: lista.map((i) => ({ producto: i.producto as string, variante: i.variante as string, origen: i.origen as string, estado: i.estado as string })),
    catalogo: catalogo.map((c) => ({ club: c.club as string, categoria: c.categoria as string, retro: c.retro as boolean })),
  };
}

import { query, transaccion } from "@/lib/db";
import {
  NoEncontradoError,
  OperacionInvalidaError,
  margenPct,
  skuDe,
  type CambiosInventario,
  type CompraNueva,
  type FilaInventario,
} from "@/modules/operacion/domain/operacion";

/** Inventario y compras a proveedores en PostgreSQL (Supabase). Solo lo ve el personal. */

type Fila = Record<string, unknown>;

const aFila = (r: Fila): FilaInventario => {
  const costo = (r.costo as number | null) ?? null;
  const precio = r.precio as number;
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    sku: skuDe(r.id as string),
    proveedor: (r.proveedor as string) ?? "",
    costo,
    precio,
    margenPct: margenPct(precio, costo),
    stock: r.stock as number,
  };
};

export type ResumenInventario = {
  unidades: number;
  pendientesPorConseguir: number;
  proveedores: number;
  costoPromedio: number | null;
};

export async function listarInventario(): Promise<{ productos: FilaInventario[]; resumen: ResumenInventario; proveedores: string[] }> {
  const [filas, pendientes] = await Promise.all([
    query("select id, nombre, proveedor, costo, precio, stock from public.productos order by nombre"),
    query<{ n: string }>("select count(*) as n from public.lista_compras where estado = 'Pendiente'"),
  ]);
  const productos = filas.map(aFila);
  const proveedores = [...new Set(productos.map((p) => p.proveedor).filter(Boolean))].sort();
  const conCosto = productos.filter((p) => p.costo !== null && p.stock > 0);
  const unidadesConCosto = conCosto.reduce((s, p) => s + p.stock, 0);
  return {
    productos,
    proveedores,
    resumen: {
      unidades: productos.reduce((s, p) => s + p.stock, 0),
      pendientesPorConseguir: Number(pendientes[0]?.n ?? 0),
      proveedores: proveedores.length,
      // Costo promedio ponderado por unidades en stock, solo de productos con costo registrado.
      costoPromedio: unidadesConCosto > 0 ? Math.round(conCosto.reduce((s, p) => s + (p.costo as number) * p.stock, 0) / unidadesConCosto) : null,
    },
  };
}

export async function actualizarInventario(id: string, cambios: CambiosInventario): Promise<FilaInventario> {
  const columnas: Record<string, string> = { costo: "costo", stock: "stock", proveedor: "proveedor" };
  const campos = Object.entries(cambios).filter(([k, v]) => k in columnas && v !== undefined);
  const set = campos.map(([k], i) => `${columnas[k]} = $${i + 2}`).join(", ");
  const r = await query(
    `update public.productos set ${set} where id = $1 returning id, nombre, proveedor, costo, precio, stock`,
    [id, ...campos.map(([, v]) => v)],
  );
  if (!r[0]) throw new NoEncontradoError("ese producto");
  return aFila(r[0]);
}

export type CompraRegistrada = { id: number; producto: string; cantidad: number; costoUnitario: number; proveedor: string; stockResultante: number };

/**
 * Registra una compra: suma las unidades al stock y deja su costo y proveedor como los vigentes del
 * producto. Si resuelve un ítem de la lista de compras, lo marca «Conseguido»; las unidades de ese
 * ítem ya se vendieron, así que solo lo que sobra entra a bodega.
 */
export async function registrarCompra(c: CompraNueva): Promise<CompraRegistrada> {
  return transaccion(async (cx) => {
    const p = (await cx.query("select id, nombre from public.productos where id = $1 for update", [c.productoId])).rows[0];
    if (!p) throw new NoEncontradoError("ese producto");

    let aBodega = c.cantidad;
    let item: Fila | undefined;
    if (c.listaId !== null) {
      item = (await cx.query("select * from public.lista_compras where id = $1 for update", [c.listaId])).rows[0];
      if (!item) throw new NoEncontradoError("ese ítem de la lista de compras");
      if (item.estado !== "Pendiente") throw new OperacionInvalidaError({ listaId: "Ese ítem ya no está pendiente" });
      if (item.producto_id !== c.productoId) throw new OperacionInvalidaError({ listaId: "El ítem de la lista es de otro producto" });
      aBodega = Math.max(0, c.cantidad - (item.cantidad as number));
    }

    const compra = (
      await cx.query(
        "insert into public.compras (producto_id, producto, proveedor, cantidad, costo_unitario, nota) values ($1,$2,$3,$4,$5,$6) returning id",
        [c.productoId, p.nombre, c.proveedor, c.cantidad, c.costoUnitario, c.nota],
      )
    ).rows[0];
    const stock = (
      await cx.query(
        "update public.productos set stock = stock + $2, costo = $3, proveedor = $4 where id = $1 returning stock",
        [c.productoId, aBodega, c.costoUnitario, c.proveedor],
      )
    ).rows[0];
    if (item) {
      await cx.query(
        "update public.lista_compras set estado = 'Conseguido', nota = $2, compra_id = $3, actualizada_en = now() where id = $1",
        [c.listaId, `Compra #${compra.id} registrada`, compra.id],
      );
    }
    return {
      id: Number(compra.id),
      producto: p.nombre as string,
      cantidad: c.cantidad,
      costoUnitario: c.costoUnitario,
      proveedor: c.proveedor,
      stockResultante: stock.stock as number,
    };
  });
}

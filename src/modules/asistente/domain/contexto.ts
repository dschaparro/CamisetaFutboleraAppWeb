import type { FuenteDatos, FuentesNegocio } from "@/modules/operacion/domain/fuentes";

export type { FuentesNegocio };

/** Cifras ya calculadas: el modelo redacta, pero no hace las cuentas. */
export type ContextoNegocio = {
  fechaActual: string;
  fuente: FuenteDatos;
  nota: string;
  ventas: {
    totalPedidos: number;
    ingresosTotalesCOP: number;
    unidadesVendidas: number;
    ticketPromedioCOP: number;
    pedidosPorEstado: Record<string, number>;
    pedidosPorPago: Record<string, number>;
  };
  inventario: {
    productos: {
      nombre: string;
      sku: string;
      proveedor: string;
      costoCOP: number;
      precioCOP: number;
      margenPct: number;
      stock: number;
    }[];
    margenPromedioPct: number;
    productosAgotados: string[];
    productosStockBajo: string[];
  };
  listaCompras: {
    total: number;
    pendientes: number;
    conseguidos: number;
    noConseguidos: number;
    itemsPendientes: { producto: string; variante: string; origen: string }[];
  };
  catalogo: {
    totalReferencias: number;
    porCategoria: Record<string, number>;
    referenciasRetro: number;
  };
};

const STOCK_BAJO = 5;

const NOTA_EJEMPLO =
  "Datos de ejemplo del prototipo: no traen fechas, así que no hay comparación entre meses ni series de tiempo. " +
  "No inventes cifras, porcentajes ni variaciones que no aparezcan aquí.";

const NOTA_SISTEMA = "Datos del sistema. No inventes cifras que no aparezcan aquí.";

function contar<T>(items: T[], clave: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = clave(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function redondear(n: number, decimales = 1): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

export function margenPct(costo: number, precio: number): number {
  if (precio <= 0) return 0;
  return redondear(((precio - costo) / precio) * 100);
}

export function construirContexto(f: FuentesNegocio, ahora: Date): ContextoNegocio {
  const ingresos = f.pedidos.reduce((acc, p) => acc + p.total, 0);
  const unidades = f.pedidos.reduce((acc, p) => acc + p.items, 0);

  const productos = f.inventario.map((p) => ({
    nombre: p.nombre,
    sku: p.sku,
    proveedor: p.proveedor,
    costoCOP: p.costo,
    precioCOP: p.precio,
    margenPct: margenPct(p.costo, p.precio),
    stock: p.stock,
  }));

  const margenProm =
    productos.length === 0 ? 0 : redondear(productos.reduce((acc, p) => acc + p.margenPct, 0) / productos.length);

  const pendientes = f.listaCompras.filter((i) => i.estado === "Pendiente");

  return {
    fechaActual: ahora.toISOString().slice(0, 10),
    fuente: f.fuente,
    nota: f.fuente === "ejemplo" ? NOTA_EJEMPLO : NOTA_SISTEMA,
    ventas: {
      totalPedidos: f.pedidos.length,
      ingresosTotalesCOP: ingresos,
      unidadesVendidas: unidades,
      ticketPromedioCOP: f.pedidos.length === 0 ? 0 : Math.round(ingresos / f.pedidos.length),
      pedidosPorEstado: contar(f.pedidos, (p) => p.estado),
      pedidosPorPago: contar(f.pedidos, (p) => p.pago),
    },
    inventario: {
      productos,
      margenPromedioPct: margenProm,
      productosAgotados: productos.filter((p) => p.stock === 0).map((p) => p.nombre),
      productosStockBajo: productos.filter((p) => p.stock > 0 && p.stock <= STOCK_BAJO).map((p) => p.nombre),
    },
    listaCompras: {
      total: f.listaCompras.length,
      pendientes: pendientes.length,
      conseguidos: f.listaCompras.filter((i) => i.estado === "Conseguido").length,
      noConseguidos: f.listaCompras.filter((i) => i.estado === "No conseguido").length,
      itemsPendientes: pendientes.map((i) => ({ producto: i.producto, variante: i.variante, origen: i.origen })),
    },
    catalogo: {
      totalReferencias: f.catalogo.length,
      porCategoria: contar(f.catalogo, (p) => p.categoria),
      referenciasRetro: f.catalogo.filter((p) => p.retro).length,
    },
  };
}

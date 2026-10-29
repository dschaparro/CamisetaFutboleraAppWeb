import { PRODUCTS } from "@/data/products";
import { usarSimulacion } from "@/lib/modo-datos";
import type { PedidosRepo } from "@/modules/pedidos/application/puertos";
import { pedidosPg } from "@/modules/pedidos/infrastructure/pedidos-pg";
import type { Pedido, ProductoVenta } from "@/modules/pedidos/domain/types";
import { catalogoVendible } from "@/modules/tienda/application/tienda";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";
import { CLIENTE_DEMO_ID } from "@/modules/identidad/infrastructure/simulacion";

export type { PedidosRepo };

/** Catálogo con precios para armar pedidos (la tabla productos de la tienda). */
export async function catalogoVenta(): Promise<ProductoVenta[]> {
  return (await catalogoVendible(tiendaRepo())).map((p) => ({
    slug: p.id,
    nombre: p.nombre,
    precio: p.precioFinal,
    personalizable: p.personalizable,
  }));
}

const LAURA = { nombre: "Laura Ramírez", email: "laura@demo.co", telefono: "3001234567" };
const BOGOTA = { ciudad: "Bogotá", direccion: "Cra 45 # 12-30, Apto 301" };

function item(slug: string, talla: string, cantidad: number, personalizacion = "Sin personalización", manga = "Corta") {
  const p = PRODUCTS.find((x) => x.id === slug)!;
  return { nombre: p.name, slug, talla, manga, personalizacion, cantidad, precioUnitario: p.price };
}

function demo(
  base: Omit<Pedido, "subtotal" | "envio" | "descuento" | "total" | "claveAcceso" | "guia"> & { guia?: string },
): Pedido {
  const subtotal = base.items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);
  return { ...base, claveAcceso: `demo-${base.id}`, guia: base.guia ?? null, subtotal, envio: 18000, descuento: 0, total: subtotal + 18000 };
}

const h = (estado: Pedido["estado"], fecha: string, nota?: string) => ({ estado, fecha, ...(nota ? { nota } : {}) });

/** Pedidos de prueba: el historial de Laura y otros clientes para el panel. */
function sembrar(): Pedido[] {
  return [
    demo({
      id: "CF-00842", clienteId: CLIENTE_DEMO_ID, contacto: LAURA, ...BOGOTA, creadoEn: "2026-10-03T16:20:00.000Z",
      estado: "Alistamiento", medioPago: "Tarjeta / PSE (Wompi)", estadoPago: "Pagado",
      historial: [h("Pendiente de pago", "2026-10-03T16:20:00.000Z"), h("Alistamiento", "2026-10-03T16:24:00.000Z", "Pago aprobado")],
      items: [item("RM-27T", "M", 2, '"RAMÍREZ" #7'), item("SEL-27L", "S", 1)],
    }),
    demo({
      id: "CF-00841", clienteId: null, contacto: { nombre: "Andrés Pérez", email: "andres@correo.co", telefono: "3157778899" },
      ciudad: "Medellín", direccion: "Cl 10 # 43-20", creadoEn: "2026-10-02T21:10:00.000Z",
      estado: "Enviado", medioPago: "Tarjeta / PSE (Wompi)", estadoPago: "Pagado", guia: "SERVI-4519833",
      historial: [h("Pendiente de pago", "2026-10-02T21:10:00.000Z"), h("Alistamiento", "2026-10-02T21:11:00.000Z"), h("Enviado", "2026-10-03T15:00:00.000Z")],
      items: [item("PSG-27T", "L", 1)],
    }),
    demo({
      id: "CF-00840", clienteId: null, contacto: { nombre: "Camila Ruiz", email: "camila@correo.co", telefono: "3204445566" },
      ciudad: "Bogotá", direccion: "Av 68 # 22-10", creadoEn: "2026-09-29T14:00:00.000Z",
      estado: "Entregado", medioPago: "Contra entrega", estadoPago: "Pagado", guia: "SERVI-4488120",
      historial: [h("Pendiente de pago", "2026-09-29T14:00:00.000Z"), h("Alistamiento", "2026-09-29T14:00:00.000Z"), h("Enviado", "2026-09-30T10:00:00.000Z"), h("Entregado", "2026-10-01T16:30:00.000Z")],
      items: [item("ATN-26T", "M", 1, "Parche de liga"), item("MFC-26T", "S", 1)],
    }),
    demo({
      id: "CF-00838", clienteId: null, contacto: { nombre: "Julián Torres", email: "julian@correo.co", telefono: "3016667788" },
      ciudad: "Cali", direccion: "Cra 100 # 5-30", creadoEn: "2026-09-27T18:45:00.000Z",
      estado: "Alistamiento", medioPago: "Abono + saldo contra entrega", estadoPago: "Abono 50%",
      historial: [h("Pendiente de pago", "2026-09-27T18:45:00.000Z"), h("Alistamiento", "2026-09-27T18:47:00.000Z", "Pago aprobado")],
      items: [item("MCI-27T", "XL", 1, '"HAALAND" #9')],
    }),
    demo({
      id: "CF-00837", clienteId: null, contacto: { nombre: "María Gómez", email: "maria@correo.co", telefono: "3112223344" },
      ciudad: "Bogotá", direccion: "Cl 80 # 15-12", creadoEn: "2026-09-26T12:30:00.000Z",
      estado: "Pendiente de pago", medioPago: "Tarjeta / PSE (Wompi)", estadoPago: "Pendiente",
      historial: [h("Pendiente de pago", "2026-09-26T12:30:00.000Z"), h("Pendiente de pago", "2026-09-26T12:32:00.000Z", "Pago rechazado")],
      items: [item("FCB-27V", "M", 2)],
    }),
    demo({
      id: "CF-00811", clienteId: CLIENTE_DEMO_ID, contacto: LAURA, ...BOGOTA, creadoEn: "2026-08-21T19:05:00.000Z",
      estado: "Entregado", medioPago: "Contra entrega", estadoPago: "Pagado", guia: "SERVI-4471029",
      historial: [h("Pendiente de pago", "2026-08-21T19:05:00.000Z"), h("Alistamiento", "2026-08-21T19:07:00.000Z"), h("Enviado", "2026-08-22T14:30:00.000Z"), h("Entregado", "2026-08-23T17:10:00.000Z")],
      items: [item("MFC-26T", "M", 1, "Parche de liga", "Larga")],
    }),
    demo({
      id: "CF-00765", clienteId: CLIENTE_DEMO_ID, contacto: LAURA, ...BOGOTA, creadoEn: "2026-06-02T13:40:00.000Z",
      estado: "Entregado", medioPago: "Tarjeta / PSE (Wompi)", estadoPago: "Pagado", guia: "SERVI-3920114",
      historial: [h("Pendiente de pago", "2026-06-02T13:40:00.000Z"), h("Alistamiento", "2026-06-02T13:41:00.000Z"), h("Enviado", "2026-06-03T10:15:00.000Z"), h("Entregado", "2026-06-04T12:00:00.000Z")],
      items: [item("BAY-99R", "L", 1)],
    }),
  ];
}

// En globalThis para sobrevivir a la recarga en caliente de `npm run dev`.
const global = globalThis as typeof globalThis & { __cfSimPedidos?: Pedido[] };
function store(): Pedido[] {
  global.__cfSimPedidos ??= sembrar();
  return global.__cfSimPedidos;
}

const porFecha = (a: Pedido, b: Pedido) => b.creadoEn.localeCompare(a.creadoEn);

const pedidosSimulados: PedidosRepo = {
  async listarTodos() {
    return [...store()].sort(porFecha);
  },
  async listarPorCliente(clienteId) {
    return store().filter((p) => p.clienteId === clienteId).sort(porFecha);
  },
  async buscar(id) {
    return store().find((p) => p.id === id) ?? null;
  },
  async guardar(pedido) {
    const lista = store();
    const i = lista.findIndex((p) => p.id === pedido.id);
    if (i >= 0) lista[i] = pedido;
    else lista.push(pedido);
  },
};

/** Pedidos: simulación (DATOS_SIMULADOS=true) o Supabase. */
export function pedidosRepo(): PedidosRepo {
  return usarSimulacion() ? pedidosSimulados : pedidosPg;
}

/** Pedidos de ejemplo, para cargarlos en la base (script db:sembrar). */
export const pedidosDeEjemplo = sembrar;

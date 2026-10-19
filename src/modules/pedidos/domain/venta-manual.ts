import { ENVIO_COP, PedidoInvalidoError, validarPedidoNuevo } from "@/modules/pedidos/domain/pedido";
import type { Pedido, ProductoVenta } from "@/modules/pedidos/domain/types";

/** Ventas que registra el personal por fuera de la tienda web. */

export const CANALES_VENTA = ["WhatsApp", "Redes sociales", "Punto físico"] as const;
export type CanalVenta = (typeof CANALES_VENTA)[number];

export const MODOS_PAGO_MANUAL = {
  anticipado: { etiqueta: "Pago anticipado", estadoPago: "Pagado" },
  abono: { etiqueta: "Abono 50 % + saldo contra entrega", estadoPago: "Abono 50%" },
  contraentrega: { etiqueta: "Contra entrega", estadoPago: "Pendiente" },
} as const;
export type ModoPagoManual = keyof typeof MODOS_PAGO_MANUAL;

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Envío de una venta manual: en el punto físico el cliente recoge y no se cobra. */
export const envioDe = (canal: CanalVenta) => (canal === "Punto físico" ? 0 : ENVIO_COP);

/**
 * Valida el formulario de «Registrar venta manual». Los precios salen del catálogo (nunca del
 * formulario). El correo es opcional; en el punto físico no hace falta dirección.
 */
export function validarVentaManual(raw: unknown, catalogo: ProductoVenta[]) {
  if (!esObjeto(raw)) throw new PedidoInvalidoError({ venta: "Datos de la venta inválidos" });
  const errores: Record<string, string> = {};

  const canal = raw.canal;
  if (!(CANALES_VENTA as readonly unknown[]).includes(canal)) errores.canal = "Elige el canal de la venta";
  const modo = raw.modoPago;
  if (typeof modo !== "string" || !(modo in MODOS_PAGO_MANUAL)) errores.modoPago = "Elige cómo se paga";

  const documento = typeof raw.documento === "string" ? raw.documento.replace(/[\s.\-]/g, "") : "";
  if (documento !== "" && !/^\d{5,12}$/.test(documento)) errores.documento = "La cédula debe tener entre 5 y 12 dígitos";

  const enPunto = canal === "Punto físico";
  const base = {
    ...raw,
    // El validador del checkout pide medio de pago, dirección y ciudad: aquí se completan.
    medioPago: "contraentrega",
    direccion: enPunto && !String(raw.direccion ?? "").trim() ? "Entrega en punto físico" : raw.direccion,
    ciudad: enPunto && !String(raw.ciudad ?? "").trim() ? "Punto físico" : raw.ciudad,
  };
  let datos: ReturnType<typeof validarPedidoNuevo> | null = null;
  try {
    datos = validarPedidoNuevo(base, catalogo, { emailOpcional: true });
  } catch (e) {
    if (!(e instanceof PedidoInvalidoError)) throw e;
    Object.assign(errores, e.campos);
    delete errores.medioPago;
  }
  if (Object.keys(errores).length > 0 || !datos) throw new PedidoInvalidoError(errores);
  return { datos, canal: canal as CanalVenta, modo: modo as ModoPagoManual, documento: documento || null };
}

/**
 * La venta manual entra directo a «Alistamiento» (quien la registra ya habló con el cliente);
 * el estado del pago depende de cómo se acordó.
 */
export function armarVentaManual(
  v: ReturnType<typeof validarVentaManual>,
  id: string,
  ahora: Date,
  claveAcceso: string,
): Pedido {
  const subtotal = v.datos.items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);
  const envio = envioDe(v.canal);
  const fecha = ahora.toISOString();
  const pago = MODOS_PAGO_MANUAL[v.modo];
  return {
    id,
    clienteId: null,
    claveAcceso,
    contacto: v.datos.contacto,
    creadoEn: fecha,
    estado: "Alistamiento",
    historial: [
      { estado: "Pendiente de pago", fecha },
      { estado: "Alistamiento", fecha, nota: `Venta manual por ${v.canal}` },
    ],
    medioPago: pago.etiqueta,
    estadoPago: pago.estadoPago,
    ciudad: v.datos.ciudad,
    direccion: v.datos.direccion,
    items: v.datos.items,
    subtotal,
    envio,
    descuento: 0,
    total: subtotal + envio,
    guia: null,
    canal: v.canal,
    documento: v.documento,
  };
}

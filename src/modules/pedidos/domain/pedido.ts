import {
  MANGAS,
  MEDIOS_PAGO,
  TALLAS,
  type EstadoPedido,
  type ItemPedido,
  type MedioPago,
  type Pedido,
  type ProductoVenta,
} from "@/modules/pedidos/domain/types";

/** Valor fijo del envío que hoy muestra el checkout. */
export const ENVIO_COP = 18000;
const MAX_ITEMS = 20;
const MAX_CANTIDAD = 10;

export class PedidoInvalidoError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos del pedido inválidos");
    this.name = "PedidoInvalidoError";
    this.campos = campos;
  }
}

export class TransicionInvalidaError extends Error {
  constructor(desde: EstadoPedido, hacia: EstadoPedido) {
    super(`Un pedido en «${desde}» no puede pasar a «${hacia}»`);
    this.name = "TransicionInvalidaError";
  }
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

export type PedidoNuevo = {
  contacto: { nombre: string; email: string; telefono: string };
  direccion: string;
  ciudad: string;
  medioPago: MedioPago;
  items: ItemPedido[];
};

/**
 * Valida lo que manda el checkout. Los precios y nombres se toman del catálogo
 * (`catalogo`), no del navegador: así nadie cambia un precio desde el carrito.
 */
export function validarPedidoNuevo(raw: unknown, catalogo: ProductoVenta[], opciones: { emailOpcional?: boolean } = {}): PedidoNuevo {
  if (!esObjeto(raw)) throw new PedidoInvalidoError({ pedido: "Datos del pedido inválidos" });
  const errores: Record<string, string> = {};

  const nombre = texto(raw.nombre);
  if (nombre.length < 3) errores.nombre = "Escribe el nombre de quien recibe";
  const email = texto(raw.email).toLowerCase();
  const sinCorreoPermitido = opciones.emailOpcional === true && email === "";
  if (!sinCorreoPermitido && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) errores.email = "Escribe un correo válido";
  const telefono = texto(raw.telefono).replace(/[\s()+-]/g, "").replace(/^57(?=\d{10}$)/, "");
  if (!/^\d{7,10}$/.test(telefono)) errores.telefono = "Escribe un celular válido";
  const direccion = texto(raw.direccion);
  if (direccion.length < 5) errores.direccion = "Escribe la dirección completa";
  const ciudad = texto(raw.ciudad);
  if (ciudad.length < 3) errores.ciudad = "Escribe la ciudad";
  const medioPago = raw.medioPago;
  if (typeof medioPago !== "string" || !(medioPago in MEDIOS_PAGO)) errores.medioPago = "Elige un medio de pago";

  const items: ItemPedido[] = [];
  if (!Array.isArray(raw.items) || raw.items.length === 0) {
    errores.items = "Tu carrito está vacío";
  } else if (raw.items.length > MAX_ITEMS) {
    errores.items = `Máximo ${MAX_ITEMS} productos por pedido`;
  } else {
    for (const it of raw.items) {
      const producto = esObjeto(it) ? catalogo.find((p) => p.slug === it.slug) : undefined;
      const cantidad = esObjeto(it) ? it.cantidad : null;
      const talla = esObjeto(it) ? it.talla : null;
      const manga = esObjeto(it) ? it.manga : null;
      if (!producto) {
        errores.items = "Uno de los productos ya no está disponible. Revisa tu carrito.";
        break;
      }
      if (typeof cantidad !== "number" || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
        errores.items = `La cantidad de cada producto debe estar entre 1 y ${MAX_CANTIDAD}`;
        break;
      }
      if (!(TALLAS as readonly unknown[]).includes(talla) || !(MANGAS as readonly unknown[]).includes(manga)) {
        errores.items = "Talla o manga inválida en el carrito";
        break;
      }
      const personalizacion = producto.personalizable ? texto((it as Record<string, unknown>).personalizacion).slice(0, 80) : "";
      items.push({
        nombre: producto.nombre,
        slug: producto.slug,
        talla: talla as string,
        manga: manga as string,
        personalizacion: personalizacion || "Sin personalización",
        cantidad,
        precioUnitario: producto.precio,
      });
    }
  }

  if (Object.keys(errores).length > 0) throw new PedidoInvalidoError(errores);
  return { contacto: { nombre, email, telefono }, direccion, ciudad, medioPago: medioPago as MedioPago, items };
}

/** ¿Este medio de pago pasa por la pasarela en línea antes de alistar? */
export function requierePasarela(medio: MedioPago): boolean {
  return medio === "pasarela" || medio === "abono";
}

/** Lo que se cobra en la pasarela: todo, o el 50 % si es abono. */
export function montoACobrar(pedido: Pedido): number {
  return pedido.medioPago === MEDIOS_PAGO.abono ? Math.round(pedido.total / 2) : pedido.total;
}

/**
 * Arma el pedido con totales calculados en el servidor.
 * Contra entrega pasa directo a alistamiento; tarjeta/PSE y abono quedan
 * «Pendiente de pago» hasta que la pasarela (simulada) apruebe el pago.
 */
export function armarPedido(
  datos: PedidoNuevo,
  id: string,
  clienteId: string | null,
  ahora: Date,
  claveAcceso: string,
  /** Descuento por cupón (ya validado), en pesos. */
  descuento = 0,
): Pedido {
  const subtotal = datos.items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);
  const desc = Math.max(0, Math.min(descuento, subtotal));
  const fecha = ahora.toISOString();
  const enLinea = requierePasarela(datos.medioPago);
  return {
    id,
    clienteId,
    claveAcceso,
    contacto: datos.contacto,
    creadoEn: fecha,
    estado: enLinea ? "Pendiente de pago" : "Alistamiento",
    historial: enLinea
      ? [{ estado: "Pendiente de pago", fecha }]
      : [
          { estado: "Pendiente de pago", fecha },
          { estado: "Alistamiento", fecha, nota: "Pago contra entrega" },
        ],
    medioPago: MEDIOS_PAGO[datos.medioPago],
    estadoPago: "Pendiente",
    ciudad: datos.ciudad,
    direccion: datos.direccion,
    items: datos.items,
    subtotal,
    envio: ENVIO_COP,
    descuento: desc,
    total: subtotal - desc + ENVIO_COP,
    guia: null,
  };
}

export class PagoNoPermitidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PagoNoPermitidoError";
  }
}

/**
 * Resultado de la pasarela (simulada). Aprobado: queda pagado (o con abono) y
 * pasa a alistamiento. Rechazado: sigue pendiente y se puede reintentar.
 */
export function registrarPago(pedido: Pedido, aprobado: boolean, referencia: string, ahora: Date): Pedido {
  if (pedido.estado !== "Pendiente de pago") {
    throw new PagoNoPermitidoError("Este pedido ya no tiene pagos pendientes");
  }
  const fecha = ahora.toISOString();
  if (!aprobado) {
    return {
      ...pedido,
      historial: [...pedido.historial, { estado: "Pendiente de pago", fecha, nota: `Pago rechazado (${referencia})` }],
    };
  }
  const esAbono = pedido.medioPago === MEDIOS_PAGO.abono;
  return {
    ...pedido,
    estado: "Alistamiento",
    estadoPago: esAbono ? "Abono 50%" : "Pagado",
    historial: [...pedido.historial, { estado: "Alistamiento", fecha, nota: `Pago aprobado (${referencia})` }],
  };
}

/** CF-00842 → CF-00843. */
export function siguienteId(existentes: string[]): string {
  const max = existentes.reduce((m, id) => Math.max(m, Number(/^CF-(\d+)$/.exec(id)?.[1] ?? 0)), 0);
  return `CF-${String(max + 1).padStart(5, "0")}`;
}

/** Qué estados siguen a cada uno. Entregado y Cancelado son finales. */
export const SIGUIENTES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  "Pendiente de pago": ["Alistamiento", "Cancelado"],
  Alistamiento: ["Enviado", "Cancelado"],
  Enviado: ["Entregado"],
  Entregado: [],
  Cancelado: [],
};

/** Cambia el estado registrando el historial. Al marcar Enviado se puede guardar la guía. */
export function cambiarEstado(pedido: Pedido, hacia: EstadoPedido, ahora: Date, guia?: string | null): Pedido {
  if (!SIGUIENTES[pedido.estado].includes(hacia)) throw new TransicionInvalidaError(pedido.estado, hacia);
  const guiaLimpia = typeof guia === "string" ? guia.trim().slice(0, 40) : "";
  return {
    ...pedido,
    estado: hacia,
    historial: [...pedido.historial, { estado: hacia, fecha: ahora.toISOString() }],
    guia: hacia === "Enviado" && guiaLimpia ? guiaLimpia : pedido.guia,
    // Contra entrega: al entregar ya se cobró todo.
    estadoPago: hacia === "Entregado" ? "Pagado" : pedido.estadoPago,
  };
}

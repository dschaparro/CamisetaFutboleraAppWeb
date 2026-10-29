export const ESTADOS_PEDIDO = ["Pendiente de pago", "Alistamiento", "Enviado", "Entregado", "Cancelado"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const MEDIOS_PAGO = {
  pasarela: "Tarjeta / PSE / Nequi (Mercado Pago)",
  contraentrega: "Contra entrega",
  abono: "Abono + saldo contra entrega",
} as const;
export type MedioPago = keyof typeof MEDIOS_PAGO;

export type EstadoPago = "Pagado" | "Abono 50%" | "Pendiente";

export const TALLAS = ["S", "M", "L", "XL"] as const;
export const MANGAS = ["Corta", "Larga"] as const;

export type ItemPedido = {
  nombre: string;
  /** Ruta del producto en la tienda (/producto/<slug>), si sigue disponible. */
  slug: string | null;
  talla: string;
  manga: string;
  personalizacion: string;
  cantidad: number;
  precioUnitario: number;
};

export type HistorialEstado = { estado: EstadoPedido; fecha: string; nota?: string };

export type ContactoPedido = { nombre: string; email: string; telefono: string };

export type Pedido = {
  id: string;
  clienteId: string | null;
  /** Clave aleatoria para ver/pagar el pedido sin cuenta (va en el enlace de pago). */
  claveAcceso: string;
  contacto: ContactoPedido;
  creadoEn: string;
  estado: EstadoPedido;
  /** Cómo cambió de estado, del más antiguo al más reciente. */
  historial: HistorialEstado[];
  medioPago: string;
  estadoPago: EstadoPago;
  ciudad: string;
  direccion: string;
  items: ItemPedido[];
  subtotal: number;
  envio: number;
  descuento: number;
  total: number;
  guia: string | null;
  /** Por dónde entró la venta: Web (tienda), WhatsApp, Redes sociales o Punto físico. */
  canal?: string;
  /** Documento del comprador (ventas manuales). */
  documento?: string | null;
};

/** Pasos que ve el cliente en la línea de tiempo de su pedido. */
export const PASOS_PEDIDO: readonly EstadoPedido[] = ["Pendiente de pago", "Alistamiento", "Enviado", "Entregado"];

/** Lo que el pedido necesita saber de cada producto. El precio sale de aquí, nunca del navegador. */
export type ProductoVenta = { slug: string; nombre: string; precio: number; personalizable: boolean };

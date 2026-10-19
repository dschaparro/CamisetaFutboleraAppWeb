export type Rol = "user" | "assistant";

export type MensajeChat = {
  role: Rol;
  content: string;
};

/** Lo que el asistente sabe de cada producto. Sin costo ni proveedor: eso no es para clientes. */
export type ProductoTienda = {
  slug: string;
  nombre: string;
  club: string;
  categoria: string;
  precio: number;
  personalizable: boolean;
  retro: boolean;
  etiqueta: string | null;
  /** «agotado» si el inventario marca 0; «pocas» con 5 o menos; si no hay dato, se vende bajo pedido. */
  disponibilidad: "disponible" | "pocas" | "agotado";
  /** Liga (para recomendar alternativas parecidas). */
  liga?: string;
  /** Promoción vigente: `precio` ya trae el descuento. */
  promocion?: { porcentaje: number; etiqueta: string; precioAntes: number; hasta: string } | null;
};

/** Lo que GOALIX puede proponer en la tienda. El navegador lo muestra como botón. */
export type AccionChat =
  | { tipo: "abrir"; ruta: string; etiqueta: string }
  | { tipo: "carrito"; slug: string; talla: string; manga: string; cantidad: number; etiqueta: string };

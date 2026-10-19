export const CATEGORIAS = ["europeo", "colombiano", "seleccion"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ETIQUETAS = ["Nuevo", "Retro"] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

export type Producto = {
  id: string;
  /** Único y fijo una vez creado. */
  sku: string;
  /** Va en la URL de la tienda; se deriva del SKU. */
  slug: string;
  nombre: string;
  club: string;
  categoria: Categoria;
  /** Pesos colombianos, sin decimales. */
  precio: number;
  /** null = pendiente de cargar. */
  costo: number | null;
  stock: number;
  proveedor: string | null;
  iniciales: string;
  personalizable: boolean;
  retro: boolean;
  etiqueta: Etiqueta | null;
  /** false = oculto en la tienda. Los productos no se borran. */
  visible: boolean;
  /** ISO 8601. */
  actualizadoEn: string;
};

/** Lo que se envía para crear un producto (el resto lo pone el sistema). */
export type ProductoNuevo = Omit<Producto, "id" | "slug" | "actualizadoEn">;

/** Campos editables: todos menos el SKU. */
export type ProductoCambios = Partial<Omit<ProductoNuevo, "sku">>;

export type EstadoStock = "agotado" | "bajo" | "ok";

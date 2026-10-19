/**
 * Lo que se parametriza de la tienda desde el panel: productos, ligas, ofertas,
 * cupones y banners. Sin dependencias de servidor: lo usan también las páginas.
 */

export const CATEGORIAS = ["europeo", "colombiano", "seleccion"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ETIQUETAS = ["Nuevo", "Retro"] as const;
export type Etiqueta = (typeof ETIQUETAS)[number];

/**
 * Una imagen se guarda como «referencia»: el id de una foto subida desde el
 * panel (img-…) o una URL https de internet.
 */
export type RefImagen = string;

/** Encuadre de la imagen dentro de su espacio (CSS object-position). */
export const POSICIONES = ["center", "top", "bottom", "left", "right"] as const;
export type Posicion = (typeof POSICIONES)[number];

export type Liga = {
  id: string;
  nombre: string;
  pais: string;
  descripcion: string;
  colores: [string, string];
  /** Foto de fondo de la tarjeta (opcional). */
  imagen: RefImagen | null;
  posicion: Posicion;
  orden: number;
  visible: boolean;
};

export type Producto = {
  /** También es el slug de la URL (/producto/<id>) y la base del SKU (CF-<id>). */
  id: string;
  nombre: string;
  club: string;
  ligaId: string;
  categoria: Categoria;
  precio: number;
  /** null = costo pendiente. Solo lo ve el panel. */
  costo: number | null;
  stock: number;
  iniciales: string;
  personalizable: boolean;
  retro: boolean;
  etiqueta: Etiqueta | null;
  descripcion: string;
  /** Escudo del club (se ve en «Por club» y como imagen si no hay foto). */
  escudo: RefImagen | null;
  /** Fotos (subidas o URL de internet); la primera es la principal. */
  imagenes: RefImagen[];
  /** Encuadre de las fotos en tarjetas y ficha. */
  posicionImagen: Posicion;
  visible: boolean;
};

/** Descuento por porcentaje sobre productos, una liga o toda la tienda. */
export type Promocion = {
  id: string;
  etiqueta: string;
  porcentaje: number;
  alcance: "productos" | "liga" | "todo";
  productoIds: string[];
  ligaId: string | null;
  /** ISO. */
  desde: string;
  hasta: string;
  activa: boolean;
};

export type Cupon = {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "valor";
  valor: number;
  minimoCompra: number;
  hasta: string;
  usosMaximos: number | null;
  usos: number;
  activo: boolean;
};

export type Banner = {
  id: string;
  antetitulo: string;
  titulo: string;
  texto: string;
  boton: string;
  enlace: string;
  colores: [string, string];
  acento: string;
  insignia: string;
  /** Imagen de fondo a pantalla completa (subida o URL de internet). */
  imagen: RefImagen | null;
  /** Encuadre de la imagen y qué tanto se oscurece para leer el texto (0-90 %). */
  posicion: Posicion;
  oscurecer: number;
  alineacion: "izquierda" | "centro";
  orden: number;
  desde: string;
  hasta: string;
  activo: boolean;
};

/** Lo que recibe la tienda pública: sin costos ni datos internos. */
export type ProductoPublico = Omit<Producto, "costo" | "stock"> & {
  precioFinal: number;
  promocion: { porcentaje: number; etiqueta: string; hasta: string } | null;
  disponibilidad: "disponible" | "pocas" | "agotado";
};

export type CatalogoPublico = {
  productos: ProductoPublico[];
  ligas: Liga[];
  banners: Banner[];
};

export const STOCK_BAJO = 5;

export function esUrlExterna(ref: string): boolean {
  return /^https:\/\//i.test(ref);
}

/** URL para mostrar una imagen: la de internet tal cual, o la de una foto subida. */
export function urlImagen(ref: RefImagen): string {
  return esUrlExterna(ref) ? ref : `/api/tienda/imagenes/${encodeURIComponent(ref)}`;
}

const ANCHOS_WIKIMEDIA = [500, 960, 1280, 1920];

/**
 * Tamaños alternativos para que el navegador baje solo lo que necesita
 * (tarjeta pequeña ≈ 500 px, banner Full HD = 1920 px). Hoy se generan para
 * miniaturas de Wikimedia; para otras URLs se usa la imagen original.
 */
export function srcsetImagen(ref: RefImagen): string | undefined {
  const m = /^(https:\/\/(?:thumb|upload)\.wikimedia\.org\/wikipedia\/commons\/thumb\/.+\/)(\d+)px-([^/?]+)$/.exec(ref);
  if (!m) return undefined;
  return ANCHOS_WIKIMEDIA.map((w) => `${m[1]}${w}px-${m[3]} ${w}w`).join(", ");
}

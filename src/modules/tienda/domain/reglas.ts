import {
  CARRITO_MAX_CANTIDAD_DEFAULT,
  CARRITO_MAX_CANTIDAD_MAX,
  CARRITO_MAX_CANTIDAD_MIN,
  CARRITO_MAX_PRODUCTOS_DEFAULT,
  CARRITO_MAX_PRODUCTOS_MAX,
  CARRITO_MAX_PRODUCTOS_MIN,
  CATEGORIAS,
  ETIQUETAS,
  POSICIONES,
  STOCK_BAJO,
  type AjustesTienda,
  type Banner,
  type Cupon,
  type Liga,
  type Producto,
  type ProductoPublico,
  type Promocion,
} from "@/modules/tienda/domain/types";

/* ======================= Errores ======================= */

export class DatosInvalidosError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos inválidos");
    this.name = "DatosInvalidosError";
    this.campos = campos;
  }
}

export class CuponInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CuponInvalidoError";
  }
}

/* ======================= Lectores ======================= */

type R = Record<string, unknown>;
type Errores = Record<string, string>;

function esObjeto(v: unknown): v is R {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texto(raw: R, k: string, e: Errores, etiqueta: string, min: number, max: number, opcional = false): string {
  const v = typeof raw[k] === "string" ? (raw[k] as string).trim().replace(/\s+/g, " ") : "";
  if (opcional && v === "") return "";
  if (v.length < min) e[k] = `${etiqueta}: mínimo ${min} caracteres`;
  else if (v.length > max) e[k] = `${etiqueta}: máximo ${max} caracteres`;
  return v;
}

function entero(raw: R, k: string, e: Errores, etiqueta: string, min: number, max: number): number {
  const v = raw[k];
  const n = typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    e[k] = `${etiqueta} debe ser un número entero entre ${min.toLocaleString("es-CO")} y ${max.toLocaleString("es-CO")}`;
    return min;
  }
  return n;
}

function bool(raw: R, k: string, porDefecto: boolean): boolean {
  return typeof raw[k] === "boolean" ? (raw[k] as boolean) : porDefecto;
}

function color(raw: R, k: string, e: Errores): string {
  const v = typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) e[k] = "Color inválido (ej. #13294B)";
  return v;
}

function fecha(raw: R, k: string, e: Errores, etiqueta: string): string {
  const v = typeof raw[k] === "string" ? (raw[k] as string) : "";
  const t = Date.parse(v);
  if (Number.isNaN(t)) {
    e[k] = `${etiqueta}: fecha inválida`;
    return new Date(0).toISOString();
  }
  return new Date(t).toISOString();
}

function posicion(raw: R, k: string): (typeof POSICIONES)[number] {
  return (POSICIONES as readonly unknown[]).includes(raw[k]) ? (raw[k] as (typeof POSICIONES)[number]) : "center";
}

/**
 * URL de imagen de internet: solo https (nada de javascript:, data: ni http),
 * sin espacios y de largo razonable. "" o null = sin imagen.
 */
export function validarUrlImagen(v: unknown): string | null | "invalida" {
  if (v === null || v === undefined || (typeof v === "string" && v.trim() === "")) return null;
  if (typeof v !== "string") return "invalida";
  const url = v.trim();
  if (url.length > 800 || /\s/.test(url)) return "invalida";
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : "invalida";
  } catch {
    return "invalida";
  }
}

function imagenOpcional(raw: R, k: string, e: Errores): string | null {
  const v = raw[k];
  // Fotos subidas al panel (img-…) se conservan tal cual.
  if (typeof v === "string" && /^img-[0-9a-f-]{36}$/.test(v)) return v;
  const r = validarUrlImagen(v);
  if (r === "invalida") {
    e[k] = "Pega una URL https de una imagen (ej. https://…/foto.jpg)";
    return null;
  }
  return r;
}

function fin(e: Errores) {
  if (Object.keys(e).length > 0) throw new DatosInvalidosError(e);
}

/** Enlaces de banners: solo rutas internas de la tienda. */
function enlaceInterno(raw: R, k: string, e: Errores): string {
  const v = typeof raw[k] === "string" ? (raw[k] as string).trim() : "";
  if (!/^\/(?!\/)[A-Za-z0-9\-_/?=&#.%]*$/.test(v) || v.startsWith("/panel") || v.startsWith("/api")) {
    e[k] = "El enlace debe ser una ruta de la tienda (ej. /catalogo/laliga o /producto/RM-27T)";
  }
  return v;
}

/* ======================= Productos ======================= */

export function validarProducto(raw: unknown, ligas: Liga[], esNuevo: boolean): Omit<Producto, "imagenes"> {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ producto: "Datos inválidos" });
  const e: Errores = {};
  const id = typeof raw.id === "string" ? raw.id.trim().toUpperCase() : "";
  if (esNuevo && !/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(id)) e.id = "Código: letras, números y guiones (ej. JUV-27T)";
  if (esNuevo && (id.length < 3 || id.length > 20)) e.id = "Código: entre 3 y 20 caracteres";
  const ligaId = typeof raw.ligaId === "string" ? raw.ligaId : "";
  if (!ligas.some((l) => l.id === ligaId)) e.ligaId = "Elige una liga";
  const categoria = raw.categoria;
  if (!(CATEGORIAS as readonly unknown[]).includes(categoria)) e.categoria = "Elige una categoría";
  const etiqueta = raw.etiqueta === "" || raw.etiqueta == null ? null : raw.etiqueta;
  if (etiqueta !== null && !(ETIQUETAS as readonly unknown[]).includes(etiqueta)) e.etiqueta = "Etiqueta inválida";
  const costoRaw = raw.costo;
  const costo = costoRaw === "" || costoRaw == null ? null : entero(raw, "costo", e, "El costo", 0, 10_000_000);
  const iniciales = typeof raw.iniciales === "string" ? raw.iniciales.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{1,4}$/.test(iniciales)) e.iniciales = "Iniciales: de 1 a 4 letras o números";

  const p = {
    id,
    nombre: texto(raw, "nombre", e, "Nombre", 3, 120),
    club: texto(raw, "club", e, "Club", 2, 80),
    ligaId,
    categoria: categoria as Producto["categoria"],
    precio: entero(raw, "precio", e, "El precio", 1000, 10_000_000),
    costo,
    stock: entero(raw, "stock", e, "El stock", 0, 100_000),
    iniciales,
    personalizable: bool(raw, "personalizable", true),
    retro: bool(raw, "retro", false),
    etiqueta: etiqueta as Producto["etiqueta"],
    descripcion: texto(raw, "descripcion", e, "Descripción", 0, 600, true),
    posicionImagen: posicion(raw, "posicionImagen"),
    escudo: imagenOpcional(raw, "escudo", e),
    visible: bool(raw, "visible", true),
  };
  fin(e);
  return p;
}

/* ======================= Ligas ======================= */

export function validarLiga(raw: unknown, esNueva: boolean): Liga {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ liga: "Datos inválidos" });
  const e: Errores = {};
  const id = typeof raw.id === "string" ? raw.id.trim().toLowerCase() : "";
  if (esNueva && !/^[a-z0-9-]{2,30}$/.test(id)) e.id = "Código: minúsculas, números y guiones (ej. serie-a)";
  const l: Liga = {
    id,
    nombre: texto(raw, "nombre", e, "Nombre", 2, 40),
    pais: texto(raw, "pais", e, "País", 2, 40),
    descripcion: texto(raw, "descripcion", e, "Descripción", 0, 80, true),
    colores: [color(raw, "color1", e), color(raw, "color2", e)],
    imagen: imagenOpcional(raw, "imagen", e),
    posicion: posicion(raw, "posicion"),
    orden: entero(raw, "orden", e, "El orden", 0, 999),
    visible: bool(raw, "visible", true),
  };
  fin(e);
  return l;
}

/* ======================= Ofertas ======================= */

export function validarPromocion(raw: unknown, productos: Producto[], ligas: Liga[]): Omit<Promocion, "id"> {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ promocion: "Datos inválidos" });
  const e: Errores = {};
  const alcance = raw.alcance;
  if (alcance !== "productos" && alcance !== "liga" && alcance !== "todo") e.alcance = "Elige a qué aplica";
  const productoIds = Array.isArray(raw.productoIds) ? raw.productoIds.filter((x): x is string => typeof x === "string") : [];
  if (alcance === "productos" && (productoIds.length === 0 || productoIds.some((id) => !productos.some((p) => p.id === id)))) {
    e.productoIds = "Elige al menos un producto";
  }
  const ligaId = typeof raw.ligaId === "string" && raw.ligaId ? raw.ligaId : null;
  if (alcance === "liga" && !ligas.some((l) => l.id === ligaId)) e.ligaId = "Elige una liga";
  const desde = fecha(raw, "desde", e, "Desde");
  const hasta = fecha(raw, "hasta", e, "Hasta");
  if (!e.desde && !e.hasta && Date.parse(hasta) <= Date.parse(desde)) e.hasta = "La fecha final debe ser después de la inicial";
  const p = {
    etiqueta: texto(raw, "etiqueta", e, "Nombre de la oferta", 3, 40),
    porcentaje: entero(raw, "porcentaje", e, "El porcentaje", 1, 90),
    alcance: alcance as Promocion["alcance"],
    productoIds: alcance === "productos" ? productoIds : [],
    ligaId: alcance === "liga" ? ligaId : null,
    desde,
    hasta,
    activa: bool(raw, "activa", true),
  };
  fin(e);
  return p;
}

/* ======================= Cupones ======================= */

export function validarCupon(raw: unknown, existentes: Cupon[], idActual: string | null): Omit<Cupon, "id" | "usos"> {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ cupon: "Datos inválidos" });
  const e: Errores = {};
  const codigo = typeof raw.codigo === "string" ? raw.codigo.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{4,20}$/.test(codigo)) e.codigo = "Código: de 4 a 20 letras o números (ej. MUNDIAL10)";
  else if (existentes.some((c) => c.codigo === codigo && c.id !== idActual)) e.codigo = "Ya existe un cupón con ese código";
  const tipo = raw.tipo;
  if (tipo !== "porcentaje" && tipo !== "valor") e.tipo = "Elige el tipo de descuento";
  const valor = tipo === "porcentaje" ? entero(raw, "valor", e, "El porcentaje", 1, 90) : entero(raw, "valor", e, "El valor", 1000, 1_000_000);
  const maxRaw = raw.usosMaximos;
  const c = {
    codigo,
    tipo: tipo as Cupon["tipo"],
    valor,
    minimoCompra: entero(raw, "minimoCompra", e, "La compra mínima", 0, 10_000_000),
    hasta: fecha(raw, "hasta", e, "Válido hasta"),
    usosMaximos: maxRaw === "" || maxRaw == null ? null : entero(raw, "usosMaximos", e, "Los usos máximos", 1, 100_000),
    activo: bool(raw, "activo", true),
  };
  fin(e);
  return c;
}

/** Descuento que da un cupón sobre el subtotal; lanza CuponInvalidoError con el motivo. */
export function aplicarCupon(cupones: Cupon[], codigoRaw: string, subtotal: number, ahora = new Date()): { cupon: Cupon; descuento: number } {
  const codigo = codigoRaw.trim().toUpperCase();
  const cupon = cupones.find((c) => c.codigo === codigo);
  if (!cupon || !cupon.activo) throw new CuponInvalidoError("Ese cupón no existe o no está activo");
  if (Date.parse(cupon.hasta) < ahora.getTime()) throw new CuponInvalidoError("Ese cupón ya venció");
  if (cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos) throw new CuponInvalidoError("Ese cupón ya alcanzó su límite de usos");
  if (subtotal < cupon.minimoCompra) {
    throw new CuponInvalidoError(`Este cupón aplica en compras desde $${cupon.minimoCompra.toLocaleString("es-CO")}`);
  }
  const descuento = cupon.tipo === "porcentaje" ? Math.round((subtotal * cupon.valor) / 100 / 100) * 100 : Math.min(cupon.valor, subtotal);
  return { cupon, descuento };
}

/* ======================= Banners ======================= */

export function validarBanner(raw: unknown): Omit<Banner, "id"> {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ banner: "Datos inválidos" });
  const e: Errores = {};
  const desde = fecha(raw, "desde", e, "Desde");
  const hasta = fecha(raw, "hasta", e, "Hasta");
  if (!e.desde && !e.hasta && Date.parse(hasta) <= Date.parse(desde)) e.hasta = "La fecha final debe ser después de la inicial";
  const b = {
    antetitulo: texto(raw, "antetitulo", e, "Antetítulo", 0, 60, true),
    titulo: texto(raw, "titulo", e, "Título", 3, 70),
    texto: texto(raw, "texto", e, "Texto", 0, 180, true),
    boton: texto(raw, "boton", e, "Texto del botón", 2, 30),
    enlace: enlaceInterno(raw, "enlace", e),
    colores: [color(raw, "color1", e), color(raw, "color2", e)] as [string, string],
    acento: color(raw, "acento", e),
    insignia: texto(raw, "insignia", e, "Insignia", 0, 4, true).toUpperCase(),
    imagen: imagenOpcional(raw, "imagen", e),
    posicion: posicion(raw, "posicion"),
    oscurecer: raw.oscurecer === undefined ? 55 : entero(raw, "oscurecer", e, "El oscurecido", 0, 90),
    alineacion: (raw.alineacion === "centro" ? "centro" : "izquierda") as Banner["alineacion"],
    orden: entero(raw, "orden", e, "El orden", 0, 999),
    desde,
    hasta,
    activo: bool(raw, "activo", true),
  };
  fin(e);
  return b;
}

/* ======================= Precios y vista pública ======================= */

export function vigente(desde: string, hasta: string, ahora: Date): boolean {
  const t = ahora.getTime();
  return Date.parse(desde) <= t && t <= Date.parse(hasta);
}

/** La mejor promoción vigente que aplica al producto (mayor beneficio para el cliente). */
export function mejorPromocion(p: Producto, promociones: Promocion[], ahora = new Date()): Promocion | null {
  const aplicables = promociones.filter(
    (x) =>
      x.activa &&
      vigente(x.desde, x.hasta, ahora) &&
      (x.alcance === "todo" || (x.alcance === "liga" && x.ligaId === p.ligaId) || (x.alcance === "productos" && x.productoIds.includes(p.id))),
  );
  return aplicables.sort((a, b) => b.porcentaje - a.porcentaje)[0] ?? null;
}

export function precioConDescuento(precio: number, porcentaje: number): number {
  return Math.round((precio * (100 - porcentaje)) / 100 / 100) * 100;
}

export function disponibilidad(stock: number): ProductoPublico["disponibilidad"] {
  return stock <= 0 ? "agotado" : stock <= STOCK_BAJO ? "pocas" : "disponible";
}

export function vistaPublica(p: Producto, promociones: Promocion[], ahora = new Date()): ProductoPublico {
  const promo = mejorPromocion(p, promociones, ahora);
  const { costo: _c, stock, ...resto } = p;
  void _c;
  return {
    ...resto,
    precioFinal: promo ? precioConDescuento(p.precio, promo.porcentaje) : p.precio,
    promocion: promo ? { porcentaje: promo.porcentaje, etiqueta: promo.etiqueta, hasta: promo.hasta } : null,
    disponibilidad: disponibilidad(stock),
  };
}

export function bannersVigentes(banners: Banner[], ahora = new Date()): Banner[] {
  return banners.filter((b) => b.activo && vigente(b.desde, b.hasta, ahora)).sort((a, b) => a.orden - b.orden);
}

export function ajustesPorDefecto(): AjustesTienda {
  return {
    carritoMaxProductos: CARRITO_MAX_PRODUCTOS_DEFAULT,
    carritoMaxCantidad: CARRITO_MAX_CANTIDAD_DEFAULT,
  };
}

export function validarAjustes(raw: unknown): AjustesTienda {
  if (!esObjeto(raw)) throw new DatosInvalidosError({ cuerpo: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const nProd = Number(raw.carritoMaxProductos);
  if (!Number.isInteger(nProd) || nProd < CARRITO_MAX_PRODUCTOS_MIN || nProd > CARRITO_MAX_PRODUCTOS_MAX) {
    errores.carritoMaxProductos = `Indica un número entre ${CARRITO_MAX_PRODUCTOS_MIN} y ${CARRITO_MAX_PRODUCTOS_MAX}`;
  }
  const nCant = Number(raw.carritoMaxCantidad);
  if (!Number.isInteger(nCant) || nCant < CARRITO_MAX_CANTIDAD_MIN || nCant > CARRITO_MAX_CANTIDAD_MAX) {
    errores.carritoMaxCantidad = `Indica un número entre ${CARRITO_MAX_CANTIDAD_MIN} y ${CARRITO_MAX_CANTIDAD_MAX}`;
  }
  if (Object.keys(errores).length) throw new DatosInvalidosError(errores);
  return { carritoMaxProductos: nProd, carritoMaxCantidad: nCant };
}

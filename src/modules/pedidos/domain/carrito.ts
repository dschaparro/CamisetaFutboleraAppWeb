/** Línea de carrito (pre-pedido). El checkout sigue resolviendo precio real en servidor. */
export type LineaCarrito = {
  slug: string;
  talla: string;
  manga: string;
  personalizacion: string;
  cantidad: number;
  club: string;
  nombre: string;
  initials: string;
  cat: string;
  precio: number;
};

/** Default si no llega tope desde ajustes de tienda. */
export const CARRITO_QTY_MAX = 5;

export type TopeLineas = {
  maxProductos?: number;
  maxCantidad?: number;
};

export class CarritoInvalidoError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>, message = "Carrito inválido") {
    super(message);
    this.name = "CarritoInvalidoError";
    this.campos = campos;
  }
}

export function claveLinea(l: Pick<LineaCarrito, "slug" | "talla" | "manga" | "personalizacion">): string {
  return `${l.slug}|${l.talla}|${l.manga}|${l.personalizacion}`;
}

function clampQty(n: number, maxCantidad: number): number {
  if (!Number.isFinite(n)) return 1;
  const tope = maxCantidad > 0 ? maxCantidad : CARRITO_QTY_MAX;
  return Math.min(tope, Math.max(1, Math.trunc(n)));
}

/** Une carrito de cuenta + invitado: misma línea suma cantidades (con tope por línea). */
export function fusionarCarritos(
  cuenta: LineaCarrito[],
  invitado: LineaCarrito[],
  maxCantidad: number = CARRITO_QTY_MAX,
): LineaCarrito[] {
  const map = new Map<string, LineaCarrito>();
  for (const l of [...cuenta, ...invitado]) {
    const k = claveLinea(l);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...l, cantidad: clampQty(l.cantidad, maxCantidad), precio: Math.max(0, Math.trunc(l.precio) || 0) });
      continue;
    }
    map.set(k, {
      ...prev,
      ...l,
      cantidad: clampQty(prev.cantidad + l.cantidad, maxCantidad),
      precio: Math.max(0, Math.trunc(l.precio) || prev.precio),
    });
  }
  return [...map.values()];
}

function texto(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

/** Normaliza el body del cliente (CartItem o LineaCarrito) a líneas de dominio. */
export function parsearLineasCarrito(raw: unknown, tope?: TopeLineas): LineaCarrito[] {
  const maxCantidad = tope?.maxCantidad ?? CARRITO_QTY_MAX;
  if (!Array.isArray(raw)) throw new CarritoInvalidoError({ items: "Se esperaba una lista de productos" });
  const out: LineaCarrito[] = [];
  for (const [i, row] of raw.entries()) {
    if (typeof row !== "object" || row === null) {
      throw new CarritoInvalidoError({ [`items.${i}`]: "Línea inválida" });
    }
    const o = row as Record<string, unknown>;
    const slug = texto(o.slug);
    if (!slug) throw new CarritoInvalidoError({ [`items.${i}.slug`]: "Falta el producto" });
    const talla = texto(o.talla) || texto(o.size);
    const manga = texto(o.manga) || texto(o.sleeve) || "Corta";
    const personalizacion = texto(o.personalizacion) || texto(o.custom) || "Sin personalización";
    if (!talla) throw new CarritoInvalidoError({ [`items.${i}.talla`]: "Falta la talla" });
    const cantidadRaw = o.cantidad ?? o.qty ?? 1;
    const cantidad = typeof cantidadRaw === "number" ? cantidadRaw : Number(cantidadRaw);
    const precioRaw = o.precio ?? o.price ?? 0;
    const precio = typeof precioRaw === "number" ? precioRaw : Number(precioRaw);
    out.push({
      slug,
      talla,
      manga,
      personalizacion,
      cantidad: clampQty(cantidad, maxCantidad),
      club: texto(o.club),
      nombre: texto(o.nombre) || texto(o.name) || slug,
      initials: texto(o.initials) || slug.slice(0, 3).toUpperCase(),
      cat: texto(o.cat),
      precio: Number.isFinite(precio) && precio >= 0 ? Math.trunc(precio) : 0,
    });
  }
  const lineas = fusionarCarritos([], out, maxCantidad);
  return limitarProductos(lineas, tope?.maxProductos);
}

/** Exige que el carrito no supere el máximo de productos distintos. */
export function limitarProductos(lineas: LineaCarrito[], maxProductos?: number): LineaCarrito[] {
  if (maxProductos == null || maxProductos <= 0) return lineas;
  if (lineas.length <= maxProductos) return lineas;
  throw new CarritoInvalidoError(
    { items: `El carrito admite como máximo ${maxProductos} productos` },
    `El carrito admite como máximo ${maxProductos} productos`,
  );
}

/** Tras fusionar cuenta+invitado: conserva primero las de la cuenta y completa con invitadas. */
export function fusionarConTope(
  cuenta: LineaCarrito[],
  invitado: LineaCarrito[],
  maxProductos: number,
  maxCantidad: number = CARRITO_QTY_MAX,
): LineaCarrito[] {
  const fusion = fusionarCarritos(cuenta, invitado, maxCantidad);
  if (fusion.length <= maxProductos) return fusion;
  const clavesCuenta = new Set(cuenta.map(claveLinea));
  const deCuenta = fusion.filter((l) => clavesCuenta.has(claveLinea(l)));
  const resto = fusion.filter((l) => !clavesCuenta.has(claveLinea(l)));
  return [...deCuenta, ...resto].slice(0, maxProductos);
}

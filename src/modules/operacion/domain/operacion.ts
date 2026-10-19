/**
 * Inventario, compras a proveedores y lista de compras. Reglas puras (sin base de datos):
 * las usan las rutas del panel y las pruebas.
 */

export const ESTADOS_LISTA = ["Pendiente", "Conseguido", "No conseguido"] as const;
export type EstadoLista = (typeof ESTADOS_LISTA)[number];

export const STOCK_BAJO = 5;

/** Datos inválidos en un formulario del panel. `campos` trae un mensaje por campo. */
export class OperacionInvalidaError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos inválidos");
    this.name = "OperacionInvalidaError";
    this.campos = campos;
  }
}

export class NoEncontradoError extends Error {
  constructor(que: string) {
    super(`No existe ${que}`);
    this.name = "NoEncontradoError";
  }
}

export type FilaInventario = {
  id: string;
  nombre: string;
  sku: string;
  proveedor: string;
  costo: number | null;
  precio: number;
  /** Margen en % sobre el precio de venta; null si no hay costo. */
  margenPct: number | null;
  stock: number;
};

/** El SKU visible en el panel: CF-<id del producto>. */
export const skuDe = (id: string) => `CF-${id}`;

export function margenPct(precio: number, costo: number | null): number | null {
  if (costo === null || precio <= 0) return null;
  return Math.round(((precio - costo) / precio) * 100);
}

export type EstadoStock = "agotado" | "bajo" | "ok";
export function estadoStock(stock: number): EstadoStock {
  if (stock <= 0) return "agotado";
  return stock <= STOCK_BAJO ? "bajo" : "ok";
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
const texto = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const entero = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);

function terminar<T>(valor: T, errores: Record<string, string>): T {
  if (Object.keys(errores).length > 0) throw new OperacionInvalidaError(errores);
  return valor;
}

export type CambiosInventario = Partial<{ costo: number | null; stock: number; proveedor: string }>;

/** Solo valida lo que viene: costo (o vacío = pendiente), stock y proveedor. */
export function validarCambiosInventario(raw: unknown): CambiosInventario {
  if (!esObjeto(raw)) throw new OperacionInvalidaError({ producto: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const c: CambiosInventario = {};
  if ("costo" in raw) {
    if (raw.costo === null || raw.costo === "") c.costo = null;
    else {
      const n = entero(raw.costo);
      if (!Number.isInteger(n) || n < 0 || n > 10_000_000) errores.costo = "El costo debe ser un valor en pesos entre 0 y 10.000.000";
      else c.costo = n;
    }
  }
  if ("stock" in raw) {
    const n = entero(raw.stock);
    if (!Number.isInteger(n) || n < 0 || n > 100_000) errores.stock = "El stock debe ser un número entero de 0 a 100.000";
    else c.stock = n;
  }
  if ("proveedor" in raw) {
    const p = texto(raw.proveedor);
    if (p.length > 60) errores.proveedor = "El nombre del proveedor es muy largo";
    else c.proveedor = p;
  }
  if (Object.keys(c).length === 0 && Object.keys(errores).length === 0) errores.producto = "No hay cambios para guardar";
  return terminar(c, errores);
}

export type CompraNueva = {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  proveedor: string;
  nota: string;
  /** Ítem de la lista de compras que esta compra resuelve. */
  listaId: number | null;
};

export function validarCompra(raw: unknown): CompraNueva {
  if (!esObjeto(raw)) throw new OperacionInvalidaError({ compra: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const productoId = texto(raw.productoId);
  if (!productoId) errores.productoId = "Elige el producto";
  const cantidad = entero(raw.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000) errores.cantidad = "La cantidad debe estar entre 1 y 1000";
  const costoUnitario = entero(raw.costoUnitario);
  if (!Number.isInteger(costoUnitario) || costoUnitario < 0 || costoUnitario > 10_000_000) errores.costoUnitario = "Escribe el costo por unidad en pesos";
  const proveedor = texto(raw.proveedor);
  if (proveedor.length < 2 || proveedor.length > 60) errores.proveedor = "Escribe el proveedor (2 a 60 caracteres)";
  const nota = texto(raw.nota).slice(0, 200);
  let listaId: number | null = null;
  if (raw.listaId !== undefined && raw.listaId !== null && raw.listaId !== "") {
    const n = entero(raw.listaId);
    if (!Number.isInteger(n) || n < 1) errores.listaId = "Ítem de la lista inválido";
    else listaId = n;
  }
  return terminar({ productoId, cantidad, costoUnitario, proveedor, nota, listaId }, errores);
}

export function validarCambioLista(raw: unknown): { estado: EstadoLista; nota: string | null } {
  if (!esObjeto(raw)) throw new OperacionInvalidaError({ estado: "Datos inválidos" });
  if (!(ESTADOS_LISTA as readonly unknown[]).includes(raw.estado)) throw new OperacionInvalidaError({ estado: "Estado inválido" });
  const nota = texto(raw.nota).slice(0, 200);
  return { estado: raw.estado as EstadoLista, nota: nota || null };
}

export type LineaVendida = {
  slug: string | null;
  nombre: string;
  talla: string;
  manga: string;
  personalizacion: string;
  cantidad: number;
};

export type Faltante = {
  slug: string;
  nombre: string;
  variante: string;
  personalizacion: string;
  cantidad: number;
};

/**
 * Qué hay que conseguir para cumplir un pedido: por cada producto se reparte el stock
 * disponible entre las líneas, en orden, y lo que no alcanza va a la lista de compras.
 */
export function faltantes(lineas: LineaVendida[], stock: ReadonlyMap<string, number>): Faltante[] {
  const disponible = new Map(stock);
  const resultado: Faltante[] = [];
  for (const l of lineas) {
    if (!l.slug || !disponible.has(l.slug)) continue;
    const hay = Math.max(0, disponible.get(l.slug) ?? 0);
    const usa = Math.min(hay, l.cantidad);
    disponible.set(l.slug, hay - usa);
    const falta = l.cantidad - usa;
    if (falta > 0) {
      resultado.push({
        slug: l.slug,
        nombre: l.nombre,
        variante: `${l.talla} · manga ${l.manga.toLowerCase()}`,
        personalizacion: l.personalizacion,
        cantidad: falta,
      });
    }
  }
  return resultado;
}

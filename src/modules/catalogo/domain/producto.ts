import { ProductoInvalidoError } from "@/modules/catalogo/domain/errors";
import {
  CATEGORIAS,
  ETIQUETAS,
  type Categoria,
  type EstadoStock,
  type Etiqueta,
  type ProductoCambios,
  type ProductoNuevo,
} from "@/modules/catalogo/domain/types";

export const STOCK_BAJO = 5;
const MAX_PRECIO = 10_000_000;
const MAX_STOCK = 100_000;

/** Un validador devuelve el valor limpio o lanza un mensaje (string) para ese campo. */
type Validador<T> = (v: unknown) => T;

function texto(etiqueta: string, min: number, max: number): Validador<string> {
  return (v) => {
    if (typeof v !== "string") throw `${etiqueta} es obligatorio`;
    const limpio = v.trim().replace(/\s+/g, " ");
    if (limpio.length < min) throw `${etiqueta} debe tener al menos ${min} caracteres`;
    if (limpio.length > max) throw `${etiqueta} no puede superar ${max} caracteres`;
    return limpio;
  };
}

/** Acepta número o texto con solo dígitos (lo que llega de un input). */
function entero(etiqueta: string, min: number, max: number): Validador<number> {
  return (v) => {
    const n = typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v.trim()) : v;
    if (typeof n !== "number" || !Number.isInteger(n)) throw `${etiqueta} debe ser un número entero`;
    if (n < min) throw `${etiqueta} no puede ser menor que ${min}`;
    if (n > max) throw `${etiqueta} no puede superar ${max.toLocaleString("es-CO")}`;
    return n;
  };
}

function opcional<T>(validar: Validador<T>): Validador<T | null> {
  return (v) => (v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? null : validar(v));
}

function booleano(etiqueta: string): Validador<boolean> {
  return (v) => {
    if (typeof v !== "boolean") throw `${etiqueta} debe ser sí o no`;
    return v;
  };
}

function unoDe<T extends string>(etiqueta: string, opciones: readonly T[]): Validador<T> {
  return (v) => {
    if (typeof v !== "string" || !(opciones as readonly string[]).includes(v)) {
      throw `${etiqueta} debe ser una de: ${opciones.join(", ")}`;
    }
    return v as T;
  };
}

const sku: Validador<string> = (v) => {
  if (typeof v !== "string") throw "El SKU es obligatorio";
  const limpio = v.trim().toUpperCase();
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(limpio)) throw "El SKU solo admite letras, números y guiones (ej. CF-RM-27T)";
  if (limpio.length < 3 || limpio.length > 30) throw "El SKU debe tener entre 3 y 30 caracteres";
  return limpio;
};

const iniciales: Validador<string> = (v) => {
  if (typeof v !== "string") throw "Las iniciales son obligatorias";
  const limpio = v.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,4}$/.test(limpio)) throw "Las iniciales deben tener de 1 a 4 letras o números";
  return limpio;
};

const CAMPOS: { [K in keyof ProductoNuevo]-?: Validador<ProductoNuevo[K]> } = {
  sku,
  nombre: texto("El nombre", 3, 120),
  club: texto("El club", 2, 80),
  categoria: unoDe<Categoria>("La categoría", CATEGORIAS),
  precio: entero("El precio", 1, MAX_PRECIO),
  costo: opcional(entero("El costo", 0, MAX_PRECIO)),
  stock: entero("El stock", 0, MAX_STOCK),
  proveedor: opcional(texto("El proveedor", 2, 80)),
  iniciales,
  personalizable: booleano("Personalizable"),
  retro: booleano("Retro"),
  etiqueta: opcional(unoDe<Etiqueta>("La etiqueta", ETIQUETAS)),
  visible: booleano("Visible"),
};

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Valida solo los campos presentes; junta todos los errores en vez de parar en el primero. */
function validarCampos(raw: Record<string, unknown>, claves: (keyof ProductoNuevo)[]): Record<string, unknown> {
  const limpio: Record<string, unknown> = {};
  const errores: Record<string, string> = {};
  for (const clave of claves) {
    try {
      limpio[clave] = CAMPOS[clave](raw[clave]);
    } catch (e) {
      errores[clave] = typeof e === "string" ? e : "Valor inválido";
    }
  }
  if (Object.keys(errores).length > 0) throw new ProductoInvalidoError(errores);
  return limpio;
}

const DEFAULTS: Partial<Record<keyof ProductoNuevo, unknown>> = {
  costo: null,
  stock: 0,
  proveedor: null,
  personalizable: true,
  retro: false,
  etiqueta: null,
  visible: true,
};

export function validarProductoNuevo(raw: unknown): ProductoNuevo {
  if (!esObjeto(raw)) throw new ProductoInvalidoError({ producto: "Datos de producto inválidos" });
  const conDefaults = { ...DEFAULTS, ...raw };
  return validarCampos(conDefaults, Object.keys(CAMPOS) as (keyof ProductoNuevo)[]) as ProductoNuevo;
}

export function validarCambios(raw: unknown): ProductoCambios {
  if (!esObjeto(raw)) throw new ProductoInvalidoError({ producto: "Datos de producto inválidos" });
  if ("sku" in raw) throw new ProductoInvalidoError({ sku: "El SKU no se puede cambiar" });

  const claves = (Object.keys(CAMPOS) as (keyof ProductoNuevo)[]).filter((k) => k in raw);
  if (claves.length === 0) throw new ProductoInvalidoError({ producto: "No hay cambios para guardar" });
  return validarCampos(raw, claves) as ProductoCambios;
}

/** CF-RM-27T → RM-27T (así siguen funcionando las URLs actuales de la tienda). */
export function slugDesdeSku(skuLimpio: string): string {
  return skuLimpio.replace(/^CF-/, "");
}

export function margenPct(costo: number | null, precio: number): number | null {
  if (costo === null || precio <= 0) return null;
  return Math.round(((precio - costo) / precio) * 1000) / 10;
}

export function estadoStock(stock: number): EstadoStock {
  if (stock <= 0) return "agotado";
  if (stock <= STOCK_BAJO) return "bajo";
  return "ok";
}

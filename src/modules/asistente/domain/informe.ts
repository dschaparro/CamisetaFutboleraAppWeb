import { InformeInvalidoError } from "@/modules/asistente/domain/errors";
import type { Informe, InformeKpi, InformeSeccion } from "@/modules/asistente/domain/informe-types";
import type { FuenteDatos } from "@/modules/operacion/domain/fuentes";

const MAX_TITULO = 140;
const MAX_KPI_ETIQUETA = 48;
const MAX_KPI_VALOR = 40;
const MAX_KPIS = 4;
const MAX_SECCION_TITULO = 90;
const MAX_SECCION_TEXTO = 1500;
const MAX_SECCIONES = 6;

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texto(v: unknown, campo: string, max: number): string {
  if (typeof v !== "string") throw new InformeInvalidoError(`"${campo}" debe ser texto`);
  const limpio = v.trim();
  if (limpio.length === 0) throw new InformeInvalidoError(`"${campo}" está vacío`);
  if (limpio.length > max) throw new InformeInvalidoError(`"${campo}" supera ${max} caracteres`);
  return limpio;
}

function lista(v: unknown, campo: string, min: number, max: number): unknown[] {
  if (!Array.isArray(v)) throw new InformeInvalidoError(`"${campo}" debe ser una lista`);
  if (v.length < min || v.length > max) {
    throw new InformeInvalidoError(`"${campo}" debe tener entre ${min} y ${max} elementos`);
  }
  return v;
}

/**
 * Valida lo que devolvió la IA. Nunca confía en la forma: cualquier desvío
 * lanza InformeInvalidoError en lugar de llegar roto a la pantalla.
 */
export function validarInforme(raw: unknown, fuenteDatos: FuenteDatos, ahora: Date): Informe {
  if (!esObjeto(raw)) throw new InformeInvalidoError("La respuesta no es un objeto");

  const kpis: InformeKpi[] = lista(raw.kpis, "kpis", 1, MAX_KPIS).map((k, i) => {
    if (!esObjeto(k)) throw new InformeInvalidoError(`kpis[${i}] no es un objeto`);
    return {
      etiqueta: texto(k.etiqueta, `kpis[${i}].etiqueta`, MAX_KPI_ETIQUETA),
      valor: texto(k.valor, `kpis[${i}].valor`, MAX_KPI_VALOR),
    };
  });

  const secciones: InformeSeccion[] = lista(raw.secciones, "secciones", 1, MAX_SECCIONES).map((s, i) => {
    if (!esObjeto(s)) throw new InformeInvalidoError(`secciones[${i}] no es un objeto`);
    return {
      titulo: texto(s.titulo, `secciones[${i}].titulo`, MAX_SECCION_TITULO),
      texto: texto(s.texto, `secciones[${i}].texto`, MAX_SECCION_TEXTO),
      alerta: s.alerta === true,
    };
  });

  return {
    titulo: texto(raw.titulo, "titulo", MAX_TITULO),
    kpis,
    secciones,
    generadoEn: ahora.toISOString(),
    fuenteDatos,
  };
}

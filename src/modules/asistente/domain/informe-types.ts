import type { FuenteDatos } from "@/modules/operacion/domain/fuentes";

export type InformeKpi = {
  etiqueta: string;
  valor: string;
};

export type InformeSeccion = {
  titulo: string;
  texto: string;
  /** true = requiere acción; se pinta como alerta. */
  alerta: boolean;
};

export type Informe = {
  titulo: string;
  kpis: InformeKpi[];
  secciones: InformeSeccion[];
  /** ISO 8601. */
  generadoEn: string;
  fuenteDatos: FuenteDatos;
};

/** Lo que el modelo devuelve: el informe sin los campos que pone el sistema. */
export type InformeGenerado = Pick<Informe, "titulo" | "kpis" | "secciones">;

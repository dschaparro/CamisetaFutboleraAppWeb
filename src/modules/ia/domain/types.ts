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
  /** "ejemplo" mientras los módulos usen src/data/*.ts en vez de Supabase. */
  fuenteDatos: FuenteDatos;
};

export type FuenteDatos = "ejemplo" | "sistema";

/** Lo que el modelo devuelve: el informe sin los campos que pone el sistema. */
export type InformeGenerado = Pick<Informe, "titulo" | "kpis" | "secciones">;

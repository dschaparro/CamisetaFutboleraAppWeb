/** Reglas puras del personalizador 3D: colores por equipo, parches y texto que va al pedido. */

export type Patron = "liso" | "rayas" | "franja";

export type Paleta = {
  base: string;
  alt: string;
  detalle: string;
  /** Color por defecto del nombre y el número. */
  texto: string;
  patron: Patron;
  /** Logos reales (imagen) del fabricante y del patrocinador de la camiseta; solo los que se conocen con certeza. */
  marcaUrl?: string;
  patrocinadorUrl?: string;
  /** Color con el que se tiñe el logo (los de una sola tinta); sin esto se dibuja con sus colores originales. */
  patrocinadorTinte?: string;
};

const WK = "https://thumb.wikimedia.org/wikipedia/commons/thumb/";
export const LOGO_MARCA = {
  adidas: WK + "2/20/Adidas_Logo.svg/500px-Adidas_Logo.svg.png",
  Nike: WK + "a/a6/Logo_NIKE.svg/500px-Logo_NIKE.svg.png",
  PUMA: WK + "a/ae/Puma-logo-%28text%29.svg/500px-Puma-logo-%28text%29.svg.png",
};
export const LOGO_PATROCINADOR = {
  Emirates: WK + "1/1d/Emirates_Logo.svg/500px-Emirates_Logo.svg.png",
  Spotify: WK + "1/19/Spotify_logo_without_text.svg/500px-Spotify_logo_without_text.svg.png",
  Etihad: WK + "0/0e/Etihad-airways-logo.svg/500px-Etihad-airways-logo.svg.png",
  Telekom: WK + "7/79/Telekom_Logo_2013_white.svg/500px-Telekom_Logo_2013_white.svg.png",
};

export const PALETA_BLANCA: Paleta = { base: "#F4F4F1", alt: "#E6E6E1", detalle: "#CFCFC8", texto: "#1B1B1B", patron: "liso" };

const PALETAS: Record<string, Paleta> = {
  "real madrid": { base: "#F8F8F6", alt: "#ECECE8", detalle: "#1E2A5A", texto: "#1E2A5A", patron: "liso", patrocinadorUrl: LOGO_PATROCINADOR.Emirates, marcaUrl: LOGO_MARCA.adidas },
  "fc barcelona": { base: "#A50044", alt: "#004D98", detalle: "#EDBB00", texto: "#EDBB00", patron: "rayas", patrocinadorUrl: LOGO_PATROCINADOR.Spotify, marcaUrl: LOGO_MARCA.Nike },
  "manchester city": { base: "#6CABDD", alt: "#6CABDD", detalle: "#1C2C5B", texto: "#FFFFFF", patron: "liso", patrocinadorUrl: LOGO_PATROCINADOR.Etihad, marcaUrl: LOGO_MARCA.PUMA },
  "millonarios fc": { base: "#0B3C8C", alt: "#0B3C8C", detalle: "#FFFFFF", texto: "#FFFFFF", patron: "liso" },
  "atlético nacional": { base: "#FFFFFF", alt: "#0B7A3B", detalle: "#0B7A3B", texto: "#0B7A3B", patron: "rayas" },
  "paris saint-germain": { base: "#0A1F44", alt: "#E4002B", detalle: "#FFFFFF", texto: "#FFFFFF", patron: "franja", marcaUrl: LOGO_MARCA.Nike },
  "bayern munich": { base: "#DC052D", alt: "#DC052D", detalle: "#FFFFFF", texto: "#FFFFFF", patron: "liso", patrocinadorUrl: LOGO_PATROCINADOR.Telekom, marcaUrl: LOGO_MARCA.adidas },
  "selección colombia": { base: "#FCD116", alt: "#FCD116", detalle: "#003893", texto: "#003893", patron: "liso", marcaUrl: LOGO_MARCA.adidas },
};

/** Luminancia aproximada para elegir texto claro u oscuro. */
function esOscuro(hex: string): boolean {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export type Equipacion = "local" | "visitante" | "tercera";
export const EQUIPACIONES: { id: Equipacion; nombre: string }[] = [
  { id: "local", nombre: "Local" },
  { id: "visitante", nombre: "Visitante" },
  { id: "tercera", nombre: "Tercera" },
];

type Variante = Pick<Paleta, "base" | "alt" | "detalle" | "texto" | "patron">;
const blanca = (detalle: string, texto = detalle): Variante => ({ base: "#F8F8F6", alt: "#ECECE8", detalle, texto, patron: "liso" });
const lisa = (base: string, detalle: string, texto: string): Variante => ({ base, alt: base, detalle, texto, patron: "liso" });

/** Equipaciones de visitante y tercera por club (colores representativos de cada club). */
const VARIANTES: Record<string, { visitante: Variante; tercera: Variante }> = {
  "real madrid": { visitante: lisa("#16171B", "#C9A227", "#C9A227"), tercera: lisa("#5B2C83", "#FFFFFF", "#FFFFFF") },
  "fc barcelona": { visitante: lisa("#F7D417", "#A50044", "#A50044"), tercera: lisa("#1E2A4A", "#E4002B", "#FFFFFF") },
  "manchester city": { visitante: lisa("#16171B", "#6CABDD", "#6CABDD"), tercera: blanca("#6CABDD", "#1C2C5B") },
  "millonarios fc": { visitante: blanca("#0B3C8C"), tercera: lisa("#16171B", "#FFFFFF", "#FFFFFF") },
  "atlético nacional": { visitante: lisa("#0B7A3B", "#FFFFFF", "#FFFFFF"), tercera: lisa("#16171B", "#2FA05A", "#FFFFFF") },
  "paris saint-germain": { visitante: blanca("#0A1F44"), tercera: lisa("#16171B", "#E4002B", "#FFFFFF") },
  "bayern munich": { visitante: lisa("#0B1F4B", "#DC052D", "#FFFFFF"), tercera: blanca("#DC052D") },
  "selección colombia": { visitante: lisa("#0B2A6B", "#FCD116", "#FCD116"), tercera: blanca("#CE1126", "#003893") },
};

/** Luminancia: sirve para elegir tinta clara u oscura sobre un color. */
export function colorContraste(hex: string): string {
  return esOscuro(hex) ? "#FFFFFF" : "#1B1B1B";
}

/** Colores del equipo; si no se conoce, se arma con los de su liga. */
export function paletaDeClub(club: string, coloresLiga?: [string, string], equipacion: Equipacion = "local"): Paleta {
  const clave = club.trim().toLowerCase();
  const conocida = PALETAS[clave];
  const local: Paleta = conocida ?? (() => {
    const base = coloresLiga?.[0] ?? "#1E2A5A";
    return { base, alt: coloresLiga?.[1] ?? base, detalle: "#FFFFFF", texto: colorContraste(base), patron: "liso" as Patron };
  })();
  if (equipacion === "local") return local;
  const v = VARIANTES[clave]?.[equipacion] ?? (equipacion === "visitante" ? blanca(local.base, local.base) : lisa("#16171B", local.base, "#FFFFFF"));
  // Conserva el fabricante y el patrocinador del club.
  return { ...v, marcaUrl: local.marcaUrl, patrocinadorUrl: local.patrocinadorUrl };
}

export const COLORES_TEXTO = [
  { id: "#FFFFFF", nombre: "Blanco" },
  { id: "#1B1B1B", nombre: "Negro" },
  { id: "#EDBB00", nombre: "Dorado" },
  { id: "#E4002B", nombre: "Rojo" },
  { id: "#1E4FD8", nombre: "Azul" },
] as const;

export type ZonaParche = "manga-der" | "manga-izq" | "cuello-espalda";

export const PARCHES: { id: string; nombre: string; zona: ZonaParche; lado: "frente" | "espalda" }[] = [
  { id: "liga", nombre: "Parche de liga", zona: "manga-der", lado: "frente" },
  { id: "champions", nombre: "UEFA Champions League", zona: "manga-izq", lado: "frente" },
  { id: "orgullo", nombre: "Bandera de Colombia", zona: "cuello-espalda", lado: "espalda" },
];

const WM = "https://thumb.wikimedia.org/wikipedia/";
/** Logos oficiales de las ligas (Wikimedia Commons) para el parche de manga. */
export const LOGO_LIGA: Record<string, string> = {
  laliga: WM + "commons/thumb/0/03/LaLiga_logo_%282023%29.svg/500px-LaLiga_logo_%282023%29.svg.png",
  premier: WM + "en/thumb/f/f2/Premier_League_Logo.svg/500px-Premier_League_Logo.svg.png",
  ligue1: WM + "commons/thumb/a/a0/Ligue_1_2024_Logo.png/500px-Ligue_1_2024_Logo.png",
  bundesliga: WM + "en/thumb/d/df/Bundesliga_logo_%282017%29.svg/500px-Bundesliga_logo_%282017%29.svg.png",
  betplay: WM + "commons/thumb/e/e0/BetPlay-Dimayor_logo.svg/500px-BetPlay-Dimayor_logo.svg.png",
};
export const LOGO_CHAMPIONS = WM + "commons/thumb/d/d1/UEFA_Champions_League_logo_no_text.svg/500px-UEFA_Champions_League_logo_no_text.svg.png";

export const NOMBRE_MAX = 12;

export type EstadoCamiseta = {
  club: string | null;
  iniciales: string;
  paleta: Paleta;
  equipacion: Equipacion;
  manga: "Corta" | "Larga";
  nombre: string;
  numero: string;
  colorTexto: string;
  parches: string[];
  /** Escudo real del club (imagen) y logo real de su liga; null si no hay. */
  escudoUrl: string | null;
  ligaLogoUrl: string | null;
};

/** Normaliza lo que escribe la persona: nombre en mayúsculas sin símbolos raros y número de 0 a 99. */
export function limpiarNombre(v: string): string {
  return v
    .toUpperCase()
    .replace(/[^A-Z0-9ÁÉÍÓÚÜÑ .'-]/g, "")
    .slice(0, NOMBRE_MAX);
}

export function limpiarNumero(v: string): string {
  return v.replace(/\D/g, "").slice(0, 2);
}

/** Texto que se guarda en el pedido (el servidor lo recorta a 80 caracteres). */
export function descripcionPersonalizacion(e: Pick<EstadoCamiseta, "nombre" | "numero" | "parches"> & { equipacion?: Equipacion }): string {
  const partes: string[] = [];
  if (e.equipacion && e.equipacion !== "local") partes.push(e.equipacion === "visitante" ? "Visitante" : "Tercera");
  for (const id of e.parches) {
    const p = PARCHES.find((x) => x.id === id);
    if (p) partes.push(p.nombre);
  }
  const nombre = limpiarNombre(e.nombre).trim();
  const numero = limpiarNumero(e.numero);
  if (nombre || numero) partes.push(`"${nombre}" #${numero || "—"}`);
  return partes.join(" + ").slice(0, 80) || "Sin personalización";
}

/** Todas las imágenes externas que necesita pintar esta camiseta. */
export function imagenesDe(e: EstadoCamiseta): (string | null)[] {
  return [e.escudoUrl, e.ligaLogoUrl, LOGO_CHAMPIONS, e.paleta.marcaUrl ?? null, e.paleta.patrocinadorUrl ?? null];
}

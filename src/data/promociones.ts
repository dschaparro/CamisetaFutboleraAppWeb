/**
 * Promociones y banners SIMULADOS. Más adelante se administran desde el panel
 * (fase de ofertas y banners); mientras tanto, se editan aquí.
 */

export type Promocion = {
  slug: string;
  /** Porcentaje de descuento sobre el precio (entero, 1-90). */
  porcentaje: number;
  etiqueta: string;
  /** ISO, inclusive. Después de esta fecha deja de aplicar. */
  hasta: string;
};

export const PROMOCIONES: Promocion[] = [
  { slug: "BAY-99R", porcentaje: 20, etiqueta: "Retro week", hasta: "2026-10-31T23:59:59-05:00" },
  { slug: "MFC-26T", porcentaje: 15, etiqueta: "Clásico capitalino", hasta: "2026-10-20T23:59:59-05:00" },
  { slug: "PSG-27T", porcentaje: 10, etiqueta: "Oferta de lanzamiento", hasta: "2026-10-31T23:59:59-05:00" },
];

export type Banner = {
  id: string;
  antetitulo: string;
  titulo: string;
  texto: string;
  boton: string;
  enlace: string;
  /** Degradado de fondo y color del acento. */
  fondo: string;
  acento: string;
  /** Iniciales grandes que se dibujan a la derecha (mientras no hay fotos). */
  insignia: string;
};

export const BANNERS: Banner[] = [
  {
    id: "temporada",
    antetitulo: "Temporada 2027 · Nueva colección",
    titulo: "Tu pasión se viste aquí",
    texto: "Camisetas de clubes europeos, selecciones y equipos colombianos, con tu nombre y tu dorsal incluidos en el precio.",
    boton: "Ver catálogo",
    enlace: "/catalogo",
    fondo: "linear-gradient(135deg,#0A1626 0%,#13294B 60%,#1B3A66 100%)",
    acento: "#E3BE45",
    insignia: "CF",
  },
  {
    id: "retro",
    antetitulo: "Retro week · hasta 31 de octubre",
    titulo: "20 % off en camisetas retro",
    texto: "La Bayern Munich 1999 con descuento. Clásicos que nunca pasan de moda.",
    boton: "Ver la oferta",
    enlace: "/producto/BAY-99R",
    fondo: "linear-gradient(135deg,#4A0E10 0%,#7A1B12 55%,#D7282F 100%)",
    acento: "#FFD166",
    insignia: "BAY",
  },
  {
    id: "fpc",
    antetitulo: "Liga BetPlay",
    titulo: "Clásico capitalino: 15 % off Millonarios",
    texto: "Personalízala con tu nombre y dorsal sin costo extra. Entrega en 1-2 días hábiles en Bogotá.",
    boton: "Comprar ahora",
    enlace: "/producto/MFC-26T",
    fondo: "linear-gradient(135deg,#0B1E5C 0%,#1F4FD8 60%,#2E6FE0 100%)",
    acento: "#F5C518",
    insignia: "MFC",
  },
];

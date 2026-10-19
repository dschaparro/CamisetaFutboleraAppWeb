export type LigaId = "laliga" | "premier" | "ligue1" | "bundesliga" | "betplay" | "selecciones";

export type Product = {
  id: string;
  club: string;
  name: string;
  cat: "europeo" | "colombiano" | "seleccion";
  liga: LigaId;
  price: number;
  initials: string;
  personalizable: boolean;
  tag?: "Nuevo" | "Retro";
  retro?: boolean;
};

/** Ligas para el catálogo: nombre, texto corto y colores de su tarjeta. */
export const LIGAS: { id: LigaId; nombre: string; pais: string; descripcion: string; colores: [string, string] }[] = [
  { id: "laliga", nombre: "LaLiga", pais: "España", descripcion: "Real Madrid, Barcelona y más", colores: ["#E8452C", "#7A1B12"] },
  { id: "premier", nombre: "Premier League", pais: "Inglaterra", descripcion: "Los grandes de Inglaterra", colores: ["#5B2A86", "#23103A"] },
  { id: "ligue1", nombre: "Ligue 1", pais: "Francia", descripcion: "PSG y el fútbol francés", colores: ["#1F4FD8", "#0B1E5C"] },
  { id: "bundesliga", nombre: "Bundesliga", pais: "Alemania", descripcion: "Clásicos alemanes y retro", colores: ["#D7282F", "#4A0E10"] },
  { id: "betplay", nombre: "Liga BetPlay", pais: "Colombia", descripcion: "Millonarios, Nacional y el FPC", colores: ["#A87A00", "#14532D"] },
  { id: "selecciones", nombre: "Selecciones", pais: "Mundial", descripcion: "Viste la camiseta de tu país", colores: ["#B08600", "#002A6E"] },
];

export const PRODUCTS: Product[] = [
  { id: "RM-27T", club: "Real Madrid", name: "Camiseta Real Madrid Titular 2027", cat: "europeo", liga: "laliga", price: 130000, initials: "RM", personalizable: true, tag: "Nuevo" },
  { id: "SEL-27L", club: "Selección Colombia", name: "Camiseta Local Selección Colombia 2027", cat: "seleccion", liga: "selecciones", price: 135000, initials: "SEL", personalizable: true },
  { id: "FCB-27V", club: "FC Barcelona", name: "Camiseta FC Barcelona Visitante 2027", cat: "europeo", liga: "laliga", price: 125000, initials: "FCB", personalizable: true },
  { id: "PSG-27T", club: "Paris Saint-Germain", name: "Camiseta PSG Titular 2027", cat: "europeo", liga: "ligue1", price: 130000, initials: "PSG", personalizable: true },
  { id: "MFC-26T", club: "Millonarios FC", name: "Camiseta Millonarios Titular 2026", cat: "colombiano", liga: "betplay", price: 115000, initials: "MFC", personalizable: true },
  { id: "BAY-99R", club: "Bayern Munich", name: "Camiseta Bayern Munich Retro 1999", cat: "europeo", liga: "bundesliga", price: 120000, initials: "BAY", personalizable: false, tag: "Retro", retro: true },
  { id: "ATN-26T", club: "Atlético Nacional", name: "Camiseta Atlético Nacional Titular 2026", cat: "colombiano", liga: "betplay", price: 115000, initials: "ATN", personalizable: true },
  { id: "MCI-27T", club: "Manchester City", name: "Camiseta Manchester City Titular 2027", cat: "europeo", liga: "premier", price: 130000, initials: "MCI", personalizable: true },
];

export function crestGradient(cat: Product["cat"]): string {
  return cat === "colombiano"
    ? "linear-gradient(135deg,#2E6FE0,#13294B)"
    : "linear-gradient(135deg,#13294B,#0A1626)";
}

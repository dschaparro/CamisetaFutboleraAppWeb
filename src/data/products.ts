// Módulo: Catálogo — datos de ejemplo (RF-05, RF-06, RF-09).
// Sustituir por una consulta real a la tabla `productos` de Supabase
// (ver src/lib/supabaseClient.ts) cuando el backend ERP esté listo.
export type Product = {
  id: string;
  club: string;
  name: string;
  cat: "europeo" | "colombiano" | "seleccion";
  price: number;
  initials: string;
  personalizable: boolean;
  tag?: "Nuevo" | "Retro";
  retro?: boolean;
};

export const PRODUCTS: Product[] = [
  { id: "RM-27T", club: "Real Madrid", name: "Camiseta Real Madrid Titular 2027", cat: "europeo", price: 130000, initials: "RM", personalizable: true, tag: "Nuevo" },
  { id: "SEL-27L", club: "Selección Colombia", name: "Camiseta Local Selección Colombia 2027", cat: "seleccion", price: 135000, initials: "SEL", personalizable: true },
  { id: "FCB-27V", club: "FC Barcelona", name: "Camiseta FC Barcelona Visitante 2027", cat: "europeo", price: 125000, initials: "FCB", personalizable: true },
  { id: "PSG-27T", club: "Paris Saint-Germain", name: "Camiseta PSG Titular 2027", cat: "europeo", price: 130000, initials: "PSG", personalizable: true },
  { id: "MFC-26T", club: "Millonarios FC", name: "Camiseta Millonarios Titular 2026", cat: "colombiano", price: 115000, initials: "MFC", personalizable: true },
  { id: "BAY-99R", club: "Bayern Munich", name: "Camiseta Bayern Munich Retro 1999", cat: "europeo", price: 120000, initials: "BAY", personalizable: false, tag: "Retro", retro: true },
  { id: "ATN-26T", club: "Atlético Nacional", name: "Camiseta Atlético Nacional Titular 2026", cat: "colombiano", price: 115000, initials: "ATN", personalizable: true },
  { id: "MCI-27T", club: "Manchester City", name: "Camiseta Manchester City Titular 2027", cat: "europeo", price: 130000, initials: "MCI", personalizable: true },
];

export function crestGradient(cat: Product["cat"]): string {
  return cat === "colombiano"
    ? "linear-gradient(135deg,#2E6FE0,#13294B)"
    : "linear-gradient(135deg,#13294B,#0A1626)";
}

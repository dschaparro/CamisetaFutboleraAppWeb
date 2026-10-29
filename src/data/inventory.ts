export type InventoryRow = {
  name: string;
  sku: string;
  prov: string;
  cost: number;
  price: number;
  margin: string;
  stock: number;
};

export const INVENTORY: InventoryRow[] = [
  { name: "Real Madrid Titular 2026/27", sku: "CF-RM-27T", prov: "Distrideportes", cost: 78000, price: 130000, margin: "40%", stock: 12 },
  { name: "FC Barcelona Visitante 2026/27", sku: "CF-FCB-27V", prov: "Importfut", cost: 76000, price: 125000, margin: "39%", stock: 0 },
  { name: "Millonarios FC Titular 2026", sku: "CF-MFC-26T", prov: "Local Bogotá", cost: 68000, price: 115000, margin: "41%", stock: 23 },
  { name: "Atlético Nacional Titular 2026", sku: "CF-ATN-26T", prov: "Local Bogotá", cost: 66000, price: 115000, margin: "43%", stock: 4 },
  { name: "Selección Colombia Local 2026", sku: "CF-SEL-27L", prov: "Distrideportes", cost: 82000, price: 135000, margin: "39%", stock: 18 },
  { name: "PSG Titular 2026/27", sku: "CF-PSG-27T", prov: "Importfut", cost: 78000, price: 130000, margin: "40%", stock: 10 },
  { name: "Manchester City Titular 2026/27", sku: "CF-MCI-27T", prov: "Importfut", cost: 78000, price: 130000, margin: "40%", stock: 10 },
  { name: "Bayern Munich Retro 1999", sku: "CF-BAY-99R", prov: "Importfut", cost: 72000, price: 120000, margin: "40%", stock: 10 },
];

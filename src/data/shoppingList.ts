export type ShoppingListStatus = "Pendiente" | "Conseguido" | "No conseguido";

export type ShoppingListItem = {
  product: string;
  variant: string;
  custom: string;
  origin: string;
  status: ShoppingListStatus;
  note?: string;
};

export const SHOPPING_LIST: ShoppingListItem[] = [
  { product: "Dorsal MARTÍNEZ #7", variant: "—", custom: "Dorsal", origin: "Venta #CF-00845", status: "Pendiente" },
  { product: "Camiseta Barcelona Titular", variant: "M · 2027", custom: "Sin personalización", origin: "Pedido #CF-00842", status: "Pendiente" },
  { product: "Camiseta Real Madrid Visitante", variant: "L · 2027", custom: "Sin personalización", origin: "Pedido #CF-00842", status: "Pendiente" },
  { product: "Balón oficial LaLiga", variant: "Talla 5", custom: "—", origin: "Venta #CF-00840", status: "Pendiente" },
  { product: "Camiseta Selección Colombia", variant: "S · 2027", custom: '"JAMES" #10', origin: "Pedido #CF-00836", status: "Pendiente" },
  { product: "Medias Selección Colombia", variant: "Única", custom: "—", origin: "Venta #CF-00838", status: "Conseguido", note: "Compra #C-1290 registrada" },
  { product: "Camiseta Millonarios Retro", variant: "S · 2015 (retro)", custom: "Parche LaLiga", origin: "Pedido #CF-00833", status: "No conseguido" },
  { product: "Camiseta PSG Titular", variant: "M · 2027", custom: '"MBAPPÉ" #7', origin: "Venta #CF-00830", status: "Conseguido", note: "Compra #C-1281 registrada" },
  { product: "Camiseta Bayern Retro", variant: "L · 1999", custom: "—", origin: "Pedido #CF-00828", status: "Conseguido", note: "Compra #C-1275 registrada" },
];

// Módulo: Ventas / Pedidos — datos de ejemplo (RF-16 a RF-19).
export type OrderStatus = "Alistamiento" | "Enviado" | "Entregado" | "Pendiente de pago";

export type Order = {
  id: string;
  client: string;
  kind: string;
  items: number;
  total: number;
  pay: string;
  status: OrderStatus;
};

export const ORDERS: Order[] = [
  { id: "CF-00842", client: "Laura Ramírez", kind: "Registrada", items: 3, total: 510000, pay: "Pagado", status: "Alistamiento" },
  { id: "CF-00841", client: "Andrés Pérez", kind: "Invitado", items: 1, total: 130000, pay: "Pagado", status: "Enviado" },
  { id: "CF-00840", client: "Camila Ruiz", kind: "Registrada", items: 2, total: 245000, pay: "Pagado", status: "Entregado" },
  { id: "CF-00839", client: "Invitado", kind: "Sin cuenta", items: 1, total: 115000, pay: "Pagado", status: "Entregado" },
  { id: "CF-00838", client: "Julián Torres", kind: "Registrado", items: 1, total: 70000, pay: "Abono 50%", status: "Alistamiento" },
  { id: "CF-00837", client: "María Gómez", kind: "Invitada", items: 2, total: 260000, pay: "Pendiente", status: "Pendiente de pago" },
];

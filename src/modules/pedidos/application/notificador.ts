import type { Pedido } from "@/modules/pedidos/domain/types";

/** Puerto de correo transaccional (pedido / factura). Sin I/O aquí. */
export type NotificadorPedido = {
  confirmarPedido(pedido: Pedido): Promise<void>;
};

export async function avisarPedidoCreado(pedido: Pedido, mail: NotificadorPedido): Promise<void> {
  await mail.confirmarPedido(pedido);
}

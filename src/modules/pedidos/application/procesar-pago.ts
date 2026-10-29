import type { Pasarela, PedidosRepo, ResultadoPago, TarjetaGuardadaRef } from "@/modules/pedidos/application/puertos";
import { pagarPedido, puedeVer } from "@/modules/pedidos/application/pedidos";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";
import type { Pedido } from "@/modules/pedidos/domain/types";

export class PedidoNoVisibleError extends Error {
  constructor() {
    super("No encontramos ese pedido");
    this.name = "PedidoNoVisibleError";
  }
}

export type ProcesarPagoDeps = {
  pedidos: PedidosRepo;
  pasarela: Pasarela;
  clave: string | null;
  clienteId: string | null;
  tarjetas: TarjetaGuardadaRef[];
  ahora: Date;
};

export type ResultadoProcesarPago = {
  pedido: Pedido;
  pago: ResultadoPago;
};

/** Autoriza, cobra por la pasarela y registra el resultado en el pedido. */
export async function procesarPagoPedido(
  id: string,
  raw: unknown,
  deps: ProcesarPagoDeps,
): Promise<ResultadoProcesarPago> {
  const pedido = await deps.pedidos.buscar(id);
  if (!pedido || !puedeVer(pedido, deps.clave, deps.clienteId)) {
    throw new PedidoNoVisibleError();
  }
  if (pedido.estado !== "Pendiente de pago") {
    throw new PagoNoPermitidoError("Este pedido ya no tiene pagos pendientes");
  }

  const pago = await deps.pasarela.cobrarDesdeBody(raw, (medioId) => deps.tarjetas.find((t) => t.id === medioId) ?? null);
  const actualizado = await pagarPedido(pedido, pago, { repo: deps.pedidos, ahora: deps.ahora });
  return { pedido: actualizado, pago };
}

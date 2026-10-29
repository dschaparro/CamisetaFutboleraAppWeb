import { PedidoNoVisibleError } from "@/modules/pedidos/application/procesar-pago";
import type { MercadoPagoCliente, PedidosRepo } from "@/modules/pedidos/application/puertos";
import { puedeVer } from "@/modules/pedidos/application/pedidos";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";

export type IniciarCheckoutMpDeps = {
  pedidos: PedidosRepo;
  mp: MercadoPagoCliente;
  clave: string | null;
  clienteId: string | null;
};

export type CheckoutMpIniciado = {
  redirectUrl: string;
  preferenciaId: string;
};

/** Crea la preferencia Checkout Pro y devuelve la URL de Mercado Pago. */
export async function iniciarCheckoutMercadoPago(
  pedidoId: string,
  deps: IniciarCheckoutMpDeps,
): Promise<CheckoutMpIniciado> {
  const pedido = await deps.pedidos.buscar(pedidoId);
  if (!pedido || !puedeVer(pedido, deps.clave, deps.clienteId)) {
    throw new PedidoNoVisibleError();
  }
  if (pedido.estado !== "Pendiente de pago") {
    throw new PagoNoPermitidoError("Este pedido ya no tiene pagos pendientes");
  }
  if (!deps.clave && !deps.clienteId) {
    throw new PedidoNoVisibleError();
  }
  const clave = deps.clave ?? pedido.claveAcceso;
  const pref = await deps.mp.crearPreferenciaCheckout(pedido, clave);
  return { redirectUrl: pref.redirectUrl, preferenciaId: pref.id };
}

import { pagarPedido } from "@/modules/pedidos/application/pedidos";
import type {
  MercadoPagoCliente,
  PedidosRepo,
  PagoExternoMp,
  ResultadoPago,
} from "@/modules/pedidos/application/puertos";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";
import type { Pedido } from "@/modules/pedidos/domain/types";

export type ConfirmarPagoMpDeps = {
  pedidos: PedidosRepo;
  mp: MercadoPagoCliente;
  ahora: Date;
};

function aResultado(pago: PagoExternoMp): ResultadoPago {
  const ref = `MP-${pago.id}`;
  if (pago.status === "approved") {
    return { aprobado: true, referencia: ref, mensaje: "Pago aprobado por Mercado Pago" };
  }
  if (pago.status === "pending" || pago.status === "in_process" || pago.status === "authorized") {
    return {
      aprobado: false,
      referencia: ref,
      mensaje: "El pago quedó pendiente en Mercado Pago. Te avisaremos cuando se acredite.",
    };
  }
  return {
    aprobado: false,
    referencia: ref,
    mensaje: `Pago no aprobado (${pago.status_detail ?? pago.status})`,
  };
}

/**
 * Fuente de verdad: GET /v1/payments/{id} (vía puerto mp).
 * Idempotente: si el pedido ya no está pendiente, no falla (webhook/retorno duplicados).
 */
export async function confirmarPagoPorIdMp(
  paymentId: string,
  deps: ConfirmarPagoMpDeps,
): Promise<{ pedido: Pedido | null; pago: ResultadoPago }> {
  const mp = await deps.mp.obtenerPago(paymentId);
  const resultado = aResultado(mp);
  const pedidoId = mp.external_reference?.trim();
  if (!pedidoId) {
    return { pedido: null, pago: resultado };
  }

  const pedido = await deps.pedidos.buscar(pedidoId);
  if (!pedido) return { pedido: null, pago: resultado };

  if (pedido.estado !== "Pendiente de pago") {
    return { pedido, pago: resultado };
  }

  const persistir = { repo: deps.pedidos, ahora: deps.ahora };

  if (!resultado.aprobado) {
    try {
      const actualizado = await pagarPedido(pedido, resultado, persistir);
      return { pedido: actualizado, pago: resultado };
    } catch (err) {
      if (err instanceof PagoNoPermitidoError) return { pedido, pago: resultado };
      throw err;
    }
  }

  const actualizado = await pagarPedido(pedido, resultado, persistir);
  return { pedido: actualizado, pago: resultado };
}

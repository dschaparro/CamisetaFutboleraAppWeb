import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { confirmarPagoPorIdMp } from "@/modules/pedidos/application/confirmar-pago-mp";
import { PedidoNoVisibleError } from "@/modules/pedidos/application/procesar-pago";
import { puedeVer } from "@/modules/pedidos/application/pedidos";
import { MercadoPagoError, mercadoPagoCliente } from "@/modules/pedidos/infrastructure/mercadopago-api";
import { sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/**
 * Tras el retorno de Checkout Pro (payment_id en la URL), sincroniza el estado
 * por si el webhook aún no llegó (útil en demos / localhost con túnel).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { k?: string; paymentId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const paymentId = String(body.paymentId ?? "").trim();
  if (!paymentId) return errorJson(400, "VALIDATION_ERROR", "Falta paymentId");

  const sesion = await sesionCliente(request);
  const clave = typeof body.k === "string" ? body.k : null;
  const pedido = await pedidosRepo().buscar(id);
  if (!pedido || !puedeVer(pedido, clave, sesion?.sub ?? null)) {
    return errorJson(404, "NOT_FOUND", new PedidoNoVisibleError().message);
  }

  try {
    const { pago } = await confirmarPagoPorIdMp(paymentId, {
      pedidos: pedidosRepo(),
      mp: mercadoPagoCliente(),
      ahora: new Date(),
    });
    const actualizado = await pedidosRepo().buscar(id);
    return NextResponse.json({
      aprobado: pago.aprobado,
      mensaje: pago.mensaje,
      referencia: pago.referencia,
      estado: actualizado?.estado ?? pedido.estado,
      estadoPago: actualizado?.estadoPago ?? pedido.estadoPago,
    });
  } catch (err) {
    if (err instanceof MercadoPagoError) return errorJson(502, "MERCADOPAGO_ERROR", err.message);
    throw err;
  }
}

import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { clientKey, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { iniciarCheckoutMercadoPago } from "@/modules/pedidos/application/iniciar-checkout-mp";
import { PedidoNoVisibleError, procesarPagoPedido } from "@/modules/pedidos/application/procesar-pago";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";
import { MercadoPagoError, mercadoPagoCliente } from "@/modules/pedidos/infrastructure/mercadopago-api";
import { modoPasarela, pasarelaActiva } from "@/modules/pedidos/infrastructure/pasarela";
import { DatosPagoInvalidosError } from "@/modules/pedidos/infrastructure/pasarela-simulada";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

function leerClave(body: unknown): string | null {
  return typeof body === "object" && body !== null && typeof (body as { k?: unknown }).k === "string"
    ? (body as { k: string }).k
    : null;
}

/** Composition: rate-limit → Checkout Pro (MP) o cobro simulado → application. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!allowAttempt(`pago:${clientKey(request)}`, 15, 10 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos de pago. Espera unos minutos.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const sesion = await sesionCliente(request);
  const clave = leerClave(body);

  try {
    if (modoPasarela() === "mercadopago") {
      const { redirectUrl, preferenciaId } = await iniciarCheckoutMercadoPago(id, {
        pedidos: pedidosRepo(),
        mp: mercadoPagoCliente(),
        clave,
        clienteId: sesion?.sub ?? null,
      });
      return NextResponse.json({ modo: "mercadopago", redirectUrl, preferenciaId });
    }

    const tarjetas = sesion ? (await clientesRepo().perfil(sesion.sub)).tarjetas : [];
    const { pedido, pago } = await procesarPagoPedido(id, body, {
      pedidos: pedidosRepo(),
      pasarela: pasarelaActiva(),
      clave,
      clienteId: sesion?.sub ?? null,
      tarjetas: tarjetas.map((t) => ({ id: t.id, ultimos4: t.ultimos4 })),
      ahora: new Date(),
    });
    return NextResponse.json({
      modo: "simulada",
      aprobado: pago.aprobado,
      mensaje: pago.mensaje,
      referencia: pago.referencia,
      estado: pedido.estado,
    });
  } catch (err) {
    if (err instanceof PedidoNoVisibleError) return errorJson(404, "NOT_FOUND", err.message);
    if (err instanceof DatosPagoInvalidosError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof PagoNoPermitidoError) return errorJson(409, "YA_PAGADO", err.message);
    if (err instanceof MercadoPagoError) return errorJson(502, "MERCADOPAGO_ERROR", err.message);
    throw err;
  }
}

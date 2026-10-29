import { NextResponse } from "next/server";
import { confirmarPagoPorIdMp } from "@/modules/pedidos/application/confirmar-pago-mp";
import { mercadoPagoCliente, validarFirmaWebhook } from "@/modules/pedidos/infrastructure/mercadopago-api";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

export const dynamic = "force-dynamic";

/**
 * Webhook Checkout Pro (topic payment).
 * Docs: https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks
 * Responde 200 rápido; la fuente de verdad es GET /v1/payments/{id}.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataIdQuery = url.searchParams.get("data.id") ?? url.searchParams.get("data_id");

  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const dataId = String(body.data?.id ?? dataIdQuery ?? "").trim();
  const tipo = body.type ?? url.searchParams.get("type") ?? "";
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!validarFirmaWebhook({ xSignature, xRequestId, dataId: dataId || null })) {
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message: "Firma inválida" } }, { status: 401 });
  }

  // ACK inmediato si no es pago o falta id (MP reintenta si no hay 2xx).
  if (!dataId || (tipo && tipo !== "payment")) {
    return NextResponse.json({ ok: true });
  }

  try {
    await confirmarPagoPorIdMp(dataId, {
      pedidos: pedidosRepo(),
      mp: mercadoPagoCliente(),
      ahora: new Date(),
    });
  } catch (err) {
    console.error("[mercadopago:webhook]", err instanceof Error ? err.message : err);
    // 200 para no saturar reintentos ante errores de nuestro lado transitorios; el retorno del usuario también sincroniza.
  }

  return NextResponse.json({ ok: true });
}

/** Algunos paneles de MP hacen GET de verificación. */
export async function GET() {
  return NextResponse.json({ ok: true, servicio: "mercadopago-webhook" });
}

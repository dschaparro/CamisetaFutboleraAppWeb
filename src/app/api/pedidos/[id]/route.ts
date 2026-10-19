import { NextResponse } from "next/server";
import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { actualizarEstado, vistaPanel } from "@/modules/pedidos/application/pedidos";
import { TransicionInvalidaError } from "@/modules/pedidos/domain/pedido";
import { ESTADOS_PEDIDO, type EstadoPedido } from "@/modules/pedidos/domain/types";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Cambia el estado de un pedido desde el panel. El cliente lo ve en «Mis pedidos». */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }
  if (!(ESTADOS_PEDIDO as readonly unknown[]).includes(body.estado)) {
    return errorJson(400, "VALIDATION_ERROR", "Estado inválido");
  }
  try {
    const pedido = await actualizarEstado(id, body.estado as EstadoPedido, typeof body.guia === "string" ? body.guia : null, {
      repo: pedidosRepo(),
      ahora: new Date(),
    });
    if (!pedido) return errorJson(404, "NOT_FOUND", "No existe ese pedido");
    return NextResponse.json({ pedido: vistaPanel(pedido) });
  } catch (err) {
    if (err instanceof TransicionInvalidaError) return errorJson(409, "TRANSICION_INVALIDA", err.message);
    throw err;
  }
}

import { NextResponse } from "next/server";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { clientKey, errorJson, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { pagarPedido, puedeVer } from "@/modules/pedidos/application/pedidos";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";
import { cobrar, DatosPagoInvalidosError, leerSolicitud } from "@/modules/pedidos/infrastructure/pasarela-simulada";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Pasarela SIMULADA: procesa el pago de un pedido pendiente. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!allowAttempt(`pago:${clientKey(request)}`, 15, 10 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos de pago. Espera unos minutos.");
  }

  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const repo = pedidosRepo();
  const sesion = await sesionCliente(request);
  const pedido = await repo.buscar(id);
  if (!pedido || !puedeVer(pedido, typeof body.k === "string" ? body.k : null, sesion?.sub ?? null)) {
    return errorJson(404, "NOT_FOUND", "No encontramos ese pedido");
  }

  try {
    // Tarjetas guardadas: solo las del cliente con sesión.
    const tarjetas = sesion ? (await clientesRepo().perfil(sesion.sub)).tarjetas : [];
    const solicitud = leerSolicitud(body, (medioId) => tarjetas.find((t) => t.id === medioId) ?? null);
    if (pedido.estado !== "Pendiente de pago") throw new PagoNoPermitidoError("Este pedido ya no tiene pagos pendientes");
    const resultado = await cobrar(solicitud);
    const actualizado = await pagarPedido(pedido, resultado, { repo, ahora: new Date() });
    return NextResponse.json({ aprobado: resultado.aprobado, mensaje: resultado.mensaje, referencia: resultado.referencia, estado: actualizado.estado });
  } catch (err) {
    if (err instanceof DatosPagoInvalidosError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof PagoNoPermitidoError) return errorJson(409, "YA_PAGADO", err.message);
    throw err;
  }
}

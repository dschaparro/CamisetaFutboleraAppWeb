import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { NoEncontradoError, OperacionInvalidaError } from "@/modules/operacion/domain/operacion";
import { PedidoInvalidoError } from "@/modules/pedidos/domain/pedido";

/** Ejecuta una acción del panel y traduce los errores de dominio a HTTP. */
export async function responder(accion: () => unknown | Promise<unknown>, estado = 200): Promise<NextResponse> {
  try {
    return NextResponse.json((await accion()) ?? { ok: true }, { status: estado });
  } catch (err) {
    if (err instanceof OperacionInvalidaError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof PedidoInvalidoError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof NoEncontradoError) return errorJson(404, "NOT_FOUND", err.message);
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}

export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new OperacionInvalidaError({ cuerpo: "Cuerpo JSON inválido" });
  }
}

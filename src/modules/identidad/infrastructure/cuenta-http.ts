import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { NoEncontradoError } from "@/modules/identidad/application/mi-cuenta";
import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { errorJson, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";

/**
 * Envuelve las rutas de «Mi cuenta»: exige sesión de cliente, lee el JSON y
 * traduce los errores de dominio a respuestas HTTP con mensajes por campo.
 */
export async function conCliente(
  request: Request,
  accion: (clienteId: string, body: unknown) => Promise<unknown>,
  opciones: { leerCuerpo?: boolean } = { leerCuerpo: true },
): Promise<NextResponse> {
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Tu sesión terminó. Ingresa de nuevo.");

  let body: unknown = null;
  if (opciones.leerCuerpo) {
    try {
      body = await request.json();
    } catch {
      return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
    }
  }

  try {
    return NextResponse.json((await accion(sesion.sub, body)) ?? { ok: true });
  } catch (err) {
    if (err instanceof CuentaInvalidaError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof NoEncontradoError) return errorJson(404, "NOT_FOUND", err.message);
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", "Esta función no está disponible por ahora.");
    throw err;
  }
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${crypto.randomUUID()}`;
}

import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { actualizarUsuario } from "@/modules/identidad/application/gestionar-usuarios";
import { CuentaInvalidaError, OperacionNoPermitidaError } from "@/modules/identidad/domain/cuentas";
import { usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { errorJson, sesionPersonal } from "@/modules/identidad/infrastructure/sesiones";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await sesionPersonal(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "No hay sesión");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  try {
    const usuario = await actualizarUsuario(sesion.sub, id, body, usuariosRepo());
    if (!usuario) return errorJson(404, "NOT_FOUND", "No existe ese usuario");
    return NextResponse.json({ usuario });
  } catch (err) {
    if (err instanceof CuentaInvalidaError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof OperacionNoPermitidaError) return errorJson(409, "NO_PERMITIDO", err.message);
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}

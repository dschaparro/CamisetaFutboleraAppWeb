import { NextResponse } from "next/server";
import { registrarCliente } from "@/modules/identidad/application/registrar-cliente";
import { CuentaInvalidaError, EmailYaRegistradoError } from "@/modules/identidad/domain/cuentas";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo, usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { clientKey, errorJson, ponerSesion } from "@/modules/identidad/infrastructure/sesiones";

export async function POST(request: Request) {
  if (!allowAttempt(`registro:${clientKey(request)}`, 5, 60 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados registros desde esta conexión. Prueba más tarde.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  try {
    const { cliente, token } = await registrarCliente(body, { clientes: clientesRepo(), usuarios: usuariosRepo() }, getJwtSecret());
    const response = NextResponse.json({ cliente: { nombre: cliente.nombre, email: cliente.email } }, { status: 201 });
    ponerSesion(response, "cliente", token);
    return response;
  } catch (err) {
    if (err instanceof CuentaInvalidaError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof EmailYaRegistradoError) {
      return errorJson(409, "EMAIL_EN_USO", "Ya existe una cuenta con ese correo. Ingresa con tu contraseña.", {
        email: "Ya existe una cuenta con ese correo",
      });
    }
    console.error("[registro]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos crear tu cuenta en este momento. Intenta de nuevo.");
  }
}

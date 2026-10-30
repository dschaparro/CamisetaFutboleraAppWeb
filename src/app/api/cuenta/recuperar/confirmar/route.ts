import { NextResponse } from "next/server";
import { confirmarResetPassword, inspeccionarTokenReset } from "@/modules/identidad/application/recuperar-password";
import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { resetTokensRepo } from "@/modules/identidad/infrastructure/reset-tokens";
import { clientKey, errorJson } from "@/modules/identidad/infrastructure/sesiones";

/** Valida el token del enlace (antes de mostrar el formulario). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const r = await inspeccionarTokenReset(token, resetTokensRepo());
  if (!r.ok) return errorJson(400, "TOKEN_INVALIDO", r.motivo, { token: r.motivo });
  return NextResponse.json({ ok: true });
}

/** Guarda la nueva contraseña y consume el token. */
export async function POST(request: Request) {
  if (!allowAttempt(`recuperar-confirmar:${clientKey(request)}`, 8, 15 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Prueba en unos minutos.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  try {
    await confirmarResetPassword(body, { clientes: clientesRepo(), tokens: resetTokensRepo() });
    return NextResponse.json({
      ok: true,
      mensaje: "Contraseña actualizada. Ya puedes ingresar con la nueva clave.",
    });
  } catch (err) {
    if (err instanceof CuentaInvalidaError) {
      return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    }
    console.error("[recuperar/confirmar]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos guardar la contraseña. Intenta de nuevo.");
  }
}

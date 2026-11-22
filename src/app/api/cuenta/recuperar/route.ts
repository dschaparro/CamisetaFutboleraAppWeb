import { NextResponse } from "next/server";
import { solicitarResetPassword } from "@/modules/identidad/application/recuperar-password";
import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { appBaseUrl, correoReset } from "@/modules/identidad/infrastructure/correo-reset";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo, usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { resetTokensRepo } from "@/modules/identidad/infrastructure/reset-tokens";
import { clientKey, errorJson } from "@/modules/identidad/infrastructure/sesiones";

/** Solicita un enlace para restablecer la contraseña del cliente. */
export async function POST(request: Request) {
  if (!allowAttempt(`recuperar:${clientKey(request)}`, 5, 15 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Prueba en unos minutos.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  try {
    const resultado = await solicitarResetPassword(body, {
      clientes: clientesRepo(),
      usuarios: usuariosRepo(),
      tokens: resetTokensRepo(),
      mail: correoReset,
      baseUrl: appBaseUrl(request),
    });

    if (resultado.estado === "sin_cuenta") {
      return errorJson(404, "CUENTA_NO_ENCONTRADA", "No encontramos una cuenta de cliente con ese correo.", {
        email: "No hay una cuenta registrada con este correo",
      });
    }
    if (resultado.estado === "cuenta_equipo") {
      return errorJson(400, "CUENTA_EQUIPO", "Este correo es del equipo interno. Pide el restablecimiento a un administrador.", {
        email: "Este correo pertenece al personal del panel",
      });
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Enviamos un enlace a ${resultado.email}. Revisa también spam.`,
      email: resultado.email,
    });
  } catch (err) {
    if (err instanceof CuentaInvalidaError) {
      return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    }
    console.error("[recuperar]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos procesar la solicitud. Intenta de nuevo.");
  }
}

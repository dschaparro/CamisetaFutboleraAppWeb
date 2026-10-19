import { NextResponse } from "next/server";
import { ingresar } from "@/modules/identidad/application/ingresar";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo, usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { clientKey, errorJson, ponerSesion } from "@/modules/identidad/infrastructure/sesiones";

/** «Ingresar» único de la tienda: el personal va al panel y los clientes a /cuenta. */
export async function POST(request: Request) {
  // El límite de intentos solo rige en producción: en desarrollo no estorba al probar.
  if (process.env.NODE_ENV === "production" && !allowAttempt(`ingresar:${clientKey(request)}`)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Prueba en unos minutos.");
  }

  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  let resultado: Awaited<ReturnType<typeof ingresar>>;
  try {
    resultado = await ingresar(
      String(body.email ?? ""),
      String(body.password ?? ""),
      { usuarios: usuariosRepo(), clientes: clientesRepo() },
      getJwtSecret(),
    );
  } catch (err) {
    console.error("[ingresar]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos validar tu acceso en este momento. Intenta de nuevo.");
  }

  if (!resultado) return errorJson(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos");

  const response = NextResponse.json({ tipo: resultado.tipo, destino: resultado.destino, nombre: resultado.nombre });
  ponerSesion(response, resultado.tipo, resultado.token);
  return response;
}

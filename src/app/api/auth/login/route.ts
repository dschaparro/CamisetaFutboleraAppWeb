import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { iniciarSesion } from "@/modules/identidad/application/iniciar-sesion";
import { usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/identidad/infrastructure/session-cookie";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";
import { clientKey } from "@/modules/identidad/infrastructure/sesiones";

const GENERIC_ERROR = "Correo o contraseña incorrectos";
const UNAVAILABLE = "No se pudo validar el acceso. Intenta de nuevo en un momento.";

/** Composition: valida rate-limit/HTTP → inyecta repo → application.iniciarSesion. */
export async function POST(request: Request) {
  // El límite de intentos solo rige en producción: en desarrollo no estorba al probar.
  if (process.env.NODE_ENV === "production" && !allowAttempt(`login:${clientKey(request)}`)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Prueba más tarde.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const email = typeof body === "object" && body && "email" in body ? String((body as { email: unknown }).email) : "";
  const password =
    typeof body === "object" && body && "password" in body ? String((body as { password: unknown }).password) : "";

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    return errorJson(503, "UNAVAILABLE", UNAVAILABLE);
  }

  let result: Awaited<ReturnType<typeof iniciarSesion>>;
  try {
    result = await iniciarSesion(email, password, usuariosRepo(), secret);
  } catch {
    return errorJson(503, "UNAVAILABLE", UNAVAILABLE);
  }

  if (!result) {
    return errorJson(401, "INVALID_CREDENTIALS", GENERIC_ERROR);
  }

  const response = NextResponse.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      nombre: result.user.nombre,
      rol: result.user.rol,
    },
  });
  response.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
  return response;
}

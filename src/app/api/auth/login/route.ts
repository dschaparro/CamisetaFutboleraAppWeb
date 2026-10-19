import { NextResponse } from "next/server";
import { iniciarSesion } from "@/modules/identidad/application/iniciar-sesion";
import { usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/identidad/infrastructure/session-cookie";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";

const GENERIC_ERROR = "Correo o contraseña incorrectos";
const UNAVAILABLE = "No se pudo validar el acceso. Intenta de nuevo en un momento.";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  // El límite de intentos solo rige en producción: en desarrollo no estorba al probar.
  if (process.env.NODE_ENV === "production" && !allowAttempt(`login:${clientKey(request)}`)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Demasiados intentos. Prueba más tarde." } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Cuerpo JSON inválido" } },
      { status: 400 },
    );
  }

  const email = typeof body === "object" && body && "email" in body ? String((body as { email: unknown }).email) : "";
  const password =
    typeof body === "object" && body && "password" in body ? String((body as { password: unknown }).password) : "";

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: UNAVAILABLE } }, { status: 503 });
  }

  let result: Awaited<ReturnType<typeof iniciarSesion>>;
  try {
    result = await iniciarSesion(email, password, usuariosRepo(), secret);
  } catch {
    return NextResponse.json({ error: { code: "UNAVAILABLE", message: UNAVAILABLE } }, { status: 503 });
  }

  if (!result) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: GENERIC_ERROR } },
      { status: 401 },
    );
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

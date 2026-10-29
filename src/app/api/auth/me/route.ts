import { NextRequest, NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { verifySessionToken } from "@/modules/identidad/domain/token";
import { SESSION_COOKIE } from "@/modules/identidad/infrastructure/session-cookie";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";
import { DEV_BYPASS_USER, isDevAuthBypass } from "@/modules/identidad/infrastructure/dev-bypass";

export async function GET(request: NextRequest) {
  if (isDevAuthBypass()) {
    return NextResponse.json({ user: DEV_BYPASS_USER });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return errorJson(401, "UNAUTHENTICATED", "No hay sesión");
  }

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    return errorJson(503, "UNAVAILABLE", "No se pudo validar el acceso.");
  }

  const claims = await verifySessionToken(token, secret);
  if (!claims) {
    return errorJson(401, "UNAUTHENTICATED", "Sesión inválida");
  }

  return NextResponse.json({
    user: {
      id: claims.sub,
      email: claims.email,
      nombre: claims.nombre,
      rol: claims.rol,
    },
  });
}

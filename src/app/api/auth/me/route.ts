import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/modules/identidad/domain/token";
import { SESSION_COOKIE } from "@/modules/identidad/infrastructure/session-cookie";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "No hay sesión" } },
      { status: 401 },
    );
  }

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch {
    return NextResponse.json(
      { error: { code: "UNAVAILABLE", message: "No se pudo validar el acceso." } },
      { status: 503 },
    );
  }

  const claims = await verifySessionToken(token, secret);
  if (!claims) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sesión inválida" } },
      { status: 401 },
    );
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

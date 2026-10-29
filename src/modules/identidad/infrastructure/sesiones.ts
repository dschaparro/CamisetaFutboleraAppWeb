import { NextResponse } from "next/server";
import { verifyClienteToken, verifySessionToken, type ClienteClaims, type SessionClaims } from "@/modules/identidad/domain/token";
import { DEV_BYPASS_USER, isDevAuthBypass } from "@/modules/identidad/infrastructure/dev-bypass";
import { getJwtSecret } from "@/modules/identidad/infrastructure/jwt-secret";
import { SESSION_COOKIE, sessionCookieOptions } from "@/modules/identidad/infrastructure/session-cookie";

export const CLIENTE_COOKIE = "cf_cliente";
const CLIENTE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function leerCookie(request: Request, nombre: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const parte of header.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Sesión del personal en una ruta API (con DEV_BYPASS_AUTH devuelve el admin simulado). */
export async function sesionPersonal(request: Request): Promise<SessionClaims | null> {
  if (isDevAuthBypass()) {
    return { sub: DEV_BYPASS_USER.id, email: DEV_BYPASS_USER.email, nombre: DEV_BYPASS_USER.nombre, rol: DEV_BYPASS_USER.rol };
  }
  const token = leerCookie(request, SESSION_COOKIE);
  if (!token) return null;
  try {
    return await verifySessionToken(token, getJwtSecret());
  } catch {
    return null;
  }
}

export async function sesionCliente(request: Request): Promise<ClienteClaims | null> {
  const token = leerCookie(request, CLIENTE_COOKIE);
  if (!token) return null;
  try {
    return await verifyClienteToken(token, getJwtSecret());
  } catch {
    return null;
  }
}

export function clienteCookieOptions(maxAge = CLIENTE_MAX_AGE_SECONDS) {
  return { ...sessionCookieOptions(), maxAge };
}

/** Al entrar con un tipo de cuenta se cierra la sesión del otro tipo, para no mezclar. */
export function ponerSesion(response: NextResponse, tipo: "personal" | "cliente", token: string) {
  if (tipo === "personal") {
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    response.cookies.set(CLIENTE_COOKIE, "", clienteCookieOptions(0));
  } else {
    response.cookies.set(CLIENTE_COOKIE, token, clienteCookieOptions());
    response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  }
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export { errorJson } from "@/lib/http";

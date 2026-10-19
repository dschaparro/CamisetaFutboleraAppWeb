import { createHmac, timingSafeEqual } from "node:crypto";
import { esRol, type Rol } from "@/modules/identidad/domain/types";

export const JWT_ISSUER = "camisetafutbolera";
/** Personal (panel). */
export const JWT_AUDIENCE = "panel";
/** Clientes de la tienda. Otro aud: un token de cliente nunca sirve en el panel, ni al revés. */
export const JWT_AUDIENCE_CLIENTE = "tienda";
export const JWT_ALG = "HS256";

export type SessionClaims = {
  sub: string;
  email: string;
  nombre: string;
  rol: Rol;
};

export type ClienteClaims = {
  sub: string;
  email: string;
  nombre: string;
};

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function hmac(secret: string, data: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

function equalSig(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parseExpiresIn(expiresIn: string): number {
  const match = /^(\d+)h$/.exec(expiresIn);
  if (!match) throw new Error('expiresIn debe tener forma "8h"');
  return Number(match[1]) * 3600;
}

function firmar(datos: Record<string, unknown>, audience: string, secret: string, expiresIn: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: JWT_ALG, typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      ...datos,
      iat: now,
      exp: now + parseExpiresIn(expiresIn),
      iss: JWT_ISSUER,
      aud: audience,
    }),
  );
  const body = `${header}.${payload}`;
  return `${body}.${toBase64Url(hmac(secret, body))}`;
}

/** Verifica firma, algoritmo, vencimiento, emisor y audiencia. Devuelve el payload o null. */
function verificar(token: string, audience: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = hmac(secret, `${headerB64}.${payloadB64}`);
    actual = Buffer.from(sigB64, "base64url");
  } catch {
    return null;
  }
  if (!equalSig(expected, actual)) return null;

  try {
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8")) as { alg?: string };
    if (header.alg !== JWT_ALG) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (payload.iss !== JWT_ISSUER || payload.aud !== audience) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signSessionToken(claims: SessionClaims, secret: string, expiresIn = "8h"): Promise<string> {
  return firmar(
    { sub: claims.sub, email: claims.email, nombre: claims.nombre, rol: claims.rol },
    JWT_AUDIENCE,
    secret,
    expiresIn,
  );
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionClaims | null> {
  const payload = verificar(token, JWT_AUDIENCE, secret);
  if (!payload) return null;
  const { sub, email, nombre, rol } = payload;
  if (typeof sub !== "string" || typeof email !== "string" || typeof nombre !== "string" || !esRol(rol)) {
    return null;
  }
  return { sub, email, nombre, rol };
}

/** Sesión de cliente: más larga que la del personal (30 días). */
export async function signClienteToken(claims: ClienteClaims, secret: string, expiresIn = "720h"): Promise<string> {
  return firmar({ sub: claims.sub, email: claims.email, nombre: claims.nombre }, JWT_AUDIENCE_CLIENTE, secret, expiresIn);
}

export async function verifyClienteToken(token: string, secret: string): Promise<ClienteClaims | null> {
  const payload = verificar(token, JWT_AUDIENCE_CLIENTE, secret);
  if (!payload) return null;
  const { sub, email, nombre } = payload;
  if (typeof sub !== "string" || typeof email !== "string" || typeof nombre !== "string") return null;
  return { sub, email, nombre };
}

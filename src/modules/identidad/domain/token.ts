import { createHmac, timingSafeEqual } from "node:crypto";
import type { Rol } from "@/modules/identidad/domain/types";

export const JWT_ISSUER = "camisetafutbolera";
export const JWT_AUDIENCE = "panel";
export const JWT_ALG = "HS256";

export type SessionClaims = {
  sub: string;
  email: string;
  nombre: string;
  rol: Rol;
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

export async function signSessionToken(
  claims: SessionClaims,
  secret: string,
  expiresIn = "8h",
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: JWT_ALG, typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: claims.sub,
      email: claims.email,
      nombre: claims.nombre,
      rol: claims.rol,
      iat: now,
      exp: now + parseExpiresIn(expiresIn),
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
    }),
  );
  const body = `${header}.${payload}`;
  const signature = toBase64Url(hmac(secret, body));
  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionClaims | null> {
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
    if (payload.iss !== JWT_ISSUER || payload.aud !== JWT_AUDIENCE) return null;

    const { sub, email, nombre, rol } = payload;
    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof nombre !== "string" ||
      (rol !== "Administrador" && rol !== "Vendedor")
    ) {
      return null;
    }
    return { sub, email, nombre, rol };
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { CLIENTE_COOKIE, clienteCookieOptions } from "@/modules/identidad/infrastructure/sesiones";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLIENTE_COOKIE, "", clienteCookieOptions(0));
  return response;
}

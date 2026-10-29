import { NextResponse } from "next/server";

/** Forma canónica de error de API: `{ error: { code, message, campos? } }`. */
export function errorJson(status: number, code: string, message: string, campos?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, ...(campos ? { campos } : {}) } }, { status });
}

export async function leerCuerpoJson(request: Request): Promise<unknown> {
  return request.json();
}

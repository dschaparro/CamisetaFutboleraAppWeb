"use client";

import type { InputHTMLAttributes } from "react";
import s from "@/components/store/cuenta.module.css";

export type Campos = Record<string, string | undefined>;

/** Llama a una API de «Mi cuenta» y devuelve datos o errores (generales y por campo). */
export async function llamar<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<{ ok: true; datos: T } | { ok: false; mensaje: string; campos: Campos }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const d = (await res.json()) as T & { error?: { message?: string; campos?: Campos } };
    if (!res.ok) return { ok: false, mensaje: d.error?.message ?? "No se pudo guardar", campos: d.error?.campos ?? {} };
    return { ok: true, datos: d };
  } catch {
    return { ok: false, mensaje: "No hay conexión con el servidor. Intenta de nuevo.", campos: {} };
  }
}

export function Campo({
  id,
  label,
  error,
  hint,
  ancho,
  ...input
}: { id: string; label: string; error?: string; hint?: string; ancho?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`field ${error ? s.campoError : ""}`} style={ancho ? { gridColumn: "1/-1" } : undefined}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={!!error} {...input} />
      {error ? <small>{error}</small> : hint ? <small className={s.hint}>{hint}</small> : null}
    </div>
  );
}

export function Aviso({ aviso }: { aviso: { ok: boolean; texto: string } | null }) {
  if (!aviso) return null;
  return (
    <div className={`${s.aviso} ${aviso.ok ? s.avisoOk : s.avisoMal}`} role={aviso.ok ? "status" : "alert"}>
      {aviso.texto}
    </div>
  );
}

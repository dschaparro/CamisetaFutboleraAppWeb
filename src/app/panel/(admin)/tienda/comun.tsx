"use client";

import { useState, type ReactNode } from "react";
import s from "./tienda.module.css";

export type Campos = Record<string, string | undefined>;
export type Resultado<T> = { ok: true; datos: T } | { ok: false; mensaje: string; campos: Campos };

/** Llama a las APIs del panel de la tienda y normaliza errores. */
export async function api<T>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<Resultado<T>> {
  try {
    const esForm = body instanceof FormData;
    const res = await fetch(url, {
      method,
      headers: body === undefined || esForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : esForm ? body : JSON.stringify(body),
    });
    const d = (await res.json()) as T & { error?: { message?: string; campos?: Campos } };
    if (!res.ok) return { ok: false, mensaje: d.error?.message ?? "No se pudo guardar", campos: d.error?.campos ?? {} };
    return { ok: true, datos: d };
  } catch {
    return { ok: false, mensaje: "No hay conexión con el servidor", campos: {} };
  }
}

/** Fecha ISO ↔ valor de <input type="datetime-local"> (hora local). */
export function aLocal(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function deLocal(v: string): string {
  return v ? new Date(v).toISOString() : "";
}
export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

export function estadoVigencia(desde: string, hasta: string, activo: boolean): { texto: string; clase: string } {
  const t = Date.now();
  if (!activo) return { texto: "Pausada", clase: "pill-mute" };
  if (t < Date.parse(desde)) return { texto: "Programada", clase: "pill-blue" };
  if (t > Date.parse(hasta)) return { texto: "Vencida", clase: "pill-mute" };
  return { texto: "Activa", clase: "pill-ok" };
}

type CampoProps = {
  label: string;
  error?: string;
  hint?: string;
  ancho?: boolean;
  children: ReactNode;
};

export function Campo({ label, error, hint, ancho, children }: CampoProps) {
  return (
    <label className={`field ${s.campo} ${ancho ? s.ancho : ""} ${error ? s.campoError : ""}`}>
      <span className={s.etiqueta}>{label}</span>
      {children}
      {error ? <small className={s.error}>{error}</small> : hint ? <small className={s.hint}>{hint}</small> : null}
    </label>
  );
}

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={s.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> {label}
    </label>
  );
}

/** Panel lateral con el formulario de crear/editar. */
export function Cajon({
  titulo,
  onCerrar,
  onGuardar,
  guardando,
  error,
  children,
  extra,
}: {
  titulo: string;
  onCerrar: () => void;
  onGuardar: () => void;
  guardando: boolean;
  error: string | null;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <>
      <div className={s.fondo} onClick={onCerrar} />
      <aside className={s.cajon} role="dialog" aria-label={titulo} onKeyDown={(e) => e.key === "Escape" && onCerrar()}>
        <div className={s.cajonHead}>
          <h2>{titulo}</h2>
          <button className={s.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <form
          className={s.cajonBody}
          onSubmit={(e) => {
            e.preventDefault();
            onGuardar();
          }}
          noValidate
        >
          {error && <div className={s.avisoMal}>{error}</div>}
          <div className={s.formGrid}>{children}</div>
          {extra}
          <div className={s.cajonPie}>
            <button className="btn btn-gold" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onCerrar}>
              Cancelar
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

type Valores = Record<string, unknown>;

/**
 * Estado común de crear/editar en el cajón: qué se edita, valores, errores y
 * guardado contra /api/admin/tienda/<coleccion>.
 */
export function useEdicion(coleccion: string, alGuardar: (mensaje: string) => void) {
  const [editando, setEditando] = useState<{ id: string | null } | null>(null);
  const [form, setForm] = useState<Valores>({});
  const [campos, setCampos] = useState<Campos>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function abrir(id: string | null, valores: Valores) {
    setEditando({ id });
    setForm(valores);
    setCampos({});
    setError(null);
  }

  const set = (k: string) => (v: unknown) => {
    setForm((f) => ({ ...f, [k]: v }));
    setCampos((c) => ({ ...c, [k]: undefined }));
  };

  async function guardar(transformar: (v: Valores) => Valores = (v) => v) {
    if (!editando) return;
    setGuardando(true);
    const url = editando.id ? `/api/admin/tienda/${coleccion}/${encodeURIComponent(editando.id)}` : `/api/admin/tienda/${coleccion}`;
    const r = await api<{ item: unknown }>(url, editando.id ? "PATCH" : "POST", transformar(form));
    setGuardando(false);
    if (!r.ok) {
      setCampos(r.campos);
      setError(Object.keys(r.campos).length ? "Revisa los campos marcados" : r.mensaje);
      return;
    }
    setEditando(null);
    alGuardar(editando.id ? "Cambios guardados." : "Creado correctamente.");
  }

  return { editando, form, campos, error, guardando, abrir, set, guardar, cerrar: () => setEditando(null) };
}

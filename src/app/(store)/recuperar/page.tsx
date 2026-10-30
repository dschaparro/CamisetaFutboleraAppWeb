"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import s from "@/components/store/auth.module.css";

type Campos = Partial<Record<"email", string>>;

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [campos, setCampos] = useState<Campos>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<{ email: string; mensaje: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCampos({});
    setEnviando(true);
    try {
      const res = await fetch("/api/cuenta/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mensaje?: string;
        email?: string;
        error?: { message?: string; campos?: Campos; code?: string };
      };
      if (!res.ok) {
        setCampos(data.error?.campos ?? {});
        if (!data.error?.campos) setError(data.error?.message ?? "No se pudo enviar el enlace");
        return;
      }
      setListo({ email: data.email ?? email, mensaje: data.mensaje ?? "Revisa tu correo." });
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`wrap ${s.page}`}>
      <div className={s.card}>
        <p className={s.eyebrow}>Seguridad</p>
        <h1 className={s.titulo}>Restablecer contraseña</h1>

        <ol className={s.pasos} aria-hidden>
          <li className={`${s.paso} ${s.pasoActivo}`} />
          <li className={s.paso} />
          <li className={s.paso} />
        </ol>

        {listo ? (
          <>
            <div className={s.exito} role="status">
              <b>Revisa tu correo</b>
              <span>{listo.mensaje}</span>
            </div>
            <p className={s.sub}>
              En desarrollo el enlace también aparece en la consola del servidor. Si no llega nada en unos minutos,
              solicita de nuevo o verifica que el correo esté bien escrito.
            </p>
            <div className={s.acciones}>
              <Link className="btn btn-gold btn-block" href="/ingresar">
                Volver a ingresar
              </Link>
              <button type="button" className="btn btn-outline btn-block" onClick={() => setListo(null)}>
                Usar otro correo
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={s.sub}>
              Escribe el correo de tu cuenta de cliente. Te enviaremos un enlace seguro (válido 1 hora) para elegir una
              nueva contraseña.
            </p>
            <form className={s.form} onSubmit={onSubmit}>
              <div className={`field${campos.email ? ` ${s.campoError}` : ""}`}>
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setCampos({});
                    setError(null);
                  }}
                  required
                  aria-invalid={campos.email ? true : undefined}
                />
                {campos.email ? <small className="field-error">{campos.email}</small> : null}
              </div>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className={s.acciones}>
                <button className="btn btn-gold btn-block" disabled={enviando}>
                  {enviando ? "Enviando…" : "Enviar enlace"}
                </button>
              </div>
            </form>
            <p className={s.alterno}>
              ¿Recordaste la clave? <Link href="/ingresar">Ingresar</Link>
              <br />
              ¿No tienes cuenta? <Link href="/registro">Crear una gratis</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

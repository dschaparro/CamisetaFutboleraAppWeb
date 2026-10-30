"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import s from "@/components/store/auth.module.css";

type Campos = Partial<Record<"password" | "confirmar" | "token", string>>;

/** Espejo de PASSWORD_MIN del dominio; no importar domain en cliente (arrastra node:crypto). */
const PASSWORD_MIN = 8;

const MSG_SIN_TOKEN = "Falta el enlace de restablecimiento. Solicita uno nuevo.";

function NuevaPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [ver, setVer] = useState(false);
  const [campos, setCampos] = useState<Campos>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tokenOk, setTokenOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    fetch(`/api/cuenta/recuperar/confirmar?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = (await r.json()) as { error?: { message?: string } };
        if (cancelado) return;
        if (!r.ok) {
          setTokenOk(false);
          setError(d.error?.message ?? "El enlace no es válido o ya expiró.");
          return;
        }
        setTokenOk(true);
      })
      .catch(() => {
        if (!cancelado) {
          setTokenOk(false);
          setError("No pudimos validar el enlace. Intenta de nuevo.");
        }
      });
    return () => {
      cancelado = true;
    };
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCampos({});
    setEnviando(true);
    try {
      const res = await fetch("/api/cuenta/recuperar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmar }),
      });
      const data = (await res.json()) as { error?: { message?: string; campos?: Campos } };
      if (!res.ok) {
        setCampos(data.error?.campos ?? {});
        if (!data.error?.campos) setError(data.error?.message ?? "No se pudo guardar la contraseña");
        return;
      }
      router.push("/ingresar?reset=1");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const vigente = token ? tokenOk : false;
  const mensajeError = token ? error : MSG_SIN_TOKEN;

  return (
    <div className={`wrap ${s.page}`}>
      <div className={s.card}>
        <p className={s.eyebrow}>Seguridad</p>
        <h1 className={s.titulo}>Nueva contraseña</h1>
        <ol className={s.pasos} aria-hidden>
          <li className={`${s.paso} ${s.pasoActivo}`} />
          <li className={`${s.paso} ${s.pasoActivo}`} />
          <li className={`${s.paso} ${vigente ? s.pasoActivo : ""}`} />
        </ol>

        {vigente === false ? (
          <>
            <p className="form-error" role="alert">
              {mensajeError}
            </p>
            <div className={s.acciones}>
              <Link className="btn btn-gold btn-block" href="/recuperar">
                Solicitar un enlace nuevo
              </Link>
              <Link className="btn btn-outline btn-block" href="/ingresar">
                Volver a ingresar
              </Link>
            </div>
          </>
        ) : vigente === null ? (
          <p className={s.sub}>Validando el enlace…</p>
        ) : (
          <>
            <p className={s.sub}>
              Elige una contraseña de al menos {PASSWORD_MIN} caracteres. No la compartas con nadie.
            </p>
            <form className={s.form} onSubmit={onSubmit}>
              <div className={`field${campos.password ? ` ${s.campoError}` : ""}`}>
                <label htmlFor="password">Nueva contraseña</label>
                <div className={s.verPass}>
                  <input
                    id="password"
                    type={ver ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCampos((c) => ({ ...c, password: undefined }));
                    }}
                    required
                    minLength={PASSWORD_MIN}
                    aria-invalid={campos.password ? true : undefined}
                  />
                  <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Ver contraseña"}>
                    {ver ? "Ocultar" : "Ver"}
                  </button>
                </div>
                {campos.password ? <small className="field-error">{campos.password}</small> : null}
              </div>
              <div className={`field${campos.confirmar ? ` ${s.campoError}` : ""}`}>
                <label htmlFor="confirmar">Confirmar contraseña</label>
                <input
                  id="confirmar"
                  type={ver ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmar}
                  onChange={(e) => {
                    setConfirmar(e.target.value);
                    setCampos((c) => ({ ...c, confirmar: undefined }));
                  }}
                  required
                  minLength={PASSWORD_MIN}
                  aria-invalid={campos.confirmar ? true : undefined}
                />
                {campos.confirmar ? <small className="field-error">{campos.confirmar}</small> : null}
              </div>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className={s.acciones}>
                <button className="btn btn-gold btn-block" disabled={enviando}>
                  {enviando ? "Guardando…" : "Guardar contraseña"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function NuevaPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={`wrap ${s.page}`}>
          <div className={s.card}>
            <p className={s.sub}>Cargando…</p>
          </div>
        </div>
      }
    >
      <NuevaPasswordForm />
    </Suspense>
  );
}

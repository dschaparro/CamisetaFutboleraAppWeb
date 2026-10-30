"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import s from "@/components/store/auth.module.css";
import { useCart } from "@/context/CartContext";

type Demo = { password: string; cuentas: readonly { email: string; rol: string; descripcion: string }[] };

/** Solo rutas internas de la tienda (nunca otro sitio ni el panel) como destino de «volver». */
function volverSeguro(): string | null {
  const v = new URLSearchParams(window.location.search).get("volver");
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/panel")) return null;
  return v;
}

export default function IngresarPage() {
  const router = useRouter();
  const { enlazarTrasAuth } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [demo, setDemo] = useState<Demo | null>(null);
  const [volver, setVolver] = useState<string | null>(null);
  const [avisoReset, setAvisoReset] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setVolver(volverSeguro());
      setAvisoReset(new URLSearchParams(window.location.search).get("reset") === "1");
    });
  }, []);

  useEffect(() => {
    fetch("/api/cuenta/sesion")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { demo?: Demo | null } | null) => setDemo(d?.demo ?? null))
      .catch(() => setDemo(null));
  }, []);

  async function entrar(correo: string, clave: string) {
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/ingresar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo, password: clave }),
      });
      const data = (await res.json()) as { tipo?: string; destino?: string; error?: { message?: string } };
      if (!res.ok || !data.destino) {
        setError(data.error?.message ?? "No se pudo iniciar sesión");
        return;
      }
      if (data.tipo === "cliente") {
        await enlazarTrasAuth();
        router.push(volverSeguro() ?? data.destino);
      } else {
        router.push(data.destino);
      }
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    entrar(email, password);
  }

  return (
    <div className={`wrap ${s.page}`}>
      <div className={s.card}>
        <p className={s.eyebrow}>Mi cuenta</p>
        <h1 className={s.titulo}>Ingresa a tu cuenta</h1>

        {avisoReset ? (
          <div className={s.exito} role="status">
            <b>Contraseña actualizada</b>
            <span>Ya puedes ingresar con tu nueva clave.</span>
          </div>
        ) : null}

        {volver === "/checkout" ? (
          <p className={s.avisoCompra}>
            Para finalizar tu compra, ingresa o{" "}
            <Link href="/registro?volver=/checkout">crea tu cuenta gratis</Link>. Tu carrito te espera.
          </p>
        ) : (
          <p className={s.sub}>Revisa tus pedidos y compra más rápido. Si eres parte del equipo, entrarás al panel.</p>
        )}

        <form className={s.form} onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <div className={s.verPass}>
              <input
                id="password"
                type={verPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setVerPass((v) => !v)} aria-label={verPass ? "Ocultar contraseña" : "Ver contraseña"}>
                {verPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>
          <Link className={s.olvidaste} href="/recuperar">
            ¿Olvidaste tu contraseña?
          </Link>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className={s.acciones}>
            <button className="btn btn-gold btn-block" disabled={enviando}>
              {enviando ? "Verificando…" : "Ingresar"}
            </button>
          </div>
        </form>

        <p className={s.alterno}>
          ¿No tienes cuenta?{" "}
          <Link href={volver ? `/registro?volver=${encodeURIComponent(volver)}` : "/registro"}>Crea una gratis</Link>
        </p>

        {demo ? (
          <div className={s.demo}>
            <b>Modo demostración</b>
            <p>
              Cuentas de prueba (contraseña <code>{demo.password}</code>). Pulsa una para entrar con ese rol.
            </p>
            <ul>
              {demo.cuentas.map((c) => (
                <li key={c.email}>
                  <button type="button" disabled={enviando} onClick={() => entrar(c.email, demo.password)}>
                    <b>
                      {c.rol} · {c.email}
                    </b>
                    <span>{c.descripcion}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

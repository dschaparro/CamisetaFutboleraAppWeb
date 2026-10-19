"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import s from "@/components/store/cuenta.module.css";

type Campos = Partial<Record<"nombre" | "email" | "telefono" | "password" | "confirmar", string>>;

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "", confirmar: "" });
  const [campos, setCampos] = useState<Campos>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setCampos((c) => ({ ...c, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmar) {
      setCampos({ confirmar: "Las contraseñas no coinciden" });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/cuenta/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, telefono: form.telefono, password: form.password }),
      });
      const data = (await res.json()) as { error?: { message?: string; campos?: Campos } };
      if (!res.ok) {
        setCampos(data.error?.campos ?? {});
        if (!data.error?.campos) setError(data.error?.message ?? "No se pudo crear la cuenta");
        return;
      }
      // Si venía del pago, vuelve al pago; si no, a su cuenta.
      const v = new URLSearchParams(window.location.search).get("volver");
      router.push(v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/panel") ? v : "/cuenta");
      router.refresh();
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = (k: keyof Campos, label: string, input: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
    <div className={`field ${campos[k] ? s.campoError : ""}`}>
      <label htmlFor={k}>{label}</label>
      <input id={k} value={form[k]} onChange={set(k)} aria-invalid={!!campos[k]} {...input} />
      {campos[k] ? <small>{campos[k]}</small> : hint ? <small className={s.hint}>{hint}</small> : null}
    </div>
  );

  return (
    <div className="wrap">
      <div className={s.auth}>
        <div className="eyebrow">Mi cuenta</div>
        <h1>Crea tu cuenta</h1>
        <p className={s.sub}>Sigue tus pedidos y guarda tus datos para la próxima compra.</p>

        <form className={s.form} onSubmit={onSubmit} noValidate>
          {campo("nombre", "Nombre completo", { autoComplete: "name", required: true })}
          {campo("email", "Correo electrónico", { type: "email", autoComplete: "email", required: true })}
          {campo("telefono", "Celular (opcional)", { type: "tel", autoComplete: "tel", inputMode: "tel" }, "Para avisarte del envío")}
          {campo("password", "Contraseña", { type: "password", autoComplete: "new-password", required: true }, "Mínimo 8 caracteres")}
          {campo("confirmar", "Confirma la contraseña", { type: "password", autoComplete: "new-password", required: true })}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-gold btn-block" disabled={enviando}>
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className={s.alterno}>
          ¿Ya tienes cuenta? <Link href="/ingresar">Ingresa</Link>
        </p>
      </div>
    </div>
  );
}

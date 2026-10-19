"use client";

import { useState, type FormEvent } from "react";
import s from "@/components/store/cuenta.module.css";
import { Aviso, Campo, llamar, type Campos } from "@/components/store/cuenta/comun";

const VACIO = { actual: "", nueva: "", confirmar: "" };

export default function SeccionSeguridad() {
  const [form, setForm] = useState(VACIO);
  const [ver, setVer] = useState(false);
  const [campos, setCampos] = useState<Campos>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(e: FormEvent) {
    e.preventDefault();
    setAviso(null);
    if (form.nueva !== form.confirmar) {
      setCampos({ confirmar: "Las contraseñas no coinciden" });
      return;
    }
    setGuardando(true);
    const r = await llamar("/api/cuenta/password", "POST", { actual: form.actual, nueva: form.nueva });
    setGuardando(false);
    if (!r.ok) {
      setCampos(r.campos);
      if (Object.keys(r.campos).length === 0) setAviso({ ok: false, texto: r.mensaje });
      return;
    }
    setCampos({});
    setForm(VACIO);
    setAviso({ ok: true, texto: "Listo: tu contraseña se cambió. Úsala la próxima vez que ingreses." });
  }

  const tipo = ver ? "text" : "password";
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [k]: e.target.value });
    setCampos({ ...campos, [k]: undefined });
  };

  return (
    <form className={`card ${s.panelForm}`} onSubmit={cambiar} noValidate>
      <h2 className={s.seccionTitulo}>Cambiar contraseña</h2>
      <p className={s.meta}>Por seguridad te pedimos la contraseña actual. La nueva debe tener al menos 8 caracteres.</p>
      <Aviso aviso={aviso} />
      <div className={s.formGrid}>
        <Campo id="p-actual" label="Contraseña actual" type={tipo} value={form.actual} error={campos.actual} autoComplete="current-password" onChange={set("actual")} ancho />
        <Campo id="p-nueva" label="Nueva contraseña" type={tipo} value={form.nueva} error={campos.nueva} autoComplete="new-password" onChange={set("nueva")} />
        <Campo id="p-conf" label="Confirma la nueva" type={tipo} value={form.confirmar} error={campos.confirmar} autoComplete="new-password" onChange={set("confirmar")} />
      </div>
      <label className={s.check}>
        <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar contraseñas
      </label>
      <div>
        <button className="btn btn-gold" disabled={guardando || !form.actual || !form.nueva}>
          {guardando ? "Cambiando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

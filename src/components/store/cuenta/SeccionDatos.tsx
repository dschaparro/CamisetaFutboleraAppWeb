"use client";

import { useState, type FormEvent } from "react";
import s from "@/components/store/cuenta.module.css";
import { Aviso, Campo, llamar, type Campos } from "@/components/store/cuenta/comun";

type Cliente = { nombre: string; email: string; telefono: string | null };

export default function SeccionDatos({ cliente, onCambio }: { cliente: Cliente; onCambio: (c: Cliente) => void }) {
  const [form, setForm] = useState({ nombre: cliente.nombre, telefono: cliente.telefono ?? "" });
  const [campos, setCampos] = useState<Campos>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setAviso(null);
    const r = await llamar<{ cliente: Cliente }>("/api/cuenta/datos", "PATCH", form);
    setGuardando(false);
    if (!r.ok) {
      setCampos(r.campos);
      if (Object.keys(r.campos).length === 0) setAviso({ ok: false, texto: r.mensaje });
      return;
    }
    setCampos({});
    onCambio(r.datos.cliente);
    setAviso({ ok: true, texto: "Tus datos quedaron guardados." });
  }

  const cambiado = form.nombre !== cliente.nombre || form.telefono !== (cliente.telefono ?? "");

  return (
    <form className={`card ${s.panelForm}`} onSubmit={guardar} noValidate>
      <h2 className={s.seccionTitulo}>Mis datos</h2>
      <Aviso aviso={aviso} />
      <div className={s.formGrid}>
        <Campo id="d-nombre" label="Nombre completo" value={form.nombre} error={campos.nombre} autoComplete="name" onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Campo id="d-tel" label="Celular" value={form.telefono} error={campos.telefono} autoComplete="tel" inputMode="tel" hint="Para avisarte del envío" onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        <Campo id="d-email" label="Correo (usuario de ingreso)" value={cliente.email} readOnly disabled hint="Para cambiarlo, escríbenos por WhatsApp" ancho />
      </div>
      <div>
        <button className="btn btn-gold" disabled={guardando || !cambiado}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

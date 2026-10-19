"use client";

import { useState, type FormEvent } from "react";
import s from "@/components/store/cuenta.module.css";
import { Aviso, Campo, llamar, type Campos } from "@/components/store/cuenta/comun";
import { MAX_DIRECCIONES, type Direccion, type PerfilCliente } from "@/modules/identidad/domain/perfil-tipos";

type Form = Omit<Direccion, "id" | "predeterminada">;

export default function SeccionDirecciones({
  direcciones,
  nombreCliente,
  telefonoCliente,
  onPerfil,
}: {
  direcciones: Direccion[];
  nombreCliente: string;
  telefonoCliente: string | null;
  onPerfil: (p: PerfilCliente) => void;
}) {
  const vacio: Form = { alias: "", destinatario: nombreCliente, telefono: telefonoCliente ?? "", direccion: "", ciudad: "Bogotá", indicaciones: "" };
  const [editando, setEditando] = useState<string | "nueva" | null>(null);
  const [form, setForm] = useState<Form>(vacio);
  const [campos, setCampos] = useState<Campos>({});
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [borrar, setBorrar] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  function abrir(d?: Direccion) {
    setCampos({});
    setAviso(null);
    setEditando(d ? d.id : "nueva");
    setForm(d ? { alias: d.alias, destinatario: d.destinatario, telefono: d.telefono, direccion: d.direccion, ciudad: d.ciudad, indicaciones: d.indicaciones } : vacio);
  }

  async function ejecutar(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown, exito: string) {
    setOcupado(true);
    const r = await llamar<{ perfil: PerfilCliente }>(url, method, body);
    setOcupado(false);
    if (!r.ok) {
      setCampos(r.campos);
      setAviso(Object.keys(r.campos).length === 0 || r.campos.direccion ? { ok: false, texto: r.mensaje } : null);
      return false;
    }
    onPerfil(r.datos.perfil);
    setAviso({ ok: true, texto: exito });
    return true;
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const ok =
      editando === "nueva"
        ? await ejecutar("/api/cuenta/direcciones", "POST", form, "Dirección guardada.")
        : await ejecutar(`/api/cuenta/direcciones/${encodeURIComponent(editando!)}`, "PATCH", form, "Dirección actualizada.");
    if (ok) setEditando(null);
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className={s.seccion}>
      <div className={s.seccionCabecera}>
        <h2 className={s.seccionTitulo}>Mis direcciones</h2>
        {editando === null && direcciones.length < MAX_DIRECCIONES && (
          <button className="btn btn-gold btn-sm" onClick={() => abrir()}>
            + Agregar dirección
          </button>
        )}
      </div>
      <Aviso aviso={aviso} />

      {editando !== null && (
        <form className={`card ${s.panelForm}`} onSubmit={guardar} noValidate>
          <h3 className={s.subtitulo}>{editando === "nueva" ? "Nueva dirección" : "Editar dirección"}</h3>
          <div className={s.formGrid}>
            <Campo id="dir-alias" label="Nombre (ej. Casa, Oficina)" value={form.alias} error={campos.alias} onChange={set("alias")} />
            <Campo id="dir-dest" label="Quién recibe" value={form.destinatario} error={campos.destinatario} onChange={set("destinatario")} />
            <Campo id="dir-dir" label="Dirección" value={form.direccion} error={campos.direccion} autoComplete="street-address" onChange={set("direccion")} ancho />
            <Campo id="dir-ciudad" label="Ciudad" value={form.ciudad} error={campos.ciudad} autoComplete="address-level2" onChange={set("ciudad")} />
            <Campo id="dir-tel" label="Teléfono de contacto" value={form.telefono} error={campos.telefono} inputMode="tel" onChange={set("telefono")} />
            <Campo id="dir-ind" label="Indicaciones (opcional)" value={form.indicaciones} placeholder="Ej. portería, torre, apto" onChange={set("indicaciones")} ancho />
          </div>
          <div className={s.botones}>
            <button className="btn btn-gold" disabled={ocupado}>
              {ocupado ? "Guardando…" : "Guardar dirección"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditando(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {direcciones.length === 0 && editando === null ? (
        <div className={`card ${s.vacio}`}>
          <b>No tienes direcciones guardadas</b>
          Guárdalas para llenar el pago más rápido.
        </div>
      ) : (
        <div className={s.tarjetasGrid}>
          {direcciones.map((d) => (
            <div key={d.id} className={`card ${s.item} ${d.predeterminada ? s.itemPrincipal : ""}`}>
              <div className={s.itemCabecera}>
                <b>{d.alias}</b>
                {d.predeterminada && <span className="pill pill-ok">Principal</span>}
              </div>
              <p>
                {d.destinatario} · {d.telefono}
                <br />
                {d.direccion}, {d.ciudad}
                {d.indicaciones && (
                  <>
                    <br />
                    <span className={s.meta}>{d.indicaciones}</span>
                  </>
                )}
              </p>
              {borrar === d.id ? (
                <div className={s.botones}>
                  <span className={s.meta}>¿Eliminar esta dirección?</span>
                  <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} disabled={ocupado} onClick={async () => { await ejecutar(`/api/cuenta/direcciones/${encodeURIComponent(d.id)}`, "DELETE", undefined, "Dirección eliminada."); setBorrar(null); }}>
                    Sí, eliminar
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setBorrar(null)}>
                    No
                  </button>
                </div>
              ) : (
                <div className={s.botones}>
                  <button className="btn btn-outline btn-sm" onClick={() => abrir(d)}>
                    Editar
                  </button>
                  {!d.predeterminada && (
                    <button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => ejecutar(`/api/cuenta/direcciones/${encodeURIComponent(d.id)}`, "PATCH", { predeterminada: true }, `«${d.alias}» es ahora tu dirección principal.`)}>
                      Usar como principal
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setBorrar(d.id)}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

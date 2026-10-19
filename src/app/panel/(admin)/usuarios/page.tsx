"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MODULOS } from "@/modules/identidad/domain/permisos";
import { ROLES, type Rol, type Usuario } from "@/modules/identidad/domain/types";
import s from "./usuarios.module.css";

type Campos = Partial<Record<"nombre" | "email" | "rol" | "password", string>>;
type Aviso = { tipo: "ok" | "mal"; texto: string } | null;

const VACIO = { nombre: "", email: "", rol: "Vendedor" as Rol, password: "" };

async function leerError(res: Response): Promise<{ message: string; campos?: Campos }> {
  try {
    const d = (await res.json()) as { error?: { message?: string; campos?: Campos } };
    return { message: d.error?.message ?? "No se pudo guardar", campos: d.error?.campos };
  } catch {
    return { message: "No se pudo guardar" };
  }
}

async function obtenerUsuarios(): Promise<Usuario[]> {
  const res = await fetch("/api/usuarios");
  if (!res.ok) throw new Error((await leerError(res)).message);
  return ((await res.json()) as { usuarios: Usuario[] }).usuarios;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [form, setForm] = useState(VACIO);
  const [campos, setCampos] = useState<Campos>({});
  const [guardando, setGuardando] = useState(false);
  const [claveDe, setClaveDe] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState("");

  const cargar = useCallback(() => {
    obtenerUsuarios().then(setUsuarios, (e: Error) => {
      setAviso({ tipo: "mal", texto: e.message });
      setUsuarios([]);
    });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setCampos({});
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setGuardando(false);
    if (!res.ok) {
      const err = await leerError(res);
      setCampos(err.campos ?? {});
      if (!err.campos) setAviso({ tipo: "mal", texto: err.message });
      return;
    }
    setAviso({ tipo: "ok", texto: `Cuenta creada para ${form.nombre}. Compártele su correo y contraseña temporal.` });
    setForm(VACIO);
    cargar();
  }

  async function actualizar(u: Usuario, cambios: Record<string, unknown>, exito: string) {
    const res = await fetch(`/api/usuarios/${encodeURIComponent(u.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    if (!res.ok) {
      setAviso({ tipo: "mal", texto: (await leerError(res)).message });
      return false;
    }
    setAviso({ tipo: "ok", texto: exito });
    cargar();
    return true;
  }

  const modulosDeRol = (rol: Rol) =>
    MODULOS.filter((m) => m.roles.includes(rol))
      .map((m) => m.label)
      .join(", ");

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Usuarios y roles</h1>
          <p>Crea cuentas para tu equipo y define qué puede ver cada persona en el panel</p>
        </div>
      </div>

      {aviso && (
        <div className={`${s.aviso} ${aviso.tipo === "ok" ? s.ok : s.mal}`} role={aviso.tipo === "mal" ? "alert" : "status"}>
          {aviso.texto}
        </div>
      )}

      <div className={s.layout}>
        <section className="card">
          <div className={s.tablaWrap}>
            <table className={s.tabla}>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios === null && (
                  <tr>
                    <td colSpan={4}>Cargando…</td>
                  </tr>
                )}
                {usuarios?.map((u) => (
                  <tr key={u.id} className={u.activo ? "" : s.inactivo}>
                    <td>
                      <b>{u.nombre}</b>
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <select
                        className={s.select}
                        value={u.rol}
                        aria-label={`Rol de ${u.nombre}`}
                        onChange={(e) => actualizar(u, { rol: e.target.value }, `${u.nombre} ahora es ${e.target.value}.`)}
                      >
                        {ROLES.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`pill ${u.activo ? "pill-ok" : "pill-mute"}`}>{u.activo ? "Activo" : "Inactivo"}</span>
                    </td>
                    <td>
                      {claveDe === u.id ? (
                        <form
                          className={s.acciones}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (await actualizar(u, { password: nuevaClave }, `Contraseña de ${u.nombre} actualizada.`)) {
                              setClaveDe(null);
                              setNuevaClave("");
                            }
                          }}
                        >
                          <input
                            className={s.select}
                            type="text"
                            placeholder="Nueva contraseña"
                            value={nuevaClave}
                            onChange={(e) => setNuevaClave(e.target.value)}
                            minLength={8}
                            autoFocus
                          />
                          <button className="btn btn-gold btn-sm">Guardar</button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClaveDe(null)}>
                            Cancelar
                          </button>
                        </form>
                      ) : (
                        <div className={s.acciones}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              actualizar(u, { activo: !u.activo }, `${u.nombre} quedó ${u.activo ? "inactivo: ya no puede ingresar" : "activo"}.`)
                            }
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setClaveDe(u.id)}>
                            Cambiar contraseña
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div>
          <form className={`card ${s.panel}`} onSubmit={crear} noValidate>
            <h3>Nueva cuenta del equipo</h3>
            <div className="field">
              <label htmlFor="u-nombre">Nombre</label>
              <input id="u-nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              {campos.nombre && <small>{campos.nombre}</small>}
            </div>
            <div className="field">
              <label htmlFor="u-email">Correo (usuario de ingreso)</label>
              <input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {campos.email && <small>{campos.email}</small>}
            </div>
            <div className="field">
              <label htmlFor="u-rol">Rol</label>
              <select id="u-rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="u-pass">Contraseña temporal</label>
              <input id="u-pass" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {campos.password && <small>{campos.password}</small>}
            </div>
            <button className="btn btn-gold btn-block" disabled={guardando}>
              {guardando ? "Creando…" : "Crear cuenta"}
            </button>
          </form>

          <div className={`card ${s.roles}`}>
            <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "1rem" }}>Qué ve cada rol</h3>
            {ROLES.map((r) => (
              <div key={r}>
                <b>{r}</b>
                <span>{modulosDeRol(r)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { money } from "@/lib/money";
import { SIGUIENTES } from "@/modules/pedidos/domain/pedido";
import type { EstadoPedido, Pedido } from "@/modules/pedidos/domain/types";
import s from "./pedidos.module.css";

type PedidoPanel = Omit<Pedido, "claveAcceso">;

const PILL: Record<EstadoPedido, string> = {
  "Pendiente de pago": "pill-danger",
  Alistamiento: "pill-warn",
  Enviado: "pill-blue",
  Entregado: "pill-ok",
  Cancelado: "pill-mute",
};

const FILTROS: (EstadoPedido | "Todos")[] = ["Todos", "Pendiente de pago", "Alistamiento", "Enviado", "Entregado", "Cancelado"];

const ACCION: Record<EstadoPedido, string> = {
  "Pendiente de pago": "",
  Alistamiento: "Pasar a alistamiento",
  Enviado: "Marcar como enviado",
  Entregado: "Marcar como entregado",
  Cancelado: "Cancelar pedido",
};

function fecha(iso: string, hora = false): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    ...(hora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

async function obtenerPedidos(): Promise<PedidoPanel[]> {
  const res = await fetch("/api/pedidos");
  const d = (await res.json()) as { pedidos?: PedidoPanel[]; error?: { message?: string } };
  if (!res.ok || !d.pedidos) throw new Error(d.error?.message ?? "No se pudieron cargar los pedidos");
  return d.pedidos;
}

function Detalle({ p, onCerrar, onCambio }: { p: PedidoPanel; onCerrar: () => void; onCambio: (p: PedidoPanel) => void }) {
  const [guia, setGuia] = useState(p.guia ?? "");
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cambiar(estado: EstadoPedido) {
    setGuardando(true);
    setAviso(null);
    const res = await fetch(`/api/pedidos/${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, guia: estado === "Enviado" ? guia : undefined }),
    });
    const d = (await res.json()) as { pedido?: PedidoPanel; error?: { message?: string } };
    setGuardando(false);
    setConfirmarCancelar(false);
    if (!res.ok || !d.pedido) {
      setAviso({ ok: false, texto: d.error?.message ?? "No se pudo actualizar" });
      return;
    }
    setAviso({ ok: true, texto: `Pedido en «${estado}». El cliente ya lo ve en Mis pedidos.` });
    onCambio(d.pedido);
  }

  const siguientes = SIGUIENTES[p.estado];

  return (
    <>
      <div className={s.fondo} onClick={onCerrar} />
      <aside className={s.cajon} role="dialog" aria-label={`Pedido ${p.id}`} onKeyDown={(e) => e.key === "Escape" && onCerrar()}>
        <div className={s.cajonHead}>
          <div>
            <h2>Pedido {p.id}</h2>
            <span className={`pill ${PILL[p.estado]}`}>{p.estado}</span>{" "}
            <span style={{ fontSize: ".78rem", color: "var(--ink-mute)" }}>{fecha(p.creadoEn, true)}</span>
          </div>
          <button className={s.cerrar} onClick={onCerrar} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </div>

        <div className={s.cajonBody}>
          <section className={s.bloque}>
            <h3>Cliente</h3>
            <p>
              <b>{p.contacto.nombre}</b> {p.clienteId ? "· con cuenta" : "· invitado"}
              <br />
              {p.contacto.email} ·{" "}
              <a href={`https://wa.me/57${p.contacto.telefono}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                {p.contacto.telefono}
              </a>
              <br />
              {p.direccion}, {p.ciudad}
            </p>
          </section>

          <section className={s.bloque}>
            <h3>Productos</h3>
            <ul className={s.items}>
              {p.items.map((it, i) => (
                <li key={i}>
                  <div>
                    {it.cantidad}× {it.nombre}
                    <small>
                      Talla {it.talla} · manga {it.manga.toLowerCase()} · {it.personalizacion}
                    </small>
                  </div>
                  <span className="tabular">{money(it.precioUnitario * it.cantidad)}</span>
                </li>
              ))}
            </ul>
            <div className={s.totales} style={{ marginTop: 10 }}>
              <div><span>Subtotal</span><span className="tabular">{money(p.subtotal)}</span></div>
              <div><span>Envío</span><span className="tabular">{money(p.envio)}</span></div>
              <div className={s.total}><span>Total</span><span className="tabular">{money(p.total)}</span></div>
            </div>
          </section>

          <section className={s.bloque}>
            <h3>Pago</h3>
            <p>
              {p.medioPago} · <span className={`pill ${p.estadoPago === "Pagado" ? "pill-ok" : "pill-warn"}`}>{p.estadoPago}</span>
              {p.guia && (
                <>
                  <br />
                  Guía de envío: <b>{p.guia}</b>
                </>
              )}
            </p>
          </section>

          <section className={s.bloque}>
            <h3>Historial</h3>
            <ol className={s.historial}>
              {p.historial.map((h, i) => (
                <li key={i}>
                  {h.estado}
                  {h.nota ? ` — ${h.nota}` : ""}
                  <small>{fecha(h.fecha, true)}</small>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className={s.acciones}>
          {aviso && <div className={`${s.aviso} ${aviso.ok ? s.ok : s.mal}`}>{aviso.texto}</div>}
          {siguientes.length === 0 ? (
            <span style={{ fontSize: ".82rem", color: "var(--ink-mute)" }}>Este pedido ya terminó: no tiene más cambios de estado.</span>
          ) : p.estado === "Pendiente de pago" && !confirmarCancelar ? (
            <span style={{ fontSize: ".82rem", color: "var(--ink-mute)" }}>
              Esperando el pago del cliente en la pasarela. Pasa solo a alistamiento cuando se apruebe.
            </span>
          ) : null}
          {siguientes.includes("Enviado") && (
            <div className={s.fila2}>
              <input placeholder="Número de guía (opcional)" value={guia} onChange={(e) => setGuia(e.target.value)} aria-label="Número de guía" />
              <button className="btn btn-gold btn-sm" disabled={guardando} onClick={() => cambiar("Enviado")}>
                {ACCION.Enviado}
              </button>
            </div>
          )}
          {siguientes.includes("Entregado") && (
            <button className="btn btn-gold btn-sm" disabled={guardando} onClick={() => cambiar("Entregado")}>
              {ACCION.Entregado}
            </button>
          )}
          {siguientes.includes("Cancelado") &&
            (confirmarCancelar ? (
              <div className={s.fila2}>
                <span style={{ fontSize: ".82rem", flex: 1 }}>¿Seguro? El cliente verá el pedido como cancelado.</span>
                <button className="btn btn-outline btn-sm" style={{ color: "var(--danger)" }} disabled={guardando} onClick={() => cambiar("Cancelado")}>
                  Sí, cancelar
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmarCancelar(false)}>
                  No
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)", justifySelf: "start" }} onClick={() => setConfirmarCancelar(true)}>
                {ACCION.Cancelado}
              </button>
            ))}
        </div>
      </aside>
    </>
  );
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoPanel[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const [cargadoEn, setCargadoEn] = useState(0);

  const cargar = useCallback(() => {
    obtenerPedidos().then(
      (lista) => {
        setPedidos(lista);
        setCargadoEn(Date.now());
        setError(null);
      },
      (e: Error) => setError(e.message),
    );
  }, []);

  useEffect(() => {
    cargar();
    // Los pedidos nuevos de la tienda aparecen solos.
    const t = setInterval(cargar, 20_000);
    return () => clearInterval(t);
  }, [cargar]);

  const conteo = useMemo(() => {
    const c: Record<string, number> = { Todos: pedidos?.length ?? 0 };
    for (const p of pedidos ?? []) c[p.estado] = (c[p.estado] ?? 0) + 1;
    return c;
  }, [pedidos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (pedidos ?? []).filter(
      (p) =>
        (filtro === "Todos" || p.estado === filtro) &&
        (!q || p.id.toLowerCase().includes(q) || p.contacto.nombre.toLowerCase().includes(q) || p.contacto.email.includes(q)),
    );
  }, [pedidos, filtro, busqueda]);

  const seleccionado = pedidos?.find((p) => p.id === abierto) ?? null;
  const porAtender = (conteo["Alistamiento"] ?? 0) + (conteo["Enviado"] ?? 0);
  const hace24h = cargadoEn - 24 * 3600 * 1000;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Pedidos</h1>
          <p>
            <span className="tabular">{conteo.Todos}</span> pedidos · <span className="tabular">{porAtender}</span> por alistar o entregar
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={cargar}>
          ↻ Actualizar
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: 14, color: "var(--danger)", marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className={s.barra}>
        <input className={s.buscar} placeholder="Buscar por número, cliente o correo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>
      <div className={s.chips}>
        {FILTROS.map((f) => (
          <button key={f} className={filtro === f ? s.activo : ""} onClick={() => setFiltro(f)}>
            {f} ({conteo[f] ?? 0})
          </button>
        ))}
      </div>

      <div className="card overflow-x">
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos === null && (
              <tr>
                <td colSpan={7} className={s.vacio}>
                  Cargando…
                </td>
              </tr>
            )}
            {pedidos !== null && visibles.length === 0 && (
              <tr>
                <td colSpan={7} className={`${s.vacio} panel-vacio`}>
                  <b>Sin pedidos</b>
                  <span>No hay pedidos con ese filtro. Prueba otro estado o limpia la búsqueda.</span>
                </td>
              </tr>
            )}
            {visibles.map((p) => (
              <tr
                key={p.id}
                className={`${s.fila} ${abierto === p.id ? s.seleccion : ""}`}
                onClick={() => setAbierto(p.id)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setAbierto(p.id)}
              >
                <td className="mono">
                  #{p.id}
                  {new Date(p.creadoEn).getTime() > hace24h && <span className={s.nuevo}>NUEVO</span>}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="avatar-mini">{p.contacto.nombre.charAt(0)}</span>
                    {p.contacto.nombre}
                    <span style={{ color: "var(--ink-mute)", fontSize: ".72rem" }}>{p.clienteId ? "Con cuenta" : "Invitado"}</span>
                  </div>
                </td>
                <td>{fecha(p.creadoEn)}</td>
                <td>{p.items.reduce((n, it) => n + it.cantidad, 0)} producto(s)</td>
                <td className="tabular">{money(p.total)}</td>
                <td>{p.estadoPago}</td>
                <td>
                  <span className={`pill ${PILL[p.estado]}`}>{p.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionado && (
        <Detalle
          key={seleccionado.id}
          p={seleccionado}
          onCerrar={() => setAbierto(null)}
          onCambio={(nuevo) => setPedidos((lista) => lista?.map((x) => (x.id === nuevo.id ? nuevo : x)) ?? null)}
        />
      )}
    </>
  );
}

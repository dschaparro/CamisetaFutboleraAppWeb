"use client";

import Link from "next/link";
import { useState } from "react";
import s from "@/components/store/cuenta.module.css";
import { money } from "@/lib/money";
import { PASOS_PEDIDO, type EstadoPedido, type Pedido } from "@/modules/pedidos/domain/types";

const PILL: Record<EstadoPedido, string> = {
  "Pendiente de pago": "pill-warn",
  Alistamiento: "pill-blue",
  Enviado: "pill-blue",
  Entregado: "pill-ok",
  Cancelado: "pill-danger",
};

export function fecha(iso: string, conHora = false): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function DetallePedido({ p }: { p: Pedido }) {
  const fechaDe = (estado: EstadoPedido) => p.historial.filter((h) => h.estado === estado).at(-1)?.fecha;
  return (
    <div className={s.detalle}>
      {p.estado === "Pendiente de pago" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="pill pill-warn">Falta el pago para empezar a alistar tu pedido</span>
          <Link className="btn btn-gold btn-sm" href={`/pago/${encodeURIComponent(p.id)}?k=${encodeURIComponent(p.claveAcceso)}`}>
            Pagar ahora
          </Link>
        </div>
      )}
      {p.estado !== "Cancelado" && (
        <ol className={s.linea} aria-label="Estado del pedido">
          {PASOS_PEDIDO.map((paso) => {
            const f = fechaDe(paso);
            return (
              <li key={paso} className={f ? s.hecho : ""}>
                {paso === "Pendiente de pago" ? "Pedido recibido" : paso}
                {f && <small>{fecha(f, true)}</small>}
              </li>
            );
          })}
        </ol>
      )}

      <ul className={s.items}>
        {p.items.map((it, i) => (
          <li key={i}>
            <div>
              {it.slug ? <Link href={`/producto/${it.slug}`}>{it.nombre}</Link> : <b>{it.nombre}</b>}
              <span>
                Talla {it.talla} · Manga {it.manga.toLowerCase()} · {it.personalizacion} · ×{it.cantidad}
              </span>
            </div>
            <b className="tabular">{money(it.precioUnitario * it.cantidad)}</b>
          </li>
        ))}
      </ul>

      <div className={s.resumen}>
        <div>
          <span>Subtotal</span>
          <span className="tabular">{money(p.subtotal)}</span>
        </div>
        {p.descuento > 0 && (
          <div>
            <span>Descuento</span>
            <span className="tabular">−{money(p.descuento)}</span>
          </div>
        )}
        <div>
          <span>Envío ({p.ciudad})</span>
          <span className="tabular">{money(p.envio)}</span>
        </div>
        <div className={s.totalFila}>
          <span>Total</span>
          <span className="tabular">{money(p.total)}</span>
        </div>
      </div>

      <div className={s.meta}>
        Pago: {p.medioPago} ({p.estadoPago.toLowerCase()}) · Envío a {p.direccion}, {p.ciudad}
        {p.guia && (
          <>
            {" "}
            · Guía de envío: <b>{p.guia}</b>
          </>
        )}
        <br />
        ¿Algún problema con este pedido?{" "}
        <a
          href={`https://wa.me/573223176175?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido ${p.id}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function SeccionPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const [abierto, setAbierto] = useState<string | null>(pedidos[0]?.id ?? null);
  const [filtro, setFiltro] = useState<"todos" | "curso" | "terminados">("todos");

  const enCurso = (p: Pedido) => p.estado !== "Entregado" && p.estado !== "Cancelado";
  const visibles = pedidos.filter((p) => filtro === "todos" || (filtro === "curso" ? enCurso(p) : !enCurso(p)));

  if (pedidos.length === 0) {
    return (
      <div className={`card ${s.vacio}`}>
        <b>Todavía no tienes pedidos</b>
        Cuando compres, aquí verás el estado de cada pedido.
        <div style={{ marginTop: 14 }}>
          <Link className="btn btn-gold btn-sm" href="/">
            Ver camisetas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={s.filtros}>
        {(
          [
            ["todos", `Todos (${pedidos.length})`],
            ["curso", `En curso (${pedidos.filter(enCurso).length})`],
            ["terminados", `Entregados o cancelados (${pedidos.filter((p) => !enCurso(p)).length})`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={filtro === k ? s.filtroActivo : ""} onClick={() => setFiltro(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className={s.pedidos}>
        {visibles.map((p) => (
          <article key={p.id} className={`card ${s.pedido}`}>
            <button className={s.pedidoHead} onClick={() => setAbierto((a) => (a === p.id ? null : p.id))} aria-expanded={abierto === p.id}>
              <div>
                <b>Pedido {p.id}</b>{" "}
                <span className={`pill ${PILL[p.estado]}`} style={{ marginLeft: 6 }}>
                  {p.estado}
                </span>
                <div className={s.meta}>
                  {fecha(p.creadoEn)} · {p.items.reduce((n, it) => n + it.cantidad, 0)} artículo(s)
                </div>
              </div>
              <div className={s.total}>
                {money(p.total)}
                <div className={s.meta}>{abierto === p.id ? "Ocultar ▲" : "Ver detalle ▼"}</div>
              </div>
            </button>
            {abierto === p.id && <DetallePedido p={p} />}
          </article>
        ))}
      </div>
    </>
  );
}

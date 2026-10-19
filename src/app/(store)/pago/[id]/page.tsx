"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import s from "@/components/store/pago.module.css";
import { money } from "@/lib/money";
import type { Pedido } from "@/modules/pedidos/domain/types";

type Metodo = "guardada" | "tarjeta" | "pse" | "nequi";
type Guardada = { id: string; marca: string; ultimos4: string; vencimiento: string; predeterminada: boolean };
type Resultado = { aprobado: boolean; mensaje: string; referencia: string };

const BANCOS = ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA", "Nequi (cuenta de ahorros)"];

function formatearTarjeta(v: string): string {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatearVencimiento(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Pasarela de pagos SIMULADA (imita Wompi): no cobra nada real. */
export default function PagoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { id } = use(params);
  const { k = "" } = use(searchParams);
  const router = useRouter();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [monto, setMonto] = useState(0);
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("tarjeta");
  const [tarjeta, setTarjeta] = useState({ numero: "", vencimiento: "", cvc: "", titular: "" });
  const [banco, setBanco] = useState(BANCOS[0]);
  const [celular, setCelular] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [guardadas, setGuardadas] = useState<Guardada[]>([]);
  const [medioId, setMedioId] = useState("");
  const [cvcGuardada, setCvcGuardada] = useState("");

  // Con sesión de cliente se ofrecen sus tarjetas guardadas (solo pide el CVC).
  useEffect(() => {
    fetch("/api/cuenta/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { perfil?: { tarjetas: Guardada[] } } | null) => {
        const lista = d?.perfil?.tarjetas ?? [];
        if (lista.length === 0) return;
        setGuardadas(lista);
        setMedioId((lista.find((t) => t.predeterminada) ?? lista[0]).id);
        setMetodo("guardada");
      })
      .catch(() => {});
  }, []);

  const confirmacion = `/confirmacion?pedido=${encodeURIComponent(id)}&k=${encodeURIComponent(k)}`;

  useEffect(() => {
    fetch(`/api/tienda/pedidos/${encodeURIComponent(id)}?k=${encodeURIComponent(k)}`)
      .then(async (r) => {
        const d = (await r.json()) as { pedido?: Pedido; montoACobrar?: number; error?: { message?: string } };
        if (!r.ok || !d.pedido) throw new Error(d.error?.message ?? "No encontramos ese pedido");
        setPedido(d.pedido);
        setMonto(d.montoACobrar ?? d.pedido.total);
        setTarjeta((t) => ({ ...t, titular: t.titular || d.pedido!.contacto.nombre.toUpperCase() }));
      })
      .catch((e: Error) => setCargaError(e.message));
  }, [id, k]);

  async function pagar(cuerpo: Record<string, unknown>) {
    setProcesando(true);
    setCampos({});
    setResultado(null);
    try {
      const res = await fetch(`/api/tienda/pedidos/${encodeURIComponent(id)}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k, ...cuerpo }),
      });
      const d = (await res.json()) as Resultado & { error?: { message?: string; campos?: Record<string, string> } };
      if (!res.ok) {
        if (d.error?.campos) setCampos(d.error.campos);
        else setResultado({ aprobado: false, mensaje: d.error?.message ?? "No se pudo procesar el pago", referencia: "" });
        return;
      }
      setResultado(d);
      if (d.aprobado) setTimeout(() => router.push(confirmacion), 1600);
    } catch {
      setResultado({ aprobado: false, mensaje: "Se perdió la conexión. Intenta de nuevo.", referencia: "" });
    } finally {
      setProcesando(false);
    }
  }

  function pagarTarjeta(e: FormEvent) {
    e.preventDefault();
    pagar({ metodo: "tarjeta", ...tarjeta });
  }

  if (cargaError) {
    return (
      <div className={s.pagina}>
        <div className={`card ${s.resultado}`}>
          <b>{cargaError}</b>
          <Link className="btn btn-outline btn-sm" href="/">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }
  if (!pedido) {
    return (
      <div className={s.pagina}>
        <div className={s.resultado}>
          <span className="spinner" /> Abriendo la pasarela…
        </div>
      </div>
    );
  }
  if (pedido.estado !== "Pendiente de pago" && !resultado) {
    return (
      <div className={s.pagina}>
        <div className={`card ${s.resultado}`}>
          <div className={`${s.icono} ${s.ok}`}>✓</div>
          <b>Este pedido ya está pagado</b>
          <Link className="btn btn-gold btn-sm" href={confirmacion}>
            Ver mi pedido
          </Link>
        </div>
      </div>
    );
  }

  const campo = (k2: keyof typeof tarjeta, label: string, extra: React.InputHTMLAttributes<HTMLInputElement>, formato?: (v: string) => string) => (
    <div className="field">
      <label htmlFor={`t-${k2}`}>{label}</label>
      <input
        id={`t-${k2}`}
        value={tarjeta[k2]}
        onChange={(e) => setTarjeta({ ...tarjeta, [k2]: formato ? formato(e.target.value) : e.target.value })}
        aria-invalid={!!campos[k2]}
        style={campos[k2] ? { borderColor: "var(--danger)" } : undefined}
        {...extra}
      />
      {campos[k2] && <small>{campos[k2]}</small>}
    </div>
  );

  return (
    <div className="wrap">
      <div className={s.pagina}>
        <div className={s.prueba}>🧪 Pasarela de pagos SIMULADA — modo prueba, no se cobra dinero real</div>

        <div className={`card ${s.caja}`}>
          <div className={s.cabeza}>
            <div>
              <div className={s.marca}>
                Wompi <span>· prueba</span>
              </div>
              <small>
                Camiseta Futbolera · Pedido {pedido.id}
                {pedido.medioPago.startsWith("Abono") ? " · abono del 50 %" : ""}
              </small>
            </div>
            <b>{money(monto)}</b>
          </div>

          {resultado ? (
            <div className={s.resultado} role="status">
              <div className={`${s.icono} ${resultado.aprobado ? s.ok : s.mal}`}>{resultado.aprobado ? "✓" : "✕"}</div>
              <b>{resultado.mensaje}</b>
              {resultado.referencia && <span className={s.ref}>Referencia {resultado.referencia}</span>}
              {resultado.aprobado ? (
                <span className={s.ref}>Te llevamos a la confirmación de tu pedido…</span>
              ) : (
                <button className="btn btn-gold btn-sm" onClick={() => setResultado(null)}>
                  Intentar de nuevo
                </button>
              )}
            </div>
          ) : (
            <div className={s.cuerpo}>
              <div className={s.tabs} role="tablist" style={guardadas.length ? { gridTemplateColumns: "repeat(4, 1fr)" } : undefined}>
                {((guardadas.length ? ["guardada", "tarjeta", "pse", "nequi"] : ["tarjeta", "pse", "nequi"]) as Metodo[]).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={metodo === m} className={metodo === m ? s.activo : ""} onClick={() => setMetodo(m)}>
                    {m === "guardada" ? "⭐ Mis tarjetas" : m === "tarjeta" ? "💳 Nueva" : m === "pse" ? "🏦 PSE" : "📱 Nequi"}
                  </button>
                ))}
              </div>

              {metodo === "guardada" && (
                <form
                  className={s.cuerpo}
                  style={{ padding: 0 }}
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    pagar({ metodo: "guardada", medioId, cvc: cvcGuardada });
                  }}
                >
                  {guardadas.map((t) => (
                    <label key={t.id} className={`pay-option${medioId === t.id ? " selected" : ""}`} style={{ marginBottom: 0 }}>
                      <div className="head">
                        <input type="radio" name="guardada" checked={medioId === t.id} onChange={() => setMedioId(t.id)} /> {t.marca} •••• {t.ultimos4}
                      </div>
                      <p>Vence {t.vencimiento}{t.predeterminada ? " · principal" : ""}</p>
                    </label>
                  ))}
                  <div className="field">
                    <label htmlFor="cvc-g">CVC de la tarjeta</label>
                    <input id="cvc-g" inputMode="numeric" maxLength={4} placeholder="123" value={cvcGuardada} onChange={(e) => setCvcGuardada(e.target.value.replace(/\D/g, ""))} aria-invalid={!!campos.cvc} style={campos.cvc ? { borderColor: "var(--danger)" } : undefined} />
                    {campos.cvc && <small>{campos.cvc}</small>}
                  </div>
                  <button className="btn btn-gold btn-block" disabled={procesando}>
                    {procesando ? "Procesando pago…" : `Pagar ${money(monto)}`}
                  </button>
                </form>
              )}

              {metodo === "tarjeta" && (
                <form className={s.cuerpo} style={{ padding: 0 }} onSubmit={pagarTarjeta} noValidate>
                  {campo("numero", "Número de tarjeta", { inputMode: "numeric", autoComplete: "cc-number", placeholder: "0000 0000 0000 0000" }, formatearTarjeta)}
                  <div className={s.fila}>
                    {campo("vencimiento", "Vence (MM/AA)", { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "12/28" }, formatearVencimiento)}
                    {campo("cvc", "CVC", { inputMode: "numeric", autoComplete: "cc-csc", placeholder: "123", maxLength: 4 })}
                  </div>
                  {campo("titular", "Nombre en la tarjeta", { autoComplete: "cc-name" })}
                  <div className={s.ayuda}>
                    Tarjetas de prueba:
                    <button type="button" onClick={() => setTarjeta({ ...tarjeta, numero: "4242 4242 4242 4242", vencimiento: "12/30", cvc: "123" })}>
                      4242… aprobada
                    </button>
                    <button type="button" onClick={() => setTarjeta({ ...tarjeta, numero: "4000 0000 0000 0002", vencimiento: "12/30", cvc: "123" })}>
                      4000…0002 rechazada
                    </button>
                  </div>
                  <button className="btn btn-gold btn-block" disabled={procesando}>
                    {procesando ? "Procesando pago…" : `Pagar ${money(monto)}`}
                  </button>
                </form>
              )}

              {(metodo === "pse" || metodo === "nequi") && (
                <>
                  {metodo === "pse" ? (
                    <div className="field">
                      <label htmlFor="banco">Banco</label>
                      <select id="banco" value={banco} onChange={(e) => setBanco(e.target.value)}>
                        {BANCOS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="cel">Celular Nequi</label>
                      <input id="cel" inputMode="tel" placeholder="300 123 4567" value={celular} onChange={(e) => setCelular(e.target.value)} />
                    </div>
                  )}
                  <p className={s.ayuda}>
                    En modo prueba tú decides qué responde {metodo === "pse" ? "el banco" : "Nequi"}:
                  </p>
                  <div className={s.dosBotones}>
                    <button className="btn btn-gold" disabled={procesando} onClick={() => pagar({ metodo, aprobar: true })}>
                      {procesando ? "Procesando…" : "✓ Aprobar pago"}
                    </button>
                    <button className="btn btn-outline" disabled={procesando} onClick={() => pagar({ metodo, aprobar: false })}>
                      ✕ Rechazar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <p className={s.pie}>🔒 Pago protegido · Puedes pagar después desde «Mis pedidos» si tienes cuenta</p>
        </div>
      </div>
    </div>
  );
}

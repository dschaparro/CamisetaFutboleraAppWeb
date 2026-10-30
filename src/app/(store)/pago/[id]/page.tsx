"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent, type InputHTMLAttributes } from "react";
import {
  IconoAlerta,
  IconoBanco,
  IconoCandado,
  IconoCheck,
  IconoEstrella,
  IconoFlecha,
  IconoInfo,
  IconoTarjeta,
  IconoTelefono,
} from "@/components/icons/pago";
import LoaderMarca from "@/components/store/LoaderMarca";
import s from "@/components/store/pago.module.css";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { money } from "@/lib/money";
import type { Pedido } from "@/modules/pedidos/domain/types";

type Metodo = "guardada" | "tarjeta" | "pse" | "nequi";
type Guardada = { id: string; marca: string; ultimos4: string; vencimiento: string; predeterminada: boolean };
type Resultado = { aprobado: boolean; mensaje: string; referencia: string };
type Modo = "mercadopago" | "simulada";

const BANCOS = ["Bancolombia", "Banco de Bogotá", "Davivienda", "BBVA", "Nequi (cuenta de ahorros)"];

function formatearTarjeta(v: string): string {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatearVencimiento(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function Pasos({ activo }: { activo: 2 | 3 }) {
  return (
    <nav className={s.pasos} aria-label="Progreso de compra">
      <span className={`${s.paso} ${s.pasoHecho}`}>
        <span className={s.pasoNum} aria-hidden="true">
          <IconoCheck size={12} />
        </span>
        Carrito
      </span>
      <span className={s.pasoSep} aria-hidden="true" />
      <span className={`${s.paso} ${activo === 2 ? s.pasoActivo : s.pasoHecho}`}>
        <span className={s.pasoNum}>{activo === 2 ? "2" : <IconoCheck size={12} />}</span>
        Pago
      </span>
      <span className={s.pasoSep} aria-hidden="true" />
      <span className={`${s.paso} ${activo === 3 ? s.pasoActivo : ""}`}>
        <span className={s.pasoNum}>3</span>
        Listo
      </span>
    </nav>
  );
}

/** Pago en línea: Mercado Pago Checkout Pro si hay credenciales; si no, pasarela simulada local. */
export default function PagoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ k?: string; mp?: string }>;
}) {
  const { id } = use(params);
  const { k = "", mp: mpEstado } = use(searchParams);
  const router = useRouter();
  const { toast } = useToast();
  const { clear } = useCart();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [monto, setMonto] = useState(0);
  const [modo, setModo] = useState<Modo>("simulada");
  const [cargaError, setCargaError] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<Metodo>("tarjeta");
  const [tarjeta, setTarjeta] = useState({ numero: "", vencimiento: "", cvc: "", titular: "" });
  const [banco, setBanco] = useState(BANCOS[0]);
  const [celular, setCelular] = useState("");
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);
  const [redirigiendo, setRedirigiendo] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(
    mpEstado === "failure"
      ? {
          aprobado: false,
          mensaje: "No pudimos completar el pago. No se cobró nada: puedes intentarlo otra vez cuando quieras.",
          referencia: "",
        }
      : null,
  );
  const [guardadas, setGuardadas] = useState<Guardada[]>([]);
  const [medioId, setMedioId] = useState("");
  const [cvcGuardada, setCvcGuardada] = useState("");

  useEffect(() => {
    if (mpEstado === "failure") {
      toast({
        variant: "error",
        titulo: "Pago no completado",
        detalle: "Puedes volver a intentarlo sin problema",
      });
    } else if (mpEstado === "pending") {
      toast({
        variant: "info",
        titulo: "Pago en revisión",
        detalle: "Te avisamos cuando Mercado Pago lo confirme",
      });
    }
  }, [mpEstado, toast]);

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
        const d = (await r.json()) as {
          pedido?: Pedido;
          montoACobrar?: number;
          modoPasarela?: Modo;
          error?: { message?: string };
        };
        if (!r.ok || !d.pedido) throw new Error(d.error?.message ?? "No encontramos ese pedido");
        setPedido(d.pedido);
        setMonto(d.montoACobrar ?? d.pedido.total);
        setModo(d.modoPasarela === "mercadopago" ? "mercadopago" : "simulada");
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
      const d = (await res.json()) as Resultado & {
        modo?: Modo;
        redirectUrl?: string;
        error?: { message?: string; campos?: Record<string, string> };
      };
      if (!res.ok) {
        if (d.error?.campos) {
          setCampos(d.error.campos);
          toast({ variant: "error", titulo: "Revisa tus datos", detalle: "Completa los campos marcados" });
          const primero = Object.keys(d.error.campos)[0];
          document.getElementById(primero === "cvc" ? "cvc-g" : `t-${primero}`)?.focus();
        } else {
          // Resultado en pantalla: sin toast con el mismo texto
          setResultado({
            aprobado: false,
            mensaje: d.error?.message ?? "No se pudo procesar el pago",
            referencia: "",
          });
        }
        return;
      }
      if (d.redirectUrl) {
        setRedirigiendo(true);
        toast({
          variant: "info",
          titulo: "Te llevamos a Mercado Pago",
          detalle: "Ventana segura · no cierres esta pestaña",
          ms: 6000,
        });
        window.location.assign(d.redirectUrl);
        return;
      }
      setResultado(d);
      if (d.aprobado) {
        clear();
        toast({ variant: "ok", titulo: "¡Pago aprobado!", detalle: "Preparando tu confirmación…" });
        setTimeout(() => router.push(confirmacion), 1400);
      }
      // Rechazo: solo el bloque de resultado (sin toast duplicado)
    } catch {
      setResultado({
        aprobado: false,
        mensaje: "Se perdió la conexión. Revisa tu red e intenta de nuevo.",
        referencia: "",
      });
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
      <div className="wrap">
        <div className={s.pagina}>
          <div className={`card ${s.resultado}`}>
            <div className={`${s.icono} ${s.mal}`}>
              <IconoAlerta size={28} />
            </div>
            <p className={s.resultadoTitulo}>{cargaError}</p>
            <p className={s.ref}>Si acabas de crear el pedido, vuelve desde el correo o desde «Mis pedidos».</p>
            <Link className="btn btn-outline btn-sm" href="/">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="wrap">
        <LoaderMarca
          titulo="Preparando un pago seguro"
          detalle="Conectamos con la pasarela y listamos tus datos de cobro."
        />
      </div>
    );
  }

  if (pedido.estado !== "Pendiente de pago" && !resultado) {
    return (
      <div className="wrap">
        <div className={s.pagina}>
          <Pasos activo={3} />
          <div className={`card ${s.resultado}`}>
            <div className={`${s.icono} ${s.ok}`}>
              <IconoCheck size={30} />
            </div>
            <p className={s.resultadoTitulo}>Este pedido ya está pagado</p>
            <p className={s.ref}>Todo listo: puedes ver el detalle y el seguimiento.</p>
            <Link className="btn btn-gold btn-sm" href={confirmacion}>
              Ver mi pedido <IconoFlecha size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const campo = (
    k2: keyof typeof tarjeta,
    label: string,
    extra: InputHTMLAttributes<HTMLInputElement>,
    formato?: (v: string) => string,
  ) => (
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
      {campos[k2] && <span className="field-error">{campos[k2]}</span>}
    </div>
  );

  const esAbono = pedido.medioPago.startsWith("Abono");

  return (
    <div className="wrap">
      <div className={s.pagina}>
        <Pasos activo={2} />

        <div className={s.prueba} role="note">
          <IconoInfo size={18} />
          <span>
            {modo === "mercadopago"
              ? "Estás en modo de prueba de Mercado Pago: no se cobra dinero real. Ideal para validar la compra."
              : "Pasarela de demostración local (sin Mercado Pago configurado). Perfecta para mostrar el flujo offline."}
          </span>
        </div>

        <div className={`card ${s.caja}`}>
          <div className={s.cabeza}>
            <div>
              <div className={s.marca}>
                Mercado Pago
                <span className={s.marcaChip}>{modo === "mercadopago" ? "Checkout Pro" : "Demo local"}</span>
              </div>
              <small>
                Pedido {pedido.id}
                {esAbono ? " · abono del 50 % hoy" : ""}
                <br />
                {pedido.contacto.nombre.split(" ")[0]}, estás a un paso de confirmar tu camiseta.
              </small>
            </div>
            <div className={s.monto}>
              <span className={s.montoLabel}>{esAbono ? "Pagas ahora" : "Total"}</span>
              <b>{money(monto)}</b>
            </div>
          </div>

          {resultado ? (
            <div className={s.resultado} role="status">
              <div className={`${s.icono} ${resultado.aprobado ? s.ok : s.mal}`}>
                {resultado.aprobado ? <IconoCheck size={30} /> : <IconoAlerta size={28} />}
              </div>
              <p className={s.resultadoTitulo}>{resultado.mensaje}</p>
              {resultado.referencia && <span className={s.ref}>Referencia {resultado.referencia}</span>}
              {resultado.aprobado ? (
                <span className={s.ref}>Te llevamos a la confirmación…</span>
              ) : (
                <button type="button" className="btn btn-gold btn-sm" onClick={() => setResultado(null)}>
                  Intentar de nuevo
                </button>
              )}
            </div>
          ) : modo === "mercadopago" ? (
            <div className={s.cuerpo}>
              <p className={s.intro}>
                Te redirigimos al checkout seguro de Mercado Pago. Ahí eliges tarjeta, PSE o Nequi y regresas
                automáticamente a Camiseta Futbolera.
              </p>

              <div className={s.confianza}>
                <div className={s.confianzaItem}>
                  <IconoCandado size={18} />
                  <div>
                    <strong>Pago cifrado</strong>
                    Tus datos bancarios quedan en Mercado Pago
                  </div>
                </div>
                <div className={s.confianzaItem}>
                  <IconoTarjeta size={18} />
                  <div>
                    <strong>Varias formas</strong>
                    Tarjeta, PSE o Nequi en un solo paso
                  </div>
                </div>
              </div>

              <p className={s.pista}>
                En sandbox usa la tarjeta <code>5031 7557 3453 0604</code>, titular <code>APRO</code>, CVC{" "}
                <code>123</code>, vence <code>11/30</code>.
              </p>

              <div className={s.ctaFija}>
                <button
                  type="button"
                  className="btn btn-gold btn-block"
                  disabled={procesando || redirigiendo}
                  onClick={() => pagar({ metodo: "mercadopago" })}
                >
                  {procesando || redirigiendo ? (
                    <LoaderMarca variante="inline" titulo="Abriendo Mercado Pago…" />
                  ) : (
                    <>
                      Pagar {money(monto)} de forma segura <IconoFlecha size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className={s.cuerpo}>
              <p className={s.intro}>Elige cómo quieres pagar. En esta demo tú controlas si el pago se aprueba o se rechaza.</p>

              <div
                className={`${s.tabs} ${guardadas.length ? s.tabs4 : ""}`}
                role="tablist"
                aria-label="Método de pago"
              >
                {(
                  (guardadas.length ? ["guardada", "tarjeta", "pse", "nequi"] : ["tarjeta", "pse", "nequi"]) as Metodo[]
                ).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={metodo === m}
                    className={metodo === m ? s.activo : ""}
                    onClick={() => setMetodo(m)}
                  >
                    {m === "guardada" ? (
                      <IconoEstrella size={16} />
                    ) : m === "tarjeta" ? (
                      <IconoTarjeta size={16} />
                    ) : m === "pse" ? (
                      <IconoBanco size={16} />
                    ) : (
                      <IconoTelefono size={16} />
                    )}
                    {m === "guardada" ? "Guardadas" : m === "tarjeta" ? "Tarjeta" : m === "pse" ? "PSE" : "Nequi"}
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
                        <input type="radio" name="guardada" checked={medioId === t.id} onChange={() => setMedioId(t.id)} />{" "}
                        {t.marca} •••• {t.ultimos4}
                      </div>
                      <p>
                        Vence {t.vencimiento}
                        {t.predeterminada ? " · principal" : ""}
                      </p>
                    </label>
                  ))}
                  <div className="field">
                    <label htmlFor="cvc-g">CVC de la tarjeta</label>
                    <input
                      id="cvc-g"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="123"
                      value={cvcGuardada}
                      onChange={(e) => setCvcGuardada(e.target.value.replace(/\D/g, ""))}
                      aria-invalid={!!campos.cvc}
                      style={campos.cvc ? { borderColor: "var(--danger)" } : undefined}
                    />
                    {campos.cvc && <span className="field-error">{campos.cvc}</span>}
                  </div>
                  <div className={s.ctaFija}>
                    <button className="btn btn-gold btn-block" disabled={procesando}>
                      {procesando ? (
                        <>
                          <LoaderMarca variante="inline" titulo="Procesando…" />
                        </>
                      ) : (
                        <>
                          Pagar {money(monto)} <IconoFlecha size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {metodo === "tarjeta" && (
                <form className={s.cuerpo} style={{ padding: 0 }} onSubmit={pagarTarjeta} noValidate>
                  {campo(
                    "numero",
                    "Número de tarjeta",
                    { inputMode: "numeric", autoComplete: "cc-number", placeholder: "0000 0000 0000 0000" },
                    formatearTarjeta,
                  )}
                  <div className={s.fila}>
                    {campo(
                      "vencimiento",
                      "Vence (MM/AA)",
                      { inputMode: "numeric", autoComplete: "cc-exp", placeholder: "12/28" },
                      formatearVencimiento,
                    )}
                    {campo("cvc", "CVC", {
                      inputMode: "numeric",
                      autoComplete: "cc-csc",
                      placeholder: "123",
                      maxLength: 4,
                    })}
                  </div>
                  {campo("titular", "Nombre en la tarjeta", { autoComplete: "cc-name" })}
                  <div className={s.ayuda}>
                    Tarjetas de prueba:
                    <button
                      type="button"
                      onClick={() => setTarjeta({ ...tarjeta, numero: "4242 4242 4242 4242", vencimiento: "12/30", cvc: "123" })}
                    >
                      4242… aprobada
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarjeta({ ...tarjeta, numero: "4000 0000 0000 0002", vencimiento: "12/30", cvc: "123" })}
                    >
                      4000…0002 rechazada
                    </button>
                  </div>
                  <div className={s.ctaFija}>
                    <button className="btn btn-gold btn-block" disabled={procesando}>
                      {procesando ? (
                        <>
                          <LoaderMarca variante="inline" titulo="Procesando…" />
                        </>
                      ) : (
                        <>
                          Pagar {money(monto)} <IconoFlecha size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {(metodo === "pse" || metodo === "nequi") && (
                <>
                  {metodo === "pse" ? (
                    <div className="field">
                      <label htmlFor="banco">Elige tu banco</label>
                      <select id="banco" value={banco} onChange={(e) => setBanco(e.target.value)}>
                        {BANCOS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="field">
                      <label htmlFor="cel">Celular Nequi</label>
                      <input
                        id="cel"
                        inputMode="tel"
                        placeholder="300 123 4567"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                      />
                    </div>
                  )}
                  <p className={s.ayuda}>
                    En modo demo decides qué responde {metodo === "pse" ? "el banco" : "Nequi"}:
                  </p>
                  <div className={s.dosBotones}>
                    <button
                      type="button"
                      className="btn btn-gold"
                      disabled={procesando}
                      onClick={() => pagar({ metodo, aprobar: true })}
                    >
                      {procesando ? "Procesando…" : "Aprobar pago"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={procesando}
                      onClick={() => pagar({ metodo, aprobar: false })}
                    >
                      Simular rechazo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <p className={s.pie}>
            <IconoCandado size={14} />
            Pago protegido · Si prefieres, puedes terminar más tarde desde «Mis pedidos»
          </p>
        </div>
      </div>

      {redirigiendo && (
        <div className={s.overlay} role="alert" aria-live="assertive">
          <div className={s.overlayCaja}>
            <LoaderMarca
              titulo="Abriendo Mercado Pago…"
              detalle="No cierres ni recargues: en unos segundos verás el checkout seguro."
              className={s.overlayLoader}
            />
          </div>
        </div>
      )}
    </div>
  );
}

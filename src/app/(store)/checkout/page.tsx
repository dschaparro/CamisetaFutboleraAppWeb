"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { IconoBanco, IconoCamion, IconoCandado, IconoCheck, IconoTarjeta } from "@/components/icons/pago";
import s from "@/components/store/checkout.module.css";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { money } from "@/lib/money";
import type { Direccion } from "@/modules/identidad/domain/perfil-tipos";

const ENVIO = 18000;

type Pago = "pasarela" | "contraentrega" | "abono";
type Campos = Partial<Record<"nombre" | "telefono" | "email" | "direccion" | "ciudad" | "medioPago" | "items", string>>;

const MEDIOS: { valor: Pago; titulo: string; texto: string; Icono: typeof IconoTarjeta }[] = [
  {
    valor: "pasarela",
    titulo: "Pagar ahora en línea",
    texto: "Tarjeta, PSE o Nequi con Mercado Pago. Te llevamos a un checkout seguro y vuelves acá cuando termines.",
    Icono: IconoTarjeta,
  },
  {
    valor: "contraentrega",
    titulo: "Pagar al recibir",
    texto: "Confirmas el pedido hoy y pagas en efectivo o transferencia cuando llegue el mensajero (según cobertura).",
    Icono: IconoBanco,
  },
  {
    valor: "abono",
    titulo: "Abono del 50 % ahora",
    texto: "Reservas con la mitad en línea; el resto lo pagas contra entrega. Ideal si quieres asegurar la talla.",
    Icono: IconoCandado,
  },
];

function Pasos() {
  return (
    <nav className={s.pasos} aria-label="Progreso de compra">
      <Link href="/carrito" className={`${s.paso} ${s.pasoHecho}`}>
        <span className={s.pasoNum}>1</span> Carrito
      </Link>
      <span className={s.pasoSep} aria-hidden="true" />
      <span className={`${s.paso} ${s.pasoActivo}`}>
        <span className={s.pasoNum}>2</span> Datos
      </span>
      <span className={s.pasoSep} aria-hidden="true" />
      <span className={s.paso}>
        <span className={s.pasoNum}>3</span> Pago
      </span>
    </nav>
  );
}

export default function CheckoutPage() {
  const { items, listo, subtotal, clear } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", direccion: "", ciudad: "Bogotá" });
  const [pago, setPago] = useState<Pago>("pasarela");
  const [cliente, setCliente] = useState<string | null>(null);
  const [campos, setCampos] = useState<Campos>({});
  const [enviando, setEnviando] = useState(false);

  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [dirElegida, setDirElegida] = useState("");

  function usarDireccion(d: Direccion) {
    setDirElegida(d.id);
    setForm((f) => ({
      ...f,
      nombre: d.destinatario,
      telefono: d.telefono,
      direccion: d.indicaciones ? `${d.direccion} (${d.indicaciones})` : d.direccion,
      ciudad: d.ciudad,
    }));
  }

  useEffect(() => {
    let cancelado = false;
    fetch("/api/cuenta/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cliente?: { nombre: string; email: string; telefono: string | null }; perfil?: { direcciones: Direccion[] } } | null) => {
        if (cancelado || !d?.cliente) return;
        const c = d.cliente;
        setCliente(c.nombre);
        setForm((f) => ({
          ...f,
          nombre: f.nombre || c.nombre,
          email: f.email || c.email,
          telefono: f.telefono || (c.telefono ?? ""),
        }));
        const lista = d.perfil?.direcciones ?? [];
        setDirecciones(lista);
        const principal = lista.find((x) => x.predeterminada);
        if (principal) usarDireccion(principal);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  const [codigoCupon, setCodigoCupon] = useState("");
  const [cupon, setCupon] = useState<{ codigo: string; descuento: number } | null>(null);
  const [errorCupon, setErrorCupon] = useState<string | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const itemsApi = items.map((i) => ({
    slug: i.slug,
    talla: i.size,
    manga: i.sleeve,
    personalizacion: i.custom,
    cantidad: i.qty,
  }));

  async function aplicarCupon() {
    if (!codigoCupon.trim()) return;
    setValidandoCupon(true);
    setErrorCupon(null);
    try {
      const res = await fetch("/api/tienda/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoCupon, items: itemsApi }),
      });
      const d = (await res.json()) as { codigo?: string; descuento?: number; error?: { message?: string } };
      if (!res.ok || !d.codigo) {
        setCupon(null);
        setErrorCupon(d.error?.message ?? "No se pudo validar el cupón");
        return;
      }
      setCupon({ codigo: d.codigo, descuento: d.descuento ?? 0 });
    } catch {
      setErrorCupon("No hay conexión. Intenta de nuevo.");
    } finally {
      setValidandoCupon(false);
    }
  }

  const descuentoCupon = cupon ? Math.min(cupon.descuento, subtotal) : 0;
  const total = subtotal - descuentoCupon + (items.length ? ENVIO : 0);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setCampos((c) => ({ ...c, [k]: undefined }));
  };

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (enviando || items.length === 0) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/tienda/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          medioPago: pago,
          cupon: cupon?.codigo,
          items: itemsApi,
        }),
      });
      const data = (await res.json()) as { siguiente?: string; error?: { message?: string; campos?: Campos } };
      if (!res.ok || !data.siguiente) {
        const camposErr = data.error?.campos ?? {};
        const msg = data.error?.message ?? "No se pudo crear el pedido";
        setCampos(camposErr);
        if (Object.keys(camposErr).length > 0) {
          toast({ variant: "error", titulo: "Revisa tus datos", detalle: "Completa los campos marcados" });
          const primero = Object.keys(camposErr).find((k) => k !== "items") ?? "items";
          if (primero !== "items") document.getElementById(`co-${primero}`)?.focus();
        } else {
          toast({ variant: "error", titulo: "No se pudo continuar", detalle: msg });
        }
        return;
      }
      clear();
      toast({
        variant: "ok",
        titulo: pago === "contraentrega" ? "Pedido confirmado" : "Datos listos",
        detalle: pago === "contraentrega" ? "Te llevamos al resumen" : "Siguiente: pago seguro",
      });
      router.push(data.siguiente);
    } catch {
      toast({ variant: "error", titulo: "Sin conexión", detalle: "Revisa tu red e intenta otra vez" });
    } finally {
      setEnviando(false);
    }
  }

  function campo(k: keyof typeof form, label: string, extra: InputHTMLAttributes<HTMLInputElement> = {}, ancho = false) {
    return (
      <div className={`field${ancho ? ` ${s.ancho}` : ""}`}>
        <label htmlFor={`co-${k}`}>{label}</label>
        <input id={`co-${k}`} value={form[k]} onChange={set(k)} aria-invalid={!!campos[k]} {...extra} />
        {campos[k] ? <span className="field-error">{campos[k]}</span> : null}
      </div>
    );
  }

  const ctaLabel = enviando
    ? "Creando tu pedido…"
    : pago === "contraentrega"
      ? "Confirmar pedido"
      : "Continuar al pago seguro";

  if (!listo) {
    return (
      <div className={`wrap ${s.pagina}`} aria-busy="true" aria-label="Cargando checkout">
        <header className="page-head">
          <p className="eyebrow">Pedido</p>
          <h1>Datos y pago</h1>
        </header>
        <Pasos />
        <div className={s.layout} aria-hidden="true">
          <div className={s.colForm}>
            <div className={`card ${s.skelBloque}`}>
              <span className="skel-bone" style={{ height: 14, width: "40%" }} />
              <span className="skel-bone" style={{ height: 42, width: "100%", borderRadius: 8 }} />
              <span className="skel-bone" style={{ height: 42, width: "100%", borderRadius: 8 }} />
            </div>
            <div className={`card ${s.skelBloque}`}>
              <span className="skel-bone" style={{ height: 14, width: "35%" }} />
              <span className="skel-bone" style={{ height: 56, width: "100%", borderRadius: 10 }} />
              <span className="skel-bone" style={{ height: 56, width: "100%", borderRadius: 10 }} />
            </div>
          </div>
          <aside className={`card ${s.resumen}`}>
            <div className={s.resumenCuerpo}>
              <span className="skel-bone" style={{ height: 14, width: "50%" }} />
              <span className="skel-bone" style={{ height: 12, width: "100%" }} />
              <span className="skel-bone" style={{ height: 12, width: "80%" }} />
              <span className="skel-bone" style={{ height: 44, width: "100%", borderRadius: 8, marginTop: 8 }} />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`wrap ${s.pagina}`}>
        <header className="page-head">
          <p className="eyebrow">Pedido</p>
          <h1>Checkout</h1>
        </header>
        <div className={s.vacio}>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega una camiseta para continuar con la compra.</p>
          <div className={s.vacioAcciones}>
            <Link className="btn btn-gold" href="/catalogo">
              Ir al catálogo
            </Link>
            <Link className="btn btn-outline" href="/carrito">
              Ver carrito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wrap ${s.pagina}`}>
      <header className="page-head">
        <p className="eyebrow">Compra segura</p>
        <h1>Tus datos y cómo pagar</h1>
        <p className="section-note">Revisa el resumen. El cupón y el envío se confirman en este paso.</p>
      </header>

      <Pasos />

      <form id="checkout-form" className={s.layout} onSubmit={confirmar} noValidate>
        <div className={s.colForm}>
          <div className={s.banner}>
            {cliente ? (
              <div>
                <b>Comprando como {cliente}</b>
                <span>El pedido quedará en «Mis pedidos», donde podrás seguir su estado.</span>
              </div>
            ) : (
              <>
                <div>
                  <b>¿Tienes cuenta?</b>
                  <span>No es necesario registrarte. Si ingresas, podrás ver el historial y el estado de tus pedidos.</span>
                </div>
                <Link className="btn btn-outline btn-sm" href="/ingresar?volver=/checkout">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          <fieldset className={s.bloque}>
            <legend>Datos de contacto y envío</legend>
            {direcciones.length > 0 ? (
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="co-guardada">Enviar a una dirección guardada</label>
                <select
                  id="co-guardada"
                  value={dirElegida}
                  onChange={(e) => {
                    const d = direcciones.find((x) => x.id === e.target.value);
                    if (d) usarDireccion(d);
                    else setDirElegida("");
                  }}
                >
                  {direcciones.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.alias} — {d.direccion}, {d.ciudad}
                    </option>
                  ))}
                  <option value="">Otra dirección (escribirla)</option>
                </select>
              </div>
            ) : null}
            <div className={s.grid}>
              {campo("nombre", "Nombre completo", { autoComplete: "name" })}
              {campo("telefono", "Celular / WhatsApp", { autoComplete: "tel", inputMode: "tel" })}
              {campo("email", "Correo electrónico", { type: "email", autoComplete: "email" }, true)}
              {campo("direccion", "Dirección de envío", { autoComplete: "street-address" }, true)}
              {campo("ciudad", "Ciudad", { autoComplete: "address-level2" })}
            </div>
          </fieldset>

          <fieldset className={s.bloque}>
            <legend>Método de pago</legend>
            <div className={s.medios} role="radiogroup" aria-label="Método de pago">
              {MEDIOS.map((m) => (
                <label key={m.valor} className={`${s.medio}${pago === m.valor ? ` ${s.medioSeleccionado}` : ""}`}>
                  <div className={s.medioCabeza}>
                    <input type="radio" name="pago" checked={pago === m.valor} onChange={() => setPago(m.valor)} />
                    <m.Icono size={18} aria-hidden />
                    {m.titulo}
                  </div>
                  <p>{m.texto}</p>
                </label>
              ))}
            </div>
          </fieldset>

          {campos.items ? (
            <p className="form-error" role="alert">
              {campos.items}
            </p>
          ) : null}

          <button type="submit" className={`btn btn-gold btn-block ${s.cta} ${s.ctaEscritorio}`} disabled={enviando}>
            {ctaLabel}
          </button>
          <p className={s.legal}>
            Al continuar aceptas los <Link href="/terminos">Términos y Condiciones</Link> y la política de datos. Tus
            pagos en línea se procesan con Mercado Pago.
          </p>
        </div>

        <aside className={`card ${s.resumen}`} aria-label="Resumen del pedido">
          <div className={s.resumenTop}>
            <h2>Resumen del pedido</h2>
            <span>
              {items.length} {items.length === 1 ? "producto" : "productos"} · envío a {form.ciudad || "Colombia"}
            </span>
          </div>
          <div className={s.resumenCuerpo}>
            {items.map((i) => (
              <div key={i.id} className={s.linea}>
                <span>
                  {i.qty}× {i.name} — {i.size}
                </span>
                <span className="tabular">{money(i.price * i.qty)}</span>
              </div>
            ))}
            <div className={s.fila}>
              <span>Subtotal</span>
              <span className="tabular">{money(subtotal)}</span>
            </div>
            <div className={s.fila}>
              <span>Envío</span>
              <span className="tabular">{money(ENVIO)}</span>
            </div>
            {cupon && descuentoCupon > 0 ? (
              <div className={`${s.fila} ${s.lineaDescuento}`}>
                <span>Cupón {cupon.codigo}</span>
                <span className="tabular">−{money(descuentoCupon)}</span>
              </div>
            ) : null}
            <div className={s.filaTotal}>
              <span>Total</span>
              <span className="tabular">{money(total)}</span>
            </div>

            <div className={s.cupon}>
              {cupon ? (
                <div className={s.cuponOk}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <IconoCheck size={14} /> Cupón <b>{cupon.codigo}</b> aplicado
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setCupon(null);
                      setCodigoCupon("");
                    }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="co-cupon">¿Tienes un cupón?</label>
                  <div className={s.cuponFila}>
                    <input
                      id="co-cupon"
                      placeholder="Ej. MUNDIAL10"
                      value={codigoCupon}
                      autoComplete="off"
                      onChange={(e) => {
                        setCodigoCupon(e.target.value.toUpperCase());
                        setErrorCupon(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void aplicarCupon();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-navy btn-sm"
                      disabled={validandoCupon || !codigoCupon.trim()}
                      onClick={() => void aplicarCupon()}
                    >
                      {validandoCupon ? "…" : "Aplicar"}
                    </button>
                  </div>
                  {errorCupon ? <small className={s.cuponError}>{errorCupon}</small> : null}
                </>
              )}
            </div>

            {pago === "abono" ? (
              <div className={s.abono}>
                <span>Pagas hoy (50 %)</span>
                <span className="tabular">{money(Math.round(total / 2))}</span>
              </div>
            ) : null}

            <div className={s.confianza}>
              <div className={s.confianzaItem}>
                <IconoCandado size={15} aria-hidden />
                <span>Datos cifrados · pagos con Mercado Pago</span>
              </div>
              <div className={s.confianzaItem}>
                <IconoCamion size={15} aria-hidden />
                <span>Envío a Colombia · 1–2 días hábiles en ciudades principales</span>
              </div>
              <div className={s.confianzaItem}>
                <IconoCheck size={15} aria-hidden />
                <span>Puedes seguir el pedido en «Mis pedidos» si tienes cuenta</span>
              </div>
            </div>
          </div>
        </aside>
      </form>

      <div className={s.barraMovil} aria-label="Total y continuar">
        <div>
          <small>Total</small>
          <b className="tabular">{money(total)}</b>
        </div>
        <button type="submit" form="checkout-form" className={`btn btn-gold ${s.cta}`} disabled={enviando}>
          {enviando ? "…" : pago === "contraentrega" ? "Confirmar" : "Continuar"}
        </button>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import type { Direccion } from "@/modules/identidad/domain/perfil-tipos";

const ENVIO = 18000;

type Pago = "pasarela" | "contraentrega" | "abono";
type Campos = Partial<Record<"nombre" | "telefono" | "email" | "direccion" | "ciudad" | "medioPago" | "items", string>>;

const MEDIOS: { valor: Pago; titulo: string; texto: string }[] = [
  { valor: "pasarela", titulo: "Pago en línea — tarjeta, PSE o Nequi", texto: "Pagas ahora en la pasarela segura (Wompi). Recibes confirmación inmediata." },
  { valor: "contraentrega", titulo: "Pago contra entrega", texto: "Pagas en efectivo o transferencia al recibir tu pedido (según cobertura de la mensajería)." },
  { valor: "abono", titulo: "Abono del 50 % + saldo contra entrega", texto: "Pagas la mitad ahora en línea para confirmar tu pedido y el resto al recibirlo." },
];

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", direccion: "", ciudad: "Bogotá" });
  const [pago, setPago] = useState<Pago>("pasarela");
  const [cliente, setCliente] = useState<string | null>(null);
  const [campos, setCampos] = useState<Campos>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [dirElegida, setDirElegida] = useState("");

  function usarDireccion(d: Direccion) {
    setDirElegida(d.id);
    setForm((f) => ({ ...f, nombre: d.destinatario, telefono: d.telefono, direccion: d.indicaciones ? `${d.direccion} (${d.indicaciones})` : d.direccion, ciudad: d.ciudad }));
  }

  // Con sesión de cliente se llenan sus datos y su dirección principal; el pedido queda en «Mis pedidos».
  useEffect(() => {
    fetch("/api/cuenta/yo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cliente?: { nombre: string; email: string; telefono: string | null }; perfil?: { direcciones: Direccion[] } } | null) => {
        if (!d?.cliente) return;
        const c = d.cliente;
        setCliente(c.nombre);
        setForm((f) => ({ ...f, nombre: f.nombre || c.nombre, email: f.email || c.email, telefono: f.telefono || (c.telefono ?? "") }));
        const lista = d.perfil?.direcciones ?? [];
        setDirecciones(lista);
        const principal = lista.find((x) => x.predeterminada);
        if (principal) usarDireccion(principal);
      })
      .catch(() => {});
  }, []);

  const [codigoCupon, setCodigoCupon] = useState("");
  const [cupon, setCupon] = useState<{ codigo: string; descuento: number } | null>(null);
  const [errorCupon, setErrorCupon] = useState<string | null>(null);
  const [validandoCupon, setValidandoCupon] = useState(false);
  const itemsApi = items.map((i) => ({ slug: i.slug, talla: i.size, manga: i.sleeve, personalizacion: i.custom, cantidad: i.qty }));

  /** El servidor calcula el subtotal con precios reales y dice si el cupón aplica. */
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
    setError(null);
    try {
      const res = await fetch("/api/tienda/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          medioPago: pago,
          cupon: cupon?.codigo,
          // Solo qué y cuánto: el precio lo pone el servidor desde el catálogo.
          items: itemsApi,
        }),
      });
      const data = (await res.json()) as { siguiente?: string; error?: { message?: string; campos?: Campos } };
      if (!res.ok || !data.siguiente) {
        setCampos(data.error?.campos ?? {});
        setError(data.error?.message ?? "No se pudo crear el pedido");
        return;
      }
      clear();
      router.push(data.siguiente);
    } catch {
      setError("No hay conexión con el servidor. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="wrap" style={{ padding: "60px 0", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 800, textTransform: "none" }}>Tu carrito está vacío</h2>
        <p style={{ color: "var(--ink-mute)", margin: "8px 0 18px" }}>Agrega una camiseta para continuar con la compra.</p>
        <Link className="btn btn-gold" href="/">
          Ver camisetas
        </Link>
      </div>
    );
  }

  const campo = (k: keyof typeof form, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}, ancho = false) => (
    <div className="field" style={ancho ? { gridColumn: "1/-1" } : undefined}>
      <label htmlFor={`co-${k}`}>{label}</label>
      <input
        id={`co-${k}`}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={!!campos[k]}
        style={campos[k] ? { borderColor: "var(--danger)" } : undefined}
        {...extra}
      />
      {campos[k] && <small style={{ color: "var(--danger)", fontSize: ".75rem" }}>{campos[k]}</small>}
    </div>
  );

  return (
    <div className="wrap">
      <div className="checkout-steps" style={{ marginTop: 26 }}>
        <div className="step active"><span className="num">1</span> Carrito</div>
        <div className="sep" />
        <div className="step active"><span className="num">2</span> Datos y pago</div>
        <div className="sep" />
        <div className="step"><span className="num">3</span> Confirmación</div>
      </div>
      <form className="checkout-layout" onSubmit={confirmar} noValidate>
        <div>
          <div className="guest-banner">
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

          <fieldset>
            <legend>Datos de contacto y envío</legend>
            {direcciones.length > 0 && (
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
            )}
            <div className="form-grid">
              {campo("nombre", "Nombre completo", { autoComplete: "name" })}
              {campo("telefono", "Celular / WhatsApp", { autoComplete: "tel", inputMode: "tel" })}
              {campo("email", "Correo electrónico", { type: "email", autoComplete: "email" }, true)}
              {campo("direccion", "Dirección de envío", { autoComplete: "street-address" }, true)}
              {campo("ciudad", "Ciudad", { autoComplete: "address-level2" })}
            </div>
          </fieldset>

          <fieldset>
            <legend>Método de pago</legend>
            {MEDIOS.map((m) => (
              <label key={m.valor} className={`pay-option${pago === m.valor ? " selected" : ""}`}>
                <div className="head">
                  <input type="radio" name="pago" checked={pago === m.valor} onChange={() => setPago(m.valor)} /> {m.titulo}
                </div>
                <p>{m.texto}</p>
              </label>
            ))}
          </fieldset>

          {error && (
            <p className="form-error" role="alert" style={{ marginBottom: 12 }}>
              {campos.items ?? error}
            </p>
          )}
          <button className="btn btn-gold btn-block" style={{ padding: 14 }} disabled={enviando}>
            {enviando ? "Creando pedido…" : pago === "contraentrega" ? "Confirmar pedido" : "Continuar al pago"}
          </button>
          <p className="legal-note">
            Al confirmar aceptas los <Link href="/terminos">Términos y Condiciones</Link> y la Política de tratamiento de datos.
          </p>
        </div>

        <div className="card summary-box" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".95rem", marginBottom: 10 }}>Resumen del pedido</h3>
          <div style={{ fontSize: ".83rem", color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span>
                  {i.qty}× {i.name} — {i.size}
                </span>
                <span className="tabular">{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><span className="tabular">{money(subtotal)}</span></div>
          <div className="summary-row"><span>Envío ({form.ciudad || "—"})</span><span className="tabular">{money(ENVIO)}</span></div>
          {cupon && descuentoCupon > 0 && (
            <div className="summary-row" style={{ color: "var(--ok)" }}>
              <span>Cupón {cupon.codigo}</span>
              <span className="tabular">−{money(descuentoCupon)}</span>
            </div>
          )}
          <div className="summary-row total"><span>Total</span><span className="tabular">{money(total)}</span></div>
          <div className="cupon-caja">
            {cupon ? (
              <div className="cupon-ok">
                <span>✓ Cupón <b>{cupon.codigo}</b> aplicado</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCupon(null); setCodigoCupon(""); }}>
                  Quitar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="co-cupon">¿Tienes un cupón?</label>
                <div className="cupon-fila">
                  <input
                    id="co-cupon"
                    placeholder="Ej. MUNDIAL10"
                    value={codigoCupon}
                    onChange={(e) => { setCodigoCupon(e.target.value.toUpperCase()); setErrorCupon(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicarCupon(); } }}
                  />
                  <button type="button" className="btn btn-navy btn-sm" disabled={validandoCupon || !codigoCupon.trim()} onClick={aplicarCupon}>
                    {validandoCupon ? "…" : "Aplicar"}
                  </button>
                </div>
                {errorCupon && <small className="cupon-error">{errorCupon}</small>}
              </>
            )}
          </div>
          {pago === "abono" && (
            <div className="summary-row"><span>Pagas hoy (50 %)</span><span className="tabular">{money(Math.round(total / 2))}</span></div>
          )}
        </div>
      </form>
    </div>
  );
}

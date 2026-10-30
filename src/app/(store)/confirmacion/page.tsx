"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { IconoAlerta, IconoCamion, IconoCandado, IconoCheck, IconoTarjeta } from "@/components/icons/pago";
import LoaderMarca from "@/components/store/LoaderMarca";
import s from "@/components/store/confirmacion.module.css";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { money } from "@/lib/money";
import { PASOS_PEDIDO, type Pedido } from "@/modules/pedidos/domain/types";

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{
    pedido?: string;
    k?: string;
    payment_id?: string;
    collection_id?: string;
    status?: string;
    mp?: string;
  }>;
}) {
  const sp = use(searchParams);
  const id = sp.pedido ?? "";
  const k = sp.k ?? "";
  const paymentId = sp.payment_id || sp.collection_id || "";
  const { toast } = useToast();
  const { clear } = useCart();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conCuenta, setConCuenta] = useState(false);
  const toastHecho = useRef(false);
  const carritoVaciado = useRef(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;

    async function cargar() {
      if (paymentId && paymentId !== "null") {
        try {
          await fetch(`/api/tienda/pedidos/${encodeURIComponent(id)}/pago/sincronizar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ k, paymentId }),
          });
        } catch {
          /* el GET del pedido sigue siendo la fuente visible */
        }
      }
      const r = await fetch(`/api/tienda/pedidos/${encodeURIComponent(id)}?k=${encodeURIComponent(k)}`);
      const d = (await r.json()) as { pedido?: Pedido; error?: { message?: string } };
      if (!r.ok || !d.pedido) throw new Error(d.error?.message ?? "No encontramos ese pedido");
      if (cancelado) return;
      setPedido(d.pedido);
      const tieneCuenta = d.pedido.clienteId !== null;
      setConCuenta(tieneCuenta);

      // Vaciar solo con cobro/confirmación real — no en pendiente ni cancelado.
      const pagoOk =
        d.pedido.estadoPago === "Pagado" ||
        d.pedido.estadoPago === "Abono 50%" ||
        d.pedido.estado === "Alistamiento" ||
        d.pedido.estado === "Enviado" ||
        d.pedido.estado === "Entregado";
      if (pagoOk && !carritoVaciado.current) {
        carritoVaciado.current = true;
        clear();
      }

      if (!toastHecho.current) {
        toastHecho.current = true;
        if (d.pedido.estadoPago === "Pagado") {
          toast({
            variant: "ok",
            titulo: "¡Compra confirmada!",
            detalle: `Pedido ${d.pedido.id}`,
            href: tieneCuenta ? "/cuenta?seccion=pedidos" : undefined,
            hrefLabel: "Mis pedidos",
          });
        } else if (d.pedido.estado === "Pendiente de pago") {
          toast({
            variant: "info",
            titulo: "Pedido reservado",
            detalle: "Todavía falta completar el pago",
          });
        }
      }
    }

    cargar().catch((e: Error) => {
      if (!cancelado) setError(e.message);
    });
    return () => {
      cancelado = true;
    };
  }, [id, k, paymentId, toast, clear]);

  if (!id || error) {
    return (
      <div className="wrap cart-page">
        <div className="cart-vacio">
          <h2>{error ?? "No hay un pedido para mostrar"}</h2>
          <p>Si tienes cuenta, revisa tus pedidos en «Mis pedidos». Si acabas de pagar, espera unos segundos y vuelve a intentar.</p>
          <div className="cart-vacio-acciones">
            <Link className="btn btn-gold" href="/cuenta?seccion=pedidos">
              Mis pedidos
            </Link>
            <Link className="btn btn-outline" href="/catalogo">
              Seguir comprando
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
          titulo="Confirmando tu compra"
          detalle="Estamos verificando el pago y armando el resumen de tu pedido."
        />
      </div>
    );
  }

  const pendiente = pedido.estado === "Pendiente de pago";
  const nombre = pedido.contacto.nombre.split(" ")[0];
  const fechaDe = (e: string) => pedido.historial.filter((h) => h.estado === e).at(-1)?.fecha;
  const indiceActual = PASOS_PEDIDO.indexOf(pedido.estado);

  return (
    <div className={`wrap ${s.pagina}`}>
      <header className={s.hero}>
        <div className={s.heroAura} aria-hidden="true" />
        <div className={`${s.check} ${pendiente ? s.checkWarn : ""}`} aria-hidden="true">
          {pendiente ? <IconoAlerta size={32} /> : <IconoCheck size={34} />}
        </div>
        <h1>
          {pendiente
            ? `${nombre}, tu pedido quedó pendiente de pago`
            : `¡Gracias por tu compra, ${nombre}!`}
        </h1>
        <p className={s.heroLead}>
          {pendiente
            ? "Reservamos tus camisetas, pero aún no recibimos el pago. Puedes terminarlo cuando quieras."
            : `Te escribiremos a ${pedido.contacto.email} y por WhatsApp cuando el pedido salga de Bodega.`}
        </p>
        <div className={s.pedidoChip}>
          Pedido N.° <strong>{pedido.id}</strong>
        </div>
        <div className={s.acciones}>
          {pendiente ? (
            <Link className="btn btn-gold" href={`/pago/${encodeURIComponent(pedido.id)}?k=${encodeURIComponent(k)}`}>
              Completar pago
            </Link>
          ) : (
            <>
              <Link className="btn btn-gold" href="/catalogo">
                Seguir mirando
              </Link>
              {conCuenta ? (
                <Link className="btn btn-outline" href="/cuenta?seccion=pedidos">
                  Mis pedidos
                </Link>
              ) : null}
            </>
          )}
        </div>
      </header>

      {pedido.estado !== "Cancelado" ? (
        <div className={s.timeline} aria-label="Estado del pedido">
          {PASOS_PEDIDO.map((paso, i) => {
            const f = fechaDe(paso);
            const clase =
              i < indiceActual || pedido.estado === "Entregado"
                ? s.hecho
                : i === indiceActual
                  ? s.actual
                  : "";
            return (
              <div key={paso} className={`${s.tlPaso} ${clase}`}>
                <div className={s.tlDot}>
                  {clase === s.hecho ? <IconoCheck size={14} /> : clase === s.actual ? "●" : i + 1}
                </div>
                <b>{paso === "Pendiente de pago" ? "Pedido recibido" : paso}</b>
                <span>{f ? fecha(f) : paso === "Entregado" ? "1-2 días hábiles" : "—"}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={s.grid}>
        <section className={s.seccion} aria-label="Productos del pedido">
          <h2>
            <IconoCamion size={18} aria-hidden /> Productos
          </h2>
          {pedido.items.map((it, idx) => (
            <div key={idx} className={s.linea}>
              <span>
                {it.nombre} · {it.talla} · {it.personalizacion} ×{it.cantidad}
              </span>
              <span className="tabular">{money(it.precioUnitario * it.cantidad)}</span>
            </div>
          ))}
          <div className={s.totales}>
            <div className={s.fila}>
              <span>Subtotal</span>
              <span className="tabular">{money(pedido.subtotal)}</span>
            </div>
            <div className={s.fila}>
              <span>Envío</span>
              <span className="tabular">{money(pedido.envio)}</span>
            </div>
            <div className={s.filaTotal}>
              <span>Total</span>
              <span className="tabular">{money(pedido.total)}</span>
            </div>
          </div>
        </section>

        <div className={s.colDerecha}>
          <section className={s.seccion} aria-label="Datos de envío">
            <h2>
              <IconoCamion size={18} aria-hidden /> Envío
            </h2>
            <div className={s.infoGrid}>
              <div>
                <div className={s.k}>Destinatario</div>
                <div className={s.v}>{pedido.contacto.nombre}</div>
              </div>
              <div>
                <div className={s.k}>Ciudad</div>
                <div className={s.v}>{pedido.ciudad}</div>
              </div>
              <div className={s.ancho}>
                <div className={s.k}>Dirección</div>
                <div className={s.v}>{pedido.direccion}</div>
              </div>
              <div>
                <div className={s.k}>Entrega estimada</div>
                <div className={s.v}>1-2 días hábiles</div>
              </div>
            </div>
          </section>

          <section className={s.seccion} aria-label="Datos de pago">
            <h2>
              <IconoTarjeta size={18} aria-hidden /> Pago
            </h2>
            <div className={s.infoGrid}>
              <div>
                <div className={s.k}>Método</div>
                <div className={s.v}>{pedido.medioPago}</div>
              </div>
              <div>
                <div className={s.k}>Estado</div>
                <div className={s.v}>
                  <span className={`pill ${pedido.estadoPago === "Pagado" ? "pill-ok" : "pill-warn"}`}>
                    {pedido.estadoPago === "Pagado" ? "Pagado" : pedido.estadoPago}
                  </span>
                </div>
              </div>
            </div>
            {pedido.estadoPago === "Pagado" ? (
              <p className={s.seguro}>
                <IconoCandado size={14} aria-hidden /> Cobro confirmado de forma segura
              </p>
            ) : null}
          </section>

          <div className={s.ayudaCaja}>
            {conCuenta ? (
              <>
                <p>Sigue el estado cuando quieras desde tu cuenta. Te avisamos en cada avance.</p>
                <Link className="btn btn-navy btn-sm" href="/cuenta?seccion=pedidos">
                  Ir a Mis pedidos
                </Link>
              </>
            ) : (
              <>
                <p>¿Dudas con el pedido? Escríbenos y te ayudamos con el número {pedido.id}.</p>
                <a
                  className="btn btn-navy btn-sm"
                  href={`https://wa.me/573223176175?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido ${pedido.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

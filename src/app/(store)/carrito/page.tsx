"use client";

import Link from "next/link";
import {
  IconoBasura,
  IconoCamion,
  IconoCandado,
  IconoCarrito,
  IconoCheck,
  IconoFlecha,
  IconoTarjeta,
} from "@/components/icons/pago";
import s from "@/components/store/carrito.module.css";
import { useCart } from "@/context/CartContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { money } from "@/lib/money";
import { ENVIO_COP } from "@/modules/pedidos/domain/pedido";

export default function CartPage() {
  const { items, listo, esqueletos, removeItem, updateQty, clear, subtotal, maxCantidad } = useCart();
  const { toast } = useToast();
  const { confirmar } = useConfirm();
  const vacio = listo && items.length === 0;
  const unidades = items.reduce((n, i) => n + i.qty, 0);
  const envio = items.length === 0 ? 0 : ENVIO_COP;
  const total = subtotal + envio;

  async function quitar(id: string, nombre: string) {
    const ok = await confirmar({
      titulo: "¿Eliminar este producto?",
      mensaje: `Se quitará «${nombre}» del carrito.`,
      confirmarLabel: "Eliminar",
      cancelarLabel: "Cancelar",
      peligro: true,
    });
    if (!ok) return;
    removeItem(id);
    toast({ variant: "info", titulo: "Producto quitado", detalle: nombre });
  }

  function cambiarQty(id: string, delta: number, nombre: string, qty: number) {
    if (qty + delta < 1) {
      void quitar(id, nombre);
      return;
    }
    updateQty(id, delta);
  }

  async function vaciar() {
    const ok = await confirmar({
      titulo: "¿Vaciar todo el carrito?",
      mensaje: "Se quitarán todos los productos. Esta acción no se puede deshacer.",
      confirmarLabel: "Vaciar carrito",
      cancelarLabel: "Seguir comprando",
      peligro: true,
    });
    if (!ok) return;
    clear();
    toast({ variant: "info", titulo: "Carrito vacío", detalle: "Puedes seguir explorando el catálogo" });
  }

  return (
    <div className={`wrap ${s.pagina}${vacio ? ` ${s.paginaVacia}` : ""}`}>
      <header className="page-head">
        <p className="eyebrow">Pedido</p>
        <h1>Tu carrito</h1>
        {listo && !vacio && (
          <p className="section-note">
            {unidades} {unidades === 1 ? "artículo" : "artículos"} · revisa talla y personalización antes de pagar.
          </p>
        )}
      </header>

      {listo && !vacio && (
        <nav className={s.pasos} aria-label="Progreso de compra">
          <span className={`${s.paso} ${s.pasoActivo}`}>
            <span className={s.pasoNum}>1</span> Carrito
          </span>
          <span className={s.pasoSep} aria-hidden="true" />
          <Link href="/checkout" className={s.paso}>
            <span className={s.pasoNum}>2</span> Datos
          </Link>
          <span className={s.pasoSep} aria-hidden="true" />
          <span className={s.paso}>
            <span className={s.pasoNum}>3</span> Pago
          </span>
        </nav>
      )}

      {!listo ? (
        <div className={s.layout} aria-busy="true" aria-label="Cargando carrito">
          <div>
            <ul className={s.lista}>
              {Array.from({ length: esqueletos }, (_, i) => (
                <li key={i} className={s.item} aria-hidden="true">
                  <div className={`${s.thumb} ${s.thumbSkel}`} />
                  <div className={s.info}>
                    <span className={`${s.nombre} ${s.textoSkel}`} style={{ width: "70%", maxWidth: 240 }} />
                    <div className={s.meta}>
                      <span className={`${s.chip} ${s.chipSkel}`} style={{ width: 64 }} />
                      <span className={`${s.chip} ${s.chipSkel}`} style={{ width: 88 }} />
                    </div>
                  </div>
                  <div className={s.precioBloque}>
                    <span className={`${s.precioLinea} ${s.textoSkel}`} style={{ width: 72 }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className={`card ${s.resumen}`} aria-hidden="true">
            <div className={s.resumenCuerpo}>
              <div className={s.fila}>
                <span className={s.textoSkel} style={{ width: 64, height: 12 }} />
                <span className={s.textoSkel} style={{ width: 72, height: 12 }} />
              </div>
              <div className={s.filaTotal}>
                <span className={s.textoSkel} style={{ width: 100, height: 14 }} />
                <span className={s.textoSkel} style={{ width: 80, height: 16 }} />
              </div>
              <span className={`btn btn-block ${s.ctaSkel}`} />
            </div>
          </aside>
        </div>
      ) : vacio ? (
        <div className={s.vacio}>
          <div className={s.vacioIco} aria-hidden="true">
            <IconoCarrito size={36} />
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Explora por liga o busca tu equipo. Cuando agregues una camiseta, el resumen aparece aquí listo para pagar.</p>
          <div className={s.vacioAcciones}>
            <Link className="btn btn-gold" href="/catalogo">
              Ir al catálogo
            </Link>
            <Link className="btn btn-outline" href="/catalogo/todas?ofertas=1">
              Ver ofertas
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className={s.layout}>
            <div>
              <div className={s.listaCabeza}>
                <b>
                  {items.length} {items.length === 1 ? "línea" : "líneas"} en el carrito
                </b>
                <button type="button" onClick={vaciar}>
                  Vaciar carrito
                </button>
              </div>

              <ul className={s.lista}>
                {items.map((item) => {
                  const titulo = item.name.replace(`Camiseta ${item.club} `, "");
                  return (
                    <li key={item.id} className={s.item}>
                      <Link href={`/producto/${encodeURIComponent(item.slug)}`} className={s.thumb} aria-label={`Ver ${item.name}`}>
                        {item.initials}
                      </Link>
                      <div className={s.info}>
                        <Link href={`/producto/${encodeURIComponent(item.slug)}`} className={s.nombre}>
                          {item.club} — {titulo}
                        </Link>
                        <div className={s.meta}>
                          <span className={s.chip}>Talla {item.size}</span>
                          <span className={s.chip}>Manga {item.sleeve}</span>
                          <span className={s.chip}>{item.custom}</span>
                        </div>
                        <span className={s.unitario}>{money(item.price)} c/u</span>
                        <div className={s.acciones}>
                          <div className={s.qty}>
                            <button
                              type="button"
                              onClick={() => cambiarQty(item.id, -1, item.name, item.qty)}
                              aria-label={item.qty <= 1 ? "Quitar del carrito" : "Quitar uno"}
                            >
                              −
                            </button>
                            <span aria-live="polite">{item.qty}</span>
                            <button
                              type="button"
                              className={item.qty >= maxCantidad ? s.qtyMax : undefined}
                              onClick={() => cambiarQty(item.id, 1, item.name, item.qty)}
                              disabled={item.qty >= maxCantidad}
                              aria-label={item.qty >= maxCantidad ? `Máximo ${maxCantidad} unidades` : "Agregar uno"}
                            >
                              {item.qty >= maxCantidad ? "max" : "+"}
                            </button>
                          </div>
                          <button type="button" className={s.quitar} onClick={() => quitar(item.id, item.name)}>
                            <IconoBasura size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                      <div className={s.precioBloque}>
                        <span className={s.precioLinea}>{money(item.price * item.qty)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Link className={s.seguir} href="/catalogo">
                ← Seguir comprando
              </Link>
            </div>

            <aside className={`card ${s.resumen}`} aria-label="Resumen del pedido">
              <div className={s.resumenTop}>
                <h2>Resumen del pedido</h2>
                <span>
                  {unidades} {unidades === 1 ? "artículo" : "artículos"}
                </span>
              </div>
              <div className={s.resumenCuerpo}>
                <div className={s.fila}>
                  <span>Subtotal</span>
                  <span className="tabular">{money(subtotal)}</span>
                </div>
                <div className={s.fila}>
                  <span>Envío estimado</span>
                  <span className="tabular">{money(envio)}</span>
                </div>
                <div className={s.envioHint}>
                  <IconoCamion size={16} />
                  <span>
                    Envío a Colombia · 1–2 días hábiles en ciudades principales. Cupones se aplican en el checkout.
                  </span>
                </div>
                <div className={s.filaTotal}>
                  <span>Total estimado</span>
                  <span className="tabular">{money(total)}</span>
                </div>

                <Link className={`btn btn-gold btn-block ${s.cta}`} href="/checkout">
                  Continuar al pago <IconoFlecha size={16} />
                </Link>

                <div className={s.confianza}>
                  <div className={s.confianzaItem}>
                    <IconoCandado size={15} />
                    <span>Pago seguro con Mercado Pago (tarjeta, PSE o Nequi)</span>
                  </div>
                  <div className={s.confianzaItem}>
                    <IconoTarjeta size={15} />
                    <span>También puedes pagar contra entrega o abonar el 50 %</span>
                  </div>
                  <div className={s.confianzaItem}>
                    <IconoCheck size={15} />
                    <span>Revisa talla y dorsal antes de confirmar: personalizaciones no se cambian después</span>
                  </div>
                </div>
                <p className={s.nota}>Al continuar podrás ingresar un cupón y elegir cómo pagar.</p>
              </div>
            </aside>
          </div>

          <div className={s.barraMovil} aria-label="Total y pago">
            <div>
              <small>Total estimado</small>
              <b>{money(total)}</b>
            </div>
            <Link className="btn btn-gold" href="/checkout">
              Pagar
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

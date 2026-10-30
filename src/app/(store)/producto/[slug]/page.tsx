"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EscudoImg, fondoEscudo, ImagenProducto } from "@/components/store/ProductCard";
import { useCatalogo } from "@/components/store/useCatalogo";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import Imagen, { Credito } from "@/components/store/Imagen";
import type { ProductoPublico } from "@/modules/tienda/domain/types";
import s from "@/components/store/producto.module.css";

const SIZES = ["S", "M", "L", "XL"];

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { catalogo, error } = useCatalogo();

  if (error) {
    return (
      <div className="wrap cart-page">
        <div className="aviso-carga" role="alert">
          <b>No pudimos cargar esta camiseta</b>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (!catalogo) {
    return (
      <div className={`wrap ${s.page}`} aria-busy="true" aria-label="Cargando camiseta">
        <div className={`${s.skelCrumbs} ${s.skel}`} />
        <div className={s.workspace}>
          <div className={s.media}>
            <div className={`${s.mediaStage} ${s.skel}`} />
          </div>
          <aside className={s.panel}>
            <div className={s.panelScroll}>
              <div className={`${s.skelLinea} ${s.skel}`} style={{ width: "35%" }} />
              <div className={`${s.skelTitulo} ${s.skel}`} />
              <div className={`${s.skelPrecio} ${s.skel}`} />
              <div className={`${s.skelLinea} ${s.skel}`} style={{ width: "70%" }} />
              <div className={s.skelOpts}>
                {["a", "b", "c", "d"].map((k) => (
                  <div key={k} className={`${s.skelOpt} ${s.skel}`} />
                ))}
              </div>
              <div className={`${s.skelBloque} ${s.skel}`} />
            </div>
            <div className={s.compra}>
              <div className={`${s.skelBar} ${s.skel}`} />
            </div>
          </aside>
        </div>
      </div>
    );
  }
  const product = catalogo.productos.find((p) => p.id === slug);
  if (!product) {
    return (
      <div className="wrap cart-page">
        <div className="cart-vacio">
          <h2>Esta camiseta ya no está disponible</h2>
          <p>Puede haberse agotado o retirado del catálogo.</p>
          <div className="cart-vacio-acciones">
            <Link className="btn btn-gold" href="/catalogo">
              Ver el catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <Detalle
      key={product.id}
      product={product}
      todos={catalogo.productos}
      ligaNombre={catalogo.ligas.find((l) => l.id === product.ligaId)?.nombre ?? "Catálogo"}
    />
  );
}

function Detalle({
  product,
  todos,
  ligaNombre,
}: {
  product: ProductoPublico;
  todos: ProductoPublico[];
  ligaNombre: string;
}) {
  const { addItem, maxCantidad } = useCart();
  const router = useRouter();
  const agotada = product.disponibilidad === "agotado";
  const alternativas = agotada
    ? todos
        .filter((p) => p.id !== product.id && p.disponibilidad !== "agotado")
        .sort(
          (a, b) =>
            Number(b.ligaId === product.ligaId) - Number(a.ligaId === product.ligaId) ||
            Math.abs(a.precioFinal - product.precioFinal) - Math.abs(b.precioFinal - product.precioFinal),
        )
        .slice(0, 3)
    : [];

  const [foto, setFoto] = useState(0);
  const [size, setSize] = useState("M");
  const [sleeve, setSleeve] = useState<"Corta" | "Larga">("Corta");
  const [patch, setPatch] = useState(false);
  const [addName, setAddName] = useState(false);
  const [nameText, setNameText] = useState("");
  const [numText, setNumText] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty((q) => Math.min(q, maxCantidad));
  }, [maxCantidad]);

  const nombreCorto = product.nombre.replace(/^Camiseta /, "");
  const enTope = qty >= maxCantidad;
  const ahorro = product.promocion ? product.precio - product.precioFinal : 0;
  const hastaOferta = product.promocion?.hasta
    ? new Date(product.promocion.hasta).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
    : null;

  function buildCustom() {
    const parts: string[] = [];
    if (patch) parts.push("Parche de liga");
    if (addName && nameText) parts.push(`"${nameText.toUpperCase()}" #${numText || "—"}`);
    return parts.join(" + ") || "Sin personalización";
  }

  function handleAdd() {
    addItem({
      slug: product.id,
      club: product.club,
      name: product.nombre,
      initials: product.iniciales,
      cat: product.categoria,
      size,
      sleeve,
      custom: buildCustom(),
      qty,
      price: product.precioFinal,
    });
  }

  return (
    <div className={`wrap ${s.page}`}>
      <nav className={s.crumbs} aria-label="Ruta">
        <Link href="/">Inicio</Link>
        <span className={s.crumbsSep} aria-hidden>
          /
        </span>
        <Link href="/catalogo">Catálogo</Link>
        <span className={s.crumbsSep} aria-hidden>
          /
        </span>
        <Link href={`/catalogo/${product.ligaId}`}>{ligaNombre}</Link>
        <span className={s.crumbsSep} aria-hidden>
          /
        </span>
        <span className={s.crumbsActual}>{nombreCorto}</span>
      </nav>

      <div className={s.workspace}>
        <div className={s.media}>
          <div className={s.mediaStage}>
            {product.promocion ? (
              <span className={s.mediaOferta} aria-hidden>
                −{product.promocion.porcentaje}%
              </span>
            ) : null}
            {product.imagenes.length > 0 ? (
              <div className="galeria">
                <Imagen
                  className="galeria-principal"
                  refImagen={product.imagenes[foto] ?? product.imagenes[0]}
                  alt={product.nombre}
                  sizes="(max-width: 900px) 100vw, 560px"
                  posicion={product.posicionImagen}
                  prioridad
                />
                <Credito
                  refImagen={product.imagenes[foto] ?? product.imagenes[0]}
                  className="galeria-credito"
                />
              </div>
            ) : product.escudo ? (
              <div className={`${s.crest} crest-escudo`} style={{ background: fondoEscudo(product.categoria) }}>
                <EscudoImg src={product.escudo} alt={`Escudo de ${product.club}`} />
                {addName && numText ? <span className={s.jerseyNum}>{numText}</span> : null}
              </div>
            ) : (
              <div className={s.crest} style={{ background: fondoEscudo(product.categoria) }}>
                {product.iniciales}
                {addName && numText ? <span className={s.jerseyNum}>{numText}</span> : null}
              </div>
            )}
          </div>
          {product.imagenes.length > 1 ? (
            <div className={s.thumbs}>
              {product.imagenes.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  className={`${s.thumb}${i === foto ? ` ${s.thumbActiva}` : ""}`}
                  onClick={() => setFoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-pressed={i === foto}
                >
                  <Imagen refImagen={id} alt="" sizes="64px" posicion={product.posicionImagen} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className={s.panel}>
          <div className={s.panelScroll}>
            <Link href={`/catalogo/${product.ligaId}`} className={s.club}>
              {product.club}
            </Link>
            <h1 className={s.titulo}>{product.nombre}</h1>

            {product.promocion ? (
              <div className={s.oferta}>
                <div className={s.ofertaCabeza}>
                  <span className={s.ofertaPct}>−{product.promocion.porcentaje}%</span>
                  <span className={s.ofertaNombre}>{product.promocion.etiqueta}</span>
                </div>
                <div className={s.ofertaPrecios}>
                  <span className={`${s.precioFinal} tabular`}>{money(product.precioFinal)} COP</span>
                  <span className={`${s.precioAntes} tabular`}>{money(product.precio)} COP</span>
                </div>
                <p className={s.ofertaMeta}>
                  Ahorras <b className="tabular">{money(ahorro)}</b>
                  {hastaOferta ? <> · hasta {hastaOferta}</> : null}
                </p>
              </div>
            ) : (
              <div className={s.precio}>
                <span className={`${s.precioFinal} tabular`}>{money(product.precio)} COP</span>
              </div>
            )}

            {product.descripcion ? <p className={s.descripcion}>{product.descripcion}</p> : null}

            {agotada ? (
              <div className={s.agotada}>
                <b>Agotada por ahora</b>
                <span>Te pueden gustar estas, disponibles para entrega en 1-2 días hábiles:</span>
                <div className={s.alternativas}>
                  {alternativas.map((a) => (
                    <Link key={a.id} href={`/producto/${a.id}`}>
                      <ImagenProducto p={a} className="crest-mini" />
                      <span>
                        {a.nombre.replace(/^Camiseta /, "")}
                        <small>{money(a.precioFinal)}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className={`${s.dispon}${product.disponibilidad === "pocas" ? ` ${s.disponPocas}` : ""}`}>
                {product.disponibilidad === "pocas" ? "¡Quedan pocas unidades! " : "Disponible — "}
                entrega estimada 1-2 días hábiles en Bogotá
              </p>
            )}

            <div className={s.grupo}>
              <span className={s.lbl}>Talla</span>
              <div className={s.opts} role="group" aria-label="Talla">
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`${s.opt}${size === sz ? ` ${s.optSel}` : ""}`}
                    onClick={() => setSize(sz)}
                    aria-pressed={size === sz}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.grupo}>
              <span className={s.lbl}>Tipo de manga</span>
              <div className={s.opts} role="group" aria-label="Tipo de manga">
                {(["Corta", "Larga"] as const).map((manga) => (
                  <button
                    key={manga}
                    type="button"
                    className={`${s.opt}${sleeve === manga ? ` ${s.optSel}` : ""}`}
                    onClick={() => setSleeve(manga)}
                    aria-pressed={sleeve === manga}
                  >
                    {manga}
                  </button>
                ))}
              </div>
            </div>

            {product.personalizable ? (
              <div className={s.personaliza}>
                <div className={s.personalizaCabeza}>
                  <span className={s.lbl}>Personaliza tu camiseta</span>
                </div>
                <div className={s.fila}>
                  <div className={s.filaTxt}>
                    <b>Agregar parche de liga</b>
                    <span>Ej. LaLiga, Champions League — estampado incluido en el precio</span>
                  </div>
                  <button
                    type="button"
                    className={`switch${patch ? " on" : ""}`}
                    onClick={() => setPatch((v) => !v)}
                    aria-label="Agregar parche de liga"
                    aria-pressed={patch}
                  />
                </div>
                <div className={s.fila}>
                  <div className={s.filaTxt}>
                    <b>Agregar nombre y dorsal</b>
                    <span>Estampado en la espalda, se aplica antes del envío</span>
                  </div>
                  <button
                    type="button"
                    className={`switch${addName ? " on" : ""}`}
                    onClick={() => setAddName((v) => !v)}
                    aria-label="Agregar nombre y dorsal"
                    aria-pressed={addName}
                  />
                </div>
                {addName ? (
                  <div className={s.campos}>
                    <div className="field">
                      <label htmlFor="pdp-nombre">Nombre en la camiseta</label>
                      <input
                        id="pdp-nombre"
                        placeholder="GUTIÉRREZ"
                        maxLength={14}
                        value={nameText}
                        onChange={(e) => setNameText(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="pdp-numero">Número</label>
                      <input
                        id="pdp-numero"
                        placeholder="10"
                        maxLength={2}
                        value={numText}
                        onChange={(e) => setNumText(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={s.compra}>
            <div className={s.cta}>
              <div className="qty-stepper">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
                  −
                </button>
                <span aria-live="polite">{qty}</span>
                <button
                  type="button"
                  className={enTope ? s.qtyMax : undefined}
                  onClick={() => setQty((q) => Math.min(maxCantidad, q + 1))}
                  disabled={enTope}
                  aria-label={enTope ? `Máximo ${maxCantidad} unidades` : "Más"}
                >
                  {enTope ? "max" : "+"}
                </button>
              </div>
              <button type="button" className="btn btn-outline btn-block" onClick={handleAdd} disabled={agotada}>
                Agregar al carrito
              </button>
              <button
                type="button"
                className={`btn btn-gold btn-block ${s.ctaComprar}`}
                disabled={agotada}
                onClick={() => {
                  handleAdd();
                  router.push("/checkout");
                }}
              >
                Comprar ahora
              </button>
            </div>
            <ul className={s.confianza}>
              <li>Pago 100% seguro</li>
              <li>Cambios por defecto de fábrica</li>
              <li>Envío contra entrega disponible</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

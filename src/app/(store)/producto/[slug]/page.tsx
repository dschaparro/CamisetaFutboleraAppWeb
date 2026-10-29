"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EscudoImg, fondoEscudo, ImagenProducto } from "@/components/store/ProductCard";
import LoaderMarca from "@/components/store/LoaderMarca";
import { useCatalogo } from "@/components/store/useCatalogo";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import Imagen, { Credito } from "@/components/store/Imagen";
import type { ProductoPublico } from "@/modules/tienda/domain/types";

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
      <div className="wrap">
        <LoaderMarca titulo="Cargando camiseta" detalle="Traemos fotos, tallas y precio del catálogo." />
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
  return <Detalle key={product.id} product={product} todos={catalogo.productos} ligaNombre={catalogo.ligas.find((l) => l.id === product.ligaId)?.nombre ?? "Catálogo"} />;
}

function Detalle({ product, todos, ligaNombre }: { product: ProductoPublico; todos: ProductoPublico[]; ligaNombre: string }) {
  const { addItem } = useCart();
  const router = useRouter();
  const agotada = product.disponibilidad === "agotado";
  // Si está agotada se ofrecen alternativas: primero de la misma liga, luego de precio cercano.
  const alternativas = agotada
    ? todos
        .filter((p) => p.id !== product.id && p.disponibilidad !== "agotado")
        .sort((a, b) => Number(b.ligaId === product.ligaId) - Number(a.ligaId === product.ligaId) || Math.abs(a.precioFinal - product.precioFinal) - Math.abs(b.precioFinal - product.precioFinal))
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
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Inicio</Link> &gt; <Link href="/catalogo">Catálogo</Link> &gt;{" "}
        <Link href={`/catalogo/${product.ligaId}`}>{ligaNombre}</Link> &gt; {product.nombre.replace("Camiseta ", "")}
      </div>
      <div className="product-detail">
        <div className="detail-media">
          {product.imagenes.length > 0 ? (
            <div className="galeria">
              <Imagen className="galeria-principal" refImagen={product.imagenes[foto] ?? product.imagenes[0]} alt={product.nombre} sizes="(max-width: 900px) 100vw, 560px" posicion={product.posicionImagen} prioridad />
              <Credito refImagen={product.imagenes[foto] ?? product.imagenes[0]} className="galeria-credito" />
              {product.imagenes.length > 1 && (
                <div className="galeria-miniaturas">
                  {product.imagenes.map((id, i) => (
                    <button key={id} className={i === foto ? "activa" : ""} onClick={() => setFoto(i)} aria-label={`Ver foto ${i + 1}`}>
                      <Imagen refImagen={id} alt="" sizes="64px" posicion={product.posicionImagen} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : product.escudo ? (
            <div className="crest crest-escudo" style={{ background: fondoEscudo(product.categoria) }}>
              <EscudoImg src={product.escudo} alt={`Escudo de ${product.club}`} />
              {addName && numText && <span className="jersey-num">{numText}</span>}
            </div>
          ) : (
            <div className="crest" style={{ background: fondoEscudo(product.categoria) }}>
              {product.iniciales}
              {addName && numText && <span className="jersey-num">{numText}</span>}
            </div>
          )}
        </div>
        <div className="detail-info">
          <div className="club">{product.club.toUpperCase()}</div>
          <h1>{product.nombre}</h1>
          {product.promocion ? (
            <div>
              <span className="price-antes tabular">{money(product.precio)} COP</span>
              <div className="price tabular price-oferta">
                {money(product.precioFinal)} COP <span className="pill pill-danger">−{product.promocion.porcentaje}% · {product.promocion.etiqueta}</span>
              </div>
            </div>
          ) : (
            <div className="price tabular">{money(product.precio)} COP</div>
          )}
          {product.descripcion && <p className="detalle-descripcion">{product.descripcion}</p>}
          {agotada ? (
            <div className="agotada">
              <b>Agotada por ahora</b>
              <span>Te pueden gustar estas, disponibles para entrega en 1-2 días hábiles:</span>
              <div className="agotada-alternativas">
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
            <div className="avail">
              {product.disponibilidad === "pocas" ? "¡Quedan pocas unidades! " : "Disponible — "}entrega estimada 1-2 días hábiles en Bogotá
            </div>
          )}

          <div className="option-group">
            <div className="label-row">
              <label className="lbl">Talla</label>
            </div>
            <div className="opt-row">
              {SIZES.map((s) => (
                <button key={s} className={`opt-btn${size === s ? " selected" : ""}`} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <div className="label-row"><label className="lbl">Tipo de manga</label></div>
            <div className="opt-row">
              {(["Corta", "Larga"] as const).map((s) => (
                <button key={s} className={`opt-btn${sleeve === s ? " selected" : ""}`} onClick={() => setSleeve(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {product.personalizable && (
            <div className="option-group">
              <div className="label-row"><label className="lbl">Personaliza tu camiseta</label></div>
              <div className="custom-box">
                <div className="custom-row">
                  <div className="txt">
                    <b>Agregar parche de liga</b>
                    <span>Ej. LaLiga, Champions League — estampado incluido en el precio</span>
                  </div>
                  <button className={`switch${patch ? " on" : ""}`} onClick={() => setPatch((v) => !v)} aria-label="Agregar parche de liga" />
                </div>
                <div className="custom-row">
                  <div className="txt">
                    <b>Agregar nombre y dorsal</b>
                    <span>Estampado en la espalda, se aplica antes del envío</span>
                  </div>
                  <button className={`switch${addName ? " on" : ""}`} onClick={() => setAddName((v) => !v)} aria-label="Agregar nombre y dorsal" />
                </div>
                {addName && (
                  <div className="custom-fields">
                    <div className="field">
                      <label>Nombre en la camiseta</label>
                      <input placeholder="GUTIÉRREZ" maxLength={14} value={nameText} onChange={(e) => setNameText(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Número</label>
                      <input placeholder="10" maxLength={2} value={numText} onChange={(e) => setNumText(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-cta">
            <div className="qty-stepper">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
            </div>
            <button className="btn btn-outline btn-block" onClick={handleAdd} disabled={agotada}>Agregar al carrito</button>
            <button
              className="btn btn-gold btn-block"
              disabled={agotada}
              onClick={() => {
                handleAdd();
                router.push("/checkout");
              }}
            >
              Comprar ahora
            </button>
          </div>

          <div className="trust-list">
            <div>Pago 100% seguro</div>
            <div>Cambios por defecto de fábrica</div>
            <div>Envío contra entrega disponible</div>
          </div>
        </div>
      </div>
    </div>
  );
}

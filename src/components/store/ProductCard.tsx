import Link from "next/link";
import { money } from "@/lib/money";
import Imagen, { Credito } from "@/components/store/Imagen";
import { urlImagen, type ProductoPublico } from "@/modules/tienda/domain/types";

export function fondoEscudo(categoria: string): string {
  return categoria === "colombiano" ? "linear-gradient(135deg,#2E6FE0,#13294B)" : "linear-gradient(135deg,#13294B,#0A1626)";
}

/** Escudo completo, sin recortes (los escudos no se deben cortar). */
export function EscudoImg({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- escudo de internet o subido
  return <img src={urlImagen(src)} alt={alt} loading="lazy" referrerPolicy="no-referrer" className="escudo-img" />;
}

/** Foto principal del producto (adaptada a la tarjeta) o, si no tiene, su escudo con iniciales. */
export function ImagenProducto({ p, className = "crest", sizes = "(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 300px" }: { p: ProductoPublico; className?: string; sizes?: string }) {
  if (p.imagenes[0]) {
    return <Imagen refImagen={p.imagenes[0]} alt={p.nombre} sizes={sizes} posicion={p.posicionImagen} className={className === "crest" ? "product-foto" : `${className} product-foto-mini`} />;
  }
  // Sin foto: el escudo del club sobre el color de la tarjeta.
  if (p.escudo) {
    return (
      <span className={className === "crest" ? "escudo-grande" : `${className} escudo-mini`} style={{ background: className === "crest" ? fondoEscudo(p.categoria) : "#fff" }}>
        <EscudoImg src={p.escudo} alt={`Escudo de ${p.club}`} />
      </span>
    );
  }
  return (
    <div className={className} style={{ background: fondoEscudo(p.categoria) }}>
      {p.iniciales}
    </div>
  );
}

/** Tarjeta de producto de la tienda, con descuento y estado agotado. */
export default function ProductCard({ p }: { p: ProductoPublico }) {
  const agotada = p.disponibilidad === "agotado";
  return (
    <Link href={`/producto/${p.id}`} className={`product-card${agotada ? " agotada-card" : ""}`}>
      <div className="product-media">
        {p.promocion ? (
          <span className="product-tag oferta">−{p.promocion.porcentaje}%</span>
        ) : (
          p.etiqueta && <span className={`product-tag${p.etiqueta === "Retro" ? " retro" : ""}`}>{p.etiqueta}</span>
        )}
        {agotada && <span className="product-agotado">Agotada</span>}
        <ImagenProducto p={p} />
        {p.imagenes[0] && <Credito refImagen={p.imagenes[0]} enlace={false} />}
      </div>
      <div className="product-body">
        <span className="club">{p.club}</span>
        <h3>{p.nombre.replace("Camiseta ", "")}</h3>
        <span className="meta">Talla S–XL · {p.retro ? "Manga corta" : "Manga corta/larga"}</span>
        <div className="price-row">
          <span>
            {p.promocion && <span className="price-antes tabular">{money(p.precio)}</span>}
            <span className={`price tabular${p.promocion ? " price-oferta" : ""}`}>{money(p.precioFinal)}</span>
          </span>
          {p.personalizable && <span className="custom-flag">Personalizable</span>}
        </div>
      </div>
    </Link>
  );
}

/** Esqueleto mientras carga el catálogo. */
export function TarjetasCargando({ n = 4 }: { n?: number }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Cargando camisetas">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="product-card cargando-card" />
      ))}
    </div>
  );
}

/* eslint-disable @next/next/no-img-element -- imágenes de internet o subidas; el tamaño lo elige el navegador con srcset */
import { creditoDe } from "@/data/imagenes-libres";
import { srcsetImagen, urlImagen, type Posicion, type RefImagen } from "@/modules/tienda/domain/types";

/**
 * Imagen que se adapta a su espacio: cubre el contenedor (object-fit: cover),
 * respeta el encuadre elegido en el panel y deja que el navegador baje el
 * tamaño justo (500 px en una tarjeta, 1920 px en un banner Full HD).
 */
export default function Imagen({
  refImagen,
  alt,
  sizes,
  posicion = "center",
  className,
  prioridad = false,
}: {
  refImagen: RefImagen;
  alt: string;
  /** Ancho que ocupa en pantalla, ej. "(max-width: 600px) 50vw, 25vw". */
  sizes: string;
  posicion?: Posicion;
  className?: string;
  prioridad?: boolean;
}) {
  return (
    <img
      className={className}
      src={urlImagen(refImagen)}
      srcSet={srcsetImagen(refImagen)}
      sizes={sizes}
      alt={alt}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      style={{ objectFit: "cover", objectPosition: posicion }}
    />
  );
}

/** Crédito obligatorio de las fotos con licencia CC (autor · licencia · enlace). */
export function Credito({ refImagen, className = "credito", enlace = true }: { refImagen: RefImagen | null | undefined; className?: string; enlace?: boolean }) {
  const c = refImagen ? creditoDe(refImagen) : null;
  if (!c) return null;
  // Dentro de una tarjeta que ya es enlace no se puede anidar otro <a>: va como texto.
  if (!enlace) return <span className={className}>{c.texto}</span>;
  return (
    <a className={className} href={c.pagina} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
      {c.texto}
    </a>
  );
}

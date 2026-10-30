import Image from "next/image";

/** Ruta pública del isotipo oficial (también favicon vía `app/icon.jpeg`). */
export const MARCA_ICONO = "/icono.jpeg";

type Props = {
  size?: number;
  className?: string;
  /** Vacío si el nombre de marca va al lado (accesible por el enlace padre). */
  alt?: string;
  priority?: boolean;
};

/** Isotipo Camiseta Futbolera (balón CF). */
export default function BrandMark({ size = 34, className = "mark", alt = "", priority }: Props) {
  return (
    <Image
      src={MARCA_ICONO}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority={priority}
      sizes={`${size}px`}
      style={{ width: size, height: size, objectFit: "cover", objectPosition: "center" }}
    />
  );
}

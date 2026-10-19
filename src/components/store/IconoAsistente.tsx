/**
 * Ícono del asistente con IA (robot con audífonos, balón, carrito y camiseta).
 * public/asistente-ia.png: imagen del usuario sin fondo, reducida a 256 px.
 * public/asistente-ia.svg: versión vectorial del mismo estilo SIN logos de marcas,
 * por si se prefiere evitar la camiseta con marca en la tienda publicada.
 */
export default function IconoAsistente({ size = 24, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagen local pequeña: no necesita next/image
    <img src="/asistente-ia.png" width={size} height={size} alt="" aria-hidden="true" className={className} style={{ flex: "none" }} />
  );
}

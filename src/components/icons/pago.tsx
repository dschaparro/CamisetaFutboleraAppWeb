/** Iconos SVG inline (sin librería): compatibles con Next y el tema actual. */

import type { ReactNode } from "react";

type Props = { size?: number; className?: string; title?: string };

function Svg({ size = 20, className, title, children }: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconoCandado(p: Props) {
  return (
    <Svg {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function IconoTarjeta(p: Props) {
  return (
    <Svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </Svg>
  );
}

export function IconoBanco(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 10h18" />
      <path d="M5 10v8" />
      <path d="M9 10v8" />
      <path d="M15 10v8" />
      <path d="M19 10v8" />
      <path d="M2 18h20" />
      <path d="M12 3l9 7H3l9-7z" />
    </Svg>
  );
}

export function IconoTelefono(p: Props) {
  return (
    <Svg {...p}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </Svg>
  );
}

export function IconoCheck(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </Svg>
  );
}

export function IconoAlerta(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5h.01" />
    </Svg>
  );
}

export function IconoInfo(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </Svg>
  );
}

export function IconoCerrar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Svg>
  );
}

export function IconoFlecha(p: Props) {
  return (
    <Svg {...p}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconoEstrella(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3z" />
    </Svg>
  );
}

export function IconoCamion(p: Props) {
  return (
    <Svg {...p}>
      <path d="M1 7h13v10H1z" />
      <path d="M14 10h4l3 3v4h-7V10z" />
      <circle cx="5.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </Svg>
  );
}

export function IconoBasura(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 10v6" />
      <path d="M14 10v6" />
    </Svg>
  );
}

export function IconoCarrito(p: Props) {
  return (
    <Svg {...p}>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6L5 3H2" />
      <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconoUsuario(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-1.5A4.5 4.5 0 0 1 9.5 14h5A4.5 4.5 0 0 1 19 18.5V20" />
    </Svg>
  );
}

export function IconoUbicacion(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function IconoCaja(p: Props) {
  return (
    <Svg {...p}>
      <path d="M3 8.5 12 3l9 5.5V16l-9 5-9-5V8.5z" />
      <path d="M12 13v8" />
      <path d="M3 8.5 12 13l9-4.5" />
    </Svg>
  );
}

export function IconoGrafico(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M20 20H2" />
    </Svg>
  );
}

export function IconoSalir(p: Props) {
  return (
    <Svg {...p}>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H10" />
    </Svg>
  );
}

export function IconoSol(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  );
}

export function IconoLuna(p: Props) {
  return (
    <Svg {...p}>
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 7.5 7.5 0 1 0 20 14.5z" />
    </Svg>
  );
}

export function IconoBuscar(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16.5 16.5 21 21" />
    </Svg>
  );
}

export function IconoCamara(p: Props) {
  return (
    <Svg {...p}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  );
}

export function IconoImagen(p: Props) {
  return (
    <Svg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m21 15-4.5-4.5L7 20" />
    </Svg>
  );
}

export function IconoDestello(p: Props) {
  return (
    <Svg {...p}>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="m19 15 .9 2.2L22 18l-2.1.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </Svg>
  );
}

export function IconoCamiseta(p: Props) {
  return (
    <Svg {...p}>
      <path d="M8 5 4 8v3l3-1v9h10V10l3 1V8l-4-3-2 2h-2L8 5z" />
    </Svg>
  );
}

export function IconoPedido(p: Props) {
  return (
    <Svg {...p}>
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  );
}

export function IconoDinero(p: Props) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5s2 .7 2 1.8-1 1.7-2.5 2.2-2.5.9-2.5 2.2 1 1.8 2.5 1.8 1.9-.5 2.5-1.5" />
    </Svg>
  );
}

export function IconoCopiar(p: Props) {
  return (
    <Svg {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Svg>
  );
}

export function IconoDescargar(p: Props) {
  return (
    <Svg {...p}>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 18h14" />
    </Svg>
  );
}

export function IconoEnviar(p: Props) {
  return (
    <Svg {...p}>
      <path d="m4 12 16-8-6 16-2.5-6.5L4 12z" />
    </Svg>
  );
}

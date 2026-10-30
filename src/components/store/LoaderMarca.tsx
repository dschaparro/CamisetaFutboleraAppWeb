import type { ReactNode } from "react";
import { MARCA_ICONO } from "@/components/BrandMark";
import s from "./LoaderMarca.module.css";

type Props = {
  titulo: string;
  detalle?: string;
  /** `pagina` centra en el área; `bloque` fila con texto; `inline` para botones. */
  variante?: "pagina" | "bloque" | "inline";
  className?: string;
  children?: ReactNode;
};

/** Loader de marca (anillo dorado + isotipo) para estados de carga de la tienda. */
export default function LoaderMarca({
  titulo,
  detalle,
  variante = "pagina",
  className,
  children,
}: Props) {
  const caja =
    variante === "pagina" ? s.pagina : variante === "inline" ? s.inline : s.bloque;

  return (
    <div
      className={[caja, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={titulo}
    >
      <div className={s.marca} aria-hidden="true">
        <span className={s.anillo} />
        {variante !== "inline" ? (
          // eslint-disable-next-line @next/next/no-img-element -- loader estático, sin layout shift de next/image
          <img className={s.logo} src={MARCA_ICONO} alt="" width={48} height={48} decoding="async" />
        ) : null}
      </div>
      <div className={s.texto}>
        <b>{titulo}</b>
        {detalle ? <span>{detalle}</span> : null}
      </div>
      {children}
    </div>
  );
}

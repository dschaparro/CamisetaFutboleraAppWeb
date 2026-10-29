import type { ReactNode } from "react";
import s from "./LoaderMarca.module.css";

type Props = {
  titulo: string;
  detalle?: string;
  /** `pagina` centra en el área; `bloque` fila con texto; `inline` para botones. */
  variante?: "pagina" | "bloque" | "inline";
  className?: string;
  children?: ReactNode;
};

/** Loader de marca (anillo dorado + CF) para estados de carga de la tienda. */
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
        <span className={s.logo}>CF</span>
      </div>
      <div className={s.texto}>
        <b>{titulo}</b>
        {detalle ? <span>{detalle}</span> : null}
      </div>
      {children}
    </div>
  );
}

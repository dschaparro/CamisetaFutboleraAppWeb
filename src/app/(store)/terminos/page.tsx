import Link from "next/link";
import LegalNav from "@/components/store/LegalNav";
import s from "@/components/store/legal.module.css";

export default function TerminosPage() {
  return (
    <div className={`wrap ${s.page}`}>
      <header className={s.cabeza}>
        <p className={s.eyebrow}>Ayuda</p>
        <h1 className={s.titulo}>Términos y cambios</h1>
        <p className={s.lead}>
          Reglas vigentes de Camiseta Futbolera. Si necesitas un cambio o devolución, te guiamos por WhatsApp.
        </p>
      </header>

      <div className={s.layout}>
        <LegalNav actual="/terminos" />

        <div className={s.contenido}>
          <ol className={s.secciones}>
            <li className={s.seccion}>
              <h2>Defecto de fábrica</h2>
              <div className={s.seccionBody}>
                <p>
                  Si tu camiseta llega con un defecto de fábrica, asumimos el costo de los envíos de recogida y
                  reenvío. Escríbenos por WhatsApp con fotos del defecto y coordinamos todo.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Cambio de talla</h2>
              <div className={s.seccionBody}>
                <p>
                  Si necesitas cambiar la talla, el costo de los envíos lo asume el cliente: $16.000 en Bogotá, o el
                  valor real del envío fuera de Bogotá. Coordinamos la recogida por WhatsApp.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Condiciones para aceptar el cambio</h2>
              <div className={s.seccionBody}>
                <ul>
                  <li>Sin uso ni daño</li>
                  <li>Sin lavar</li>
                  <li>Con su empaque y etiqueta originales</li>
                </ul>
              </div>
            </li>
          </ol>

          <div className={s.cta}>
            <h2>¿Necesitas un cambio o devolución?</h2>
            <p>Un asesor te guía en todo el proceso. También puedes revisar envíos y privacidad.</p>
            <div className={s.ctaAcciones}>
              <a className="btn btn-gold" href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <Link className={s.ctaSecundario} href="/envios">
                Ver envíos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

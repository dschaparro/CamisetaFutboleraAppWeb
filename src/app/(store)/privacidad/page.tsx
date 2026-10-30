import Link from "next/link";
import LegalNav from "@/components/store/LegalNav";
import s from "@/components/store/legal.module.css";

export default function PrivacidadPage() {
  return (
    <div className={`wrap ${s.page}`}>
      <header className={s.cabeza}>
        <p className={s.eyebrow}>Ayuda</p>
        <h1 className={s.titulo}>Privacidad</h1>
        <p className={s.lead}>
          Tratamos tus datos con cuidado: solo lo necesario para pedidos, envíos, soporte y mejorar la tienda.
        </p>
      </header>

      <div className={s.layout}>
        <LegalNav actual="/privacidad" />

        <div className={s.contenido}>
          <ol className={s.secciones}>
            <li className={s.seccion}>
              <h2>Qué datos usamos</h2>
              <div className={s.seccionBody}>
                <ul>
                  <li>Nombre, correo y teléfono para tu cuenta y contacto del pedido.</li>
                  <li>Dirección de entrega para despachar.</li>
                  <li>Datos de pago procesados por Mercado Pago (no guardamos el número completo de tu tarjeta).</li>
                  <li>Preferencias de personalización (nombre, dorsal, parches) para preparar tu camiseta.</li>
                </ul>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Para qué los usamos</h2>
              <div className={s.seccionBody}>
                <p>
                  Gestionar compras, envíos, cambios, soporte por WhatsApp y, si aceptas, avisos sobre pedidos u
                  ofertas. No vendemos tu información a terceros.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Seguridad</h2>
              <div className={s.seccionBody}>
                <p>
                  La sesión del panel y de la tienda usa cookies httpOnly. Los pagos van por pasarela segura (Mercado
                  Pago). Si detectas algo raro en tu cuenta, escríbenos de inmediato.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Tus derechos</h2>
              <div className={s.seccionBody}>
                <p>
                  Puedes pedir actualización o eliminación de datos de cuenta escribiendo a WhatsApp o desde{" "}
                  <Link href="/cuenta?seccion=datos">Mis datos</Link>. Guardamos lo mínimo requerido por la operación
                  del pedido.
                </p>
              </div>
            </li>
          </ol>

          <div className={s.cta}>
            <h2>¿Preguntas de privacidad?</h2>
            <p>Te respondemos con claridad. También puedes revisar términos y envíos.</p>
            <div className={s.ctaAcciones}>
              <a className="btn btn-gold" href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
                Contactar
              </a>
              <Link className={s.ctaSecundario} href="/terminos">
                Ver términos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import LegalNav from "@/components/store/LegalNav";
import s from "@/components/store/legal.module.css";

export default function EnviosPage() {
  return (
    <div className={`wrap ${s.page}`}>
      <header className={s.cabeza}>
        <p className={s.eyebrow}>Ayuda</p>
        <h1 className={s.titulo}>Envíos</h1>
        <p className={s.lead}>
          Despachamos a toda Colombia. En Bogotá llegan en 1–2 días hábiles; fuera de la ciudad depende de la
          transportadora.
        </p>
      </header>

      <div className={s.layout}>
        <LegalNav actual="/envios" />

        <div className={s.contenido}>
          <ol className={s.secciones}>
            <li className={s.seccion}>
              <h2>Tiempos de entrega</h2>
              <div className={s.seccionBody}>
                <ul>
                  <li>
                    <b>Bogotá:</b> 1–2 días hábiles después de confirmar el pago.
                  </li>
                  <li>
                    <b>Otras ciudades:</b> 2–5 días hábiles según destino.
                  </li>
                  <li>
                    <b>Personalizadas:</b> pueden sumar 1 día hábil por el estampado de nombre, dorsal y parche.
                  </li>
                </ul>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Costos</h2>
              <div className={s.seccionBody}>
                <p>
                  El valor del envío se calcula en el checkout según tu ciudad. En Bogotá suele ser más económico;
                  fuera de la capital usamos tarifas de transportadora.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Seguimiento</h2>
              <div className={s.seccionBody}>
                <p>
                  Cuando despachamos tu pedido te compartimos el estado por WhatsApp y lo puedes ver en{" "}
                  <Link href="/cuenta?seccion=pedidos">Mis pedidos</Link> si tienes cuenta.
                </p>
              </div>
            </li>

            <li className={s.seccion}>
              <h2>Contra entrega</h2>
              <div className={s.seccionBody}>
                <p>
                  En zonas habilitadas puedes pagar contra entrega. Si el pedido no se recibe, pueden aplicarse
                  costos de reenvío o cancelación según el caso.
                </p>
              </div>
            </li>
          </ol>

          <div className={s.cta}>
            <h2>¿Dudas sobre tu envío?</h2>
            <p>Escríbenos con tu número de pedido y te ayudamos al instante.</p>
            <div className={s.ctaAcciones}>
              <a className="btn btn-gold" href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
                Consultar por WhatsApp
              </a>
              <Link className={s.ctaSecundario} href="/catalogo">
                Ir al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

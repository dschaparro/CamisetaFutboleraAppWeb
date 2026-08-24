export default function TerminosPage() {
  return (
    <div className="wrap terms-layout">
      <div className="eyebrow">Términos y condiciones</div>
      <h1 style={{ fontFamily: "var(--font-body)", fontSize: "1.7rem", fontWeight: 800, margin: "10px 0 6px" }}>
        Cambios y devoluciones
      </h1>
      <p style={{ color: "var(--ink-mute)" }}>
        Estas son las reglas vigentes de Camiseta Futbolera. Si necesitas hacer un cambio o
        devolución, contáctanos directamente por WhatsApp y un asesor te guía en todo el proceso.
      </p>

      <div className="terms-block">
        <h3>Defecto de fábrica</h3>
        <p>
          Si tu camiseta llega con un defecto de fábrica, nosotros asumimos el costo de los envíos
          de recogida y reenvío. Escríbenos por WhatsApp con fotos del defecto y coordinamos todo.
        </p>
      </div>
      <div className="terms-block">
        <h3>Cambio de talla</h3>
        <p>
          Si necesitas cambiar la talla, el costo de los envíos lo asume el cliente: $16.000 en
          Bogotá, o el valor real del envío fuera de Bogotá. Coordinamos la recogida por WhatsApp.
        </p>
      </div>
      <div className="terms-block">
        <h3>Condiciones para aceptar el cambio</h3>
        <ul>
          <li>Sin uso ni daño</li>
          <li>Sin lavar</li>
          <li>Con su empaque y etiqueta originales</li>
        </ul>
      </div>

      <div className="wa-cta">
        <h3>¿Necesitas hacer un cambio o devolución?</h3>
        <p>Escríbele directo a un asesor por WhatsApp — con un clic te llevamos al chat.</p>
        <a className="btn btn-gold" href="https://wa.me/573118176454" target="_blank" rel="noopener noreferrer">
          Contactar asesor por WhatsApp
        </a>
      </div>
    </div>
  );
}

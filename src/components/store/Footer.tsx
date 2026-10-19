import Link from "next/link";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="wrap">
        <div>
          <div className="brand" style={{ color: "#fff", marginBottom: 10 }}>
            <span className="mark">CF</span> CAMISETA FUTBOLERA
          </div>
          <p>
            Cl. 55 Sur N.° 53-39, Bogotá, Colombia.
            <br />
            Venta y personalización de camisetas de fútbol desde 2024.
          </p>
        </div>
        <div>
          <h4>Ayuda</h4>
          <a href="#">Cómo comprar</a>
          <a href="#">Guía de tallas</a>
          <Link href="/terminos">Cambios y devoluciones</Link>
          <a href="#">Preguntas frecuentes</a>
        </div>
        <div>
          <h4>Legal</h4>
          <Link href="/terminos">Términos y condiciones</Link>
          <a href="#">Política de tratamiento de datos</a>
          <a href="#">Política de envíos</a>
        </div>
        <div>
          <h4>Contáctanos</h4>
          <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
            WhatsApp 322 317 6175
          </a>
          <a href="#">Instagram @camiseta.futbolera</a>
          <a href="#">TikTok @camisetafutbolera</a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2027 Camiseta Futbolera. Todos los derechos reservados. Fotos de Wikimedia Commons (CC BY / CC BY-SA, créditos en cada imagen). Los escudos son marcas de sus clubes. —{" "}
        <Link href="/panel/login" style={{ color: "#8FA1C4" }}>
          Ir al panel administrativo →
        </Link>
      </div>
    </footer>
  );
}

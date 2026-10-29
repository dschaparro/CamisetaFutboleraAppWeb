import Link from "next/link";

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="wrap">
        <div className="footer-brand">
          <div className="brand">
            <span className="mark">CF</span>
            <span className="brand-name">Camiseta Futbolera</span>
          </div>
          <p>
            Cl. 55 Sur N.° 53-39, Bogotá, Colombia.
            <br />
            Venta y personalización de camisetas de fútbol desde 2024.
          </p>
        </div>
        <div>
          <h4>Tienda</h4>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo/todas?ofertas=1">Ofertas</Link>
          <Link href="/personalizar">Personalizar</Link>
          <Link href="/cuenta">Mis pedidos</Link>
        </div>
        <div>
          <h4>Ayuda</h4>
          <Link href="/terminos">Términos y cambios</Link>
          <Link href="/terminos#envios">Envíos</Link>
          <Link href="/terminos#privacidad">Datos personales</Link>
          <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
            WhatsApp soporte
          </a>
        </div>
        <div>
          <h4>Contáctanos</h4>
          <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
            +57 322 317 6175
          </a>
          <a href="https://instagram.com/camiseta.futbolera" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://www.tiktok.com/@camisetafutbolera" target="_blank" rel="noopener noreferrer">
            TikTok
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Camiseta Futbolera. Escudos y marcas de sus clubes.</span>
        <Link href="/panel/login" className="footer-panel">
          Panel administrativo
        </Link>
      </div>
    </footer>
  );
}

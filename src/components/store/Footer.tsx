import Link from "next/link";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="store-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <span className="mark">CF</span>
            <span className="brand-name">Camiseta Futbolera</span>
          </Link>
          <p className="footer-desc">Camisetas oficiales y personalizadas. Envíos a toda Colombia.</p>
          <p className="footer-meta">
            Cl. 55 Sur N.° 53-39, Bogotá
            <br />
            <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
              +57 322 317 6175
            </a>
          </p>
        </div>

        <nav className="footer-col" aria-labelledby="footer-tienda">
          <h2 id="footer-tienda">Tienda</h2>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo/todas?ofertas=1">Ofertas</Link>
          <Link href="/personalizar">Personalizar</Link>
          <Link href="/cuenta?seccion=pedidos">Mis pedidos</Link>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-ayuda">
          <h2 id="footer-ayuda">Ayuda</h2>
          <Link href="/terminos">Términos</Link>
          <Link href="/terminos#envios">Envíos</Link>
          <Link href="/terminos#privacidad">Privacidad</Link>
          <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-social">
          <h2 id="footer-social">Seguinos</h2>
          <a href="https://instagram.com/camiseta.futbolera" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <a href="https://www.tiktok.com/@camisetafutbolera" target="_blank" rel="noopener noreferrer">
            TikTok
          </a>
          <a href="https://wa.me/573223176175" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-inner">
          <p>© {anio} Camiseta Futbolera. Marcas y escudos de sus clubes.</p>
          <div className="footer-bottom-links">
            <span>Pago seguro · Mercado Pago</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

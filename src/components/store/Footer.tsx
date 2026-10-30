import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import {
  IconoCamion,
  IconoCandado,
  IconoDocumento,
  IconoInstagram,
  IconoTelefono,
  IconoTikTok,
  IconoUbicacion,
  IconoWhatsApp,
} from "@/components/icons/pago";

const WA = "https://wa.me/573223176175";
const IG = "https://instagram.com/camiseta.futbolera";
const TT = "https://www.tiktok.com/@camisetafutbolera";

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="store-footer">
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            <BrandMark size={36} />
            <span className="brand-name">Camiseta Futbolera</span>
          </Link>
          <p className="footer-desc">Camisetas oficiales y personalizadas. Envíos a toda Colombia.</p>
          <ul className="footer-contacto">
            <li>
              <IconoUbicacion size={16} />
              <span>Cl. 55 Sur N.° 53-39, Bogotá</span>
            </li>
            <li>
              <IconoTelefono size={16} />
              <a href={WA} target="_blank" rel="noopener noreferrer">
                +57 322 317 6175
              </a>
            </li>
            <li>
              <IconoWhatsApp size={16} />
              <a href={WA} target="_blank" rel="noopener noreferrer">
                WhatsApp asesor
              </a>
            </li>
          </ul>
        </div>

        <nav className="footer-col" aria-labelledby="footer-tienda">
          <h2 id="footer-tienda">Tienda</h2>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/catalogo/todas?ofertas=1">Ofertas</Link>
          <Link href="/personalizar">Personalizar</Link>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-ayuda">
          <h2 id="footer-ayuda">Ayuda</h2>
          <Link href="/terminos" className="footer-link-ico">
            <IconoDocumento size={15} />
            Términos
          </Link>
          <Link href="/envios" className="footer-link-ico">
            <IconoCamion size={15} />
            Envíos
          </Link>
          <Link href="/privacidad" className="footer-link-ico">
            <IconoCandado size={15} />
            Privacidad
          </Link>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-social">
          <h2 id="footer-social">Seguinos</h2>
          <div className="footer-social">
            <a href={IG} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Instagram">
              <span className="footer-social-ico" aria-hidden>
                <IconoInstagram size={18} />
              </span>
              <span>Instagram</span>
            </a>
            <a href={TT} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="TikTok">
              <span className="footer-social-ico" aria-hidden>
                <IconoTikTok size={18} />
              </span>
              <span>TikTok</span>
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="WhatsApp">
              <span className="footer-social-ico" aria-hidden>
                <IconoWhatsApp size={18} />
              </span>
              <span>WhatsApp</span>
            </a>
          </div>
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="wrap footer-bottom-inner">
          <p>© {anio} Camiseta Futbolera. Marcas y escudos de sus clubes.</p>
        </div>
      </div>
    </footer>
  );
}

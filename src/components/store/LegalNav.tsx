import Link from "next/link";
import { IconoCamion, IconoCandado, IconoDocumento } from "@/components/icons/pago";
import s from "@/components/store/legal.module.css";

const LINKS = [
  { href: "/terminos", label: "Términos", Icono: IconoDocumento },
  { href: "/envios", label: "Envíos", Icono: IconoCamion },
  { href: "/privacidad", label: "Privacidad", Icono: IconoCandado },
] as const;

export default function LegalNav({ actual }: { actual: (typeof LINKS)[number]["href"] }) {
  return (
    <div className={s.aside}>
      <p className={s.asideTitulo}>Temas</p>
      <nav className={s.navLegal} aria-label="Documentos de ayuda">
        {LINKS.map(({ href, label, Icono }) => (
          <Link key={href} href={href} aria-current={href === actual ? "page" : undefined}>
            <Icono size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

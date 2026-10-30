"use client";

import Link from "next/link";
import BannerCarrusel from "@/components/store/BannerCarrusel";
import Imagen from "@/components/store/Imagen";
import ProductCard, { EscudoImg, ImagenProducto } from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import { useCatalogo } from "@/components/store/useCatalogo";
import { IconoCamion, IconoCamiseta, IconoCandado, IconoCheck } from "@/components/icons/pago";
import { money } from "@/lib/money";
import s from "@/components/store/home.module.css";

const PASOS_PERSONALIZAR = [
  { n: "01", titulo: "Nombre", detalle: "Hasta 12 caracteres en la espalda" },
  { n: "02", titulo: "Número", detalle: "Dorsal clásico o moderno" },
  { n: "03", titulo: "Parche", detalle: "Liga o selección, según el modelo" },
] as const;

const CONFIANZA = [
  {
    Icono: IconoCamion,
    titulo: "Entrega ágil",
    texto: "1–2 días hábiles en Bogotá. Envíos a toda Colombia.",
  },
  {
    Icono: IconoCamiseta,
    titulo: "Personalización",
    texto: "Parche de liga, nombre y dorsal incluidos en el precio.",
  },
  {
    Icono: IconoCandado,
    titulo: "Pago seguro",
    texto: "Tarjeta, PSE, Nequi o contra entrega.",
  },
  {
    Icono: IconoCheck,
    titulo: "Cambios fáciles",
    texto: "Si llega con defecto, asumimos el envío de devolución.",
  },
] as const;

export default function HomePage() {
  const { catalogo, error } = useCatalogo();
  const productos = catalogo?.productos ?? [];
  const ofertas = productos.filter((p) => p.promocion && p.disponibilidad !== "agotado");
  const novedades = productos.filter((p) => p.etiqueta === "Nuevo" || p.nombre.includes("2026/27")).slice(0, 3);
  const destacado = ofertas[0] ?? novedades[0] ?? productos.find((p) => p.disponibilidad !== "agotado") ?? null;
  // Si el spotlight ya mostró la única oferta, no repetir una grilla vacía.
  const ofertasExtra =
    destacado && ofertas[0]?.id === destacado.id ? ofertas.slice(1) : ofertas.filter((p) => p.id !== destacado?.id);
  const mostrarOfertas = ofertasExtra.length >= 2;

  const clubes: { club: string; escudo: string | null; iniciales: string; ligaId: string }[] = [];
  const vistos = new Set<string>();
  for (const p of productos) {
    if (vistos.has(p.club)) continue;
    vistos.add(p.club);
    clubes.push({ club: p.club, escudo: p.escudo, iniciales: p.iniciales, ligaId: p.ligaId });
    if (clubes.length >= 8) break;
  }

  return (
    <>
      {catalogo ? <BannerCarrusel banners={catalogo.banners} /> : <div className="dp-esqueleto cargando-card" aria-busy="true" />}

      <div className={`wrap ${s.home}`}>
        {error && (
          <div className="aviso-carga" role="alert">
            <b>No pudimos cargar las camisetas</b>
            <p>Revisa tu conexión e inténtalo de nuevo.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )}

        <Reveal>
          <nav className={s.atajos} aria-label="Accesos rápidos">
            <Link className={`btn btn-gold ${s.atajo}`} href="/catalogo">
              Ver catálogo
            </Link>
            <Link className={`btn btn-outline ${s.atajo}`} href="/personalizar">
              Personalizar
            </Link>
            <Link className={`btn btn-ghost ${s.atajo}`} href="/catalogo/todas?ofertas=1">
              Ofertas
            </Link>
          </nav>
        </Reveal>

        {destacado && (
          <Reveal>
            <Link
              href={`/producto/${destacado.id}`}
              className={s.spotlight}
              aria-labelledby="tit-spotlight"
            >
              <div className={s.spotlightMedia} aria-hidden="true">
                <ImagenProducto p={destacado} sizes="(max-width: 860px) 90vw, 520px" />
              </div>
              <div className={s.spotlightCopy}>
                <p className={s.spotlightEyebrow}>
                  {destacado.promocion ? "Destacada en oferta" : "Selección del momento"}
                </p>
                <h2 id="tit-spotlight">{destacado.nombre.replace("Camiseta ", "")}</h2>
                <p className={s.spotlightMeta}>
                  {destacado.club}
                  {destacado.personalizable ? " · Personalizable con nombre y dorsal" : ""}
                </p>
                <div className={s.spotlightPrecio}>
                  {destacado.promocion && <span className={s.spotlightAntes}>{money(destacado.precio)}</span>}
                  <b className="tabular">{money(destacado.precioFinal)}</b>
                </div>
                <span className={`btn btn-gold ${s.spotlightCta}`}>Ver camiseta</span>
              </div>
            </Link>
          </Reveal>
        )}

        {mostrarOfertas && (
          <Reveal>
            <section className={s.seccion} aria-labelledby="tit-ofertas">
              <div className={s.cabeza}>
                <div className={s.cabezaTexto}>
                  <p className="eyebrow">Por tiempo limitado</p>
                  <h2 id="tit-ofertas">Más ofertas</h2>
                  <p className={s.nota}>Otras camisetas con descuento activo.</p>
                </div>
                <Link className={s.linkMas} href="/catalogo/todas?ofertas=1">
                  Ver todas las ofertas
                </Link>
              </div>
              <div className={s.rail}>
                {ofertasExtra.map((p) => (
                  <div key={p.id} className={s.railItem}>
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {clubes.length > 0 && (
          <Reveal>
            <section className={s.seccion} aria-labelledby="tit-clubes">
              <div className={s.cabeza}>
                <div className={s.cabezaTexto}>
                  <p className="eyebrow">Tu equipo</p>
                  <h2 id="tit-clubes">Elige por club</h2>
                  <p className={s.nota}>Encuentra rápido la camiseta de tu afición.</p>
                </div>
                <Link className={s.linkMas} href="/catalogo">
                  Ver todos
                </Link>
              </div>
              <div className={s.clubesHome}>
                {clubes.map((c) => (
                  <Link
                    key={c.club}
                    href={`/catalogo/todas?club=${encodeURIComponent(c.club)}`}
                    className={s.clubCard}
                  >
                    <span className={s.clubEscudo}>
                      {c.escudo ? (
                        <EscudoImg src={c.escudo} alt={`Escudo de ${c.club}`} />
                      ) : (
                        <span className={s.clubIniciales}>{c.iniciales}</span>
                      )}
                    </span>
                    <b>{c.club}</b>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className={s.seccion} aria-labelledby="tit-ligas">
            <div className={s.cabeza}>
              <div className={s.cabezaTexto}>
                <p className="eyebrow">Explora</p>
                <h2 id="tit-ligas">Compra por liga</h2>
                <p className={s.nota}>Europeas, Colombia y selecciones en un solo lugar.</p>
              </div>
              <Link className={s.linkMas} href="/catalogo">
                Ver catálogo completo
              </Link>
            </div>
            <div className={s.ligas}>
              {(catalogo?.ligas ?? []).map((l) => (
                <Link
                  key={l.id}
                  href={`/catalogo/${l.id}`}
                  className={s.liga}
                  style={{ background: `linear-gradient(135deg, ${l.colores[0]}, ${l.colores[1]})` }}
                >
                  {l.imagen && (
                    <Imagen refImagen={l.imagen} alt="" sizes="480px" posicion={l.posicion} className={s.ligaFoto} />
                  )}
                  <span className={s.ligaVelo} />
                  <b>{l.nombre}</b>
                  <span>{l.pais}</span>
                  <span className={s.ligaIr}>Explorar</span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {novedades.length > 0 && (
          <Reveal>
            <section className={s.seccion} aria-labelledby="tit-novedades">
              <div className={s.cabeza}>
                <div className={s.cabezaTexto}>
                  <p className="eyebrow">Temporada</p>
                  <h2 id="tit-novedades">Novedades</h2>
                  <p className={s.nota}>Personalizables con tu nombre y dorsal.</p>
                </div>
                <Link className={s.linkMas} href="/catalogo/todas">
                  Ver novedades
                </Link>
              </div>
              <div className={s.gridNovedades}>
                {novedades.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          </Reveal>
        )}
      </div>

      <Reveal>
        <section className={s.editorial} aria-labelledby="tit-personalizar">
          <div className={`wrap ${s.editorialGrid}`}>
            <div className={s.editorialInner}>
              <p className="eyebrow">Hecha a tu medida</p>
              <h2 id="tit-personalizar">Ponle tu nombre. Tu número. Tu historia.</h2>
              <p className={s.editorialLead}>
                Elige la camiseta, el dorsal y el parche. Nosotros la preparamos lista para el próximo partido.
              </p>
              <Link className={`btn btn-gold ${s.editorialCta}`} href="/personalizar">
                Empezar a personalizar
              </Link>
            </div>

            <div className={s.editorialVisual} aria-hidden="true">
              {PASOS_PERSONALIZAR.map((paso, i) => (
                <Reveal key={paso.n} delayMs={120 + i * 90}>
                  <div className={s.paso}>
                    <span className={s.pasoNum}>{paso.n}</span>
                    <div className={s.pasoTexto}>
                      <b>{paso.titulo}</b>
                      <span>{paso.detalle}</span>
                    </div>
                    <span className={s.pasoHint}>Incluido</span>
                  </div>
                </Reveal>
              ))}
              <Reveal delayMs={400}>
                <div className={s.jerseyPreview}>
                  <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M38 18 22 30v18l14-5v72h48V43l14 5V30L82 18l-10 10H48L38 18Z"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinejoin="round"
                    />
                    <path d="M48 78h24M54 92h12" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="60" cy="58" r="10" stroke="var(--gold)" strokeWidth="2.5" />
                  </svg>
                  <div className={s.jerseyPreviewLabel}>Vista previa</div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </Reveal>

      <div className={`wrap ${s.home}`}>
        <section className={s.confianza} aria-label="Por qué comprar aquí">
          {CONFIANZA.map(({ Icono, titulo, texto }, i) => (
            <Reveal key={titulo} delayMs={i * 70}>
              <div className={s.confianzaItem}>
                <span className={s.confianzaIco} aria-hidden="true">
                  <Icono size={20} />
                </span>
                <b>{titulo}</b>
                <p>{texto}</p>
              </div>
            </Reveal>
          ))}
        </section>
      </div>
    </>
  );
}

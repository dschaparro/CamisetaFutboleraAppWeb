"use client";

import Link from "next/link";
import Imagen from "@/components/store/Imagen";
import { EscudoImg, ImagenProducto } from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import { useCatalogo } from "@/components/store/useCatalogo";
import { money } from "@/lib/money";
import s from "@/components/store/catalogo.module.css";

function EsqueletoCatalogo() {
  return (
    <div aria-busy="true" aria-label="Cargando catálogo">
      <div className={s.skelLigas}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${s.skelLiga} ${s.shimmer}`} />
        ))}
      </div>
      <div className={s.cabeza} style={{ marginTop: 36 }}>
        <div className={s.cabezaTexto}>
          <div className={`${s.shimmer} ${s.skelLineSm}`} style={{ width: 72 }} />
          <div className={`${s.shimmer} ${s.skelLineLg}`} style={{ height: 28, width: 160 }} />
        </div>
      </div>
      <div className={s.skelClubes}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={s.skelClub}>
            <div className={`${s.skelClubIco} ${s.shimmer}`} />
            <div className={`${s.skelClubLine} ${s.shimmer}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Catálogo: ligas en bento + clubes, mismo ritmo que el home. */
export default function CatalogoPage() {
  const { catalogo, error } = useCatalogo();
  const productos = catalogo?.productos ?? [];

  const ligas = (catalogo?.ligas ?? [])
    .map((l) => {
      const de = productos.filter((p) => p.ligaId === l.id);
      return {
        ...l,
        cantidad: de.length,
        desde: de.length ? Math.min(...de.map((p) => p.precioFinal)) : null,
      };
    })
    .filter((l) => l.cantidad > 0);

  const clubes = [...new Map(productos.map((p) => [p.club, p])).values()];

  return (
    <div className={`wrap ${s.page}`}>
      <header className={s.cabeza}>
        <div className={s.cabezaTexto}>
          <p className="eyebrow">Explora</p>
          <h1>Elige tu liga</h1>
          <p className={s.nota}>Camisetas de club y selección. Filtra por liga o ve directo a tu equipo.</p>
        </div>
        <Link className={s.linkMas} href="/catalogo/todas">
          Ver todas
        </Link>
      </header>

      {error && (
        <div className="aviso-carga" role="alert">
          <b>No pudimos cargar el catálogo</b>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      )}

      {!catalogo && !error && <EsqueletoCatalogo />}

      {ligas.length > 0 && (
        <Reveal>
          <div className={s.ligas}>
            {ligas.map((l) => (
              <Link
                key={l.id}
                href={`/catalogo/${l.id}`}
                className={s.liga}
                style={{ background: `linear-gradient(135deg, ${l.colores[0]}, ${l.colores[1]})` }}
              >
                {l.imagen && (
                  <Imagen
                    refImagen={l.imagen}
                    alt=""
                    sizes="(max-width: 700px) 100vw, 420px"
                    posicion={l.posicion}
                    className={s.ligaFoto}
                  />
                )}
                <span className={s.ligaVelo} />
                <p className={s.ligaPais}>{l.pais}</p>
                <b>{l.nombre}</b>
                <p>{l.descripcion}</p>
                <div className={s.ligaPie}>
                  <span>
                    {l.cantidad} camiseta{l.cantidad === 1 ? "" : "s"}
                    {l.desde !== null && <> · desde {money(l.desde)}</>}
                  </span>
                  <span className={s.ligaIr}>Explorar</span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      {clubes.length > 0 && (
        <Reveal delayMs={60}>
          <section aria-labelledby="tit-clubes-cat">
            <div className={s.cabeza}>
              <div className={s.cabezaTexto}>
                <p className="eyebrow">Tu equipo</p>
                <h2 id="tit-clubes-cat">Por club</h2>
                <p className={s.nota}>Acceso rápido a la camiseta de tu afición.</p>
              </div>
              <Link className={s.linkMas} href="/catalogo/todas?ofertas=1">
                Ver ofertas
              </Link>
            </div>
            <div className={s.clubes}>
              {clubes.map((p) => (
                <Link
                  key={p.club}
                  href={`/catalogo/todas?club=${encodeURIComponent(p.club)}`}
                  className={s.clubCard}
                >
                  <span className={s.clubEscudo}>
                    {p.escudo ? (
                      <EscudoImg src={p.escudo} alt={`Escudo de ${p.club}`} />
                    ) : (
                      <ImagenProducto p={p} className="crest-mini" />
                    )}
                  </span>
                  <b>{p.club}</b>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

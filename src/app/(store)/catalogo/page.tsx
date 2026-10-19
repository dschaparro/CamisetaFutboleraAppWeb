"use client";

import Link from "next/link";
import Imagen, { Credito } from "@/components/store/Imagen";
import { EscudoImg, ImagenProducto } from "@/components/store/ProductCard";
import { useCatalogo } from "@/components/store/useCatalogo";
import { money } from "@/lib/money";

/** Catálogo: tarjetas grandes por liga y, debajo, por club. */
export default function CatalogoPage() {
  const { catalogo, error } = useCatalogo();
  const productos = catalogo?.productos ?? [];

  const ligas = (catalogo?.ligas ?? [])
    .map((l) => {
      const de = productos.filter((p) => p.ligaId === l.id);
      return { ...l, cantidad: de.length, desde: de.length ? Math.min(...de.map((p) => p.precioFinal)) : null, clubes: [...new Set(de.map((p) => p.club))] };
    })
    .filter((l) => l.cantidad > 0);

  const clubes = [...new Map(productos.map((p) => [p.club, p])).values()];

  return (
    <div className="wrap">
      <div className="section-head" style={{ marginTop: 34 }}>
        <div>
          <div className="eyebrow">Catálogo</div>
          <h2>Elige tu liga</h2>
          <p className="section-note">Encuentra la camiseta de tu equipo por liga o por club.</p>
        </div>
        <Link className="btn btn-outline btn-sm" href="/catalogo/todas">
          Ver todas las camisetas →
        </Link>
      </div>

      {error && <div className="card" style={{ padding: 20 }}>No pudimos cargar el catálogo. Recarga la página.</div>}
      {!catalogo && !error && <div className="ligas-grid">{[1, 2, 3].map((i) => <div key={i} className="liga-card cargando-card" />)}</div>}

      <div className="ligas-grid">
        {ligas.map((l) => (
          <Link key={l.id} href={`/catalogo/${l.id}`} className="liga-card" style={{ background: `linear-gradient(140deg, ${l.colores[0]} 0%, ${l.colores[1]} 100%)` }}>
            {l.imagen && <Imagen refImagen={l.imagen} alt="" sizes="(max-width: 700px) 100vw, 420px" posicion={l.posicion} className="liga-foto" />}
            <span className="liga-velo" style={{ background: `linear-gradient(150deg, ${l.colores[0]}d9 0%, ${l.colores[1]}b3 55%, rgba(5,10,17,.85) 100%)` }} />
            <Credito refImagen={l.imagen} enlace={false} />
            <span className="liga-pais">{l.pais}</span>
            <h3>{l.nombre}</h3>
            <p>{l.descripcion}</p>
            <div className="liga-clubes">
              {l.clubes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <div className="liga-pie">
              <span>
                {l.cantidad} camiseta{l.cantidad === 1 ? "" : "s"}
                {l.desde !== null && <> · desde {money(l.desde)}</>}
              </span>
              <span className="liga-ir">Ver →</span>
            </div>
          </Link>
        ))}
      </div>

      {clubes.length > 0 && (
        <>
          <div className="section-head">
            <h2>Por club</h2>
          </div>
          <div className="clubes-grid">
            {clubes.map((p) => (
              <Link key={p.club} href={`/catalogo/todas?club=${encodeURIComponent(p.club)}`} className="club-card">
                <span className="club-escudo">
                  {p.escudo ? <EscudoImg src={p.escudo} alt={`Escudo de ${p.club}`} /> : <ImagenProducto p={p} className="crest-mini" />}
                </span>
                <b>{p.club}</b>
              </Link>
            ))}
          </div>
        </>
      )}
      <div style={{ height: 60 }} />
    </div>
  );
}

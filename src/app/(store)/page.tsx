"use client";

import Link from "next/link";
import BannerCarrusel from "@/components/store/BannerCarrusel";
import Imagen from "@/components/store/Imagen";
import ProductCard, { TarjetasCargando } from "@/components/store/ProductCard";
import { useCatalogo } from "@/components/store/useCatalogo";

/** Inicio: banners, ofertas, ligas y novedades (todo parametrizado en el panel). */
export default function HomePage() {
  const { catalogo, error } = useCatalogo();
  const productos = catalogo?.productos ?? [];
  const ofertas = productos.filter((p) => p.promocion && p.disponibilidad !== "agotado");
  const novedades = productos.filter((p) => p.etiqueta === "Nuevo" || p.nombre.includes("2027")).slice(0, 4);

  return (
    <>
      {catalogo ? <BannerCarrusel banners={catalogo.banners} /> : <div className="dp-esqueleto cargando-card" aria-busy="true" />}

      <div className="wrap">
        {error && (
          <div className="card" style={{ padding: 20, marginTop: 24 }}>
            No pudimos cargar las camisetas. Recarga la página en un momento.
          </div>
        )}

        {(!catalogo || ofertas.length > 0) && (
          <section>
            <div className="section-head">
              <div>
                <h2>🔥 Ofertas de la semana</h2>
                <p className="section-note">Descuentos por tiempo limitado. El precio con descuento se aplica en el carrito.</p>
              </div>
              <Link className="btn btn-outline btn-sm" href="/catalogo/todas?ofertas=1">
                Ver todas las ofertas →
              </Link>
            </div>
            {catalogo ? (
              <div className="product-grid">
                {ofertas.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <TarjetasCargando />
            )}
          </section>
        )}

        <section>
          <div className="section-head">
            <h2>Compra por liga</h2>
            <Link className="link-mas" href="/catalogo">
              Ver todas →
            </Link>
          </div>
          <div className="ligas-mini">
            {(catalogo?.ligas ?? []).map((l) => (
              <Link key={l.id} href={`/catalogo/${l.id}`} className="liga-mini" style={{ background: `linear-gradient(135deg, ${l.colores[0]}, ${l.colores[1]})` }}>
                {l.imagen && <Imagen refImagen={l.imagen} alt="" sizes="200px" posicion={l.posicion} className="liga-foto" />}
                <span className="liga-velo" style={{ background: `linear-gradient(160deg, ${l.colores[0]}cc, ${l.colores[1]}e6)` }} />
                <b>{l.nombre}</b>
                <span>{l.pais}</span>
              </Link>
            ))}
          </div>
        </section>

        {novedades.length > 0 && (
          <section>
            <div className="section-head">
              <div>
                <h2>Novedades</h2>
                <p className="section-note">Las camisetas de la nueva temporada, personalizables con tu nombre y dorsal.</p>
              </div>
            </div>
            <div className="product-grid">
              {novedades.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        <section className="confianza">
          <div className="card">
            <span aria-hidden="true">🚚</span>
            <b>Entrega en 1-2 días hábiles</b>
            <p>En Bogotá. Envíos a toda Colombia.</p>
          </div>
          <div className="card">
            <span aria-hidden="true">🎽</span>
            <b>Personalización incluida</b>
            <p>Parche de liga, nombre y dorsal en el precio.</p>
          </div>
          <div className="card">
            <span aria-hidden="true">🔒</span>
            <b>Pago 100 % seguro</b>
            <p>Tarjeta, PSE, Nequi o contra entrega.</p>
          </div>
          <div className="card">
            <span aria-hidden="true">🔄</span>
            <b>Cambios fáciles</b>
            <p>Si llega con defecto, asumimos el envío.</p>
          </div>
        </section>
      </div>
    </>
  );
}

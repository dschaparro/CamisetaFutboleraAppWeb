"use client";

import Link from "next/link";
import BannerCarrusel from "@/components/store/BannerCarrusel";
import Imagen from "@/components/store/Imagen";
import ProductCard, { TarjetasCargando } from "@/components/store/ProductCard";
import { useCatalogo } from "@/components/store/useCatalogo";
import { IconoCamion, IconoCamiseta, IconoCandado, IconoCheck } from "@/components/icons/pago";

export default function HomePage() {
  const { catalogo, error } = useCatalogo();
  const productos = catalogo?.productos ?? [];
  const ofertas = productos.filter((p) => p.promocion && p.disponibilidad !== "agotado");
  const novedades = productos.filter((p) => p.etiqueta === "Nuevo" || p.nombre.includes("2026/27")).slice(0, 4);

  return (
    <>
      {catalogo ? <BannerCarrusel banners={catalogo.banners} /> : <div className="dp-esqueleto cargando-card" aria-busy="true" />}

      <div className="wrap store-home">
        {error && (
          <div className="aviso-carga" role="alert">
            <b>No pudimos cargar las camisetas</b>
            <p>Revisa tu conexión e inténtalo de nuevo.</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )}

        {(!catalogo || ofertas.length > 0) && (
          <section className="home-section" aria-labelledby="tit-ofertas">
            <div className="section-head">
              <div>
                <p className="eyebrow">Por tiempo limitado</p>
                <h2 id="tit-ofertas">Ofertas de la semana</h2>
                <p className="section-note">El precio con descuento se aplica al carrito. Cupos sujetos a stock.</p>
              </div>
              <Link className="btn btn-outline btn-sm" href="/catalogo/todas?ofertas=1">
                Ver ofertas
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

        <section className="home-section" aria-labelledby="tit-ligas">
          <div className="section-head">
            <div>
              <p className="eyebrow">Explora</p>
              <h2 id="tit-ligas">Compra por liga</h2>
            </div>
            <Link className="link-mas" href="/catalogo">
              Ver todas
            </Link>
          </div>
          <div className="ligas-mini">
            {(catalogo?.ligas ?? []).map((l) => (
              <Link
                key={l.id}
                href={`/catalogo/${l.id}`}
                className="liga-mini"
                style={{ background: `linear-gradient(135deg, ${l.colores[0]}, ${l.colores[1]})` }}
              >
                {l.imagen && <Imagen refImagen={l.imagen} alt="" sizes="200px" posicion={l.posicion} className="liga-foto" />}
                <span className="liga-velo" style={{ background: `linear-gradient(160deg, ${l.colores[0]}cc, ${l.colores[1]}e6)` }} />
                <b>{l.nombre}</b>
                <span>{l.pais}</span>
              </Link>
            ))}
          </div>
        </section>

        {novedades.length > 0 && (
          <section className="home-section" aria-labelledby="tit-novedades">
            <div className="section-head">
              <div>
                <p className="eyebrow">Temporada</p>
                <h2 id="tit-novedades">Novedades</h2>
                <p className="section-note">Personalizables con tu nombre y dorsal.</p>
              </div>
            </div>
            <div className="product-grid">
              {novedades.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}

        <section className="confianza" aria-label="Por qué comprar aquí">
          <div className="card confianza-card">
            <span className="confianza-ico" aria-hidden="true">
              <IconoCamion size={22} />
            </span>
            <b>Entrega ágil</b>
            <p>1–2 días hábiles en Bogotá. Envíos a toda Colombia.</p>
          </div>
          <div className="card confianza-card">
            <span className="confianza-ico" aria-hidden="true">
              <IconoCamiseta size={22} />
            </span>
            <b>Personalización</b>
            <p>Parche de liga, nombre y dorsal incluidos en el precio.</p>
          </div>
          <div className="card confianza-card">
            <span className="confianza-ico" aria-hidden="true">
              <IconoCandado size={22} />
            </span>
            <b>Pago seguro</b>
            <p>Tarjeta, PSE, Nequi o contra entrega.</p>
          </div>
          <div className="card confianza-card">
            <span className="confianza-ico" aria-hidden="true">
              <IconoCheck size={22} />
            </span>
            <b>Cambios fáciles</b>
            <p>Si llega con defecto, asumimos el envío de devolución.</p>
          </div>
        </section>
      </div>
    </>
  );
}

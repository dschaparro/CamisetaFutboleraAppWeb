"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import ProductCard, { TarjetasCargando } from "@/components/store/ProductCard";
import { useCatalogo } from "@/components/store/useCatalogo";
import { IconoBuscar } from "@/components/icons/pago";

type Orden = "relevancia" | "menor" | "mayor";

const soloOfertasInicial = (v?: string) => v === "1";

/** Listado de una liga (o «todas») con búsqueda, filtros y orden. */
export default function LigaPage({
  params,
  searchParams,
}: {
  params: Promise<{ liga: string }>;
  searchParams: Promise<{ club?: string; ofertas?: string; q?: string }>;
}) {
  const { liga } = use(params);
  const { club: clubInicial, ofertas, q: busquedaInicial } = use(searchParams);
  const { catalogo, error } = useCatalogo();
  const info = catalogo?.ligas.find((l) => l.id === liga);
  // Mientras carga no se sabe el nombre de la liga: no mostrar «Todas» por error.
  const titulo = info?.nombre ?? (liga !== "todas" && !catalogo ? "Cargando…" : soloOfertasInicial(ofertas) ? "Ofertas" : "Todas las camisetas");

  const [query, setQuery] = useState(clubInicial ?? busquedaInicial ?? "");
  const [soloOfertas, setSoloOfertas] = useState(ofertas === "1");
  const [personalizable, setPersonalizable] = useState(false);
  const [orden, setOrden] = useState<Orden>("relevancia");

  const lista = useMemo(() => {
    const base = (catalogo?.productos ?? []).filter((p) => liga === "todas" || p.ligaId === liga);
    const q = query.trim().toLowerCase();
    const filtrados = base.filter(
      (p) =>
        (!q || p.nombre.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)) &&
        (!soloOfertas || p.promocion) &&
        (!personalizable || p.personalizable),
    );
    // Disponibles primero; agotadas al final.
    const orden0 = [...filtrados].sort((a, b) => Number(a.disponibilidad === "agotado") - Number(b.disponibilidad === "agotado"));
    if (orden === "relevancia") return orden0;
    return orden0.sort((a, b) => (orden === "menor" ? 1 : -1) * (a.precioFinal - b.precioFinal));
  }, [catalogo, liga, query, soloOfertas, personalizable, orden]);

  if (error) {
    return (
      <div className="wrap cart-page">
        <div className="aviso-carga" role="alert">
          <b>No pudimos cargar el catálogo</b>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    );
  }

  if (catalogo && liga !== "todas" && !info) {
    return (
      <div className="wrap cart-page">
        <div className="cart-vacio">
          <h2>No encontramos esa liga</h2>
          <p>Puede que el enlace haya cambiado. Explora el catálogo completo.</p>
          <div className="cart-vacio-acciones">
            <Link className="btn btn-gold" href="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section
        className="liga-hero"
        style={{ background: info ? `linear-gradient(140deg, ${info.colores[0]}, ${info.colores[1]})` : "linear-gradient(140deg,#13294B,#0A1626)" }}
      >
        <div className="wrap">
          <div className="crumbs" style={{ color: "rgba(255,255,255,.8)" }}>
            <Link href="/">Inicio</Link> &gt; <Link href="/catalogo">Catálogo</Link> &gt; {titulo}
          </div>
          <h1>{titulo}</h1>
          <p>{info ? `${info.pais} · ${info.descripcion}` : liga === "todas" ? "Clubes europeos, fútbol colombiano y selecciones." : " "}</p>
        </div>
      </section>

      <div className="wrap">
        <div className="filters-bar" style={{ marginTop: 22 }}>
          <div className="search">
            <IconoBuscar size={16} />
            <input placeholder="Buscar por club o camiseta…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
          </div>
          <button className={`chip${soloOfertas ? " active" : ""}`} onClick={() => setSoloOfertas((v) => !v)}>
            En oferta
          </button>
          <button className={`chip${personalizable ? " active" : ""}`} onClick={() => setPersonalizable((v) => !v)}>
            Personalizable
          </button>
          <select className="chip" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar">
            <option value="relevancia">Más relevantes</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
          </select>
        </div>

        {!catalogo ? (
          <TarjetasCargando />
        ) : lista.length === 0 ? (
          <div className="cart-vacio" style={{ marginTop: 28 }}>
            <h2>Sin resultados</h2>
            <p>No hay camisetas con esos filtros. Prueba otra búsqueda o quita los filtros.</p>
            <div className="cart-vacio-acciones">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setQuery(""); setSoloOfertas(false); setPersonalizable(false); }}>
                Quitar filtros
              </button>
              <Link className="btn btn-gold btn-sm" href="/catalogo">
                Ver ligas
              </Link>
            </div>
          </div>
        ) : (
          <div className="product-grid">
            {lista.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        <div className="otras-ligas">
          <span>Otras ligas:</span>
          {(catalogo?.ligas ?? []).filter((l) => l.id !== liga).map((l) => (
            <Link key={l.id} className="chip" href={`/catalogo/${l.id}`}>
              {l.nombre}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import ProductCard from "@/components/store/ProductCard";
import Reveal from "@/components/store/Reveal";
import { useCatalogo } from "@/components/store/useCatalogo";
import { IconoBuscar } from "@/components/icons/pago";
import s from "@/components/store/catalogo.module.css";

type Orden = "relevancia" | "menor" | "mayor";

const soloOfertasInicial = (v?: string) => v === "1";

function EsqueletoProductos({ n = 6 }: { n?: number }) {
  return (
    <div className={s.grid} aria-busy="true" aria-label="Cargando camisetas">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={s.skelCard}>
          <div className={`${s.skelMedia} ${s.shimmer}`} />
          <div className={`${s.skelLineSm} ${s.shimmer}`} />
          <div className={`${s.skelLineLg} ${s.shimmer}`} />
          <div className={`${s.skelLine} ${s.shimmer}`} style={{ width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

/** Listado de una liga (o «todas» / ofertas) con filtros. */
export default function LigaPage({
  params,
  searchParams,
}: {
  params: Promise<{ liga: string }>;
  searchParams: Promise<{ club?: string; ofertas?: string; q?: string }>;
}) {
  const { liga } = use(params);
  const { club: clubInicial, ofertas, q: busquedaInicial } = use(searchParams);
  const pathname = usePathname();
  const router = useRouter();
  const { catalogo, error } = useCatalogo();
  const info = catalogo?.ligas.find((l) => l.id === liga);

  const [query, setQuery] = useState(clubInicial ?? busquedaInicial ?? "");
  const [soloOfertas, setSoloOfertas] = useState(soloOfertasInicial(ofertas));
  const [personalizable, setPersonalizable] = useState(false);
  const [orden, setOrden] = useState<Orden>("relevancia");

  const titulo =
    info?.nombre ?? (liga !== "todas" && !catalogo ? "Cargando…" : soloOfertas ? "Ofertas" : "Todas las camisetas");

  const lead = info
    ? `${info.pais} · ${info.descripcion}`
    : soloOfertas
      ? "Descuentos activos en clubes europeos, Colombia y selecciones."
      : "Clubes europeos, fútbol colombiano y selecciones.";

  function sincronizarOfertasUrl(activo: boolean) {
    const params = new URLSearchParams();
    if (clubInicial) params.set("club", clubInicial);
    if (busquedaInicial) params.set("q", busquedaInicial);
    if (activo) params.set("ofertas", "1");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const lista = useMemo(() => {
    const base = (catalogo?.productos ?? []).filter((p) => liga === "todas" || p.ligaId === liga);
    const q = query.trim().toLowerCase();
    const filtrados = base.filter(
      (p) =>
        (!q || p.nombre.toLowerCase().includes(q) || p.club.toLowerCase().includes(q)) &&
        (!soloOfertas || p.promocion) &&
        (!personalizable || p.personalizable),
    );
    const orden0 = [...filtrados].sort(
      (a, b) => Number(a.disponibilidad === "agotado") - Number(b.disponibilidad === "agotado"),
    );
    if (orden === "relevancia") return orden0;
    return orden0.sort((a, b) => (orden === "menor" ? 1 : -1) * (a.precioFinal - b.precioFinal));
  }, [catalogo, liga, query, soloOfertas, personalizable, orden]);

  if (error) {
    return (
      <div className={`wrap ${s.page}`}>
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
      <div className={`wrap ${s.page}`}>
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

  const cargando = !catalogo;
  const eyebrow = soloOfertas && !info ? "Por tiempo limitado" : info ? info.pais : "Catálogo";

  return (
    <div className={`wrap ${s.page}`}>
      <header className={s.cabeza} aria-labelledby="tit-listado">
        <div className={s.cabezaTexto}>
          {info && (
            <span
              className={s.acentoLiga}
              style={{ background: `linear-gradient(90deg, ${info.colores[0]}, ${info.colores[1]})` }}
              aria-hidden="true"
            />
          )}
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="tit-listado">{cargando ? "Cargando…" : titulo}</h1>
          <p className={s.nota}>{lead}</p>
          {!cargando && (
            <p className={s.metaResultados}>
              {lista.length} resultado{lista.length === 1 ? "" : "s"}
              {personalizable ? " · personalizables" : ""}
            </p>
          )}
        </div>
        {!soloOfertas && (
          <Link className={s.linkMas} href="/catalogo/todas?ofertas=1">
            Ver ofertas
          </Link>
        )}
        {soloOfertas && (
          <Link className={s.linkMas} href="/catalogo">
            Ver ligas
          </Link>
        )}
      </header>

      <div className={`${s.filtros} ${s.filtrosSticky}`}>
          <div className={s.buscar}>
            <IconoBuscar size={16} />
            <input
              placeholder="Buscar por club o camiseta…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar"
            />
          </div>
          <button
            type="button"
            className={`chip${soloOfertas ? " active" : ""}`}
            onClick={() => {
              setSoloOfertas((v) => {
                const next = !v;
                sincronizarOfertasUrl(next);
                return next;
              });
            }}
          >
            En oferta
          </button>
          <button
            type="button"
            className={`chip${personalizable ? " active" : ""}`}
            onClick={() => setPersonalizable((v) => !v)}
          >
            Personalizable
          </button>
          <select
            className="chip"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar"
          >
            <option value="relevancia">Más relevantes</option>
            <option value="menor">Menor precio</option>
            <option value="mayor">Mayor precio</option>
          </select>
        </div>

        {cargando ? (
          <EsqueletoProductos n={soloOfertas ? 3 : 6} />
        ) : lista.length === 0 ? (
          <div className="cart-vacio" style={{ marginTop: 12 }}>
            <h2>Sin resultados</h2>
            <p>No hay camisetas con esos filtros. Prueba otra búsqueda o quita los filtros.</p>
            <div className="cart-vacio-acciones">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setQuery("");
                  setSoloOfertas(false);
                  setPersonalizable(false);
                  sincronizarOfertasUrl(false);
                }}
              >
                Quitar filtros
              </button>
              <Link className="btn btn-gold btn-sm" href="/catalogo">
                Ver ligas
              </Link>
            </div>
          </div>
        ) : (
          <Reveal>
            <div className={s.grid}>
              {lista.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </Reveal>
        )}

      {!cargando && (
        <nav className={s.otras} aria-label="Otras ligas">
          <span className={s.otrasLabel}>Otras ligas</span>
          {(catalogo?.ligas ?? [])
            .filter((l) => l.id !== liga)
            .map((l) => (
              <Link key={l.id} className="chip" href={`/catalogo/${l.id}`}>
                {l.nombre}
              </Link>
            ))}
          {liga !== "todas" && (
            <Link className="chip" href="/catalogo/todas">
              Todas
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

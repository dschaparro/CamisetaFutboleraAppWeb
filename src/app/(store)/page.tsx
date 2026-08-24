"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PRODUCTS, crestGradient } from "@/data/products";
import { money } from "@/lib/money";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "europeo", label: "Clubes europeos" },
  { key: "colombiano", label: "Fútbol colombiano" },
  { key: "seleccion", label: "Selecciones" },
  { key: "retro", label: "Retro" },
  { key: "personalizable", label: "Personalizable" },
] as const;

export default function HomePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchFilter =
        filter === "all" ||
        p.cat === filter ||
        (filter === "retro" && p.retro) ||
        (filter === "personalizable" && p.personalizable);
      const matchQuery = !q || p.name.toLowerCase().includes(q) || p.club.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [filter, query]);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">Temporada 2027 · Nueva colección</div>
            <h1>
              Tu pasión
              <br />
              se viste aquí
            </h1>
            <p className="lead">
              Camisetas de clubes europeos, selecciones y equipos colombianos, con tu nombre y tu
              dorsal. Personalización de parche de liga y estampado incluida.
            </p>
            <div className="hero-actions">
              <a
                className="btn btn-gold"
                href="#catalogo"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ver catálogo
              </a>
              <Link className="btn btn-outline" style={{ borderColor: "#3A4C6E", color: "#fff" }} href={`/producto/${PRODUCTS[0].id}`}>
                Cómo personalizar
              </Link>
            </div>
            <div className="hero-badges">
              <div><b>+50</b> pedidos al mes</div>
              <div><b>1-2 días</b> entrega en Bogotá</div>
              <div><b>100%</b> compra bajo pedido, sin sobre-stock</div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="jersey-badge">CF</div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div id="catalogo" className="section-head">
          <div>
            <h2>Camisetas destacadas</h2>
            <p className="section-note">
              El stock disponible se confirma al momento de tu pedido — todas nuestras camisetas se
              consiguen bajo pedido con proveedor.
            </p>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search">
            🔎 <input placeholder="Buscar por club, selección o jugador..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip${filter === f.key ? " active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filtered.map((p) => (
            <Link key={p.id} href={`/producto/${p.id}`} className="product-card">
              <div className="product-media">
                {p.tag && <span className={`product-tag${p.tag === "Retro" ? " retro" : ""}`}>{p.tag}</span>}
                <div className="crest" style={{ background: crestGradient(p.cat) }}>{p.initials}</div>
              </div>
              <div className="product-body">
                <span className="club">{p.club}</span>
                <h3>{p.name.replace("Camiseta ", "")}</h3>
                <span className="meta">Talla S–XL · {p.retro ? "Manga corta" : "Manga corta/larga"}</span>
                <div className="price-row">
                  <span className="price tabular">{money(p.price)}</span>
                  {p.personalizable && <span className="custom-flag">Personalizable</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="wrap" style={{ marginTop: 56 }}>
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Cambios y garantía</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <b>Si llega con defecto, se cambia</b>
            <p style={{ color: "var(--ink-mute)", fontSize: ".82rem", marginTop: 6 }}>
              Nosotros asumimos el envío de recogida y reenvío.
            </p>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <b>Pago 100% seguro</b>
            <p style={{ color: "var(--ink-mute)", fontSize: ".82rem", marginTop: 6 }}>
              Pasarela Wompi: tarjeta, PSE o contra entrega.
            </p>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <b>Personalización incluida</b>
            <p style={{ color: "var(--ink-mute)", fontSize: ".82rem", marginTop: 6 }}>
              Parche de liga y estampado de dorsal en el precio.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

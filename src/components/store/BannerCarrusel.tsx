"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Imagen, { Credito } from "@/components/store/Imagen";
import type { Banner } from "@/modules/tienda/domain/types";

const INTERVALO_MS = 7000;

/**
 * Hero full-bleed cinematográfico: banners del admin a todo el ancho,
 * tipografía grande, avance automático (pausa con cursor/teclado/tacto).
 */
export default function BannerCarrusel({ banners }: { banners: Banner[] }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const toque = useRef<number | null>(null);

  useEffect(() => {
    if (pausado || banners.length < 2) return;
    const t = setInterval(() => setActual((i) => (i + 1) % banners.length), INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, banners.length]);

  if (banners.length === 0) return null;
  const n = banners.length;
  const visible = actual % n;
  const ir = (i: number) => setActual(((i % n) + n) % n);

  return (
    <section
      className={`dp-carrusel${pausado ? " pausado" : ""}`}
      aria-roledescription="carrusel"
      aria-label="Promociones destacadas"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") ir(visible + 1);
        if (e.key === "ArrowLeft") ir(visible - 1);
      }}
      onTouchStart={(e) => {
        toque.current = e.touches[0].clientX;
        setPausado(true);
      }}
      onTouchEnd={(e) => {
        const inicio = toque.current;
        toque.current = null;
        setPausado(false);
        if (inicio === null) return;
        const dx = e.changedTouches[0].clientX - inicio;
        if (Math.abs(dx) > 40) ir(visible + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="dp-viewport">
        {banners.map((b, i) => {
          const activo = i === visible;
          return (
            <div
              key={b.id}
              className={`dp-slide${activo ? " activo" : ""}`}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${n}: ${b.titulo}`}
              aria-hidden={!activo}
              style={{ background: `linear-gradient(135deg, ${b.colores[0]}, ${b.colores[1]})` }}
            >
              {b.imagen && (
                <Imagen
                  refImagen={b.imagen}
                  alt=""
                  sizes="100vw"
                  posicion={b.posicion}
                  className="dp-foto"
                  prioridad={i === 0}
                />
              )}
              <div
                className={`dp-velo ${b.alineacion === "centro" ? "centro" : ""}`}
                style={{ ["--dp-oscuro" as string]: String(Math.max(b.oscurecer / 100, 0.35)) }}
              />
              <div className={`dp-contenido ${b.alineacion === "centro" ? "centro" : ""}`}>
                <p className="dp-marca">Camiseta Futbolera</p>
                {b.antetitulo && (
                  <div className="dp-antetitulo" style={{ color: b.acento }}>
                    {b.antetitulo}
                  </div>
                )}
                <h2 className="dp-titulo">{b.titulo}</h2>
                {b.texto && <p className="dp-texto">{b.texto}</p>}
                <Link
                  className="dp-boton"
                  href={b.enlace}
                  tabIndex={activo ? 0 : -1}
                  style={{ background: b.acento }}
                >
                  {b.boton}
                </Link>
              </div>
              {!b.imagen && b.insignia && (
                <div className="dp-insignia" aria-hidden="true" style={{ borderColor: b.acento }}>
                  {b.insignia}
                </div>
              )}
              <Credito refImagen={b.imagen} className="credito dp-credito" />
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <>
          <button type="button" className="dp-flecha izq" onClick={() => ir(visible - 1)} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="dp-flecha der" onClick={() => ir(visible + 1)} aria-label="Siguiente">
            ›
          </button>
          <div className="dp-puntos">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={i === visible ? "activo" : ""}
                onClick={() => ir(i)}
                aria-label={`Ir a ${b.titulo}`}
                aria-current={i === visible ? true : undefined}
              >
                {i === visible && !pausado && (
                  <span className="dp-progreso" style={{ animationDuration: `${INTERVALO_MS}ms` }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

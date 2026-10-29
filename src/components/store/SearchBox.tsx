"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconoBuscar } from "@/components/icons/pago";
import { money } from "@/lib/money";
import { cargarCatalogo } from "@/components/store/useCatalogo";
import { urlImagen, type ProductoPublico } from "@/modules/tienda/domain/types";

/** Buscador del encabezado: sugiere camisetas mientras se escribe (flechas + Enter) o abre el catálogo filtrado. */
export default function SearchBox({ inputRef }: { inputRef?: React.RefObject<HTMLInputElement | null> }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [productos, setProductos] = useState<ProductoPublico[]>([]);
  const caja = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let vivo = true;
    cargarCatalogo().then(
      (c) => vivo && setProductos(c.productos),
      () => {},
    );
    return () => {
      vivo = false;
    };
  }, []);

  // Se cierra al hacer clic fuera.
  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const resultados = useMemo(() => {
    const t = texto.trim().toLowerCase();
    if (t.length < 2) return [];
    return productos.filter((p) => p.nombre.toLowerCase().includes(t) || p.club.toLowerCase().includes(t)).slice(0, 6);
  }, [texto, productos]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    setAbierto(false);
    if (activo >= 0 && resultados[activo]) router.push(`/producto/${resultados[activo].id}`);
    else if (t) router.push(`/catalogo/todas?q=${encodeURIComponent(t)}`);
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "Escape") setAbierto(false);
    else if (e.key === "ArrowDown" && resultados.length) {
      e.preventDefault();
      setAbierto(true);
      setActivo((a) => (a + 1) % resultados.length);
    } else if (e.key === "ArrowUp" && resultados.length) {
      e.preventDefault();
      setActivo((a) => (a <= 0 ? resultados.length - 1 : a - 1));
    }
  }

  const mostrar = abierto && texto.trim().length >= 2;
  return (
    <form className="store-search" role="search" onSubmit={enviar} ref={caja}>
      <span className="store-search-ic" aria-hidden="true">
        <IconoBuscar size={16} />
      </span>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-autocomplete="list"
        value={texto}
        placeholder="Busca tu equipo o camiseta…"
        aria-label="Buscar camisetas"
        aria-expanded={mostrar}
        aria-controls="sugerencias-busqueda"
        autoComplete="off"
        onChange={(e) => {
          setTexto(e.target.value);
          setActivo(-1);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={teclas}
      />
      {mostrar && (
        <ul className="store-search-lista" id="sugerencias-busqueda" role="listbox">
          {resultados.length === 0 && <li className="store-search-vacio">Sin resultados para «{texto.trim()}»</li>}
          {resultados.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === activo}>
              <Link href={`/producto/${p.id}`} className={i === activo ? "activo" : ""} onClick={() => setAbierto(false)} onMouseEnter={() => setActivo(i)}>
                {(p.imagenes[0] || p.escudo) && (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura de internet o subida
                  <img src={urlImagen((p.imagenes[0] ?? p.escudo) as string)} alt="" referrerPolicy="no-referrer" />
                )}
                <span>
                  <b>{p.nombre.replace("Camiseta ", "")}</b>
                  <small>{p.club}</small>
                </span>
                <em>{money(p.precioFinal)}</em>
              </Link>
            </li>
          ))}
          {resultados.length > 0 && (
            <li>
              <Link href={`/catalogo/todas?q=${encodeURIComponent(texto.trim())}`} className="store-search-todos" onClick={() => setAbierto(false)}>
                Ver todos los resultados →
              </Link>
            </li>
          )}
        </ul>
      )}
    </form>
  );
}

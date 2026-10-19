"use client";

import { useEffect, useState } from "react";
import type { CatalogoPublico } from "@/modules/tienda/domain/types";

// Una sola petición compartida por las piezas de la misma página (se renueva a los 15 s).
let enCurso: { promesa: Promise<CatalogoPublico>; en: number } | null = null;

export function cargarCatalogo(): Promise<CatalogoPublico> {
  if (!enCurso || Date.now() - enCurso.en > 15_000) {
    const promesa = fetch("/api/tienda/catalogo").then(async (r) => {
      if (!r.ok) throw new Error("No se pudo cargar el catálogo");
      return (await r.json()) as CatalogoPublico;
    });
    promesa.catch(() => {
      enCurso = null;
    });
    enCurso = { promesa, en: Date.now() };
  }
  return enCurso.promesa;
}

/** Catálogo de la tienda tal como lo parametriza el panel (productos, ligas, banners). */
export function useCatalogo(): { catalogo: CatalogoPublico | null; error: boolean } {
  const [catalogo, setCatalogo] = useState<CatalogoPublico | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let vivo = true;
    cargarCatalogo().then(
      (c) => vivo && setCatalogo(c),
      () => vivo && setError(true),
    );
    return () => {
      vivo = false;
    };
  }, []);
  return { catalogo, error };
}

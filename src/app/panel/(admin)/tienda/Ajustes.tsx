"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AjustesTienda } from "@/modules/tienda/domain/types";
import {
  CARRITO_MAX_CANTIDAD_DEFAULT,
  CARRITO_MAX_CANTIDAD_MAX,
  CARRITO_MAX_CANTIDAD_MIN,
  CARRITO_MAX_PRODUCTOS_DEFAULT,
  CARRITO_MAX_PRODUCTOS_MAX,
  CARRITO_MAX_PRODUCTOS_MIN,
} from "@/modules/tienda/domain/types";
import { Campo } from "./comun";
import s from "./tienda.module.css";

type Props = {
  mensaje: (ok: boolean, texto: string) => void;
};

export default function Ajustes({ mensaje }: Props) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [maxProductos, setMaxProductos] = useState(String(CARRITO_MAX_PRODUCTOS_DEFAULT));
  const [maxCantidad, setMaxCantidad] = useState(String(CARRITO_MAX_CANTIDAD_DEFAULT));
  const [errores, setErrores] = useState<{ carritoMaxProductos?: string; carritoMaxCantidad?: string }>({});

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const r = await fetch("/api/admin/tienda/ajustes");
        const d = (await r.json()) as AjustesTienda & { error?: { message?: string } };
        if (!r.ok) throw new Error(d.error?.message ?? "No se pudieron cargar los ajustes");
        if (!cancelado) {
          setMaxProductos(String(d.carritoMaxProductos ?? CARRITO_MAX_PRODUCTOS_DEFAULT));
          setMaxCantidad(String(d.carritoMaxCantidad ?? CARRITO_MAX_CANTIDAD_DEFAULT));
        }
      } catch (e) {
        if (!cancelado) mensaje(false, e instanceof Error ? e.message : "No se pudieron cargar los ajustes");
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [mensaje]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrores({});
    setGuardando(true);
    try {
      const r = await fetch("/api/admin/tienda/ajustes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carritoMaxProductos: Number(maxProductos),
          carritoMaxCantidad: Number(maxCantidad),
        }),
      });
      const d = (await r.json()) as AjustesTienda & {
        error?: { message?: string; campos?: Record<string, string> };
      };
      if (!r.ok) {
        setErrores({
          carritoMaxProductos: d.error?.campos?.carritoMaxProductos,
          carritoMaxCantidad: d.error?.campos?.carritoMaxCantidad,
        });
        mensaje(false, d.error?.message ?? "No se pudo guardar");
        return;
      }
      setMaxProductos(String(d.carritoMaxProductos));
      setMaxCantidad(String(d.carritoMaxCantidad));
      mensaje(true, "Ajustes guardados.");
    } catch {
      mensaje(false, "No hay conexión con el servidor");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <div className={s.vacio}>Cargando ajustes…</div>;

  return (
    <>
      <div className={s.barra}>
        <p className={s.hint} style={{ flex: 1 }}>
          Parámetros de la experiencia de compra: cuántos productos distintos caben en el carrito y cuántas unidades de
          cada uno.
        </p>
      </div>
      <form className={`card ${s.tablaWrap}`} style={{ padding: 20, maxWidth: 480 }} onSubmit={onSubmit}>
        <h2 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Carrito</h2>
        <p className={s.hint} style={{ marginBottom: 16 }}>
          Si el cliente ya alcanzó el máximo de productos, puede subir la cantidad de uno que ya tiene, pero no agregar
          una línea nueva.
        </p>
        <Campo
          label="Máximo de productos en el carrito"
          error={errores.carritoMaxProductos}
          hint={`Entre ${CARRITO_MAX_PRODUCTOS_MIN} y ${CARRITO_MAX_PRODUCTOS_MAX}. Por defecto ${CARRITO_MAX_PRODUCTOS_DEFAULT}.`}
        >
          <input
            type="number"
            min={CARRITO_MAX_PRODUCTOS_MIN}
            max={CARRITO_MAX_PRODUCTOS_MAX}
            step={1}
            value={maxProductos}
            onChange={(e) => setMaxProductos(e.target.value)}
            required
          />
        </Campo>
        <Campo
          label="Máximo de unidades por producto"
          error={errores.carritoMaxCantidad}
          hint={`Entre ${CARRITO_MAX_CANTIDAD_MIN} y ${CARRITO_MAX_CANTIDAD_MAX}. Por defecto ${CARRITO_MAX_CANTIDAD_DEFAULT}.`}
        >
          <input
            type="number"
            min={CARRITO_MAX_CANTIDAD_MIN}
            max={CARRITO_MAX_CANTIDAD_MAX}
            step={1}
            value={maxCantidad}
            onChange={(e) => setMaxCantidad(e.target.value)}
            required
          />
        </Campo>
        <div style={{ marginTop: 16 }}>
          <button type="submit" className="btn btn-gold" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar ajustes"}
          </button>
        </div>
      </form>
    </>
  );
}

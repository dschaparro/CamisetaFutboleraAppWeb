"use client";

import { useCallback, useEffect, useState } from "react";
import type { Banner, Cupon, Liga, Producto, Promocion } from "@/modules/tienda/domain/types";
import Ajustes from "./Ajustes";
import Banners from "./Banners";
import Cupones from "./Cupones";
import Ligas from "./Ligas";
import Ofertas from "./Ofertas";
import Productos from "./Productos";
import s from "./tienda.module.css";

type Datos = { productos: Producto[]; ligas: Liga[]; promociones: Promocion[]; cupones: Cupon[]; banners: Banner[] };

const PESTANAS = [
  { id: "productos", label: "Productos" },
  { id: "ligas", label: "Ligas" },
  { id: "ofertas", label: "Ofertas" },
  { id: "cupones", label: "Cupones" },
  { id: "banners", label: "Banners" },
  { id: "ajustes", label: "Ajustes" },
] as const;
type Pestana = (typeof PESTANAS)[number]["id"];

async function obtener(): Promise<Datos> {
  const r = await fetch("/api/admin/tienda");
  const d = (await r.json()) as Datos & { error?: { message?: string } };
  if (!r.ok) throw new Error(d.error?.message ?? "No se pudo cargar la tienda");
  return d;
}

/** Parametrización de la tienda online: productos, ligas, ofertas, cupones y banners. */
export default function TiendaPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("productos");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const recargar = useCallback(() => {
    obtener().then(setDatos, (e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    recargar();
  }, [recargar]);

  const mensaje = useCallback((ok: boolean, texto: string) => {
    setAviso({ ok, texto });
    setTimeout(() => setAviso((a) => (a?.texto === texto ? null : a)), 5000);
  }, []);

  const conteo: Record<Exclude<Pestana, "ajustes">, number> = {
    productos: datos?.productos.length ?? 0,
    ligas: datos?.ligas.length ?? 0,
    ofertas: datos?.promociones.length ?? 0,
    cupones: datos?.cupones.length ?? 0,
    banners: datos?.banners.length ?? 0,
  };

  return (
    <>
      <div className="admin-topbar">
        <div>
          <h1>Tienda online</h1>
          <p>Productos, fotos, precios, ligas, ofertas, cupones, banners y ajustes. Los cambios se ven al instante en la tienda.</p>
        </div>
        <a className="btn btn-outline btn-sm" href="/" target="_blank" rel="noopener">
          Ver tienda ↗
        </a>
      </div>

      {aviso && (
        <div className={aviso.ok ? s.aviso : s.avisoMal} role={aviso.ok ? "status" : "alert"}>
          {aviso.texto}
        </div>
      )}
      {error && <div className={s.avisoMal}>{error}</div>}

      <div className={s.tabs} role="tablist">
        {PESTANAS.map((p) => (
          <button key={p.id} role="tab" aria-selected={pestana === p.id} className={pestana === p.id ? s.tabActiva : ""} onClick={() => setPestana(p.id)}>
            {p.label}
            {p.id !== "ajustes" ? <span>{conteo[p.id]}</span> : null}
          </button>
        ))}
      </div>

      {pestana === "ajustes" ? (
        <Ajustes mensaje={mensaje} />
      ) : !datos ? (
        !error && <div className={s.vacio}>Cargando…</div>
      ) : (
        <>
          {pestana === "productos" && <Productos productos={datos.productos} ligas={datos.ligas} promociones={datos.promociones} recargar={recargar} mensaje={mensaje} />}
          {pestana === "ligas" && <Ligas ligas={datos.ligas} productos={datos.productos} recargar={recargar} mensaje={mensaje} />}
          {pestana === "ofertas" && <Ofertas promociones={datos.promociones} productos={datos.productos} ligas={datos.ligas} recargar={recargar} mensaje={mensaje} />}
          {pestana === "cupones" && <Cupones cupones={datos.cupones} recargar={recargar} mensaje={mensaje} />}
          {pestana === "banners" && <Banners banners={datos.banners} recargar={recargar} mensaje={mensaje} />}
        </>
      )}
    </>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import s from "@/components/store/cuenta.module.css";
import SeccionDatos from "@/components/store/cuenta/SeccionDatos";
import SeccionDirecciones from "@/components/store/cuenta/SeccionDirecciones";
import SeccionPagos from "@/components/store/cuenta/SeccionPagos";
import SeccionPedidos from "@/components/store/cuenta/SeccionPedidos";
import SeccionSeguridad from "@/components/store/cuenta/SeccionSeguridad";
import LoaderMarca from "@/components/store/LoaderMarca";
import {
  IconoCandado,
  IconoPedido,
  IconoSalir,
  IconoTarjeta,
  IconoUbicacion,
  IconoUsuario,
} from "@/components/icons/pago";
import type { PerfilCliente } from "@/modules/identidad/domain/perfil-tipos";
import type { Pedido } from "@/modules/pedidos/domain/types";

type Cliente = { nombre: string; email: string; telefono: string | null };
type Datos = { cliente: Cliente; pedidos: Pedido[]; perfil: PerfilCliente };

const SECCIONES: readonly { id: string; label: string; icono: ReactNode }[] = [
  { id: "pedidos", label: "Mis pedidos", icono: <IconoPedido size={18} /> },
  { id: "datos", label: "Mis datos", icono: <IconoUsuario size={18} /> },
  { id: "direcciones", label: "Direcciones", icono: <IconoUbicacion size={18} /> },
  { id: "pagos", label: "Formas de pago", icono: <IconoTarjeta size={18} /> },
  { id: "seguridad", label: "Contraseña", icono: <IconoCandado size={18} /> },
];
export type SeccionCuenta = "pedidos" | "datos" | "direcciones" | "pagos" | "seguridad";

function parseSeccion(raw: string | null | undefined): SeccionCuenta | null {
  if (!raw) return null;
  return SECCIONES.some((x) => x.id === raw) ? (raw as SeccionCuenta) : null;
}

function CuentaCargando() {
  return (
    <div className="wrap">
      <div className={s.cargando}>
        <LoaderMarca
          variante="bloque"
          titulo="Cargando tu cuenta"
          detalle="Pedidos, datos y direcciones en un momento…"
          className={s.cargandoEstado}
        />

        <div className={s.cabecera} aria-hidden="true">
          <div style={{ display: "grid", gap: 8, width: "100%", maxWidth: 280 }}>
            <span className={`skel-bone ${s.skelLinea}`} style={{ width: 72, height: 10 }} />
            <span className={`skel-bone ${s.skelLinea}`} style={{ width: "85%", height: 22 }} />
            <span className={`skel-bone ${s.skelLinea}`} style={{ width: "55%", height: 12 }} />
          </div>
        </div>

        <div className={s.grid} aria-hidden="true">
          <nav className={`card ${s.skelMenu}`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`skel-bone ${s.skelMenuItem}`} />
            ))}
          </nav>
          <section className={`card ${s.skelPanel}`}>
            <span className={`skel-bone ${s.skelLinea}`} style={{ width: "40%" }} />
            <span className={`skel-bone ${s.skelBloque}`} />
            <span className={`skel-bone ${s.skelBloque}`} />
            <span className={`skel-bone ${s.skelLinea}`} style={{ width: "70%" }} />
          </section>
        </div>
      </div>
    </div>
  );
}

/** Query `?seccion=` (preferido) o hash legacy `#pagos`. */
function seccionDesdeUrl(searchParams: URLSearchParams): SeccionCuenta {
  return (
    parseSeccion(searchParams.get("seccion")) ??
    parseSeccion(typeof window !== "undefined" ? window.location.hash.slice(1) : null) ??
    "pedidos"
  );
}

function CuentaVista() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const seccion = seccionDesdeUrl(searchParams);

  useEffect(() => {
    // Migra bookmarks con hash (#pagos) a ?seccion= para que el menú del header funcione.
    if (!searchParams.get("seccion") && typeof window !== "undefined" && window.location.hash.slice(1) === seccion) {
      router.replace(`/cuenta?seccion=${seccion}`, { scroll: false });
    }
  }, [searchParams, router, seccion]);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/cuenta/yo")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/ingresar?volver=/cuenta");
          return;
        }
        const d = (await r.json()) as Datos & { error?: { message?: string } };
        if (!r.ok) throw new Error(d.error?.message);
        if (!cancelado) setDatos(d);
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message || "No pudimos cargar tu cuenta.");
      });
    return () => {
      cancelado = true;
    };
  }, [router]);

  function ir(id: SeccionCuenta) {
    router.replace(`/cuenta?seccion=${id}`, { scroll: false });
  }

  async function salir() {
    await fetch("/api/cuenta/salir", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (error) {
    return (
      <div className="wrap">
        <div className={`card ${s.vacio}`} style={{ margin: "40px 0" }}>
          <b>{error}</b>
          <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!datos) return <CuentaCargando />;

  const { cliente, pedidos, perfil } = datos;
  const setPerfil = (p: PerfilCliente) => setDatos((d) => (d ? { ...d, perfil: p } : d));
  const pendientes = pedidos.filter((p) => p.estado === "Pendiente de pago").length;

  return (
    <div className="wrap">
      <div className={s.cuenta}>
        <div className={s.cabecera}>
          <div>
            <div className="eyebrow">Mi cuenta</div>
            <h1 className={s.titulo}>Hola, {cliente.nombre.split(" ")[0]}</h1>
            <p className={s.meta}>{cliente.email}</p>
          </div>
        </div>

        <div className={s.grid}>
          <nav className={`card ${s.menu}`} aria-label="Secciones de mi cuenta">
            {SECCIONES.map((x) => (
              <button
                key={x.id}
                type="button"
                className={seccion === x.id ? s.menuActivo : ""}
                aria-current={seccion === x.id ? "page" : undefined}
                onClick={() => ir(x.id as SeccionCuenta)}
              >
                <span className={s.menuIcono} aria-hidden="true">
                  {x.icono}
                </span>
                {x.label}
                {x.id === "pedidos" && pendientes > 0 && <span className={s.contador}>{pendientes}</span>}
              </button>
            ))}
            <button type="button" className={s.menuSalir} onClick={salir}>
              <span className={s.menuIcono} aria-hidden="true">
                <IconoSalir size={18} />
              </span>
              Cerrar sesión
            </button>
          </nav>

          <section>
            {seccion === "pedidos" && (
              <>
                <h2 className={s.seccionTitulo}>Mis pedidos</h2>
                <SeccionPedidos pedidos={pedidos} />
              </>
            )}
            {seccion === "datos" && (
              <SeccionDatos cliente={cliente} onCambio={(c) => setDatos((d) => (d ? { ...d, cliente: c } : d))} />
            )}
            {seccion === "direcciones" && (
              <SeccionDirecciones
                direcciones={perfil.direcciones}
                nombreCliente={cliente.nombre}
                telefonoCliente={cliente.telefono}
                onPerfil={setPerfil}
              />
            )}
            {seccion === "pagos" && (
              <SeccionPagos tarjetas={perfil.tarjetas} nombreCliente={cliente.nombre} onPerfil={setPerfil} />
            )}
            {seccion === "seguridad" && <SeccionSeguridad />}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <Suspense fallback={<CuentaCargando />}>
      <CuentaVista />
    </Suspense>
  );
}

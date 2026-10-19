"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import s from "@/components/store/cuenta.module.css";
import SeccionDatos from "@/components/store/cuenta/SeccionDatos";
import SeccionDirecciones from "@/components/store/cuenta/SeccionDirecciones";
import SeccionPagos from "@/components/store/cuenta/SeccionPagos";
import SeccionPedidos from "@/components/store/cuenta/SeccionPedidos";
import SeccionSeguridad from "@/components/store/cuenta/SeccionSeguridad";
import type { PerfilCliente } from "@/modules/identidad/domain/perfil-tipos";
import type { Pedido } from "@/modules/pedidos/domain/types";

type Cliente = { nombre: string; email: string; telefono: string | null };
type Datos = { cliente: Cliente; pedidos: Pedido[]; perfil: PerfilCliente };

const SECCIONES = [
  { id: "pedidos", label: "Mis pedidos", icono: "🧾" },
  { id: "datos", label: "Mis datos", icono: "👤" },
  { id: "direcciones", label: "Direcciones", icono: "📍" },
  { id: "pagos", label: "Formas de pago", icono: "💳" },
  { id: "seguridad", label: "Contraseña", icono: "🔒" },
] as const;
type Seccion = (typeof SECCIONES)[number]["id"];

function seccionDeHash(): Seccion {
  const h = window.location.hash.slice(1);
  return SECCIONES.some((x) => x.id === h) ? (h as Seccion) : "pedidos";
}

export default function CuentaPage() {
  const router = useRouter();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seccion, setSeccion] = useState<Seccion>("pedidos");

  useEffect(() => {
    fetch("/api/cuenta/yo")
      .then(async (r) => {
        if (r.status === 401) {
          router.replace("/ingresar?volver=/cuenta");
          return;
        }
        const d = (await r.json()) as Datos & { error?: { message?: string } };
        if (!r.ok) throw new Error(d.error?.message);
        setDatos(d);
        // Permite enlazar directo a una sección: /cuenta#pagos
        setSeccion(seccionDeHash());
      })
      .catch((e: Error) => setError(e.message || "No pudimos cargar tu cuenta."));
  }, [router]);

  // Los enlaces del menú del encabezado (/cuenta#datos, …) cambian de sección sin recargar.
  useEffect(() => {
    const alCambiar = () => setSeccion(seccionDeHash());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);

  function ir(id: Seccion) {
    setSeccion(id);
    window.history.replaceState(null, "", `#${id}`);
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

  if (!datos) {
    return (
      <div className="wrap">
        <div className={s.vacio} style={{ margin: "40px 0" }}>
          <span className="spinner" style={{ display: "inline-block" }} /> Cargando tu cuenta…
        </div>
      </div>
    );
  }

  const { cliente, pedidos, perfil } = datos;
  const setPerfil = (p: PerfilCliente) => setDatos((d) => (d ? { ...d, perfil: p } : d));
  const pendientes = pedidos.filter((p) => p.estado === "Pendiente de pago").length;

  return (
    <div className="wrap">
      <div className={s.cuenta}>
        <div className={s.cabecera}>
          <div>
            <div className="eyebrow">Mi cuenta</div>
            <h1 className={s.titulo}>Hola, {cliente.nombre.split(" ")[0]} 👋</h1>
            <p className={s.meta}>{cliente.email}</p>
          </div>
        </div>

        <div className={s.grid}>
          <nav className={`card ${s.menu}`} aria-label="Secciones de mi cuenta">
            {SECCIONES.map((x) => (
              <button key={x.id} className={seccion === x.id ? s.menuActivo : ""} aria-current={seccion === x.id ? "page" : undefined} onClick={() => ir(x.id)}>
                <span aria-hidden="true">{x.icono}</span> {x.label}
                {x.id === "pedidos" && pendientes > 0 && <span className={s.contador}>{pendientes}</span>}
              </button>
            ))}
            <button className={s.menuSalir} onClick={salir}>
              <span aria-hidden="true">↩</span> Cerrar sesión
            </button>
          </nav>

          <section>
            {seccion === "pedidos" && (
              <>
                <h2 className={s.seccionTitulo}>Mis pedidos</h2>
                <SeccionPedidos pedidos={pedidos} />
              </>
            )}
            {seccion === "datos" && <SeccionDatos cliente={cliente} onCambio={(c) => setDatos((d) => (d ? { ...d, cliente: c } : d))} />}
            {seccion === "direcciones" && (
              <SeccionDirecciones direcciones={perfil.direcciones} nombreCliente={cliente.nombre} telefonoCliente={cliente.telefono} onPerfil={setPerfil} />
            )}
            {seccion === "pagos" && <SeccionPagos tarjetas={perfil.tarjetas} nombreCliente={cliente.nombre} onPerfil={setPerfil} />}
            {seccion === "seguridad" && <SeccionSeguridad />}
          </section>
        </div>
      </div>
    </div>
  );
}

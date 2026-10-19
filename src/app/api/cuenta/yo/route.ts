import { NextResponse } from "next/server";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { errorJson, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Datos del cliente con sesión y su historial de pedidos. 401 si no hay sesión de cliente. */
export async function GET(request: Request) {
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Inicia sesión para ver tu cuenta");

  try {
    const cliente = await clientesRepo().findById(sesion.sub);
    if (!cliente || !cliente.activo) return errorJson(401, "UNAUTHENTICATED", "Inicia sesión para ver tu cuenta");
    const [pedidos, perfil] = await Promise.all([pedidosRepo().listarPorCliente(cliente.id), clientesRepo().perfil(cliente.id)]);
    return NextResponse.json({
      cliente: { nombre: cliente.nombre, email: cliente.email, telefono: cliente.telefono },
      pedidos,
      perfil,
    });
  } catch (err) {
    console.error("[cuenta]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos cargar tu cuenta en este momento.");
  }
}

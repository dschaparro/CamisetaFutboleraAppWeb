import { NextResponse } from "next/server";
import { obtenerMiCuenta, SesionClienteInvalidaError } from "@/modules/identidad/application/mi-cuenta";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { errorJson, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

export async function GET(request: Request) {
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Inicia sesión para ver tu cuenta");

  try {
    const cuenta = await obtenerMiCuenta(sesion.sub, {
      clientes: clientesRepo(),
      listarPedidos: (id) => pedidosRepo().listarPorCliente(id),
    });
    return NextResponse.json(cuenta);
  } catch (err) {
    if (err instanceof SesionClienteInvalidaError) {
      return errorJson(401, "UNAUTHENTICATED", err.message);
    }
    console.error("[cuenta]", err instanceof Error ? err.message : err);
    return errorJson(503, "UNAVAILABLE", "No pudimos cargar tu cuenta en este momento.");
  }
}

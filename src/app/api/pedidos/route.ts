import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { vistaPanel } from "@/modules/pedidos/application/pedidos";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

// Panel: acceso por rol en proxy.ts (Administrador, Vendedor, Bodega).
export async function GET() {
  try {
    return NextResponse.json({ pedidos: (await pedidosRepo().listarTodos()).map(vistaPanel) });
  } catch (err) {
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}

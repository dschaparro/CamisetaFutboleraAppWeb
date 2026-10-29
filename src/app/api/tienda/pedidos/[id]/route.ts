import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { puedeVer } from "@/modules/pedidos/application/pedidos";
import { montoACobrar } from "@/modules/pedidos/domain/pedido";
import { modoPasarela } from "@/modules/pedidos/infrastructure/pasarela";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Un pedido para la confirmación o la pasarela: con la clave del enlace o siendo su cliente. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clave = new URL(request.url).searchParams.get("k");
  const sesion = await sesionCliente(request);
  const pedido = await pedidosRepo().buscar(id);
  // Mismo 404 si no existe o si no puede verlo: no revela qué pedidos existen.
  if (!pedido || !puedeVer(pedido, clave, sesion?.sub ?? null)) {
    return errorJson(404, "NOT_FOUND", "No encontramos ese pedido");
  }
  return NextResponse.json({
    pedido,
    montoACobrar: montoACobrar(pedido),
    modoPasarela: modoPasarela(),
  });
}

import { actualizarProductoInventario } from "@/modules/operacion/application/inventario";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { inventarioRepo } from "@/modules/operacion/infrastructure/repos";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return responder(async () => actualizarProductoInventario(id, await leerJson(request), inventarioRepo));
}

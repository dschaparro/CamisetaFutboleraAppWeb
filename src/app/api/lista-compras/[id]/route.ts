import { cambiarEstadoItemLista } from "@/modules/operacion/application/lista-compras";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { listaComprasRepo } from "@/modules/operacion/infrastructure/repos";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return responder(async () => cambiarEstadoItemLista(id, await leerJson(request), listaComprasRepo));
}

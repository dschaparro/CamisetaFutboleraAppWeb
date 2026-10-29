import { registrarCompraProveedor } from "@/modules/operacion/application/inventario";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { inventarioRepo } from "@/modules/operacion/infrastructure/repos";

export async function POST(request: Request) {
  return responder(async () => registrarCompraProveedor(await leerJson(request), inventarioRepo), 201);
}

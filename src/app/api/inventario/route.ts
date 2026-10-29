import { listarInventario } from "@/modules/operacion/application/inventario";
import { responder } from "@/modules/operacion/infrastructure/http";
import { inventarioRepo } from "@/modules/operacion/infrastructure/repos";

export async function GET() {
  return responder(() => listarInventario(inventarioRepo));
}

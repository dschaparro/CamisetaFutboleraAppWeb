import { listarListaCompras } from "@/modules/operacion/application/lista-compras";
import { responder } from "@/modules/operacion/infrastructure/http";
import { listaComprasRepo } from "@/modules/operacion/infrastructure/repos";

export async function GET() {
  return responder(() => listarListaCompras(listaComprasRepo));
}

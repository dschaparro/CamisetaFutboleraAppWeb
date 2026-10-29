import { catalogoPublico } from "@/modules/tienda/application/tienda";
import { responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function GET() {
  return responder(() => catalogoPublico(tiendaRepo()));
}

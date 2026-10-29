import { guardarAjustesTienda, leerAjustesTienda } from "@/modules/tienda/application/tienda";
import { leerJson, responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function GET() {
  return responder(() => leerAjustesTienda(tiendaRepo()));
}

export async function PATCH(request: Request) {
  return responder(async () => guardarAjustesTienda(tiendaRepo(), await leerJson(request)));
}

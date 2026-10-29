import { leerAjustesTienda } from "@/modules/tienda/application/tienda";
import { responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

/** Ajustes públicos de la tienda (tope de carrito, etc.). */
export async function GET() {
  return responder(() => leerAjustesTienda(tiendaRepo()));
}

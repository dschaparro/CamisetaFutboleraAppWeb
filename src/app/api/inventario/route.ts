import { responder } from "@/modules/operacion/infrastructure/http";
import { listarInventario } from "@/modules/operacion/infrastructure/inventario-pg";

// Panel: Administrador, Vendedor y Bodega (proxy.ts). Muestra costos: nunca se expone a la tienda.
export async function GET() {
  return responder(() => listarInventario());
}

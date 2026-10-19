import { responder } from "@/modules/operacion/infrastructure/http";
import { listarListaCompras } from "@/modules/operacion/infrastructure/lista-compras-pg";

// Panel: Administrador, Vendedor y Bodega (proxy.ts).
export async function GET() {
  return responder(async () => ({ items: await listarListaCompras() }));
}

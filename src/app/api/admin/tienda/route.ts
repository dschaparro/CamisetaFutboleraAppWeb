import { datosPanel } from "@/modules/tienda/application/tienda";
import { responder } from "@/modules/tienda/infrastructure/http";

// Acceso: Administrador y Marketing (tabla de permisos en proxy.ts).
export async function GET() {
  return responder(() => datosPanel());
}

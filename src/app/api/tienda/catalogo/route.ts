import { catalogoPublico } from "@/modules/tienda/application/tienda";
import { responder } from "@/modules/tienda/infrastructure/http";

/** Catálogo público de la tienda (productos visibles, ligas y banners vigentes). */
export async function GET() {
  return responder(() => catalogoPublico());
}

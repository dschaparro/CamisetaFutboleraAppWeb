import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { guardarBanner, guardarCupon, guardarLiga, guardarProducto, guardarPromocion } from "@/modules/tienda/application/tienda";
import { leerJson, responder } from "@/modules/tienda/infrastructure/http";

const CREAR: Record<string, (raw: unknown) => unknown> = {
  productos: (raw) => guardarProducto(raw, null),
  ligas: (raw) => guardarLiga(raw, null),
  promociones: (raw) => guardarPromocion(raw, null),
  cupones: (raw) => guardarCupon(raw, null),
  banners: (raw) => guardarBanner(raw, null),
};

/** Crea un producto, liga, oferta, cupón o banner. */
export async function POST(request: Request, { params }: { params: Promise<{ coleccion: string }> }) {
  const { coleccion } = await params;
  const crear = CREAR[coleccion];
  if (!crear) return errorJson(404, "NOT_FOUND", "Colección desconocida");
  return responder(async () => ({ item: crear(await leerJson(request)) }));
}

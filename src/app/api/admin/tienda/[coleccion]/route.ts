import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import type { TiendaRepo } from "@/modules/tienda/application/puertos";
import { guardarBanner, guardarCupon, guardarLiga, guardarProducto, guardarPromocion } from "@/modules/tienda/application/tienda";
import { leerJson, responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

const CREAR: Record<string, (repo: TiendaRepo, raw: unknown) => unknown> = {
  productos: (repo, raw) => guardarProducto(repo, raw, null),
  ligas: (repo, raw) => guardarLiga(repo, raw, null),
  promociones: (repo, raw) => guardarPromocion(repo, raw, null),
  cupones: (repo, raw) => guardarCupon(repo, raw, null),
  banners: (repo, raw) => guardarBanner(repo, raw, null),
};

export async function POST(request: Request, { params }: { params: Promise<{ coleccion: string }> }) {
  const { coleccion } = await params;
  const crear = CREAR[coleccion];
  if (!crear) return errorJson(404, "NOT_FOUND", "Colección desconocida");
  const repo = tiendaRepo();
  return responder(async () => ({ item: await crear(repo, await leerJson(request)) }));
}

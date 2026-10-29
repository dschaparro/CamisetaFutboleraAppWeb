import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import type { TiendaRepo } from "@/modules/tienda/application/puertos";
import {
  eliminar,
  eliminarLiga,
  guardarBanner,
  guardarCupon,
  guardarLiga,
  guardarProducto,
  guardarPromocion,
} from "@/modules/tienda/application/tienda";
import { leerJson, responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

type Ctx = { params: Promise<{ coleccion: string; id: string }> };

const EDITAR: Record<string, (repo: TiendaRepo, raw: unknown, id: string) => unknown> = {
  productos: (repo, raw, id) => guardarProducto(repo, raw, id),
  ligas: (repo, raw, id) => guardarLiga(repo, raw, id),
  promociones: (repo, raw, id) => guardarPromocion(repo, raw, id),
  cupones: (repo, raw, id) => guardarCupon(repo, raw, id),
  banners: (repo, raw, id) => guardarBanner(repo, raw, id),
};

export async function PATCH(request: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  const editar = EDITAR[coleccion];
  if (!editar) return errorJson(404, "NOT_FOUND", "Colección desconocida");
  const repo = tiendaRepo();
  return responder(async () => ({ item: await editar(repo, await leerJson(request), id) }));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  const repo = tiendaRepo();
  if (coleccion === "ligas") return responder(() => eliminarLiga(repo, id));
  if (coleccion === "promociones" || coleccion === "cupones" || coleccion === "banners") {
    return responder(() => eliminar(repo, coleccion, id));
  }
  return errorJson(405, "NO_PERMITIDO", "Los productos no se eliminan: desmarca «Visible en la tienda» para ocultarlos.");
}

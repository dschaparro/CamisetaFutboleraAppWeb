import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
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

type Ctx = { params: Promise<{ coleccion: string; id: string }> };

const EDITAR: Record<string, (raw: unknown, id: string) => unknown> = {
  productos: guardarProducto,
  ligas: guardarLiga,
  promociones: guardarPromocion,
  cupones: guardarCupon,
  banners: guardarBanner,
};

export async function PATCH(request: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  const editar = EDITAR[coleccion];
  if (!editar) return errorJson(404, "NOT_FOUND", "Colección desconocida");
  return responder(async () => ({ item: editar(await leerJson(request), id) }));
}

/** Productos no se borran (se ocultan) para no romper pedidos ni enlaces. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  if (coleccion === "ligas") return responder(() => eliminarLiga(id));
  if (coleccion === "promociones" || coleccion === "cupones" || coleccion === "banners") return responder(() => eliminar(coleccion, id));
  return errorJson(405, "NO_PERMITIDO", "Los productos no se eliminan: desmarca «Visible en la tienda» para ocultarlos.");
}

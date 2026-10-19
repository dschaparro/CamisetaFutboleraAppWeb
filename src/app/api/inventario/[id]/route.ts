import { validarCambiosInventario } from "@/modules/operacion/domain/operacion";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { actualizarInventario } from "@/modules/operacion/infrastructure/inventario-pg";

/** Corrige costo, stock o proveedor de un producto. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return responder(async () => ({ producto: await actualizarInventario(id, validarCambiosInventario(await leerJson(request))) }));
}

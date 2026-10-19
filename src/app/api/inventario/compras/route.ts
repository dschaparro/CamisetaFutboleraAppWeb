import { validarCompra } from "@/modules/operacion/domain/operacion";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { registrarCompra } from "@/modules/operacion/infrastructure/inventario-pg";

/** Registra una compra a proveedor: suma stock y deja el costo y proveedor vigentes. */
export async function POST(request: Request) {
  return responder(async () => ({ compra: await registrarCompra(validarCompra(await leerJson(request))) }), 201);
}

import { cambiarPerfil } from "@/modules/identidad/application/mi-cuenta";
import { conCliente, nuevoId } from "@/modules/identidad/infrastructure/cuenta-http";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";

/** Guarda una tarjeta (simulado): se valida el número y se conservan solo los últimos 4 dígitos. */
export async function POST(request: Request) {
  return conCliente(request, async (id, body) => ({
    perfil: await cambiarPerfil(id, { tipo: "agregar-tarjeta", raw: body, id: nuevoId("tar") }, clientesRepo()),
  }));
}

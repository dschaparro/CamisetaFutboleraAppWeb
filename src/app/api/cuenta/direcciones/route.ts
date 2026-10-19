import { cambiarPerfil } from "@/modules/identidad/application/mi-cuenta";
import { conCliente, nuevoId } from "@/modules/identidad/infrastructure/cuenta-http";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";

export async function POST(request: Request) {
  return conCliente(request, async (id, body) => ({
    perfil: await cambiarPerfil(id, { tipo: "agregar-direccion", raw: body, id: nuevoId("dir") }, clientesRepo()),
  }));
}

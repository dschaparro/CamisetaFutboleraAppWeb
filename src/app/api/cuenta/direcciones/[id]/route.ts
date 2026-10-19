import { cambiarPerfil } from "@/modules/identidad/application/mi-cuenta";
import { conCliente } from "@/modules/identidad/infrastructure/cuenta-http";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";

type Ctx = { params: Promise<{ id: string }> };

/** { predeterminada: true } la marca como principal; cualquier otro cuerpo la edita. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id: dirId } = await params;
  return conCliente(request, async (id, body) => {
    const soloPredeterminada = typeof body === "object" && body !== null && (body as Record<string, unknown>).predeterminada === true && !("direccion" in body);
    return {
      perfil: await cambiarPerfil(
        id,
        soloPredeterminada ? { tipo: "predeterminada-direccion", id: dirId } : { tipo: "editar-direccion", id: dirId, raw: body },
        clientesRepo(),
      ),
    };
  });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id: dirId } = await params;
  return conCliente(
    request,
    async (id) => ({ perfil: await cambiarPerfil(id, { tipo: "eliminar-direccion", id: dirId }, clientesRepo()) }),
    { leerCuerpo: false },
  );
}

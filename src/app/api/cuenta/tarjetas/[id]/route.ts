import { cambiarPerfil } from "@/modules/identidad/application/mi-cuenta";
import { conCliente } from "@/modules/identidad/infrastructure/cuenta-http";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";

type Ctx = { params: Promise<{ id: string }> };

/** Marca la tarjeta como principal. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id: tarjetaId } = await params;
  return conCliente(
    request,
    async (id) => ({ perfil: await cambiarPerfil(id, { tipo: "predeterminada-tarjeta", id: tarjetaId }, clientesRepo()) }),
    { leerCuerpo: false },
  );
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id: tarjetaId } = await params;
  return conCliente(
    request,
    async (id) => ({ perfil: await cambiarPerfil(id, { tipo: "eliminar-tarjeta", id: tarjetaId }, clientesRepo()) }),
    { leerCuerpo: false },
  );
}

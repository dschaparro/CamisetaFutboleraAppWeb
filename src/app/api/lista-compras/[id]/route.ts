import { NoEncontradoError, validarCambioLista } from "@/modules/operacion/domain/operacion";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { cambiarEstadoLista } from "@/modules/operacion/infrastructure/lista-compras-pg";

/** Marca un ítem como Conseguido / No conseguido (o lo devuelve a Pendiente). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = Number(id);
  return responder(async () => {
    if (!Number.isInteger(numero) || numero < 1) throw new NoEncontradoError("ese ítem de la lista de compras");
    const { estado, nota } = validarCambioLista(await leerJson(request));
    return { item: await cambiarEstadoLista(numero, estado, nota) };
  });
}

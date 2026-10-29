import { NoEncontradoError, validarCambioLista } from "@/modules/operacion/domain/operacion";
import type { ListaComprasRepo } from "@/modules/operacion/application/puertos";
import type { Pedido } from "@/modules/pedidos/domain/types";

export async function listarListaCompras(repo: ListaComprasRepo) {
  return { items: await repo.listar() };
}

export async function cambiarEstadoItemLista(id: string, raw: unknown, repo: ListaComprasRepo) {
  const numero = Number(id);
  if (!Number.isInteger(numero) || numero < 1) throw new NoEncontradoError("ese ítem de la lista de compras");
  const { estado, nota } = validarCambioLista(raw);
  return { item: await repo.cambiarEstado(numero, estado, nota) };
}

export async function registrarFaltantesPedido(pedido: Pedido, repo: ListaComprasRepo) {
  return repo.registrarFaltantes(pedido);
}

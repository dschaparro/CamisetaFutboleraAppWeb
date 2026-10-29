import {
  NoEncontradoError,
  validarCambiosInventario,
  validarCompra,
} from "@/modules/operacion/domain/operacion";
import type { InventarioRepo } from "@/modules/operacion/application/puertos";

export async function listarInventario(repo: InventarioRepo) {
  return repo.listar();
}

export async function actualizarProductoInventario(id: string, raw: unknown, repo: InventarioRepo) {
  if (!id.trim()) throw new NoEncontradoError("ese producto");
  return { producto: await repo.actualizar(id, validarCambiosInventario(raw)) };
}

export async function registrarCompraProveedor(raw: unknown, repo: InventarioRepo) {
  return { compra: await repo.registrarCompra(validarCompra(raw)) };
}

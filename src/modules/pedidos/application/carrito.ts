import type { LineaCarrito } from "@/modules/pedidos/domain/carrito";
import { fusionarConTope, parsearLineasCarrito } from "@/modules/pedidos/domain/carrito";
import type { CarritoRepo } from "@/modules/pedidos/application/puertos";

export type TopeCarrito = { maxProductos: number; maxCantidad: number };

export async function obtenerCarrito(clienteId: string, repo: CarritoRepo): Promise<LineaCarrito[]> {
  return repo.obtener(clienteId);
}

export async function guardarCarrito(
  clienteId: string,
  rawLineas: unknown,
  repo: CarritoRepo,
  tope?: TopeCarrito,
): Promise<LineaCarrito[]> {
  const lineas = parsearLineasCarrito(rawLineas, tope);
  await repo.reemplazar(clienteId, lineas);
  return lineas;
}

/** Fusiona el carrito de invitado con el de la cuenta y persiste el resultado. */
export async function enlazarCarritoInvitado(
  clienteId: string,
  rawInvitado: unknown,
  repo: CarritoRepo,
  tope?: TopeCarrito,
): Promise<LineaCarrito[]> {
  const maxProductos = tope?.maxProductos ?? 50;
  const maxCantidad = tope?.maxCantidad ?? 5;
  const invitado = parsearLineasCarrito(rawInvitado ?? [], { maxCantidad });
  const cuenta = await repo.obtener(clienteId);
  const fusion = fusionarConTope(cuenta, invitado, maxProductos, maxCantidad);
  await repo.reemplazar(clienteId, fusion);
  return fusion;
}

import { armarPedido, cambiarEstado, registrarPago, siguienteId, validarPedidoNuevo } from "@/modules/pedidos/domain/pedido";
import type { EstadoPedido, Pedido, ProductoVenta } from "@/modules/pedidos/domain/types";
import type { PedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Crea el pedido del checkout. Si hay cliente con sesión, queda en su historial. */
export async function crearPedido(
  raw: unknown,
  deps: {
    repo: PedidosRepo;
    catalogo: ProductoVenta[];
    clienteId: string | null;
    ahora: Date;
    claveAcceso: string;
    /** Valida el cupón con el subtotal real (lanza si no aplica) y devuelve el descuento. */
    cupon?: (subtotal: number) => number | Promise<number>;
  },
): Promise<Pedido> {
  const datos = validarPedidoNuevo(raw, deps.catalogo);
  const subtotal = datos.items.reduce((s, it) => s + it.precioUnitario * it.cantidad, 0);
  const descuento = deps.cupon ? await deps.cupon(subtotal) : 0;
  const id = siguienteId((await deps.repo.listarTodos()).map((p) => p.id));
  const pedido = armarPedido(datos, id, deps.clienteId, deps.ahora, deps.claveAcceso, descuento);
  await deps.repo.guardar(pedido);
  return pedido;
}

/** ¿Quien pregunta puede ver este pedido? Con la clave del enlace, o siendo su cliente. */
export function puedeVer(pedido: Pedido, clave: string | null, clienteId: string | null): boolean {
  return (clave !== null && clave === pedido.claveAcceso) || (clienteId !== null && clienteId === pedido.clienteId);
}

export async function pagarPedido(
  pedido: Pedido,
  resultado: { aprobado: boolean; referencia: string },
  deps: { repo: PedidosRepo; ahora: Date },
): Promise<Pedido> {
  const actualizado = registrarPago(pedido, resultado.aprobado, resultado.referencia, deps.ahora);
  await deps.repo.guardar(actualizado);
  return actualizado;
}

export async function actualizarEstado(
  id: string,
  estado: EstadoPedido,
  guia: string | null,
  deps: { repo: PedidosRepo; ahora: Date },
): Promise<Pedido | null> {
  const pedido = await deps.repo.buscar(id);
  if (!pedido) return null;
  const actualizado = cambiarEstado(pedido, estado, deps.ahora, guia);
  await deps.repo.guardar(actualizado);
  return actualizado;
}

/** Lo que ve el personal: todo menos la clave del enlace del cliente. */
export function vistaPanel(p: Pedido): Omit<Pedido, "claveAcceso"> {
  const { claveAcceso: _clave, ...resto } = p;
  void _clave;
  return resto;
}

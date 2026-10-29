import type { ListaComprasRepo } from "@/modules/operacion/application/puertos";
import type { PedidosRepo } from "@/modules/pedidos/application/puertos";
import { crearPedido } from "@/modules/pedidos/application/pedidos";
import type { Pedido, ProductoVenta } from "@/modules/pedidos/domain/types";
import type { TiendaRepo } from "@/modules/tienda/application/puertos";
import { registrarVenta, validarCuponPara } from "@/modules/tienda/application/tienda";

export type FinalizarVentaDeps = {
  pedidos: PedidosRepo;
  tienda: TiendaRepo;
  listaCompras: ListaComprasRepo;
  catalogo: ProductoVenta[];
  clienteId: string;
  ahora: Date;
  claveAcceso: string;
  onFaltantesError?: (err: unknown) => void;
};

/**
 * Checkout: crea el pedido, registra faltantes en lista de compras y descuenta stock/cupón.
 */
export async function finalizarVenta(
  raw: unknown,
  codigoCupon: string,
  deps: FinalizarVentaDeps,
): Promise<Pedido> {
  const ajustes = await deps.tienda.leerAjustes();
  let cuponId: string | null = null;
  const pedido = await crearPedido(raw, {
    repo: deps.pedidos,
    catalogo: deps.catalogo,
    clienteId: deps.clienteId,
    ahora: deps.ahora,
    claveAcceso: deps.claveAcceso,
    maxCantidad: ajustes.carritoMaxCantidad,
    maxItems: ajustes.carritoMaxProductos,
    cupon: codigoCupon
      ? async (subtotal) => {
          const r = await validarCuponPara(deps.tienda, codigoCupon, subtotal, deps.ahora);
          cuponId = r.cupon.id;
          return r.descuento;
        }
      : undefined,
  });

  try {
    await deps.listaCompras.registrarFaltantes(pedido);
  } catch (err) {
    deps.onFaltantesError?.(err);
  }

  await registrarVenta(deps.tienda, pedido.items, cuponId);
  return pedido;
}

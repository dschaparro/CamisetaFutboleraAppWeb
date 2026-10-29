import type { ListaComprasRepo } from "@/modules/operacion/application/puertos";
import type { PedidosRepo } from "@/modules/pedidos/application/puertos";
import { vistaPanel } from "@/modules/pedidos/application/pedidos";
import { siguienteId } from "@/modules/pedidos/domain/pedido";
import { armarVentaManual, validarVentaManual } from "@/modules/pedidos/domain/venta-manual";
import type { Pedido, ProductoVenta } from "@/modules/pedidos/domain/types";
import type { TiendaRepo } from "@/modules/tienda/application/puertos";
import { registrarVenta } from "@/modules/tienda/application/tienda";

export type RegistrarVentaManualDeps = {
  pedidos: PedidosRepo;
  tienda: TiendaRepo;
  listaCompras: ListaComprasRepo;
  catalogo: ProductoVenta[];
  ahora: Date;
  claveAcceso: string;
  onFaltantesError?: (err: unknown) => void;
};

export type ResultadoVentaManual = {
  pedido: Omit<Pedido, "claveAcceso">;
  enListaDeCompras: number;
};

/** Venta del panel: arma el pedido, faltantes y descuento de stock. */
export async function registrarVentaManual(
  raw: unknown,
  deps: RegistrarVentaManualDeps,
): Promise<ResultadoVentaManual> {
  const venta = validarVentaManual(raw, deps.catalogo);
  const id = siguienteId((await deps.pedidos.listarTodos()).map((p) => p.id));
  const pedido = armarVentaManual(venta, id, deps.ahora, deps.claveAcceso);
  await deps.pedidos.guardar(pedido);

  let enListaDeCompras = 0;
  try {
    enListaDeCompras = await deps.listaCompras.registrarFaltantes(pedido);
  } catch (err) {
    deps.onFaltantesError?.(err);
  }

  await registrarVenta(deps.tienda, pedido.items, null);
  return { pedido: vistaPanel(pedido), enListaDeCompras };
}

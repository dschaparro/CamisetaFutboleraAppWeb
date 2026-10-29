import type { Pedido } from "@/modules/pedidos/domain/types";

export type PedidosRepo = {
  listarTodos(): Promise<Pedido[]>;
  listarPorCliente(clienteId: string): Promise<Pedido[]>;
  buscar(id: string): Promise<Pedido | null>;
  guardar(pedido: Pedido): Promise<void>;
};

export type ResultadoPago = { aprobado: boolean; referencia: string; mensaje: string };

export type TarjetaGuardadaRef = { id: string; ultimos4: string };

/** Puerto de pasarela: valida el body y cobra. */
export type Pasarela = {
  cobrarDesdeBody(
    raw: unknown,
    resolverTarjeta: (medioId: string) => TarjetaGuardadaRef | null,
  ): Promise<ResultadoPago>;
};

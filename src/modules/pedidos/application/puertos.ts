import type { LineaCarrito } from "@/modules/pedidos/domain/carrito";
import type { Pedido } from "@/modules/pedidos/domain/types";

export type PedidosRepo = {
  listarTodos(): Promise<Pedido[]>;
  listarPorCliente(clienteId: string): Promise<Pedido[]>;
  buscar(id: string): Promise<Pedido | null>;
  guardar(pedido: Pedido): Promise<void>;
};

/** Carrito de cliente autenticado (persistencia pre-checkout). */
export type CarritoRepo = {
  obtener(clienteId: string): Promise<LineaCarrito[]>;
  reemplazar(clienteId: string, lineas: LineaCarrito[]): Promise<void>;
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

/** Pago consultado en Mercado Pago (Checkout Pro). */
export type PagoExternoMp = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
};

export type PreferenciaCheckoutMp = {
  id: string;
  redirectUrl: string;
};

/** Puerto de Checkout Pro: preferencias y consulta de pagos. */
export type MercadoPagoCliente = {
  crearPreferenciaCheckout(pedido: Pedido, clave: string): Promise<PreferenciaCheckoutMp>;
  obtenerPago(paymentId: string): Promise<PagoExternoMp>;
};

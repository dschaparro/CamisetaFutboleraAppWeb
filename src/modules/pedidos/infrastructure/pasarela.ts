import type { Pasarela } from "@/modules/pedidos/application/puertos";
import { modoPasarela, type ModoPasarela } from "@/modules/pedidos/infrastructure/mercadopago-config";
import { pasarelaSimulada } from "@/modules/pedidos/infrastructure/pasarela-simulada";

export { modoPasarela };
export type { ModoPasarela };

/**
 * Cobro embebido (tarjeta/PSE simulados) solo cuando no hay Mercado Pago configurado.
 * Con MERCADOPAGO_ACCESS_TOKEN + APP_URL https se usa Checkout Pro (redirección).
 */
export function pasarelaActiva(): Pasarela {
  return pasarelaSimulada;
}

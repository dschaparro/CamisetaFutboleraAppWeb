import type { Pasarela } from "@/modules/pedidos/application/puertos";
import { pasarelaSimulada } from "@/modules/pedidos/infrastructure/pasarela-simulada";
import { pasarelaWompi, wompiConfigurado } from "@/modules/pedidos/infrastructure/pasarela-wompi";

/**
 * Composition: elige Wompi solo si hay claves y WOMPI_USE_REAL=true;
 * si no, la pasarela simulada (desarrollo y demos).
 */
export function pasarelaActiva(): Pasarela {
  if (process.env.WOMPI_USE_REAL === "true" && wompiConfigurado()) {
    return pasarelaWompi;
  }
  return pasarelaSimulada;
}

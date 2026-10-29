/**
 * Adaptador Wompi detrás del puerto Pasarela.
 * Sin claves → no se usa (ver `pasarelaActiva`).
 * Con claves pero sin integración completa de transacciones/webhook → falla
 * con mensaje claro; no simula cobros reales para no mentir al cliente.
 *
 * Docs: https://docs.wompi.co/
 */
import type { Pasarela } from "@/modules/pedidos/application/puertos";
import { DatosPagoInvalidosError, leerSolicitud } from "@/modules/pedidos/infrastructure/pasarela-simulada";

export function wompiConfigurado(): boolean {
  return Boolean(process.env.WOMPI_PRIVATE_KEY?.trim() && process.env.WOMPI_PUBLIC_KEY?.trim());
}

export const pasarelaWompi: Pasarela = {
  async cobrarDesdeBody(raw, resolverTarjeta) {
    leerSolicitud(raw, resolverTarjeta);
    if (!wompiConfigurado()) {
      throw new DatosPagoInvalidosError({
        metodo: "Wompi no está configurado (faltan WOMPI_PUBLIC_KEY / WOMPI_PRIVATE_KEY).",
      });
    }
    // Siguiente paso: crear transacción en la API de Wompi + webhook de confirmación.
    throw new DatosPagoInvalidosError({
      metodo:
        "La pasarela Wompi está parcialmente configurada. Completa la integración de transacciones y el webhook antes de cobrar en producción.",
    });
  },
};

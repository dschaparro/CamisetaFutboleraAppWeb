/**
 * Pasarela de pagos SIMULADA (imita a Wompi). No cobra nada ni sale a internet.
 * Cuando se integre la pasarela real, se reemplaza este archivo por el adaptador
 * de Wompi con la misma función `cobrar`.
 *
 * Tarjetas de prueba:
 * - 4242 4242 4242 4242 → aprobada
 * - 4000 0000 0000 0002 → rechazada (fondos insuficientes)
 * - cualquier otra que pase la validación de Luhn → aprobada
 * PSE y Nequi: el «banco» de prueba deja elegir aprobar o rechazar.
 */
import { luhn, soloDigitos, vencimientoValido } from "@/lib/tarjetas";

export const TARJETAS_PRUEBA = {
  aprobada: "4242 4242 4242 4242",
  rechazada: "4000 0000 0000 0002",
} as const;

export type SolicitudPago =
  | { metodo: "tarjeta"; numero: string; vencimiento: string; cvc: string; titular: string }
  | { metodo: "guardada"; medioId: string; ultimos4: string; cvc: string }
  | { metodo: "pse" | "nequi"; aprobar: boolean };

export type ResultadoPago = { aprobado: boolean; referencia: string; mensaje: string };

export class DatosPagoInvalidosError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos de pago inválidos");
    this.name = "DatosPagoInvalidosError";
    this.campos = campos;
  }
}

function referencia(): string {
  return `SIM-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e4)
    .toString()
    .padStart(4, "0")}`;
}

/**
 * Lee lo que manda la pantalla de pago. Una tarjeta guardada llega solo con su id:
 * la ruta la resuelve con `tarjetaGuardada` (últimos 4 dígitos) antes de cobrar.
 */
export function leerSolicitud(raw: unknown, tarjetaGuardada?: (id: string) => { ultimos4: string } | null): SolicitudPago {
  const r = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  if (r.metodo === "pse" || r.metodo === "nequi") return { metodo: r.metodo, aprobar: r.aprobar === true };
  if (r.metodo === "guardada") {
    const medio = typeof r.medioId === "string" && tarjetaGuardada ? tarjetaGuardada(r.medioId) : null;
    const cvc = String(r.cvc ?? "").trim();
    const errores: Record<string, string> = {};
    if (!medio) errores.medioId = "Elige una de tus tarjetas guardadas";
    if (!/^\d{3,4}$/.test(cvc)) errores.cvc = "CVC inválido";
    if (Object.keys(errores).length > 0) throw new DatosPagoInvalidosError(errores);
    return { metodo: "guardada", medioId: r.medioId as string, ultimos4: medio!.ultimos4, cvc };
  }
  if (r.metodo !== "tarjeta") throw new DatosPagoInvalidosError({ metodo: "Elige cómo pagar" });

  const errores: Record<string, string> = {};
  const numero = soloDigitos(r.numero);
  if (!/^\d{15,16}$/.test(numero) || !luhn(numero)) errores.numero = "Número de tarjeta inválido";
  const vencimiento = String(r.vencimiento ?? "").trim();
  if (!vencimientoValido(vencimiento)) errores.vencimiento = "Fecha inválida o vencida (MM/AA)";
  const cvc = String(r.cvc ?? "").trim();
  if (!/^\d{3,4}$/.test(cvc)) errores.cvc = "CVC inválido";
  const titular = String(r.titular ?? "").trim();
  if (titular.length < 3) errores.titular = "Escribe el nombre como aparece en la tarjeta";
  if (Object.keys(errores).length > 0) throw new DatosPagoInvalidosError(errores);
  return { metodo: "tarjeta", numero, vencimiento, cvc, titular };
}

/** Procesa el pago de prueba (con una pequeña espera para que se sienta real). */
export async function cobrar(solicitud: SolicitudPago): Promise<ResultadoPago> {
  await new Promise((r) => setTimeout(r, 900));
  const ref = referencia();
  if (solicitud.metodo === "guardada") {
    return { aprobado: true, referencia: ref, mensaje: `Pago aprobado con tu tarjeta guardada terminada en ${solicitud.ultimos4}` };
  }
  if (solicitud.metodo === "tarjeta") {
    if (solicitud.numero === TARJETAS_PRUEBA.rechazada.replace(/\s/g, "")) {
      return { aprobado: false, referencia: ref, mensaje: "Pago rechazado: fondos insuficientes" };
    }
    return { aprobado: true, referencia: ref, mensaje: `Pago aprobado con tarjeta terminada en ${solicitud.numero.slice(-4)}` };
  }
  const nombre = solicitud.metodo === "pse" ? "PSE" : "Nequi";
  return solicitud.aprobar
    ? { aprobado: true, referencia: ref, mensaje: `Pago aprobado por ${nombre}` }
    : { aprobado: false, referencia: ref, mensaje: `El pago por ${nombre} fue rechazado` };
}

import { ConversacionInvalidaError } from "@/modules/asistente/domain/errors";
import type { MensajeChat } from "@/modules/asistente/domain/types";

export const MAX_MENSAJE_CLIENTE = 500;
const MAX_MENSAJE_ASISTENTE = 4000;
/** Solo se envían los últimos mensajes: suficiente contexto y costo acotado. */
export const MAX_MENSAJES = 20;

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Valida lo que manda el navegador. Nunca se confía en él: el historial puede
 * venir alterado, así que se exige forma, alternancia y largos máximos.
 */
export function validarConversacion(raw: unknown): MensajeChat[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new ConversacionInvalidaError("La conversación está vacía");
  }

  const mensajes = raw.slice(-MAX_MENSAJES).map((m, i): MensajeChat => {
    if (!esObjeto(m) || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new ConversacionInvalidaError(`Mensaje ${i + 1} inválido`);
    }
    const content = m.content.trim();
    if (content.length === 0) throw new ConversacionInvalidaError("Hay un mensaje vacío");
    const max = m.role === "user" ? MAX_MENSAJE_CLIENTE : MAX_MENSAJE_ASISTENTE;
    if (content.length > max) {
      throw new ConversacionInvalidaError(`Un mensaje supera los ${max} caracteres`);
    }
    return { role: m.role, content };
  });

  // Al recortar, la conversación podría empezar con el asistente: la API exige que empiece el usuario.
  while (mensajes.length > 0 && mensajes[0].role !== "user") mensajes.shift();

  if (mensajes.length === 0 || mensajes[mensajes.length - 1].role !== "user") {
    throw new ConversacionInvalidaError("El último mensaje debe ser del cliente");
  }
  for (let i = 1; i < mensajes.length; i++) {
    if (mensajes[i].role === mensajes[i - 1].role) {
      throw new ConversacionInvalidaError("Los mensajes deben alternar entre cliente y asistente");
    }
  }
  return mensajes;
}

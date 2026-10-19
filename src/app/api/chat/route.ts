import { NextResponse } from "next/server";
import { ClaudeConfigError } from "@/lib/claude";
import { validarAccion } from "@/modules/asistente/domain/acciones";
import { validarConversacion } from "@/modules/asistente/domain/conversacion";
import { ConversacionInvalidaError } from "@/modules/asistente/domain/errors";
import { construirSistema, conContextoDePagina, slugDePagina } from "@/modules/asistente/domain/prompt";
import { catalogoTienda } from "@/modules/asistente/infrastructure/catalogo-tienda";
import { responderEnStream } from "@/modules/asistente/infrastructure/claude-chat";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";

// Ruta pública (la usan los clientes): cada mensaje es una llamada de pago a la API.
const LIMITE_MENSAJES = 30;
const VENTANA_MS = 10 * 60 * 1000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function error(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function estadoHttp(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

export async function POST(request: Request) {
  if (!allowAttempt(`chat:${clientKey(request)}`, LIMITE_MENSAJES, VENTANA_MS)) {
    return error(429, "RATE_LIMITED", "Enviaste muchos mensajes seguidos. Espera unos minutos o escríbenos por WhatsApp.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }
  const datos = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  let mensajes;
  try {
    mensajes = validarConversacion(datos.mensajes);
  } catch (err) {
    if (err instanceof ConversacionInvalidaError) return error(400, "VALIDATION_ERROR", err.message);
    throw err;
  }

  const catalogo = await catalogoTienda();
  const slug = slugDePagina(datos.pagina);
  const productoActual = slug ? (catalogo.find((p) => p.slug === slug) ?? null) : null;

  let textos: AsyncIterable<string>;
  try {
    textos = await responderEnStream({
      sistema: construirSistema(catalogo),
      mensajes: conContextoDePagina(mensajes, productoActual),
      signal: request.signal,
      validarAccion: (nombre, input) => validarAccion(nombre, input, catalogo),
    });
  } catch (err) {
    if (err instanceof ClaudeConfigError) {
      console.error("[asistente]", err.message);
      return error(503, "IA_NO_CONFIGURADA", "El asistente no está disponible en este momento.");
    }
    const status = estadoHttp(err);
    console.error("[asistente] fallo al llamar a la API:", status ?? "", err instanceof Error ? err.message : err);
    if (status === 429 || status === 529) {
      return error(503, "IA_SATURADA", "El asistente está muy ocupado. Intenta en un momento o escríbenos por WhatsApp.");
    }
    return error(502, "IA_ERROR", "El asistente no pudo responder. Intenta de nuevo o escríbenos por WhatsApp.");
  }

  const encoder = new TextEncoder();
  const iterador = textos[Symbol.asyncIterator]();
  const cuerpo = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await iterador.next();
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (err) {
        console.error("[asistente] el stream se cortó:", err instanceof Error ? err.message : err);
        controller.error(err);
      }
    },
    async cancel() {
      await iterador.return?.();
    },
  });

  return new Response(cuerpo, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

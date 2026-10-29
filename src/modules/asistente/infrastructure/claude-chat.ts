import { getClaudeClient, getClaudeModel } from "@/lib/claude";
import { HERRAMIENTAS, SEPARADOR_ACCIONES } from "@/modules/asistente/domain/acciones";
import type { AccionChat, MensajeChat } from "@/modules/asistente/domain/types";

const SIN_RESPUESTA =
  "Perdón, con eso no te puedo ayudar. ¿Te ayudo a encontrar una camiseta o con alguna duda de tu compra?";

/**
 * Abre la respuesta de Claude en streaming y devuelve solo el texto, trozo a trozo.
 * Espera el primer trozo antes de devolver: así los errores de la API (clave,
 * cupo, caída) salen aquí como excepción y la ruta puede responder con su código
 * HTTP, en vez de cortar un stream ya empezado.
 */
export async function responderEnStream(entrada: {
  sistema: string;
  mensajes: MensajeChat[];
  signal: AbortSignal;
  /** Convierte cada llamada a herramienta en una acción válida (o null para descartarla). */
  validarAccion: (nombre: string, input: unknown) => AccionChat | null;
}): Promise<AsyncIterable<string>> {
  const client = getClaudeClient();

  const stream = client.messages.stream(
    {
      model: getClaudeModel(),
      max_tokens: 1024,
      // El sistema (instrucciones + catálogo) es igual en todas las conversaciones: se cachea.
      system: [{ type: "text", text: entrada.sistema, cache_control: { type: "ephemeral" } }],
      messages: entrada.mensajes,
      // Las herramientas no se ejecutan aquí: se devuelven como botones al navegador.
      tools: HERRAMIENTAS,
      // Chat de tienda: preguntas simples, importa más la rapidez que pensar a fondo.
      output_config: { effort: "low" },
    },
    { signal: entrada.signal },
  );

  async function* textos(): AsyncGenerator<string> {
    let emitido = false;
    for await (const evento of stream) {
      if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
        emitido = true;
        yield evento.delta.text;
      }
    }
    const final = await stream.finalMessage();
    const acciones = final.content
      .filter((b) => b.type === "tool_use")
      .map((b) => (b.type === "tool_use" ? entrada.validarAccion(b.name, b.input) : null))
      .filter((a): a is AccionChat => a !== null);

    // Rechazo o respuesta vacía: el cliente igual recibe algo útil.
    if (!emitido) yield acciones.length > 0 ? "¡Listo! Aquí tienes:" : SIN_RESPUESTA;
    if (acciones.length > 0) yield SEPARADOR_ACCIONES + JSON.stringify(acciones);
  }

  const it = textos()[Symbol.asyncIterator]();
  const primero = await it.next();

  return (async function* () {
    if (primero.done) return;
    yield primero.value;
    for (;;) {
      const r = await it.next();
      if (r.done) return;
      yield r.value;
    }
  })();
}

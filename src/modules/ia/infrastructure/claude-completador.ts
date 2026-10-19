import { getClaudeClient, getClaudeModel } from "@/lib/claude";
import type { Completador } from "@/modules/ia/application/generar-informe";
import { InformeInvalidoError } from "@/modules/ia/domain/errors";
import { NOMBRE_HERRAMIENTA } from "@/modules/ia/domain/prompt";

/**
 * Se fuerza el uso de una herramienta para que Claude devuelva JSON con forma
 * fija en vez de texto libre. La validación real igual se hace en el dominio.
 */
const HERRAMIENTA_INFORME = {
  name: NOMBRE_HERRAMIENTA,
  description: "Entrega el informe ejecutivo terminado para mostrarlo en el panel.",
  // strict: la API garantiza que el input cumple el esquema (antes a veces omitía "titulo").
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      titulo: { type: "string", description: "Título corto del informe." },
      kpis: {
        type: "array",
        description: "Entre 1 y 4 indicadores clave.",
        items: {
          type: "object",
          properties: {
            etiqueta: { type: "string", description: "Nombre del indicador, ej. Ventas del mes." },
            valor: { type: "string", description: "Valor ya formateado, ej. $8.420.000 o 34,2%." },
          },
          required: ["etiqueta", "valor"],
          additionalProperties: false,
        },
      },
      secciones: {
        type: "array",
        description: "Entre 2 y 5 secciones de análisis.",
        items: {
          type: "object",
          properties: {
            titulo: { type: "string" },
            texto: { type: "string", description: "Párrafo claro y accionable." },
            alerta: { type: "boolean", description: "true solo si requiere acción pronta." },
          },
          required: ["titulo", "texto", "alerta"],
          additionalProperties: false,
        },
      },
    },
    required: ["titulo", "kpis", "secciones"],
    additionalProperties: false,
  },
};

export const completarConClaude: Completador = async ({ sistema, usuario }) => {
  const client = getClaudeClient();

  const respuesta = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 2000,
    system: sistema,
    messages: [{ role: "user", content: usuario }],
    tools: [HERRAMIENTA_INFORME],
    tool_choice: { type: "tool", name: NOMBRE_HERRAMIENTA },
  });

  // TEMPORAL (solo dev): registra lo que responde la API para depurar el formato.
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[informes] respuesta API:",
      JSON.stringify(
        {
          id: respuesta.id,
          model: respuesta.model,
          stop_reason: respuesta.stop_reason,
          usage: respuesta.usage,
          content: respuesta.content,
        },
        null,
        2,
      ),
    );
  }

  const bloque = respuesta.content.find((b) => b.type === "tool_use");
  if (!bloque || bloque.type !== "tool_use") {
    throw new InformeInvalidoError("La IA no devolvió un informe estructurado");
  }
  return bloque.input;
};

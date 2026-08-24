/**
 * Módulo: Inteligencia Artificial (API de Claude / Anthropic)
 * ------------------------------------------------------------------
 * Punto único de contacto con la API de Claude, usado tanto por el
 * asistente conversacional de la tienda (RF-34) como por el generador
 * de informes gerenciales del panel (RF-35). Debe ejecutarse solo en
 * el servidor (Route Handlers / Server Actions) — nunca en el cliente,
 * porque la llave de la API no puede exponerse en el navegador.
 *
 * Todavía no está instalado el SDK oficial ni configurada la llave
 * (ver Tablero de Sprints, Sprint 0: "API de Claude — no iniciado").
 * Por eso el chat de la tienda y el generador de informes del panel
 * usan respuestas de ejemplo en el cliente en vez de llamar aquí.
 *
 * Para conectarlo de verdad:
 *   1. npm install @anthropic-ai/sdk
 *   2. Completa ANTHROPIC_API_KEY en .env.local (nunca la publiques ni la subas al repo)
 *   3. Crea un Route Handler, p. ej. src/app/api/asistente/route.ts, que importe
 *      y use getClaudeClient() desde el servidor.
 */
export function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Falta ANTHROPIC_API_KEY en .env.local — la API de Claude todavía no está conectada, " +
        "ver src/lib/claude.ts y el Sprint 0 del Tablero de Sprints."
    );
  }

  // Descomenta cuando instales @anthropic-ai/sdk:
  // import Anthropic from "@anthropic-ai/sdk";
  // return new Anthropic({ apiKey });

  throw new Error("@anthropic-ai/sdk no está instalado todavía.");
}

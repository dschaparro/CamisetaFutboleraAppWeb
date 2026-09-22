/** Solo servidor: la API key no puede ir al cliente. */
export function getClaudeClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Falta ANTHROPIC_API_KEY en .env.local");
  }

  throw new Error("@anthropic-ai/sdk no está instalado todavía.");
}

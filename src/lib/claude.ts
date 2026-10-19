import Anthropic from "@anthropic-ai/sdk";

/** Falta configuración (API key). No es un fallo de la API ni del usuario. */
export class ClaudeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeConfigError";
  }
}

const MODELO_POR_DEFECTO = "claude-sonnet-5";

/** Solo servidor: la API key no puede ir al cliente. */
export function getClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new ClaudeConfigError("Falta ANTHROPIC_API_KEY en .env.local");
  }

  return new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 });
}

/** Se puede cambiar sin tocar código con ANTHROPIC_MODEL en .env.local. */
export function getClaudeModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || MODELO_POR_DEFECTO;
}

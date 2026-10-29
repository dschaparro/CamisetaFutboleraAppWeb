import { NextResponse } from "next/server";
import { ClaudeConfigError } from "@/lib/claude";
import { errorJson } from "@/lib/http";
import { generarInforme } from "@/modules/asistente/application/generar-informe";
import { InformeInvalidoError, SolicitudInvalidaError } from "@/modules/asistente/domain/errors";
import { completarConClaude } from "@/modules/asistente/infrastructure/claude-completador";
import { fuentesNegocio } from "@/modules/operacion/application/reportes";
import { reportesRepo } from "@/modules/operacion/infrastructure/repos";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientKey } from "@/modules/identidad/infrastructure/sesiones";

// Cada informe es una llamada de pago a la API: se limita por cliente.
const LIMITE_INFORMES = 20;
const VENTANA_MS = 60 * 60 * 1000;

/** Error de la API de Anthropic (trae `status`); se detecta sin importar el SDK aquí. */
function estadoHttp(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return null;
}

/** Composition: rate-limit → application.generarInforme con puertos inyectados. */
export async function POST(request: Request) {
  if (!allowAttempt(`informes:${clientKey(request)}`, LIMITE_INFORMES, VENTANA_MS)) {
    return errorJson(429, "RATE_LIMITED", "Ya generaste varios informes seguidos. Prueba de nuevo en un rato.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const solicitud =
    typeof body === "object" && body && "solicitud" in body ? String((body as { solicitud: unknown }).solicitud) : "";

  try {
    const informe = await generarInforme(solicitud, {
      fuentes: () => fuentesNegocio(reportesRepo),
      completar: completarConClaude,
    });
    return NextResponse.json({ informe });
  } catch (err) {
    if (err instanceof SolicitudInvalidaError) {
      return errorJson(400, "VALIDATION_ERROR", err.message);
    }
    if (err instanceof ClaudeConfigError) {
      console.error("[informes]", err.message);
      return errorJson(503, "IA_NO_CONFIGURADA", "La IA no está configurada: falta ANTHROPIC_API_KEY en .env.local.");
    }
    if (err instanceof InformeInvalidoError) {
      console.error("[informes] respuesta inválida:", err.message);
      return errorJson(502, "IA_RESPUESTA_INVALIDA", "La IA devolvió un informe con formato inválido. Intenta de nuevo.");
    }

    const status = estadoHttp(err);
    const detalle = err instanceof Error ? err.message : "error desconocido";
    console.error("[informes] fallo al llamar a la API:", status ?? "", detalle);

    if (status === 401 || status === 403) {
      return errorJson(503, "IA_CREDENCIALES", "La API key de Anthropic no es válida o no tiene permisos.");
    }
    if (status === 429) {
      return errorJson(429, "IA_LIMITE", "La API de Claude está saturada o sin cupo. Intenta en unos minutos.");
    }
    return errorJson(502, "IA_ERROR", "No se pudo generar el informe con la IA. Intenta de nuevo.");
  }
}

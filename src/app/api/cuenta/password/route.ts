import { cambiarPassword } from "@/modules/identidad/application/mi-cuenta";
import { conCliente } from "@/modules/identidad/infrastructure/cuenta-http";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";
import { clientKey, errorJson } from "@/modules/identidad/infrastructure/sesiones";

export async function POST(request: Request) {
  // Pide la contraseña actual: se limita para que no sirva para adivinarla.
  if (!allowAttempt(`password-cliente:${clientKey(request)}`, 8, 15 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Prueba en unos minutos.");
  }
  return conCliente(request, async (id, body) => {
    await cambiarPassword(id, body, clientesRepo());
    return { ok: true };
  });
}

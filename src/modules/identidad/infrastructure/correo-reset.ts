import type { NotificadorReset } from "@/modules/identidad/application/recuperar-password";

/**
 * Stub de correo de recuperación.
 * Con RESEND_API_KEY / SMTP se puede cablear el adaptador real; hasta entonces
 * en desarrollo se registra el enlace en consola (sin loguear el token completo en prod).
 */
export const correoResetStub: NotificadorReset = {
  async enviarEnlaceReset({ email, nombre, url }) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo:reset] ${nombre} <${email}>\n  ${url}`);
      return;
    }
    if (process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim()) {
      console.info(`[correo:reset] pendiente de adaptador real → ${email}`);
      return;
    }
    console.info(`[correo:reset] sin proveedor configurado → ${email}`);
  },
};

export function appBaseUrl(request?: Request): string {
  const env = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  if (request) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

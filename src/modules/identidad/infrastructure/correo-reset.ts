import type { NotificadorReset } from "@/modules/identidad/application/recuperar-password";

const RESEND_API = "https://api.resend.com/emails";

/** Remitente: CORREO_FROM o el de prueba de Resend (solo envía a la cuenta del API key). */
export function remitenteCorreo(): string {
  return process.env.CORREO_FROM?.trim() || "Camiseta Futbolera <onboarding@resend.dev>";
}

export function cuerpoCorreoReset(nombre: string, url: string): { subject: string; text: string; html: string } {
  const saludo = nombre.trim() || "Hola";
  const subject = "Restablece tu contraseña — Camiseta Futbolera";
  const text = `${saludo},\n\nPediste restablecer tu contraseña. Abre este enlace (válido por 1 hora):\n\n${url}\n\nSi no fuiste tú, ignora este correo.\n`;
  const html = `<p>${escapeHtml(saludo)},</p><p>Pediste restablecer tu contraseña. Este enlace vale <strong>1 hora</strong>:</p><p><a href="${escapeAttr(url)}">Restablecer contraseña</a></p><p style="word-break:break-all;color:#666;font-size:13px">${escapeHtml(url)}</p><p>Si no fuiste tú, ignora este correo.</p>`;
  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

async function enviarResend(opts: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}${detalle ? `: ${detalle.slice(0, 200)}` : ""}`);
  }
}

/**
 * Correo de recuperación: Resend si hay `RESEND_API_KEY`; en local sin clave
 * imprime el enlace en consola. En producción sin clave falla (no finge el envío).
 */
export const correoReset: NotificadorReset = {
  async enviarEnlaceReset({ email, nombre, url }) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const cuerpo = cuerpoCorreoReset(nombre, url);

    if (apiKey) {
      await enviarResend({
        apiKey,
        from: remitenteCorreo(),
        to: email,
        ...cuerpo,
      });
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo:reset] ${nombre} <${email}>\n  ${url}`);
      return;
    }

    throw new Error("Falta RESEND_API_KEY para enviar el correo de recuperación");
  },
};

/** @deprecated Usar `correoReset`. */
export const correoResetStub = correoReset;

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

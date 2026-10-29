/** Credenciales y URLs públicas para Checkout Pro (test o producción según el Access Token). */

export function mercadopagoAccessToken(): string | null {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  return t || null;
}

export function mercadopagoWebhookSecret(): string | null {
  const s = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  return s || null;
}

/** Base pública HTTPS (Vercel / ngrok). Requerida para back_urls y notification_url. */
export function appPublicUrl(): string | null {
  const u = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL)?.trim().replace(/\/$/, "");
  return u || null;
}

export function mercadopagoConfigurado(): boolean {
  return Boolean(mercadopagoAccessToken() && appPublicUrl()?.startsWith("https://"));
}

export type ModoPasarela = "mercadopago" | "simulada";

export function modoPasarela(): ModoPasarela {
  return mercadopagoConfigurado() ? "mercadopago" : "simulada";
}

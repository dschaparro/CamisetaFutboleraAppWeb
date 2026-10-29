/**
 * Cliente REST de Mercado Pago (Checkout Pro).
 * Fuentes:
 * - POST /checkout/preferences — https://www.mercadopago.com.co/developers/es/reference/online-payments/checkout-pro/preferences/create-preference/post
 * - GET /v1/payments/{id} — notificaciones → consultar pago
 * - Validación x-signature — docs Webhooks (HMAC SHA256 del manifest)
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { MercadoPagoCliente } from "@/modules/pedidos/application/puertos";
import { montoACobrar } from "@/modules/pedidos/domain/pedido";
import type { Pedido } from "@/modules/pedidos/domain/types";
import { appPublicUrl, mercadopagoAccessToken, mercadopagoWebhookSecret } from "@/modules/pedidos/infrastructure/mercadopago-config";

const API = "https://api.mercadopago.com";

export class MercadoPagoError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "MercadoPagoError";
    this.status = status;
  }
}

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = mercadopagoAccessToken();
  if (!token) throw new MercadoPagoError("Falta MERCADOPAGO_ACCESS_TOKEN");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const raw = await res.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = { message: raw };
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Mercado Pago respondió ${res.status}`;
    throw new MercadoPagoError(msg, res.status);
  }
  return body as T;
}

export type PreferenciaCreada = { id: string; init_point: string; sandbox_init_point?: string };

/** Crea la preferencia Checkout Pro y devuelve la URL de redirección. */
export async function crearPreferenciaCheckout(pedido: Pedido, clave: string): Promise<PreferenciaCreada> {
  const base = appPublicUrl();
  if (!base) throw new MercadoPagoError("Falta APP_URL (HTTPS) para back_urls de Mercado Pago");

  const monto = montoACobrar(pedido);
  const q = `pedido=${encodeURIComponent(pedido.id)}&k=${encodeURIComponent(clave)}`;
  const success = `${base}/confirmacion?${q}`;
  const failure = `${base}/pago/${encodeURIComponent(pedido.id)}?k=${encodeURIComponent(clave)}&mp=failure`;
  const pending = `${base}/confirmacion?${q}&mp=pending`;

  const [nombre, ...apellidos] = pedido.contacto.nombre.trim().split(/\s+/);
  // En sandbox un email real en payer suele romper el checkout («algo anduvo mal»).
  // El comprador de prueba se autentica en la pantalla de Mercado Pago.
  const sandbox = process.env.MERCADOPAGO_SANDBOX !== "false";

  return mpFetch<PreferenciaCreada>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: pedido.id,
          title: `Pedido ${pedido.id} — Camiseta Futbolera`,
          description: pedido.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ").slice(0, 256),
          quantity: 1,
          currency_id: "COP",
          unit_price: monto,
          category_id: "fashion",
        },
      ],
      payer: {
        name: nombre || pedido.contacto.nombre,
        surname: apellidos.join(" ") || "Cliente",
        ...(sandbox ? {} : { email: pedido.contacto.email || undefined }),
      },
      back_urls: { success, pending, failure },
      auto_return: "approved",
      external_reference: pedido.id,
      notification_url: `${base}/api/webhooks/mercadopago`,
      statement_descriptor: "CAMISETA FUTBOL",
      metadata: { pedido_id: pedido.id, clave_hint: clave.slice(0, 8) },
    }),
  });
}

export type PagoMp = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
};

export async function obtenerPago(paymentId: string): Promise<PagoMp> {
  return mpFetch<PagoMp>(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * Valida x-signature según la documentación de Webhooks de Mercado Pago
 * (manifest `id:{dataId};request-id:{xRequestId};ts:{ts};` + HMAC-SHA256).
 */
export function validarFirmaWebhook(entrada: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = mercadopagoWebhookSecret();
  if (!secret) {
    // Sin secreto configurado aceptamos solo en desarrollo para poder ensayar con ngrok.
    return process.env.NODE_ENV !== "production";
  }
  if (!entrada.xSignature || !entrada.xRequestId || !entrada.dataId) return false;

  let ts = "";
  let v1 = "";
  for (const parte of entrada.xSignature.split(",")) {
    const [k, ...rest] = parte.trim().split("=");
    const val = rest.join("=");
    if (k === "ts") ts = val;
    if (k === "v1") v1 = val;
  }
  if (!ts || !v1) return false;

  const manifest = `id:${entrada.dataId};request-id:${entrada.xRequestId};ts:${ts};`;
  const calculado = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    const a = Buffer.from(calculado, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function urlCheckout(pref: PreferenciaCreada): string {
  /**
   * Con «Credenciales de prueba» del panel hay que usar `init_point`
   * (ya entra al Sandbox). `sandbox_init_point` es para token de producción en modo prueba.
   * Mezclarlos causa el fatal «Oh, no, algo anduvo mal».
   */
  if (process.env.MERCADOPAGO_SANDBOX_URL === "true" && pref.sandbox_init_point) {
    return pref.sandbox_init_point;
  }
  return pref.init_point;
}

/** Fábrica del puerto MercadoPagoCliente (inyección en Route Handlers). */
export function mercadoPagoCliente(): MercadoPagoCliente {
  return {
    async crearPreferenciaCheckout(pedido, clave) {
      const pref = await crearPreferenciaCheckout(pedido, clave);
      return { id: pref.id, redirectUrl: urlCheckout(pref) };
    },
    obtenerPago,
  };
}

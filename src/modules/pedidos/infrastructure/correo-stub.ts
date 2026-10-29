import type { NotificadorPedido } from "@/modules/pedidos/application/notificador";

/**
 * Stub de correo: no envía nada.
 * Con RESEND_API_KEY (o SMTP_*) se reemplaza por el adaptador real.
 */
export function correoConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim());
}

export const correoStub: NotificadorPedido = {
  async confirmarPedido(pedido) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo:stub] pedido ${pedido.id} → ${pedido.contacto.email} (no enviado)`);
    }
  },
};

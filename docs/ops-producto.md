# Producto / ops (Mercado Pago, Storage, correo, Vercel)

Variables: [`.env.example`](../.env.example).

## 1. Mercado Pago — Checkout Pro

Integración oficial (Colombia):

- Preferencias: [Crear preferencia](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/create-payment-preference)
- API: `POST https://api.mercadopago.com/checkout/preferences`
- Notificaciones: [Webhooks](https://www.mercadopago.com.co/developers/es/docs/your-integrations/notifications/webhooks)
- Consulta de pago: `GET https://api.mercadopago.com/v1/payments/{id}`
- Pruebas: [Compras de prueba / tarjetas](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/integration-test/test-purchases)

### Qué hay en el repo

| Pieza | Ruta |
|---|---|
| Modo auto | `modoPasarela()` → `mercadopago` si hay token + `APP_URL` https; si no, `simulada` |
| Preferencia | `mercadopago-api.crearPreferenciaCheckout` |
| Cobro / redirect | `POST /api/tienda/pedidos/[id]/pago` |
| Webhook | `POST /api/webhooks/mercadopago` (valida `x-signature`) |
| Sync retorno | `POST .../pago/sincronizar` + params en `/confirmacion` |

Sin SDK npm: `fetch` + `node:crypto` (HMAC), alineado al monolito.

### Cómo configurar (pruebas / tesis)

1. Crea una aplicación en [Mercado Pago Developers CO](https://www.mercadopago.com.co/developers/panel/app).
2. Copia el **Access Token de prueba** → `MERCADOPAGO_ACCESS_TOKEN`.
3. Pon `APP_URL` en HTTPS:
   - Demo en Vercel: la URL del deploy.
   - Local: túnel (`ngrok http 3000`) → `APP_URL=https://xxxx.ngrok-free.app`.
4. En la app → Webhooks → URL `https://TU_DOMINIO/api/webhooks/mercadopago`, topic **Payments**; copia el secret → `MERCADOPAGO_WEBHOOK_SECRET`.
5. Reinicia `npm run dev` / redeploy.

### Tarjeta de prueba (aprobada)

| Campo | Valor |
|---|---|
| Número | `5031 7557 3453 0604` (Mastercard) |
| Titular | `APRO` |
| Doc | `12345678` |
| CVC | `123` |
| Vence | `11/30` |

Otros titulares (`OTHE`, `FUND`, …) simulan rechazos — ver docs oficiales.

### Producción

Mismas variables con **credenciales de producción**. Los cobros dejan de ser sandbox.
Para la defensa del proyecto basta con **credenciales de prueba** en un deploy HTTPS.

### Offline / sin cuenta MP

No configures el token: la UI usa la **pasarela simulada** (4242… / PSE / Nequi locales).

## 2. Storage

Stub: `tienda/infrastructure/storage-supabase.ts` + `SUPABASE_STORAGE_BUCKET`.

## 3. Correo

Puerto `NotificadorPedido` + `correo-stub.ts`. Env: `RESEND_API_KEY` o `SMTP_*`.

## 4. Vercel

```bash
npm run build
# Framework: Next.js — pegar variables de .env.example (sin DEV_BYPASS_AUTH)
```

`vercel.json` fija framework/región. `APP_URL` = URL del proyecto en Vercel.

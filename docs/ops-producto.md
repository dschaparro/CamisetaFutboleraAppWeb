# Producto / ops (Wompi, Storage, correo, Vercel)

Pendiente de producto tras el pulido hexagonal. Variables en [`.env.example`](../.env.example).

## 1. Wompi (`feat(pedidos): Pasarela`)

- Puerto: `Pasarela` en `pedidos/application/puertos.ts`.
- Simulada: `pasarela-simulada.ts` (default).
- Real (scaffold): `pasarela-wompi.ts` vía `pasarelaActiva()` cuando
  `WOMPI_USE_REAL=true` + `WOMPI_PUBLIC_KEY` + `WOMPI_PRIVATE_KEY`.
- Falta: crear transacción en la API, integrity secret, webhook de eventos,
  y no cobrar con la UI simulada de tarjeta en producción.

## 2. Storage (`feat(tienda): imágenes`)

- Hoy: `TiendaRepo.guardarImagen` → bytea en Postgres.
- Stub: `tienda/infrastructure/storage-supabase.ts` + `SUPABASE_STORAGE_BUCKET`.
- Falta: subir/borrar objetos y guardar solo la URL pública en el catálogo.

## 3. Correo (`feat: transaccional`)

- Puerto: `NotificadorPedido` en `pedidos/application/notificador.ts`.
- Stub: `correo-stub.ts` (log en desarrollo).
- Env: `RESEND_API_KEY` o `SMTP_*` + `CORREO_FROM`.
- Falta: plantilla de confirmación / factura y llamada desde `finalizarVenta`.

## 4. Vercel (`chore: despliegue`)

```bash
npm run build   # debe pasar en local
# Conectar el repo en vercel.com → Framework Preset: Next.js
# Pegar las variables de .env.example (sin DEV_BYPASS_AUTH ni DATOS_SIMULADOS)
```

`vercel.json` fija framework y región por defecto. Revisar `DATABASE_URL` del
pooler y que `JWT_SECRET` / secret keys no se expongan al cliente.

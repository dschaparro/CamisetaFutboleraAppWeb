# Documentación API (Swagger)

- **UI interactiva:** `/docs/api` (Swagger UI vía CDN, sin dependencia npm).
- **Spec OpenAPI 3:** [`/openapi.yaml`](/openapi.yaml) → archivo fuente `public/openapi.yaml`.

Cubre los Route Handlers de `src/app/api/**` (auth panel/tienda, catálogo, pedidos, cuenta, panel e inventario, webhooks MP).

Errores: `{ error: { code, message, campos? } }`. Cookies: `cf_session` (panel, 8 h) y `cf_cliente` (tienda, 30 días).

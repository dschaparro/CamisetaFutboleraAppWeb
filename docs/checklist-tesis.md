# Checklist de entrega / defensa

Guía corta para demostrar el proyecto de grado. Fuente de arquitectura:
[`ADR-modulos.md`](ADR-modulos.md).

## Módulos vivos (mapa tesis)

| Tesis | Módulo(s) |
|---|---|
| Ventas / catálogo / checkout | `pedidos` + `tienda` |
| Compras / inventario / lista | `operacion` |
| Pagos | Mercado Pago Checkout Pro (+ `Pasarela` simulada) en `pedidos` |
| Identidad / roles / clientes | `identidad` |
| Informes IA / chat tienda | `asistente` |

No revivir `catalogo` ni `ia`: el catálogo vive en `tienda`; la IA en `asistente`.

## Capas hexagonales

1. `domain` — reglas puras (sin Next, `pg`, Wompi ni Claude).
2. `application` — casos de uso + **puertos**; no importa `*-pg`.
3. `infrastructure` — adaptadores (`*-pg`, cookies, Claude, pasarela).
4. `src/app` — UI y Route Handlers: composition root (inyecta puerto → llama application).

## Sagas / casos de uso transversales

- `finalizarVenta` — checkout web + stock + faltantes  
- `registrarVentaManual` — venta del panel  
- `procesarPagoPedido` — cobro simulado vía `Pasarela`  
- `iniciarCheckoutMercadoPago` / `confirmarPagoPorIdMp` — Checkout Pro + webhook  
- `responderChat` / `prepararStreamChat` — asistente de tienda  
- `generarInforme` — informe del panel con fuentes de `operacion`

## Cómo demostrar en vivo

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL / JWT_SECRET / keys
npm run dev                  # http://localhost:3000  ·  /panel/login
npm test                     # suite domain + application (sin Vitest)
```

Flujos sugeridos en defensa:

1. Tienda: catálogo → ficha → carrito → checkout (cupón) → confirmación.  
2. Panel: login → dashboard → pedidos / inventario / lista de compras.  
3. Venta manual y (si hay clave) informe IA.  
4. Mostrar un test de application con fake de puerto (p. ej. `finalizar-venta` o `registrar-venta-manual`).

## Criterios de calidad ya cubiertos en el pulido

- [x] Hexagonal limpio en los 5 módulos  
- [x] Errores HTTP uniformes `{ error: { code, message } }`  
- [x] UX store (vacíos, carrito sin cupón inerte, checkout responsive)  
- [x] UX panel (vacíos, `field-error` / `form-error`)  
- [x] Tests application de sagas clave  

## Pendiente de producto (no bloquea la arquitectura)

Scaffolds y variables: [`ops-producto.md`](ops-producto.md).

- [x] Mercado Pago Checkout Pro (preferencia + webhook + sync retorno)  
- [ ] Credenciales de prueba MP + `APP_URL` https en el entorno de demo  
- [ ] Cablear Supabase Storage (`storage-supabase` + bucket)  
- [ ] Adaptador de correo real (`NotificadorPedido`)  
- [ ] Despliegue Vercel con secretos de producción  

## Qué no está en alcance

- Microservicios  
- Reescribir JWT/crypto de domain  
- Revivir módulos legacy `catalogo` / `ia`

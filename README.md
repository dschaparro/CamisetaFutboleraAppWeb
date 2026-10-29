# Camiseta Futbolera

Plataforma web de comercio electrónico con componente ERP e inteligencia
artificial integrada, para la gestión del emprendimiento Camiseta Futbolera.
Proyecto de grado — Ingeniería de Software.

Este repositorio contiene la **tienda pública** y el **panel administrativo** en
Next.js App Router, con monolito modular hexagonal en cinco módulos vivos.

## Estado actual

| Área | Estado |
|---|---|
| Arquitectura hexagonal (5 módulos) | ✅ Puertos + sagas en `application` |
| Persistencia Postgres (Supabase / `pg`) | ✅ En marcha en los módulos vivos |
| Auth panel + clientes (JWT cookie) | ✅ `cf_session` / `cf_cliente` |
| Tienda UX (catálogo, carrito, checkout) | ✅ Pulido responsive; cupón solo en checkout |
| Panel UX (tablas, vacíos, formularios) | ✅ Alineado a tokens / `field-error` |
| Tests (`npm test`, Node test runner) | ✅ Domain + application con fakes |
| Pasarela Mercado Pago | ✅ Checkout Pro (+ simulada local sin token) |
| Supabase Storage (imágenes) | ⏳ Pendiente / bytea local según migración |
| Correo transaccional | ⏳ Pendiente |
| Despliegue Vercel | ⏳ Pendiente |

Detalle de defensa: [`docs/checklist-tesis.md`](docs/checklist-tesis.md).
Decisiones de módulos: [`docs/ADR-modulos.md`](docs/ADR-modulos.md).

## Stack

| Componente | Tecnología |
|---|---|
| Frontend / API | Next.js (App Router) + React + TypeScript |
| Dominio | Módulos en `src/modules/*` (hexagonal) |
| Base de datos | PostgreSQL vía Supabase (`pg` / Data API en infrastructure) |
| Autenticación | JWT HS256 (`node:crypto`) + cookies httpOnly |
| IA | Claude (Anthropic) vía puertos de `asistente` |
| Pasarela | Mercado Pago Checkout Pro (`modoPasarela`) o simulada local |

## Requisitos

- **Node.js 18.18+** (probado con Node 22)
- **npm**
- Git

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # completa las variables (ver abajo)
npm run dev
```

- Tienda: http://localhost:3000  
- Panel: http://localhost:3000/panel/login  

En Windows, `npm run dev` usa `--use-system-ca` para certificados del sistema
(antivirus / red corporativa).

### Variables de entorno

Plantilla: [`.env.example`](.env.example). Entre otras:

- `DATABASE_URL` o `SUPABASE_URL` + `SUPABASE_SECRET_KEY`
- `JWT_SECRET` (mín. 32 caracteres; **no** uses las “JWT Keys” del dashboard de Supabase Auth)
- `DEV_BYPASS_AUTH` / `DATOS_SIMULADOS` solo para desarrollo
- `ANTHROPIC_API_KEY` para chat e informes

Nunca commits `.env.local` ni secretos.

### Postgres + login

1. Project URL y Secret key (`sb_secret_...`) en `.env.local`.
2. Genera `JWT_SECRET` con Node.
3. Ejecuta migraciones en `supabase/migrations/`.
4. `npm run hash-password -- "TuClaveSegura"` y crea el usuario admin.
5. `npm run dev` → `/panel/login`.

### Tests y build

```bash
npm test
npm run lint
npm run build
npm run start
```

## Estructura

```
src/
  app/                 → UI + Route Handlers (composition root)
  modules/
    identidad/         → panel, clientes, JWT
    tienda/            → catálogo, cupones, banners
    pedidos/           → checkout, venta manual, pasarela
    operacion/         → inventario, lista de compras, reportes
    asistente/         → chat + informes / Claude
  components/  context/  lib/
tests/modules/<modulo>/  → espejo de domain/application/infrastructure
docs/ADR-modulos.md
docs/checklist-tesis.md
```

Patrón de borde: route valida HTTP/sesión → inyecta el puerto → llama `application`.
Errores de API: `{ error: { code, message, campos? } }` vía `@/lib/http`.

## Qué falta (producto / ops)

Pulido de arquitectura y UX ya está. Scaffolds y checklist: [`docs/ops-producto.md`](docs/ops-producto.md).

1. **Mercado Pago** — ya integrado (Checkout Pro); falta solo credenciales + `APP_URL` https (ver `docs/ops-producto.md`)
2. **Storage** — stub `storage-supabase` + `SUPABASE_STORAGE_BUCKET`
3. **Correo** — puerto `NotificadorPedido` + stub
4. **Vercel** — `vercel.json` + variables de producción

## Créditos

Basado en la documentación del proyecto de grado: Propuesta, Marco de
Proyecto, Levantamiento de Requerimientos, Diagramas UML, Arquitectura de
Software y Mockups de Interfaz (v2) — Stiven Nicolás Gamba Robayo, Juan
Esteban Arias Arenas, Deivy Santiago Chaparro Tinjaca, David Santiago Ruiz Patarroyo.

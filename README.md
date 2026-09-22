# Camiseta Futbolera

Plataforma web de comercio electrónico con componente ERP e inteligencia
artificial integrada, para la gestión del emprendimiento Camiseta Futbolera.
Proyecto de grado — Ingeniería de Software.

Este repositorio contiene la **tienda y el panel** (mockups v2) en Next.js App Router.
`identidad` ya persiste en Postgres (login JWT). Catálogo, pedidos, compras, pagos e IA
siguen con datos de ejemplo en `src/data/*.ts` hasta que cada módulo tenga migración.

## Stack (según Arquitectura de Software v2)

| Componente | Tecnología | Estado en este repo |
|---|---|---|
| Frontend | Next.js (React) + TypeScript, App Router | ✅ Implementado |
| Backend / API | Route Handlers en `src/app/api/*` | ✅ Login JWT (`/api/auth/*`); resto pendiente |
| Base de datos | PostgreSQL vía Supabase (Data API) | ✅ Cliente servidor + tabla `usuarios` |
| Autenticación | JWT HS256 (`node:crypto`) + cookie httpOnly | ✅ Panel (`cf_session`) |
| Almacenamiento | Supabase Storage | ⏳ Sin conectar |
| Pasarela de pago | Wompi | ⏳ El checkout simula la confirmación, no llama a Wompi |
| Inteligencia artificial | API de Claude (Anthropic) | ⏳ Stub en `src/lib/claude.ts`, respuestas de ejemplo en el cliente |
| Hosting | Vercel | ⏳ Pendiente de desplegar |

## Requisitos para correr el proyecto

- **Node.js 18.18 o superior** (probado en este entorno con Node 22).
- **npm** (o yarn/pnpm si el equipo prefiere, ajustando los comandos).
- Git, para clonar y trabajar con el repositorio compartido.

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # completa las llaves reales cuando las tengan (ver abajo)
npm run dev
```

Abre http://localhost:3000 — la tienda vive en `/` y el panel administrativo
en `/panel/login`.

En Windows, `npm run dev` usa `--use-system-ca` para que Node confíe en los
certificados del sistema (antivirus / red corporativa), igual que el navegador.
Fuente: https://nodejs.org/learn/http/enterprise-network-configuration

### Conectar Postgres (Supabase) y el login JWT

1. En Supabase: Project URL (Connect o Settings → General) y **Secret key** (`sb_secret_...`) a `.env.local`.
2. Genera `JWT_SECRET` (mínimo 32 caracteres) con Node; **no** copies las “JWT Keys” del dashboard — esas son de Auth de Supabase, no del panel.
3. En el SQL Editor ejecuta `supabase/migrations/001_usuarios.sql`.
4. `npm run hash-password -- "TuClaveSegura"` y descomenta el `INSERT` en el SQL.
5. `npm run dev` y entra en `/panel/login`.

Sin `.env.local` el login responde 503 (no hay conexión); el panel redirige a login si no hay cookie válida.

Para verificar que compila igual que en producción (lo que corre en Vercel):

```bash
npm run build
npm run start
```

## Estructura de carpetas

```
src/
  app/
    (store)/          → Tienda (route group; no cambia la URL)
    panel/
      login/          → Acceso al backoffice
      (admin)/        → Dashboard, inventario, pedidos… (con Sidebar)
    globals.css
  modules/identidad/  → domain / application / infrastructure
  components/
  context/
  data/               → Mocks de catálogo/pedidos hasta persistir el módulo
  lib/
    money.ts
    supabaseClient.ts → getSupabaseConfig() (solo servidor)
    claude.ts         → stub
tests/modules/identidad/
```

Los módulos de negocio viven en `src/modules/<modulo>/`. `src/app` solo pinta y expone Route Handlers.

## Qué falta para que esto sea la app real (no solo el frontend)

Login JWT del panel y Postgres (Data API) ya están conectados (`identidad`).
Falta persistir el resto de módulos (catálogo, pedidos, Wompi, Claude) y desplegar.

Según el **Tablero de Sprints** (Sprint 0), lo que sigue:

1. **GitHub** — confirmar acceso de los tres integrantes.
2. **Supabase** — migrar el modelo de datos (Diagrama de Clases) y reemplazar `src/data/*.ts` módulo a módulo, copiando `src/modules/identidad`.
3. **API de Claude** — Route Handlers (`/api/asistente`, `/api/informes`) cuando toque el módulo `ia`.
4. **Wompi** — sandbox en checkout (hoy simula la confirmación).
5. **Correo transaccional** — factura y notificaciones.
6. **Vercel** — despliegue.

## Créditos

Basado en la documentación del proyecto de grado: Propuesta, Marco de
Proyecto, Levantamiento de Requerimientos, Diagramas UML, Arquitectura de
Software y Mockups de Interfaz (v2) — Stiven Nicolás Gamba Robayo, Juan
Esteban Arias Arenas, Deivy Santiago Chaparro Tinjaca, David Santiago Ruiz Patarroyo.

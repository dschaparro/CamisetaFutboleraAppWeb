# Camiseta Futbolera

Plataforma web de comercio electrónico con componente ERP e inteligencia
artificial integrada, para la gestión del emprendimiento Camiseta Futbolera.
Proyecto de grado — Ingeniería de Software.

Este repositorio contiene el **frontend navegable** (tienda + panel
administrativo) construido a partir de los 15 mockups documentados en
`5. MOCKUPS/V2 - Mockups e Interfaz | Camiseta Futbolera`, ya integrado en un
proyecto **Next.js con TypeScript y App Router**, tal como lo define el
documento de Arquitectura de Software v2. Los datos que ves (productos,
pedidos, inventario, reportes) son de ejemplo — viven en `src/data/*.ts` —
porque el backend (Supabase) y las integraciones (Wompi, API de Claude)
todavía no están conectadas (ver Tablero de Sprints, Sprint 0 y 1).

## Stack (según Arquitectura de Software v2)

| Componente | Tecnología | Estado en este repo |
|---|---|---|
| Frontend | Next.js (React) + TypeScript, App Router | ✅ Implementado |
| Backend / API | API Routes de Next.js (Node.js + TypeScript) | ⏳ Por crear en `src/app/api/*` |
| Base de datos | PostgreSQL vía Supabase | ⏳ Stub en `src/lib/supabaseClient.ts` |
| Autenticación | Supabase Auth | ⏳ El login del panel todavía no valida contra Supabase |
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

Para verificar que compila igual que en producción (lo que corre en Vercel):

```bash
npm run build
npm run start
```

## Estructura de carpetas

```
src/
  app/
    (store)/          → Tienda: home/catálogo, producto, carrito, checkout,
                         confirmación, términos (route group, no cambia la URL)
    panel/             → Panel administrativo: login, dashboard, inventario,
                         pedidos, venta manual, lista de compras, reportes,
                         informes con IA
    globals.css         → Design system (tokens de color, tipografía, componentes)
  components/
    store/               → Header, Footer, ChatWidget (asistente de IA)
    admin/                → Sidebar, BarChart
  context/
    CartContext.tsx       → Estado del carrito (React Context), módulo Ventas
  data/
    products.ts, inventory.ts, orders.ts, shoppingList.ts
                           → Datos de ejemplo — reemplazar por consultas a
                             Supabase cuando el backend ERP esté listo
  lib/
    money.ts               → Formateo de moneda (COP)
    supabaseClient.ts       → Módulo Usuarios/Datos — stub, ver más abajo
    claude.ts                → Módulo Inteligencia Artificial — stub, ver más abajo
```

La organización por módulo (usuarios, catálogo, ventas, lista de compras,
compras a proveedor, pagos, envíos, IA, reportes) sigue la Arquitectura
Lógica en Capas del documento de Arquitectura de Software v2; en Next.js con
App Router esos módulos se reparten entre `src/app/(store)`, `src/app/panel`,
`src/data` y `src/lib` en vez de vivir en carpetas separadas por nombre.

## Qué falta para que esto sea la app real (no solo el frontend)

Según el propio **Tablero de Sprints** del equipo (Sprint 0, 1 de 9 tareas en
"Hecho"), esto es lo que falta conectar, en orden de bloqueo:

1. **Repositorio compartido en GitHub** — confirmar que existe y que los tres
   integrantes tienen acceso, y subir este código ahí.
2. **Supabase** — el proyecto de desarrollo ya existe (Auth probado). Falta
   migrar el modelo de datos completo (Diagrama de Clases) y conectar
   `src/lib/supabaseClient.ts` reemplazando los arrays de `src/data/*.ts`.
3. **API de Claude** — instalar `@anthropic-ai/sdk`, configurar
   `ANTHROPIC_API_KEY` en `.env.local`, y crear los Route Handlers
   (`src/app/api/asistente/route.ts`, `src/app/api/informes/route.ts`) que
   reemplacen las respuestas de ejemplo de `ChatWidget.tsx` e
   `informes-ia/page.tsx`.
4. **Wompi** — llaves de sandbox, e integrar el cobro real en
   `checkout/page.tsx` (hoy solo simula la confirmación).
5. **Correo transaccional** (Resend/SMTP) — para factura y notificaciones.
6. **Vercel** — conectar el repositorio para despliegue automático.

## Créditos

Basado en la documentación del proyecto de grado: Propuesta, Marco de
Proyecto, Levantamiento de Requerimientos, Diagramas UML, Arquitectura de
Software y Mockups de Interfaz (v2) — Stiven Nicolás Gamba Robayo, Juan
Esteban Arias Arenas y Deivy Santiago Chaparro Tinjaca.

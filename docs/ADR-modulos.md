# ADR: Mapa de módulos y hexagonal limpio

## Status

Accepted

## Date

2026-10-19

## Context

La tesis y el código temprano hablaban de `catalogo`, `ventas`, `compras`, `pagos` e `ia`. En la implementación viva esos nombres se consolidaron en otros módulos, y parte del borde (`src/app`) aún pegaba a `*-pg` o a repositorios concretos desde `application`. Hace falta un mapa canónico y una regla de dependencias única.

## Decision

Módulos vivos (cada uno con `domain` / `application` / `infrastructure`):

| Módulo | Rol |
|--------|-----|
| `identidad` | Usuarios del panel, clientes de tienda, JWT, cookies |
| `tienda` | Catálogo vendible, promociones, cupones, banners, imágenes |
| `pedidos` | Checkout, venta manual, estados, pasarela (infra) |
| `operacion` | Inventario, lista de compras, dashboard/reportes |
| `asistente` | Chat + informes con Claude (puertos de catálogo/completador) |

Mapa respecto a los nombres de la tesis:

- ventas → `pedidos` + `tienda`
- compras → `operacion`
- pagos → `pedidos` (puerto `Pasarela` en application; adaptador en `infrastructure`)
- catalogo (legacy PostgREST) → absorbido por `tienda`; el módulo `catalogo` se elimina
- ia → absorbido por `asistente` (chat e informes); `FuentesNegocio` vive en `operacion/domain`

Reglas de dependencia:

- `src/app` (UI y Route Handlers) llama a `application` y compone implementaciones de `infrastructure` (repos) en el borde.
- `application` recibe puertos (interfaces) como argumentos; no importa `*-pg.ts` ni fábricas concretas (`tiendaRepo()`).
- `domain` sin I/O de red/BD (salvo convención del proyecto: `node:crypto` en JWT/password).
- Código compartido sin I/O: `@/lib`.

## Alternatives Considered

### Mantener `catalogo` PostgREST en paralelo a `tienda`

- Pros: conserva el código de la fase 2.
- Cons: dos fuentes de verdad; ningún Route Handler lo usaba.
- Rejected: deuda muerta.

### Microservicios o paquetes npm por módulo

- Rejected: fuera de alcance del monolito modular del proyecto de grado.

## Consequences

- Actualizar rules/README al mapa vivo.
- Tests de application con fakes de puertos.
- Verificar que `src/app` no importe `*-pg` directamente.

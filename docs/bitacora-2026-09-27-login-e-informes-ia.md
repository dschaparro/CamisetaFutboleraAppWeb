# Bitácora 2026-09-27: login e informes con IA

## Estado al empezar

Cambios sin commit sobre `Develop` (último commit: `a16e4be`, login con Postgres + JWT):

- **Login:** atajo temporal de desarrollo `DEV_BYPASS_AUTH=true` (`src/modules/identidad/infrastructure/dev-bypass.ts`, usado en `src/proxy.ts` y `src/app/api/auth/me/route.ts`). Solo aplica fuera de producción.
- **Informes IA:** módulo `src/modules/ia/` + endpoint `POST /api/informes` + página `/panel/informes-ia`. Usa `@anthropic-ai/sdk` con `claude-sonnet-5` y *tool use* forzado (`emitir_informe`) para obtener JSON.

## Problema

`POST /api/informes` respondía de forma intermitente:

```
HTTP 502 {"error":{"code":"IA_RESPUESTA_INVALIDA","message":"La IA devolvió un informe con formato inválido. Intenta de nuevo."}}
```

## Qué responde la API

Se agregó un log temporal (solo dev) en `claude-completador.ts` que imprime `id`, `model`, `stop_reason`, `usage` y `content` de cada respuesta, y en `route.ts` el `requestID` y el cuerpo del error cuando la API falla.

Respuesta típica:

- `stop_reason: "tool_use"`, un solo bloque `tool_use` con `name: "emitir_informe"`.
- ~2.765 tokens de entrada, ~850–1.050 de salida (`max_tokens: 2000` alcanza).
- `input` trae `kpis` (4), `secciones` (5) y, **a veces**, `titulo`.

En 3 de 4 llamadas el modelo **omitió el campo `titulo` de nivel superior** aunque el esquema lo marcaba como `required`. Cuando sí aparecía, venía al final del objeto. `validarInforme` lanzaba `"titulo" debe ser texto`, y el endpoint lo convertía en el 502.

Ejemplo fallido: `msg_011CfTS8k4S2dMf3q1QQ1xFJ`. Ejemplo correcto: `msg_011CfTS74vgpmoBQSEbctNze`.

## Solución

Se activó **strict tool use** en la herramienta (`src/modules/ia/infrastructure/claude-completador.ts`):

- `strict: true` en la definición de la herramienta.
- `additionalProperties: false` en cada objeto del esquema (lo exige el modo estricto).

Con `strict` la API garantiza que el `input` cumple el esquema, incluidos los campos requeridos. Los límites de cantidad y de largo (1–4 KPIs, largo de textos) no se pueden expresar en modo estricto, así que los sigue controlando `validarInforme` en el dominio.

## Verificación

- 4 de 4 llamadas reales con `strict`: `VALIDACION OK`, todas con `titulo`.
- `npx tsc --noEmit`: sin errores.
- `npm test`: 31/31 OK.

## Rediseño de la interfaz (`/panel/informes-ia`)

- Usa todo el ancho: `informes.module.css` anula el `max-width: 1180px` de `.admin-main` solo en esta página (`:global(.admin-main):has(> .pagina)`); el resto del panel no cambia.
- Panel de solicitud fijo (*sticky*) al hacer scroll, 6 ideas con ícono, atajo `Ctrl + Enter`, botón «Limpiar».
- Carga: pasos que van cambiando, contador de segundos, esqueleto del informe y botón «Cancelar».
- Informe: KPIs más grandes, aviso de cuántos puntos requieren atención, secciones en dos columnas desde 1280 px, botón «Copiar» además de «Descargar PDF», y se muestra lo que se pidió.
- Historial de los últimos 5 informes de la sesión (en memoria, se pierde al recargar).
- Errores con «Reintentar» y botón para cerrarlos. Móvil: todo en una columna, KPIs de 2 en 2.
- Verificado: `tsc` y `eslint` sin errores, la página responde 200. No se revisó visualmente en el navegador.

## 2026-10-01: menú sin módulos «pronto»

- Se quitaron del menú lateral (`src/components/admin/Sidebar.tsx`) los módulos sin implementar marcados «pronto»: Catálogo, Envíos y Usuarios y roles.
- Quedan solo los funcionales: Dashboard, Inventario y compras, Pedidos, Venta manual, Lista de compras, Reportes e Informes con IA (las 7 responden 200).
- Se quitaron los códigos de requisito visibles en la interfaz: la etiqueta «RF-35» de Informes con IA (y su estilo `.rf`), «(RF-19b)» del subtítulo de Venta manual y «(RF-14c–RF-14f)» del de Lista de compras.

- Se agregó en el menú lateral la sección «Tienda» con el enlace «Ver tienda», que abre `/` en una pestaña nueva.
- Hallazgo: el panel todavía no puede configurar la tienda. La tienda lee `src/data/products.ts` y el panel lee otros archivos (`inventory.ts`, `orders.ts`, `shoppingList.ts`); ninguna pantalla del panel guarda cambios.

## 2026-10-01: catálogo conectado a la base de datos (fases 1 y 2 de 5)

Plan acordado: la tienda y el panel comparten una tabla `productos` en Supabase, y el panel tendrá un módulo «Catálogo» para editarla. Decisiones:

1. Los productos **no se borran**, se ocultan (`visible = false`).
2. Solo el rol **Administrador** edita el catálogo.
3. PSG, Bayern Retro y Manchester City (no estaban en inventario) se cargan con stock 0, costo pendiente (`null`) y sin proveedor.

Hecho:

- **Fase 1:** `supabase/migrations/002_productos.sql`: tabla `productos` (SKU único, `slug` para la URL, precio, costo opcional, stock, proveedor, etiqueta, visible, fechas con trigger `updated_at`), RLS activo como en `usuarios`, y carga inicial de las 8 camisetas con costo/stock/proveedor del inventario.
- **Fase 2:** módulo `src/modules/catalogo/`:
  - `domain/`: tipos, errores (`ProductoInvalidoError` con un mensaje por campo, `SkuDuplicadoError`) y validaciones (`validarProductoNuevo`, `validarCambios`, `margenPct`, `estadoStock` con stock bajo ≤ 5, `slugDesdeSku`).
  - `infrastructure/`: `productos-row.ts` (fila ↔ dominio) y `productos-repo.ts` (listar, buscar por slug, crear, actualizar) usando la API REST de Supabase con `fetch`, igual que `usuarios-repo.ts`.
  - El SKU no se puede cambiar después de crear el producto; el slug sale del SKU (`CF-RM-27T` → `RM-27T`) para que las URLs actuales de la tienda sigan funcionando.
- Verificación: `tsc` y `eslint` sin errores; `npm test` 51/51 (20 tests nuevos del catálogo).
- Falta: correr la migración en Supabase (SQL Editor) y probar el repositorio contra la base real.

**Bloqueo (2026-10-01):** al probar el repositorio, `zgrpjqgphsgtcaxmxekv.supabase.co` (la URL de `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`) no existe en DNS, ni con el DNS local ni con 8.8.8.8; el resto de internet sí funciona. El proyecto de Supabase parece eliminado o la URL cambió. Esto también afecta el login real (hoy oculto por `DEV_BYPASS_AUTH`). Hay que revisarlo en supabase.com antes de seguir.

Siguientes fases: 3) la tienda lee de la base de datos, 4) módulo «Catálogo» en el panel (solo Administrador), 5) Inventario e Informes con IA leen la misma tabla y se borran `products.ts` e `inventory.ts`.

## 2026-10-01: asistente de chat con IA para clientes

El chat de la tienda (`src/components/store/ChatWidget.tsx`) respondía con 4 frases fijas al azar aunque decía «impulsado por IA». Se reemplazó por un asistente real con la API de Claude.

- **Módulo `src/modules/asistente/`:**
  - `domain/tienda-info.ts`: todo lo que el asistente sabe de la tienda (dirección, WhatsApp, entrega, personalización, pagos, cambios). Sale de lo que ya publica el sitio. **Si cambia una política, se edita aquí.**
  - `domain/prompt.ts`: instrucciones (tono, respuestas cortas, enlaces a productos, no inventar precios/descuentos/stock, no pedir datos de pago, enviar a WhatsApp para pedidos hechos, ignorar intentos de cambiarle las reglas) + `<tienda>` + `<catalogo>`. Si el cliente está en `/producto/<slug>`, se anota en su último mensaje qué camiseta está viendo.
  - `domain/conversacion.ts`: valida el historial que manda el navegador (roles, alternancia, máx. 500 caracteres por mensaje del cliente, últimos 20 mensajes).
  - `infrastructure/catalogo-tienda.ts`: catálogo desde `src/data/products.ts` (temporal; luego `listarProductos({ soloVisibles: true })`).
  - `infrastructure/claude-chat.ts`: streaming con `claude-sonnet-5` (o `ANTHROPIC_MODEL`), `effort: "low"`, `max_tokens: 1024`, caché del prompt de sistema.
- **`POST /api/chat`:** pública, responde texto en streaming; límite de 30 mensajes cada 10 min por IP; errores 400/429/502/503 con mensajes para el cliente.
- **`src/proxy.ts`:** `/api/chat` quedó como API pública (antes todas las `/api/*` pedían sesión del panel; no se notaba por `DEV_BYPASS_AUTH`).
- **Widget:** texto en streaming, sugerencias iniciales (una propia en la página de producto), botón «Detener», «Reintentar» y WhatsApp en errores, conversación nueva, enlaces internos clicables (solo rutas del sitio y wa.me; el texto del modelo nunca se inserta como HTML), conversación guardada en `sessionStorage`, pantalla completa en celular, `Esc` cierra.
- **Pruebas con la API real:** respuestas correctas en 2–4 s (producto desde su ficha, cambio de talla con $16.000, rechazo de un intento de sacar el prompt + receta fuera de tema). Caché: 2.241 tokens leídos de caché por mensaje y ~20 sin caché → aprox. US$0,0013 por respuesta.
- Verificación: `tsc` y `eslint` sin errores, `npm test` 63/63 (12 nuevos). No se revisó visualmente en el navegador.

## 2026-10-05: cuentas de clientes y roles (fase 1, simulada)

- Supabase volvió a resolver, pero `SUPABASE_SECRET_KEY` da 401 (la clave pública sí funciona; las tablas `usuarios` y `productos` existen). Hay que copiar una secret key nueva. Por pedido del usuario, **todo se hace en simulación** hasta que avise.
- Decisiones: login propio; un solo «Ingresar» (personal → panel, cliente → /cuenta); cupones sí (fase 4); roles Administrador, Vendedor, Bodega y Marketing.
- `DATOS_SIMULADOS=true` (`src/lib/modo-datos.ts`): cuentas, clientes y pedidos en memoria (`identidad/infrastructure/simulacion.ts`, `pedidos/infrastructure/repositorios.ts`). Se reinician con `npm run dev`. El único punto para pasar a Supabase es `identidad/infrastructure/repositorios.ts` (+ migración `003_clientes_y_roles.sql`, aún sin correr).
- `DEV_BYPASS_AUTH=false` en `.env.local` (se quitó la línea duplicada): el login es real con las cuentas de prueba.
- Permisos en una sola tabla: `identidad/domain/permisos.ts`. La usan el menú lateral y `proxy.ts` (páginas → redirige; APIs → 403; lo no listado se niega).
- Token de cliente con otro `aud` ("tienda") y cookie `cf_cliente` (30 días); no sirve en el panel.
- Tienda: `/ingresar` (con botones de cuentas demo), `/registro`, `/cuenta` (datos + Mis pedidos con línea de tiempo, artículos, totales, guía y WhatsApp). Encabezado con «Ingresar»/nombre; «Seguimiento de pedido» → «Mis pedidos».
- Panel: módulo «Usuarios y roles» (crear, cambiar rol, activar/desactivar, cambiar contraseña; nadie se quita su propio acceso de Administrador y siempre queda uno activo).
- Ícono del asistente IA: `components/store/IconoAsistente.tsx` y `public/asistente-ia.svg` (burbuja azul noche con borde dorado, balón y destello); usado en el botón y la cabecera del chat.
- Verificación: `tsc` sin errores; `npm test` 80/80; prueba en el servidor de los 4 roles + cliente + registro + anónimo, con los accesos esperados. `eslint src` marca 2 errores **previos** (no tocados): `(store)/confirmacion/page.tsx` y `app/layout.tsx`.

## 2026-10-05: pedidos reales y pasarela de pagos (fase 2, simulada)

- Módulo `src/modules/pedidos/`: dominio (`pedido.ts`: validar checkout con precios del catálogo —nunca del navegador—, totales y envío $18.000 en el servidor, estados y transiciones, pagos), aplicación (`pedidos.ts`) y simulación en memoria (`infrastructure/repositorios.ts`, 7 pedidos de prueba).
- Flujo: contra entrega → «Alistamiento» directo; tarjeta/PSE/Nequi y abono → «Pendiente de pago» hasta pagar en la **pasarela simulada** (`infrastructure/pasarela-simulada.ts`, imita Wompi; tarjeta 4242… aprueba, 4000…0002 rechaza; PSE/Nequi dejan elegir). Abono cobra el 50 %.
- Cada pedido tiene `claveAcceso` aleatoria para verlo/pagarlo sin cuenta (enlace de pago y confirmación); el panel nunca la recibe.
- Estados: Pendiente de pago → Alistamiento → Enviado (con guía) → Entregado; Cancelado desde pendiente o alistamiento. Al entregar, el pago queda «Pagado».
- APIs: `POST /api/tienda/pedidos`, `GET /api/tienda/pedidos/[id]`, `POST /api/tienda/pedidos/[id]/pago` (públicas); `GET /api/pedidos`, `PATCH /api/pedidos/[id]` (Administrador, Vendedor, Bodega).
- Tienda: checkout real (datos del cliente con sesión, errores por campo), `/pago/[id]` (pasarela de prueba), `/confirmacion` con datos reales, «Pagar ahora» en Mis pedidos. El carrito ahora guarda el `slug` del producto.
- Panel: Pedidos con filtros por estado, búsqueda, actualización cada 20 s y panel de detalle con historial y acciones.
- Ícono IA: `public/asistente-ia.png` (imagen del usuario sin fondo, 256 px). Alternativa sin logos: `public/asistente-ia.svg`. Ojo: la imagen del usuario muestra el logo de Adidas en la camiseta.
- Verificación: `npm test` 91/91; prueba en servidor de compra con pago rechazado y aprobado, doble pago bloqueado, invitado contra entrega, transición inválida, Bodega enviando/entregando, Marketing sin acceso (403), y la clienta viendo el estado final con guía.

## 2026-10-05: GOALIX, cierre de sesión y submódulos de «Mi cuenta» (simulado)

- Chat: el botón flotante es solo el robot (78 px, 64 px en celular) con el saludo «¡Hola! Soy GOALIX ⚽ ¿En qué puedo ayudarte hoy?» al pasar el cursor o con foco. El asistente se llama GOALIX (cabecera, bienvenida y prompt). Indicador de desarrollo de Next movido a la izquierda (`next.config.ts`).
- Encabezado de la tienda: menú de la cuenta con Mis pedidos, Mis datos, Direcciones, Formas de pago, Cambiar contraseña y Cerrar sesión.
- El personal, al cerrar sesión (o sin sesión en el panel), va a `/ingresar`.
- «Mi cuenta» (`/cuenta`, secciones con `#pedidos`, `#datos`, `#direcciones`, `#pagos`, `#seguridad`): pedidos con filtro (todos / en curso / terminados); datos (nombre, celular; el correo no se cambia); contraseña (exige la actual, limitada a 8 intentos/15 min); hasta 5 direcciones con una principal; hasta 5 tarjetas guardadas con solo marca y últimos 4 dígitos (nunca el número completo ni el CVC).
- Checkout: elige una dirección guardada (la principal viene puesta). Pasarela: «Mis tarjetas» paga con una tarjeta guardada pidiendo solo el CVC (solo tarjetas del cliente con sesión).
- Código: `lib/tarjetas.ts` (Luhn, marca, vencimiento), `identidad/domain/perfil-tipos.ts` (tipos seguros para el navegador), `perfil-cliente.ts` (reglas), `application/mi-cuenta.ts`, rutas `/api/cuenta/{datos,password,direcciones,tarjetas}`, componentes en `components/store/cuenta/`.
- Arreglo: tildes dañadas en «Usuarios y roles» por una edición con PowerShell.
- Verificación: `npm test` 98/98; prueba en servidor de todos los submódulos, errores por campo y pago con tarjeta guardada.

## 2026-10-05: GOALIX como vendedor con acciones

- Prompt (`asistente/domain/prompt.ts`) con las instrucciones de venta del usuario, condensadas: usar el contexto de toda la conversación, preguntar solo lo indispensable, respetar presupuesto (alternativa más cara solo diciendo cuánto se pasa), alternativas si está agotado, comparar sin recomendar lo más caro, venta sugestiva sin insistir, tallas con cautela (no hay guía de medidas), no inventar promociones (hoy no hay) ni prometer avisos de reposición.
- Catálogo del prompt con disponibilidad desde el inventario: agotado (stock 0), pocas unidades (≤5) o disponible.
- Acciones (`asistente/domain/acciones.ts`): herramientas `abrir_pagina` (lista cerrada de rutas + `/producto/<slug>`) y `agregar_al_carrito` (no ofrece agotados). No se ejecutan en el servidor: se validan y llegan al chat como botones (separador `\u001e` + JSON al final del stream). El carrito se llena con el precio del catálogo, no del chat; al modelo solo vuelve el texto.
- Prueba real: Barcelona visitante → avisa agotado y ofrece alternativas; presupuesto de $125.000 recordando «club europeo» → Bayern retro $120.000; «llévame a mis pedidos» → botón; «la de Millonarios talla M» → botón de agregar. `npm test` 102/102.

## 2026-10-06: agotados con alternativas

- GOALIX: regla reforzada; ante un agotado siempre recomienda 1 o 2 alternativas disponibles con precio y botón para verlas (probado con Barcelona visitante → Real Madrid y Manchester City con botones).
- Página de producto: si el inventario marca stock 0, muestra «Agotada por ahora» con 3 alternativas (misma categoría y precio cercano) y desactiva «Agregar al carrito» y «Comprar ahora».

## 2026-10-06: Inicio y Catálogo separados, ofertas simuladas y compra con cuenta

- Datos simulados: `data/products.ts` con `liga` y lista `LIGAS` (LaLiga, Premier, Ligue 1, Bundesliga, Liga BetPlay, Selecciones); `data/promociones.ts` con 3 promociones con fecha (Bayern −20 %, Millonarios −15 %, PSG −10 %) y 3 banners. `lib/precios.ts` (`precioFinal`) calcula el precio con descuento vigente y lo usan tarjetas, ficha, carrito, GOALIX y el servidor al crear el pedido (prueba: Bayern se cobra $96.000).
- Inicio (`/`): carrusel de banners (6 s, pausa al pasar el cursor, flechas y puntos), «Ofertas de la semana», «Compra por liga», «Novedades 2027» y bloque de confianza.
- Catálogo (`/catalogo`): tarjetas grandes por liga (clubes, cantidad y «desde $X») y tarjetas por club. `/catalogo/[liga]` y `/catalogo/todas`: búsqueda, «En oferta», «Personalizable» y orden por precio. Menú: Catálogo y Ofertas.
- `components/store/ProductCard.tsx`: precio tachado, % de descuento y «Agotada».
- GOALIX conoce liga y promociones vigentes y puede abrir el catálogo por liga y las ofertas.
- Comprar exige cuenta: `/checkout` redirige a `/ingresar?volver=/checkout` (mensaje y enlace a registro que vuelve al pago); `POST /api/tienda/pedidos` responde 401 sin sesión de cliente. El carrito se guarda en `sessionStorage` para no perderse al ingresar.
- Verificación: `npm test` 104/104; páginas 200; sin sesión `/checkout` → 307 y pedido → 401; capturas de Inicio y Catálogo revisadas.

## 2026-10-06: módulo «Tienda online» (parametrización, simulado)

- Módulo `src/modules/tienda/`: tipos (`domain/types.ts`), reglas y validaciones (`domain/reglas.ts`: producto, liga, oferta, cupón, banner; mejor oferta vigente; precio final; cupones; vista pública sin costo ni stock), aplicación (`application/tienda.ts`) y repositorio en memoria (`infrastructure/repositorio.ts`, sembrado desde `src/data/*`, imágenes en memoria).
- Panel `/panel/tienda` (Administrador y Marketing), con pestañas:
  - Productos: crear/editar (código, nombre, club, liga, categoría, etiqueta, precio, costo con margen, stock, descripción, personalizable, retro, visible), hasta 6 fotos (JPG/PNG/WEBP ≤ 2 MB, se valida la firma real del archivo), elegir principal, ocultar/mostrar. No se borran.
  - Ligas: crear/editar/eliminar (si no tienen productos), colores de la tarjeta con vista previa, orden y visibilidad.
  - Ofertas: % por productos, liga o toda la tienda, con fechas; estado Activa/Programada/Vencida/Pausada. Se aplica la de mayor descuento.
  - Cupones: % o valor fijo, compra mínima, vencimiento, usos máximos y conteo de usos.
  - Banners: textos, enlace (solo rutas internas), colores, insignia, imagen de fondo opcional, orden y fechas, con vista previa.
- APIs: públicas `GET /api/tienda/catalogo`, `GET /api/tienda/imagenes/[id]`, `POST /api/tienda/cupones/validar`; panel `GET /api/admin/tienda`, `POST /api/admin/tienda/[coleccion]`, `PATCH|DELETE /api/admin/tienda/[coleccion]/[id]`, `POST|PATCH /api/admin/tienda/imagenes`.
- La tienda (Inicio, Catálogo, liga, producto con galería), el carrito, GOALIX y el cobro del pedido leen ahora de esta fuente. El pago tiene campo de cupón; el servidor recalcula subtotal, descuento y total, suma el uso del cupón y descuenta stock. Se eliminó `lib/precios.ts`.
- Pendiente: el módulo Inventario del panel todavía lee `src/data/inventory.ts` (unificar).
- Verificación: `npm test` 111/111; prueba en servidor: permisos (Vendedor 403, Marketing 200), liga Serie A + Juventus nueva con foto, imagen falsa rechazada, oferta por liga −25 % (precio público $105.000, sin exponer costo), banner con enlace externo rechazado, cupón GOL20 (−$20.000, total $103.000, segundo uso rechazado), stock 8 → 7.

## 2026-10-06: imágenes de internet, escudos y banners estilo Disney+

- Imágenes: productos, ligas y banners aceptan fotos subidas o **URL https de internet** (`RefImagen`; se rechaza http, javascript: y data:). Fotos iniciales de **Wikimedia Commons con licencia CC BY / CC BY-SA** (`src/data/imagenes-libres.ts`, con autor, licencia y enlace); el crédito se muestra en cada imagen (obligatorio por la licencia) y en el pie de página.
- Adaptables: componente `components/store/Imagen.tsx` con `object-fit: cover`, encuadre configurable (`posicion`) y `srcset` 500/960/1280/1920 px para miniaturas de Wikimedia (tarjeta pequeña baja ~500 px; banner, 1920 px Full HD).
- Banners estilo Disney+ (`BannerCarrusel.tsx`): tarjetas grandes redondeadas a todo el ancho, vecinas asomándose, foto a pantalla completa, degradado para leer el texto, barra de progreso en el punto activo, flechas al pasar el cursor, deslizar con el dedo y flechas del teclado; en celular formato vertical. Personalizable desde el panel: imagen (URL o subida), encuadre, % de oscurecido, alineación del texto, colores, botón, orden y fechas, con vista previa.
- Escudos: «Por club» muestra el escudo de cada club (`escudo` en el producto, editable por URL). Si un producto no tiene foto coherente, la tarjeta y la ficha muestran su escudo. PSG, Bayern, Millonarios, Nacional y FCF: dominio público en Commons. **Real Madrid, Barcelona y Manchester City vienen de Wikipedia como uso legítimo: son marcas registradas; reemplazar o licenciar antes de vender de verdad.**
- Coherencia imagen/título: fotos de camiseta reales para Real Madrid, Barça, City y PSG; Millonarios, Nacional, Selección y Bayern retro usan su escudo (no había foto libre de esas camisetas); banner de Millonarios con foto de Millonarios en El Campín; cada liga con su estadio.
- Verificación: `npm test` 112/112; capturas de Inicio y Catálogo revisadas.

## 2026-10-14: WhatsApp nuevo y saludo de GOALIX

- WhatsApp de la tienda cambiado a **322 317 6175** (`wa.me/573223176175`) en todo el sitio, GOALIX y tests (12 archivos).
- GOALIX saluda solo al entrar o recargar la tienda (no al navegar entre páginas).
- Supabase: la `SUPABASE_SECRET_KEY` de `.env.local` sigue respondiendo 401; falta pegar una secret key nueva (Settings → API Keys).

## 2026-10-14: conexión a Supabase

- El usuario ejecutó (con `!`) un script de Playwright que inició sesión en el panel de Supabase (captcha resuelto a mano) y escribió en `.env.local` la URL y las claves del proyecto **camiseta-futbolera-dev** (`zgrpjqgphsgtcaxmxekv`). También existe **camiseta-futbolera-prod** (`ukncdrvsqwdsnebmjlmt`).
- **La conexión funciona.** El 401 que veíamos no era la clave: Supabase rechaza las *secret keys* cuando el User-Agent parece de navegador (PowerShell manda «Mozilla…»). Desde Node (la app) no pasa; para probar desde PowerShell usar `-UserAgent "node"`.
- La base ya tiene un **esquema propio, distinto a las migraciones 002/003 del repo** (que no se corrieron): `productos` (club_id, temporada, versión, tipo_equipacion, precio_venta, imagen_url…), `variantes_producto` (talla, sku), `inventario`, `clubes` (escudo_url), `ligas`, `paises`, `proveedores`, `pedidos`, `pedido_items`, `compras_lote(_items)`, `compras_individuales`, `lista_compras_automatica`, `perfiles`, `usuarios` y vistas `catalogo_publico`, `inventario_detallado`, `vista_margen_ventas`. Todo vacío salvo 1 usuario (Administrador) y 1 perfil.
- Falta para lo construido en simulación: clientes, promociones, cupones, banners, direcciones/tarjetas guardadas, estado de pago e historial de pedidos. Decidir: adaptar la app a este esquema + migración complementaria.

## 2026-10-14: proyecto nuevo de Supabase (conexión directa a PostgreSQL)

- El usuario indicó que el proyecto a usar es **`uwitjfaamhhdvwpxpwnt`** y entregó la cadena de conexión PostgreSQL.
- La conexión directa (`db.<ref>.supabase.co`) es **solo IPv6** y esta red no tiene IPv6 → se usa el **pooler en modo sesión (IPv4)**: `aws-0-us-east-1.pooler.supabase.com:5432`, usuario `postgres.<ref>`. Guardado en `.env.local` como `DATABASE_URL` (ignorado por git).
- Conecta: PostgreSQL 17.11. **La base está vacía** (sin tablas en `public`).
- `NEXT_PUBLIC_SUPABASE_URL` y las claves de `.env.local` todavía son del proyecto anterior (`zgrpjqgphsgtcaxmxekv`).

## 2026-10-16: la app pasa de simulación a Supabase

- Proyecto de Supabase en uso: **Proyect_Grade** (`uwitjfaamhhdvwpxpwnt`). `.env.local` ya apunta a él: URL, publishable key, secret key y `DATABASE_URL` (pooler IPv4). `DATOS_SIMULADOS=false`.
- Migración `supabase/migrations/001_esquema_app.sql` aplicada (13 tablas: usuarios, clientes, direcciones, tarjetas_guardadas, ligas, productos, imagenes, promociones, cupones, banners, pedidos, pedido_items, pedido_historial).
- Repositorios nuevos con la misma interfaz que la simulación: `identidad/infrastructure/repositorios-pg.ts` (personal, clientes, direcciones y tarjetas), `pedidos/infrastructure/pedidos-pg.ts` (pedido + artículos + historial en una transacción) y `tienda/infrastructure/repositorio-pg.ts`. Un solo punto elige: `usarSimulacion() ? simulado : pg`.
- Las funciones de la tienda (`catalogoPublico`, `validarCuponPara`, `registrarVenta`, imágenes) ya eran asíncronas; se corrigieron los llamadores que no hacían `await` (chat, cupones, pedidos, imágenes).
- Script `npm run db:sembrar`: carga ligas, productos, ofertas, cupones, banners, cuentas de prueba (contraseña de las demo en `simulacion.ts`), Laura con direcciones y tarjeta, y 7 pedidos de ejemplo. Se puede repetir sin duplicar cuentas.
- Verificación: `tsc` sin errores; `npm test` 112/112; contra Supabase real: catálogo, login de cliente y de personal, credenciales malas rechazadas, panel de pedidos y usuarios, compra contra entrega (CF-00843, stock 12 → 11). El pedido de prueba se borró y el stock se restauró.
- Pendiente de seguridad: las cuentas demo tienen contraseña conocida; cambiarlas o borrarlas antes de publicar. Rotar la secret key y la `ANTHROPIC_API_KEY`, y cambiar la contraseña de la base (quedaron visibles en el chat).

## 2026-10-16: todos los módulos del panel sobre Supabase

- Migración `002_operacion.sql`: `productos.proveedor`, `pedidos.canal` y `pedidos.documento`, y las tablas `compras` y `lista_compras` (RLS activo). Nuevo módulo `src/modules/operacion/` (dominio puro + consultas a Supabase).
- **Dashboard** y **Reportes**: cifras calculadas en la base (ventas de 30 días contra los 30 anteriores, pedidos activos, margen, ventas de 7 días y de 8 semanas, más vendidos, categorías, mejor margen, proveedores, alertas). Reportes → «Exportar Excel» descarga un CSV de pedidos (`/api/reportes/exportar`).
- **Inventario y compras**: tabla real con búsqueda y filtros, «Editar» (costo, stock, proveedor) y «Registrar compra» (suma stock, deja costo y proveedor vigentes y puede resolver un ítem de la lista; las unidades que ya estaban vendidas no entran a bodega). APIs `/api/inventario`, `/api/inventario/[id]`, `/api/inventario/compras`.
- **Lista de compras**: se llena sola cuando una venta (web o manual) pide más unidades que el stock (`registrarFaltantes`, antes de descontar). Estados Pendiente / Conseguido / No conseguido. APIs `/api/lista-compras`.
- **Venta manual**: formulario real (canal, cliente, varios productos, pago anticipado / abono 50 % / contra entrega); crea el pedido en Alistamiento, descuenta stock y envía lo que falte a la lista. Precios del catálogo, no del formulario; en punto físico no hay envío. API `/api/venta-manual` (solo Administrador y Vendedor).
- **Informes con IA**: ya leen los datos reales del sistema (`fuente: "sistema"`); se quitó `datos-ejemplo.ts`.
- Permisos: `/api/inventario` y `/api/lista-compras` (Administrador, Vendedor, Bodega), `/api/venta-manual` (Administrador, Vendedor), `/api/reportes` (Administrador, Marketing).
- Cuenta superadmin: `npm run db:crear-admin -- correo "Nombre" [Rol]` crea o actualiza una cuenta del personal con una contraseña aleatoria que se imprime una sola vez.
- Verificación: `tsc` sin errores, `npm test` 125/125 (13 nuevos), `eslint src` solo con 2 avisos previos (`layout.tsx`, `ThemeToggle.tsx`). Contra Supabase real: venta manual sin stock (aparece en la lista), compra que resuelve el ítem (5 compradas → 3 a bodega), edición y validaciones del inventario, permisos por rol (Bodega 403 en venta manual, Marketing 403 en inventario) e informe de IA con datos reales. Los datos de prueba se borraron.
- Turbopack se cayó una vez con un pánico interno (`inner_of_upper_lost_followers`); se arregló borrando `.next` y reiniciando `npm run dev`.

## Pendientes

- [ ] Quitar el log temporal de `claude-completador.ts` y `route.ts` cuando ya no haga falta (está marcado `TEMPORAL (solo dev)`).
- [ ] `.env.local` tiene `DEV_BYPASS_AUTH` repetido dos veces; dejar una sola línea.
- [ ] Quitar el atajo `DEV_BYPASS_AUTH` (la base ya está lista; ver comentario en `dev-bypass.ts`).
- [ ] Hacer commit de los cambios.


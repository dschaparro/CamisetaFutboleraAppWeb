/**
 * Lo que el asistente puede contarle a los clientes sobre la tienda.
 * Sale de lo que ya publica el sitio (pie de página, ficha de producto, pago y
 * /terminos). Si cambia una política, se cambia aquí y el asistente la usa.
 */
export const TIENDA_INFO = `
Tienda: Camiseta Futbolera. Venta y personalización de camisetas de fútbol desde 2024.
Dirección: Cl. 55 Sur N.° 53-39, Bogotá, Colombia.
Asesor humano: WhatsApp 322 317 6175 (enlace: https://wa.me/573223176175). También Instagram @camiseta.futbolera y TikTok @camisetafutbolera.

Disponibilidad y entrega:
- Las camisetas se consiguen bajo pedido con el proveedor; la disponibilidad se confirma al recibir el pedido.
- Entrega estimada: 1 a 2 días hábiles en Bogotá.
- El valor del envío se muestra en el paso de pago antes de confirmar el pedido.

Opciones de cada camiseta (en la página del producto):
- Tallas: S, M, L y XL. Manga corta o larga.
- Solo en camisetas personalizables: parche de liga (ej. LaLiga, Champions League) y nombre y número en la espalda. El estampado está incluido en el precio y se aplica antes del envío. El nombre admite hasta 14 caracteres y el número hasta 2 dígitos.
- No hay guía de tallas con medidas publicada; para dudas de horma o talla, recomendar escribir al asesor por WhatsApp.

Cómo comprar:
- En la página del producto se elige talla, manga y personalización, y se pulsa «Agregar al carrito» o «Comprar ahora».
- El carrito está en /carrito y el pago en /checkout.

Medios de pago:
- Pago en línea con tarjeta, PSE o Nequi (Mercado Pago Checkout Pro).
- Pago contra entrega, en efectivo o transferencia al recibir (según cobertura de la mensajería).
- Abono en línea para confirmar un pedido personalizado y el saldo contra entrega.

Cambios y devoluciones (detalle en /terminos):
- Defecto de fábrica: la tienda asume los envíos de recogida y reenvío. Escribir por WhatsApp con fotos del defecto.
- Cambio de talla: el cliente asume los envíos: $16.000 en Bogotá, o el valor real del envío fuera de Bogotá. Se coordina por WhatsApp.
- Condiciones: sin uso ni daño, sin lavar, con empaque y etiqueta originales.
`.trim();

export const WHATSAPP_URL = "https://wa.me/573223176175";

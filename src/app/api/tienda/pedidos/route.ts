import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientKey, errorJson, sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { crearPedido } from "@/modules/pedidos/application/pedidos";
import { PedidoInvalidoError } from "@/modules/pedidos/domain/pedido";
import { registrarVenta, validarCuponPara } from "@/modules/tienda/application/tienda";
import { CuponInvalidoError } from "@/modules/tienda/domain/reglas";
import { registrarFaltantes } from "@/modules/operacion/infrastructure/lista-compras-pg";
import { catalogoVenta, pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";

/** Checkout: crea el pedido (con o sin cuenta). Devuelve a dónde seguir: pasarela o confirmación. */
export async function POST(request: Request) {
  if (!allowAttempt(`pedido:${clientKey(request)}`, 10, 10 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados pedidos seguidos. Espera unos minutos.");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  // Para comprar hay que tener cuenta: así el pedido queda en «Mis pedidos».
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Ingresa o crea tu cuenta para finalizar la compra.");
  const codigoCupon = typeof body === "object" && body !== null && typeof (body as { cupon?: unknown }).cupon === "string" ? (body as { cupon: string }).cupon.trim() : "";
  let cuponId: string | null = null;
  try {
    const pedido = await crearPedido(body, {
      repo: pedidosRepo(),
      catalogo: await catalogoVenta(),
      clienteId: sesion.sub,
      ahora: new Date(),
      claveAcceso: randomBytes(16).toString("hex"),
      cupon: codigoCupon
        ? async (subtotal) => {
            const r = await validarCuponPara(codigoCupon, subtotal);
            cuponId = r.cupon.id;
            return r.descuento;
          }
        : undefined,
    });
    // Lo que no alcance con el stock va a la lista de compras (antes de descontar).
    await registrarFaltantes(pedido).catch((e) => console.error("[lista-compras]", e));
    // Descuenta stock y suma el uso del cupón.
    await registrarVenta(pedido.items, cuponId);
    const q = `pedido=${encodeURIComponent(pedido.id)}&k=${pedido.claveAcceso}`;
    const siguiente =
      pedido.estado === "Pendiente de pago" ? `/pago/${encodeURIComponent(pedido.id)}?k=${pedido.claveAcceso}` : `/confirmacion?${q}`;
    return NextResponse.json({ id: pedido.id, siguiente }, { status: 201 });
  } catch (err) {
    if (err instanceof PedidoInvalidoError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof CuponInvalidoError) return errorJson(400, "CUPON_INVALIDO", err.message, { cupon: err.message });
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", "No pudimos registrar tu pedido en este momento.");
    throw err;
  }
}

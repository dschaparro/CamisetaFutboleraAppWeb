import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { enlazarCarritoInvitado } from "@/modules/pedidos/application/carrito";
import { CarritoInvalidoError, type LineaCarrito } from "@/modules/pedidos/domain/carrito";
import { carritoRepo } from "@/modules/pedidos/infrastructure/repositorios";
import { leerAjustesTienda } from "@/modules/tienda/application/tienda";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

function aCartItem(l: LineaCarrito) {
  return {
    id: `${l.slug}-${l.talla}-${l.manga}-${l.personalizacion}`,
    slug: l.slug,
    club: l.club,
    name: l.nombre,
    initials: l.initials,
    cat: l.cat,
    size: l.talla,
    sleeve: l.manga,
    custom: l.personalizacion,
    qty: l.cantidad,
    price: l.precio,
  };
}

/** Fusiona el carrito de invitado (body.items) con el de la cuenta. */
export async function POST(request: Request) {
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Tu sesión terminó. Ingresa de nuevo.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }

  const raw = typeof body === "object" && body !== null ? (body as { items?: unknown }).items : [];

  try {
    const ajustes = await leerAjustesTienda(tiendaRepo());
    const lineas = await enlazarCarritoInvitado(sesion.sub, raw ?? [], carritoRepo(), {
      maxProductos: ajustes.carritoMaxProductos,
      maxCantidad: ajustes.carritoMaxCantidad,
    });
    return NextResponse.json({ items: lineas.map(aCartItem) });
  } catch (err) {
    if (err instanceof CarritoInvalidoError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof PendienteDeBaseDeDatosError) {
      return errorJson(503, "PENDIENTE_BD", "Esta función no está disponible por ahora.");
    }
    throw err;
  }
}

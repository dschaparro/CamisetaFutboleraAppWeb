import { NextResponse } from "next/server";
import { errorJson } from "@/lib/http";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { sesionCliente } from "@/modules/identidad/infrastructure/sesiones";
import { guardarCarrito, obtenerCarrito } from "@/modules/pedidos/application/carrito";
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

async function conSesionCarrito(
  request: Request,
  accion: (clienteId: string, body: unknown) => Promise<unknown>,
  leerCuerpo: boolean,
): Promise<NextResponse> {
  const sesion = await sesionCliente(request);
  if (!sesion) return errorJson(401, "UNAUTHENTICATED", "Tu sesión terminó. Ingresa de nuevo.");

  let body: unknown = null;
  if (leerCuerpo) {
    try {
      body = await request.json();
    } catch {
      return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
    }
  }

  try {
    return NextResponse.json((await accion(sesion.sub, body)) ?? { ok: true });
  } catch (err) {
    if (err instanceof CarritoInvalidoError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof PendienteDeBaseDeDatosError) {
      return errorJson(503, "PENDIENTE_BD", "Esta función no está disponible por ahora.");
    }
    throw err;
  }
}

export async function GET(request: Request) {
  return conSesionCarrito(
    request,
    async (id) => {
      const lineas = await obtenerCarrito(id, carritoRepo());
      return { items: lineas.map(aCartItem) };
    },
    false,
  );
}

export async function PUT(request: Request) {
  return conSesionCarrito(
    request,
    async (id, body) => {
      const raw = typeof body === "object" && body !== null ? (body as { items?: unknown }).items : body;
      const ajustes = await leerAjustesTienda(tiendaRepo());
      const lineas = await guardarCarrito(id, raw, carritoRepo(), {
        maxProductos: ajustes.carritoMaxProductos,
        maxCantidad: ajustes.carritoMaxCantidad,
      });
      return { items: lineas.map(aCartItem) };
    },
    true,
  );
}

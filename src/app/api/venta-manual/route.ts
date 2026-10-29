import { randomBytes } from "node:crypto";
import { catalogoPublico } from "@/modules/tienda/application/tienda";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { listaComprasRepo } from "@/modules/operacion/infrastructure/repos";
import { registrarVentaManual } from "@/modules/pedidos/application/registrar-venta-manual";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function GET() {
  return responder(async () => {
    const { productos } = await catalogoPublico(tiendaRepo());
    return {
      productos: productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precioFinal,
        personalizable: p.personalizable,
        disponibilidad: p.disponibilidad,
      })),
    };
  });
}

export async function POST(request: Request) {
  return responder(async () => {
    const { productos } = await catalogoPublico(tiendaRepo());
    const catalogo = productos.map((p) => ({
      slug: p.id,
      nombre: p.nombre,
      precio: p.precioFinal,
      personalizable: p.personalizable,
    }));
    return registrarVentaManual(await leerJson(request), {
      pedidos: pedidosRepo(),
      tienda: tiendaRepo(),
      listaCompras: listaComprasRepo,
      catalogo,
      ahora: new Date(),
      claveAcceso: randomBytes(16).toString("hex"),
      onFaltantesError: (e) => console.error("[lista-compras]", e),
    });
  }, 201);
}

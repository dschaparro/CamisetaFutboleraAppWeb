import { randomBytes } from "node:crypto";
import { catalogoPublico, registrarVenta } from "@/modules/tienda/application/tienda";
import { responder, leerJson } from "@/modules/operacion/infrastructure/http";
import { registrarFaltantes } from "@/modules/operacion/infrastructure/lista-compras-pg";
import { siguienteId } from "@/modules/pedidos/domain/pedido";
import { armarVentaManual, validarVentaManual } from "@/modules/pedidos/domain/venta-manual";
import { pedidosRepo } from "@/modules/pedidos/infrastructure/repositorios";
import { vistaPanel } from "@/modules/pedidos/application/pedidos";

// Panel: solo Administrador y Vendedor (proxy.ts).

/** Productos para el formulario, incluidos los agotados (se pueden vender y quedan en la lista de compras). */
export async function GET() {
  return responder(async () => {
    const { productos } = await catalogoPublico();
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
    const { productos } = await catalogoPublico();
    const catalogo = productos.map((p) => ({ slug: p.id, nombre: p.nombre, precio: p.precioFinal, personalizable: p.personalizable }));
    const venta = validarVentaManual(await leerJson(request), catalogo);

    const repo = pedidosRepo();
    const id = siguienteId((await repo.listarTodos()).map((p) => p.id));
    const pedido = armarVentaManual(venta, id, new Date(), randomBytes(16).toString("hex"));
    await repo.guardar(pedido);

    // Lo que no alcance con el stock va a la lista de compras (antes de descontar).
    const aLista = await registrarFaltantes(pedido).catch((e) => {
      console.error("[lista-compras]", e);
      return 0;
    });
    await registrarVenta(pedido.items, null);
    return { pedido: vistaPanel(pedido), enListaDeCompras: aLista };
  }, 201);
}

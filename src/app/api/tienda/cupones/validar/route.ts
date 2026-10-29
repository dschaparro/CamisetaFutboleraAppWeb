import { allowAttempt } from "@/modules/identidad/infrastructure/rate-limit";
import { clientKey, errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { catalogoVendible, validarCuponPara } from "@/modules/tienda/application/tienda";
import { responder, leerJson } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function POST(request: Request) {
  if (!allowAttempt(`cupon:${clientKey(request)}`, 20, 10 * 60 * 1000)) {
    return errorJson(429, "RATE_LIMITED", "Demasiados intentos. Espera unos minutos.");
  }
  return responder(async () => {
    const repo = tiendaRepo();
    const body = (await leerJson(request)) as { codigo?: unknown; items?: unknown };
    const productos = await catalogoVendible(repo);
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = items.reduce((s: number, it: { slug?: unknown; cantidad?: unknown }) => {
      const p = productos.find((x) => x.id === it.slug);
      const n = typeof it.cantidad === "number" && Number.isInteger(it.cantidad) && it.cantidad > 0 ? Math.min(it.cantidad, 10) : 0;
      return s + (p ? p.precioFinal * n : 0);
    }, 0);
    const { cupon, descuento } = await validarCuponPara(repo, String(body.codigo ?? ""), subtotal);
    return { codigo: cupon.codigo, descuento, subtotal };
  });
}

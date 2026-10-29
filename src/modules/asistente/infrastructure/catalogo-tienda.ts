import type { ProductoTienda } from "@/modules/asistente/domain/types";
import { catalogoPublico } from "@/modules/tienda/application/tienda";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

/** El mismo catálogo que ve la tienda (parametrizado desde el panel), con ofertas y disponibilidad. */
export async function catalogoTienda(): Promise<ProductoTienda[]> {
  const { productos, ligas } = await catalogoPublico(tiendaRepo());
  return productos.map((p) => ({
    slug: p.id,
    nombre: p.nombre,
    club: p.club,
    categoria: p.categoria,
    liga: ligas.find((l) => l.id === p.ligaId)?.nombre,
    precio: p.precioFinal,
    promocion: p.promocion ? { porcentaje: p.promocion.porcentaje, etiqueta: p.promocion.etiqueta, precioAntes: p.precio, hasta: p.promocion.hasta } : null,
    personalizable: p.personalizable,
    retro: p.retro,
    etiqueta: p.etiqueta,
    disponibilidad: p.disponibilidad,
  }));
}

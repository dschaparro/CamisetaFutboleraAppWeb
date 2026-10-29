import { INVENTORY } from "@/data/inventory";
import { ESCUDOS, IMAGENES_LIBRES as F } from "@/data/imagenes-libres";
import { LIGAS, PRODUCTS } from "@/data/products";
import { PROMOCIONES } from "@/data/promociones";
import { usarSimulacion } from "@/lib/modo-datos";
import { tiendaPg } from "@/modules/tienda/infrastructure/repositorio-pg";
import type {
  Coleccion,
  DatosTienda,
  ImagenGuardada,
  TiendaRepo,
} from "@/modules/tienda/application/puertos";
import type { Banner, Cupon, Liga, Posicion, Producto, Promocion } from "@/modules/tienda/domain/types";

export type { Coleccion, DatosTienda, ImagenGuardada, TiendaRepo };

type Store = {
  productos: Producto[];
  ligas: Liga[];
  promociones: Promocion[];
  cupones: Cupon[];
  banners: Banner[];
  imagenes: Map<string, ImagenGuardada>;
};

/** Foto inicial de cada producto y su encuadre. */
const FOTOS_PRODUCTO: Record<string, { url: string; posicion: Posicion }> = {
  "RM-27T": { url: F.camisetaReal.url, posicion: "top" },
  "FCB-27V": { url: F.camisetaBarca.url, posicion: "center" },
  "MCI-27T": { url: F.camisetaCity.url, posicion: "top" },
  "PSG-27T": { url: F.camisetaPsg.url, posicion: "center" },
  // Millonarios, Nacional, Selección y Bayern retro aún sin foto libre de la camiseta: se muestra su escudo.
};

const FOTOS_LIGA: Record<string, string> = {
  laliga: F.bernabeuExterior.url,
  premier: F.etihad.url,
  ligue1: F.parcPrinces.url,
  bundesliga: F.allianzArena.url,
  betplay: F.atanasio.url,
  selecciones: F.colombiaEstadio.url,
};

function sembrar(): Store {
  const desde = "2026-10-01T00:00:00-05:00";
  const hasta = "2026-12-31T23:59:59-05:00";
  const banner = (b: Omit<Banner, "desde" | "hasta" | "activo">): Banner => ({ ...b, desde, hasta, activo: true });
  return {
    ligas: LIGAS.map((l, i) => ({ ...l, imagen: FOTOS_LIGA[l.id] ?? null, posicion: "center" as const, orden: i + 1, visible: true })),
    productos: PRODUCTS.map((p) => {
      const inv = INVENTORY.find((i) => i.sku === `CF-${p.id}`);
      const foto = FOTOS_PRODUCTO[p.id];
      return {
        id: p.id,
        nombre: p.name,
        club: p.club,
        ligaId: p.liga,
        categoria: p.cat,
        precio: p.price,
        costo: inv?.cost ?? null,
        stock: inv?.stock ?? 10,
        iniciales: p.initials,
        personalizable: p.personalizable,
        retro: p.retro === true,
        etiqueta: p.tag ?? null,
        descripcion: "",
        escudo: ESCUDOS[p.id] ?? null,
        imagenes: foto ? [foto.url] : [],
        posicionImagen: foto?.posicion ?? "center",
        visible: true,
      };
    }),
    promociones: PROMOCIONES.map((p, i) => ({
      id: `promo-${i + 1}`,
      etiqueta: p.etiqueta,
      porcentaje: p.porcentaje,
      alcance: "productos" as const,
      productoIds: [p.slug],
      ligaId: null,
      desde,
      hasta: p.hasta,
      activa: true,
    })),
    cupones: [
      { id: "cupon-1", codigo: "MUNDIAL10", tipo: "porcentaje", valor: 10, minimoCompra: 100000, hasta, usosMaximos: 100, usos: 3, activo: true },
      { id: "cupon-2", codigo: "BIENVENIDA", tipo: "valor", valor: 15000, minimoCompra: 120000, hasta, usosMaximos: null, usos: 0, activo: true },
    ],
    banners: [
      banner({
        id: "banner-temporada", orden: 1, antetitulo: "Temporada 2026/27 · Nueva colección", titulo: "Tu pasión se viste aquí",
        texto: "Camisetas de clubes europeos, selecciones y equipos colombianos, con tu nombre y tu dorsal incluidos en el precio.",
        boton: "Ver catálogo", enlace: "/catalogo", colores: ["#0A1626", "#1B3A66"], acento: "#E3BE45", insignia: "",
        imagen: F.bernabeuInterior.url, posicion: "center", oscurecer: 60, alineacion: "izquierda",
      }),
      banner({
        id: "banner-retro", orden: 2, antetitulo: "Retro week · hasta el 31 de octubre", titulo: "20 % off en camisetas retro",
        texto: "La Bayern Munich 1999 con descuento. Clásicos que nunca pasan de moda.",
        boton: "Ver la oferta", enlace: "/producto/BAY-99R", colores: ["#4A0E10", "#D7282F"], acento: "#FFD166", insignia: "",
        imagen: F.allianzArena.url, posicion: "center", oscurecer: 55, alineacion: "izquierda",
      }),
      banner({
        id: "banner-fpc", orden: 3, antetitulo: "Liga BetPlay", titulo: "Clásico capitalino: 15 % off Millonarios",
        texto: "Personalízala con tu nombre y dorsal sin costo extra. Entrega en 1-2 días hábiles en Bogotá.",
        boton: "Comprar ahora", enlace: "/producto/MFC-26T", colores: ["#0B1E5C", "#2E6FE0"], acento: "#F5C518", insignia: "",
        imagen: F.millonariosCampin.url, posicion: "center", oscurecer: 60, alineacion: "izquierda",
      }),
      banner({
        id: "banner-coleccion", orden: 4, antetitulo: "Personalización incluida", titulo: "Arma tu colección",
        texto: "Seis ligas y selecciones. Elige la tuya y estámpale tu nombre.",
        boton: "Explorar ligas", enlace: "/catalogo", colores: ["#13294B", "#0A1626"], acento: "#E3BE45", insignia: "",
        imagen: F.feriaCamisetas.url, posicion: "center", oscurecer: 65, alineacion: "centro",
      }),
    ],
    imagenes: new Map(),
  };
}

// V2: incluye imágenes y opciones de diseño (se vuelve a sembrar si el servidor tenía la versión anterior).
const global = globalThis as typeof globalThis & { __cfSimTiendaV3?: Store };
function store(): Store {
  global.__cfSimTiendaV3 ??= sembrar();
  return global.__cfSimTiendaV3;
}

export const tiendaSimulada: TiendaRepo = {
  async leer() {
    const s = store();
    return structuredClone({ productos: s.productos, ligas: s.ligas, promociones: s.promociones, cupones: s.cupones, banners: s.banners });
  },
  async guardar(coleccion, lista) {
    (store() as unknown as Record<Coleccion, unknown>)[coleccion] = structuredClone(lista);
  },
  async registrarVenta(items, cuponId) {
    const s = store();
    for (const p of s.productos) {
      const vendidas = items.filter((i) => i.slug === p.id).reduce((n, i) => n + i.cantidad, 0);
      if (vendidas) p.stock = Math.max(0, p.stock - vendidas);
    }
    const c = cuponId ? s.cupones.find((x) => x.id === cuponId) : null;
    if (c) c.usos += 1;
  },
  async imagen(id) {
    return store().imagenes.get(id) ?? null;
  },
  async guardarImagen(id, img) {
    store().imagenes.set(id, img);
  },
  async borrarImagen(id) {
    store().imagenes.delete(id);
  },
};

/** Único punto que decide de dónde salen los datos de la tienda. */
export function tiendaRepo(): TiendaRepo {
  return usarSimulacion() ? tiendaSimulada : tiendaPg;
}

/** Datos iniciales (los mismos de la simulación): los usa el script que llena la base. */
export function datosIniciales(): DatosTienda {
  const s = sembrar();
  return { productos: s.productos, ligas: s.ligas, promociones: s.promociones, cupones: s.cupones, banners: s.banners };
}

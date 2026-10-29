import {
  aplicarCupon,
  bannersVigentes,
  DatosInvalidosError,
  validarAjustes,
  validarBanner,
  validarCupon,
  validarLiga,
  validarProducto,
  validarPromocion,
  validarUrlImagen,
  vistaPublica,
} from "@/modules/tienda/domain/reglas";
import { esUrlExterna, type AjustesTienda, type CatalogoPublico, type Producto } from "@/modules/tienda/domain/types";
import type { ImagenGuardada, TiendaRepo } from "@/modules/tienda/application/puertos";

export class NoExisteError extends Error {
  constructor(que: string) {
    super(`No existe ${que}`);
    this.name = "NoExisteError";
  }
}

function nuevoId(prefijo: string) {
  return `${prefijo}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function catalogoPublico(repo: TiendaRepo, ahora = new Date()): Promise<CatalogoPublico> {
  const d = await repo.leer();
  const ligas = d.ligas.filter((l) => l.visible).sort((a, b) => a.orden - b.orden);
  const productos = d.productos
    .filter((p) => p.visible && ligas.some((l) => l.id === p.ligaId))
    .map((p) => vistaPublica(p, d.promociones, ahora));
  return { productos, ligas, banners: bannersVigentes(d.banners, ahora) };
}

export async function catalogoVendible(repo: TiendaRepo, ahora = new Date()) {
  return (await catalogoPublico(repo, ahora)).productos.filter((p) => p.disponibilidad !== "agotado");
}

export async function validarCuponPara(repo: TiendaRepo, codigo: string, subtotal: number, ahora = new Date()) {
  return aplicarCupon((await repo.leer()).cupones, codigo, subtotal, ahora);
}

export async function registrarVenta(
  repo: TiendaRepo,
  items: { slug: string | null; cantidad: number }[],
  cuponId: string | null,
) {
  await repo.registrarVenta(items, cuponId);
}

export async function imagenGuardada(repo: TiendaRepo, id: string): Promise<ImagenGuardada | null> {
  return repo.imagen(id);
}

export async function guardarImagenSubida(repo: TiendaRepo, id: string, img: ImagenGuardada) {
  await repo.guardarImagen(id, img);
}

export async function borrarImagenSubida(repo: TiendaRepo, id: string) {
  await repo.borrarImagen(id);
}

export async function datosPanel(repo: TiendaRepo) {
  return repo.leer();
}

export async function leerAjustesTienda(repo: TiendaRepo): Promise<AjustesTienda> {
  return repo.leerAjustes();
}

export async function guardarAjustesTienda(repo: TiendaRepo, raw: unknown): Promise<AjustesTienda> {
  const ajustes = validarAjustes(raw);
  await repo.guardarAjustes(ajustes);
  return ajustes;
}

export async function guardarProducto(repo: TiendaRepo, raw: unknown, idExistente: string | null): Promise<Producto> {
  const d = await repo.leer();
  const actual = idExistente ? d.productos.find((p) => p.id === idExistente) : null;
  if (idExistente && !actual) throw new NoExisteError("ese producto");
  const datos = validarProducto(raw, d.ligas, !actual);
  if (!actual && d.productos.some((p) => p.id === datos.id)) throw new DatosInvalidosError({ id: "Ya existe un producto con ese código" });
  const producto: Producto = actual ? { ...actual, ...datos, id: actual.id } : { ...datos, imagenes: [] };
  await repo.guardar("productos", actual ? d.productos.map((p) => (p.id === actual.id ? producto : p)) : [...d.productos, producto]);
  return producto;
}

export async function cambiarImagenesProducto(
  repo: TiendaRepo,
  id: string,
  cambio: { agregar?: string; agregarUrl?: unknown; quitar?: string; principal?: string },
): Promise<Producto> {
  const d = await repo.leer();
  const p = d.productos.find((x) => x.id === id);
  if (!p) throw new NoExisteError("ese producto");
  let imagenes = [...p.imagenes];
  if (cambio.agregarUrl !== undefined) {
    const url = validarUrlImagen(cambio.agregarUrl);
    if (!url || url === "invalida") throw new DatosInvalidosError({ url: "Pega una URL https de una imagen (ej. https://…/foto.jpg)" });
    cambio = { ...cambio, agregar: url };
  }
  if (cambio.agregar) {
    if (imagenes.length >= 6) throw new DatosInvalidosError({ imagenes: "Máximo 6 imágenes por producto" });
    imagenes.push(cambio.agregar);
  }
  if (cambio.quitar) {
    imagenes = imagenes.filter((x) => x !== cambio.quitar);
    if (!esUrlExterna(cambio.quitar)) await repo.borrarImagen(cambio.quitar);
  }
  if (cambio.principal && imagenes.includes(cambio.principal)) imagenes = [cambio.principal, ...imagenes.filter((x) => x !== cambio.principal)];
  const nuevo = { ...p, imagenes };
  await repo.guardar("productos", d.productos.map((x) => (x.id === id ? nuevo : x)));
  return nuevo;
}

export async function guardarLiga(repo: TiendaRepo, raw: unknown, idExistente: string | null) {
  const d = await repo.leer();
  const actual = idExistente ? d.ligas.find((l) => l.id === idExistente) : null;
  if (idExistente && !actual) throw new NoExisteError("esa liga");
  const liga = { ...validarLiga(raw, !actual), ...(actual ? { id: actual.id } : {}) };
  if (!actual && d.ligas.some((l) => l.id === liga.id)) throw new DatosInvalidosError({ id: "Ya existe una liga con ese código" });
  await repo.guardar("ligas", actual ? d.ligas.map((l) => (l.id === actual.id ? liga : l)) : [...d.ligas, liga]);
  return liga;
}

export async function eliminarLiga(repo: TiendaRepo, id: string) {
  const d = await repo.leer();
  if (!d.ligas.some((l) => l.id === id)) throw new NoExisteError("esa liga");
  if (d.productos.some((p) => p.ligaId === id)) {
    throw new DatosInvalidosError({ liga: "Esta liga tiene productos. Muévelos a otra liga u oculta la liga." });
  }
  await repo.guardar("ligas", d.ligas.filter((l) => l.id !== id));
}

export async function guardarPromocion(repo: TiendaRepo, raw: unknown, idExistente: string | null) {
  const d = await repo.leer();
  if (idExistente && !d.promociones.some((p) => p.id === idExistente)) throw new NoExisteError("esa oferta");
  const promo = { ...validarPromocion(raw, d.productos, d.ligas), id: idExistente ?? nuevoId("promo") };
  await repo.guardar("promociones", idExistente ? d.promociones.map((p) => (p.id === idExistente ? promo : p)) : [...d.promociones, promo]);
  return promo;
}

export async function guardarCupon(repo: TiendaRepo, raw: unknown, idExistente: string | null) {
  const d = await repo.leer();
  const actual = idExistente ? d.cupones.find((c) => c.id === idExistente) : null;
  if (idExistente && !actual) throw new NoExisteError("ese cupón");
  const cupon = { ...validarCupon(raw, d.cupones, idExistente), id: actual?.id ?? nuevoId("cupon"), usos: actual?.usos ?? 0 };
  await repo.guardar("cupones", actual ? d.cupones.map((c) => (c.id === actual.id ? cupon : c)) : [...d.cupones, cupon]);
  return cupon;
}

export async function guardarBanner(repo: TiendaRepo, raw: unknown, idExistente: string | null) {
  const d = await repo.leer();
  const actual = idExistente ? d.banners.find((b) => b.id === idExistente) : null;
  if (idExistente && !actual) throw new NoExisteError("ese banner");
  const datos = validarBanner(raw);
  const banner = {
    ...datos,
    id: actual?.id ?? nuevoId("banner"),
    imagen: datos.imagen ?? ((raw as { imagen?: unknown })?.imagen === undefined ? (actual?.imagen ?? null) : null),
  };
  await repo.guardar("banners", actual ? d.banners.map((b) => (b.id === actual.id ? banner : b)) : [...d.banners, banner]);
  return banner;
}

export async function imagenBanner(repo: TiendaRepo, id: string, imagenId: string | null) {
  const d = await repo.leer();
  const b = d.banners.find((x) => x.id === id);
  if (!b) throw new NoExisteError("ese banner");
  if (b.imagen && b.imagen !== imagenId && !esUrlExterna(b.imagen)) await repo.borrarImagen(b.imagen);
  await repo.guardar("banners", d.banners.map((x) => (x.id === id ? { ...x, imagen: imagenId } : x)));
}

export async function eliminar(repo: TiendaRepo, coleccion: "promociones" | "cupones" | "banners", id: string) {
  const d = await repo.leer();
  const lista = d[coleccion] as { id: string; imagen?: string | null }[];
  const item = lista.find((x) => x.id === id);
  if (!item) throw new NoExisteError("ese elemento");
  if (item.imagen && !esUrlExterna(item.imagen)) await repo.borrarImagen(item.imagen);
  await repo.guardar(coleccion, lista.filter((x) => x.id !== id) as never);
}

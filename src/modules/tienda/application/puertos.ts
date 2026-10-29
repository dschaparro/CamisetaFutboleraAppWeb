import type { Banner, Cupon, Liga, Producto, Promocion } from "@/modules/tienda/domain/types";

export type ImagenGuardada = { tipo: string; datos: Buffer };

export type DatosTienda = {
  productos: Producto[];
  ligas: Liga[];
  promociones: Promocion[];
  cupones: Cupon[];
  banners: Banner[];
};

export type Coleccion = keyof DatosTienda;

export type TiendaRepo = {
  leer(): Promise<DatosTienda>;
  guardar<K extends Coleccion>(coleccion: K, lista: DatosTienda[K]): Promise<void>;
  registrarVenta(items: { slug: string | null; cantidad: number }[], cuponId: string | null): Promise<void>;
  imagen(id: string): Promise<ImagenGuardada | null>;
  guardarImagen(id: string, img: ImagenGuardada): Promise<void>;
  borrarImagen(id: string): Promise<void>;
};

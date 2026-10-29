/** Forma de los datos de negocio que alimentan informes (sin I/O). */

export type FuenteDatos = "ejemplo" | "sistema";

export type PedidoFuente = {
  id: string;
  items: number;
  total: number;
  pago: string;
  estado: string;
};

export type ProductoInventarioFuente = {
  nombre: string;
  sku: string;
  proveedor: string;
  costo: number;
  precio: number;
  stock: number;
};

export type ItemListaFuente = {
  producto: string;
  variante: string;
  origen: string;
  estado: string;
};

export type ProductoCatalogoFuente = {
  club: string;
  categoria: string;
  retro: boolean;
};

export type FuentesNegocio = {
  fuente: FuenteDatos;
  pedidos: PedidoFuente[];
  inventario: ProductoInventarioFuente[];
  listaCompras: ItemListaFuente[];
  catalogo: ProductoCatalogoFuente[];
};

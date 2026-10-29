import type { FuentesNegocio } from "@/modules/operacion/domain/fuentes";
import type {
  CambiosInventario,
  CompraNueva,
  EstadoLista,
  FilaInventario,
} from "@/modules/operacion/domain/operacion";
import type { Pedido } from "@/modules/pedidos/domain/types";

export type ResumenInventario = {
  unidades: number;
  pendientesPorConseguir: number;
  proveedores: number;
  costoPromedio: number | null;
};

export type InventarioListado = {
  productos: FilaInventario[];
  resumen: ResumenInventario;
  proveedores: string[];
};

export type CompraRegistrada = {
  id: number;
  producto: string;
  cantidad: number;
  costoUnitario: number;
  proveedor: string;
  stockResultante: number;
};

export type InventarioRepo = {
  listar(): Promise<InventarioListado>;
  actualizar(id: string, cambios: CambiosInventario): Promise<FilaInventario>;
  registrarCompra(c: CompraNueva): Promise<CompraRegistrada>;
};

export type ItemLista = {
  id: number;
  productoId: string | null;
  producto: string;
  variante: string;
  personalizacion: string;
  cantidad: number;
  origen: string;
  pedidoId: string | null;
  estado: EstadoLista;
  nota: string | null;
  creadaEn: string;
};

export type ListaComprasRepo = {
  listar(): Promise<ItemLista[]>;
  cambiarEstado(id: number, estado: EstadoLista, nota: string | null): Promise<ItemLista>;
  registrarFaltantes(pedido: Pedido): Promise<number>;
};

export type Dashboard = {
  ventasMes: number;
  variacionVentas: number | null;
  pedidosActivos: number;
  enAlistamiento: number;
  enviados: number;
  pendientesPago: number;
  margenPct: number | null;
  variacionMargenPts: number | null;
  listaPendientes: number;
  ventas7Dias: { etiqueta: string; total: number }[];
  masVendidos: { nombre: string; unidades: number }[];
  recientes: { id: string; cliente: string; estado: string }[];
  alertas: string[];
};

export type Reportes = {
  ingresos: number;
  variacionIngresos: number | null;
  costo: number;
  costoPct: number | null;
  utilidad: number;
  margenPct: number | null;
  ticketPromedio: number | null;
  pedidos: number;
  productosSinCosto: number;
  semanas: { etiqueta: string; ingresos: number; costo: number }[];
  categorias: { nombre: string; porcentaje: number }[];
  mejorMargen: { nombre: string; margenPct: number }[];
  proveedores: { nombre: string; total: number }[];
};

export type ReportesRepo = {
  dashboard(): Promise<Dashboard>;
  reportes(): Promise<Reportes>;
  exportarPedidosCsv(): Promise<string>;
  fuentesDelSistema(): Promise<FuentesNegocio>;
};

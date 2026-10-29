import type {
  InventarioRepo,
  ListaComprasRepo,
  ReportesRepo,
} from "@/modules/operacion/application/puertos";
import * as inventarioPg from "@/modules/operacion/infrastructure/inventario-pg";
import * as listaPg from "@/modules/operacion/infrastructure/lista-compras-pg";
import * as reportesPg from "@/modules/operacion/infrastructure/reportes-pg";

export const inventarioRepo: InventarioRepo = {
  listar: inventarioPg.listarInventario,
  actualizar: inventarioPg.actualizarInventario,
  registrarCompra: inventarioPg.registrarCompra,
};

export const listaComprasRepo: ListaComprasRepo = {
  listar: listaPg.listarListaCompras,
  cambiarEstado: listaPg.cambiarEstadoLista,
  registrarFaltantes: listaPg.registrarFaltantes,
};

export const reportesRepo: ReportesRepo = {
  dashboard: reportesPg.dashboard,
  reportes: reportesPg.reportes,
  exportarPedidosCsv: reportesPg.exportarPedidosCsv,
  fuentesDelSistema: reportesPg.fuentesDelSistema,
};

import type { ReportesRepo } from "@/modules/operacion/application/puertos";

export async function obtenerDashboard(repo: ReportesRepo) {
  return repo.dashboard();
}

export async function obtenerReportes(repo: ReportesRepo) {
  return repo.reportes();
}

export async function exportarPedidosCsv(repo: ReportesRepo) {
  return repo.exportarPedidosCsv();
}

export async function fuentesNegocio(repo: ReportesRepo) {
  return repo.fuentesDelSistema();
}

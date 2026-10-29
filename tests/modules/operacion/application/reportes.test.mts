import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  exportarPedidosCsv,
  fuentesNegocio,
  obtenerDashboard,
  obtenerReportes,
} from "@/modules/operacion/application/reportes";
import type { Dashboard, Reportes, ReportesRepo } from "@/modules/operacion/application/puertos";

const dash: Dashboard = {
  ventasMes: 1,
  variacionVentas: null,
  pedidosActivos: 0,
  enAlistamiento: 0,
  enviados: 0,
  pendientesPago: 0,
  margenPct: null,
  variacionMargenPts: null,
  listaPendientes: 0,
  ventas7Dias: [],
  masVendidos: [],
  recientes: [],
  alertas: [],
};

const reps: Reportes = {
  ingresos: 0,
  variacionIngresos: null,
  costo: 0,
  costoPct: null,
  utilidad: 0,
  margenPct: null,
  ticketPromedio: null,
  pedidos: 0,
  productosSinCosto: 0,
  semanas: [],
  categorias: [],
  mejorMargen: [],
  proveedores: [],
};

function repoFake(): ReportesRepo & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async dashboard() {
      calls.push("dashboard");
      return dash;
    },
    async reportes() {
      calls.push("reportes");
      return reps;
    },
    async exportarPedidosCsv() {
      calls.push("csv");
      return "id,total\n";
    },
    async fuentesDelSistema() {
      calls.push("fuentes");
      return { fuente: "ejemplo", pedidos: [], inventario: [], listaCompras: [], catalogo: [] };
    },
  };
}

describe("reportes application", () => {
  it("delega dashboard, reportes, CSV y fuentes al puerto", async () => {
    const repo = repoFake();
    assert.equal((await obtenerDashboard(repo)).ventasMes, 1);
    assert.equal((await obtenerReportes(repo)).pedidos, 0);
    assert.match(await exportarPedidosCsv(repo), /id,total/);
    assert.equal((await fuentesNegocio(repo)).fuente, "ejemplo");
    assert.deepEqual(repo.calls, ["dashboard", "reportes", "csv", "fuentes"]);
  });
});

import { exportarPedidosCsv } from "@/modules/operacion/application/reportes";
import { reportesRepo } from "@/modules/operacion/infrastructure/repos";

export async function GET() {
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(await exportarPedidosCsv(reportesRepo), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

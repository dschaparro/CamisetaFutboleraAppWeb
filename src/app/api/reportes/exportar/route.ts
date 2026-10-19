import { exportarPedidosCsv } from "@/modules/operacion/infrastructure/reportes-pg";

// Panel: Administrador y Marketing (proxy.ts). CSV con ; y BOM: Excel lo abre directo.
export async function GET() {
  const fecha = new Date().toISOString().slice(0, 10);
  return new Response(await exportarPedidosCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

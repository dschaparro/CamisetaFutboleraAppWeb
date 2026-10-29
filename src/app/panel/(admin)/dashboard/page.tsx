import BarChart from "@/components/admin/BarChart";
import { money } from "@/lib/money";
import { obtenerDashboard } from "@/modules/operacion/application/reportes";
import { reportesRepo } from "@/modules/operacion/infrastructure/repos";

// Cifras en vivo desde Supabase: nunca se prerenderiza.
export const dynamic = "force-dynamic";

const PILL: Record<string, string> = {
  "Pendiente de pago": "pill-mute",
  Alistamiento: "pill-warn",
  Enviado: "pill-blue",
  Entregado: "pill-ok",
  Cancelado: "pill-danger",
};

function Variacion({ valor, sufijo }: { valor: number | null; sufijo: string }) {
  if (valor === null) return <span className="k-delta" style={{ color: "var(--ink-mute)" }}>Sin periodo anterior para comparar</span>;
  return (
    <span className={`k-delta${valor >= 0 ? " up" : ""}`} style={valor < 0 ? { color: "var(--danger)" } : undefined}>
      {valor >= 0 ? "▲" : "▼"} {Math.abs(valor)}
      {sufijo}
    </span>
  );
}

export default async function DashboardPage() {
  const d = await obtenerDashboard(reportesRepo);
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Dashboard</h1><p>Resumen general del negocio</p></div>
        <div className="chip active">Últimos 30 días</div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="k-label">Ventas del mes</span>
          <span className="k-value tabular">{money(d.ventasMes)}</span>
          <Variacion valor={d.variacionVentas} sufijo="% vs. los 30 días anteriores" />
        </div>
        <div className="card kpi-card">
          <span className="k-label">Pedidos activos</span>
          <span className="k-value tabular">{d.pedidosActivos}</span>
          <span className="k-delta" style={{ color: "var(--ink-mute)" }}>
            {d.pendientesPago} por pagar · {d.enAlistamiento} en alistamiento · {d.enviados} enviados
          </span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Margen promedio</span>
          <span className="k-value tabular">{d.margenPct === null ? "—" : `${d.margenPct.toLocaleString("es-CO")}%`}</span>
          <Variacion valor={d.variacionMargenPts} sufijo=" pts vs. los 30 días anteriores" />
        </div>
        <div className="card kpi-card">
          <span className="k-label">Lista de compras</span>
          <span className="k-value tabular">{d.listaPendientes}</span>
          <span className="k-delta" style={{ color: d.listaPendientes > 0 ? "var(--warn)" : "var(--ink-mute)" }}>ítems pendientes por conseguir</span>
        </div>
      </div>

      <div className="panel-grid">
        <div className="card panel">
          <h3>Ventas de los últimos 7 días <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(en pesos, miles)</span></h3>
          <BarChart values={d.ventas7Dias.map((v) => Math.round(v.total / 1000))} labels={d.ventas7Dias.map((v) => v.etiqueta)} />
        </div>
        <div className="card panel">
          <h3>Productos más vendidos</h3>
          {d.masVendidos.length === 0 && <p style={{ color: "var(--ink-mute)", fontSize: ".85rem" }}>Todavía no hay ventas.</p>}
          {d.masVendidos.map((p, i) => (
            <div className="rank-row" key={p.nombre}>
              <div className="name"><span className="idx">{i + 1}</span>{p.nombre}</div>
              <b className="tabular">{p.unidades} uds</b>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-grid" style={{ marginTop: 18 }}>
        <div className="card panel">
          <h3>Pedidos recientes</h3>
          {d.recientes.length === 0 && <p style={{ color: "var(--ink-mute)", fontSize: ".85rem" }}>Todavía no hay pedidos.</p>}
          {d.recientes.map((p) => (
            <div className="rank-row" key={p.id}>
              <div className="name">#{p.id} · {p.cliente}</div>
              <span className={`pill ${PILL[p.estado] ?? "pill-mute"}`}>{p.estado}</span>
            </div>
          ))}
        </div>
        <div className="card panel">
          <h3>Alertas</h3>
          {d.alertas.length === 0 && <p style={{ color: "var(--ink-mute)", fontSize: ".85rem" }}>Sin alertas: todo al día.</p>}
          {d.alertas.map((a) => (
            <div className="alert-row" key={a}><span className="dot" />{a}</div>
          ))}
        </div>
      </div>
    </>
  );
}

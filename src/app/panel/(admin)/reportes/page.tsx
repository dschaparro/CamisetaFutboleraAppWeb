import BarChart from "@/components/admin/BarChart";
import { money } from "@/lib/money";
import { obtenerReportes } from "@/modules/operacion/application/reportes";
import { reportesRepo } from "@/modules/operacion/infrastructure/repos";

// Composition: page → application + puerto (sin *-pg).

// Cifras en vivo desde Supabase: nunca se prerenderiza.
export const dynamic = "force-dynamic";

const vacio = (texto: string) => <p style={{ color: "var(--ink-mute)", fontSize: ".85rem" }}>{texto}</p>;
const pct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("es-CO")}%`);

export default async function ReportesPage() {
  const r = await obtenerReportes(reportesRepo);
  const miles = (n: number) => Math.round(n / 1000);
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Reportes</h1><p>Ventas, márgenes y desempeño del negocio · últimos 30 días</p></div>
        <a className="btn btn-outline" href="/api/reportes/exportar" download>Exportar Excel</a>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="k-label">Ingresos totales</span>
          <span className="k-value tabular">{money(r.ingresos)}</span>
          {r.variacionIngresos === null ? (
            <span className="k-delta" style={{ color: "var(--ink-mute)" }}>{r.pedidos} pedidos</span>
          ) : (
            <span className={`k-delta${r.variacionIngresos >= 0 ? " up" : ""}`} style={r.variacionIngresos < 0 ? { color: "var(--danger)" } : undefined}>
              {r.variacionIngresos >= 0 ? "▲" : "▼"} {Math.abs(r.variacionIngresos)}% vs. los 30 días anteriores
            </span>
          )}
        </div>
        <div className="card kpi-card">
          <span className="k-label">Costo de mercancía</span>
          <span className="k-value tabular">{money(r.costo)}</span>
          <span className="k-delta" style={{ color: "var(--ink-mute)" }}>{r.costoPct === null ? "—" : `${r.costoPct.toLocaleString("es-CO")}% de los ingresos`}</span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Utilidad bruta</span>
          <span className="k-value tabular">{money(r.utilidad)}</span>
          <span className="k-delta" style={{ color: "var(--ink-mute)" }}>Margen {pct(r.margenPct)}</span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Ticket promedio</span>
          <span className="k-value tabular">{r.ticketPromedio === null ? "—" : money(r.ticketPromedio)}</span>
          <span className="k-delta" style={{ color: "var(--ink-mute)" }}>{r.pedidos} pedidos en el periodo</span>
        </div>
      </div>
      {r.productosSinCosto > 0 && (
        <p style={{ fontSize: ".78rem", color: "var(--warn)", margin: "-6px 0 14px" }}>
          {r.productosSinCosto} producto(s) del catálogo no tienen costo registrado: su costo cuenta como $0 y el margen se ve más alto de lo real. Complétalos en Inventario.
        </p>
      )}

      <div className="panel-grid">
        <div className="card panel">
          <h3>Ingresos vs. costos — últimas 8 semanas <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(pesos, miles)</span></h3>
          <BarChart values={r.semanas.map((s) => miles(s.ingresos))} values2={r.semanas.map((s) => miles(s.costo))} labels={r.semanas.map((s) => s.etiqueta)} />
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: ".75rem", color: "var(--ink-mute)" }}>
            <span><span style={{ color: "var(--blue)" }}>▮</span> Ingresos</span>
            <span><span style={{ color: "var(--gold)" }}>▮</span> Costos</span>
          </div>
        </div>
        <div className="card panel">
          <h3>Ventas por categoría</h3>
          {r.categorias.length === 0 && vacio("Sin ventas en el periodo.")}
          {r.categorias.map((c) => (
            <div className="rank-row" key={c.nombre}><div className="name">{c.nombre}</div><b>{c.porcentaje}%</b></div>
          ))}
        </div>
      </div>

      <div className="panel-grid" style={{ marginTop: 18 }}>
        <div className="card panel">
          <h3>Productos con mejor margen</h3>
          {r.mejorMargen.length === 0 && vacio("Registra el costo de los productos en Inventario.")}
          {r.mejorMargen.map((p, i) => (
            <div className="rank-row" key={p.nombre}><div className="name"><span className="idx">{i + 1}</span>{p.nombre}</div><b>{p.margenPct}%</b></div>
          ))}
        </div>
        <div className="card panel">
          <h3>Proveedores por volumen de compra</h3>
          {r.proveedores.length === 0 && vacio("Aún no hay compras registradas.")}
          {r.proveedores.map((p, i) => (
            <div className="rank-row" key={p.nombre}><div className="name"><span className="idx">{i + 1}</span>{p.nombre}</div><b className="tabular">{money(p.total)}</b></div>
          ))}
        </div>
      </div>
    </>
  );
}

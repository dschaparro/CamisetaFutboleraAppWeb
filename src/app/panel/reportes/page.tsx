import BarChart from "@/components/admin/BarChart";

export default function ReportesPage() {
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Reportes</h1><p>Ventas, márgenes y desempeño del negocio</p></div>
        <button className="btn btn-outline">Exportar Excel</button>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card"><span className="k-label">Ingresos totales</span><span className="k-value tabular">$8.420.000</span><span className="k-delta up">▲ 12% vs. mes anterior</span></div>
        <div className="card kpi-card"><span className="k-label">Costo de mercancía</span><span className="k-value tabular">$5.180.000</span><span className="k-delta" style={{ color: "var(--ink-mute)" }}>61,5% de ingresos</span></div>
        <div className="card kpi-card"><span className="k-label">Utilidad bruta</span><span className="k-value tabular">$3.240.000</span><span className="k-delta" style={{ color: "var(--ink-mute)" }}>Margen 38,5%</span></div>
        <div className="card kpi-card"><span className="k-label">Ticket promedio</span><span className="k-value tabular">$168.400</span><span className="k-delta" style={{ color: "var(--ink-mute)" }}>últimas 8 semanas</span></div>
      </div>

      <div className="panel-grid">
        <div className="card panel">
          <h3>Ingresos vs. costos — últimas 8 semanas</h3>
          <BarChart values={[132, 118, 145, 151, 139, 162, 158, 171]} labels={["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]} />
          <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: ".75rem", color: "var(--ink-mute)" }}>
            <span>▮ Ingresos</span><span>▮ Costos</span>
          </div>
        </div>
        <div className="card panel">
          <h3>Ventas por categoría</h3>
          <div className="rank-row"><div className="name">Clubes europeos</div><b>46%</b></div>
          <div className="rank-row"><div className="name">Fútbol colombiano</div><b>30%</b></div>
          <div className="rank-row"><div className="name">Selecciones y otros</div><b>24%</b></div>
        </div>
      </div>

      <div className="panel-grid" style={{ marginTop: 18 }}>
        <div className="card panel">
          <h3>Productos con mejor margen</h3>
          <div className="rank-row"><div className="name"><span className="idx">1</span>Atlético Nacional — Titular 2026</div><b>43%</b></div>
          <div className="rank-row"><div className="name"><span className="idx">2</span>Millonarios FC — Titular 2026</div><b>41%</b></div>
          <div className="rank-row"><div className="name"><span className="idx">3</span>Real Madrid — Titular 2027</div><b>40%</b></div>
          <div className="rank-row"><div className="name"><span className="idx">4</span>Selección Colombia — Local 2027</div><b>39%</b></div>
        </div>
        <div className="card panel">
          <h3>Proveedores por volumen de compra</h3>
          <div className="rank-row"><div className="name"><span className="idx">1</span>Distrideportes</div><b className="tabular">$2.410.000</b></div>
          <div className="rank-row"><div className="name"><span className="idx">2</span>Local Bogotá</div><b className="tabular">$1.560.000</b></div>
          <div className="rank-row"><div className="name"><span className="idx">3</span>Importfut</div><b className="tabular">$980.000</b></div>
          <div className="rank-row"><div className="name"><span className="idx">4</span>Estampados DTF Bogotá</div><b className="tabular">$430.000</b></div>
        </div>
      </div>
    </>
  );
}

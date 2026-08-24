import BarChart from "@/components/admin/BarChart";

export default function DashboardPage() {
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Dashboard</h1><p>Resumen general del negocio</p></div>
        <div className="chip active">Últimos 30 días ▾</div>
      </div>

      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="k-label">Ventas del mes</span>
          <span className="k-value tabular">$8.420.000</span>
          <span className="k-delta up">▲ 12% vs. mes anterior</span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Pedidos activos</span>
          <span className="k-value tabular">17</span>
          <span className="k-delta" style={{ color: "var(--ink-mute)" }}>5 en alistamiento · 8 enviados</span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Margen promedio</span>
          <span className="k-value tabular">38%</span>
          <span className="k-delta up">▲ 2 pts vs. mes anterior</span>
        </div>
        <div className="card kpi-card">
          <span className="k-label">Lista de compras</span>
          <span className="k-value tabular">5</span>
          <span className="k-delta" style={{ color: "var(--warn)" }}>ítems pendientes por conseguir</span>
        </div>
      </div>

      <div className="panel-grid">
        <div className="card panel">
          <h3>Ventas de los últimos 7 días <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(en pesos, miles)</span></h3>
          <BarChart values={[62, 74, 58, 91, 120, 140, 96]} labels={["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]} />
        </div>
        <div className="card panel">
          <h3>Productos más vendidos</h3>
          <div className="rank-row"><div className="name"><span className="idx">1</span>Real Madrid — Titular 2027</div><b className="tabular">32 uds</b></div>
          <div className="rank-row"><div className="name"><span className="idx">2</span>Selección Colombia — Local 2027</div><b className="tabular">24 uds</b></div>
          <div className="rank-row"><div className="name"><span className="idx">3</span>Millonarios FC — Titular 2026</div><b className="tabular">19 uds</b></div>
        </div>
      </div>

      <div className="panel-grid" style={{ marginTop: 18 }}>
        <div className="card panel">
          <h3>Pedidos recientes</h3>
          <div className="rank-row"><div className="name">#CF-00842 · Laura Ramírez</div><span className="pill pill-warn">Alistamiento</span></div>
          <div className="rank-row"><div className="name">#CF-00841 · Andrés Pérez</div><span className="pill pill-blue">Enviado</span></div>
          <div className="rank-row"><div className="name">#CF-00840 · Camila Ruiz</div><span className="pill pill-ok">Entregado</span></div>
          <div className="rank-row"><div className="name">#CF-00839 · Invitado</div><span className="pill pill-ok">Entregado</span></div>
        </div>
        <div className="card panel">
          <h3>Alertas</h3>
          <div className="alert-row"><span className="dot" />3 ítems de la Lista de Compras llevan más de 2 días sin resolver.</div>
          <div className="alert-row"><span className="dot" />Compra a proveedor Distrideportes pendiente de confirmación (Pedido #CF-00842).</div>
          <div className="alert-row"><span className="dot" />Pedido #CF-00838 lleva 3 días en alistamiento — verificar con proveedor.</div>
        </div>
      </div>
    </>
  );
}

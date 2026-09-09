import { ORDERS, OrderStatus } from "@/data/orders";
import { money } from "@/lib/money";

const STATUS_PILL: Record<OrderStatus, string> = {
  Alistamiento: "pill-warn",
  Enviado: "pill-blue",
  Entregado: "pill-ok",
  "Pendiente de pago": "pill-danger",
};

export default function PedidosPage() {
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Pedidos</h1><p><span className="tabular">42</span> pedidos este mes</p></div>
      </div>
      <div className="sl-tabs">
        <div className="chip active">Todos (42)</div>
        <div className="chip">Pendientes de pago (2)</div>
        <div className="chip">En alistamiento (5)</div>
        <div className="chip">Enviados (8)</div>
        <div className="chip">Entregados (25)</div>
      </div>
      <div className="card overflow-x">
        <table>
          <thead>
            <tr><th>Pedido</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {ORDERS.map((o) => (
              <tr key={o.id}>
                <td className="mono">#{o.id}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="avatar-mini">{o.client.charAt(0)}</span>
                    {o.client}
                    <span style={{ color: "var(--ink-mute)", fontSize: ".72rem" }}>{o.kind}</span>
                  </div>
                </td>
                <td>{o.items} producto(s)</td>
                <td className="tabular">{money(o.total)}</td>
                <td>{o.pay}</td>
                <td><span className={`pill ${STATUS_PILL[o.status]}`}>{o.status}</span></td>
                <td className="row-actions">
                  <button className="btn btn-outline btn-sm">Ver</button>
                  <button className="btn btn-ghost btn-sm">Reenviar factura</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

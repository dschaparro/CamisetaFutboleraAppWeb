import { INVENTORY } from "@/data/inventory";
import { money } from "@/lib/money";

export default function InventarioPage() {
  return (
    <>
      <div className="admin-topbar">
        <div><h1>Inventario y compras</h1><p>Visible solo para el equipo — nunca se muestra al cliente (RN-11)</p></div>
        <button className="btn btn-gold">+ Registrar compra</button>
      </div>

      <div className="stat-strip">
        <div className="stat-chip"><b className="tabular">86</b><span>Unidades en stock (lote)</span></div>
        <div className="stat-chip"><b className="tabular">9</b><span>Compras bajo pedido activas</span></div>
        <div className="stat-chip"><b className="tabular">4</b><span>Proveedores activos</span></div>
        <div className="stat-chip"><b className="tabular">$74.500</b><span>Costo promedio por unidad</span></div>
      </div>

      <div className="toolbar">
        <div className="search">🔎 <input placeholder="Buscar producto o SKU..." /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="chip">Proveedor ▾</div>
          <div className="chip">Stock bajo ▾</div>
        </div>
      </div>

      <div className="card overflow-x">
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>SKU</th><th>Proveedor principal</th><th>Costo unitario</th>
              <th>Precio venta</th><th>Margen</th><th>Stock (lote)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {INVENTORY.map((i) => (
              <tr key={i.sku}>
                <td><b>{i.name}</b></td>
                <td className="mono">{i.sku}</td>
                <td>{i.prov}</td>
                <td className="tabular">{money(i.cost)}</td>
                <td className="tabular">{money(i.price)}</td>
                <td><span className="pill pill-ok">{i.margin}</span></td>
                <td>
                  {i.stock === 0 ? (
                    <span className="pill pill-warn">Bajo pedido</span>
                  ) : i.stock <= 5 ? (
                    <span className="pill pill-danger">{i.stock} · Stock bajo</span>
                  ) : (
                    <span className="tabular">{i.stock}</span>
                  )}
                </td>
                <td><button className="btn btn-outline btn-sm">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

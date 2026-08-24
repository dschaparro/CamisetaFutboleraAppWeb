"use client";

import { useState } from "react";

const CHANNELS = ["WhatsApp", "Redes sociales", "Punto físico"];
const PAY_MODES = ["Pago anticipado", "Abono 50%", "Contraentrega"];

export default function VentaManualPage() {
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [payMode, setPayMode] = useState(PAY_MODES[1]);

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Registrar venta manual</h1><p>Ventas por redes sociales, WhatsApp o punto físico (RF-19b)</p></div>
      </div>
      <div className="two-col">
        <div>
          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Canal de la venta</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>¿Por dónde se hizo la venta?</p>
            <div className="channel-grid">
              {CHANNELS.map((c) => (
                <div key={c} className={`channel-btn${channel === c ? " selected" : ""}`} onClick={() => setChannel(c)}>{c}</div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Datos del cliente</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>Igual que en el checkout web, sin necesidad de cuenta.</p>
            <div className="form-grid">
              <div className="field"><label>Nombre completo</label><input defaultValue="Camila Rojas" /></div>
              <div className="field"><label>Celular</label><input defaultValue="300 555 1234" /></div>
              <div className="field"><label>Cédula</label><input defaultValue="1.032.456.789" /></div>
              <div className="field"><label>Ciudad</label><input defaultValue="Medellín" /></div>
              <div className="field" style={{ gridColumn: "1/-1" }}><label>Dirección de envío</label><input defaultValue="Cra 45 # 12-30, apto 501" /></div>
            </div>
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Producto</legend>
            <p style={{ fontSize: ".8rem", color: "var(--ink-mute)", marginBottom: 10 }}>Selecciona el producto y su personalización, si aplica.</p>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: "1/-1" }}>
                <label>Producto</label>
                <select><option>Camiseta Barcelona Titular 2027 — Talla M</option></select>
              </div>
              <div className="field"><label>Parche de liga</label><select><option>Ninguno</option></select></div>
              <div className="field"><label>Dorsal (nombre + número)</label><input defaultValue="MARTÍNEZ 7" /></div>
              <div className="field"><label>Cantidad</label><input defaultValue="1" /></div>
            </div>
            <div className="stock-warn">
              Este producto no tiene stock disponible ahora mismo — al guardar, se agregará
              automáticamente a la Lista de Compras para que Administración o Vendedor consigan la
              camiseta con el proveedor.
            </div>
          </fieldset>

          <fieldset>
            <legend style={{ fontSize: ".9rem" }}>Pago y envío</legend>
            <div className="channel-grid">
              {PAY_MODES.map((p) => (
                <div key={p} className={`channel-btn${payMode === p ? " selected" : ""}`} onClick={() => setPayMode(p)}>{p}</div>
              ))}
            </div>
            <div className="form-grid" style={{ marginTop: 10 }}>
              <div className="field"><label>Transportadora</label><select><option>Interrapidísimo (nacional)</option></select></div>
              <div className="field"><label>Monto del abono</label><input defaultValue="$65.000" /></div>
            </div>
          </fieldset>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-gold">Registrar venta</button>
            <button className="btn btn-outline">Cancelar</button>
          </div>
        </div>

        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 14 }}>
            Resumen de la venta
          </h3>
          <div className="summary-row"><span>Camiseta Barcelona Titular · M</span><span className="tabular">$130.000</span></div>
          <div className="summary-row"><span>Personalización (dorsal)</span><span className="tabular">Incluida</span></div>
          <div className="summary-row"><span>Envío estimado</span><span className="tabular">$18.000</span></div>
          <div className="summary-row total"><span>Total</span><span className="tabular">$148.000</span></div>
        </div>
      </div>
    </>
  );
}

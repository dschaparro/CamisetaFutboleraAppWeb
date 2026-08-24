"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "Ventas y margen del último mes",
  "Productos más vendidos por club",
  "Estado de la Lista de Compras",
  "Comparativo de márgenes web vs. venta manual",
];

export default function InformesIaPage() {
  const [prompt, setPrompt] = useState(
    "Hazme un resumen de ventas y margen del último mes, destacando los productos con mejor rentabilidad"
  );
  const [loading, setLoading] = useState(false);

  // Genera un informe de ejemplo — cuando el SDK de Claude esté instalado
  // (ver src/lib/claude.ts) esto debe llamar a un Route Handler en el
  // servidor, p. ej. POST /api/informes, en vez de simular una espera aquí.
  function generate() {
    setLoading(true);
    setTimeout(() => setLoading(false), 1100);
  }

  return (
    <>
      <div className="admin-topbar">
        <div><h1>Informes con IA</h1><p>Pide un informe en lenguaje natural — generado con la API de Claude (RF-35)</p></div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: ".9rem", marginBottom: 10 }}>
          ¿Qué informe necesitas?
        </h3>
        <div className="ai-prompt-box">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <button className="btn btn-gold" style={{ alignSelf: "flex-end" }} onClick={generate}>
            Generar informe
          </button>
        </div>
        <div className="suggest-row">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggest-chip" onClick={() => setPrompt(s)}>{s}</button>
          ))}
        </div>
        {loading && (
          <div className="ai-loading"><span className="spinner" /> Generando informe con la API de Claude…</div>
        )}
      </div>

      <div className="ai-report" style={{ opacity: loading ? 0.35 : 1 }}>
        <span className="gen-tag">Generado por el Asistente de IA · hace unos segundos</span>
        <h3 style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "1rem" }}>
          Informe: Ventas y margen — Julio 2027
        </h3>
        <div className="ai-metric-row">
          <div><b className="tabular">$8.420.000</b><span>Ventas del mes</span></div>
          <div><b className="tabular">34,2%</b><span>Margen promedio</span></div>
          <div><b className="tabular">62</b><span>Unidades vendidas</span></div>
        </div>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", lineHeight: 1.7 }}>
          En julio, Camiseta Futbolera registró $8.420.000 en ventas totales, un 12% más que el mes
          anterior, con un margen promedio del 34,2%. Las ventas por canal manual (redes sociales y
          WhatsApp) representaron el 41% del total, muy cerca de la tienda web.
        </p>
        <p style={{ fontSize: ".85rem", color: "var(--ink-soft)", lineHeight: 1.7, marginTop: 10 }}>
          <b>Productos con mejor rentabilidad:</b> las camisetas retro/vintage tuvieron el margen
          más alto (46% en promedio), seguidas de las ediciones de selecciones nacionales (39%). Se
          recomienda dar más visibilidad a la categoría retro en el catálogo, dado su buen
          desempeño de margen frente a las camisetas de temporada actual.
        </p>
        <div className="stock-warn" style={{ marginTop: 14 }}>
          <b>Alerta de Lista de Compras:</b> hay 5 ítems pendientes con más de 3 días sin resolver,
          principalmente tallas grandes (L/XL) de clubes europeos — se recomienda priorizar su
          gestión con el proveedor esta semana.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn btn-outline">Descargar PDF</button>
          <button className="btn btn-ghost" onClick={generate}>↻ Regenerar</button>
        </div>
      </div>
    </>
  );
}

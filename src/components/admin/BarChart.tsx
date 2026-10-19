/** Barras simples. Con `values2` dibuja una segunda serie (dorada) al lado de cada barra. */
export default function BarChart({ values, labels, values2 }: { values: number[]; labels: string[]; values2?: number[] }) {
  const max = Math.max(1, ...values, ...(values2 ?? []));
  const alto = (v: number) => `${Math.max(2, Math.round((v / max) * 100))}%`;
  return (
    <div className="chart-bars">
      {values.map((v, i) => (
        <div className="bar-col" key={i}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, width: "100%", flex: 1, minHeight: 0 }}>
            <div className="bar" style={{ height: alto(v) }} title={String(v)} />
            {values2 && <div className="bar" style={{ height: alto(values2[i] ?? 0), background: "var(--gold)" }} title={String(values2[i] ?? 0)} />}
          </div>
          <div className="bar-lbl">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

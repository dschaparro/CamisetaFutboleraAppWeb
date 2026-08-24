export default function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values);
  return (
    <div className="chart-bars">
      {values.map((v, i) => (
        <div className="bar-col" key={i}>
          <div className="bar" style={{ height: Math.max(6, Math.round((v / max) * 130)) }} title={String(v)} />
          <div className="bar-lbl">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

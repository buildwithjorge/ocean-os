export function Metric({ label, value, delta }: { label: string; value: string; delta?: string }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {delta ? <span className="metric-delta">{delta}</span> : null}
    </div>
  );
}

/**
 * Module: StatusBadge
 * Purpose: Project runtime and documentation surface.
 */
type StatusTone = "ok" | "warn" | "critical" | "info";

export function StatusBadge({ label, tone = "info" }: { label: string; tone?: StatusTone }) {
  return <span className={`status-badge tone-${tone}`}>{label}</span>;
}

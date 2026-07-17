/**
 * Module: severity
 * Purpose: Project runtime and documentation surface.
 */
export type SeverityLevel = "low" | "moderate" | "high" | "severe" | "extreme";

export const severityColors: Record<SeverityLevel, string> = {
  low: "#19d49f",
  moderate: "#f4b744",
  high: "#ff7b35",
  severe: "#ff4c56",
  extreme: "#bc56ff",
};

export function severityFromRiskIndex(riskIndex: number): SeverityLevel {
  if (riskIndex >= 90) return "extreme";
  if (riskIndex >= 80) return "severe";
  if (riskIndex >= 60) return "high";
  if (riskIndex >= 40) return "moderate";
  return "low";
}

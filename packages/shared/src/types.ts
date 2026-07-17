/**
 * Module: types
 * Purpose: Project runtime and documentation surface.
 */
import type { SeverityLevel } from "./severity";

export type FeedEventCategory = "Alerts" | "Operations" | "Maintenance";

export type ForecastRecord = {
  id: string;
  beachId: string;
  issuedAt: string;
  riskIndex: number;
  severity: SeverityLevel;
  confidenceScore: number;
  confidenceLabel: "High" | "Medium" | "Low";
  estimatedBiomassMinTons: number;
  estimatedBiomassMaxTons: number;
  methodologyNote: string;
};

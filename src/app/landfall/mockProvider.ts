import { forecastCheckpoints } from "../mockData";
import type { ForecastSnapshot } from "../forecastDataSource";
import type { ForecastRequestContext, SargassumForecastProvider } from "./provider";

const HEURISTIC_METHOD_NOTE =
  "Modeled estimate from AFAI index using an uncalibrated heuristic (not a validated biomass conversion).";

export function buildMockForecastSnapshot(note?: string): ForecastSnapshot {
  return {
    riskIndex: 91,
    forecastConfidence: "High",
    confidenceScore: 90,
    impactProbability: 97,
    estimatedBiomass: [620, 780],
    arrivalEta: "17h 24m",
    forecastCheckpoints,
    source: "mock",
    updatedAt: new Date().toISOString(),
    isHeuristic: true,
    methodologyNote: HEURISTIC_METHOD_NOTE,
    note,
  };
}

export class MockSargassumForecastProvider implements SargassumForecastProvider {
  id = "mock";

  async getSnapshot(_context?: ForecastRequestContext): Promise<ForecastSnapshot> {
    return buildMockForecastSnapshot();
  }
}

import type { ForecastCheckpoint } from "./mockData";
import { MockSargassumForecastProvider, buildMockForecastSnapshot } from "./landfall/mockProvider";
import { NoaaErddapSargassumProvider, __noaaInternals } from "./landfall/noaaErddapProvider";
import type { SargassumForecastProvider } from "./landfall/provider";

export type ForecastConfidence = "High" | "Medium" | "Low";

export type ForecastSnapshot = {
  riskIndex: number;
  forecastConfidence: ForecastConfidence;
  confidenceScore: number;
  impactProbability: number;
  estimatedBiomass: [number, number];
  arrivalEta: string;
  forecastCheckpoints: ForecastCheckpoint[];
  source: "mock" | "noaa-erddap";
  updatedAt: string;
  isHeuristic: boolean;
  methodologyNote: string;
  note?: string;
};

const providerMap: Record<ForecastSnapshot["source"], SargassumForecastProvider> = {
  mock: new MockSargassumForecastProvider(),
  "noaa-erddap": new NoaaErddapSargassumProvider(),
};

export function getMockForecastSnapshot(note?: string): ForecastSnapshot {
  return buildMockForecastSnapshot(note);
}

export async function getForecastSnapshot(options?: { signal?: AbortSignal; jurisdiction?: string }): Promise<ForecastSnapshot> {
  const source = import.meta.env.VITE_SARGASSUM_SOURCE === "noaa-erddap" ? "noaa-erddap" : "mock";
  const provider = providerMap[source];

  try {
    return await provider.getSnapshot({ signal: options?.signal, jurisdiction: options?.jurisdiction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provider error";
    return buildMockForecastSnapshot(`${provider.id} fallback active: ${message}`);
  }
}

export const __forecastInternals = __noaaInternals;

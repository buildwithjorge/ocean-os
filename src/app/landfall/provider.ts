import type { ForecastSnapshot } from "../forecastDataSource";

export type ForecastRequestContext = {
  signal?: AbortSignal;
  jurisdiction?: string;
};

export interface SargassumForecastProvider {
  id: string;
  getSnapshot(context?: ForecastRequestContext): Promise<ForecastSnapshot>;
}

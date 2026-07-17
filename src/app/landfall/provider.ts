/**
 * Module: provider
 * Purpose: Project runtime and documentation surface.
 */
import type { ForecastSnapshot } from "../forecastDataSource";

/**
 * Runtime request hints passed to forecast providers.
 */

export type ForecastRequestContext = {
  signal?: AbortSignal;
  jurisdiction?: string;
};

export interface SargassumForecastProvider {
  id: string;
  /**
   * Returns the latest provider-specific snapshot normalized to ForecastSnapshot.
   */
  getSnapshot(context?: ForecastRequestContext): Promise<ForecastSnapshot>;
}

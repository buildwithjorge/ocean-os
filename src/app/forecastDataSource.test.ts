/**
 * Module: forecastDataSource.test
 * Purpose: Project runtime and documentation surface.
 */
import { describe, expect, it } from "vitest";
import { __forecastInternals } from "./forecastDataSource";

describe("forecastDataSource internals", () => {
  it("builds NOAA request URL with expected dataset and bbox slices", () => {
    const start = new Date("2026-07-14T00:00:00Z");
    const end = new Date("2026-07-16T00:00:00Z");
    const url = __forecastInternals.buildNoaaRequestUrl(start, end, [24.8, 26.7, -80.4, -79.8]);

    expect(url).toContain("noaa_aoml_atlantic_oceanwatch_AFAI_1D");
    expect(url).toContain("AFAI[(2026-07-14T00:00:00Z):1:(2026-07-16T00:00:00Z)]");
    expect(url).toContain("[(24.8):(26.7)][(-80.4):(-79.8)]");
  });

  it("parses NOAA ERDDAP row payload with column name lookup", () => {
    const payload = {
      table: {
        columnNames: ["time", "latitude", "longitude", "AFAI"],
        rows: [["2026-07-16T00:00:00Z", 26.1, -80.12, 0.028]],
      },
    };

    const parsed = __forecastInternals.parseNoaaRows(payload);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({
      time: "2026-07-16T00:00:00Z",
      latitude: 26.1,
      longitude: -80.12,
      value: 0.028,
    });
  });

  it("derives bounded heuristic metrics from AFAI peak", () => {
    const now = new Date("2026-07-16T12:00:00Z");
    const freshest = Date.parse("2026-07-16T10:00:00Z");
    const metrics = __forecastInternals.deriveHeuristicMetrics(0.03, freshest, now);

    expect(metrics.impactProbability).toBeGreaterThanOrEqual(25);
    expect(metrics.impactProbability).toBeLessThanOrEqual(99);
    expect(metrics.riskIndex).toBeGreaterThanOrEqual(20);
    expect(metrics.riskIndex).toBeLessThanOrEqual(99);
    expect(metrics.biomassCeiling).toBeGreaterThan(metrics.biomassFloor);
    expect(metrics.arrivalHours).toBeGreaterThanOrEqual(6);
    expect(metrics.arrivalHours).toBeLessThanOrEqual(36);
  });
});

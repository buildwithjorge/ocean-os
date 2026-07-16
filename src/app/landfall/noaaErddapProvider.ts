/**
 * Module: noaaErddapProvider
 * Purpose: Project runtime and documentation surface.
 */
import { forecastCheckpoints, type ForecastCheckpoint } from "../mockData";
import type { ForecastSnapshot } from "../forecastDataSource";
import type { ForecastRequestContext, SargassumForecastProvider } from "./provider";

type NoaaRow = {
  time: string;
  latitude: number;
  longitude: number;
  value: number;
};

const NOAA_ERDDAP_BASE = "https://cwcgom.aoml.noaa.gov/erddap/griddap";
const NOAA_DATASET_ID = import.meta.env.VITE_NOAA_AFAI_DATASET_ID ?? "noaa_aoml_atlantic_oceanwatch_AFAI_1D";
const NOAA_FALLBACK_BBOX: [number, number, number, number] = [24.8, 26.7, -80.4, -79.8];

const AFAI_SATURATION_THRESHOLD = 0.06;
const RISK_FROM_IMPACT_MULTIPLIER = 0.92;
const BIOMASS_PER_AFAI_UNIT = 12000;
const BIOMASS_UPPER_BOUND_MULTIPLIER = 1.18;
const MIN_BIOMASS_TONS = 120;
const ARRIVAL_BASE_HOURS = 10;
const ARRIVAL_MIN_HOURS = 6;
const ARRIVAL_MAX_HOURS = 36;
const DEFAULT_LAG_HOURS = 12;

const HEURISTIC_METHOD_NOTE =
  "Modeled estimate from AFAI index using an uncalibrated heuristic (not a validated biomass conversion).";

export class NoaaErddapSargassumProvider implements SargassumForecastProvider {
  id = "noaa-erddap";

  async getSnapshot(context?: ForecastRequestContext): Promise<ForecastSnapshot> {
    const now = new Date();
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 2);

    const bbox = parseBbox(import.meta.env.VITE_NOAA_BBOX) ?? NOAA_FALLBACK_BBOX;
    const requestUrl = buildNoaaRequestUrl(start, now, bbox);
    const response = await fetch(requestUrl, { signal: context?.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const rows = parseNoaaRows(payload).filter((row) => Number.isFinite(row.value));

    if (rows.length === 0) {
      throw new Error("No AFAI rows returned for requested window");
    }

    rows.sort((a, b) => b.value - a.value);
    const topRows = rows.slice(0, Math.min(4, rows.length));
    const freshestTimestamp = rows
      .map((row) => Date.parse(row.time))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => b - a)[0];

    const peak = topRows[0]?.value ?? 0;
    const metrics = deriveHeuristicMetrics(peak, freshestTimestamp, now);

    const completenessRatio = Math.min(1, topRows.length / 4);
    const hasFreshData = Number.isFinite(freshestTimestamp) && now.getTime() - Number(freshestTimestamp) < 12 * 3_600_000;
    const confidenceScore = clamp(
      Math.round(62 + completenessRatio * 24 + (peak > 0.03 ? 8 : 0) + (hasFreshData ? 6 : 0)),
      45,
      96,
    );
    const confidenceLabel = confidenceScore >= 86 ? "High" : confidenceScore >= 72 ? "Medium" : "Low";

    return {
      riskIndex: metrics.riskIndex,
      forecastConfidence: confidenceLabel,
      confidenceScore,
      impactProbability: metrics.impactProbability,
      estimatedBiomass: [metrics.biomassFloor, metrics.biomassCeiling],
      arrivalEta: `${metrics.arrivalHours}h 00m`,
      forecastCheckpoints: buildCheckpoints(topRows),
      source: "noaa-erddap",
      updatedAt: new Date().toISOString(),
      isHeuristic: true,
      methodologyNote: HEURISTIC_METHOD_NOTE,
    };
  }
}

type HeuristicMetrics = {
  impactProbability: number;
  riskIndex: number;
  biomassFloor: number;
  biomassCeiling: number;
  arrivalHours: number;
};

function deriveHeuristicMetrics(peak: number, freshestTimestamp: number | undefined, now: Date): HeuristicMetrics {
  const impactProbability = clamp(Math.round((peak / AFAI_SATURATION_THRESHOLD) * 100), 25, 99);
  const riskIndex = clamp(Math.round(impactProbability * RISK_FROM_IMPACT_MULTIPLIER), 20, 99);

  const biomassFloor = Math.max(MIN_BIOMASS_TONS, Math.round(peak * BIOMASS_PER_AFAI_UNIT));
  const biomassCeiling = Math.max(biomassFloor + 80, Math.round(biomassFloor * BIOMASS_UPPER_BOUND_MULTIPLIER));

  const lagHours = Number.isFinite(freshestTimestamp)
    ? Math.max(0, (now.getTime() - Number(freshestTimestamp)) / 3_600_000)
    : DEFAULT_LAG_HOURS;
  const arrivalHours = clamp(Math.round(ARRIVAL_BASE_HOURS + lagHours), ARRIVAL_MIN_HOURS, ARRIVAL_MAX_HOURS);

  return {
    impactProbability,
    riskIndex,
    biomassFloor,
    biomassCeiling,
    arrivalHours,
  };
}

function buildNoaaRequestUrl(start: Date, end: Date, bbox: [number, number, number, number]): string {
  const [minLat, maxLat, minLon, maxLon] = bbox;
  const startIso = toNoaaIso(start);
  const endIso = toNoaaIso(end);

  return `${NOAA_ERDDAP_BASE}/${NOAA_DATASET_ID}.json?AFAI[(${startIso}):1:(${endIso})][(${minLat}):(${maxLat})][(${minLon}):(${maxLon})]`;
}

function toNoaaIso(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function parseBbox(raw?: string): [number, number, number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map((entry) => Number(entry.trim()));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) return null;
  return [parts[0], parts[1], parts[2], parts[3]];
}

function parseNoaaRows(payload: unknown): NoaaRow[] {
  if (!payload || typeof payload !== "object") return [];

  const table = "table" in payload ? (payload as { table?: unknown }).table : undefined;
  if (!table || typeof table !== "object") return [];

  const columnNames = "columnNames" in table ? (table as { columnNames?: unknown }).columnNames : undefined;
  const rows = "rows" in table ? (table as { rows?: unknown }).rows : undefined;

  if (!Array.isArray(columnNames) || !Array.isArray(rows)) return [];

  const lookup = columnNames.map((name) => String(name).toLowerCase());
  const timeIndex = lookup.findIndex((name) => name.includes("time"));
  const latitudeIndex = lookup.findIndex((name) => name.includes("latitude"));
  const longitudeIndex = lookup.findIndex((name) => name.includes("longitude"));
  const valueIndex = lookup.findIndex((name) => name.includes("afai"));

  const resolvedTime = timeIndex >= 0 ? timeIndex : 0;
  const resolvedLatitude = latitudeIndex >= 0 ? latitudeIndex : 1;
  const resolvedLongitude = longitudeIndex >= 0 ? longitudeIndex : 2;
  const resolvedValue = valueIndex >= 0 ? valueIndex : Math.max(columnNames.length - 1, 0);

  return rows
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const time = String(row[resolvedTime] ?? "");
      const latitude = Number(row[resolvedLatitude]);
      const longitude = Number(row[resolvedLongitude]);
      const value = Number(row[resolvedValue]);

      if (!time || Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(value)) {
        return null;
      }

      return { time, latitude, longitude, value } satisfies NoaaRow;
    })
    .filter((row): row is NoaaRow => row !== null);
}

function buildCheckpoints(rows: NoaaRow[]): ForecastCheckpoint[] {
  if (rows.length === 0) {
    return forecastCheckpoints;
  }

  const ordered = [...rows].sort((a, b) => b.longitude - a.longitude);

  return ordered.map((row, index) => {
    const eventTime = new Date(row.time);
    return {
      label: eventTime.toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      time: eventTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      coords: [row.longitude, row.latitude],
      uncertaintyKm: 10 + index * 6,
    };
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const __noaaInternals = {
  buildNoaaRequestUrl,
  parseNoaaRows,
  deriveHeuristicMetrics,
};

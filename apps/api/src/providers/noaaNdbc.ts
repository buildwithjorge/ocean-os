/**
 * Module: noaaNdbc
 * Purpose: Project runtime and documentation surface.
 */
export type NoaaNdbcObservation = {
  stationId: string;
  observedAt: string;
  waveHeightM?: number;
  wavePeriodS?: number;
  seaTempC?: number;
  windSpeedMps?: number;
  confidence: number;
  rawText: string;
};

const DEFAULT_TIMEOUT_MS = Number(process.env.NOAA_NDBC_TIMEOUT_MS ?? 12000);

/**
 * Fetches and parses NOAA NDBC station text feed with timeout protection.
 */
export async function fetchNoaaNdbcObservation(stationId: string): Promise<NoaaNdbcObservation> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NDBC HTTP ${response.status}`);
    }

    const text = await response.text();
    const parsed = parseNdbcRealtimeText(text);

    // Confidence follows completeness instead of static scoring.
    const confidence = parsed.waveHeightM !== undefined ? 88 : 74;

    return {
      stationId,
      observedAt: parsed.observedAt,
      waveHeightM: parsed.waveHeightM,
      wavePeriodS: parsed.wavePeriodS,
      seaTempC: parsed.seaTempC,
      windSpeedMps: parsed.windSpeedMps,
      confidence,
      rawText: text,
    };
  } finally {
    clearTimeout(timeout);
  }
}

type ParsedNdbc = {
  observedAt: string;
  waveHeightM?: number;
  wavePeriodS?: number;
  seaTempC?: number;
  windSpeedMps?: number;
};

function parseNdbcRealtimeText(raw: string): ParsedNdbc {
  // NDBC realtime files are fixed-width text tables where line 1 is headers.
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    throw new Error("Unexpected NDBC format");
  }

  const headers = lines[0].split(/\s+/);
  const values = lines[2].split(/\s+/);
  const at = (field: string) => values[headers.indexOf(field)];

  const yy = Number(at("YY"));
  const mm = Number(at("MM"));
  const dd = Number(at("DD"));
  const hh = Number(at("hh"));
  const min = Number(at("mm"));

  const observedAt = Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)
    ? new Date(Date.UTC(yy, (mm || 1) - 1, dd || 1, hh || 0, min || 0)).toISOString()
    : new Date().toISOString();

  const waveHeightRaw = at("WVHT");
  const wavePeriodRaw = at("DPD");
  const seaTempRaw = at("WTMP");
  const windSpeedRaw = at("WSPD");

  return {
    observedAt,
    waveHeightM: parseMaybe(waveHeightRaw),
    wavePeriodS: parseMaybe(wavePeriodRaw),
    seaTempC: parseMaybe(seaTempRaw),
    windSpeedMps: parseMaybe(windSpeedRaw),
  };
}

function parseMaybe(value: string | undefined): number | undefined {
  if (!value || value === "MM") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

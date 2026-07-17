/**
 * Module: weatherDataSource
 * Purpose: Real surface weather (temperature/wind) for the selected jurisdiction,
 * sourced from Open-Meteo's free forecast API — the same provider family already
 * used for marine current samples on the map. Falls back to a clearly labeled
 * estimate if the network request fails, mirroring the forecast provider pattern.
 */

export type WeatherSnapshot = {
  tempF: number;
  windMph: number;
  windDirectionDeg: number;
  source: "open-meteo" | "fallback";
};

const COMPASS_POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

/** Converts a wind direction in degrees to an 16-point compass label. */
export function degToCompass(deg: number): string {
  return COMPASS_POINTS[Math.round(deg / 22.5) % 16];
}

/** Fetches current temperature and wind for a coastal jurisdiction center point. */
export async function fetchWeatherSnapshot(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Weather fetch failed: ${response.status}`);

    const payload = (await response.json()) as {
      current?: { temperature_2m?: number; wind_speed_10m?: number; wind_direction_10m?: number };
    };

    const current = payload.current;
    if (!current || current.temperature_2m === undefined) {
      throw new Error("Missing current weather fields");
    }

    return {
      tempF: Math.round(current.temperature_2m),
      windMph: Math.round(current.wind_speed_10m ?? 0),
      windDirectionDeg: current.wind_direction_10m ?? 0,
      source: "open-meteo",
    };
  } catch {
    // Estimate only used when the live provider is unreachable — always labeled
    // as a fallback via the `source` field so the UI can be honest about it.
    return { tempF: 84, windMph: 18, windDirectionDeg: 112, source: "fallback" };
  }
}

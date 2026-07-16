/**
 * Module: CoastalMap
 * Purpose: Project runtime and documentation surface.
 */
import { GoogleCoastalMap } from "./GoogleCoastalMap";
import { MapLibreCoastalMap } from "./MapLibreCoastalMap";

/**
 * Selects map implementation by environment configuration with safe fallback.
 */
export function CoastalMap() {
  const provider = import.meta.env.VITE_MAP_PROVIDER ?? "maplibre";
  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  if (provider === "google" && hasGoogleKey) {
    return <GoogleCoastalMap />;
  }

  return <MapLibreCoastalMap />;
}

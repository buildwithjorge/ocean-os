import { GoogleCoastalMap } from "./GoogleCoastalMap";
import { MapLibreCoastalMap } from "./MapLibreCoastalMap";

export function CoastalMap() {
  const provider = import.meta.env.VITE_MAP_PROVIDER ?? "maplibre";
  const hasGoogleKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  if (provider === "google" && hasGoogleKey) {
    return <GoogleCoastalMap />;
  }

  return <MapLibreCoastalMap />;
}

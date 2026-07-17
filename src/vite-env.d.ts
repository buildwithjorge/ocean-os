/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SARGASSUM_SOURCE?: "mock" | "noaa-erddap";
  readonly VITE_NOAA_AFAI_DATASET_ID?: string;
  readonly VITE_NOAA_BBOX?: string;
  readonly VITE_MAP_PROVIDER?: "maplibre" | "google";
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

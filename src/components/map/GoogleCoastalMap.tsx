import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Compass, Crosshair, Layers3, LocateFixed, Palette, Ruler, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useAppContext } from "../../app/AppContext";
import { coastalLabels } from "../../app/mockData";
import { MapLayerControl } from "./MapLayerControl";
import { TimelineControl } from "./TimelineControl";

type BeachCounty = "Palm Beach" | "Broward" | "Miami-Dade";

type CurrentSample = {
  speed: number;
  direction: number;
  source: "open-meteo" | "fallback";
  observedAt: string;
};

type CurrentProbe = CurrentSample & {
  lat: number;
  lon: number;
};

const HALLANDALE: [number, number] = [-80.1264, 25.9861];
const countyFilters = ["All", "Palm Beach", "Broward", "Miami-Dade"];
const countyOrder: BeachCounty[] = ["Palm Beach", "Broward", "Miami-Dade"];
const countyCenters: Record<string, [number, number]> = {
  "Palm Beach": [-80.083, 26.64],
  Broward: [-80.17, 26.19],
  "Miami-Dade": [-80.2, 25.72],
};
const countyColors: Record<BeachCounty, string> = {
  "Palm Beach": "#F4B744",
  Broward: "#30C7F2",
  "Miami-Dade": "#FF625F",
};
const EAST_COAST_BOUNDS: google.maps.LatLngBoundsLiteral = {
  west: -80.46,
  south: 25.08,
  east: -80.03,
  north: 26.94,
};

const basemapModes = ["roadmap", "terrain", "satellite", "hybrid"] as const;

type BasemapMode = (typeof basemapModes)[number];

export function GoogleCoastalMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const beachMarkersRef = useRef<google.maps.Marker[]>([]);
  const selectedRingRef = useRef<google.maps.Marker | null>(null);
  const impactMarkerRef = useRef<google.maps.Marker | null>(null);
  const forecastLineRef = useRef<google.maps.Polyline | null>(null);
  const forecastCorridorRef = useRef<google.maps.Polyline | null>(null);
  const currentVectorLinesRef = useRef<google.maps.Polyline[]>([]);
  const drawMarkersRef = useRef<google.maps.Marker[]>([]);

  const { state, jurisdictions, forecastCheckpoints, dispatch } = useAppContext();
  const [selectedCounty, setSelectedCounty] = useState<(typeof countyFilters)[number]>("All");
  const [basemapMode, setBasemapMode] = useState<BasemapMode>("hybrid");
  const [drawOn, setDrawOn] = useState(false);
  const [measureOn, setMeasureOn] = useState(false);
  const [currentProbe, setCurrentProbe] = useState<CurrentProbe | null>(null);
  const [currentsLoading, setCurrentsLoading] = useState(false);
  const [gridUpdatedAt, setGridUpdatedAt] = useState<string | null>(null);

  const selectedCenter = useMemo(() => {
    return jurisdictions.find((j) => j.name === state.selectedJurisdiction)?.center ?? HALLANDALE;
  }, [state.selectedJurisdiction, jurisdictions]);

  const timelineFocusCenter = useMemo(() => {
    return getTimelineFocusCenter(state.timelineHourOffset, forecastCheckpoints, selectedCenter);
  }, [forecastCheckpoints, selectedCenter, state.timelineHourOffset]);

  const countyCounts = useMemo(() => {
    const counts = {
      "Palm Beach": 0,
      Broward: 0,
      "Miami-Dade": 0,
    } as Record<BeachCounty, number>;

    for (const label of coastalLabels) {
      counts[label.county] += 1;
    }

    return counts;
  }, []);

  const forecastTrackSummary = useMemo(() => {
    if (!forecastCheckpoints.length) {
      return "No active drift track";
    }

    const next = forecastCheckpoints[0];
    return `Track starts ${next.label} and projects drift toward shoreline checkpoints.`;
  }, [forecastCheckpoints]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    void ensureGoogleMapsLoaded(apiKey).then(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 26.05, lng: -80.17 },
        zoom: 8.8,
        mapTypeId: "hybrid",
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      });

      mapRef.current = map;
      map.fitBounds(EAST_COAST_BOUNDS);

      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lng = event.latLng?.lng();
        if (lat === undefined || lng === undefined) return;

        if (drawOn) {
          const marker = new google.maps.Marker({
            map,
            position: { lat, lng },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#39cff7",
              fillOpacity: 0.9,
              strokeColor: "#ecf8ff",
              strokeWeight: 1.5,
              scale: 5,
            },
          });
          drawMarkersRef.current.push(marker);
          dispatch({
            type: "ADD_FEED_EVENT",
            payload: { text: `Map marker dropped at ${lat.toFixed(3)}, ${lng.toFixed(3)}`, category: "Operations" },
          });
          return;
        }

        void fetchCurrentSample(lat, lng)
          .then((sample) => {
            setCurrentProbe({ ...sample, lat, lon: lng });
          })
          .catch(() => setCurrentProbe(null));
      });

      refreshBeachMarkers();
      refreshForecastLine();
      refreshImpactMarker();
      void refreshCurrentVectors();
    });
  }, [dispatch, drawOn]);

  const refreshBeachMarkers = () => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of beachMarkersRef.current) marker.setMap(null);
    beachMarkersRef.current = [];

    for (const label of coastalLabels) {
      if (selectedCounty !== "All" && label.county !== selectedCounty) continue;

      const marker = new google.maps.Marker({
        map,
        position: { lat: label.coords[1], lng: label.coords[0] },
        title: `${label.name} (${label.county})`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: countyColors[label.county],
          fillOpacity: 0.95,
          strokeColor: "#eef7fc",
          strokeWeight: 1.4,
          scale: 5,
        },
      });

      beachMarkersRef.current.push(marker);
    }

    const selectedBeach = coastalLabels.find((item) => item.name === state.selectedJurisdiction);
    if (selectedRingRef.current) selectedRingRef.current.setMap(null);

    if (selectedBeach && (selectedCounty === "All" || selectedBeach.county === selectedCounty)) {
      selectedRingRef.current = new google.maps.Marker({
        map,
        position: { lat: selectedBeach.coords[1], lng: selectedBeach.coords[0] },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillOpacity: 0,
          strokeColor: "#DDF7FF",
          strokeWeight: 2,
          scale: 10,
        },
      });
    }
  };

  const refreshForecastLine = () => {
    const map = mapRef.current;
    if (!map) return;

    const path = forecastCheckpoints.map((cp) => ({ lat: cp.coords[1], lng: cp.coords[0] }));

    if (!forecastCorridorRef.current) {
      forecastCorridorRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#D95E5B",
        strokeOpacity: 0.2,
        strokeWeight: 18,
      });
    } else {
      forecastCorridorRef.current.setPath(path);
    }

    if (!forecastLineRef.current) {
      forecastLineRef.current = new google.maps.Polyline({
        map,
        path,
        strokeColor: "#D95E5B",
        strokeOpacity: 0.95,
        strokeWeight: 4,
      });
    } else {
      forecastLineRef.current.setPath(path);
    }

    const show = state.layers.sargassum;
    forecastCorridorRef.current.setVisible(show);
    forecastLineRef.current.setVisible(show);
  };

  const refreshImpactMarker = () => {
    const map = mapRef.current;
    if (!map) return;

    const position = { lat: timelineFocusCenter[1], lng: timelineFocusCenter[0] };
    if (!impactMarkerRef.current) {
      impactMarkerRef.current = new google.maps.Marker({
        map,
        position,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#FF625F",
          fillOpacity: 0.95,
          strokeColor: "#EEF7FC",
          strokeWeight: 2,
          scale: 7,
        },
      });
    } else {
      impactMarkerRef.current.setPosition(position);
    }
  };

  const refreshCurrentVectors = async () => {
    const map = mapRef.current;
    if (!map || !state.layers.currents) return;

    setCurrentsLoading(true);
    try {
      for (const line of currentVectorLinesRef.current) line.setMap(null);
      currentVectorLinesRef.current = [];

      const points = [
        [-0.16, -0.12],
        [0, -0.12],
        [0.16, -0.12],
        [-0.16, 0],
        [0, 0],
        [0.16, 0],
        [-0.16, 0.12],
        [0, 0.12],
        [0.16, 0.12],
      ] as const;

      const samples = await Promise.all(
        points.map(([dx, dy]) => fetchCurrentSample(timelineFocusCenter[1] + dy, timelineFocusCenter[0] + dx)),
      );

      samples.forEach((sample, index) => {
        const baseLng = timelineFocusCenter[0] + points[index][0];
        const baseLat = timelineFocusCenter[1] + points[index][1];
        const [vLng, vLat] = vectorFromDirection(sample.direction, 0.05 + sample.speed * 0.05);

        const polyline = new google.maps.Polyline({
          map,
          path: [
            { lat: baseLat, lng: baseLng },
            { lat: baseLat + vLat, lng: baseLng + vLng },
          ],
          strokeColor: "#39cff7",
          strokeOpacity: 0.82,
          strokeWeight: Math.max(1.3, sample.speed * 1.8),
        });

        currentVectorLinesRef.current.push(polyline);
      });

      setGridUpdatedAt(new Date().toISOString());
    } finally {
      setCurrentsLoading(false);
    }
  };

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setMapTypeId(basemapMode);
    dispatch({ type: "ADD_FEED_EVENT", payload: { text: `Basemap switched to google-${basemapMode}`, category: "Operations" } });
  }, [basemapMode, dispatch]);

  useEffect(() => {
    refreshBeachMarkers();
  }, [selectedCounty, state.selectedJurisdiction]);

  useEffect(() => {
    refreshForecastLine();
    void refreshCurrentVectors();
  }, [forecastCheckpoints, state.layers.currents, state.layers.sargassum]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    refreshImpactMarker();
    map.panTo({ lat: timelineFocusCenter[1], lng: timelineFocusCenter[0] });
    map.setZoom(10);
  }, [timelineFocusCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedCounty === "All") {
      map.fitBounds(EAST_COAST_BOUNDS);
    } else {
      const c = countyCenters[selectedCounty];
      map.panTo({ lat: c[1], lng: c[0] });
      map.setZoom(10.5);
    }

    dispatch({ type: "ADD_FEED_EVENT", payload: { text: `County filter set to ${selectedCounty}`, category: "Operations" } });
  }, [dispatch, selectedCounty]);

  const map = mapRef.current;

  const saveBookmark = () => {
    if (!map) return;
    const center = map.getCenter();
    if (!center) return;
    localStorage.setItem("tritonBookmark", JSON.stringify({ lng: center.lng(), lat: center.lat(), zoom: map.getZoom() }));
  };

  const restoreBookmark = () => {
    if (!map) return;
    const raw = localStorage.getItem("tritonBookmark");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { lng: number; lat: number; zoom: number };
    map.panTo({ lat: parsed.lat, lng: parsed.lng });
    map.setZoom(parsed.zoom);
  };

  const screenshot = () => {
    dispatch({
      type: "ADD_FEED_EVENT",
      payload: { text: "Screenshot export is disabled for Google provider. Use browser capture workflow.", category: "Operations" },
    });
  };

  return (
    <section className="map-panel">
      <div ref={mapContainerRef} className={`map-root ${measureOn ? "measure-on" : ""}`} aria-label="Coastal operations map" />

      <div className="map-title-chip">
        <span className="tiny-label">Regional Coastal Operations Map</span>
        <strong>Google Earth-Style Operations View</strong>
      </div>

      <div className="map-filter-row">
        {countyFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={`map-filter-chip ${selectedCounty === item ? "active" : ""}`}
            onClick={() => setSelectedCounty(item)}
          >
            {item}
          </button>
        ))}
        <div className="map-style-switch" role="group" aria-label="Basemap styles">
          {basemapModes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={`map-filter-chip ${basemapMode === mode ? "active" : ""}`}
              onClick={() => setBasemapMode(mode)}
            >
              <Palette size={12} /> {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="county-summary-row" aria-label="County beach coverage summary">
        {countyOrder.map((county) => (
          <button
            key={county}
            type="button"
            className={`county-summary-chip ${selectedCounty === county ? "active" : ""}`}
            onClick={() => setSelectedCounty(county)}
            aria-label={`Filter beaches to ${county}`}
          >
            <span className="county-dot" style={{ backgroundColor: countyColors[county] }} />
            <span>{county}</span>
            <strong>{countyCounts[county]}</strong>
          </button>
        ))}
      </div>

      <div className="map-controls top-left">
        <button type="button" onClick={() => map?.setZoom((map.getZoom() ?? 9) + 1)} aria-label="Zoom in"><ZoomIn size={14} /></button>
        <button type="button" onClick={() => map?.setZoom((map.getZoom() ?? 9) - 1)} aria-label="Zoom out"><ZoomOut size={14} /></button>
        <button type="button" onClick={() => map?.panTo({ lat: selectedCenter[1], lng: selectedCenter[0] })} aria-label="Recenter"><LocateFixed size={14} /></button>
      </div>

      <div className="map-controls top-right">
        <button
          type="button"
          aria-label="Draw"
          className={drawOn ? "active" : ""}
          onClick={() => {
            setDrawOn((enabled) => {
              const next = !enabled;
              dispatch({ type: "ADD_FEED_EVENT", payload: { text: `Draw mode ${next ? "enabled" : "disabled"}`, category: "Operations" } });
              return next;
            });
          }}
        >
          <Crosshair size={14} />
        </button>
        <button
          type="button"
          aria-label="Toggle map layers"
          className={state.mapLayerPanelOpen ? "active" : ""}
          onClick={() => dispatch({ type: "TOGGLE_MAP_LAYER_PANEL" })}
        >
          <Layers3 size={14} />
        </button>
        <button type="button" aria-label="Measure" onClick={() => setMeasureOn((v) => !v)}><Ruler size={14} /></button>
        <button type="button" aria-label="Bookmark" onClick={saveBookmark}><Save size={14} /></button>
        <button type="button" aria-label="Restore bookmark" onClick={restoreBookmark}><Compass size={14} /></button>
        <button type="button" aria-label="Screenshot" onClick={screenshot}><Camera size={14} /></button>
      </div>

      {state.mapLayerPanelOpen ? <div className="map-overlay layers"><MapLayerControl /></div> : null}
      <div className="map-scale">Google Maps</div>
      <div className="map-overlay timeline"><TimelineControl /></div>

      <div className="map-layer-status">
        <Layers3 size={14} />
        <span>Forecast: {state.layers.sargassum ? "On" : "Off"}</span>
        <span>Current: {state.layers.currents ? "On" : "Off"}</span>
        <span>Wind: {state.layers.wind ? "On" : "Off"}</span>
      </div>

      <div className="map-current-card">
        <div className="map-current-head">
          <strong>Ocean Current Probe</strong>
          <span>{currentsLoading ? "Refreshing" : gridUpdatedAt ? `Updated ${new Date(gridUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Awaiting"}</span>
        </div>
        {currentProbe ? (
          <>
            <div className="map-current-stats">
              <div>
                <span>Speed</span>
                <strong>{currentProbe.speed.toFixed(2)} m/s</strong>
              </div>
              <div>
                <span>Direction</span>
                <strong>{Math.round(currentProbe.direction)} deg</strong>
              </div>
            </div>
            <p>
              Probe: {currentProbe.lat.toFixed(3)}, {currentProbe.lon.toFixed(3)} ({currentProbe.source})
            </p>
          </>
        ) : (
          <p>Click anywhere on the map to probe real marine current direction and speed.</p>
        )}
      </div>

      <div className="map-legend-card">
        <h5>Sargassum Level</h5>
        <div><span className="dot low" />Low</div>
        <div><span className="dot moderate" />Moderate</div>
        <div><span className="dot high" />High</div>
        <div><span className="dot severe" />Severe</div>
        <div><span className="dot extreme" />Extreme</div>
        <div className="legend-divider" />
        <div className="legend-track-row"><span className="track-line" />Forecast drift track (red)</div>
        <p className="legend-track-note">{forecastTrackSummary}</p>
      </div>
    </section>
  );
}

function getTimelineFocusCenter(
  timelineHourOffset: number,
  checkpoints: Array<{ coords: [number, number] }>,
  fallback: [number, number],
): [number, number] {
  if (!checkpoints.length) return fallback;

  const normalized = (timelineHourOffset + 24) / 96;
  const index = Math.max(0, Math.min(checkpoints.length - 1, Math.round(normalized * (checkpoints.length - 1))));
  return checkpoints[index]?.coords ?? fallback;
}

function vectorFromDirection(direction: number, distance: number): [number, number] {
  const radians = (direction * Math.PI) / 180;
  const dx = Math.sin(radians) * distance;
  const dy = Math.cos(radians) * distance;
  return [dx, dy];
}

async function fetchCurrentSample(lat: number, lon: number, signal?: AbortSignal): Promise<CurrentSample> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=ocean_current_velocity,ocean_current_direction&forecast_days=1&timezone=UTC`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Current fetch failed: ${response.status}`);

    const payload = (await response.json()) as {
      hourly?: {
        time?: string[];
        ocean_current_velocity?: number[];
        ocean_current_direction?: number[];
      };
    };

    const times = payload.hourly?.time ?? [];
    const speeds = payload.hourly?.ocean_current_velocity ?? [];
    const directions = payload.hourly?.ocean_current_direction ?? [];

    if (!times.length || !speeds.length || !directions.length) {
      throw new Error("Missing marine current fields");
    }

    const nowIsoHour = new Date().toISOString().slice(0, 13);
    const nearestIndex = Math.max(0, times.findIndex((entry) => entry.startsWith(nowIsoHour)));

    return {
      speed: Number(speeds[nearestIndex] ?? speeds[0] ?? 1.1),
      direction: Number(directions[nearestIndex] ?? directions[0] ?? 110),
      source: "open-meteo",
      observedAt: times[nearestIndex] ?? new Date().toISOString(),
    };
  } catch {
    return {
      speed: 1.05 + Math.abs(Math.sin(lat + lon)) * 0.45,
      direction: 95 + (Math.abs(Math.cos(lat * lon)) * 70),
      source: "fallback",
      observedAt: new Date().toISOString(),
    };
  }
}

async function ensureGoogleMapsLoaded(apiKey: string): Promise<void> {
  if (globalThis.google?.maps) return;

  const scriptId = "triton-google-maps-sdk";
  const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (existing) {
    await waitForScriptLoad(existing);
    if (!globalThis.google?.maps) {
      throw new Error("Google Maps failed to initialize");
    }
    return;
  }

  const script = document.createElement("script");
  script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  await waitForScriptLoad(script);
  if (!globalThis.google?.maps) {
    throw new Error("Google Maps failed to initialize");
  }
}

function waitForScriptLoad(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (script.dataset.loaded === "true") {
      resolve();
      return;
    }

    const onLoad = () => {
      script.dataset.loaded = "true";
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      resolve();
    };

    const onError = () => {
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      reject(new Error("Failed to load Google Maps script"));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
  });
}

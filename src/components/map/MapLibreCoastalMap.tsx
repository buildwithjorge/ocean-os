/**
 * Module: MapLibreCoastalMap
 * Purpose: Project runtime and documentation surface.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Camera, Compass, Crosshair, Layers3, LocateFixed, Palette, Ruler, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useAppContext } from "../../app/AppContext";
import { coastalLabels } from "../../app/mockData";
import { MapLayerControl } from "./MapLayerControl";
import { TimelineControl } from "./TimelineControl";
import { addForecastLayers } from "./ForecastTrack";
import { CurrentParticles } from "./CurrentParticles";

/**
 * MapLibre provider map implementation for full local/open-source map mode.
 */

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
const EAST_COAST_BOUNDS: [[number, number], [number, number]] = [[-80.46, 25.08], [-80.03, 26.94]];

const basemapStyles: Record<"dark" | "nautical" | "satellite", maplibregl.StyleSpecification | string> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  nautical: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  satellite: {
    version: 8,
    sources: {
      esri: {
        type: "raster",
        tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
        attribution: "Esri World Imagery",
      },
    },
    layers: [{ id: "esri", type: "raster", source: "esri" }],
  },
};
const GRID_OFFSETS = [
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

export function MapLibreCoastalMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { state, jurisdictions, forecastCheckpoints, dispatch } = useAppContext();
  const [selectedCounty, setSelectedCounty] = useState<(typeof countyFilters)[number]>("All");
  const [basemapKey, setBasemapKey] = useState<keyof typeof basemapStyles>("dark");
  const [drawOn, setDrawOn] = useState(false);
  const [measureOn, setMeasureOn] = useState(false);
  const [currentProbe, setCurrentProbe] = useState<CurrentProbe | null>(null);
  const [currentsLoading, setCurrentsLoading] = useState(false);
  const [gridUpdatedAt, setGridUpdatedAt] = useState<string | null>(null);
  const [flowModel, setFlowModel] = useState({ direction: 112, speed: 1.2 });

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

  // Creates or refreshes static operational overlay layers after style load.
  const initializeOperationalLayers = useCallback((map: maplibregl.Map) => {
    addForecastLayers(map, forecastCheckpoints);

    if (!map.getSource("beach-points")) {
      map.addSource("beach-points", {
        type: "geojson",
        data: buildBeachFeatureCollection(state.selectedJurisdiction),
      });
    }

    if (!map.getLayer("beach-points")) {
      map.addLayer({
        id: "beach-points",
        type: "circle",
        source: "beach-points",
        paint: {
          "circle-radius": 5.5,
          "circle-color": [
            "match",
            ["get", "county"],
            "Palm Beach", "#F4B744",
            "Broward", "#30C7F2",
            "Miami-Dade", "#FF625F",
            "#93A8B7",
          ],
          "circle-stroke-width": 1.4,
          "circle-stroke-color": "#EAF7FF",
        },
      });
    }

    if (!map.getLayer("beach-selected-ring")) {
      map.addLayer({
        id: "beach-selected-ring",
        type: "circle",
        source: "beach-points",
        filter: ["==", ["get", "selected"], 1],
        paint: {
          "circle-radius": 10,
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#DDF7FF",
        },
      });
    }

    if (!map.getLayer("beach-labels")) {
      map.addLayer({
        id: "beach-labels",
        type: "symbol",
        source: "beach-points",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold"],
          "text-size": 11,
          "text-offset": [0, 1.2],
        },
        paint: {
          "text-color": "#EEF7FC",
          "text-halo-color": "rgba(3,8,18,0.9)",
          "text-halo-width": 1,
        },
      });
    }

    if (!map.getSource("impact")) {
      map.addSource("impact", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "Point", coordinates: selectedCenter }, properties: {} },
      });
    }
    if (!map.getLayer("impact-point")) {
      map.addLayer({
        id: "impact-point",
        type: "circle",
        source: "impact",
        paint: {
          "circle-radius": 8,
          "circle-color": "#FF625F",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#EEF7FC",
        },
      });
    }
  }, [forecastCheckpoints, selectedCenter, state.selectedJurisdiction]);

  // Draws vector lines representing sampled current direction and speed.
  const renderCurrentGrid = useCallback((map: maplibregl.Map, center: [number, number], samples: CurrentSample[]) => {
    const lineFeatures = samples.map((sample, index) => {
      const [dx, dy] = vectorFromDirection(sample.direction, 0.05 + sample.speed * 0.05);
      const baseLon = center[0] + GRID_OFFSETS[index][0];
      const baseLat = center[1] + GRID_OFFSETS[index][1];

      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [baseLon, baseLat],
            [baseLon + dx, baseLat + dy],
          ],
        },
        properties: {
          speed: sample.speed,
        },
      };
    });

    const geoJson = {
      type: "FeatureCollection",
      features: lineFeatures,
    };

    if (!map.getSource("current-vectors")) {
      map.addSource("current-vectors", {
        type: "geojson",
        data: geoJson,
      });

      map.addLayer({
        id: "current-vectors-line",
        type: "line",
        source: "current-vectors",
        paint: {
          "line-color": "#39cff7",
          "line-width": ["interpolate", ["linear"], ["get", "speed"], 0, 1.4, 2, 3.8],
          "line-opacity": 0.82,
        },
      });
    } else {
      const source = map.getSource("current-vectors") as maplibregl.GeoJSONSource;
      source.setData(geoJson);
    }

    if (map.getLayer("current-vectors-line")) {
      map.setLayoutProperty("current-vectors-line", "visibility", state.layers.currents ? "visible" : "none");
    }
  }, [state.layers.currents]);

  // Fetches current samples around the selected center and updates map vectors.
  const refreshCurrentGrid = useCallback(async (center: [number, number], signal?: AbortSignal) => {
    if (!state.layers.currents) return;

    setCurrentsLoading(true);
    try {
      const points = GRID_OFFSETS.map(([lonOffset, latOffset]) => [center[1] + latOffset, center[0] + lonOffset] as [number, number]);
      const samples = await Promise.all(points.map(([lat, lon]) => fetchCurrentSample(lat, lon, signal)));
      const map = mapRef.current;
      if (!map) return;
      renderCurrentGrid(map, center, samples);
      const avgSpeed = samples.reduce((sum, sample) => sum + sample.speed, 0) / samples.length;
      const avgDirection = samples.reduce((sum, sample) => sum + sample.direction, 0) / samples.length;
      setFlowModel({ direction: avgDirection, speed: avgSpeed });
      setGridUpdatedAt(new Date().toISOString());
    } finally {
      setCurrentsLoading(false);
    }
  }, [renderCurrentGrid, state.layers.currents]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyles[basemapKey],
      center: [-80.17, 26.05],
      zoom: 8.8,
      pitch: 35,
      bearing: -8,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      initializeOperationalLayers(map);
      map.fitBounds(EAST_COAST_BOUNDS, { padding: 42, duration: 500, maxZoom: 10.5 });

      void refreshCurrentGrid(selectedCenter);

      map.on("click", (event) => {
        if (drawOn) {
          dispatch({
            type: "ADD_FEED_EVENT",
            payload: {
              text: `Map marker dropped at ${event.lngLat.lat.toFixed(3)}, ${event.lngLat.lng.toFixed(3)}`,
              category: "Operations",
            },
          });
          return;
        }
        void fetchCurrentSample(event.lngLat.lat, event.lngLat.lng)
          .then((sample) => {
            setCurrentProbe({
              ...sample,
              lat: event.lngLat.lat,
              lon: event.lngLat.lng,
            });
          })
          .catch(() => {
            setCurrentProbe(null);
          });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [basemapKey, dispatch, drawOn, initializeOperationalLayers, refreshCurrentGrid, selectedCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addForecastLayers(map, forecastCheckpoints);
  }, [forecastCheckpoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const rehydrate = () => {
      initializeOperationalLayers(map);
      void refreshCurrentGrid(selectedCenter);
    };

    map.on("style.load", rehydrate);
    return () => {
      map.off("style.load", rehydrate);
    };
  }, [initializeOperationalLayers, refreshCurrentGrid, selectedCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const controller = new AbortController();
    void refreshCurrentGrid(selectedCenter, controller.signal);

    return () => controller.abort();
  }, [selectedCenter, refreshCurrentGrid, state.layers.currents]);

  useEffect(() => {
    mapRef.current?.flyTo({ center: timelineFocusCenter, duration: state.playbackRunning ? 700 : 520, zoom: 10.2 });
  }, [state.playbackRunning, timelineFocusCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(basemapStyles[basemapKey]);
  }, [basemapKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const countyFilter: maplibregl.FilterSpecification | null = selectedCounty === "All"
      ? null
      : (["==", ["get", "county"], selectedCounty] as maplibregl.FilterSpecification);

    if (map.getLayer("beach-points")) {
      map.setFilter("beach-points", countyFilter);
    }
    if (map.getLayer("beach-labels")) {
      map.setFilter("beach-labels", countyFilter);
    }
    if (map.getLayer("beach-selected-ring")) {
      const selectedFeatureFilter: maplibregl.FilterSpecification = selectedCounty === "All"
        ? (["==", ["get", "selected"], 1] as maplibregl.FilterSpecification)
        : (["all", ["==", ["get", "selected"], 1], ["==", ["get", "county"], selectedCounty]] as maplibregl.FilterSpecification);
      map.setFilter("beach-selected-ring", selectedFeatureFilter);
    }

    if (selectedCounty === "All") {
      map.fitBounds(EAST_COAST_BOUNDS, { padding: 42, duration: 580, maxZoom: 10.5 });
    } else {
      const target = countyCenters[selectedCounty] ?? selectedCenter;
      map.flyTo({ center: target, zoom: 10.6, duration: 580 });
    }
  }, [selectedCenter, selectedCounty]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const beachSource = map.getSource("beach-points") as maplibregl.GeoJSONSource | undefined;
    if (beachSource) {
      beachSource.setData(buildBeachFeatureCollection(state.selectedJurisdiction));
    }

    const impact = map.getSource("impact") as maplibregl.GeoJSONSource | undefined;
    if (impact) {
      impact.setData({
        type: "Feature",
        geometry: { type: "Point", coordinates: timelineFocusCenter },
        properties: { beach: state.selectedJurisdiction },
      });
    }
  }, [state.selectedJurisdiction, timelineFocusCenter]);

  const map = mapRef.current;

  const saveBookmark = () => {
    if (!map) return;
    const center = map.getCenter();
    localStorage.setItem("tritonBookmark", JSON.stringify({ lng: center.lng, lat: center.lat, zoom: map.getZoom() }));
  };

  const restoreBookmark = () => {
    if (!map) return;
    const raw = localStorage.getItem("tritonBookmark");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { lng: number; lat: number; zoom: number };
    map.flyTo({ center: [parsed.lng, parsed.lat], zoom: parsed.zoom, duration: 650 });
  };

  const screenshot = () => {
    const canvas = map?.getCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `triton-map-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <section className="map-panel">
      <div ref={mapContainerRef} className={`map-root ${measureOn ? "measure-on" : ""}`} aria-label="Coastal operations map" />

      <div className="map-title-chip">
        <span className="tiny-label">Regional Coastal Operations Map</span>
        <strong>Live Sargassum Coverage</strong>
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
          {(Object.keys(basemapStyles) as Array<keyof typeof basemapStyles>).map((key) => (
            <button
              key={key}
              type="button"
              className={`map-filter-chip ${basemapKey === key ? "active" : ""}`}
              onClick={() => setBasemapKey(key)}
            >
              <Palette size={12} /> {key}
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
        <button type="button" onClick={() => map?.zoomIn()} aria-label="Zoom in"><ZoomIn size={14} /></button>
        <button type="button" onClick={() => map?.zoomOut()} aria-label="Zoom out"><ZoomOut size={14} /></button>
        <button type="button" onClick={() => map?.flyTo({ center: selectedCenter, zoom: 10, duration: 500 })} aria-label="Recenter"><LocateFixed size={14} /></button>
      </div>

      <div className="map-controls top-right">
        <button
          type="button"
          aria-label="Draw"
          className={drawOn ? "active" : ""}
          onClick={() => {
            setDrawOn((enabled) => !enabled);
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
      <div className="map-scale">5 km</div>
      <div className="map-overlay timeline"><TimelineControl /></div>

      <CurrentParticles
        map={mapRef.current}
        enabled={state.layers.currents}
        hue="#30C7F2"
        speed={1.2}
        flowDirectionDeg={flowModel.direction}
        flowStrength={Math.max(0.8, flowModel.speed)}
        id="currents"
      />
      <CurrentParticles map={mapRef.current} enabled={state.layers.wind} hue="#F4B744" speed={1.8} id="wind" />

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

function buildBeachFeatureCollection(selectedBeach: string) {
  return {
    type: "FeatureCollection",
    features: coastalLabels.map((label) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: label.coords,
      },
      properties: {
        name: label.name,
        county: label.county as BeachCounty,
        selected: label.name === selectedBeach ? 1 : 0,
      },
    })),
  };
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

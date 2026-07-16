/**
 * Module: ForecastTrack
 * Purpose: Project runtime and documentation surface.
 */
import type maplibregl from "maplibre-gl";
import type { ForecastCheckpoint } from "../../app/mockData";

type PointFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
};

type LineFeature = {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: Record<string, unknown>;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<PointFeature | LineFeature>;
};

export function addForecastLayers(map: maplibregl.Map, checkpoints: ForecastCheckpoint[]) {
  if (checkpoints.length === 0) return;

  const lineCoords = checkpoints.map((cp) => cp.coords);
  const lineData: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: lineCoords },
        properties: {},
      },
    ],
  };

  if (!map.getSource("forecast-track")) {
    map.addSource("forecast-track", {
      type: "geojson",
      data: lineData,
    });

    map.addLayer({
      id: "forecast-corridor",
      type: "line",
      source: "forecast-track",
      paint: {
        "line-color": "#D95E5B",
        "line-width": 24,
        "line-opacity": 0.2,
      },
    });

    map.addLayer({
      id: "forecast-track-line",
      type: "line",
      source: "forecast-track",
      paint: {
        "line-color": "#D95E5B",
        "line-width": 4,
      },
    });
  } else {
    const trackSource = map.getSource("forecast-track") as maplibregl.GeoJSONSource;
    trackSource.setData(lineData);
  }

  removeStaleCheckpointLayers(map, checkpoints.length);

  checkpoints.forEach((cp, index) => {
    const id = `forecast-point-${index}`;
    const pointData: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: cp.coords },
          properties: { label: cp.time },
        },
      ],
    };

    if (!map.getSource(id)) {
      map.addSource(id, { type: "geojson", data: pointData });
      map.addLayer({
        id,
        type: "circle",
        source: id,
        paint: {
          "circle-radius": 5,
          "circle-color": "#FF625F",
          "circle-stroke-color": "#EEF7FC",
          "circle-stroke-width": 1.2,
        },
      });
    } else {
      const pointSource = map.getSource(id) as maplibregl.GeoJSONSource;
      pointSource.setData(pointData);
    }

    const uncertaintyId = `forecast-uncertainty-${index}`;
    const uncertaintyData: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: cp.coords,
          },
          properties: {},
        },
      ],
    };

    if (!map.getSource(uncertaintyId)) {
      map.addSource(uncertaintyId, {
        type: "geojson",
        data: uncertaintyData,
      });
      map.addLayer({
        id: uncertaintyId,
        type: "circle",
        source: uncertaintyId,
        paint: {
          "circle-radius": 10 + index * 4,
          "circle-color": "#D95E5B",
          "circle-opacity": 0.08,
          "circle-stroke-color": "#D95E5B",
          "circle-stroke-opacity": 0.4,
          "circle-stroke-width": 1,
        },
      });
    } else {
      const uncertaintySource = map.getSource(uncertaintyId) as maplibregl.GeoJSONSource;
      uncertaintySource.setData(uncertaintyData);
    }
  });
}

function removeStaleCheckpointLayers(map: maplibregl.Map, keepCount: number) {
  for (let index = keepCount; index < 12; index += 1) {
    const pointId = `forecast-point-${index}`;
    const uncertaintyId = `forecast-uncertainty-${index}`;

    if (map.getLayer(pointId)) map.removeLayer(pointId);
    if (map.getSource(pointId)) map.removeSource(pointId);

    if (map.getLayer(uncertaintyId)) map.removeLayer(uncertaintyId);
    if (map.getSource(uncertaintyId)) map.removeSource(uncertaintyId);
  }
}

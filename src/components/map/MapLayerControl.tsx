import { useAppContext } from "../../app/AppContext";

const layerConfig = [
  { key: "sargassum", label: "Sargassum forecast" },
  { key: "currents", label: "Ocean currents" },
  { key: "wind", label: "Wind field" },
  { key: "wave", label: "Wave height" },
  { key: "sar", label: "Satellite SAR" },
  { key: "sst", label: "Sea surface temperature" },
  { key: "chlorophyll", label: "Chlorophyll" },
  { key: "municipal", label: "Municipal boundaries" },
  { key: "turtle", label: "Turtle habitat" },
  { key: "imagery", label: "Aerial imagery" },
] as const;

export function MapLayerControl() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="map-layer-control">
      <div className="tiny-label">Map Layers</div>
      <div className="layer-grid">
        {layerConfig.map((layer) => (
          <label key={layer.key} className="layer-toggle">
            <input
              type="checkbox"
              checked={state.layers[layer.key]}
              onChange={() => dispatch({ type: "TOGGLE_LAYER", payload: layer.key })}
            />
            <span>{layer.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

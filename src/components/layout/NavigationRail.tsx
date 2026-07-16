import { useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  Camera,
  Cloud,
  Command,
  Layers3,
  Radar,
  Settings,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Tooltip } from "../shared/Tooltip";
import { useAppContext } from "../../app/AppContext";

const navItems = [
  { key: "command", label: "Command Center", icon: <Command size={16} /> },
  { key: "layers", label: "Map Layers", icon: <Layers3 size={16} /> },
  { key: "sensors", label: "Sensors", icon: <Radar size={16} /> },
  { key: "weather", label: "Weather", icon: <Cloud size={16} /> },
  { key: "cameras", label: "Cameras", icon: <Camera size={16} /> },
  { key: "alerts", label: "Alerts", icon: <Bell size={16} /> },
  { key: "analytics", label: "Analytics", icon: <ChartNoAxesCombined size={16} /> },
  { key: "maintenance", label: "Maintenance", icon: <Wrench size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export function NavigationRail() {
  const { dispatch } = useAppContext();
  const [activeKey, setActiveKey] = useState(navItems[0].key);

  const onNavClick = (key: string, label: string) => {
    setActiveKey(key);

    if (key === "command") {
      dispatch({ type: "SET_FEED_FILTER", payload: "All" });
      dispatch({ type: "SET_MAP_LAYER_PANEL", payload: false });
    }
    if (key === "layers") {
      dispatch({ type: "TOGGLE_MAP_LAYER_PANEL" });
    }
    if (key === "sensors") {
      dispatch({ type: "TOGGLE_LAYER", payload: "currents" });
    }
    if (key === "weather") {
      dispatch({ type: "TOGGLE_LAYER", payload: "wind" });
    }
    if (key === "cameras") {
      dispatch({ type: "TOGGLE_LAYER", payload: "imagery" });
    }
    if (key === "alerts") {
      dispatch({ type: "SET_FEED_FILTER", payload: "Alerts" });
    }
    if (key === "analytics") {
      dispatch({ type: "TOGGLE_LAYER", payload: "chlorophyll" });
      dispatch({ type: "SET_FEED_FILTER", payload: "Satellite" });
    }
    if (key === "maintenance") {
      dispatch({ type: "SET_FEED_FILTER", payload: "Operations" });
      dispatch({ type: "TOGGLE_LAYER", payload: "municipal" });
    }
    if (key === "settings") {
      dispatch({ type: "OPEN_DEPLOY_MODAL", payload: true });
    }

    dispatch({ type: "ADD_FEED_EVENT", payload: { text: `Navigation switched to ${label}`, category: "Operations" } });
  };

  return (
    <aside className="nav-rail" aria-label="Primary tools">
      <div className="rail-items">
        {navItems.map((item) => (
          <Tooltip text={item.label} key={item.key}>
            <button
              type="button"
              className={`rail-btn ${activeKey === item.key ? "active" : ""}`}
              aria-label={item.label}
              onClick={() => onNavClick(item.key, item.label)}
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="rail-footer">
        <button
          type="button"
          className="rail-btn alert"
          aria-label="Alert center"
          onClick={() => {
            setActiveKey("alerts");
            dispatch({ type: "SET_FEED_FILTER", payload: "Alerts" });
            dispatch({ type: "ADD_FEED_EVENT", payload: { text: "Alert center opened", category: "Alerts" } });
          }}
        >
          <TriangleAlert size={16} />
          <span className="alert-dot">4</span>
        </button>
      </div>
    </aside>
  );
}

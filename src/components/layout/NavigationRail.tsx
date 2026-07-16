/**
 * Module: NavigationRail
 * Purpose: Project runtime and documentation surface.
 */
import { useState } from "react";
import {
  Bell,
  ChartNoAxesCombined,
  Cloud,
  Command,
  Image as ImageIcon,
  Layers3,
  Radar,
  Settings,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Tooltip } from "../shared/Tooltip";
import { useAppContext } from "../../app/AppContext";
import { degToCompass } from "../../app/weatherDataSource";

const navItems = [
  { key: "command", label: "Command Center", icon: <Command size={16} /> },
  { key: "layers", label: "Map Layers", icon: <Layers3 size={16} /> },
  { key: "sensors", label: "Sensors", icon: <Radar size={16} /> },
  { key: "weather", label: "Weather", icon: <Cloud size={16} /> },
  { key: "cameras", label: "Satellite Imagery", icon: <ImageIcon size={16} /> },
  { key: "alerts", label: "Alerts", icon: <Bell size={16} /> },
  { key: "analytics", label: "Analytics", icon: <ChartNoAxesCombined size={16} /> },
  { key: "maintenance", label: "Fleet Readiness", icon: <Wrench size={16} /> },
  { key: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export function NavigationRail() {
  const { state, dispatch, alertCount, weather } = useAppContext();
  const [activeKey, setActiveKey] = useState(navItems[0].key);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const lowResourceAssets = state.assets.filter((asset) => {
    const match = /^(\d+)%$/.exec(asset.resource);
    return match ? Number(match[1]) < 80 : false;
  });

  const onNavClick = (key: string) => {
    setActiveKey(key);
    setOpenPopover((current) => {
      if (key === "sensors" || key === "weather" || key === "maintenance") {
        return current === key ? null : key;
      }
      return null;
    });

    if (key === "command") {
      dispatch({ type: "SET_FEED_FILTER", payload: "All" });
      dispatch({ type: "SET_MAP_LAYER_PANEL", payload: false });
      dispatch({ type: "SET_WORKSPACE_TAB", payload: "Dashboard" });
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
      dispatch({ type: "SET_WORKSPACE_TAB", payload: "Analytics" });
    }
    if (key === "maintenance") {
      dispatch({ type: "SET_FEED_FILTER", payload: "Operations" });
    }
    if (key === "settings") {
      dispatch({ type: "SET_WORKSPACE_TAB", payload: "Settings" });
    }
  };

  return (
    <aside className="nav-rail" aria-label="Primary tools">
      <div className="rail-items">
        {navItems.map((item) => (
          <Tooltip text={item.label} key={item.key}>
            <div className="rail-item-wrap">
              <button
                type="button"
                className={`rail-btn ${activeKey === item.key ? "active" : ""}`}
                aria-label={item.label}
                onClick={() => onNavClick(item.key)}
              >
                {item.icon}
              </button>
              {openPopover === item.key ? (
                <div className="nav-popover" role="dialog" aria-label={`${item.label} panel`}>
                  {item.key === "sensors" ? (
                    <>
                      <strong>Sensor Readings</strong>
                      <ul>
                        {state.riskDrivers.map((driver) => (
                          <li key={driver.key}>
                            <span>{driver.label}</span>
                            <span className={`level-${driver.level.toLowerCase()}`}>{driver.value}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {item.key === "weather" ? (
                    <>
                      <strong>Live Conditions</strong>
                      {weather ? (
                        <p>
                          {weather.tempF}F &middot; {weather.windMph} mph {degToCompass(weather.windDirectionDeg)}
                          {weather.source === "fallback" ? " (estimated)" : ""}
                        </p>
                      ) : (
                        <p>Loading…</p>
                      )}
                    </>
                  ) : null}
                  {item.key === "maintenance" ? (
                    <>
                      <strong>Fleet Readiness</strong>
                      {lowResourceAssets.length > 0 ? (
                        <ul>
                          {lowResourceAssets.map((asset) => (
                            <li key={asset.id}>
                              <span>{asset.name}</span>
                              <span>{asset.resource}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>All {state.assets.length} assets above 80% resource.</p>
                      )}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
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
          }}
        >
          <TriangleAlert size={16} />
          {alertCount > 0 ? <span className="alert-dot">{alertCount}</span> : null}
        </button>
      </div>
    </aside>
  );
}

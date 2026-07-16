/**
 * Module: TopCommandBar
 * Purpose: Project runtime and documentation surface.
 */
import { Bell, UserCircle2, Wind } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { useAppContext } from "../../app/AppContext";
import type { WorkspaceTab } from "../../app/AppContext";
import { degToCompass } from "../../app/weatherDataSource";

const tabs: WorkspaceTab[] = ["Dashboard", "Operations", "Assets", "Analytics", "Reports", "Settings"];

export function TopCommandBar() {
  const { state, jurisdictions, dispatch, alertCount, weather } = useAppContext();
  const now = new Date();

  // KPI chips are derived from real state instead of hardcoded values, reusing
  // the same alertCount computed once in AppContext.
  const kpiChips = [
    { label: "Beaches Online", value: String(jurisdictions.length) },
    { label: "Severe Alerts", value: String(alertCount), tone: alertCount > 0 ? ("critical" as const) : undefined },
  ];

  const onTabClick = (tab: WorkspaceTab) => {
    dispatch({ type: "SET_WORKSPACE_TAB", payload: tab });
  };

  return (
    <header className="top-command-bar">
      <div className="brand-block">
        <div className="logo-mark">T</div>
        <div>
          <div className="brand-line">TRITON</div>
          <div className="brand-sub">COASTAL OS</div>
        </div>
        <span className="ops-label">Operations Center</span>
      </div>

      <div className="top-center">
        <nav className="top-tabs" aria-label="Global sections">
          {tabs.map((tab) => (
            <button key={tab} type="button" className={`top-tab ${state.workspaceTab === tab ? "active" : ""}`} onClick={() => onTabClick(tab)}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="top-kpis">
          {kpiChips.map((chip) => (
            <div key={chip.label} className={`kpi-chip ${chip.tone === "critical" ? "critical" : ""}`}>
              <span>{chip.label}</span>
              <strong>{chip.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="top-meta">
        <button
          type="button"
          className="icon-chip"
          aria-label="Notifications"
          onClick={() => dispatch({ type: "SET_FEED_FILTER", payload: "Alerts" })}
        >
          <Bell size={14} />
          {alertCount > 0 ? <span className="alert-dot">{alertCount}</span> : null}
        </button>
        <div className="clock-wrap">
          <strong>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
          <span>{now.toLocaleDateString()}</span>
        </div>
        <div className="weather-wrap" title={weather?.source === "fallback" ? "Live weather unavailable — showing estimated conditions" : "Live conditions from Open-Meteo"}>
          <span>{weather ? `${weather.tempF}F${weather.source === "fallback" ? " (est.)" : ""}` : "--"}</span>
          <span className="wind">
            <Wind size={14} />
            {weather ? ` ${weather.windMph} mph ${degToCompass(weather.windDirectionDeg)}` : " --"}
          </span>
        </div>
        <StatusBadge label="Connected" tone="ok" />
        <button
          type="button"
          className="profile-btn"
          aria-label="Open settings"
          onClick={() => dispatch({ type: "SET_WORKSPACE_TAB", payload: "Settings" })}
        >
          <UserCircle2 size={18} />
          <div>
            <strong>N. Castro</strong>
            <span>Administrator</span>
          </div>
        </button>
      </div>
    </header>
  );
}

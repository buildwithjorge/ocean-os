import { Bell, Search, UserCircle2, Wind } from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { useAppContext } from "../../app/AppContext";
import type { WorkspaceTab } from "../../app/AppContext";

const tabs: WorkspaceTab[] = ["Dashboard", "Operations", "Assets", "Analytics", "Reports", "Settings"];

const kpiChips = [
  { label: "Beaches Online", value: "23" },
  { label: "Severe Alerts", value: "11", tone: "critical" as const },
];

export function TopCommandBar() {
  const { state, dispatch } = useAppContext();
  const now = new Date();

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
          aria-label="Search"
          onClick={() => dispatch({ type: "ADD_FEED_EVENT", payload: { text: "Search command opened", category: "Operations" } })}
        >
          <Search size={14} />
        </button>
        <button
          type="button"
          className="icon-chip"
          aria-label="Notifications"
          onClick={() => {
            dispatch({ type: "SET_FEED_FILTER", payload: "Alerts" });
            dispatch({ type: "ADD_FEED_EVENT", payload: { text: "Alerts filter applied from top bar", category: "Alerts" } });
          }}
        >
          <Bell size={14} />
        </button>
        <div className="clock-wrap">
          <strong>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
          <span>{now.toLocaleDateString()}</span>
        </div>
        <div className="weather-wrap">
          <span>84F</span>
          <span className="wind"><Wind size={14} /> 18 mph ESE</span>
        </div>
        <StatusBadge label="Connected" tone="ok" />
        <button
          type="button"
          className="profile-btn"
          aria-label="User profile"
          onClick={() => dispatch({ type: "ADD_FEED_EVENT", payload: { text: "Profile panel requested", category: "Operations" } })}
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

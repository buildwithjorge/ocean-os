import { useEffect, useState } from "react";
import { NavigationRail } from "./NavigationRail";
import { TopCommandBar } from "./TopCommandBar";
import { LeftIntelligencePanel } from "../intelligence/LeftIntelligencePanel";
import { RightIntelligencePanel } from "../intelligence/RightIntelligencePanel";
import { CoastalMap } from "../map/CoastalMap";
import { BottomOperationsGrid } from "../operations/BottomOperationsGrid";
import { AssetDetailDrawer } from "../operations/AssetDetailDrawer";
import { MissionDetailDrawer } from "../operations/MissionDetailDrawer";
import { FemaDraftModal } from "../operations/FemaDraftModal";
import { ConfirmationModal } from "../shared/ConfirmationModal";
import { useAppContext } from "../../app/AppContext";

export function AppShell() {
  const { state, dispatch, jurisdictions, forecastSource, forecastUpdatedAt, forecastMethodologyNote, forecastNote } = useAppContext();
  const [femaDraftOpen, setFemaDraftOpen] = useState(false);
  const activeAssets = state.assets.filter((asset) => asset.status !== "Staging").length;
  const alertCount = state.feed.filter((event) => event.category === "Alerts").length;
  const forecastUpdatedLabel = new Date(forecastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const forecastAgeMinutes = Math.max(0, Math.floor((Date.now() - new Date(forecastUpdatedAt).getTime()) / 60_000));
  const freshnessClass = forecastAgeMinutes > 180 ? "stale" : forecastAgeMinutes > 60 ? "aged" : "fresh";
  const freshnessLabel = forecastAgeMinutes > 180
    ? `Stale (${forecastAgeMinutes}m)`
    : forecastAgeMinutes > 60
      ? `Aging (${forecastAgeMinutes}m)`
      : `Fresh (${forecastAgeMinutes}m)`;

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dispatch({ type: "SELECT_ASSET", payload: null });
      dispatch({ type: "OPEN_MISSION", payload: null });
      dispatch({ type: "OPEN_DEPLOY_MODAL", payload: false });
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [dispatch]);

  return (
    <div className="app-root">
      <NavigationRail />
      <div className="command-workspace">
        <TopCommandBar />
        <div className="workspace-grid">
          <div className="left-column-stack">
            <section className="brand-hero" aria-label="Triton mission brief">
              <div className="brand-hero-head">
                <div className="brand-hero-mark">T</div>
                <div>
                  <h2>Command Snapshot</h2>
                  <p className="brand-hero-subtitle">{state.selectedJurisdiction}</p>
                </div>
              </div>

              <label className="brand-hero-select-wrap">
                <span>Jurisdiction</span>
                <select
                  className="brand-hero-select"
                  value={state.selectedJurisdiction}
                  onChange={(event) => dispatch({ type: "SET_JURISDICTION", payload: event.target.value })}
                >
                  {jurisdictions.map((jurisdiction) => (
                    <option key={jurisdiction.id} value={jurisdiction.name}>
                      {jurisdiction.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="brand-hero-grid">
                <div>
                  <span>Risk Index</span>
                  <strong>{state.riskIndex}</strong>
                </div>
                <div>
                  <span>Arrival ETA</span>
                  <strong>{state.arrivalEta}</strong>
                </div>
                <div>
                  <span>Active Assets</span>
                  <strong>{activeAssets}</strong>
                </div>
                <div>
                  <span>Open Missions</span>
                  <strong>{state.missions.length}</strong>
                </div>
              </div>

              <div className="brand-hero-meta">
                <span>Forecast source: {forecastSource === "noaa-erddap" ? "NOAA ERDDAP" : "Mock"}</span>
                <span>Updated: {forecastUpdatedLabel}</span>
                <span className={`freshness ${freshnessClass}`}>Forecast freshness: {freshnessLabel}</span>
                <span>Alerts: {alertCount}</span>
              </div>

              <p className="brand-hero-note">{forecastMethodologyNote}</p>
              {forecastNote ? <p className="brand-hero-note">{forecastNote}</p> : null}

              <div className="brand-hero-actions">
                <button type="button" className="btn-primary" onClick={() => dispatch({ type: "GENERATE_MISSION" })}>
                  Generate Mission
                </button>
                <button type="button" className="btn-ghost" onClick={() => dispatch({ type: "OPEN_DEPLOY_MODAL", payload: true })}>
                  Deploy Package
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-wide"
                  onClick={() => {
                    dispatch({ type: "GENERATE_FEMA_DRAFT" });
                    setFemaDraftOpen(true);
                  }}
                >
                  Generate FEMA Draft
                </button>
              </div>
            </section>
            <LeftIntelligencePanel />
          </div>
          <div className="center-stack">
            <CoastalMap />
            <BottomOperationsGrid />
          </div>
          <RightIntelligencePanel />
        </div>
      </div>

      <AssetDetailDrawer
        asset={state.assets.find((item) => item.id === state.selectedAssetId) ?? null}
        onClose={() => dispatch({ type: "SELECT_ASSET", payload: null })}
      />
      <MissionDetailDrawer
        mission={state.missions.find((item) => item.id === state.activeMissionId) ?? null}
        onClose={() => dispatch({ type: "OPEN_MISSION", payload: null })}
      />
      <ConfirmationModal
        open={state.deployModalOpen}
        title="Deploy Package Alpha"
        text="This action creates a live mission and updates the operational feed. Continue?"
        confirmLabel="Deploy Package"
        onConfirm={() => dispatch({ type: "DEPLOY_PACKAGE" })}
        onCancel={() => dispatch({ type: "OPEN_DEPLOY_MODAL", payload: false })}
      />
      <FemaDraftModal
        open={femaDraftOpen}
        jurisdiction={state.selectedJurisdiction}
        riskIndex={state.riskIndex}
        impactProbability={state.impactProbability}
        estimatedBiomass={state.estimatedBiomass}
        arrivalEta={state.arrivalEta}
        forecastSource={forecastSource === "noaa-erddap" ? "NOAA ERDDAP" : "Mock"}
        forecastMethodologyNote={forecastMethodologyNote}
        activeMission={state.missions.find((item) => item.id === state.activeMissionId) ?? null}
        onClose={() => setFemaDraftOpen(false)}
      />
    </div>
  );
}

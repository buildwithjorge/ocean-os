/**
 * Module: TritonAssistantPanel
 * Purpose: Project runtime and documentation surface.
 */
import { StatusBadge } from "../shared/StatusBadge";
import { useAppContext } from "../../app/AppContext";

function generateRecommendations(
  selectedJurisdiction: string,
  assets: Array<{ name: string; type: string; status: string }>,
  eta: string,
  missionForm: { startTime: string; staging: string; crew: string },
): string[] {
  const boats = assets.filter((asset) => asset.type === "boat");
  const loaders = assets.filter((asset) => asset.type === "loader");
  const crews = assets.filter((asset) => asset.type === "crew");
  const availableBoat = boats.find((asset) => asset.status !== "Staging")?.name ?? boats[0]?.name ?? "Primary boat";
  const availableLoader = loaders.find((asset) => asset.status !== "Staging")?.name ?? loaders[0]?.name ?? "Loader team";
  const crewName = crews[0]?.name ?? "Municipal response crew";

  return [
    `Dispatch ${availableBoat} to ${selectedJurisdiction} before ETA ${eta} with mission start ${missionForm.startTime}.`,
    `Stage ${availableLoader} at ${missionForm.staging} and pre-stage containment booms.`,
    `Assign ${crewName} and crew size ${missionForm.crew} for shoreline verification and evidence capture.`,
    `Issue partner update to hotels and beach operations for ${selectedJurisdiction}.`,
  ];
}

export function TritonAssistantPanel() {
  const { state, forecastUpdatedAt, forecastMethodologyNote } = useAppContext();
  const recommendations = generateRecommendations(state.selectedJurisdiction, state.assets, state.arrivalEta, state.missionForm);
  const updatedLabel = new Date(forecastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="assistant-block">
      <div className="assistant-header">
        <h4>Triton Assistant</h4>
        <StatusBadge label="Rule-based decision support" tone="info" />
      </div>
      <p className="situation-brief">
        Forecast conditions indicate modeled impact risk for {state.selectedJurisdiction} within {state.arrivalEta}.
        Use these recommended actions as operational decision support, not autonomous AI output.
      </p>
      <p className="panel-footnote">Updated {updatedLabel}. {forecastMethodologyNote}</p>
      <ol className="recommend-list">
        {recommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <div className="outcome-cards">
        <div><span>Modeled Collection</span><strong>{state.estimatedBiomass[0]}-{state.estimatedBiomass[1]} t</strong></div>
        <div><span>Modeled Impact</span><strong>{state.impactProbability}%</strong></div>
        <div><span>Operational ETA</span><strong>{state.arrivalEta}</strong></div>
        <div><span>Risk Index (modeled)</span><strong>{state.riskIndex}</strong></div>
      </div>
    </div>
  );
}

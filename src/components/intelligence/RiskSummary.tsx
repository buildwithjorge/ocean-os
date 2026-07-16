import { StatusBadge } from "../shared/StatusBadge";
import { useAppContext } from "../../app/AppContext";
import { TsiArcGauge } from "../shared/TsiArcGauge";

export function RiskSummary() {
  const { state, forecastMethodologyNote } = useAppContext();

  return (
    <div className="risk-summary">
      <div className="risk-gauge-wrap">
        <TsiArcGauge value={state.riskIndex} />
        <div className="risk-topline">
          <div className="tiny-label">Forecast Confidence</div>
          <StatusBadge label={state.forecastConfidence} tone={state.forecastConfidence === "High" ? "critical" : "warn"} />
          <span className="risk-arrival">ETA {state.arrivalEta}</span>
        </div>
      </div>

      <div className="risk-mini-grid">
        <div>
          <span>Trend 7d</span>
          <strong>+2.4</strong>
        </div>
        <div>
          <span>Modeled Biomass</span>
          <strong>{state.estimatedBiomass[0]} t</strong>
        </div>
        <div>
          <span>Cleanup Cost</span>
          <strong>$225,432</strong>
        </div>
        <div>
          <span>Product Value</span>
          <strong>$60,210</strong>
        </div>
      </div>

      <div className="risk-probability-row">
        <span className="tiny-label">Modeled Impact Probability</span>
        <strong>{state.impactProbability}%</strong>
      </div>
      <p className="panel-footnote">{forecastMethodologyNote}</p>
    </div>
  );
}

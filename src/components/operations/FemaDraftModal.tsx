import type { Mission } from "../../app/mockData";

type FemaDraftModalProps = {
  open: boolean;
  jurisdiction: string;
  riskIndex: number;
  impactProbability: number;
  estimatedBiomass: [number, number];
  arrivalEta: string;
  forecastSource: string;
  forecastMethodologyNote: string;
  activeMission: Mission | null;
  onClose: () => void;
};

export function FemaDraftModal({
  open,
  jurisdiction,
  riskIndex,
  impactProbability,
  estimatedBiomass,
  arrivalEta,
  forecastSource,
  forecastMethodologyNote,
  activeMission,
  onClose,
}: FemaDraftModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="FEMA draft preview">
      <div className="modal-card fema-modal">
        <h3>FEMA Draft Preview</h3>
        <p className="fema-subtitle">Incident documentation packet for operational review before submission.</p>

        <div className="fema-grid">
          <div>
            <span>Jurisdiction</span>
            <strong>{jurisdiction}</strong>
          </div>
          <div>
            <span>Risk Index</span>
            <strong>{riskIndex} (modeled)</strong>
          </div>
          <div>
            <span>Impact Probability</span>
            <strong>{impactProbability}% (modeled)</strong>
          </div>
          <div>
            <span>Arrival ETA</span>
            <strong>{arrivalEta}</strong>
          </div>
          <div>
            <span>Biomass Estimate</span>
            <strong>{estimatedBiomass[0]}-{estimatedBiomass[1]} wet tons (modeled)</strong>
          </div>
          <div>
            <span>Forecast Source</span>
            <strong>{forecastSource}</strong>
          </div>
        </div>

        <p className="fema-subtitle">{forecastMethodologyNote}</p>

        <div className="fema-section">
          <h4>Mission Attachment</h4>
          {activeMission ? (
            <p>
              {activeMission.type} mission at {activeMission.startTime} with {activeMission.assets.length} assets and crew
              {" "}
              {activeMission.crew}.
            </p>
          ) : (
            <p>No active mission attached. Generate mission for stronger reimbursement package.</p>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Close</button>
          <button type="button" className="btn-primary" onClick={onClose}>Mark Draft Reviewed</button>
        </div>
      </div>
    </div>
  );
}

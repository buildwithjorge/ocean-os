/**
 * Module: RiskDriversPanel
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { useAppContext } from "../../app/AppContext";

export function RiskDriversPanel() {
  const { state } = useAppContext();

  return (
    <Panel title="Risk Drivers" subtitle="Real-time severity model">
      <div className="risk-bars">
        {state.riskDrivers.map((driver) => (
          <div key={driver.key} className="risk-bar-row">
            <div className="risk-bar-label">
              <span>{driver.label}</span>
              <strong>{driver.value}</strong>
            </div>
            <div className="risk-bar-track">
              <div className="risk-bar-fill" style={{ width: `${driver.numeric * 100}%` }} />
            </div>
            <span className={`level ${driver.level.toLowerCase()}`}>{driver.level}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

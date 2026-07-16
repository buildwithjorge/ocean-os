import { useAppContext } from "../../app/AppContext";
import { StatusBadge } from "../shared/StatusBadge";

export function RiskDriverList() {
  const { state } = useAppContext();

  return (
    <div className="risk-driver-list">
      {state.riskDrivers.slice(0, 4).map((driver) => (
        <div key={driver.key} className="driver-row">
          <div>
            <span className="driver-name">{driver.label}</span>
            <strong className="driver-value">{driver.value}</strong>
          </div>
          <StatusBadge
            label={driver.level}
            tone={driver.level === "High" ? "critical" : driver.level === "Moderate" ? "warn" : "ok"}
          />
        </div>
      ))}
      <div className="panel-footnote">Last update: 2 minutes ago - All systems operational</div>
    </div>
  );
}

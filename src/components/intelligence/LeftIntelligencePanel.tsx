/**
 * Module: LeftIntelligencePanel
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { JurisdictionSelector } from "./JurisdictionSelector";
import { RiskSummary } from "./RiskSummary";
import { RiskDriverList } from "./RiskDriverList";
import { StatusBadge } from "../shared/StatusBadge";

export function LeftIntelligencePanel() {
  return (
    <aside className="left-intel-panel">
      <Panel title="Jurisdiction Intelligence" subtitle="South Florida Coastal Command" badge={<StatusBadge label="Operational" tone="ok" />}>
        <JurisdictionSelector />
      </Panel>
      <Panel title="Risk Summary" subtitle="Hallandale Beach forecast envelope" badge={<StatusBadge label="Heavy" tone="critical" />}>
        <RiskSummary />
      </Panel>
      <Panel title="Risk Drivers" subtitle="Meteorological and oceanic">
        <RiskDriverList />
      </Panel>
    </aside>
  );
}

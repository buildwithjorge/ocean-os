/**
 * Module: RightIntelligencePanel
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { TritonAssistantPanel } from "./TritonAssistantPanel";
import { ResponsePackage } from "./ResponsePackage";
import { EventEconomics } from "./EventEconomics";

export function RightIntelligencePanel() {
  return (
    <aside className="right-intel-panel">
      <Panel title="AI Assistant" subtitle="Decision support">
        <TritonAssistantPanel />
      </Panel>
      <Panel title="Response Package" subtitle="Operational recommendation">
        <ResponsePackage />
      </Panel>
      <Panel title="Economic Opportunity" subtitle="Recovery pathways">
        <EventEconomics />
      </Panel>
    </aside>
  );
}

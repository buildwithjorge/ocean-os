import { Panel } from "../shared/Panel";
import { TritonAICopilot } from "./TritonAICopilot";
import { ResponsePackage } from "./ResponsePackage";
import { EventEconomics } from "./EventEconomics";

export function RightIntelligencePanel() {
  return (
    <aside className="right-intel-panel">
      <Panel title="AI Copilot" subtitle="Decision support">
        <TritonAICopilot />
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

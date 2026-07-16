/**
 * Module: BottomOperationsGrid
 * Purpose: Project runtime and documentation surface.
 */
import { LiveAssetsPanel } from "./LiveAssetsPanel";
import { MissionBuilder } from "./MissionBuilder";
import { OperationalFeed } from "./OperationalFeed";
import { RiskDriversPanel } from "./RiskDriversPanel";
import { UpcomingEvents } from "./UpcomingEvents";

export function BottomOperationsGrid() {
  return (
    <section className="bottom-grid">
      <LiveAssetsPanel />
      <OperationalFeed />
      <RiskDriversPanel />
      <MissionBuilder />
      <UpcomingEvents />
    </section>
  );
}

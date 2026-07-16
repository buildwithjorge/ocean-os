import type { Mission } from "../../app/mockData";

export function MissionDetailDrawer({ mission, onClose }: { mission: Mission | null; onClose: () => void }) {
  return (
    <aside className={`drawer left ${mission ? "open" : ""}`} aria-hidden={!mission}>
      {mission ? (
        <>
          <header>
            <h3>Mission Detail</h3>
            <button type="button" onClick={onClose} aria-label="Close mission drawer">Close</button>
          </header>
          <div className="drawer-content">
            <p><strong>{mission.type}</strong></p>
            <p>Jurisdiction: {mission.jurisdiction}</p>
            <p>Priority: {mission.priority}</p>
            <p>Start: {mission.startTime}</p>
            <p>Assets: {mission.assets.join(", ")}</p>
            <p>Crew: {mission.crew}</p>
            <p>Staging: {mission.staging}</p>
            <p>Duration: {mission.duration}</p>
            <p>{mission.summary}</p>
          </div>
        </>
      ) : null}
    </aside>
  );
}

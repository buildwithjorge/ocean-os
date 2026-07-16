import { Panel } from "../shared/Panel";

const events = [
  "May 21: High tide",
  "May 21: Full moon",
  "May 22: Commission briefing",
  "May 23: Equipment maintenance",
];

export function UpcomingEvents() {
  return (
    <Panel title="Upcoming Events" subtitle="Calendar and operations cadence">
      <ul className="upcoming-list">
        {events.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Panel>
  );
}

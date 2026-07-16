/**
 * Module: OperationalFeed
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { useAppContext } from "../../app/AppContext";

const filters = ["All", "AI", "Drone", "Satellite", "Operations", "Alerts"] as const;

export function OperationalFeed() {
  const { filteredFeed, state, dispatch } = useAppContext();

  return (
    <Panel
      title="Operational Feed"
      subtitle="Time-stamped mission events"
      actions={
        <div className="feed-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={state.feedFilter === filter ? "active" : ""}
              onClick={() => dispatch({ type: "SET_FEED_FILTER", payload: filter })}
            >
              {filter}
            </button>
          ))}
        </div>
      }
    >
      <ul className="feed-list">
        {filteredFeed.map((item) => (
          <li key={item.id}>
            <span className="time">{item.time}</span>
            <span className="text">{item.text}</span>
            <span className="category">{item.category}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

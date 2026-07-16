import { useState } from "react";
import { ChevronLeft, ChevronRight, List, Play, Pause } from "lucide-react";
import { useAppContext } from "../../app/AppContext";

const stops = [-24, -12, 0, 12, 24, 48, 72];

export function TimelineControl() {
  const { state, dispatch, timelineEvents } = useAppContext();
  const [eventsOpen, setEventsOpen] = useState(true);

  const onTimelineEventClick = (eventId: string) => {
    const selected = timelineEvents.find((item) => item.id === eventId);
    if (!selected) return;

    dispatch({ type: "SET_TIMELINE", payload: selected.hourOffset });

    if (selected.kind === "satellite") {
      dispatch({ type: "SET_LAYER", payload: { key: "sargassum", value: true } });
      dispatch({ type: "SET_LAYER", payload: { key: "imagery", value: true } });
      dispatch({ type: "SET_FEED_FILTER", payload: "Satellite" });
    }
    if (selected.kind === "drone") {
      dispatch({ type: "SET_LAYER", payload: { key: "wind", value: true } });
      dispatch({ type: "SET_LAYER", payload: { key: "currents", value: true } });
      dispatch({ type: "SET_FEED_FILTER", payload: "Drone" });
    }
    if (selected.kind === "forecast") {
      dispatch({ type: "SET_LAYER", payload: { key: "sargassum", value: true } });
      dispatch({ type: "SET_LAYER", payload: { key: "chlorophyll", value: true } });
      dispatch({ type: "SET_MAP_LAYER_PANEL", payload: true });
      dispatch({ type: "SET_FEED_FILTER", payload: "AI" });
    }
    if (selected.kind === "operations") {
      dispatch({ type: "SET_FEED_FILTER", payload: "Operations" });
      dispatch({ type: "SET_LAYER", payload: { key: "municipal", value: true } });
    }
    if (selected.kind === "tide") {
      dispatch({ type: "SET_LAYER", payload: { key: "wave", value: true } });
      dispatch({ type: "SET_FEED_FILTER", payload: "Alerts" });
    }

    dispatch({ type: "ADD_FEED_EVENT", payload: { text: `Timeline event selected: ${selected.label}`, category: "Operations" } });
  };

  return (
    <div className="timeline-control">
      <div className="timeline-actions">
        <button type="button" onClick={() => dispatch({ type: "TOGGLE_PLAYBACK" })} aria-label="Toggle playback">
          {state.playbackRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button type="button" onClick={() => dispatch({ type: "SET_TIMELINE", payload: state.timelineHourOffset - 12 })}>
          <ChevronLeft size={14} />
        </button>
        {stops.map((step) => (
          <button
            type="button"
            key={step}
            className={state.timelineHourOffset === step ? "active" : ""}
            onClick={() => dispatch({ type: "SET_TIMELINE", payload: step })}
          >
            {step === 0 ? "Now" : `${step > 0 ? "+" : ""}${step}h`}
          </button>
        ))}
        <button type="button" onClick={() => dispatch({ type: "SET_TIMELINE", payload: state.timelineHourOffset + 12 })}>
          <ChevronRight size={14} />
        </button>
        <button type="button" aria-label="Events list" onClick={() => setEventsOpen((open) => !open)} className={eventsOpen ? "active" : ""}>
          <List size={14} />
        </button>
      </div>

      <input
        className="timeline-slider"
        type="range"
        min={-24}
        max={72}
        step={1}
        value={state.timelineHourOffset}
        onChange={(event) => dispatch({ type: "SET_TIMELINE", payload: Number(event.target.value) })}
      />

      {eventsOpen ? (
        <div className="timeline-events">
          {timelineEvents.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`timeline-event timeline-event-btn ${item.kind} ${state.timelineHourOffset === item.hourOffset ? "active" : ""}`}
              onClick={() => onTimelineEventClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

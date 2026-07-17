/**
 * Module: MissionBuilder
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { useAppContext } from "../../app/AppContext";

const missionTypes = [
  "Sargassum collection",
  "Drone survey",
  "Boom deployment",
  "Beach cleanup",
  "Environmental inspection",
  "Emergency response",
];

export function MissionBuilder() {
  const { state, dispatch, jurisdictions } = useAppContext();
  const form = state.missionForm;

  const onGenerate = () => {
    if (!form.jurisdiction || !form.type || !form.startTime || !form.staging) return;
    dispatch({ type: "GENERATE_MISSION" });
  };

  return (
    <Panel title="Mission Builder" subtitle="Plan and dispatch">
      <div className="mission-grid">
        <label>
          Jurisdiction
          <select value={form.jurisdiction} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { jurisdiction: event.target.value } })}>
            {jurisdictions.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <label>
          Mission type
          <select value={form.type} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { type: event.target.value } })}>
            {missionTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={form.priority} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { priority: event.target.value } })}>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label>
          Start time
          <input value={form.startTime} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { startTime: event.target.value } })} />
        </label>
        <label>
          Assigned assets
          <input value={form.assets.join(", ")} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { assets: event.target.value.split(",").map((v) => v.trim()).filter(Boolean) } })} />
        </label>
        <label>
          Crew
          <input value={form.crew} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { crew: event.target.value } })} />
        </label>
        <label>
          Staging location
          <input value={form.staging} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { staging: event.target.value } })} />
        </label>
        <label>
          Estimated duration
          <input value={form.duration} onChange={(event) => dispatch({ type: "SET_MISSION_FORM", payload: { duration: event.target.value } })} />
        </label>
      </div>
      <button type="button" className="btn-primary" onClick={onGenerate}>Generate Mission Plan</button>
    </Panel>
  );
}

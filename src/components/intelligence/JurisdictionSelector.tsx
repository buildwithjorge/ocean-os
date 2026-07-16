import { useAppContext } from "../../app/AppContext";

export function JurisdictionSelector() {
  const { jurisdictions, state, dispatch } = useAppContext();

  return (
    <div className="jurisdiction-select-wrap">
      <label htmlFor="jurisdiction" className="tiny-label">Jurisdiction</label>
      <select
        id="jurisdiction"
        className="control-select"
        value={state.selectedJurisdiction}
        onChange={(event) => dispatch({ type: "SET_JURISDICTION", payload: event.target.value })}
      >
        {jurisdictions.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}

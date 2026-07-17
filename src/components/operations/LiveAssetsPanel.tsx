/**
 * Module: LiveAssetsPanel
 * Purpose: Project runtime and documentation surface.
 */
import { Panel } from "../shared/Panel";
import { useAppContext } from "../../app/AppContext";

export function LiveAssetsPanel() {
  const { state, dispatch } = useAppContext();

  return (
    <Panel title="Live Assets" subtitle="Field visibility">
      <div className="asset-list">
        {state.assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            className="asset-item"
            onClick={() => dispatch({ type: "SELECT_ASSET", payload: asset.id })}
          >
            <div>
              <strong>{asset.name}</strong>
              <span>{asset.status}</span>
            </div>
            <div>
              <span>{asset.detailA}</span>
              <span>{asset.detailB}</span>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

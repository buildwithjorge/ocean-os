/**
 * Module: AssetDetailDrawer
 * Purpose: Project runtime and documentation surface.
 */
import type { Asset } from "../../app/mockData";

export function AssetDetailDrawer({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  return (
    <aside className={`drawer right ${asset ? "open" : ""}`} aria-hidden={!asset}>
      {asset ? (
        <>
          <header>
            <h3>{asset.name}</h3>
            <button type="button" onClick={onClose} aria-label="Close asset drawer">Close</button>
          </header>
          <div className="drawer-content">
            <p>Status: {asset.status}</p>
            <p>{asset.detailA}</p>
            <p>{asset.detailB}</p>
            <p>Resource: {asset.resource}</p>
            <p>Coordinates: {asset.position[1].toFixed(4)}, {asset.position[0].toFixed(4)}</p>
          </div>
        </>
      ) : null}
    </aside>
  );
}

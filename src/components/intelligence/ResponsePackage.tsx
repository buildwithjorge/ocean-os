import { useAppContext } from "../../app/AppContext";

export function ResponsePackage() {
  const { dispatch } = useAppContext();

  return (
    <div className="response-package">
      <div className="pkg-head">
        <div>
          <span className="tiny-label">Response Package</span>
          <h4>Package Alpha</h4>
        </div>
        <span className="pkg-tag">Recommended</span>
      </div>
      <ul className="pkg-list">
        <li>2 boats</li>
        <li>4 loaders</li>
        <li>18 crew</li>
        <li>2 dewatering units</li>
      </ul>
      <div className="pkg-cost">Estimated cost: $37,500</div>
      <button
        type="button"
        className="btn-primary"
        onClick={() => dispatch({ type: "OPEN_DEPLOY_MODAL", payload: true })}
      >
        Deploy
      </button>
    </div>
  );
}

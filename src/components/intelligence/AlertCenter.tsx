import { BellRing } from "lucide-react";
import { Panel } from "../shared/Panel";

export function AlertCenter() {
  return (
    <Panel title="Alert Center" subtitle="Active notifications">
      <div className="alert-item">
        <BellRing size={14} />
        <span>Turtle habitat overlap detected in impact corridor.</span>
      </div>
      <div className="alert-item">
        <BellRing size={14} />
        <span>Drone 01 returning in 9 minutes for battery swap.</span>
      </div>
    </Panel>
  );
}

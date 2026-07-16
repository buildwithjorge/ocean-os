/**
 * Module: Tooltip
 * Purpose: Project runtime and documentation surface.
 */
import type { ReactNode } from "react";

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <div className="tooltip-wrap" data-tooltip={text}>
      {children}
    </div>
  );
}

/**
 * Module: IconButton
 * Purpose: Project runtime and documentation surface.
 */
import type { ReactNode } from "react";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function IconButton({ icon, label, active, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-btn ${active ? "active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

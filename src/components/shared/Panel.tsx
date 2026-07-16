/**
 * Module: Panel
 * Purpose: Project runtime and documentation surface.
 */
import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Panel({ title, subtitle, badge, actions, className = "", children }: PanelProps) {
  return (
    <section className={`panel ${className}`} aria-label={title}>
      <header className="panel-header">
        <div className="panel-heading">
          <h3 className="panel-title">{title}</h3>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        <div className="panel-header-meta">
          {badge ? <div className="panel-badge">{badge}</div> : null}
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

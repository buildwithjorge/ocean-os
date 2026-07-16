import { severityColors, severityFromRiskIndex } from "../../../packages/shared/src";

type TsiArcGaugeProps = {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
};

export function TsiArcGauge({ value, min = 0, max = 100, size = 168, strokeWidth = 14 }: TsiArcGaugeProps) {
  const normalized = Math.max(min, Math.min(max, value));
  const percent = (normalized - min) / (max - min);
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const sweep = endAngle - startAngle;

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const arcLength = radius * sweep;
  const progressLength = arcLength * percent;

  const severity = severityFromRiskIndex(value);
  const gaugeColor = severityColors[severity];

  return (
    <div className="tsi-gauge-wrap" aria-label={`TSI ${Math.round(normalized)}`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="tsi-gauge-svg" role="img">
        <path
          d={describeArc(center, center, radius, 180, 360)}
          className="tsi-gauge-track"
          style={{ strokeWidth }}
          fill="none"
        />
        <path
          d={describeArc(center, center, radius, 180, 360)}
          className="tsi-gauge-progress"
          style={{
            stroke: gaugeColor,
            strokeWidth,
            strokeDasharray: `${progressLength} ${arcLength}`,
          }}
          fill="none"
        />
      </svg>
      <div className="tsi-gauge-center">
        <span className="tiny-label">TSI</span>
        <strong className="risk-value">{Math.round(normalized)}</strong>
        <span className="risk-severity">{severity.toUpperCase()}</span>
      </div>
    </div>
  );
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

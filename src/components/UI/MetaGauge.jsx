import React from "react";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function MetaGauge({ percent, positive }) {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clamped = Math.max(0, Math.min(100, safePercent));
  const cx = 60;
  const cy = 58;
  const r = 46;
  const startAngle = -90; // 0% — extremo esquerdo
  const endAngleBg = 90; // 100% — extremo direito
  const endAngleFg = -90 + (clamped / 100) * 180;
  const color = positive ? "#059669" : "#e11d48";
  const label = `${Math.round(safePercent)}%`;
  const labelFontSize = label.length > 6 ? 13 : label.length > 4 ? 16 : 20;
  return (
    <svg viewBox="0 0 120 68" width="120" height="68">
      <path
        d={describeArc(cx, cy, r, startAngle, endAngleBg)}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {clamped > 0 && (
        <path
          d={describeArc(cx, cy, r, startAngle, endAngleFg)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={labelFontSize} fontFamily="monospace" fontWeight="500" fill={color}>
        {label}
      </text>
    </svg>
  );
}

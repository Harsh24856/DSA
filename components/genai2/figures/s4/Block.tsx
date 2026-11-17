// A pre-norm decoder block: the residual stream runs straight down; each sublayer reads a normalised copy and adds its result back.
import { useId } from "react";

const W = 340, SX = 70, BX = 160, BW = 150, BH = 30;
const SUBS: { y: number; boxes: [string, boolean][] }[] = [
  { y: 52, boxes: [["RMSNorm", false], ["attention: mixes tokens", true]] },
  { y: 186, boxes: [["RMSNorm", false], ["FFN: one token at a time", true]] },
];

export function Block() {
  const titleId = useId(), mk = "arrow" + titleId.replace(/[^\w-]/g, "");
  return (
    <svg viewBox={`0 0 ${W} 334`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>A pre-norm transformer block. The residual stream x runs straight down. A branch takes RMSNorm of x, runs attention, and adds the result back to x. A second branch takes RMSNorm, runs the feed-forward network, and adds that back. The stream is never replaced, only added to.</title>
      <defs>
        <marker id={mk} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--line-strong)" /></marker>
      </defs>
      <text x={SX} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">x in</text>
      <line x1={SX} y1={24} x2={SX} y2={306} stroke="var(--accent)" strokeWidth={4} markerEnd={`url(#${mk})`} />
      <text x={SX - 12} y={170} textAnchor="end" fontSize={13} fill="var(--accent)" transform={`rotate(-90 ${SX - 12} 170)`}>residual stream</text>
      {SUBS.map(({ y, boxes }, s) => {
        const plusY = y + 2 * (BH + 14) + 8;
        return (
          <g key={s}>
            <path d={`M ${SX} ${y + BH / 2} H ${BX}`} fill="none" stroke="var(--line-strong)" markerEnd={`url(#${mk})`} />
            {boxes.map(([label, hot], b) => (
              <g key={label}>
                <rect x={BX} y={y + b * (BH + 14)} width={BW} height={BH} rx={8} fill={hot ? "var(--accent-soft)" : "var(--surface-2)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} />
                <text x={BX + BW / 2} y={y + b * (BH + 14) + 20} textAnchor="middle" fontSize={13} fill="var(--ink)">{label}</text>
              </g>
            ))}
            <line x1={BX + BW / 2} y1={y + BH} x2={BX + BW / 2} y2={y + BH + 13} stroke="var(--line-strong)" markerEnd={`url(#${mk})`} />
            <path d={`M ${BX + BW / 2} ${y + 2 * BH + 14} V ${plusY} H ${SX + 14}`} fill="none" stroke="var(--line-strong)" markerEnd={`url(#${mk})`} />
            <circle cx={SX} cy={plusY} r={12} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
            <text x={SX} y={plusY + 5} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--accent)">+</text>
          </g>
        );
      })}
      <text x={SX} y={328} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">x out</text>
    </svg>
  );
}

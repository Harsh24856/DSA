// A pretraining data pipeline as a funnel: each stage keeps a share of what reached it. The shares are illustrative.
import { useId } from "react";

const STAGES: [string, number, string][] = [
  ["Raw web crawl", 1, "HTML pages"], ["Extract text", 0.6, "drop menus, ads"], ["One language", 0.5, "language ID"],
  ["Quality filter", 0.4, "rules + a scorer"], ["Deduplicate", 0.5, "exact + MinHash"], ["Decontaminate", 0.98, "drop test sets"],
];
const left = STAGES.map((_, i) => STAGES.slice(0, i + 1).reduce((p, s) => p * s[1], 1));
const W = 340, ROW = 38, X = 112, BAR = W - X - 8, TOP = 8;

export function Funnel() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${TOP + STAGES.length * ROW + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A data pipeline as a funnel, with illustrative shares. ${STAGES.map(([s], i) => `${s}: ${(left[i] * 100).toFixed(1)}% of the crawl left`).join(". ")}.`}</title>
      {STAGES.map(([name, , how], i) => {
        const w = Math.max(4, BAR * left[i]), y = TOP + i * ROW, last = i === STAGES.length - 1;
        return (
          <g key={name}>
            <text x={X - 8} y={y + 14} textAnchor="end" fontSize={13} fontWeight={600} fill="var(--ink)">{name}</text>
            <text x={X - 8} y={y + 29} textAnchor="end" fontSize={12} fill="var(--muted)">{how}</text>
            <rect x={X + (BAR - w) / 2} y={y + 4} width={w} height={ROW - 12} rx={6} fill={last ? "var(--accent-soft)" : "var(--surface-2)"} stroke={last ? "var(--accent)" : "var(--line-strong)"} strokeWidth={last ? 2 : 1} />
            <text x={X + BAR / 2} y={y + ROW / 2 + 2} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)"
              style={{ paintOrder: "stroke" }} stroke="var(--bg)" strokeWidth={3}>{`${(left[i] * 100).toFixed(1)}%`}</text>
          </g>
        );
      })}
      <text x={X + BAR / 2} y={TOP + STAGES.length * ROW + 16} textAnchor="middle" fontSize={12} fill="var(--muted)">share of the raw crawl left (illustrative)</text>
    </svg>
  );
}

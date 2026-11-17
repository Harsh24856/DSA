// Which numbers each normalisation averages over: BatchNorm takes one feature across the batch, LayerNorm one example across its features.
import { useId } from "react";

const ROWS = 4, COLS = 6, C = 16, GAP = 44, W = 340;
const GW = COLS * C, LEFT = (W - 2 * GW - GAP) / 2;
const PANELS = [
  { name: "BatchNorm", hot: (_r: number, c: number) => c === 2, lines: ["one feature,", "across the batch"] },
  { name: "LayerNorm", hot: (r: number) => r === 1, lines: ["one example,", "across its features"] },
];

export function Norms() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} 204`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Two grids of ${ROWS} examples by ${COLS} features. BatchNorm computes its mean and spread down one column: one feature across the batch. LayerNorm computes them along one row: one example across its features, so it never looks at other examples.`}</title>
      {PANELS.map((p, k) => {
        const x0 = LEFT + k * (GW + GAP), y0 = 40;
        return (
          <g key={p.name}>
            <text x={x0 + GW / 2} y={18} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">{p.name}</text>
            {Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (
              <rect key={`${r}-${c}`} x={x0 + c * C} y={y0 + r * C} width={C} height={C}
                fill={p.hot(r, c) ? "var(--accent-soft)" : "var(--surface-2)"} stroke={p.hot(r, c) ? "var(--accent)" : "var(--line-strong)"} strokeWidth={p.hot(r, c) ? 1.5 : 0.75} />
            )))}
            <text x={x0 + GW / 2} y={y0 + ROWS * C + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">features →</text>
            <text x={x0 - 6} y={y0 + (ROWS * C) / 2} textAnchor="middle" fontSize={11} fill="var(--muted)" transform={`rotate(-90 ${x0 - 6} ${y0 + (ROWS * C) / 2})`}>examples</text>
            {p.lines.map((l, i) => <text key={l} x={x0 + GW / 2} y={y0 + ROWS * C + 42 + i * 16} textAnchor="middle" fontSize={12} fill="var(--ink)">{l}</text>)}
          </g>
        );
      })}
      <text x={W / 2} y={194} textAnchor="middle" fontSize={12} fill="var(--muted)">RMSNorm: the same row, without the mean</text>
    </svg>
  );
}

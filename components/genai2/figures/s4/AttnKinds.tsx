// Which query-key pairs each family allows: encoder (all), decoder (itself and the past), cross-attention (target queries, source keys).
import { useId } from "react";

const CELL = 14, W = 340;
const KINDS: { name: string; sub: string; rows: number; cols: number; open: (i: number, j: number) => boolean }[] = [
  { name: "encoder", sub: "sees both sides", rows: 5, cols: 5, open: () => true },
  { name: "decoder", sub: "sees the past", rows: 5, cols: 5, open: (i, j) => j <= i },
  { name: "cross", sub: "target reads source", rows: 3, cols: 5, open: () => true },
];
const count = (k: (typeof KINDS)[number]) => { let c = 0; for (let i = 0; i < k.rows; i++) for (let j = 0; j < k.cols; j++) c += +k.open(i, j); return c; };

export function AttnKinds() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} 190`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Three attention patterns. ${KINDS.map((k) => `${k.name}: ${k.rows} queries by ${k.cols} keys, ${count(k)} pairs allowed, ${k.sub}`).join(". ")}. Rows are queries, columns are keys.`}</title>
      {KINDS.map((k, n) => {
        const x0 = n * (W / 3) + (W / 3 - k.cols * CELL) / 2, y0 = 20;
        return (
          <g key={k.name}>
            {Array.from({ length: k.rows }, (_, i) => Array.from({ length: k.cols }, (_, j) => {
              const on = k.open(i, j);
              return <rect key={`${i}-${j}`} x={x0 + j * CELL} y={y0 + i * CELL} width={CELL - 1} height={CELL - 1} fill={on ? "var(--accent)" : "var(--surface)"} fillOpacity={on ? 0.75 : 1} stroke="var(--line-strong)" />;
            }))}
            <text x={x0 + (k.cols * CELL) / 2} y={y0 + 5 * CELL + 22} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">{k.name}</text>
            <text x={x0 + (k.cols * CELL) / 2} y={y0 + 5 * CELL + 40} textAnchor="middle" fontSize={13} fill="var(--muted)">{k.sub}</text>
            <text x={x0 + (k.cols * CELL) / 2} y={y0 + 5 * CELL + 58} textAnchor="middle" fontSize={13} fill="var(--ink)">{count(k)} of {k.rows * k.cols} open</text>
          </g>
        );
      })}
      <text x={W / 2} y={180} textAnchor="middle" fontSize={13} fill="var(--muted)">rows: queries, columns: keys; filled = allowed</text>
    </svg>
  );
}

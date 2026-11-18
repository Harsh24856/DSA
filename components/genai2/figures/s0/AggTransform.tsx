// groupby then agg against groupby then transform: agg returns one row per group, transform returns the group's answer on every original row.
import { useId } from "react";
import { groupBy, LOG, sorted } from "@/lib/genai2/stages/s0.calc";

const ROWS = LOG.filter((r) => r.ok);
const SUMS = new Map(sorted(groupBy(ROWS, (r) => r.model)).map(([m, rs]) => [m, rs.reduce((t, r) => t + r.tok, 0)]));
const AGG = [...SUMS.entries()];
const FILL: Record<string, string> = Object.fromEntries(AGG.map(([m], i) => [m, ["var(--accent-soft)", "var(--surface-2)", "var(--surface)"][i % 3]]));
const W = 340, RH = 22, Y0 = 50;
const LEFT = [{ x: 8, w: 58, h: "model" }, { x: 66, w: 44, h: "tok" }, { x: 116, w: 72, h: "transform" }];
const RIGHT = [{ x: 212, w: 64, h: "model" }, { x: 276, w: 56, h: "agg" }];

export function AggTransform() {
  const titleId = useId();
  const box = (x: number, y: number, w: number, fill: string, text: string | number, hot = false, key?: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={RH} fill={fill} stroke={hot ? "var(--accent)" : "var(--line-strong)"} strokeWidth={hot ? 1.5 : 0.75} />
      <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize={12} fill="var(--ink)">{text}</text>
    </g>
  );
  const bottom = Y0 + ROWS.length * RH;
  return (
    <svg viewBox={`0 0 ${W} ${bottom + 52}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`${ROWS.length} successful calls grouped by model, summing tokens. agg("sum") returns ${AGG.length} rows, one per model: ${AGG.map(([m, s]) => `${m} ${s}`).join(", ")}. transform("sum") returns ${ROWS.length} values, each row showing its own model's total, so it can sit next to the original columns.`}</title>
      <text x={8} y={18} fontSize={13} fontWeight={600} fill="var(--ink)">{`${ROWS.length} rows in`}</text>
      <text x={212} y={18} fontSize={13} fontWeight={600} fill="var(--ink)">{`${AGG.length} rows out`}</text>
      {[...LEFT, ...RIGHT].map((c) => <text key={c.x} x={c.x + c.w / 2} y={Y0 - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">{c.h}</text>)}
      {ROWS.map((r, i) => (
        <g key={r.id}>
          {box(LEFT[0].x, Y0 + i * RH, LEFT[0].w, FILL[r.model], r.model)}
          {box(LEFT[1].x, Y0 + i * RH, LEFT[1].w, FILL[r.model], r.tok)}
          {box(LEFT[2].x, Y0 + i * RH, LEFT[2].w, FILL[r.model], SUMS.get(r.model)!, true)}
        </g>
      ))}
      {AGG.map(([m, s], i) => (
        <g key={m}>
          {box(RIGHT[0].x, Y0 + i * RH, RIGHT[0].w, FILL[m], m)}
          {box(RIGHT[1].x, Y0 + i * RH, RIGHT[1].w, FILL[m], s, true)}
        </g>
      ))}
      <text x={LEFT[0].x} y={bottom + 20} fontSize={12} fill="var(--muted)">transform: same length</text>
      <text x={LEFT[0].x} y={bottom + 38} fontSize={12} fill="var(--muted)">as the input</text>
      <text x={RIGHT[0].x} y={Y0 + AGG.length * RH + 20} fontSize={12} fill="var(--muted)">agg: one row</text>
      <text x={RIGHT[0].x} y={Y0 + AGG.length * RH + 38} fontSize={12} fill="var(--muted)">per group</text>
    </svg>
  );
}

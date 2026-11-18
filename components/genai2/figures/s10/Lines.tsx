// A small line chart shared by the stage 10 figures: each series is labelled at its right end, so colour is never the only cue.
import { useId } from "react";

export type Series = { label: string; color: string; dash?: string; pts: [number, number][] };
const W = 340, L = 36, R = 74, TOP = 24, H = 160;

export function Lines({ title, series, xMax, yMax, xLabel, yLabel, xTicks, yTicks, yFmt = (v) => String(v), note }: {
  title: string; series: Series[]; xMax: number; yMax: number; xLabel: string; yLabel: string;
  xTicks: number[]; yTicks: number[]; yFmt?: (v: number) => string; note?: string;
}) {
  const t = useId(), sx = (x: number) => L + ((W - L - R) * x) / xMax, sy = (y: number) => TOP + H - (H * Math.min(y, yMax)) / yMax;
  // nudge end labels apart so they never overlap
  const ends = series.map((s) => sy(s.pts[s.pts.length - 1][1])).map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
  const endY = Object.fromEntries(ends.map((e) => [e.i, e.y]));
  return (
    <svg viewBox={`0 0 ${W} ${TOP + H + (note ? 58 : 40)}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{title}</title>
      {yTicks.map((y) => (
        <g key={y}>
          <line x1={L} x2={W - R} y1={sy(y)} y2={sy(y)} stroke="var(--line)" />
          <text x={L - 4} y={sy(y) + 4} fontSize={10} textAnchor="end" fill="var(--muted)">{yFmt(y)}</text>
        </g>
      ))}
      {xTicks.map((x, i) => <text key={x} x={sx(x)} y={TOP + H + 14} fontSize={10} textAnchor={i === xTicks.length - 1 ? "end" : "middle"} fill="var(--muted)">{x}</text>)}
      <text x={(L + W - R) / 2} y={TOP + H + 30} fontSize={11} textAnchor="middle" fill="var(--muted)">{xLabel}</text>
      <text x={0} y={10} fontSize={10} fill="var(--muted)">{yLabel}</text>
      {series.map((s, i) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} points={s.pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} />
          <text x={W - R + 4} y={endY[i] + 4} fontSize={10} fill="var(--ink)">{s.label}</text>
        </g>
      ))}
      {note && <text x={0} y={TOP + H + 50} fontSize={11} fill="var(--muted)">{note}</text>}
    </svg>
  );
}

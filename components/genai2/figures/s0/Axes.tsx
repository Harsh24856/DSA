// What "axis" means in a reduction: axis=0 collapses the rows (one answer per column), axis=1 collapses the columns (one answer per row).
import { useId } from "react";
import { M23, shapeStr, sumAxis } from "@/lib/genai2/stages/s0.calc";

const C = 30, W = 340, R = M23.length, K = M23[0].length;
const S0 = sumAxis(M23, 0), S1 = sumAxis(M23, 1);
const GW = K * C, X0 = 70, Y0 = 44;

export function Axes() {
  const titleId = useId();
  const cell = (x: number, y: number, v: number, hot = false, key?: string) => (
    <g key={key}>
      <rect x={x} y={y} width={C} height={C} fill={hot ? "var(--accent-soft)" : "var(--surface-2)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} strokeWidth={hot ? 1.5 : 0.75} />
      <text x={x + C / 2} y={y + 19} textAnchor="middle" fontSize={13} fill="var(--ink)">{v}</text>
    </g>
  );
  const yS0 = Y0 + R * C + 40, xS1 = X0 + GW + 52;
  return (
    <svg viewBox={`0 0 ${W} ${yS0 + C + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A ${R} by ${K} matrix with rows ${M23.map((r) => r.join(", ")).join(" and ")}. sum(axis=0) runs down each column and gives ${S0.join(", ")}, shape ${shapeStr([K])}. sum(axis=1) runs along each row and gives ${S1.join(", ")}, shape ${shapeStr([R])}. The axis you name is the one that disappears.`}</title>
      <text x={X0 + GW / 2} y={20} textAnchor="middle" fontSize={13} fill="var(--ink)">{`x ${shapeStr([R, K])}`}</text>
      {M23.map((row, r) => row.map((v, c) => cell(X0 + c * C, Y0 + r * C, v, false, `${r}-${c}`)))}
      {/* axis 0: arrows down each column */}
      {S0.map((_, c) => <line key={c} x1={X0 + c * C + C / 2} y1={Y0 + R * C + 4} x2={X0 + c * C + C / 2} y2={yS0 - 6} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#s0-ax-arrow)" />)}
      {S0.map((v, c) => cell(X0 + c * C, yS0, v, true, `s0-${c}`))}
      <text x={X0 - 8} y={yS0 + 19} textAnchor="end" fontSize={12} fill="var(--muted)">axis=0</text>
      <text x={X0 + GW / 2} y={yS0 + C + 20} textAnchor="middle" fontSize={12} fill="var(--muted)">{`shape ${shapeStr([K])}`}</text>
      {/* axis 1: arrows along each row */}
      {S1.map((_, r) => <line key={r} x1={X0 + GW + 4} y1={Y0 + r * C + C / 2} x2={xS1 - 6} y2={Y0 + r * C + C / 2} stroke="var(--accent)" strokeWidth={1.5} markerEnd="url(#s0-ax-arrow)" />)}
      {S1.map((v, r) => cell(xS1, Y0 + r * C, v, true, `s1-${r}`))}
      <text x={xS1 + C / 2} y={Y0 - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">axis=1</text>
      <text x={xS1 + C + 8} y={Y0 + (R * C) / 2 + 4} fontSize={12} fill="var(--muted)">{`shape ${shapeStr([R])}`}</text>
      <defs>
        <marker id="s0-ax-arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" />
        </marker>
      </defs>
    </svg>
  );
}

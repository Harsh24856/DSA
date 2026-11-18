// Broadcasting both ways at once: a (3, 1) column plus a (1, 4) row. Each is reused along its size 1 axis, so the sum is (3, 4).
import { useId } from "react";
import { add, bcast2, COL, ROW, shapeStr } from "@/lib/genai2/stages/s0.calc";

const C = 24, W = 340, R = COL.length, K = ROW[0].length;
const SUM = bcast2(COL, ROW, add)!;
const GW = K * C, GAP = 52, LEFT = (W - 2 * GW - GAP) / 2;

function Grid({ x0, y0, val, real, name }: { x0: number; y0: number; val: (r: number, c: number) => number; real: (r: number, c: number) => boolean; name: string }) {
  return (
    <g>
      <text x={x0 + GW / 2} y={y0 - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">{name}</text>
      {Array.from({ length: R }, (_, r) => Array.from({ length: K }, (_, c) => (
        <g key={`${r}-${c}`}>
          <rect x={x0 + c * C} y={y0 + r * C} width={C} height={C} fill={real(r, c) ? "var(--accent-soft)" : "var(--surface)"}
            stroke={real(r, c) ? "var(--accent)" : "var(--line-strong)"} strokeWidth={real(r, c) ? 1.5 : 0.75} strokeDasharray={real(r, c) ? undefined : "3 3"} />
          <text x={x0 + c * C + C / 2} y={y0 + r * C + 16} textAnchor="middle" fontSize={11} fill={real(r, c) ? "var(--ink)" : "var(--muted)"}>{val(r, c)}</text>
        </g>
      )))}
    </g>
  );
}

export function Stretch() {
  const titleId = useId();
  const y1 = 46, y2 = y1 + R * C + 58;
  return (
    <svg viewBox={`0 0 ${W} ${y2 + R * C + 34}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A column a of shape ${shapeStr([R, 1])} holding ${COL.map((r) => r[0]).join(", ")}, plus a row b of shape ${shapeStr([1, K])} holding ${ROW[0].join(", ")}. The column is reused across ${K} columns and the row down ${R} rows, shown dashed. Their sum has shape ${shapeStr([R, K])}; its first row is ${SUM[0].join(", ")}.`}</title>
      <text x={W / 2} y={18} textAnchor="middle" fontSize={13} fill="var(--ink)">{`a ${shapeStr([R, 1])} + b ${shapeStr([1, K])}`}</text>
      <Grid x0={LEFT} y0={y1} name="a, reused across" val={(r) => COL[r][0]} real={(_r, c) => c === 0} />
      <text x={W / 2} y={y1 + (R * C) / 2 + 5} textAnchor="middle" fontSize={16} fill="var(--muted)">+</text>
      <Grid x0={LEFT + GW + GAP} y0={y1} name="b, reused down" val={(_r, c) => ROW[0][c]} real={(r) => r === 0} />
      <text x={W / 2} y={y1 + R * C + 30} textAnchor="middle" fontSize={16} fill="var(--muted)">=</text>
      <Grid x0={(W - GW) / 2} y0={y2} name={`a + b ${shapeStr([R, K])}`} val={(r, c) => SUM[r][c]} real={() => true} />
      <text x={W / 2} y={y2 + R * C + 24} textAnchor="middle" fontSize={12} fill="var(--muted)">both stretch: the result is bigger than either input</text>
    </svg>
  );
}

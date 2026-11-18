// Why a Python loop is slow: every element makes its own trip through the interpreter. NumPy makes one call, then a compiled loop runs over raw numbers stored side by side.
import { useId } from "react";
import { n0 } from "@/lib/genai2/stages/s0.calc";

const XS = [0.5, 1.5, 2, 0.25, 3, 1], TOTAL = XS.reduce((a, b) => a + b, 0);
const JOBS = ["get the next object", "check its type", "unbox and add", "box a new float"];
const BIG = 1_000_000;
const W = 340, C = 34, X0 = (W - XS.length * C) / 2, S = 12;

export function LoopVec() {
  const titleId = useId();
  const yLoop = 40, yJobs = yLoop + C + 10, yVec = yJobs + JOBS.length * (S + 4) + 84;
  return (
    <svg viewBox={`0 0 ${W} ${yVec + C + 74}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Summing ${XS.length} numbers. A Python loop sends each element through the interpreter: get the next object, check its type, add, and make a new float object, so ${XS.length} elements make ${XS.length} trips and a million elements make a million. NumPy's x.sum() is one call from Python; a compiled loop then adds the raw 8-byte numbers, which sit side by side in memory. Both give ${TOTAL}.`}</title>
      <text x={8} y={18} fontSize={13} fontWeight={600} fill="var(--ink)">for v in xs: total += v</text>
      {XS.map((v, i) => (
        <g key={i}>
          <circle cx={X0 + i * C + C / 2} cy={yLoop + C / 2} r={C / 2 - 3} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={X0 + i * C + C / 2} y={yLoop + C / 2 + 4} textAnchor="middle" fontSize={11} fill="var(--ink)">{v}</text>
          {JOBS.map((j, k) => <rect key={j} x={X0 + i * C + (C - S) / 2} y={yJobs + k * (S + 4)} width={S} height={S} rx={2} fill="var(--accent-soft)" stroke="var(--accent)" />)}
        </g>
      ))}
      <text x={W / 2} y={yJobs + JOBS.length * (S + 4) + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{`each trip: ${JOBS.slice(0, 2).join(", ")},`}</text><text x={W / 2} y={yJobs + JOBS.length * (S + 4) + 30} textAnchor="middle" fontSize={11} fill="var(--muted)">{`${JOBS.slice(2).join(", ")}`}</text>
      <text x={W / 2} y={yJobs + JOBS.length * (S + 4) + 50} textAnchor="middle" fontSize={12} fill="var(--ink)">{`${XS.length} trips through the interpreter; ${n0(BIG)} for a million`}</text>
      <line x1={8} x2={W - 8} y1={yVec - 22} y2={yVec - 22} stroke="var(--line)" />
      <text x={8} y={yVec - 4} fontSize={13} fontWeight={600} fill="var(--ink)">x.sum()</text>
      {XS.map((v, i) => (
        <g key={i}>
          <rect x={X0 + i * C} y={yVec + 8} width={C} height={C - 6} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={X0 + i * C + C / 2} y={yVec + 27} textAnchor="middle" fontSize={11} fill="var(--ink)">{v}</text>
        </g>
      ))}
      <path d={`M ${X0} ${yVec + C + 12} L ${X0 + XS.length * C} ${yVec + C + 12}`} stroke="var(--accent)" strokeWidth={2} markerEnd="url(#s0-lv-arrow)" />
      <text x={W / 2} y={yVec + C + 32} textAnchor="middle" fontSize={11} fill="var(--muted)">raw 8-byte floats, side by side; one compiled loop</text>
      <text x={W / 2} y={yVec + C + 50} textAnchor="middle" fontSize={12} fill="var(--ink)">{`1 trip through the interpreter, at any size. Both give ${TOTAL}.`}</text>
      <defs>
        <marker id="s0-lv-arrow" viewBox="0 0 8 8" refX={7} refY={4} markerWidth={6} markerHeight={6} orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" />
        </marker>
      </defs>
    </svg>
  );
}

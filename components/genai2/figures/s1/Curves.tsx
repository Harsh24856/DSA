// Training and validation error of least squares polynomials of degree 0 to 10, fitted to the same noisy samples. Computed from DEGREES.
import { useId } from "react";
import { BEST_DEG, DEGREES, fmt } from "@/lib/genai2/stages/s1.calc";

const W = 340, H = 240, L = 44, R = 14, T = 20, B = 44, MAXD = 10;
const D = DEGREES.slice(0, MAXD + 1);
const YMAX = Math.ceil(Math.max(...D.map((d) => d.val)) * 10) / 10;
const sx = (d: number) => +(L + ((W - L - R) * d) / MAXD).toFixed(1);
const sy = (v: number) => +(T + (H - T - B) * (1 - Math.min(v, YMAX) / YMAX)).toFixed(1);
const line = (k: "train" | "val") => D.map((d) => `${sx(d.deg)},${sy(d[k])}`).join(" ");
const best = DEGREES[BEST_DEG];

export function Curves() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Mean squared error against polynomial degree, 0 to ${MAXD}. Training error falls almost every time the degree goes up, from ${fmt(D[0].train)} to ${fmt(D[MAXD].train)}. Validation error falls to its lowest, ${fmt(best.val)}, at degree ${BEST_DEG}, then climbs to ${fmt(D[MAXD].val)} at degree ${MAXD}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {[0, 2, 4, 6, 8, 10].map((d) => <text key={d} x={sx(d)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{d}</text>)}
      {[0, YMAX / 2, YMAX].map((v) => <text key={v} x={L - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{fmt(v)}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">polynomial degree</text>
      <rect x={sx(BEST_DEG) - 10} y={T} width={20} height={H - T - B} fill="var(--accent-soft)" />
      <polyline points={line("train")} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 3" />
      <polyline points={line("val")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      {D.map((d) => <circle key={d.deg} cx={sx(d.deg)} cy={sy(d.val)} r={3} fill="var(--accent)" />)}
      <text x={sx(BEST_DEG) + 14} y={sy(best.val) - 40} fontSize={12} fill="var(--ink)">{`best: degree ${BEST_DEG}`}</text>
      <text x={L + 8} y={H - B - 34} fontSize={12} fill="var(--muted)">underfit</text>
      <text x={W - R - 4} y={H - B - 34} textAnchor="end" fontSize={12} fill="var(--muted)">overfit</text>
      <text x={W - R - 4} y={sy(D[MAXD].val) + 20} textAnchor="end" fontSize={12} fill="var(--accent)">validation</text>
      <text x={W - R - 4} y={sy(D[MAXD].train) - 8} textAnchor="end" fontSize={12} fill="var(--muted)">training</text>
    </svg>
  );
}

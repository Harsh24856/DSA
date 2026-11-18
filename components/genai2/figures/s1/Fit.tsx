// Eight students, hours practised against test score, with the least squares line and each point's error drawn as a stick. Computed from fitLine.
import { useId } from "react";
import { BEST, fmt, LINE, predict } from "@/lib/genai2/stages/s1.calc";

const W = 340, H = 240, L = 40, R = 14, T = 20, B = 44;
const [X0, X1, Y0, Y1] = [0, 4.5, 1, 7];
const sx = (x: number) => +(L + ((W - L - R) * (x - X0)) / (X1 - X0)).toFixed(1);
const sy = (y: number) => +(T + ((H - T - B) * (Y1 - y)) / (Y1 - Y0)).toFixed(1);
const { xs, ys } = LINE;

export function Fit() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Scatter of ${xs.length} students: hours practised from ${xs[0]} to ${xs[xs.length - 1]} against test score. The least squares line y = ${fmt(BEST.w)} x + ${fmt(BEST.b)} runs through them. Each point has a short vertical stick to the line: its error. Mean squared error ${fmt(BEST.loss)}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {[0, 1, 2, 3, 4].map((x) => <text key={x} x={sx(x)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{x}</text>)}
      {[2, 4, 6].map((y) => <text key={y} x={L - 6} y={sy(y) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{y}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">hours practised (x)</text>
      <line x1={sx(X0)} y1={sy(predict(BEST.w, BEST.b, X0))} x2={sx(X1)} y2={sy(predict(BEST.w, BEST.b, X1))} stroke="var(--accent)" strokeWidth={2.5} />
      {xs.map((x, i) => (
        <g key={x}>
          <line x1={sx(x)} y1={sy(ys[i])} x2={sx(x)} y2={sy(predict(BEST.w, BEST.b, x))} stroke="var(--medium)" strokeWidth={2} />
          <circle cx={sx(x)} cy={sy(ys[i])} r={4} fill="var(--ink)" />
        </g>
      ))}
      <text x={L + 8} y={T + 12} fontSize={12} fill="var(--ink)">{`y = ${fmt(BEST.w)} x + ${fmt(BEST.b)}`}</text>
      <text x={L + 8} y={T + 30} fontSize={12} fill="var(--muted)">{`MSE ${fmt(BEST.loss)}: every point sits close`}</text>
    </svg>
  );
}

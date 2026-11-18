// The MSE of the practice line as a function of the slope w (b held at its best value): a bowl. Three gradient descent steps roll down it,
// each step lr times the slope of the curve at that point. Computed from mse and gradLine.
import { useId } from "react";
import { BEST, fmt, gradLine, mse } from "@/lib/genai2/stages/s1.calc";

const W = 340, H = 240, L = 44, R = 14, T = 20, B = 44;
const [W0, W1] = [-0.2, 2.5], LR = 0.05, START = 0.1;
const Lw = (w: number) => mse(w, BEST.b);
const YMAX = Math.max(Lw(W0), Lw(W1));
const sx = (w: number) => +(L + ((W - L - R) * (w - W0)) / (W1 - W0)).toFixed(1);
const sy = (v: number) => +(T + (H - T - B) * (1 - v / YMAX)).toFixed(1);
const curve = Array.from({ length: 121 }, (_, i) => W0 + ((W1 - W0) * i) / 120).map((w) => `${sx(w)},${sy(Lw(w))}`).join(" ");
const path = [START];
for (let i = 0; i < 3; i++) path.push(path[i] - LR * gradLine(path[i], BEST.b).dw);
const g0 = gradLine(START, BEST.b).dw;
// a short tangent at the start point
const tan = [START - 0.3, START + 0.3].map((w) => [sx(w), sy(Lw(START) + g0 * (w - START))]);

export function Bowl() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Mean squared error against the slope w, with b fixed at ${fmt(BEST.b)}: a U-shaped bowl with its bottom at w = ${fmt(BEST.w)}. Starting at w = ${START}, where the curve's slope is ${fmt(g0)}, three gradient descent steps with learning rate ${LR} move w to ${path.slice(1).map(fmt).join(", then ")}. Each step is smaller because the bowl flattens near the bottom.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {[0, 1, 2].map((w) => <text key={w} x={sx(w)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{w}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">slope w</text>
      <text x={L - 6} y={T + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{fmt(Math.round(YMAX))}</text>
      <text x={L - 6} y={sy(0) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">0</text>
      <text x={L + 6} y={T + 12} fontSize={12} fill="var(--muted)">MSE</text>
      <polyline points={curve} fill="none" stroke="var(--line-strong)" strokeWidth={2} />
      <line x1={tan[0][0]} y1={tan[0][1]} x2={tan[1][0]} y2={tan[1][1]} stroke="var(--medium)" strokeWidth={2} strokeDasharray="4 3" />
      {path.slice(1).map((w, i) => (
        <line key={w} x1={sx(path[i])} y1={sy(Lw(path[i]))} x2={sx(w)} y2={sy(Lw(w))} stroke="var(--accent)" strokeWidth={2} />
      ))}
      {path.map((w, i) => <circle key={w} cx={sx(w)} cy={sy(Lw(w))} r={i === 0 ? 5 : 4} fill={i === 0 ? "var(--medium)" : "var(--accent)"} />)}
      <line x1={sx(BEST.w)} y1={sy(0)} x2={sx(BEST.w)} y2={sy(Lw(BEST.w)) + 6} stroke="var(--easy)" strokeDasharray="3 3" />
      <text x={sx(BEST.w) + 8} y={sy(0) - 34} fontSize={12} fill="var(--ink)">{`best w = ${fmt(BEST.w)}`}</text>
      <text x={sx(START) + 10} y={sy(Lw(START)) + 4} fontSize={12} fill="var(--ink)">{`start: slope ${fmt(g0)}`}</text>
      <text x={W - R} y={T + 12} textAnchor="end" fontSize={12} fill="var(--muted)">{`steps of lr ${LR} × slope`}</text>
    </svg>
  );
}

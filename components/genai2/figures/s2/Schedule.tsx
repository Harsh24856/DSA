// The learning rate over a training run: linear warmup to the peak, then cosine decay to a floor. Computed from lrAt.
import { useId } from "react";
import { lrAt, SCHED } from "@/lib/genai2/stages/s2.flows";

const W = 340, H = 230, L = 52, R = 14, T = 24, B = 50;
const { peak, min, warm, total } = SCHED;
const sx = (t: number) => L + ((W - L - R) * t) / total, sy = (lr: number) => T + (H - T - B) * (1 - lr / peak);
const pts = Array.from({ length: 201 }, (_, i) => (total * i) / 200).map((t) => `${sx(t).toFixed(1)},${sy(lrAt(t)).toFixed(1)}`).join(" ");
const half = (warm + total) / 2;
const sci = (x: number) => x.toExponential(2).replace(/\.?0+e/, "e");
const k = (t: number) => `${t / 1000}k`;

export function Schedule() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Learning rate against training step. It rises in a straight line from 0 to ${sci(peak)} over the first ${warm} steps, then falls along a cosine curve to ${sci(min)} at step ${total}. Halfway through the decay, at step ${half}, it is ${sci(lrAt(half))}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      <rect x={sx(0)} y={T} width={sx(warm) - sx(0)} height={H - T - B} fill="var(--accent-soft)" />
      {[peak, min, 0].map((v) => (
        <g key={v}>
          <line x1={L - 4} y1={sy(v)} x2={L} y2={sy(v)} stroke="var(--line-strong)" />
          <text x={L - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{v === 0 ? "0" : sci(v)}</text>
        </g>
      ))}
      {[0, warm, half, total].map((t) => (
        <text key={t} x={sx(t)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{t === 0 ? "0" : k(t)}</text>
      ))}
      <text x={(L + W - R) / 2} y={H - 10} textAnchor="middle" fontSize={12} fill="var(--muted)">training step</text>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <circle cx={sx(half)} cy={sy(lrAt(half))} r={4} fill="var(--accent)" />
      <text x={sx(half) + 8} y={sy(lrAt(half)) - 6} fontSize={12} fill="var(--ink)">{`${sci(lrAt(half))} at ${k(half)}`}</text>
      <text x={sx(warm) + 4} y={H - B - 8} fontSize={12} fill="var(--ink)">← warmup ends</text>
      <text x={W - R} y={T + 12} textAnchor="end" fontSize={12} fill="var(--muted)">cosine decay to the floor</text>
    </svg>
  );
}

// Gini and entropy of a two-class node against the share of class 1 in it. Both are 0 for a pure node and highest at 50/50. Computed from gini and entropy.
import { useId } from "react";
import { entropy, fmt, gini } from "@/lib/genai2/stages/s1.calc";

const W = 340, H = 240, L = 44, R = 14, T = 20, B = 44, N = 100;
const sx = (p: number) => +(L + (W - L - R) * p).toFixed(1);
const sy = (v: number) => +(T + (H - T - B) * (1 - v)).toFixed(1);
const line = (f: (a: number, b: number) => number) => Array.from({ length: N + 1 }, (_, i) => `${sx(i / N)},${sy(f(N - i, i))}`).join(" ");
const P = 0.2, g = gini(1 - P, P), e = entropy(1 - P, P);

export function Impurity() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Impurity of a node against the share of class 1, from 0 to 1. Entropy (solid) rises from 0 to 1 bit at a 50/50 mix and falls back to 0. Gini (dashed) has the same shape but peaks at 0.5. At a share of ${P}, Gini is ${fmt(g)} and entropy ${fmt(e)}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {[0, 0.5, 1].map((p) => <text key={p} x={sx(p)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{p}</text>)}
      {[0, 0.5, 1].map((v) => <text key={v} x={L - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{v}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">share of class 1 in the node</text>
      <polyline points={line(entropy)} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      <polyline points={line(gini)} fill="none" stroke="var(--medium)" strokeWidth={2.5} strokeDasharray="5 3" />
      <line x1={sx(P)} y1={sy(0)} x2={sx(P)} y2={sy(e)} stroke="var(--muted)" strokeDasharray="3 3" />
      <circle cx={sx(P)} cy={sy(e)} r={4} fill="var(--accent)" />
      <circle cx={sx(P)} cy={sy(g)} r={4} fill="var(--medium)" />
      <text x={sx(0.5)} y={sy(1) - 6} textAnchor="middle" fontSize={12} fill="var(--accent)">entropy, max 1 bit</text>
      <text x={sx(0.5)} y={sy(0.5) - 8} textAnchor="middle" fontSize={12} fill="var(--medium)">Gini, max 0.5</text>
      <text x={sx(P) + 8} y={sy(e) + 14} fontSize={12} fill="var(--ink)">{`${fmt(e)}`}</text>
      <text x={sx(P) + 8} y={sy(g) + 14} fontSize={12} fill="var(--ink)">{`${fmt(g)}`}</text>
      <text x={L + 6} y={sy(0) - 8} fontSize={12} fill="var(--muted)">pure</text>
      <text x={W - R - 4} y={sy(0) - 8} textAnchor="end" fontSize={12} fill="var(--muted)">pure</text>
    </svg>
  );
}

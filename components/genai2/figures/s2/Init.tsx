// Activation size through 20 ReLU layers for three weight variances, from the variance rule:
// each layer multiplies the signal's second moment by n × Var(w) / 2, so its size by the square root of that.
import { useId } from "react";

const DEPTH = 20, W = 340, H = 230, L = 44, R = 104, T = 16, B = 40;
const INITS = [
  { name: "Var(w) = 4/n", factor: Math.sqrt(4 / 2), dash: "6 4" },
  { name: "He: 2/n", factor: Math.sqrt(2 / 2), dash: undefined },
  { name: "Var(w) = 1/n", factor: Math.sqrt(1 / 2), dash: "2 3" },
];
const LOG = 3;   // y axis runs from 10^-3 to 10^3
const sx = (k: number) => L + ((W - L - R) * k) / DEPTH, sy = (v: number) => T + ((H - T - B) * (LOG - Math.log10(v))) / (2 * LOG);
const fmt = (v: number) => (v >= 10 ? Math.round(v).toLocaleString("en-US") : v >= 0.01 ? v.toFixed(2).replace(/\.?0+$/, "") : v.toExponential(1));

export function Init() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Size of the activations through ${DEPTH} ReLU layers, on a log scale. ${INITS.map((i) => `${i.name}: after ${DEPTH} layers the size is ${fmt(i.factor ** DEPTH)} times the input`).join(". ")}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {[-3, 0, 3].map((e) => (
        <g key={e}>
          <line x1={L} y1={sy(10 ** e)} x2={W - R} y2={sy(10 ** e)} stroke="var(--line)" strokeDasharray={e === 0 ? undefined : "2 4"} />
          <text x={L - 6} y={sy(10 ** e) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{e === 0 ? "1" : `1e${e}`}</text>
        </g>
      ))}
      {[0, 10, 20].map((k) => <text key={k} x={sx(k)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{k}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">layer</text>
      {INITS.map((i) => {
        const pts = Array.from({ length: DEPTH + 1 }, (_, k) => `${sx(k).toFixed(1)},${sy(i.factor ** k).toFixed(1)}`).join(" ");
        const end = i.factor ** DEPTH, he = i.factor === 1;
        return (
          <g key={i.name}>
            <polyline points={pts} fill="none" stroke={he ? "var(--accent)" : "var(--ink)"} strokeWidth={he ? 2.5 : 1.5} strokeDasharray={i.dash} />
            <text x={W - R + 6} y={sy(end) - 2} fontSize={12} fill={he ? "var(--accent)" : "var(--ink)"} fontWeight={he ? 600 : 400}>{i.name}</text>
            <text x={W - R + 6} y={sy(end) + 13} fontSize={11} fill="var(--muted)">{`× ${fmt(end)}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

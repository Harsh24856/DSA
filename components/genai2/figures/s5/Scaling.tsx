// Loss against training compute for four model sizes, from a toy loss of the Chinchilla form, and the compute-optimal frontier under them.
import { useId } from "react";

// Toy constants, chosen so the best split is 20 tokens per parameter: L = E + A / N^a + B / D^a, with D = C / (6N).
const E = 1.7, A = 400, B = 400 * 20 ** 0.34, a = 0.34;
const loss = (N: number, C: number) => E + A / N ** a + B / (C / (6 * N)) ** a;
const best = (C: number) => loss(Math.sqrt(C / 120), C);
const X0 = 18, X1 = 24, Y1 = 3.6, Y0 = Math.floor(best(10 ** X1) * 10) / 10;
const W = 340, H = 236, L = 40, R = 12, T = 12, Bm = 44;
const px = (lc: number) => L + ((lc - X0) / (X1 - X0)) * (W - L - R);
const py = (y: number) => T + ((Y1 - y) / (Y1 - Y0)) * (H - T - Bm);
const xs = Array.from({ length: 61 }, (_, i) => X0 + (i * (X1 - X0)) / 60);
const SIZES: [string, number][] = [["0.1B", 1e8], ["1B", 1e9], ["10B", 1e10], ["100B", 1e11]];
const line = (f: (lc: number) => number) => xs.map((lc) => `${px(lc).toFixed(1)},${py(Math.min(Y1 + 0.5, f(lc))).toFixed(1)}`).join(" ");
// where each size's curve first comes into view: its label sits there
const labelAt = (N: number) => { const lc = xs.find((x) => loss(N, 10 ** x) < Y1 - 0.12) ?? X0; return { x: px(lc), y: py(loss(N, 10 ** lc)) }; };

export function Scaling() {
  const titleId = useId(), clip = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Loss against training compute on a log scale for models of 0.1, 1, 10 and 100 billion parameters. Each size flattens out once it has seen enough data. A dashed line under all of them marks the best loss for each budget; larger budgets reach it with larger models.</title>
      <clipPath id={clip}><rect x={L} y={T} width={W - L - R} height={H - T - Bm} /></clipPath>
      <line x1={L} y1={H - Bm} x2={W - R} y2={H - Bm} stroke="var(--line-strong)" />
      <line x1={L} y1={T} x2={L} y2={H - Bm} stroke="var(--line-strong)" />
      {[18, 20, 22, 24].map((lc) => <text key={lc} x={px(lc)} y={H - Bm + 16} textAnchor="middle" fontSize={12} fill="var(--muted)">10^{lc}</text>)}
      {[Y0, (Y0 + Y1) / 2, Y1].map((y) => <text key={y} x={L - 6} y={py(y) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">{y.toFixed(1)}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={13} fill="var(--muted)">training compute, FLOPs (log scale)</text>
      <g clipPath={`url(#${clip})`}>
        {SIZES.map(([k, N]) => <polyline key={k} points={line((lc) => loss(N, 10 ** lc))} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} />)}
        <polyline points={line((lc) => best(10 ** lc))} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" />
      </g>
      {SIZES.map(([k, N]) => { const p = labelAt(N); return <text key={k} x={p.x + 4} y={p.y - 6} fontSize={12} fontWeight={600} fill="var(--ink)">{k}</text>; })}
      <text x={W - R - 4} y={T + 14} textAnchor="end" fontSize={12} fill="var(--accent)">dashed: best loss per budget</text>
      <text x={L + 4} y={py(Y0) - 6} fontSize={12} fill="var(--muted)">loss</text>
    </svg>
  );
}

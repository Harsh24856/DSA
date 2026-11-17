// The forward pass as shapes: (batch, d_in) @ (d_in, h) gives (batch, h); the inner sizes must match and the outer ones survive.
import { useId } from "react";

const B = 4, D = 3, H = 5, K = 2, C = 11, W = 340;
type Item = { kind: "mat"; r: number; c: number; name: string; dims: [string, string]; hot?: "c" | "r"; sums?: boolean } | { kind: "op"; text: string; w: number };
const ROWS: Item[][] = [
  [{ kind: "mat", r: B, c: D, name: "X", dims: [`${B}`, `${D}`], hot: "c" }, { kind: "op", text: "@", w: 28 },
    { kind: "mat", r: D, c: H, name: "W1", dims: [`${D}`, `${H}`], hot: "r" }, { kind: "op", text: "=", w: 28 },
    { kind: "mat", r: B, c: H, name: "H", dims: [`${B}`, `${H}`] }],
  [{ kind: "mat", r: B, c: H, name: "ReLU(H)", dims: [`${B}`, `${H}`], hot: "c" }, { kind: "op", text: "@", w: 28 },
    { kind: "mat", r: H, c: K, name: "W2", dims: [`${H}`, `${K}`], hot: "r" }, { kind: "op", text: "=", w: 28 },
    { kind: "mat", r: B, c: K, name: "logits", dims: [`${B}`, `${K}`] }],
  [{ kind: "mat", r: B, c: K, name: "logits", dims: [`${B}`, `${K}`] }, { kind: "op", text: "softmax →", w: 96 },
    { kind: "mat", r: B, c: K, name: "probs", dims: [`${B}`, `${K}`], sums: true }],
];
const ROW_Y = [16, 118, 220];
const width = (it: Item) => (it.kind === "op" ? it.w : it.c * C + (it.sums ? 28 : 0));
const labelW = (it: Item) => (it.kind === "mat" ? Math.max(width(it), it.name.length * 8, 44) : it.w);

export function Shapes() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} 318`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A forward pass as matrix shapes. X, ${B} by ${D}, times W1, ${D} by ${H}, gives H, ${B} by ${H}: the inner ${D}s must match. ReLU of H, ${B} by ${H}, times W2, ${H} by ${K}, gives logits, ${B} by ${K}. Softmax turns each row of logits into probabilities that sum to 1.`}</title>
      {ROWS.map((row, ri) => {
        const total = row.reduce((s, it) => s + labelW(it), 0) + 8 * (row.length - 1);
        let x = (W - total) / 2;
        return row.map((it, k) => {
          const lw = labelW(it), cx = x + lw / 2, top = ROW_Y[ri];
          x += lw + 8;
          if (it.kind === "op") return <text key={k} x={cx} y={top + 30} textAnchor="middle" fontSize={14} fill="var(--muted)">{it.text}</text>;
          const left = cx - (it.c * C) / 2 - (it.sums ? 14 : 0);
          return (
            <g key={k}>
              {Array.from({ length: it.r }, (_, i) => Array.from({ length: it.c }, (_, j) => (
                <rect key={`${i}-${j}`} x={left + j * C} y={top + i * C} width={C} height={C}
                  fill={(it.hot === "c" && j === it.c - 1) || (it.hot === "r" && i === it.r - 1) ? "var(--accent-soft)" : "var(--surface-2)"} stroke="var(--line-strong)" strokeWidth={0.75} />
              )))}
              {it.sums && Array.from({ length: it.r }, (_, i) => <text key={i} x={left + it.c * C + 6} y={top + i * C + 9} fontSize={10} fill="var(--muted)">=1</text>)}
              <text x={cx} y={top + 72} textAnchor="middle" fontSize={13} fill="var(--ink)">{it.name}</text>
              <text x={cx} y={top + 88} textAnchor="middle" fontSize={12} fill="var(--muted)">
                {"("}<tspan fill={it.hot === "r" ? "var(--accent)" : undefined} fontWeight={it.hot === "r" ? 600 : undefined}>{it.dims[0]}</tspan>{", "}
                <tspan fill={it.hot === "c" ? "var(--accent)" : undefined} fontWeight={it.hot === "c" ? 600 : undefined}>{it.dims[1]}</tspan>{")"}
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
}

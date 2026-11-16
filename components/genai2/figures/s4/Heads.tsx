// One token's vector cut into 4 head slices; each head runs its own causal attention with its own pattern, then the slices are concatenated and mixed by W_O.
import { useId } from "react";

const D = 8, H = 4, N = 4, W = 340, CELL = 14;
// Each head favours one kind of key (illustrative patterns of the kind real heads learn): weights = causal softmax of 4 x favour.
const FAVOUR: [string, (i: number, j: number) => number][] = [
  ["previous", (i, j) => +(j === Math.max(0, i - 1))],
  ["itself", (i, j) => +(i === j)],
  ["first", (_, j) => +(j === 0)],
  ["spread", () => 0],
];
const weights = (f: (i: number, j: number) => number) => Array.from({ length: N }, (_, i) => {
  const e = Array.from({ length: N }, (_, j) => (j <= i ? Math.exp(4 * f(i, j)) : 0)), z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
});
const SLOT = W / H, GX = (h: number) => h * SLOT + (SLOT - N * CELL) / 2;

export function Heads() {
  const titleId = useId();
  const dx = (W - D * 34) / 2;
  return (
    <svg viewBox={`0 0 ${W} 286`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A token vector of ${D} numbers is cut into ${H} slices of ${D / H}, one per head. Each head runs causal attention over ${N} tokens with its own pattern: one looks at the previous token, one at itself, one at the first token, one spreads evenly. The ${H} outputs are joined back into ${D} numbers and mixed by W_O.`}</title>
      <text x={W / 2} y={14} textAnchor="middle" fontSize={13} fill="var(--muted)">one token, d = {D}, cut into {H} heads</text>
      {Array.from({ length: D }, (_, j) => (
        <g key={j}>
          <rect x={dx + j * 34} y={24} width={32} height={24} rx={4} fill={Math.floor(j / (D / H)) % 2 ? "var(--surface-2)" : "var(--accent-soft)"} stroke="var(--line-strong)" />
          {j % (D / H) === 0 && <text x={dx + j * 34 + 33} y={64} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">h{j / (D / H) + 1}</text>}
        </g>
      ))}
      {FAVOUR.map(([name, f], h) => {
        const w = weights(f), x0 = GX(h), y0 = 96;
        return (
          <g key={name}>
            <line x1={dx + (h * D / H) * 34 + 33} y1={70} x2={x0 + (N * CELL) / 2} y2={y0 - 6} stroke="var(--line-strong)" />
            {w.map((row, i) => row.map((v, j) => (
              <rect key={`${i}-${j}`} x={x0 + j * CELL} y={y0 + i * CELL} width={CELL - 1} height={CELL - 1} fill={j > i ? "var(--surface)" : "var(--accent)"} fillOpacity={j > i ? 1 : 0.12 + 0.88 * v} stroke="var(--line)" />
            )))}
            <text x={x0 + (N * CELL) / 2} y={y0 + N * CELL + 18} textAnchor="middle" fontSize={13} fill="var(--ink)">{name}</text>
            <line x1={x0 + (N * CELL) / 2} y1={y0 + N * CELL + 26} x2={W / 2} y2={218} stroke="var(--line-strong)" />
          </g>
        );
      })}
      <rect x={W / 2 - 90} y={218} width={180} height={30} rx={8} fill="var(--surface-2)" stroke="var(--accent)" strokeWidth={1.5} />
      <text x={W / 2} y={238} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">concat, then x W_O</text>
      <text x={W / 2} y={272} textAnchor="middle" fontSize={13} fill="var(--muted)">rows: queries, columns: keys; darker = more weight</text>
    </svg>
  );
}

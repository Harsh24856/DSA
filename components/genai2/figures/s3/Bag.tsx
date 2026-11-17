// Two sentences with the same words: as a bag of word counts they match, as neighbouring pairs they share nothing.
import { useId } from "react";

const A = ["dog", "bites", "man"], B = ["man", "bites", "dog"];
const W = 340, HALF = W / 2;
const words = [...new Set(A)];
const count = (ws: string[], w: string) => ws.filter((x) => x === w).length;
const pairs = (ws: string[]) => ws.slice(1).map((w, i) => `${ws[i]} ${w}`);
const shared = pairs(A).filter((p) => pairs(B).includes(p)).length;
const BAG_Y = 92, ROW = 20, PAIR_Y = BAG_Y + words.length * ROW + 52;

function Sentence({ ws, x0, label }: { ws: string[]; x0: number; label: string }) {
  const bw = (HALF - 24) / ws.length;
  return (
    <g>
      <text x={x0 + 8} y={16} fontSize={13} fill="var(--muted)">{label}</text>
      {ws.map((w, i) => (
        <g key={i}>
          <rect x={x0 + 8 + i * bw} y={24} width={bw - 4} height={24} rx={4} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={x0 + 8 + i * bw + (bw - 4) / 2} y={41} textAnchor="middle" fontSize={13} fill="var(--ink)">{w}</text>
        </g>
      ))}
    </g>
  );
}

export function Bag() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${PAIR_Y + 84}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Sentence A, ${A.join(" ")}, and sentence B, ${B.join(" ")}. As word counts both are ${words.map((w) => `${w} ${count(A, w)}`).join(", ")}: identical. As neighbouring pairs, A has ${pairs(A).join(" and ")}, B has ${pairs(B).join(" and ")}: ${shared} shared.`}</title>
      <Sentence ws={A} x0={0} label="A" />
      <Sentence ws={B} x0={HALF} label="B" />
      <text x={8} y={BAG_Y - 16} fontSize={13} fontWeight={600} fill="var(--ink)">As a bag of words</text>
      {words.map((w, i) => (
        <g key={w}>
          <text x={8} y={BAG_Y + i * ROW + 4} fontSize={13} fill="var(--muted)">{w}</text>
          <text x={HALF - 40} y={BAG_Y + i * ROW + 4} textAnchor="middle" fontSize={13} className="num" fill="var(--ink)">{count(A, w)}</text>
          <text x={HALF} y={BAG_Y + i * ROW + 4} textAnchor="middle" fontSize={13} fill="var(--muted)">=</text>
          <text x={HALF + 40} y={BAG_Y + i * ROW + 4} textAnchor="middle" fontSize={13} className="num" fill="var(--ink)">{count(B, w)}</text>
        </g>
      ))}
      <rect x={HALF + 64} y={BAG_Y - 10} width={W - HALF - 72} height={words.length * ROW} rx={8} fill="var(--accent-soft)" stroke="var(--hard)" />
      <text x={HALF + 64 + (W - HALF - 72) / 2} y={BAG_Y + ROW - 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">same vector:</text>
      <text x={HALF + 64 + (W - HALF - 72) / 2} y={BAG_Y + 2 * ROW - 4} textAnchor="middle" fontSize={13} fill="var(--ink)">order lost</text>
      <text x={8} y={PAIR_Y - 16} fontSize={13} fontWeight={600} fill="var(--ink)">As neighbouring pairs</text>
      {[A, B].map((ws, s) => pairs(ws).map((p, i) => (
        <g key={`${s}${p}`}>
          <rect x={s * HALF + 8} y={PAIR_Y + i * 28} width={HALF - 24} height={22} rx={4} fill="var(--surface)" stroke="var(--accent)" />
          <text x={s * HALF + 8 + (HALF - 24) / 2} y={PAIR_Y + i * 28 + 15} textAnchor="middle" fontSize={13} fill="var(--ink)">{p}</text>
        </g>
      )))}
      <text x={HALF} y={PAIR_Y + 74} textAnchor="middle" fontSize={13} fill="var(--accent)">{`${shared} pairs shared: order is back`}</text>
    </svg>
  );
}

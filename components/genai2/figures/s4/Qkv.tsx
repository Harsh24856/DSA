// Each token's whole vector is projected three ways, by three learned matrices, into a query, a key and a value; the query of "sat" is compared with every key.
import { useId } from "react";

const WORDS = ["the", "cat", "sat", "down"];
const FOCUS = 2;
const W = 340, COL = W / WORDS.length, BOX = 20, GAP = 4;
const cx = (i: number) => COL * i + COL / 2;
const qkvX = (i: number, j: number) => cx(i) - (3 * BOX + 2 * GAP) / 2 + j * (BOX + GAP);   // left edge of q (0), k (1), v (2)
const ROW = 92, BOTTOM = ROW + BOX + 2;
const LEGEND: [string, string][] = [["q", "query: what this word looks for"], ["k", "key: what this word offers"], ["v", "value: what it passes on"]];

export function Qkv() {
  const titleId = useId();
  const from = qkvX(FOCUS, 0) + BOX / 2;
  return (
    <svg viewBox={`0 0 ${W} 246`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>Four words, the, cat, sat, down. Each whole word vector is projected three ways, by three learned matrices, into a query, a key and a value. The query of sat is compared with the key of every word, itself included.</title>
      {WORDS.map((w, i) => (
        <g key={w}>
          <text x={cx(i)} y={18} textAnchor="middle" fontSize={14} fontWeight={i === FOCUS ? 600 : 400} fill="var(--ink)">{w}</text>
          {[0, 1, 2, 3].map((c) => <rect key={c} x={cx(i) - 32 + c * 16} y={30} width={16} height={18} fill="var(--surface-2)" stroke="var(--line-strong)" />)}
          {[0, 1, 2].map((j) => <line key={j} x1={cx(i)} y1={48} x2={qkvX(i, j) + BOX / 2} y2={ROW} stroke="var(--line-strong)" />)}
          {["q", "k", "v"].map((l, j) => {
            const hot = (j === 0 && i === FOCUS) || j === 1;
            return (
              <g key={l}>
                <rect x={qkvX(i, j)} y={ROW} width={BOX} height={BOX} rx={4} fill={i === FOCUS && j === 0 ? "var(--accent-soft)" : "var(--surface)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} strokeWidth={hot ? 1.5 : 1} />
                <text x={qkvX(i, j) + BOX / 2} y={ROW + 14} textAnchor="middle" fontSize={13} fill={hot ? "var(--ink)" : "var(--muted)"}>{l}</text>
              </g>
            );
          })}
          <path d={`M ${from} ${BOTTOM} Q ${(from + qkvX(i, 1) + BOX / 2) / 2} ${BOTTOM + 14 + Math.abs(i - FOCUS) * 18} ${qkvX(i, 1) + BOX / 2} ${BOTTOM}`} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        </g>
      ))}
      <text x={from} y={BOTTOM + 46} textAnchor="middle" fontSize={13} fill="var(--accent)">score = q · k</text>
      {LEGEND.map(([k, s], i) => (
        <text key={k} x={8} y={194 + i * 20} fontSize={13} fill="var(--muted)"><tspan fontWeight={600} fill="var(--ink)">{k}</tspan>  {s}</text>
      ))}
    </svg>
  );
}

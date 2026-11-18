// Cosine similarity between four words, as one-hot vectors and as word2vec vectors trained on the stage's toy corpus the first time this figure renders. Computed from embCos.
import { useId } from "react";
import { CORPUS, embCos, fmt, SHOW, W2V_CFG } from "@/lib/genai2/stages/s1.calc";

const W = 340, CELL = 32, TOP = 64, LEFT = 44, GAP = 16;
const X0 = [LEFT, LEFT + 4 * CELL + GAP];
const onehot = SHOW.map((_, i) => SHOW.map((__, j) => (i === j ? 1 : 0)));

export function CosGrid() {
  const titleId = useId();
  const cos = embCos();
  const panels: [string, number[][]][] = [["one-hot", onehot], ["word2vec", cos]];
  const H = TOP + 4 * CELL + 36;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Two 4 by 4 grids of cosine similarity between ${SHOW.join(", ")}. With one-hot vectors every different pair scores 0. With ${W2V_CFG.dim}-number word2vec vectors trained on ${CORPUS.length} toy sentences, cat and dog score ${fmt(cos[0][1])}, milk and water ${fmt(cos[2][3])}, and cat and milk ${fmt(cos[0][2])}.`}</title>
      {panels.map(([name, m], p) => (
        <g key={name}>
          <text x={X0[p] + 2 * CELL} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">{name}</text>
          {SHOW.map((w, j) => <text key={w} x={X0[p] + j * CELL + CELL / 2} y={TOP - 8} textAnchor="middle" fontSize={10} fill="var(--muted)">{w}</text>)}
          {m.map((row, i) => row.map((v, j) => (
            <g key={`${i}-${j}`}>
              <rect x={X0[p] + j * CELL} y={TOP + i * CELL} width={CELL - 2} height={CELL - 2} rx={4}
                fill={v > 0.5 ? "var(--accent)" : "var(--surface-2)"} stroke="var(--line)" />
              <text x={X0[p] + j * CELL + CELL / 2 - 1} y={TOP + i * CELL + CELL / 2 + 3} textAnchor="middle" fontSize={10} fill={v > 0.5 ? "var(--accent-ink)" : "var(--ink)"}>{fmt(Math.round(v * 100) / 100)}</text>
            </g>
          )))}
        </g>
      ))}
      {SHOW.map((w, i) => <text key={w} x={LEFT - 6} y={TOP + i * CELL + CELL / 2 + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{w}</text>)}
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">1 = same direction, 0 = unrelated</text>
    </svg>
  );
}

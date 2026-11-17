// An attention (alignment) matrix: rows are output words, columns source words; each row is a softmax and sums to 1.
// Weights are computed: the aligned source word scores LEAD above the others.
import { useId } from "react";

const SRC = ["the", "black", "cat"], TGT = ["le", "chat", "noir"];
const ALIGNED = [0, 2, 1];   // le -> the, chat -> cat, noir -> black: the adjective moves
const LEAD = 3;
const softmax = (s: number[]) => { const e = s.map(Math.exp), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
const WEIGHTS = TGT.map((_, i) => softmax(SRC.map((__, j) => (j === ALIGNED[i] ? LEAD : 0))));
const W = 340, CELL = 72, X0 = 76, Y0 = 34;

export function Align() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${Y0 + TGT.length * CELL + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Attention weights. ${TGT.map((t, i) => `${t}: ${SRC.map((s, j) => `${s} ${WEIGHTS[i][j].toFixed(2)}`).join(", ")}`).join(". ")}.`}</title>
      {SRC.map((s, j) => <text key={s} x={X0 + j * CELL + CELL / 2} y={Y0 - 12} textAnchor="middle" fontSize={13} fill="var(--ink)">{s}</text>)}
      {TGT.map((t, i) => (
        <g key={t}>
          <text x={X0 - 10} y={Y0 + i * CELL + CELL / 2 + 5} textAnchor="end" fontSize={13} fontWeight={600} fill="var(--ink)">{t}</text>
          {SRC.map((s, j) => {
            const w = WEIGHTS[i][j], hot = j === ALIGNED[i];
            return (
              <g key={s}>
                <rect x={X0 + j * CELL + 2} y={Y0 + i * CELL + 2} width={CELL - 4} height={CELL - 4} rx={8} fill="var(--accent)" fillOpacity={0.08 + 0.8 * w} stroke={hot ? "var(--accent)" : "var(--line)"} />
                <text x={X0 + j * CELL + CELL / 2} y={Y0 + i * CELL + CELL / 2 + 5} textAnchor="middle" fontSize={14} fontWeight={hot ? 600 : 400} fill={hot ? "var(--accent-ink)" : "var(--ink)"} className="num">{w.toFixed(2)}</text>
              </g>
            );
          })}
        </g>
      ))}
      <text x={X0 + 1.5 * CELL} y={Y0 + TGT.length * CELL + 22} textAnchor="middle" fontSize={13} fill="var(--muted)">source words, read by the encoder</text>
    </svg>
  );
}

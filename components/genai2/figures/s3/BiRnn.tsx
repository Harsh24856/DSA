// A bidirectional RNN: a forward row reads left to right, a backward row right to left, and each position joins both states.
import { useId } from "react";

const WORDS = ["the", "bank", "was", "steep"], FOCUS = 1;
const W = 340, BW = 36, BH = 24;
const cx = (i: number) => 84 + i * 72;
const JOIN_Y = 14, FWD_Y = 60, BWD_Y = 110, WORD_Y = 192;

export function BiRnn() {
  const titleId = useId(), m = useId().replace(/:/g, ""), ma = m + "a";
  const line = { stroke: "var(--line-strong)", strokeWidth: 1.5 };
  return (
    <svg viewBox={`0 0 ${W} 232`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`The words ${WORDS.join(", ")}. A forward RNN reads them left to right, a backward RNN right to left. At each position the two states are joined. The joined state for "${WORDS[FOCUS]}" includes "${WORDS.slice(0, FOCUS).join(" ")}" from the left and "${WORDS.slice(FOCUS + 1).join(" ")}" from the right.`}</title>
      <defs>
        <marker id={m} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker>
        <marker id={ma} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" /></marker>
      </defs>
      <text x={4} y={JOIN_Y + 17} fontSize={13} fill="var(--muted)">join</text>
      <text x={4} y={FWD_Y + 17} fontSize={13} fill="var(--muted)">fwd</text>
      <text x={4} y={BWD_Y + 17} fontSize={13} fill="var(--muted)">bwd</text>
      {WORDS.map((w, i) => {
        const hot = i === FOCUS, fx = cx(i) - 30, bx = cx(i) - 6;
        return (
          <g key={w}>
            <rect x={cx(i) - 28} y={JOIN_Y} width={56} height={BH} rx={6} fill={hot ? "var(--accent-soft)" : "var(--surface)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} />
            <text x={cx(i)} y={JOIN_Y + 16} textAnchor="middle" fontSize={12} fill="var(--ink)">[→ ; ←]</text>
            <rect x={fx} y={FWD_Y} width={BW} height={BH} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" />
            <text x={fx + BW / 2} y={FWD_Y + 16} textAnchor="middle" fontSize={13} fill="var(--ink)">→</text>
            <rect x={bx} y={BWD_Y} width={BW} height={BH} rx={6} fill="var(--surface-2)" stroke="var(--accent)" />
            <text x={bx + BW / 2} y={BWD_Y + 16} textAnchor="middle" fontSize={13} fill="var(--ink)">←</text>
            <line x1={cx(i) - 20} y1={WORD_Y - 14} x2={cx(i) - 20} y2={FWD_Y + BH + 2} {...line} markerEnd={`url(#${m})`} />
            <line x1={cx(i) + 12} y1={WORD_Y - 14} x2={cx(i) + 12} y2={BWD_Y + BH + 2} {...line} markerEnd={`url(#${m})`} />
            <line x1={cx(i) - 12} y1={FWD_Y} x2={cx(i) - 12} y2={JOIN_Y + BH + 2} {...line} markerEnd={`url(#${m})`} />
            <line x1={cx(i) + 20} y1={BWD_Y} x2={cx(i) + 20} y2={JOIN_Y + BH + 2} {...line} markerEnd={`url(#${m})`} />
            {i < WORDS.length - 1 && <>
              <line x1={fx + BW} y1={FWD_Y + BH / 2} x2={cx(i + 1) - 32} y2={FWD_Y + BH / 2} {...line} markerEnd={`url(#${m})`} />
              <line x1={cx(i + 1) - 6} y1={BWD_Y + BH / 2} x2={bx + BW + 2} y2={BWD_Y + BH / 2} stroke="var(--accent)" strokeWidth={1.5} markerEnd={`url(#${ma})`} />
            </>}
            <text x={cx(i)} y={WORD_Y + 4} textAnchor="middle" fontSize={14} fontWeight={hot ? 600 : 400} fill="var(--ink)">{w}</text>
          </g>
        );
      })}
      <text x={W / 2} y={224} textAnchor="middle" fontSize={13} fill="var(--accent)">{`"${WORDS[FOCUS]}" sees "${WORDS.slice(FOCUS + 1).join(" ")}" through the backward row`}</text>
    </svg>
  );
}

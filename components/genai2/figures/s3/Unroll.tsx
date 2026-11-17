// A recurrent cell with a loop, unrolled into a chain of copies that share W and U; the gradient runs back along the chain.
import { useId } from "react";

const W = 340, N = 4, BW = 44, BH = 28;
const ROLL_Y = 34, CHAIN_Y = 184;
const cellX = (i: number) => 76 + i * 66;   // left edge of cell i (0-based); h0 sits left of cell 0
const mid = (i: number) => cellX(i) + BW / 2;

export function Unroll() {
  const titleId = useId(), arrow = useId().replace(/:/g, ""), back = arrow + "b";
  return (
    <svg viewBox={`0 0 ${W} ${CHAIN_Y + 90}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Top: one RNN cell h with an input x through W and a loop back to itself through U. Bottom: the same cell unrolled over ${N} steps, h0 then h1 to h${N}, each reading x1 to x${N} through the same W and passing its state right through the same U. The loss is at h${N}; the gradient flows back from h${N} to h1 through U at every step.`}</title>
      <defs>
        <marker id={arrow} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker>
        <marker id={back} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" /></marker>
      </defs>
      <text x={8} y={16} fontSize={13} fill="var(--muted)">rolled</text>
      <rect x={W / 2 - BW / 2} y={ROLL_Y} width={BW} height={BH} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <text x={W / 2} y={ROLL_Y + 19} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--ink)">h</text>
      <path d={`M ${W / 2 + BW / 2} ${ROLL_Y + 10} C ${W / 2 + 70} ${ROLL_Y - 10}, ${W / 2 + 30} ${ROLL_Y - 30}, ${W / 2 + 6} ${ROLL_Y - 2}`} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} markerEnd={`url(#${arrow})`} />
      <text x={W / 2 + 62} y={ROLL_Y - 6} fontSize={13} fill="var(--ink)">U</text>
      <line x1={W / 2} y1={ROLL_Y + 76} x2={W / 2} y2={ROLL_Y + BH + 4} stroke="var(--line-strong)" strokeWidth={1.5} markerEnd={`url(#${arrow})`} />
      <text x={W / 2 + 6} y={ROLL_Y + 58} fontSize={13} fill="var(--ink)">W</text>
      <text x={W / 2} y={ROLL_Y + 92} textAnchor="middle" fontSize={13} fill="var(--muted)">x</text>

      <text x={8} y={CHAIN_Y - 44} fontSize={13} fill="var(--muted)">unrolled: same W, same U</text>
      <text x={24} y={CHAIN_Y + 19} textAnchor="middle" fontSize={13} fill="var(--muted)">h0</text>
      <line x1={38} y1={CHAIN_Y + BH / 2} x2={cellX(0) - 2} y2={CHAIN_Y + BH / 2} stroke="var(--line-strong)" strokeWidth={1.5} markerEnd={`url(#${arrow})`} />
      {Array.from({ length: N }, (_, i) => (
        <g key={i}>
          <rect x={cellX(i)} y={CHAIN_Y} width={BW} height={BH} rx={6} fill="var(--surface-2)" stroke={i === N - 1 ? "var(--accent)" : "var(--line-strong)"} />
          <text x={mid(i)} y={CHAIN_Y + 19} textAnchor="middle" fontSize={13} fill="var(--ink)">{`h${i + 1}`}</text>
          <line x1={mid(i)} y1={CHAIN_Y + 66} x2={mid(i)} y2={CHAIN_Y + BH + 4} stroke="var(--line-strong)" strokeWidth={1.5} markerEnd={`url(#${arrow})`} />
          <text x={mid(i) + 5} y={CHAIN_Y + 52} fontSize={12} fill="var(--muted)">W</text>
          <text x={mid(i)} y={CHAIN_Y + 82} textAnchor="middle" fontSize={13} fill="var(--muted)">{`x${i + 1}`}</text>
          {i < N - 1 && <>
            <line x1={cellX(i) + BW} y1={CHAIN_Y + BH / 2} x2={cellX(i + 1) - 2} y2={CHAIN_Y + BH / 2} stroke="var(--line-strong)" strokeWidth={1.5} markerEnd={`url(#${arrow})`} />
            <text x={(cellX(i) + BW + cellX(i + 1)) / 2} y={CHAIN_Y + BH / 2 - 4} textAnchor="middle" fontSize={12} fill="var(--muted)">U</text>
            <path d={`M ${mid(i + 1)} ${CHAIN_Y - 4} Q ${(mid(i) + mid(i + 1)) / 2} ${CHAIN_Y - 26} ${mid(i) + 4} ${CHAIN_Y - 6}`} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" markerEnd={`url(#${back})`} />
          </>}
        </g>
      ))}
      <text x={mid(N - 1)} y={CHAIN_Y - 30} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--accent)">loss</text>
    </svg>
  );
}

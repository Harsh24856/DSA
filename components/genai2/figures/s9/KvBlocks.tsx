// Three requests of different lengths: reserving the maximum length for each, against handing out fixed blocks only as tokens arrive. Counts computed.
import { useId } from "react";
import { blocksFor, KV_EX, pagedSlots, reserved, used } from "@/lib/genai2/stages/s9.calc";


const { lens, max, block } = KV_EX;
const PER = max / block, W = 340, L = 32, CW = (W - L) / PER, CH = 18;
const RES = reserved(lens, max), PAGED = pagedSlots(lens, block), USED = used(lens);

function Panel({ y0, paged }: { y0: number; paged: boolean }) {
  return (
    <g>
      {lens.map((len, r) => (
        <g key={r}>
          <text x={0} y={y0 + r * (CH + 6) + 13} fontSize={11} fill="var(--muted)">{`R${r + 1}`}</text>
          {Array.from({ length: paged ? blocksFor(len, block) : PER }, (_, c) => {
            const fill = Math.max(0, Math.min(block, len - c * block)) / block, x = L + c * CW;
            return (
              <g key={c}>
                <rect x={x} y={y0 + r * (CH + 6)} width={CW - 2} height={CH} rx={3} fill="var(--surface-2)" stroke={fill === 0 ? "var(--hard)" : "var(--line-strong)"} strokeDasharray={fill === 0 ? "3 2" : undefined} />
                {fill > 0 && <rect x={x} y={y0 + r * (CH + 6)} width={(CW - 2) * fill} height={CH} rx={3} fill="var(--accent)" />}
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function KvBlocks() {
  const t = useId(), h = lens.length * (CH + 6);
  return (
    <svg viewBox={`0 0 ${W} ${2 * h + 120}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Three requests of ${lens.join(", ")} tokens. Reserving ${max} tokens each holds ${RES} slots for ${USED} real tokens. Blocks of ${block} tokens, handed out as needed, hold ${PAGED} slots: only the last block of each request is partly empty.`}</title>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`Reserve ${max} each: ${RES} slots, ${Math.round((USED / RES) * 100)}% used`}</text>
      <Panel y0={24} paged={false} />
      <text x={0} y={h + 50} fontSize={12} fontWeight={600} fill="var(--ink)">{`Blocks of ${block}, on demand: ${PAGED} slots, ${Math.round((USED / PAGED) * 100)}% used`}</text>
      <Panel y0={h + 60} paged />
      <rect x={0} y={2 * h + 78} width={12} height={12} rx={2} fill="var(--accent)" />
      <text x={18} y={2 * h + 88} fontSize={11} fill="var(--muted)">tokens stored</text>
      <rect x={112} y={2 * h + 78} width={12} height={12} rx={2} fill="var(--surface-2)" stroke="var(--hard)" strokeDasharray="3 2" />
      <text x={130} y={2 * h + 88} fontSize={11} fill="var(--muted)">reserved, never used</text>
      <text x={0} y={2 * h + 110} fontSize={11} fill="var(--muted)">{`Each request gets a block table that maps its blocks to free spots.`}</text>
    </svg>
  );
}

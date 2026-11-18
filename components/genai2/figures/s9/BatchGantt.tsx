// The same eight requests on four slots: static batches wait for their longest member, continuous batching refills a slot the moment it frees. Times computed.
import { useId } from "react";
import { BATCH_LENS, BATCH_SLOTS, continuous, mean, staticSpans } from "@/lib/genai2/stages/s9.calc";

const ST = staticSpans(BATCH_LENS, BATCH_SLOTS), CO = continuous(BATCH_LENS, BATCH_SLOTS);
const END_S = Math.max(...ST.map((s) => s[1])), END_C = Math.max(...CO.map((s) => s[1]));
const W = 340, L = 40, R = 6, BAR = 14, GAP = 4, scale = (W - L - R) / END_S;
const x = (t: number) => L + t * scale;
// slot of each request: static fills slots in order per batch; continuous takes the earliest free slot
const slotStatic = BATCH_LENS.map((_, i) => i % BATCH_SLOTS);
const slotCont = (() => { const free = Array(BATCH_SLOTS).fill(0) as number[]; return BATCH_LENS.map((l) => { const i = free.indexOf(Math.min(...free)); free[i] += l; return i; }); })();
const NAMES = BATCH_LENS.map((_, i) => String.fromCharCode(65 + i));

function Lanes({ y0, spans, slots }: { y0: number; spans: [number, number][]; slots: number[] }) {
  return (
    <g>
      {Array.from({ length: BATCH_SLOTS }, (_, s) => <text key={s} x={0} y={y0 + s * (BAR + GAP) + 11} fontSize={11} fill="var(--muted)">{`slot ${s + 1}`}</text>)}
      {spans.map(([a, b], i) => (
        <g key={i}>
          <rect x={x(a)} y={y0 + slots[i] * (BAR + GAP)} width={Math.max(2, (b - a) * scale - 1.5)} height={BAR} rx={3} fill={i % 2 ? "var(--accent)" : "var(--accent-soft)"} stroke="var(--accent)" />
          {(b - a) * scale > 14 && <text x={x(a) + 3} y={y0 + slots[i] * (BAR + GAP) + 11} fontSize={10} fill={i % 2 ? "var(--accent-ink)" : "var(--ink)"}>{NAMES[i]}</text>}
        </g>
      ))}
    </g>
  );
}

export function BatchGantt() {
  const t = useId(), h = BATCH_SLOTS * (BAR + GAP);
  const mS = Math.round(mean(ST.map((s) => s[1]))), mC = Math.round(mean(CO.map((s) => s[1])));
  const y2 = h + 62;
  return (
    <svg viewBox={`0 0 ${W} ${2 * h + 110}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Eight requests of ${BATCH_LENS.join(", ")} tokens on ${BATCH_SLOTS} slots. Static batching takes ${END_S} steps and requests finish after ${mS} steps on average. Continuous batching takes ${END_C} steps, with an average finish of ${mC}.`}</title>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`Static: ${END_S} steps, average finish ${mS}`}</text>
      <Lanes y0={24} spans={ST} slots={slotStatic} />
      <text x={0} y={y2 - 10} fontSize={12} fontWeight={600} fill="var(--ink)">{`Continuous: ${END_C} steps, average finish ${mC}`}</text>
      <Lanes y0={y2} spans={CO} slots={slotCont} />
      <line x1={x(END_C)} y1={y2 - 4} x2={x(END_C)} y2={y2 + h} stroke="var(--easy)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={0} y={2 * h + 100} fontSize={11} fill="var(--muted)">Gaps are slots sitting idle, waiting for the longest request.</text>
    </svg>
  );
}

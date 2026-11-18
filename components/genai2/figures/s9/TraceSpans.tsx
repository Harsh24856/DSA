// One request as a trace: a parent span and one child span per step, with time, tokens and cost on each. Values computed.
import { useId } from "react";
import { spanCost, TRACE } from "@/lib/genai2/stages/s9.calc";

const TOTAL = TRACE.reduce((a, s) => a + s.ms, 0), COST = TRACE.reduce((a, s) => a + spanCost(s), 0);
const W = 340, L = 8, R = 8, ROW = 42, scale = (W - L - R) / TOTAL;
const SLOW = TRACE.reduce((b, s) => (s.ms > b.ms ? s : b), TRACE[0]);

export function TraceSpans() {
  const t = useId();
  let at = 0;
  return (
    <svg viewBox={`0 0 ${W} ${(TRACE.length + 1) * ROW + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`One request takes ${TOTAL} ms and costs $${COST.toFixed(4)}. Spans: ${TRACE.map((s) => `${s.name} ${s.ms} ms`).join(", ")}. The slowest is ${SLOW.name}.`}</title>
      <text x={L} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`request: ${TOTAL.toLocaleString("en-US")} ms, $${COST.toFixed(4)}`}</text>
      <rect x={L} y={20} width={TOTAL * scale} height={10} rx={3} fill="var(--line-strong)" />
      {TRACE.map((s, i) => {
        const x0 = L + at * scale, w = s.ms * scale, y = (i + 1) * ROW;
        at += s.ms;
        const right = x0 + w / 2 > W / 2;
        const info = s.inTok ? `${s.inTok.toLocaleString("en-US")} in, ${s.outTok} out, $${spanCost(s).toFixed(4)}` : "no model tokens";
        return (
          <g key={s.name}>
            <text x={right ? x0 + w : x0} y={y} fontSize={12} textAnchor={right ? "end" : "start"} fill="var(--ink)">{`${s.name}: ${s.ms} ms`}</text>
            <rect x={x0} y={y + 6} width={Math.max(3, w - 1)} height={12} rx={3} fill={s === SLOW ? "var(--accent)" : "var(--accent-soft)"} stroke="var(--accent)" />
            <text x={right ? x0 + w : x0} y={y + 32} fontSize={11} textAnchor={right ? "end" : "start"} fill="var(--muted)">{info}</text>
          </g>
        );
      })}
      <text x={L} y={(TRACE.length + 1) * ROW + 22} fontSize={11} fill="var(--muted)">Each span keeps its inputs and outputs, so a bad answer can be replayed.</text>
    </svg>
  );
}

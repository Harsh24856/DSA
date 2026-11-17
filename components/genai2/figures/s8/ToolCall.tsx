// One tool call, split at the line that matters: the model only writes a request; your code checks it, runs it and trims the result.
import { useId } from "react";

const CALL = { name: "get_order", input: { order_id: "A-1042" } };
// the full record the order service returns, and the two fields the model needs to answer "where is my order?"
const RECORD: Record<string, string> = {
  id: "A-1042", status: "shipped", eta: "2026-11-19", carrier: "Parcel Co", warehouse: "W3", sku: "B-77", qty: "1",
  price: "24.00", tax: "1.92", card_last4: "4242", address: "12 High St", created: "2026-11-14", updated: "2026-11-16",
};
const KEEP = ["status", "eta"];
const CHECKS = ["tool name is known", "input matches the schema", "this user owns A-1042"];

const W = 340, BOX = 300, X = (W - BOX) / 2;

export function ToolCall() {
  const t = useId(), total = Object.keys(RECORD).length;
  const back = `{"status": "${RECORD.status}", "eta": "${RECORD.eta}"}`;
  return (
    <svg viewBox={`0 0 ${W} 372`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`The model writes a request to call ${CALL.name} with order id ${CALL.input.order_id}. Below a dividing line, your code checks ${CHECKS.length} things: ${CHECKS.join(", ")}. Only then does it run the tool. The order record has ${total} fields; ${KEEP.length} go back to the model.`}</title>
      <text x={X} y={16} fontSize={12} fill="var(--muted)">1. The model writes text, nothing more</text>
      <rect x={X} y={24} width={BOX} height={52} rx={12} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
      <text x={X + 12} y={46} fontSize={12} fontFamily="var(--mono)" fill="var(--ink)">{`{"name": "${CALL.name}",`}</text>
      <text x={X + 12} y={64} fontSize={12} fontFamily="var(--mono)" fill="var(--ink)">{` "input": {"order_id": "${CALL.input.order_id}"}}`}</text>

      <line x1={0} y1={98} x2={W} y2={98} stroke="var(--line-strong)" strokeDasharray="6 5" strokeWidth={1.5} />
      <text x={W} y={92} textAnchor="end" fontSize={11} fill="var(--muted)">model side</text>
      <text x={W} y={112} textAnchor="end" fontSize={11} fill="var(--muted)">your code</text>

      <text x={X} y={130} fontSize={12} fill="var(--muted)">2. Your code checks before it acts</text>
      {CHECKS.map((c, i) => (
        <g key={c}>
          <circle cx={X + 12} cy={150 + i * 26} r={8} fill="var(--easy)" />
          <path d={`M ${X + 8} ${150 + i * 26} l 3 3 l 5 -6`} stroke="var(--surface)" strokeWidth={2} fill="none" />
          <text x={X + 28} y={154 + i * 26} fontSize={12} fill="var(--ink)">{c}</text>
        </g>
      ))}
      <text x={X} y={242} fontSize={12} fill="var(--muted)">3. It runs the tool and trims the result</text>
      <rect x={X} y={252} width={BOX} height={28} rx={8} fill="var(--surface)" stroke="var(--line-strong)" />
      <rect x={X} y={252} width={(BOX * KEEP.length) / total} height={28} rx={8} fill="var(--accent)" />
      <text x={X + BOX / 2 + 14} y={270} textAnchor="middle" fontSize={12} fill="var(--ink)">{`${KEEP.length} of ${total} fields are needed`}</text>
      <rect x={X} y={296} width={BOX} height={36} rx={12} fill="var(--surface)" stroke="var(--easy)" strokeWidth={2} />
      <text x={X + 8} y={319} fontSize={11} fontFamily="var(--mono)" fill="var(--ink)">{back}</text>
      <text x={X} y={358} fontSize={12} fill="var(--muted)">This goes back to the model as the tool result.</text>
    </svg>
  );
}

// The parts of a solid prompt, in the order they are sent: the parts that never change first, the documents and the question last.
import { useId } from "react";

const PARTS: [string, string, boolean][] = [
  ["1 role and goal", "You answer billing questions for a shop.", true],
  ["2 rules", "Use only the documents. Cite [doc-id].", true],
  ["3 format and way out", "Under 80 words. Not there? Say so.", true],
  ["4 examples", "Q: refund on day 10?  A: Yes [doc-3]", true],
  ["5 <documents>", "<doc id=3>Refunds within 30 days</doc>", false],
  ["6 question, last", "Can I get a refund on day 40?", false],
];
const W = 340, X = 6, BW = 300, ROW = 46, TOP = 6;

export function PromptParts() {
  const t = useId();
  const stableEnd = TOP + PARTS.filter((p) => p[2]).length * ROW;
  const end = TOP + PARTS.length * ROW;
  return (
    <svg viewBox={`0 0 ${W} ${end + 8}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>A prompt in six parts, top to bottom: role and goal, rules, format with a way out when the answer is missing, a worked example, the documents in tags, and the question last. The first four stay the same on every call; the documents and the question change each time.</title>
      {PARTS.map(([label, text, stable], i) => {
        const y = TOP + i * ROW;
        return (
          <g key={label}>
            <text x={X} y={y + 12} fontSize={12} fontWeight={600} fill={stable ? "var(--muted)" : "var(--accent)"}>{label}</text>
            <rect x={X} y={y + 18} width={BW} height={24} rx={6} fill={stable ? "var(--surface-2)" : "var(--accent-soft)"} stroke={stable ? "var(--line-strong)" : "var(--accent)"} />
            <text x={X + 8} y={y + 34} fontSize={12} fill="var(--ink)">{text}</text>
          </g>
        );
      })}
      <line x1={BW + 16} y1={TOP + 18} x2={BW + 16} y2={stableEnd - 6} stroke="var(--line-strong)" strokeWidth={2} />
      <line x1={BW + 16} y1={stableEnd + 18} x2={BW + 16} y2={end - 4} stroke="var(--accent)" strokeWidth={2} />
      <text x={BW + 26} y={(TOP + stableEnd) / 2} fontSize={12} fill="var(--muted)" transform={`rotate(90 ${BW + 26} ${(TOP + stableEnd) / 2})`} textAnchor="middle">same every call</text>
      <text x={BW + 26} y={(stableEnd + end) / 2 + 6} fontSize={12} fill="var(--accent)" transform={`rotate(90 ${BW + 26} ${(stableEnd + end) / 2 + 6})`} textAnchor="middle">per call</text>
    </svg>
  );
}

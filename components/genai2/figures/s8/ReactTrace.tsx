// A three-round ReAct trace. Each round adds a thought, an action and an observation, and the next model call must read all of it again.
import { useId } from "react";
import { callInput, n0 } from "@/lib/genai2/stages/s8.calc";

const PROMPT = 1200, OBS = 300;
const ROUNDS = [
  { t: "need the order first", a: "get_order(A-1042)", o: "eta 2026-11-19" },
  { t: "need the carrier's status", a: "track(PX-881)", o: "out for delivery" },
  { t: "need the delivery window", a: "window(PX-881)", o: "18:00 to 20:00" },
];
const W = 340, ROW = 18, ROUND = 4 * ROW + 26, TOP = 22, BAR = 150;
const calls = ROUNDS.map((_, i) => callInput(PROMPT, OBS, i + 1)), max = calls[calls.length - 1];

export function ReactTrace() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} ${TOP + ROUNDS.length * ROUND + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A ReAct trace with ${ROUNDS.length} rounds of thought, action and observation. After each round the next model call reads more: ${calls.map((c, i) => `call ${i + 2} reads ${n0(c)} tokens`).join(", ")}, starting from ${n0(PROMPT)}.`}</title>
      <text x={0} y={12} fontSize={12} fill="var(--muted)">{`Call 1 reads ${n0(PROMPT)} tokens: prompt and tools`}</text>
      {ROUNDS.map((r, i) => {
        const y = TOP + i * ROUND;
        const lines: [string, string, string][] = [["Thought", r.t, "var(--ink)"], ["Act", r.a, "var(--accent)"], ["Observe", r.o, "var(--ink)"]];
        return (
          <g key={i}>
            <rect x={0} y={y} width={W} height={3 * ROW + 10} rx={12} fill="var(--surface)" stroke="var(--line-strong)" />
            {lines.map(([k, v, c], j) => (
              <g key={k}>
                <text x={12} y={y + 20 + j * ROW} fontSize={12} fontWeight={600} fill="var(--muted)">{k}</text>
                <text x={78} y={y + 20 + j * ROW} fontSize={12} fill={c} fontFamily={k === "Act" ? "var(--mono)" : undefined}>{v}</text>
              </g>
            ))}
            <text x={0} y={y + 3 * ROW + 30} fontSize={12} fill="var(--ink)">{`Call ${i + 2} reads`}</text>
            <rect x={78} y={y + 3 * ROW + 20} width={BAR} height={12} rx={6} fill="var(--surface)" stroke="var(--line)" />
            <rect x={78} y={y + 3 * ROW + 20} width={(BAR * calls[i]) / max} height={12} rx={6} fill={i === ROUNDS.length - 1 ? "var(--medium)" : "var(--accent)"} />
            <text x={78 + BAR + 8} y={y + 3 * ROW + 30} fontSize={12} fontFamily="var(--mono)" fill="var(--ink)">{`${n0(calls[i])} tokens`}</text>
          </g>
        );
      })}
      <text x={0} y={TOP + ROUNDS.length * ROUND + 18} fontSize={12} fill="var(--muted)">The history only grows until the loop stops.</text>
    </svg>
  );
}

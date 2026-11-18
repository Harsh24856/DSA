// One speculative step: a small draft model guesses four tokens, the large model checks all four in one pass, keeps the first three and supplies its own fourth. Counts computed.
import { useId } from "react";
import { specCost } from "@/lib/genai2/stages/s9.calc";

const CONTEXT = "The cat sat";
const DRAFT = ["on", "the", "mat", "and"];
const OK = [true, true, true, false];
const TARGET_OWN = ".";
const KEPT = OK.indexOf(false) === -1 ? OK.length : OK.indexOf(false);
const OUT = [...DRAFT.slice(0, KEPT), TARGET_OWN];
const W = 340, CW = 62, X0 = 84, H = 30;
const C = 0.05, cost = specCost(DRAFT.length, C);

export function SpecTokens() {
  const t = useId();
  const box = (x: number, y: number, s: string, tone: "draft" | "ok" | "bad" | "own") => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={CW - 6} height={H - 6} rx={6} fill={tone === "own" ? "var(--accent)" : tone === "draft" ? "var(--surface-2)" : "var(--surface)"}
        stroke={tone === "ok" ? "var(--easy)" : tone === "bad" ? "var(--hard)" : "var(--line-strong)"} strokeWidth={tone === "ok" || tone === "bad" ? 2 : 1} strokeDasharray={tone === "bad" ? "4 3" : undefined} />
      <text x={x + (CW - 6) / 2} y={y + 16} fontSize={12} textAnchor="middle" fill={tone === "own" ? "var(--accent-ink)" : "var(--ink)"}>{s}</text>
    </g>
  );
  return (
    <svg viewBox={`0 0 ${W} 238`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`After "${CONTEXT}", a small draft model guesses ${DRAFT.length} tokens: ${DRAFT.join(", ")}. The large model checks all of them in one pass. It agrees with the first ${KEPT} and rejects "${DRAFT[KEPT]}", putting its own "${TARGET_OWN}" there. One large pass gives ${OUT.length} tokens instead of 1.`}</title>
      <text x={0} y={16} fontSize={12} fill="var(--muted)">{`context: "${CONTEXT}"`}</text>
      <text x={0} y={52} fontSize={12} fill="var(--ink)">draft guesses</text>
      {DRAFT.map((s, i) => box(X0 + i * CW, 34, s, "draft"))}
      <text x={0} y={100} fontSize={12} fill="var(--ink)">large checks</text>
      {DRAFT.map((s, i) => box(X0 + i * CW, 82, OK[i] ? "yes" : "no", OK[i] ? "ok" : "bad"))}
      <text x={0} y={148} fontSize={12} fill="var(--ink)">kept</text>
      {OUT.map((s, i) => box(X0 + i * CW, 130, s, i < KEPT ? "ok" : "own"))}
      <text x={0} y={190} fontSize={12} fill="var(--ink)">{`${OUT.length} tokens from 1 large pass, plus ${DRAFT.length} cheap draft steps.`}</text>
      <text x={0} y={210} fontSize={12} fill="var(--muted)">{`At a draft cost of ${C} each, the step costs ${cost.toFixed(1)} large passes.`}</text>
      <text x={0} y={230} fontSize={12} fill="var(--muted)">Anything after the first "no" is thrown away.</text>
    </svg>
  );
}

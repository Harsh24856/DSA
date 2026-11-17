// Where an agent's memory lives: the context window it reads now, and three stores outside it, each with a write path and a read path.
import { useId } from "react";

const STORES = [
  { name: "episodic", what: "what happened", eg: "\"last week's booking failed\"" },
  { name: "semantic", what: "facts", eg: "\"has a nut allergy\"" },
  { name: "procedural", what: "how to act", eg: "\"always confirm dates\"" },
];
const W = 340, TOP = 8, CTX = 92, GAP = 64, SH = 58;

export function MemoryTiers() {
  const t = useId(), y0 = TOP + CTX + GAP;
  return (
    <svg viewBox={`0 0 ${W} ${y0 + STORES.length * (SH + 8) + 22}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`The context window holds the current conversation and a summary of older turns. Below it, outside the model, sit ${STORES.length} stores: ${STORES.map((s) => `${s.name} memory for ${s.what}`).join(", ")}. The agent writes to them on purpose, and the most useful items are retrieved back into the context for each request.`}</title>
      <rect x={0} y={TOP} width={W} height={CTX} rx={16} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2} />
      <text x={12} y={TOP + 22} fontSize={12} fontWeight={600} fill="var(--ink)">Context window: what the model sees now</text>
      {["system prompt, tools", "summary of old turns", "recent turns", "retrieved memories"].map((label, i) => (
        <g key={label}>
          <rect x={12 + (i % 2) * 162} y={TOP + 34 + Math.floor(i / 2) * 26} width={150} height={18} rx={6} fill={i === 3 ? "var(--accent)" : "var(--line)"} />
          <text x={16 + (i % 2) * 162} y={TOP + 47 + Math.floor(i / 2) * 26} fontSize={11} fill={i === 3 ? "var(--accent-ink)" : "var(--ink)"}>{label}</text>
        </g>
      ))}
      <path d={`M 40 ${y0 - 6} L 40 ${TOP + CTX + 6}`} stroke="var(--accent)" strokeWidth={2} />
      <path d={`M 34 ${TOP + CTX + 14} L 40 ${TOP + CTX + 4} L 46 ${TOP + CTX + 14}`} stroke="var(--accent)" strokeWidth={2} fill="none" />
      <text x={52} y={TOP + CTX + 26} fontSize={12} fill="var(--ink)">read: the top few for this request</text>
      <path d={`M 300 ${TOP + CTX + 6} L 300 ${y0 - 6}`} stroke="var(--line-strong)" strokeWidth={2} strokeDasharray="5 4" />
      <path d={`M 294 ${y0 - 16} L 300 ${y0 - 6} L 306 ${y0 - 16}`} stroke="var(--line-strong)" strokeWidth={2} fill="none" />
      <text x={290} y={TOP + CTX + 46} textAnchor="end" fontSize={12} fill="var(--muted)">write: chosen facts, on purpose</text>
      {STORES.map((s, i) => {
        const y = y0 + i * (SH + 8);
        return (
          <g key={s.name}>
            <rect x={0} y={y} width={W} height={SH} rx={12} fill="var(--surface)" stroke="var(--line-strong)" />
            <text x={12} y={y + 22} fontSize={12} fontWeight={600} fill="var(--ink)">{s.name}</text>
            <text x={100} y={y + 22} fontSize={12} fill="var(--muted)">{s.what}</text>
            <text x={12} y={y + 44} fontSize={12} fill="var(--ink)">{s.eg}</text>
          </g>
        );
      })}
      <text x={0} y={y0 + STORES.length * (SH + 8) + 12} fontSize={12} fill="var(--muted)">Stores live in a database, outside the model.</text>
    </svg>
  );
}

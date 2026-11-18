// The context window as a budget: stable, cacheable parts first, then a cache breakpoint, then what changes each call, with room kept for the answer.
import { useId } from "react";

const PARTS: [string, number, "stable" | "live" | "out"][] = [
  ["tool definitions", 1500, "stable"], ["system prompt", 800, "stable"], ["reference docs", 6000, "stable"],
  ["summary of old turns", 600, "live"], ["recent turns", 3000, "live"], ["retrieved chunks", 4000, "live"], ["question, last", 200, "live"],
  ["reserved for the answer", 4000, "out"],
];
const TOTAL = PARTS.reduce((s, p) => s + p[1], 0);
const CACHED = PARTS.filter((p) => p[2] === "stable").reduce((s, p) => s + p[1], 0);
const W = 340, BX = 6, BW = 120, MIN = 20, SPAN = 230;
const h = (t: number) => MIN + (t / TOTAL) * SPAN;
const n0 = (x: number) => x.toLocaleString("en-US");

export function ContextWindow() {
  const t = useId();
  let y = 22;
  const rows = PARTS.map(([label, tok, kind]) => { const r = { label, tok, kind, y, hh: h(tok) }; y += r.hh; return r; });
  const breakY = rows.find((r) => r.kind === "live")!.y;
  return (
    <svg viewBox={`0 0 ${W} ${y + 10}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A ${n0(TOTAL)} token window, top to bottom: tool definitions, system prompt and reference docs, ${n0(CACHED)} tokens that stay the same and can be cached; then a cache breakpoint; then a summary of old turns, recent turns, retrieved chunks and the question last, which change every call; then space reserved for the answer.`}</title>
      <text x={BX} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`One window, ${n0(TOTAL)} tokens`}</text>
      {rows.map((r) => (
        <g key={r.label}>
          <rect x={BX} y={r.y} width={BW} height={r.hh - 2} rx={4}
            fill={r.kind === "stable" ? "var(--accent-soft)" : r.kind === "out" ? "var(--surface)" : "var(--surface-2)"}
            stroke={r.kind === "stable" ? "var(--accent)" : "var(--line-strong)"} strokeDasharray={r.kind === "out" ? "4 3" : undefined} />
          <text x={BX + BW / 2} y={r.y + (r.hh - 2) / 2 + 4} textAnchor="middle" fontSize={12} fill="var(--ink)" className="num">{n0(r.tok)}</text>
          <text x={BX + BW + 10} y={r.y + (r.hh - 2) / 2 + 4} fontSize={12} fill="var(--ink)">{r.label}</text>
        </g>
      ))}
      <line x1={0} y1={breakY - 1} x2={W} y2={breakY - 1} stroke="var(--accent)" strokeWidth={2} strokeDasharray="6 4" />
      <text x={W} y={breakY - 6} textAnchor="end" fontSize={12} fill="var(--accent)">breakpoint: cached above, new below</text>
    </svg>
  );
}

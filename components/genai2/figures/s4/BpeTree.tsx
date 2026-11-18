// The word "lowest" after each learned merge that changes it, from the real BPE run in s4.flows.ts.
import { useId } from "react";
import { bpeEncode, bpeTrain, BPE_STEPS, CORPUS } from "@/lib/genai2/stages/s4.flows";

const WORD = "lowest";
const frames = bpeTrain(CORPUS, BPE_STEPS);
// rows: the start, then every merge that changes this word
const ROWS: { label: string; toks: string[]; made?: string }[] = [{ label: "start: characters", toks: [...WORD, "_"] }];
frames.slice(1).forEach((f, i) => {
  const toks = bpeEncode(WORD, frames.slice(0, i + 2)), m = f.merge!;
  if (toks.length < ROWS[ROWS.length - 1].toks.length) ROWS.push({ label: `merge ${i + 1}: ${m.a} + ${m.b}`, toks, made: m.a + m.b });
});
const W = 340, CH = 40, X0 = (W - CH * (WORD.length + 1)) / 2, ROW = 52;

export function BpeTree() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${ROWS.length * ROW + 8}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`The word ${WORD} as BPE learns merges. ${ROWS.map((r) => `${r.label}, pieces ${r.toks.join(" ")}`).join(". ")}.`}</title>
      {ROWS.map((r, ri) => {
        let at = 0;
        const y = ri * ROW;
        return (
          <g key={ri}>
            <text x={X0} y={y + 14} fontSize={13} fill="var(--muted)">{r.label}</text>
            {r.toks.map((t, ti) => {
              const x = X0 + at * CH, w = t.length * CH - 4, hot = t === r.made;
              at += t.length;
              return (
                <g key={ti}>
                  <rect x={x} y={y + 20} width={w} height={26} rx={6} fill={hot ? "var(--accent-soft)" : "var(--surface-2)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} strokeWidth={hot ? 1.5 : 1} />
                  <text x={x + w / 2} y={y + 38} textAnchor="middle" fontSize={14} fontWeight={hot ? 600 : 400} fill="var(--ink)">{t}</text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

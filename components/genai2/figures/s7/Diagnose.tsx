// Sorting a failing answer into one of four boxes: was the right chunk retrieved, and was the answer right? Counts come from a 20 question toy eval run, tallied here.
import { useId } from "react";

// one entry per question: [right chunk in the top k?, answer correct and supported?]
const RUN: [boolean, boolean][] = [
  ...Array.from({ length: 12 }, () => [true, true] as [boolean, boolean]),
  ...Array.from({ length: 4 }, () => [true, false] as [boolean, boolean]),
  ...Array.from({ length: 1 }, () => [false, true] as [boolean, boolean]),
  ...Array.from({ length: 3 }, () => [false, false] as [boolean, boolean]),
];
const count = (r: boolean, a: boolean) => RUN.filter(([x, y]) => x === r && y === a).length;
const CELLS: { r: boolean; a: boolean; title: string; lines: string[]; tone: "ok" | "hot" | "warn" | "bad" }[] = [
  { r: true, a: true, title: "working", lines: ["keep it as a", "regression test"], tone: "ok" },
  { r: true, a: false, title: "generation problem", lines: ["prompt, chunk order,", "model, too much noise"], tone: "hot" },
  { r: false, a: true, title: "lucky, or memory", lines: ["not grounded in", "the retrieved text"], tone: "warn" },
  { r: false, a: false, title: "retrieval problem", lines: ["parse, chunk, embed,", "query, filters"], tone: "bad" },
];
const W = 340, X0 = 58, CW = 139, CH = 104, Y0 = 44;
const stroke = { ok: "var(--easy)", hot: "var(--accent)", warn: "var(--medium)", bad: "var(--hard)" };

export function Diagnose() {
  const t = useId();
  const retrieved = RUN.filter(([r]) => r).length;
  return (
    <svg viewBox={`0 0 ${W} ${Y0 + 2 * CH + 40}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`${RUN.length} eval questions sorted by two checks. Right chunk retrieved and answer right: ${count(true, true)}, working. Retrieved but answer wrong: ${count(true, false)}, a generation problem. Not retrieved but answer right: ${count(false, true)}, lucky or from memory. Not retrieved and wrong: ${count(false, false)}, a retrieval problem.`}</title>
      <text x={X0 + CW / 2} y={30} textAnchor="middle" fontSize={12} fill="var(--muted)">answer right</text>
      <text x={X0 + CW * 1.5 + 4} y={30} textAnchor="middle" fontSize={12} fill="var(--muted)">answer wrong</text>
      {[true, false].map((r, i) => (
        <g key={String(r)}>
          <text x={X0 - 8} y={Y0 + i * CH + CH / 2 - 4} textAnchor="end" fontSize={12} fill="var(--muted)">chunk</text>
          <text x={X0 - 8} y={Y0 + i * CH + CH / 2 + 12} textAnchor="end" fontSize={12} fill="var(--muted)">{r ? "found" : "missed"}</text>
        </g>
      ))}
      {CELLS.map((c) => {
        const x = X0 + (c.a ? 0 : CW + 4), y = Y0 + (c.r ? 0 : CH + 4);
        return (
          <g key={c.title}>
            <rect x={x} y={y} width={CW} height={CH - 4} rx={12} fill="var(--surface)" stroke={stroke[c.tone]} strokeWidth={1.5} />
            <text x={x + 10} y={y + 26} fontSize={18} fontWeight={600} fill="var(--ink)" className="num">{count(c.r, c.a)}</text>
            <text x={x + 10} y={y + 48} fontSize={12} fontWeight={600} fill="var(--ink)">{c.title}</text>
            {c.lines.map((l, k) => <text key={l} x={x + 10} y={y + 66 + k * 16} fontSize={12} fill="var(--muted)">{l}</text>)}
          </g>
        );
      })}
      <text x={0} y={Y0 + 2 * CH + 24} fontSize={12} fill="var(--muted)">{`The right chunk was found for ${retrieved} of ${RUN.length} questions.`}</text>
    </svg>
  );
}

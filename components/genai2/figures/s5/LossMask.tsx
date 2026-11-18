// One chat rendered by a template into tokens, with the SFT label under each: prompt tokens get -100 (ignored), the answer and its end token are trained.
import { useId } from "react";
import { CHAT, END, tag, toks } from "@/lib/genai2/stages/s5.flows";

const W = 340, CH = 7.4, PADX = 6, GAP = 6, ROW = 64, TOP = 8, H = 22;
const rows = CHAT.map(([role, text]) => {
  const pieces = [tag(role), ...toks(text), END], train = role === "assistant";
  let x = 4;
  return pieces.map((p, i) => {
    const w = p.length * CH + PADX * 2, chip = { p, x, w, on: train && i > 0 };
    x += w + GAP;
    return chip;
  });
});
const trained = rows.flat().filter((c) => c.on).length, total = rows.flat().length;

export function LossMask() {
  const titleId = useId();
  const height = TOP + rows.length * ROW + 30;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A chat rendered as tokens with special role and end tokens. Under each prompt token the label is -100, so the loss ignores it. Only the answer and its end token are trained: ${trained} of ${total} tokens.`}</title>
      {rows.map((row, r) => row.map((c, i) => {
        const y = TOP + r * ROW;
        return (
          <g key={`${r}-${i}`}>
            <rect x={c.x} y={y} width={c.w} height={H} rx={6} fill={c.on ? "var(--accent-soft)" : "var(--surface-2)"} stroke={c.on ? "var(--accent)" : "var(--line-strong)"} strokeWidth={c.on ? 2 : 1} />
            <text x={c.x + c.w / 2} y={y + 15} textAnchor="middle" fontSize={12} fontFamily="var(--mono)" fill={c.on ? "var(--ink)" : "var(--muted)"}>{c.p}</text>
            <text x={c.x + c.w / 2} y={y + H + 16} textAnchor="middle" fontSize={12} fontFamily="var(--mono)" fontWeight={c.on ? 600 : 400} fill={c.on ? "var(--accent)" : "var(--muted)"}>{c.on ? "learn" : "-100"}</text>
          </g>
        );
      }))}
      <text x={4} y={height - 8} fontSize={13} fill="var(--muted)"><tspan fontWeight={600} fill="var(--ink)">{trained} of {total}</tspan> tokens count in the loss</text>
    </svg>
  );
}

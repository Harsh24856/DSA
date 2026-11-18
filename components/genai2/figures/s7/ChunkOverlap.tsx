// A 1,000 token document cut into 300 token chunks that overlap by 60: the shared spans are stored twice, and a passage near a boundary still sits whole in one chunk.
import { useId } from "react";
import { chunkStarts, storedTokens } from "@/lib/genai2/stages/s7.calc";

const N = 1000, SIZE = 300, OVER = 60;
const starts = chunkStarts(N, SIZE, OVER), stored = storedTokens(N, SIZE, OVER);
const W = 340, X = 8, SPAN = 324, TOP = 40, ROW = 30;
const sx = (t: number) => X + (t / N) * SPAN;
const n0 = (x: number) => x.toLocaleString("en-US");
// a 50 token passage that crosses the end of chunk 1 (at SIZE) but starts after chunk 2 begins (at SIZE - OVER)
const FACT = [SIZE - 40, SIZE + 10] as const;

export function ChunkOverlap() {
  const t = useId();
  const bottom = TOP + 26 + starts.length * ROW;
  return (
    <svg viewBox={`0 0 ${W} ${bottom + 44}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A ${n0(N)} token document cut into ${starts.length} chunks of up to ${SIZE} tokens, each overlapping the next by ${OVER}. The chunks store ${n0(stored)} tokens in all. A short passage that crosses the end of chunk 1 still sits whole inside chunk 2.`}</title>
      <text x={X} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`One document, ${n0(N)} tokens`}</text>
      <rect x={X} y={TOP - 18} width={SPAN} height={14} rx={3} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <rect x={sx(FACT[0])} y={TOP - 18} width={sx(FACT[1]) - sx(FACT[0])} height={14} fill="var(--accent)" />
      {[0, 250, 500, 750, 1000].map((v) => (
        <text key={v} x={sx(v)} y={TOP + 10} textAnchor={v === 0 ? "start" : v === N ? "end" : "middle"} fontSize={12} fill="var(--muted)" className="num">{v}</text>
      ))}
      {starts.map((s, i) => {
        const e = Math.min(s + SIZE, N), y = TOP + 22 + i * ROW, next = starts[i + 1], whole = s <= FACT[0] && FACT[1] <= e;
        return (
          <g key={s}>
            <rect x={sx(s)} y={y} width={sx(e) - sx(s)} height={20} rx={4} fill="var(--surface)" stroke={whole ? "var(--accent)" : "var(--line-strong)"} strokeWidth={whole ? 1.5 : 1} />
            {next !== undefined && <rect x={sx(next)} y={y} width={sx(e) - sx(next)} height={20} fill="var(--accent-soft)" />}
            {s <= FACT[1] && FACT[0] <= e && <rect x={sx(Math.max(s, FACT[0]))} y={y + 7} width={sx(Math.min(e, FACT[1])) - sx(Math.max(s, FACT[0]))} height={6} fill="var(--accent)" />}
            <text x={i < 2 ? sx(e) + 6 : sx(s) - 6} y={y + 15} textAnchor={i < 2 ? "start" : "end"} fontSize={12} fill="var(--ink)" className="num">{`chunk ${i + 1}: ${s} to ${e}`}</text>
          </g>
        );
      })}
      <text x={X} y={bottom + 16} fontSize={12} fill="var(--muted)">{`Tinted bands: ${OVER} tokens stored twice. Stored: ${n0(stored)}.`}</text>
      <text x={X} y={bottom + 34} fontSize={12} fill="var(--muted)">Solid mark: a passage cut by chunk 1, whole in chunk 2.</text>
    </svg>
  );
}

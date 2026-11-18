// Weight memory of one 8B model at three precisions, against three common memory sizes.
import { useId } from "react";

const PARAMS = 8, BITS = [16, 8, 4], DEVICES = [8, 16, 24];
const gb = (bits: number) => (PARAMS * bits) / 8;           // billions of weights x bytes per weight = GB
const W = 340, X = 72, SPAN = 250, MAXGB = 24, TOP = 40, ROW = 40;
const sx = (g: number) => X + (g / MAXGB) * SPAN;

export function LocalMemory() {
  const t = useId();
  const bottom = TOP + BITS.length * ROW;
  return (
    <svg viewBox={`0 0 ${W} ${bottom + 44}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Weights of an ${PARAMS} billion parameter model: ${BITS.map((b) => `${gb(b)} GB at ${b}-bit`).join(", ")}. Dashed lines mark ${DEVICES.join(", ")} GB of memory. Only the 4-bit version leaves room on an 8 GB machine.`}</title>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`An ${PARAMS}B model's weights`}</text>
      {DEVICES.map((d) => (
        <g key={d}>
          <line x1={sx(d)} y1={TOP - 12} x2={sx(d)} y2={bottom} stroke="var(--line-strong)" strokeDasharray="4 3" />
          <text x={sx(d)} y={TOP - 16} textAnchor={d === MAXGB ? "end" : "middle"} fontSize={12} fill="var(--muted)" className="num">{`${d} GB`}</text>
        </g>
      ))}
      {BITS.map((b, i) => {
        const y = TOP + i * ROW, g = gb(b), roomy = g < DEVICES[0];
        return (
          <g key={b}>
            <text x={X - 8} y={y + 18} textAnchor="end" fontSize={12} fill="var(--ink)">{`${b}-bit`}</text>
            <rect x={X} y={y + 4} width={sx(g) - X} height={22} rx={4} fill={roomy ? "var(--accent)" : "var(--surface-2)"} stroke={roomy ? "var(--accent)" : "var(--line-strong)"} />
            <text x={sx(g) + 6} y={y + 19} fontSize={12} fill="var(--ink)" className="num" textAnchor={sx(g) + 50 > W ? "end" : "start"} dx={sx(g) + 50 > W ? -12 : 0}>{`${g} GB`}</text>
          </g>
        );
      })}
      <text x={0} y={bottom + 18} fontSize={12} fill="var(--muted)">GB = billions of weights × bits ÷ 8.</text>
      <text x={0} y={bottom + 36} fontSize={12} fill="var(--muted)">The KV cache and runtime need more on top.</text>
    </svg>
  );
}

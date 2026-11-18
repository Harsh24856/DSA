// Weight memory of an 8B and a 70B model at 16, 8 and 4 bits (4-bit with one 16-bit scale per 128 weights), against one 80 GB GPU. Sizes computed.
import { useId } from "react";
import { decodeCeiling, GPU, n0, quantGB } from "@/lib/genai2/stages/s9.calc";

const FORMATS: [string, number, number][] = [["16-bit", 16, Infinity], ["8-bit", 8, Infinity], ["4-bit, g128", 4, 128]];
const MODELS = [8, 70];
const W = 340, L = 84, R = 40, BAR = 16, GAP = 6, MAX = 150, sx = (gb: number) => ((W - L - R) * gb) / MAX;
const size = (p: number, b: number, g: number) => quantGB(p, b, g);

export function QuantSizes() {
  const t = useId(), rowH = BAR + GAP, block = FORMATS.length * rowH + 28;
  const desc = MODELS.map((p) => `${p}B: ${FORMATS.map(([n, b, g]) => `${n} ${size(p, b, g).toFixed(1)} GB`).join(", ")}`).join(". ");
  return (
    <svg viewBox={`0 0 ${W} ${MODELS.length * block + 46}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Weight memory against an ${GPU.mem} GB GPU. ${desc}. Only the 4-bit 70B model fits on one GPU. Fewer bytes also raise the decode speed limit.`}</title>
      {MODELS.map((p, m) => (
        <g key={p}>
          <text x={0} y={m * block + 14} fontSize={12} fontWeight={600} fill="var(--ink)">{`${p}B parameters`}</text>
          {FORMATS.map(([n, b, g], i) => {
            const gb = size(p, b, g), y = m * block + 22 + i * rowH, over = gb > GPU.mem;
            return (
              <g key={n}>
                <text x={0} y={y + 12} fontSize={11} fill="var(--muted)">{n}</text>
                <rect x={L} y={y} width={Math.max(2, sx(Math.min(gb, MAX)))} height={BAR} rx={3} fill={over ? "var(--hard)" : "var(--accent)"} />
                <text x={L + sx(Math.min(gb, MAX)) + 4} y={y + 12} fontSize={11} fill="var(--ink)">{gb.toFixed(gb < 10 ? 1 : 0)}</text>
              </g>
            );
          })}
        </g>
      ))}
      <line x1={L + sx(GPU.mem)} y1={18} x2={L + sx(GPU.mem)} y2={MODELS.length * block} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={L + sx(GPU.mem) + 4} y={MODELS.length * block + 12} fontSize={11} fill="var(--ink)">{`${GPU.mem} GB GPU`}</text>
      <text x={0} y={MODELS.length * block + 36} fontSize={11} fill="var(--muted)">{`GB of weights. 8B decode limit: ${n0(decodeCeiling(size(8, 16, Infinity)))} tok/s at 16-bit, ${n0(decodeCeiling(size(8, 4, 128)))} at 4-bit.`}</text>
    </svg>
  );
}

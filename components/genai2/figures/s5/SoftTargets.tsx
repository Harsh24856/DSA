// A teacher's probabilities at temperature 1 and 4, side by side: the hard label hides what the soft one shows.
import { useId } from "react";
import { KD_CLASSES, KD_LOGITS } from "@/lib/genai2/stages/s5.play";

const softT = (z: number[], T: number) => { const e = z.map((x) => Math.exp(x / T)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
const HARD = KD_CLASSES.map((_, i) => (i === 0 ? 1 : 0)), P1 = softT(KD_LOGITS, 1), P4 = softT(KD_LOGITS, 4);
const SERIES: [string, number[], string][] = [["true label", HARD, "var(--ink)"], ["teacher, T = 1", P1, "var(--muted)"], ["teacher, T = 4", P4, "var(--accent)"]];
const W = 340, TOP = 44, H = 130, GW = W / KD_CLASSES.length, BW = 14;

export function SoftTargets() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${TOP + H + 44}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`For one image of a cat. The true label is 1 on cat and 0 elsewhere. The teacher at temperature 1 gives ${KD_CLASSES.map((c, i) => `${c} ${P1[i].toFixed(2)}`).join(", ")}. At temperature 4 it gives ${KD_CLASSES.map((c, i) => `${c} ${P4[i].toFixed(2)}`).join(", ")}, so the student also learns that a dog and a fox look more like a cat than a cup does.`}</title>
      {SERIES.map(([name, , color], s) => (
        <g key={name}>
          <rect x={4 + s * 112} y={8} width={12} height={12} rx={2} fill={color} />
          <text x={20 + s * 112} y={18} fontSize={12} fill="var(--ink)">{name}</text>
        </g>
      ))}
      <line x1={0} y1={TOP + H} x2={W} y2={TOP + H} stroke="var(--line-strong)" />
      {KD_CLASSES.map((c, i) => (
        <g key={c}>
          {SERIES.map(([name, p, color], s) => {
            const x = i * GW + GW / 2 - (BW * 3 + 4) / 2 + s * (BW + 2), h = p[i] * H;
            return <rect key={name} x={x} y={TOP + H - h} width={BW} height={Math.max(h, 1)} fill={color} />;
          })}
          <text x={i * GW + GW / 2} y={TOP + H + 16} textAnchor="middle" fontSize={13} fill="var(--ink)">{c}</text>
          <text x={i * GW + GW / 2} y={TOP + H + 32} textAnchor="middle" fontSize={12} fontFamily="var(--mono)" fill="var(--accent)">{P4[i].toFixed(2)}</text>
        </g>
      ))}
    </svg>
  );
}

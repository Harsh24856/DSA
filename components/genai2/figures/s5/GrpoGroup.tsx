// One GRPO group: six sampled answers to one prompt, checked by a program, and each answer's advantage against its own group.
import { useId } from "react";
import { grpoAdv } from "@/lib/genai2/stages/s5.play";

const REW = [1, 0, 1, 0, 0, 0];
const k = REW.filter(Boolean).length, a = grpoAdv(REW.length, k), adv = REW.map((r) => (r ? a.right : a.wrong));
const W = 340, COL = W / REW.length, BASE = 180, UNIT = 34, TOP = 8;
const cx = (i: number) => COL * i + COL / 2;

export function GrpoGroup() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} 250`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`One prompt, ${REW.length} sampled answers. A checker marks ${k} right and ${REW.length - k} wrong. The group mean reward is ${a.mean.toFixed(2)}, so right answers get an advantage of plus ${a.right.toFixed(2)} and wrong ones minus ${Math.abs(a.wrong).toFixed(2)}.`}</title>
      <rect x={W / 2 - 90} y={TOP} width={180} height={28} rx={8} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <text x={W / 2} y={TOP + 19} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">prompt: what is 17 × 24?</text>
      {REW.map((r, i) => (
        <g key={i}>
          <line x1={W / 2} y1={TOP + 28} x2={cx(i)} y2={TOP + 58} stroke="var(--line-strong)" />
          <rect x={cx(i) - 22} y={TOP + 58} width={44} height={24} rx={6} fill="var(--surface)" stroke="var(--line-strong)" />
          <text x={cx(i)} y={TOP + 74} textAnchor="middle" fontSize={12} fill="var(--ink)">{`A${i + 1}`}</text>
          <text x={cx(i)} y={TOP + 100} textAnchor="middle" fontSize={12} fontWeight={600} fill={r ? "var(--easy)" : "var(--hard)"}>{r ? "right" : "wrong"}</text>
          <rect x={cx(i) - 14} y={adv[i] > 0 ? BASE - adv[i] * UNIT : BASE} width={28} height={Math.abs(adv[i]) * UNIT} rx={4} fill={adv[i] > 0 ? "var(--easy)" : "var(--hard)"} opacity={0.85} />
          <text x={cx(i)} y={adv[i] > 0 ? BASE - adv[i] * UNIT - 4 : BASE + Math.abs(adv[i]) * UNIT + 14} textAnchor="middle" fontSize={12} fontFamily="var(--mono)" fill="var(--ink)">{`${adv[i] > 0 ? "+" : ""}${adv[i].toFixed(2)}`}</text>
        </g>
      ))}
      <line x1={4} y1={BASE} x2={W - 4} y2={BASE} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={4} y={244} fontSize={12} fill="var(--muted)">{`dashed line: group mean ${a.mean.toFixed(2)}; bars: advantage`}</text>
    </svg>
  );
}

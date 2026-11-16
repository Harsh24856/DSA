// What sits in GPU memory for RLHF with PPO against DPO: four models against two, and which of them train.
import { useId } from "react";

type M = [string, boolean];   // name, trained
const RLHF: M[] = [["policy", true], ["reference", false], ["reward model", false], ["value model", true]];
const DPO: M[] = [["policy", true], ["reference", false]];
const W = 340, BW = 158, BH = 40, G = 8;

function Panel({ y, title, models, data }: { y: number; title: string; models: M[]; data: string }) {
  const rows = Math.ceil(models.length / 2);
  return (
    <g>
      <text x={4} y={y + 14} fontSize={14} fontWeight={600} fill="var(--ink)">{title}</text>
      <text x={W - 4} y={y + 14} textAnchor="end" fontSize={12} fill="var(--muted)">{`${models.length} models, ${models.filter((m) => m[1]).length} trained`}</text>
      {models.map(([name, trained], i) => {
        const x = 4 + (i % 2) * (BW + G), by = y + 24 + Math.floor(i / 2) * (BH + G);
        return (
          <g key={name}>
            <rect x={x} y={by} width={BW} height={BH} rx={8} fill={trained ? "var(--accent-soft)" : "var(--surface-2)"} stroke={trained ? "var(--accent)" : "var(--line-strong)"} strokeWidth={trained ? 2 : 1} strokeDasharray={trained ? undefined : "5 4"} />
            <text x={x + BW / 2} y={by + 17} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">{name}</text>
            <text x={x + BW / 2} y={by + 32} textAnchor="middle" fontSize={12} fill="var(--muted)">{trained ? "trained" : "frozen"}</text>
          </g>
        );
      })}
      <text x={4} y={y + 24 + rows * (BH + G) + 12} fontSize={12} fill="var(--muted)">{data}</text>
    </g>
  );
}

export function RlhfDpo() {
  const titleId = useId(), h1 = 24 + 2 * (BH + G) + 24;
  return (
    <svg viewBox={`0 0 ${W} ${h1 + 24 + (BH + G) + 24}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>RLHF with PPO keeps four models in memory: the policy and a value model train, the reference and the reward model are frozen. DPO keeps two: the policy trains and the reference is frozen, and it learns straight from preference pairs.</title>
      <Panel y={0} title="RLHF with PPO" models={RLHF} data="samples new answers every step, scores them" />
      <line x1={4} y1={h1 + 4} x2={W - 4} y2={h1 + 4} stroke="var(--line)" />
      <Panel y={h1 + 12} title="DPO" models={DPO} data="reads a fixed set of chosen and rejected pairs" />
    </svg>
  );
}

// One neuron with real numbers: three inputs times their weights, summed with a bias into z, then bent by ReLU.
import { useId } from "react";
import { act, fmt, NEURON, neuronZ } from "@/lib/genai2/stages/s2.flows";

const { x, w, b } = NEURON, z = neuronZ(b), y = act("ReLU").f(z);
const IN_X = 34, SUM_X = 176, SUM_Y = 96, ACT_X = 236, OUT_X = 322;
const inY = (i: number) => 40 + i * 56;

export function Neuron() {
  const titleId = useId();
  return (
    <svg viewBox="0 0 340 236" className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`A neuron with inputs ${x.join(", ")} and weights ${w.join(", ")}. Each input is multiplied by its weight, the products are summed with the bias ${b} to give z = ${fmt(z)}, and ReLU turns z into the output ${fmt(y)}.`}</title>
      {x.map((v, i) => {
        const y0 = inY(i), mx = (IN_X + 18 + SUM_X - 22) / 2, my = (y0 + SUM_Y) / 2;
        return (
          <g key={i}>
            <line x1={IN_X + 18} y1={y0} x2={SUM_X - 22} y2={SUM_Y} stroke={Math.abs(w[i]) >= 0.6 ? "var(--accent)" : "var(--line-strong)"} strokeWidth={1 + Math.abs(w[i]) * 2} />
            <circle cx={IN_X} cy={y0} r={18} fill="var(--surface-2)" stroke="var(--line-strong)" />
            <text x={IN_X} y={y0 + 5} textAnchor="middle" fontSize={13} fill="var(--ink)">{v}</text>
            <rect x={mx - 26} y={my - 11} width={52} height={20} rx={10} fill="var(--surface)" stroke="var(--line)" />
            <text x={mx} y={my + 4} textAnchor="middle" fontSize={12} fill="var(--ink)">w {w[i]}</text>
          </g>
        );
      })}
      <text x={IN_X} y={inY(2) + 36} textAnchor="middle" fontSize={12} fill="var(--muted)">inputs x</text>
      {/* bias */}
      <line x1={SUM_X} y1={36} x2={SUM_X} y2={SUM_Y - 22} stroke="var(--line-strong)" />
      <text x={SUM_X} y={28} textAnchor="middle" fontSize={12} fill="var(--muted)">bias {b}</text>
      <circle cx={SUM_X} cy={SUM_Y} r={22} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
      <text x={SUM_X} y={SUM_Y + 6} textAnchor="middle" fontSize={18} fill="var(--ink)">Σ</text>
      <line x1={SUM_X + 22} y1={SUM_Y} x2={ACT_X - 22} y2={SUM_Y} stroke="var(--line-strong)" />
      <text x={(SUM_X + ACT_X) / 2} y={SUM_Y - 8} textAnchor="middle" fontSize={12} fill="var(--accent)">z</text>
      {/* activation box with the ReLU shape */}
      <rect x={ACT_X - 22} y={SUM_Y - 22} width={44} height={44} rx={8} fill="var(--surface)" stroke="var(--line-strong)" />
      <path d={`M ${ACT_X - 16} ${SUM_Y + 10} L ${ACT_X} ${SUM_Y + 10} L ${ACT_X + 14} ${SUM_Y - 14}`} fill="none" stroke="var(--accent)" strokeWidth={2} />
      <text x={ACT_X} y={SUM_Y + 38} textAnchor="middle" fontSize={12} fill="var(--muted)">ReLU</text>
      <line x1={ACT_X + 22} y1={SUM_Y} x2={OUT_X - 16} y2={SUM_Y} stroke="var(--line-strong)" />
      <circle cx={OUT_X} cy={SUM_Y} r={16} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <text x={OUT_X} y={SUM_Y + 5} textAnchor="middle" fontSize={13} fill="var(--ink)">{fmt(y)}</text>
      <text x={OUT_X - 6} y={SUM_Y + 38} textAnchor="middle" fontSize={12} fill="var(--muted)">output</text>
      <text x={8} y={206} fontSize={13} fill="var(--ink)">{`z = ${x.map((v, i) => `${v}×${w[i]}`).join(" + ")} + ${b} = ${fmt(z)}`}</text>
      <text x={8} y={226} fontSize={13} fill="var(--ink)">{`output = ReLU(${fmt(z)}) = ${fmt(y)}`}</text>
    </svg>
  );
}

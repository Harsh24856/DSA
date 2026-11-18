// An LSTM cell: the cell state runs along the top through one multiply (forget) and one add (write);
// three sigmoid gates and a tanh candidate read [h(t-1), x(t)] from below; the output gate picks what tanh(c) shows as h(t).
import { useId } from "react";

const W = 340, BELT = 36, GATE_Y = 150, GH = 26, GW = 48, IN_Y = 204, MIX_Y = 100, OUT_Y = 112;
const GATES = [
  { key: "f", fn: "σ", x: 90, job: "forget: how much old memory to keep" },
  { key: "i", fn: "σ", x: 150, job: "input: how much new content to write" },
  { key: "g", fn: "tanh", x: 210, job: "candidate: the new content, -1 to 1" },
  { key: "o", fn: "σ", x: 270, job: "output: how much of tanh(c) to show" },
];
const ADD_X = 180;

function Op({ x, y, s }: { x: number; y: number; s: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">{s}</text>
    </g>
  );
}

export function LstmCell() {
  const titleId = useId(), m = useId().replace(/:/g, "");
  const line = { stroke: "var(--line-strong)", strokeWidth: 1.5, markerEnd: `url(#${m})` };
  return (
    <svg viewBox={`0 0 ${W} ${IN_Y + 26 + GATES.length * 18}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>The LSTM cell. The previous cell state enters at the top left, is multiplied by the forget gate f, then has i times g added, and leaves as the new cell state. Four layers read the previous output and the input: sigmoid gates f, i and o, and a tanh candidate g. The new output h is o times tanh of the new cell state.</title>
      <defs><marker id={m} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker></defs>
      <text x={4} y={BELT - 10} fontSize={13} fill="var(--muted)">c(t-1)</text>
      <line x1={4} y1={BELT} x2={296} y2={BELT} stroke="var(--accent)" strokeWidth={3} />
      <text x={300} y={BELT + 5} fontSize={13} fontWeight={600} fill="var(--ink)">c(t)</text>
      <text x={W / 2 + 40} y={BELT - 10} fontSize={12} fill="var(--accent)">cell state</text>

      {GATES.map((g) => (
        <g key={g.key}>
          <rect x={g.x - GW / 2} y={GATE_Y} width={GW} height={GH} rx={6} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={g.x} y={GATE_Y + 17} textAnchor="middle" fontSize={13} fill="var(--ink)">{`${g.fn} ${g.key}`}</text>
          <line x1={g.x} y1={IN_Y} x2={g.x} y2={GATE_Y + GH + 2} {...line} />
        </g>
      ))}
      <line x1={90} y1={GATE_Y} x2={90} y2={BELT + 12} {...line} />
      <Op x={90} y={BELT} s="×" />
      <line x1={150} y1={GATE_Y} x2={ADD_X - 7} y2={MIX_Y + 8} {...line} />
      <line x1={210} y1={GATE_Y} x2={ADD_X + 7} y2={MIX_Y + 8} {...line} />
      <Op x={ADD_X} y={MIX_Y} s="×" />
      <line x1={ADD_X} y1={MIX_Y - 10} x2={ADD_X} y2={BELT + 12} {...line} />
      <Op x={ADD_X} y={BELT} s="+" />

      <line x1={270} y1={BELT} x2={270} y2={60} stroke="var(--line-strong)" strokeWidth={1.5} />
      <rect x={252} y={60} width={36} height={18} rx={4} fill="var(--surface-2)" stroke="var(--line-strong)" />
      <text x={270} y={73} textAnchor="middle" fontSize={12} fill="var(--ink)">tanh</text>
      <line x1={270} y1={78} x2={270} y2={OUT_Y - 12} {...line} />
      <line x1={270} y1={GATE_Y} x2={270} y2={OUT_Y + 12} {...line} />
      <Op x={270} y={OUT_Y} s="×" />
      <line x1={280} y1={OUT_Y} x2={298} y2={OUT_Y} {...line} />
      <text x={302} y={OUT_Y + 5} fontSize={13} fontWeight={600} fill="var(--ink)">h(t)</text>

      <line x1={40} y1={IN_Y} x2={270} y2={IN_Y} stroke="var(--line-strong)" strokeWidth={1.5} />
      <text x={40} y={IN_Y + 18} fontSize={13} fill="var(--muted)">[h(t-1), x(t)]</text>
      {GATES.map((g, k) => (
        <text key={g.key} x={4} y={IN_Y + 44 + k * 18} fontSize={13} fill="var(--muted)"><tspan fontWeight={600} fill="var(--ink)">{g.key}</tspan>{`  ${g.job}`}</text>
      ))}
    </svg>
  );
}

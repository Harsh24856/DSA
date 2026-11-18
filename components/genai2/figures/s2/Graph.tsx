// A computation graph for one sigmoid neuron with a squared loss: forward values flow down (solid), gradients flow back up (dashed).
import { useId } from "react";
import { BP, bpGraph, fmt } from "@/lib/genai2/stages/s2.flows";

const g = bpGraph();
const NODE_X = 24, NODE_W = 176, GRAD_X = 214;
const NODES = [
  { y: 92, text: `z = w·x + b = ${fmt(g.z)}`, grad: `∂L/∂z = ${fmt(g.dz)}`, local: `× σ' = ${fmt(g.pz)}` },
  { y: 160, text: `p = σ(z) = ${fmt(g.p)}`, grad: `∂L/∂p = ${fmt(g.dp)}`, local: `× 2(p - y)` },
  { y: 228, text: `L = (p - y)² = ${fmt(g.L)}`, grad: "∂L/∂L = 1", local: "start here" },
];
const INPUTS = [
  { label: `w = ${BP.w}`, grad: `∂L/∂w = ${fmt(g.dw)}` },
  { label: `x = ${BP.x}`, grad: "" },
  { label: `b = ${BP.b}`, grad: `∂L/∂b = ${fmt(g.db)}` },
];
const H = 36, IN_W = 56, inX = (i: number) => NODE_X + i * ((NODE_W - IN_W) / 2);

export function Graph() {
  const titleId = useId(), mid = titleId.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 340 300" className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Forward: w = ${BP.w}, x = ${BP.x} and b = ${BP.b} give z = ${fmt(g.z)}, then p = sigmoid(z) = ${fmt(g.p)}, then the loss (p - y) squared = ${fmt(g.L)} with y = ${BP.y}. Backward, each gradient is the one above times a local derivative: dL/dp = ${fmt(g.dp)}, dL/dz = ${fmt(g.dz)}, dL/dw = ${fmt(g.dw)}, dL/db = ${fmt(g.db)}.`}</title>
      <defs>
        <marker id={`${mid}-down`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker>
        <marker id={`${mid}-up`} viewBox="0 0 8 8" refX={7} refY={4} markerWidth={7} markerHeight={7} orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--accent)" /></marker>
      </defs>
      {INPUTS.map((n, i) => (
        <g key={n.label}>
          <rect x={inX(i)} y={14} width={IN_W} height={28} rx={8} fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text x={inX(i) + IN_W / 2} y={33} textAnchor="middle" fontSize={12} fill="var(--ink)">{n.label}</text>
          <line x1={inX(i) + IN_W / 2} y1={42} x2={NODE_X + NODE_W / 2 + (i - 1) * 30} y2={NODES[0].y - 2} stroke="var(--line-strong)" markerEnd={`url(#${mid}-down)`} />
        </g>
      ))}
      {NODES.map((n, i) => (
        <g key={n.text}>
          <rect x={NODE_X} y={n.y} width={NODE_W} height={H} rx={8} fill={i === 2 ? "var(--accent-soft)" : "var(--surface)"} stroke="var(--line-strong)" />
          <text x={NODE_X + NODE_W / 2} y={n.y + 23} textAnchor="middle" fontSize={13} fill="var(--ink)">{n.text}</text>
          {i < 2 && <line x1={NODE_X + 40} y1={n.y + H} x2={NODE_X + 40} y2={NODES[i + 1].y - 2} stroke="var(--line-strong)" markerEnd={`url(#${mid}-down)`} />}
          {i > 0 && <line x1={NODE_X + NODE_W - 40} y1={n.y} x2={NODE_X + NODE_W - 40} y2={NODES[i - 1].y + H + 2} stroke="var(--accent)" strokeDasharray="4 3" markerEnd={`url(#${mid}-up)`} />}
          <text x={GRAD_X} y={n.y + 15} fontSize={12} fill="var(--accent)">{n.grad}</text>
          <text x={GRAD_X} y={n.y + 31} fontSize={12} fill="var(--muted)">{n.local}</text>
        </g>
      ))}
      <text x={NODE_X + 4} y={284} fontSize={12} fill="var(--muted)">{`target y = ${BP.y}`}</text>
      <line x1={GRAD_X - 6} y1={NODES[0].y - 4} x2={GRAD_X - 6} y2={46} stroke="var(--accent)" strokeDasharray="4 3" markerEnd={`url(#${mid}-up)`} />
      {INPUTS.filter((n) => n.grad).map((n, i) => (
        <text key={n.grad} x={GRAD_X + 4} y={58 + i * 15} fontSize={12} fill="var(--accent)">{n.grad}</text>
      ))}
      <text x={NODE_X + 4} y={298} fontSize={12} fill="var(--muted)">solid: values forward, dashed: gradients back</text>
    </svg>
  );
}

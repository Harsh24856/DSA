// An agent as a state graph: nodes are functions, edges say what runs next, one conditional edge routes on the state, and a checkpoint is saved after every step.
import { useId } from "react";

type Node = { id: string; x: number; y: number; tone?: "hot" | "warn" | "ok" };
const NODES: Node[] = [
  { id: "START", x: 170, y: 22 },
  { id: "agent", x: 170, y: 92, tone: "hot" },
  { id: "tools", x: 62, y: 182 },
  { id: "approve", x: 278, y: 182, tone: "warn" },
  { id: "END", x: 290, y: 92, tone: "ok" },
];
// from, to, label, conditional?
const EDGES: [string, string, string, boolean][] = [
  ["START", "agent", "", false],
  ["agent", "tools", "tool call", true],
  ["tools", "agent", "", false],
  ["agent", "approve", "refund", true],
  ["approve", "tools", "approved", false],
  ["agent", "END", "answer", true],
];
const at = (id: string) => NODES.find((n) => n.id === id)!;
const BW = 76, BH = 30, W = 340;
const TONE = { hot: "var(--accent)", warn: "var(--medium)", ok: "var(--easy)" };

export function StateGraph() {
  const t = useId(), m = "m" + t.replace(/[^a-zA-Z0-9]/g, ""), routes = EDGES.filter((e) => e[3]);
  return (
    <svg viewBox={`0 0 ${W} 276`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A state graph with ${NODES.length} nodes. From START the agent node runs. A conditional edge after it routes on the state to ${routes.map((r) => `${r[1]} on ${r[2]}`).join(", ")}. Tools loop back to the agent. The approve node pauses for a person before a refund. A checkpoint of the state is saved after every node.`}</title>
      <defs>
        <marker id={m} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--line-strong)" /></marker>
      </defs>
      {EDGES.map(([a, b, label, cond]) => {
        const p = at(a), q = at(b), back = a === "tools" && b === "agent";
        const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const sx = p.x + ux * (Math.abs(uy) > 0.6 ? BH / 2 / Math.abs(uy) : BW / 2 / Math.abs(ux)), sy = p.y + uy * (Math.abs(uy) > 0.6 ? BH / 2 / Math.abs(uy) : BW / 2 / Math.abs(ux));
        const ex = q.x - ux * (Math.abs(uy) > 0.6 ? BH / 2 / Math.abs(uy) + 2 : BW / 2 / Math.abs(ux) + 2), ey = q.y - uy * (Math.abs(uy) > 0.6 ? BH / 2 / Math.abs(uy) + 2 : BW / 2 / Math.abs(ux) + 2);
        const off = back ? 14 : 0, d = `M ${sx + off} ${sy} L ${ex + off} ${ey}`;
        return (
          <g key={a + b}>
            <path d={d} stroke="var(--line-strong)" strokeWidth={1.5} fill="none" strokeDasharray={cond ? "5 4" : undefined} markerEnd={`url(#${m})`} />
            {label && <text x={(sx + ex) / 2} y={(sy + ey) / 2 - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">{label}</text>}
          </g>
        );
      })}
      {NODES.map((n) => (
        <g key={n.id}>
          <rect x={n.x - BW / 2} y={n.y - BH / 2} width={BW} height={BH} rx={n.id === "START" || n.id === "END" ? BH / 2 : 8} fill="var(--surface)" stroke={n.tone ? TONE[n.tone] : "var(--line-strong)"} strokeWidth={n.tone ? 2 : 1.5} />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--ink)">{n.id}</text>
          {n.id !== "START" && n.id !== "END" && <rect x={n.x + BW / 2 - 6} y={n.y - BH / 2 - 6} width={10} height={10} transform={`rotate(45 ${n.x + BW / 2 - 1} ${n.y - BH / 2 - 1})`} fill="var(--accent)" />}
        </g>
      ))}
      <line x1={0} y1={236} x2={22} y2={236} stroke="var(--line-strong)" strokeDasharray="5 4" strokeWidth={1.5} />
      <text x={28} y={240} fontSize={12} fill="var(--muted)">conditional edge: a function reads the state</text>
      <rect x={6} y={254} width={10} height={10} transform="rotate(45 11 259)" fill="var(--accent)" />
      <text x={28} y={263} fontSize={12} fill="var(--muted)">checkpoint saved after the node runs</text>
    </svg>
  );
}

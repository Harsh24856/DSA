// A small knowledge graph: who supplies which team, and who failed the audit, each fact from a different document. The answer to a two-hop question is computed by joining the two edge sets.
import { useId } from "react";

type Edge = [string, string, string, string];   // from, relation, to, source document
const EDGES: Edge[] = [
  ["Supplier A", "supplies", "Payments team", "contract 1"],
  ["Supplier B", "supplies", "Payments team", "contract 2"],
  ["Supplier C", "supplies", "Search team", "contract 3"],
  ["Supplier A", "failed", "2025 audit", "audit report"],
  ["Supplier C", "failed", "2025 audit", "audit report"],
];
const TEAM = "Payments team", AUDIT = "2025 audit";
const suppliers = EDGES.filter((e) => e[1] === "supplies" && e[2] === TEAM).map((e) => e[0]);
const failed = new Set(EDGES.filter((e) => e[1] === "failed" && e[2] === AUDIT).map((e) => e[0]));
const ANSWER = suppliers.filter((s) => failed.has(s));

const W = 340;
const POS: Record<string, [number, number]> = {
  "Supplier A": [170, 120], "Supplier B": [60, 120], "Supplier C": [280, 120],
  "Payments team": [100, 40], "Search team": [280, 40], "2025 audit": [200, 200],
};
const hot = (e: Edge) => ANSWER.includes(e[0]) && (e[2] === TEAM || e[2] === AUDIT);

export function GraphHops() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} 290`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`A knowledge graph. Contracts say ${suppliers.join(" and ")} supply the ${TEAM}; the audit report says ${[...failed].join(" and ")} failed the ${AUDIT}. The question which supplier of the ${TEAM} failed the ${AUDIT} needs both facts, joined through the supplier: ${ANSWER.join(", ")}.`}</title>
      {EDGES.map((e) => {
        const [x1, y1] = POS[e[0]], [x2, y2] = POS[e[2]], h = hot(e);
        return (
          <g key={e.join()}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={h ? "var(--accent)" : "var(--line-strong)"} strokeWidth={h ? 3 : 1.5} />
            <text x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2 + 4} fontSize={12} fill={h ? "var(--ink)" : "var(--muted)"}>{e[1]}</text>
          </g>
        );
      })}
      {Object.entries(POS).map(([name, [x, y]]) => {
        const ans = ANSWER.includes(name), w = name.length * 7 + 14;
        return (
          <g key={name}>
            <rect x={Math.min(Math.max(x - w / 2, 0), W - w)} y={y - 13} width={w} height={26} rx={13} fill={ans ? "var(--accent)" : "var(--surface)"} stroke={ans ? "var(--accent)" : "var(--line-strong)"} />
            <text x={Math.min(Math.max(x, w / 2), W - w / 2)} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={ans ? 600 : 400} fill={ans ? "var(--accent-ink)" : "var(--ink)"}>{name}</text>
          </g>
        );
      })}
      <text x={0} y={242} fontSize={12} fill="var(--ink)">{`Q: which ${TEAM.split(" ")[0]} supplier failed the ${AUDIT}?`}</text>
      <text x={0} y={262} fontSize={12} fill="var(--muted)">One fact is in a contract, the other in the audit</text>
      <text x={0} y={280} fontSize={12} fill="var(--muted)">{`report. Joined at the supplier: ${ANSWER.join(", ")}.`}</text>
    </svg>
  );
}

// HNSW on 16 points: three layers, each a subset of the one below, linked to their nearest neighbours. A greedy search hops toward the query on each layer, then drops down. The links and the path are computed here.
import { useId } from "react";

type P = [number, number];
const PTS: P[] = [[20, 30], [60, 60], [100, 20], [140, 50], [180, 25], [220, 62], [260, 30], [300, 55],
  [40, 70], [80, 35], [120, 68], [160, 40], [200, 45], [240, 15], [280, 68], [315, 25]];
const LAYERS = [[3, 12], [0, 3, 6, 9, 12, 15], PTS.map((_, i) => i)];   // top first
const LINKS = [1, 2, 3];                                                   // neighbours per node, top first
const Q: P = [292, 40];
const d2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

function links(ids: number[], k: number) {
  const set = new Set<string>();
  for (const i of ids) for (const j of ids.filter((x) => x !== i).sort((a, b) => d2(PTS[i], PTS[a]) - d2(PTS[i], PTS[b])).slice(0, k)) set.add(i < j ? `${i}-${j}` : `${j}-${i}`);
  return [...set].map((s) => s.split("-").map(Number) as [number, number]);
}
const EDGES = LAYERS.map((ids, l) => links(ids, LINKS[l]));
// greedy search: on each layer move to the neighbour closest to Q until none is closer, then drop down
const PATHS: number[][] = [];
{
  let cur = LAYERS[0][0];
  EDGES.forEach((edges) => {
    const path = [cur];
    for (;;) {
      const next = edges.flatMap(([a, b]) => (a === cur ? [b] : b === cur ? [a] : [])).sort((a, b) => d2(PTS[a], Q) - d2(PTS[b], Q))[0];
      if (next === undefined || d2(PTS[next], Q) >= d2(PTS[cur], Q)) break;
      cur = next; path.push(cur);
    }
    PATHS.push(path);
  });
}
const BEST = PTS.map((_, i) => i).sort((a, b) => d2(PTS[a], Q) - d2(PTS[b], Q))[0];
const W = 340, PANEL = 104, OX = 10, OY = 26;
const hops = PATHS.reduce((s, p) => s + p.length - 1, 0);

export function HnswLayers() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} ${LAYERS.length * PANEL + 30}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`An HNSW index of ${PTS.length} points in three layers: ${LAYERS.map((l) => l.length).join(", ")} nodes from top to bottom. The search starts at the top, hops greedily toward the query, and drops a layer each time no neighbour is closer: ${hops} hops in all, ending at the true nearest point.`}</title>
      {LAYERS.map((ids, l) => {
        const y0 = l * PANEL, path = PATHS[l];
        return (
          <g key={l} transform={`translate(0 ${y0})`}>
            <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">{`Layer ${LAYERS.length - 1 - l}: ${ids.length} nodes, ${LINKS[l]} link${LINKS[l] > 1 ? "s" : ""} each`}</text>
            <rect x={0} y={20} width={W} height={PANEL - 24} rx={8} fill="var(--surface-2)" stroke="var(--line)" />
            {EDGES[l].map(([a, b]) => <line key={`${a}-${b}`} x1={PTS[a][0] + OX} y1={PTS[a][1] + OY} x2={PTS[b][0] + OX} y2={PTS[b][1] + OY} stroke="var(--line-strong)" />)}
            {path.slice(1).map((p, i) => <line key={p} x1={PTS[path[i]][0] + OX} y1={PTS[path[i]][1] + OY} x2={PTS[p][0] + OX} y2={PTS[p][1] + OY} stroke="var(--accent)" strokeWidth={2.5} />)}
            {ids.map((i) => <circle key={i} cx={PTS[i][0] + OX} cy={PTS[i][1] + OY} r={path.includes(i) ? 5 : 3.5} fill={path.includes(i) ? "var(--accent)" : "var(--muted)"} />)}
            <path d={`M ${Q[0] + OX - 5} ${Q[1] + OY - 5} L ${Q[0] + OX + 5} ${Q[1] + OY + 5} M ${Q[0] + OX + 5} ${Q[1] + OY - 5} L ${Q[0] + OX - 5} ${Q[1] + OY + 5}`} stroke="var(--ink)" strokeWidth={2} />
          </g>
        );
      })}
      <text x={0} y={LAYERS.length * PANEL + 14} fontSize={12} fill="var(--muted)">{`× query. ${hops} hops; ends at the nearest point${PATHS[2].at(-1) === BEST ? "" : " (missed)"}.`}</text>
    </svg>
  );
}

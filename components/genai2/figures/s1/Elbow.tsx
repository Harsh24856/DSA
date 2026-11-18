// k-means inertia (sum of squared distances to the nearest centre) against k, best of five starts, on three blobs. The bend is at 3. Computed from ELBOW.
import { useId } from "react";
import { BLOBS, ELBOW, fmt } from "@/lib/genai2/stages/s1.calc";

const W = 340, H = 240, L = 48, R = 14, T = 20, B = 44;
const YMAX = Math.ceil(ELBOW[0].inertia / 100) * 100, KMAX = ELBOW.length;
const sx = (k: number) => +(L + ((W - L - R) * (k - 1)) / (KMAX - 1)).toFixed(1);
const sy = (v: number) => +(T + (H - T - B) * (1 - v / YMAX)).toFixed(1);
const K = 3, at = ELBOW[K - 1];

export function Elbow() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`k-means inertia against the number of clusters k, 1 to ${KMAX}, on ${BLOBS.length} points in three blobs. It falls steeply from ${fmt(ELBOW[0].inertia)} at k = 1 to ${fmt(at.inertia)} at k = ${K}, then only slowly, to ${fmt(ELBOW[KMAX - 1].inertia)} at k = ${KMAX}. The bend, the elbow, is at k = ${K}.`}</title>
      <line x1={L} y1={T} x2={L} y2={H - B} stroke="var(--line-strong)" />
      <line x1={L} y1={H - B} x2={W - R} y2={H - B} stroke="var(--line-strong)" />
      {ELBOW.map((e) => <text key={e.k} x={sx(e.k)} y={H - B + 16} textAnchor="middle" fontSize={11} fill="var(--muted)">{e.k}</text>)}
      {[0, YMAX / 2, YMAX].map((v) => <text key={v} x={L - 6} y={sy(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">{v}</text>)}
      <text x={(L + W - R) / 2} y={H - 8} textAnchor="middle" fontSize={12} fill="var(--muted)">number of clusters k</text>
      <text x={L + 6} y={T + 4} fontSize={12} fill="var(--muted)">inertia</text>
      <rect x={sx(K) - 12} y={T} width={24} height={H - T - B} fill="var(--accent-soft)" />
      <polyline points={ELBOW.map((e) => `${sx(e.k)},${sy(e.inertia)}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
      {ELBOW.map((e) => <circle key={e.k} cx={sx(e.k)} cy={sy(e.inertia)} r={e.k === K ? 5 : 3.5} fill="var(--accent)" />)}
      <text x={sx(K) + 14} y={sy(at.inertia) - 16} fontSize={12} fill="var(--ink)">{`elbow: k = ${K}, ${fmt(Math.round(at.inertia))}`}</text>
      <text x={sx(1) + 10} y={sy(ELBOW[0].inertia) + 4} fontSize={12} fill="var(--ink)">{fmt(Math.round(ELBOW[0].inertia))}</text>
    </svg>
  );
}

// Bi-encoder against cross-encoder: two separate embeddings compared by cosine, against one model reading the question and the chunk together.
import { useId } from "react";

const CAND = 50;          // candidates handed to the reranker
const W = 340;

function Box({ x, y, w, label, hot }: { x: number; y: number; w: number; label: string; hot?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={28} rx={6} fill={hot ? "var(--accent-soft)" : "var(--surface)"} stroke={hot ? "var(--accent)" : "var(--line-strong)"} />
      <text x={x + w / 2} y={y + 18} textAnchor="middle" fontSize={12} fill="var(--ink)">{label}</text>
    </g>
  );
}
const Arrow = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-strong)" strokeWidth={1.5} markerEnd="url(#s7-bc-arrow)" />
);

export function BiCross() {
  const t = useId();
  return (
    <svg viewBox={`0 0 ${W} 330`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Top: a bi-encoder embeds the question and each chunk separately, and compares the two vectors by cosine; chunk vectors are computed once, offline. Bottom: a cross-encoder reads the question and one chunk together and outputs one relevance score, so it runs once per pair: ${CAND} runs to rerank ${CAND} candidates.`}</title>
      <defs>
        <marker id="s7-bc-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" /></marker>
      </defs>
      <text x={0} y={14} fontSize={12} fontWeight={600} fill="var(--ink)">Bi-encoder: first-stage search</text>
      <Box x={0} y={26} w={100} label="question" />
      <Box x={0} y={66} w={100} label="chunk" />
      <Arrow x1={100} y1={40} x2={128} y2={40} />
      <Arrow x1={100} y1={80} x2={128} y2={80} />
      <Box x={130} y={26} w={80} label="encoder" />
      <Box x={130} y={66} w={80} label="encoder" />
      <Arrow x1={210} y1={40} x2={232} y2={54} />
      <Arrow x1={210} y1={80} x2={232} y2={66} />
      <Box x={234} y={46} w={106} label="cosine → score" hot />
      <text x={0} y={118} fontSize={12} fill="var(--muted)">Chunk vectors are made once, offline.</text>
      <text x={0} y={136} fontSize={12} fill="var(--muted)">Per query: 1 embedding, then fast lookups.</text>

      <line x1={0} y1={156} x2={W} y2={156} stroke="var(--line)" />

      <text x={0} y={180} fontSize={12} fontWeight={600} fill="var(--ink)">Cross-encoder: reranking</text>
      <Box x={0} y={192} w={150} label="question + chunk" />
      <Arrow x1={150} y1={206} x2={170} y2={206} />
      <Box x={172} y={192} w={90} label="one model" />
      <Arrow x1={262} y1={206} x2={282} y2={206} />
      <Box x={284} y={192} w={56} label="score" hot />
      <text x={0} y={244} fontSize={12} fill="var(--muted)">Every word of the question can attend to</text>
      <text x={0} y={262} fontSize={12} fill="var(--muted)">every word of the chunk: more accurate.</text>
      <text x={0} y={288} fontSize={12} fill="var(--ink)">{`Nothing can be precomputed: reranking ${CAND}`}</text>
      <text x={0} y={306} fontSize={12} fill="var(--ink)">{`candidates means ${CAND} model runs per query.`}</text>
    </svg>
  );
}

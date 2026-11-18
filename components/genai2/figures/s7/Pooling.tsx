// How a sentence becomes one vector: the encoder gives one vector per token, mean pooling averages them, and normalising
// to length 1 makes a dot product equal to cosine similarity. The numbers are a toy 3-dimensional example computed here.
import { useId } from "react";

const TOKENS = ["reset", "my", "password"];
const VECS = [[0.9, 0.1, 0.5], [0.1, 0.2, 0.1], [0.8, 0.0, 0.9]];
const MEAN = [0, 1, 2].map((d) => VECS.reduce((s, v) => s + v[d], 0) / VECS.length);
const LEN = Math.hypot(...MEAN), UNIT = MEAN.map((x) => x / LEN);
const f2 = (x: number) => x.toFixed(2);
const W = 340, CW = 26, CH = 22;

function Vec({ x, y, v, label, hot }: { x: number; y: number; v: number[]; label: string; hot?: boolean }) {
  return (
    <g>
      <text x={x + (CW * 3) / 2} y={y - 8} textAnchor="middle" fontSize={13} fill="var(--muted)">{label}</text>
      {v.map((n, i) => (
        <g key={i}>
          <rect x={x + i * CW} y={y} width={CW - 2} height={CH} rx={4} fill={`color-mix(in oklab, ${hot ? "var(--accent)" : "var(--easy)"} ${Math.round(12 + Math.abs(n) * 60)}%, var(--bg))`} />
          <text x={x + i * CW + CW / 2 - 1} y={y + CH / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="var(--ink)" style={{ fontVariantNumeric: "tabular-nums" }}>{f2(n)}</text>
        </g>
      ))}
    </g>
  );
}

export function Pooling() {
  const titleId = useId();
  return (
    <svg viewBox={`0 0 ${W} 300`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`The encoder gives one vector per token for "${TOKENS.join(" ")}". Mean pooling averages them into ${MEAN.map(f2).join(", ")}. Dividing by its length, ${f2(LEN)}, gives the unit vector ${UNIT.map(f2).join(", ")}, so a dot product between two such vectors is their cosine similarity.`}</title>
      {TOKENS.map((t, i) => <Vec key={t} x={12 + i * 112} y={28} v={VECS[i]} label={t} />)}
      {TOKENS.map((_, i) => <line key={i} x1={12 + i * 112 + 38} y1={54} x2={W / 2} y2={112} stroke="var(--line-strong)" strokeWidth={1.5} />)}
      <text x={W / 2 + 24} y={100} fontSize={13} fill="var(--muted)">average each column</text>
      <Vec x={W / 2 - 39} y={132} v={MEAN} label="mean pooling" />
      <line x1={W / 2} y1={158} x2={W / 2} y2={204} stroke="var(--line-strong)" strokeWidth={1.5} />
      <text x={W / 2 + 10} y={186} fontSize={13} fill="var(--muted)">{`divide by length ${f2(LEN)}`}</text>
      <Vec x={W / 2 - 39} y={226} v={UNIT} label="unit vector: the embedding" hot />
      <text x={W / 2} y={286} textAnchor="middle" fontSize={13} fill="var(--muted)">now dot product = cosine</text>
    </svg>
  );
}

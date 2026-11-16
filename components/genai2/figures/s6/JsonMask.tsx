// Constrained decoding at an enum field: tokens the schema forbids are masked out, and the allowed ones share all the probability.
import { useId } from "react";

const CANDS: [string, number, boolean][] = [["food", 0.35, false], ["software", 0.3, true], ["N/A", 0.2, false], ["hardware", 0.1, true], ["travel", 0.05, true]];
const kept = CANDS.filter((c) => c[2]).reduce((s, c) => s + c[1], 0);
const W = 340, LX = 74, BW = 112, GAP = 16, TOP = 116, ROW = 30;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function JsonMask() {
  const t = useId();
  const AX = LX + BW + GAP;
  return (
    <svg viewBox={`0 0 ${W} ${TOP + CANDS.length * ROW + 34}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`The schema allows category to be software, hardware, travel or other. The output so far ends with "category": and an open quote. The model would pick food at 35% or N/A at 20%, but those are not in the enum, so they are masked to 0. The allowed tokens are renormalised: software rises to ${pct(0.3 / kept)}.`}</title>
      <text x={0} y={14} fontSize={12} fill="var(--muted)">schema</text>
      <text x={0} y={32} fontSize={12} fill="var(--ink)" className="num">{`category: "software" | "hardware"`}</text>
      <text x={70} y={48} fontSize={12} fill="var(--ink)" className="num">{`| "travel" | "other"`}</text>
      <text x={0} y={70} fontSize={12} fill="var(--muted)">output so far</text>
      <text x={0} y={88} fontSize={12} fill="var(--accent)" className="num">{`{"vendor": "Acme", "category": "`}</text>
      <text x={LX} y={TOP - 8} fontSize={12} fontWeight={600} fill="var(--muted)">model wants</text>
      <text x={AX} y={TOP - 8} fontSize={12} fontWeight={600} fill="var(--muted)">after the mask</text>
      {CANDS.map(([tok, p, ok], i) => {
        const y = TOP + i * ROW, after = ok ? p / kept : 0;
        return (
          <g key={tok}>
            <text x={LX - 8} y={y + 15} textAnchor="end" fontSize={12} fill={ok ? "var(--ink)" : "var(--hard)"} textDecoration={ok ? undefined : "line-through"}>{tok}</text>
            <rect x={LX} y={y + 4} width={BW} height={16} rx={3} fill="var(--surface-2)" />
            <rect x={LX} y={y + 4} width={BW * p} height={16} rx={3} fill={ok ? "var(--line-strong)" : "var(--hard)"} opacity={ok ? 1 : 0.5} />
            <text x={LX + BW * p + 4} y={y + 16} fontSize={12} fill="var(--ink)" className="num">{pct(p)}</text>
            <rect x={AX} y={y + 4} width={BW} height={16} rx={3} fill="var(--surface-2)" />
            {ok && <rect x={AX} y={y + 4} width={BW * after} height={16} rx={3} fill="var(--accent)" />}
            <text x={AX + BW * after + 4} y={y + 16} fontSize={12} fill={ok ? "var(--ink)" : "var(--hard)"} className="num">{ok ? pct(after) : "0, blocked"}</text>
          </g>
        );
      })}
      <text x={0} y={TOP + CANDS.length * ROW + 20} fontSize={12} fill="var(--muted)">{`Allowed tokens held ${pct(kept)}; renormalised, they share 100%.`}</text>
    </svg>
  );
}

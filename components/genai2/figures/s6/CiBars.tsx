// The same two scores, 78% and 82%, with 95% intervals on 200 items and on 2,000. Small sets cannot tell them apart. Intervals computed.
import { useId } from "react";
import { CI_EX, diffCI, se } from "@/lib/genai2/stages/s6.calc";

const { p1, p2, ns } = CI_EX;
const W = 340, L = 64, R = 12, LO = 0.7, HI = 0.9, x = (p: number) => L + ((p - LO) / (HI - LO)) * (W - L - R);

export function CiBars() {
  const t = useId(), block = 76;
  const desc = ns.map((n) => { const [a, b] = diffCI(p1, p2, n); return `${n} items: the gain of ${Math.round((p2 - p1) * 100)} points has a 95% interval from ${(a * 100).toFixed(1)} to ${(b * 100).toFixed(1)} points`; }).join(". ");
  return (
    <svg viewBox={`0 0 ${W} ${ns.length * block + 40}`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={t}>
      <title id={t}>{`Old version ${Math.round(p1 * 100)}%, new version ${Math.round(p2 * 100)}%. ${desc}.`}</title>
      {[0.7, 0.75, 0.8, 0.85, 0.9].map((p) => <g key={p}><line x1={x(p)} y1={8} x2={x(p)} y2={ns.length * block + 4} stroke="var(--line)" /><text x={x(p)} y={ns.length * block + 20} fontSize={11} textAnchor="middle" fill="var(--muted)">{`${Math.round(p * 100)}%`}</text></g>)}
      {ns.map((n, i) => {
        const [a, b] = diffCI(p1, p2, n), overlap = a <= 0;
        return (
          <g key={n}>
            <text x={0} y={i * block + 20} fontSize={12} fontWeight={600} fill="var(--ink)">{`${n.toLocaleString("en-US")} items`}</text>
            {([[p1, "old", "var(--muted)"], [p2, "new", "var(--accent)"]] as const).map(([p, lab, c], j) => {
              const y = i * block + 32 + j * 18, h = 1.96 * se(p, n);
              return (
                <g key={lab}>
                  <text x={0} y={y + 4} fontSize={11} fill="var(--muted)">{lab}</text>
                  <line x1={x(p - h)} y1={y} x2={x(p + h)} y2={y} stroke={c} strokeWidth={3} strokeLinecap="round" />
                  <circle cx={x(p)} cy={y} r={4} fill={c} />
                </g>
              );
            })}
            <text x={0} y={i * block + 72} fontSize={11} fill={overlap ? "var(--hard)" : "var(--easy)"}>{`gain ${(a * 100).toFixed(1)} to ${(b * 100).toFixed(1)} points: ${overlap ? "could be zero" : "real"}`}</text>
          </g>
        );
      })}
    </svg>
  );
}

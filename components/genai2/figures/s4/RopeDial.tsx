// One pair of numbers in q and k, drawn as arrows. RoPE turns each arrow by (position x theta); the angle between them depends only on the gap.
import { useId } from "react";

const THETA = 0.35, Q0 = 0.2, K0 = 1.3, R = 58;
const PAIRS: [number, number][] = [[3, 1], [10, 8]];
const deg = (a: number) => Math.round((a * 180) / Math.PI);
const W = 340, CY = 100;

export function RopeDial() {
  const titleId = useId();
  const gaps = PAIRS.map(([m, n]) => deg(Math.abs(Q0 + m * THETA - (K0 + n * THETA))));
  return (
    <svg viewBox={`0 0 ${W} 230`} className="mx-auto w-full max-w-[520px]" role="img" aria-labelledby={titleId}>
      <title id={titleId}>{`Two dials. Left: q at position ${PAIRS[0][0]}, k at position ${PAIRS[0][1]}. Right: q at ${PAIRS[1][0]}, k at ${PAIRS[1][1]}. Both arrows have turned further on the right, but the angle between q and k is ${gaps[0]} degrees on the left and ${gaps[1]} on the right, so their dot product is the same.`}</title>
      {PAIRS.map(([m, n], i) => {
        const cx = W / 4 + (i * W) / 2, qa = Q0 + m * THETA, ka = K0 + n * THETA;
        // rounded, so server and browser Math.cos agree to the last digit (no hydration mismatch)
        const pt = (a: number, r = R) => [+(cx + r * Math.cos(a)).toFixed(2), +(CY - r * Math.sin(a)).toFixed(2)] as const;
        const [qx, qy] = pt(qa), [kx, ky] = pt(ka), [lqx, lqy] = pt(qa, R + 14), [lkx, lky] = pt(ka, R + 14);
        const lo = Math.min(qa, ka), hi = Math.max(qa, ka), [ax, ay] = pt(lo, 26), [bx, by] = pt(hi, 26);
        return (
          <g key={m}>
            <circle cx={cx} cy={CY} r={R} fill="none" stroke="var(--line)" strokeDasharray="3 4" />
            <path d={`M ${ax} ${ay} A 26 26 0 0 0 ${bx} ${by}`} fill="none" stroke="var(--accent)" strokeWidth={2} />
            <line x1={cx} y1={CY} x2={kx} y2={ky} stroke="var(--muted)" strokeWidth={2.5} />
            <line x1={cx} y1={CY} x2={qx} y2={qy} stroke="var(--accent)" strokeWidth={2.5} />
            <circle cx={kx} cy={ky} r={4} fill="var(--muted)" /><circle cx={qx} cy={qy} r={4} fill="var(--accent)" />
            <text x={lkx} y={lky + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">k</text>
            <text x={lqx} y={lqy + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--ink)">q</text>
            <text x={cx} y={CY + R + 34} textAnchor="middle" fontSize={13} fill="var(--ink)">q at {m}, k at {n}</text>
            <text x={cx} y={CY + R + 54} textAnchor="middle" fontSize={13} fill="var(--accent)">angle between: {gaps[i]} degrees</text>
          </g>
        );
      })}
      <text x={W / 2} y={222} textAnchor="middle" fontSize={13} fill="var(--muted)">each position turns an arrow by {THETA} radians</text>
    </svg>
  );
}

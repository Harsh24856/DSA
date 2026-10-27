"use client";
// Places a pattern's best / average / worst cases on the ladder of growth rates, with real curves.
import type { Complexity } from "@/lib/patterns/types";

const CLASSES = [
  { k: "O(1)", s: "1", f: () => 1 },
  { k: "O(log n)", s: "log", f: (n: number) => Math.log2(n) + 1 },
  { k: "O(n)", s: "n", f: (n: number) => n },
  { k: "O(n log n)", s: "n log", f: (n: number) => n * Math.log2(n) },
  { k: "O(n²)", s: "n²", f: (n: number) => n * n },
  { k: "O(n³)", s: "n³", f: (n: number) => n ** 3 },
  { k: "O(2ⁿ)", s: "2ⁿ", f: (n: number) => 2 ** n },
  { k: "O(n!)", s: "n!", f: (n: number) => { let x = 1; for (let i = 2; i <= n; i++) x *= i; return x; } },
] as const;

/** Rough growth class of a big-O string in terms of input size (index into CLASSES). */
export function growth(s: string): number {
  if (/!/.test(s)) return 7;
  if (/ⁿ|\^/.test(s)) return 6;                                   // 2ⁿ, 3^L, 26^d
  if (/³/.test(s)) return 5;
  if (/²|m · n|V · E|n · C|n · k|states/.test(s)) return 4;  // two sizes multiplied
  if (/^O\((log|h\)|digits|set bits|word size)/.test(s)) return 1; // logarithmic in the value or tree
  if (/log/.test(s)) return 3;                                       // n log n, E log V, N log k
  if (/^O\((1|α|26|alphabet)/.test(s)) return 0;
  return 2;                                                          // n, n + m, V + E, R · C, L, k
}

const CASES = [["best", "Best", "var(--easy)"], ["average", "Average", "var(--accent)"], ["worst", "Worst", "var(--hard)"]] as const;
type Key = (typeof CASES)[number][0];

/** "Best", "Best and average", "All cases"… for cases that share a class */
const joinCases = (ks: Key[]) => (ks.length === 3 ? "All cases" : ks.map((k, i) => { const l = CASES.find((c) => c[0] === k)![1]; return i ? l.toLowerCase() : l; }).join(" and "));

export function ComplexityChart({ c, children }: { c: Complexity; children?: React.ReactNode }) {
  const g: Record<Key, number> = { best: growth(c.best), average: growth(c.average), worst: growth(c.worst) };
  const groups = [...new Set(CASES.map(([k]) => g[k]))].map((cls) => { const ks = CASES.filter(([k]) => g[k] === cls).map(([k]) => k); return { cls, ks, color: ks.length === 3 ? "var(--accent)" : CASES.find(([k]) => k === ks[ks.length - 1])![2] }; });
  // linear axes, so O(n) is a straight line and O(n²) bends; faster-than-quadratic curves are clipped at the top
  const W = 300, H = 160, N = 10, YMAX = N * N, X = (n: number) => 30 + ((n - 1) / (N - 1)) * (W - 44), Y = (v: number) => H - 22 - (Math.min(v, YMAX) / YMAX) * (H - 40);
  const path = (i: number) => Array.from({ length: 40 }, (_, k) => 1 + (k * (N - 1)) / 39).map((n, k) => `${k ? "L" : "M"}${X(n).toFixed(1)},${Y(CLASSES[i].f(n)).toFixed(1)}`).join(" ");
  const shown = new Set(groups.map((x) => x.cls));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="relative pt-8" role="img" aria-label={`Best ${c.best}, average ${c.average}, worst ${c.worst}`}>
          <div className="grid grid-cols-8 overflow-hidden rounded-control border border-line">
            {CLASSES.map((cl, i) => (
              <div key={cl.k} className={`num whitespace-nowrap border-l border-line px-0.5 py-2 text-center text-[11px] first:border-l-0 sm:text-[12px] ${shown.has(i) ? "font-semibold text-ink" : "text-muted"}`}
                style={{ background: `color-mix(in oklab, var(--hard) ${i * 2}%, var(--surface))` }}><span className="sm:hidden">{cl.s}</span><span className="hidden sm:inline">{cl.k}</span></div>
            ))}
          </div>
          {groups.map(({ cls, ks, color }) => (
            <div key={cls} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(cls + 0.5) * 12.5}%` }}>
              <span className="whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-surface" style={{ background: color }}>{joinCases(ks)}</span>
              <span className="h-2 w-0.5" style={{ background: color }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-muted">Growth classes from fastest (left) to slowest (right).</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-tile bg-surface-2/60" role="img" aria-label="How the work grows with input size">
          <line x1={30} x2={W - 10} y1={H - 22} y2={H - 22} stroke="var(--line-strong)" />
          <line x1={30} x2={30} y1={14} y2={H - 22} stroke="var(--line-strong)" />
          <text x={W - 10} y={H - 7} fontSize={10} textAnchor="end" fill="var(--muted)">input size n</text>
          <text x={8} y={12} fontSize={10} fill="var(--muted)">work</text>
          {[2, 4].filter((i) => !shown.has(i)).map((i) => <g key={i}><path d={path(i)} fill="none" stroke="var(--line-strong)" strokeDasharray="3 4" /><text x={X(N) - 2} y={Y(CLASSES[i].f(N)) - 4} fontSize={9} textAnchor="end" fill="var(--muted)" fontFamily="var(--mono)">{CLASSES[i].k}</text></g>)}
          {groups.map(({ cls, ks, color }) => (
            <g key={cls}>
              <path d={path(cls)} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <text x={cls >= 4 ? X(4.5) : X(N) - 2} y={Math.max(24, Y(CLASSES[cls].f(cls >= 4 ? 4.5 : N)) - 6)} fontSize={10} fontWeight={600} textAnchor={cls >= 4 ? "start" : "end"} fill={color}>{joinCases(ks)}</text>
            </g>
          ))}
        </svg>
        {children}
      </div>
    </div>
  );
}

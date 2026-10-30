"use client";
// Labs for Modules 10 to 12: is an eval gain real, self-consistency voting, paged KV memory, speculative decoding.
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lab, Slider, spring, tint } from "./kit";

const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

/* ---------- is the gain real? ---------- */
export function SignificanceLab() {
  const [n, setN] = useState(200), [base, setBase] = useState(78), [neu, setNeu] = useState(82);
  const p1 = base / 100, p2 = neu / 100, d = p2 - p1;
  const se = Math.sqrt((p1 * (1 - p1)) / n + (p2 * (1 - p2)) / n);
  const lo = d - 1.96 * se, hi = d + 1.96 * se;
  const need = d === 0 ? Infinity : Math.ceil((1.96 ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / d ** 2);
  const range = 0.2, x = (v: number) => `${((Math.max(-range, Math.min(range, v)) + range) / (2 * range)) * 100}%`;
  const verdict = lo > 0 ? "Real improvement: the whole interval is above zero." : hi < 0 ? "Real regression: the whole interval is below zero." : "Not proven: the interval includes zero, so this could be noise.";
  return (
    <Lab title="Is the gain real or noise?" hint="Two versions scored on the same number of eval items. The bar is the 95% confidence interval for the difference; it shrinks as the item count grows.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="eval items" value={n} min={50} max={3000} step={50} onChange={setN} />
        <Slider label="old accuracy" value={base} min={50} max={98} onChange={setBase} show={`${base}%`} />
        <Slider label="new accuracy" value={neu} min={50} max={99} onChange={setNeu} show={`${neu}%`} />
      </div>
      <div className="relative h-14 rounded-tile bg-surface" role="img" aria-label={`Difference ${pct(d)} with 95% interval from ${pct(lo)} to ${pct(hi)}`}>
        <div className="absolute inset-y-2 w-0.5 bg-ink" style={{ left: "50%" }} aria-hidden />
        <span className="absolute bottom-0.5 -translate-x-1/2 text-[11px] text-muted" style={{ left: "50%" }}>0</span>
        <motion.div className="absolute top-4 h-4 rounded-full" style={{ background: lo > 0 ? "var(--easy)" : hi < 0 ? "var(--hard)" : "var(--medium)" }}
          initial={false} animate={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} transition={spring} />
        <motion.div className="absolute top-3 h-6 w-1 -translate-x-1/2 rounded bg-ink" initial={false} animate={{ left: x(d) }} transition={spring} aria-hidden />
        <span className="absolute bottom-0.5 left-1 text-[11px] text-muted">-20 pts</span><span className="absolute bottom-0.5 right-1 text-[11px] text-muted">+20 pts</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="tile"><div className="text-[12px] text-muted">difference</div><div className="num text-[15px] font-semibold">{d >= 0 ? "+" : ""}{pct(d)}</div></div>
        <div className="tile"><div className="text-[12px] text-muted">95% interval</div><div className="num text-[15px] font-semibold">{pct(lo)} to {pct(hi)}</div></div>
        <div className="tile"><div className="text-[12px] text-muted">items needed</div><div className="num text-[15px] font-semibold">{Number.isFinite(need) ? need.toLocaleString() : "∞"}</div></div>
      </div>
      <p className={`rounded-tile px-3 py-2 text-[13px] ${lo > 0 ? "bg-accent-soft" : "bg-surface-2"}`} role="status">{verdict} A paired comparison on the same items usually needs far fewer items than this unpaired estimate.</p>
    </Lab>
  );
}

/* ---------- self-consistency ---------- */
const comb = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const majority = (p: number, n: number) => { let s = 0; for (let k = Math.floor(n / 2) + 1; k <= n; k++) s += comb(n, k) * p ** k * (1 - p) ** (n - k); return s; };
const NS = Array.from({ length: 16 }, (_, i) => 2 * i + 1);
const WRONG = ["12", "21", "17", "40", "9"];

export function SelfConsistencyLab() {
  const [p, setP] = useState(0.6), [n, setN] = useState(9);
  const [votes, setVotes] = useState<string[]>([]);
  const W = 300, H = 140, px = (k: number) => 10 + ((k - 1) / 30) * (W - 20), py = (v: number) => H - 12 - v * (H - 24);
  const path = NS.map((k, i) => `${i ? "L" : "M"}${px(k).toFixed(1)},${py(majority(p, k)).toFixed(1)}`).join(" ");
  const run = () => setVotes(Array.from({ length: n }, () => (Math.random() < p ? "24" : WRONG[Math.floor(Math.random() * WRONG.length)])));
  const tally = votes.reduce<Record<string, number>>((t, v) => ({ ...t, [v]: (t[v] ?? 0) + 1 }), {});
  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  return (
    <Lab title="Does voting help?" hint="Each sample is right with probability p. The curve is the chance that more than half of n samples are right. Then draw a real vote: wrong answers scatter, the right answer (24) repeats.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="single-sample accuracy p" value={p} min={0.1} max={0.95} step={0.05} onChange={(v) => { setP(v); setVotes([]); }} show={pct(p, 0)} />
        <Slider label="samples n" value={n} min={1} max={31} step={2} onChange={(v) => { setN(v); setVotes([]); }} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[520px] rounded-tile bg-surface" role="img" aria-label={`Majority accuracy rises from ${pct(p, 0)} at n = 1 to ${pct(majority(p, 31), 0)} at n = 31`}>
        <line x1={10} x2={W - 10} y1={py(p)} y2={py(p)} stroke="var(--line-strong)" strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
        <motion.circle r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} initial={false} animate={{ cx: px(n), cy: py(majority(p, n)) }} transition={spring} />
        <text x={W - 12} y={py(p) + (p > 0.5 ? 12 : -4)} textAnchor="end" fontSize={10} fill="var(--muted)">one sample</text>
      </svg>
      <p className="num text-[13px]" role="status">n = {n}: majority right {pct(majority(p, n))} vs one sample {pct(p, 0)}{p < 0.5 ? ". Below 50%, a strict majority vote makes it worse." : "."}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={run}>Draw {n} samples</button>
        {winner && <span className="text-[13px]" role="status">plurality answer: <b className="num">{winner[0]}</b> ({winner[1]} of {n} votes) {winner[0] === "24" ? "correct" : "wrong"}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Votes">
        <AnimatePresence>
          {votes.map((v, i) => (
            <motion.span key={`${i}-${v}-${votes.length}`} className="num grid h-7 min-w-9 place-items-center rounded-[8px] px-1.5 text-[12px] font-semibold"
              style={{ background: v === "24" ? tint(30, "var(--easy)") : tint(25, "var(--hard)") }}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ ...spring, delay: i * 0.04 }}>{v}</motion.span>
          ))}
        </AnimatePresence>
      </div>
    </Lab>
  );
}

/* ---------- paged KV cache ---------- */
const BLOCKS = [1, 8, 16, 32, 64, 128];
const lengthsFor = (count: number) => { let s = 11; return Array.from({ length: count }, () => { s = (s * 16807) % 2147483647; return 40 + (s % 2000); }); };

export function KvPagingLab() {
  const [count, setCount] = useState(8), [bi, setBi] = useState(2), [max, setMax] = useState(4096);
  const block = BLOCKS[bi];
  const lens = useMemo(() => lengthsFor(count), [count]);
  const used = lens.reduce((a, b) => a + b, 0);
  const contiguous = count * max, paged = lens.reduce((a, l) => a + Math.ceil(l / block) * block, 0);
  const bar = (label: string, reserved: number) => (
    <div className="grid gap-1 text-[13px]">
      <div className="flex justify-between gap-2"><span className="font-medium">{label}</span><span className="num text-muted">{reserved.toLocaleString()} slots reserved, {pct(1 - used / reserved)} wasted</span></div>
      <div className="relative h-5 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: tint(30, "var(--medium)") }} initial={false} animate={{ width: `${(reserved / contiguous) * 100}%` }} transition={spring} />
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-accent" initial={false} animate={{ width: `${(used / contiguous) * 100}%` }} transition={spring} />
      </div>
    </div>
  );
  return (
    <Lab title="Paged KV cache: reserved vs used" hint="Blue is KV memory that holds real tokens; orange is reserved but empty. Contiguous allocation reserves the maximum length for every request; paging rounds each request up to whole blocks.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="requests" value={count} min={2} max={16} onChange={setCount} />
        <Slider label="block size (tokens)" value={bi} min={0} max={BLOCKS.length - 1} onChange={setBi} show={String(block)} />
        <Slider label="max length reserved" value={max} min={2048} max={8192} step={1024} onChange={setMax} show={max.toLocaleString()} />
      </div>
      {bar("Contiguous, max length each", contiguous)}
      {bar(`Paged, ${block}-token blocks`, paged)}
      <div className="grid gap-1" aria-label="Blocks for the first three requests">
        {lens.slice(0, 3).map((l, r) => {
          const nb = Math.ceil(l / block), shown = Math.min(nb, 48);
          return (
            <div key={r} className="flex flex-wrap items-center gap-[3px] text-[11px]">
              <span className="num w-20 text-muted">req {r + 1}: {l}</span>
              {Array.from({ length: shown }, (_, b) => {
                const fill = Math.min(1, (l - b * block) / block);
                return <span key={b} className="size-3 rounded-[2px] border border-line" style={{ background: tint(fill * 100) }} title={`${Math.round(fill * 100)}% full`} />;
              })}
              {nb > shown && <span className="text-muted">+{nb - shown}</span>}
            </div>
          );
        })}
      </div>
      <p className="text-[13px]" role="status">Same memory fits about <b className="num">{(contiguous / paged).toFixed(1)}×</b> as many requests with paging. Tiny blocks waste least but mean bigger block tables and more scattered reads; 16 is a common choice.</p>
    </Lab>
  );
}

/* ---------- speculative decoding ---------- */
const speedup = (a: number, k: number, c: number) => ((1 - a ** (k + 1)) / (1 - a)) / (k * c + 1);

export function SpeculativeLab() {
  const [a, setA] = useState(0.8), [k, setK] = useState(4), [c, setC] = useState(0.05);
  const [runs, setRuns] = useState<("ok" | "no" | "own")[][]>([]);
  const s = speedup(a, k, c), best = Array.from({ length: 12 }, (_, i) => i + 1).reduce((b, kk) => (speedup(a, kk, c) > speedup(a, b, c) ? kk : b), 1);
  const draft = () => {
    const out: ("ok" | "no" | "own")[] = [];
    for (let i = 0; i < k; i++) { if (Math.random() < a) out.push("ok"); else { out.push("no"); break; } }
    out.push("own");                                  // the target always adds one token of its own
    setRuns((r) => [out, ...r].slice(0, 5));
  };
  const max = Math.max(...Array.from({ length: 12 }, (_, i) => speedup(a, i + 1, c)), 1);
  return (
    <Lab title="Speculative decoding: when does it pay?" hint="A cheap draft model proposes k tokens; the big model checks them all in one step, keeps the accepted prefix and adds one token of its own. Speedup = expected tokens per step / cost per step.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="acceptance rate α" value={a} min={0.3} max={0.95} step={0.05} onChange={setA} show={a.toFixed(2)} />
        <Slider label="draft length k" value={k} min={1} max={12} onChange={(v) => { setK(v); setRuns([]); }} />
        <Slider label="draft cost c" value={c} min={0.01} max={0.5} step={0.01} onChange={setC} show={c.toFixed(2)} />
      </div>
      <div className="flex h-28 items-end gap-1.5 rounded-tile bg-surface p-2" role="img" aria-label={`Speedup by draft length; best k is ${best} at ${speedup(a, best, c).toFixed(2)} times`}>
        {Array.from({ length: 12 }, (_, i) => {
          const kk = i + 1, v = speedup(a, kk, c);
          return (
            <div key={kk} className="flex flex-1 flex-col items-center gap-1">
              <motion.div className="w-full rounded-t-[4px]" style={{ background: kk === k ? "var(--accent)" : tint(35, "var(--muted)") }} initial={false} animate={{ height: `${(v / max) * 72}px` }} transition={spring} />
              <span className={`num text-[10px] ${kk === k ? "font-bold text-ink" : "text-muted"}`}>{kk}</span>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="tile"><div className="text-[12px] text-muted">tokens per step</div><div className="num text-[15px] font-semibold">{((1 - a ** (k + 1)) / (1 - a)).toFixed(2)}</div></div>
        <div className="tile"><div className="text-[12px] text-muted">speedup</div><div className="num text-[15px] font-semibold">{s.toFixed(2)}×</div></div>
        <div className="tile"><div className="text-[12px] text-muted">best k here</div><div className="num text-[15px] font-semibold">{best}</div></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={draft}>Draft and verify</button>
        <span className="text-[12px] text-muted">green accepted · red rejected (everything after it is thrown away) · blue the big model&apos;s own token</span>
      </div>
      <ol className="grid gap-1.5" aria-label="Recent verification steps">
        <AnimatePresence initial={false}>
          {runs.map((r, i) => (
            <motion.li key={`${runs.length - i}`} className="flex flex-wrap items-center gap-1" layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {r.map((t, j) => (
                <motion.span key={j} className="num grid h-6 min-w-8 place-items-center rounded-[6px] px-1 text-[11px] font-semibold"
                  style={{ background: t === "ok" ? tint(30, "var(--easy)") : t === "no" ? tint(25, "var(--hard)") : tint(30) }}
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: j * 0.06 }}>
                  {t === "ok" ? "ok" : t === "no" ? "x" : "+1"}
                </motion.span>
              ))}
              <span className="num ml-1 text-[12px] text-muted">{r.filter((t) => t !== "no").length} tokens this step</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Lab>
  );
}

"use client";
// System design: a consistent-hashing ring and three rate limiters on the same traffic.
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { hashRing, modOwner, rateLimit, type RateAlgo } from "@/lib/other/sim";
import { Seg } from "../ui";
import { Lab, spring, tint } from "../labs/kit";

/* ---------- consistent hashing ---------- */
const KEYS = Array.from({ length: 16 }, (_, i) => `user${i + 1}`);
const SERVERS = ["A", "B", "C", "D", "E"];
const COLOR: Record<string, string> = { A: "var(--accent)", B: "var(--easy)", C: "var(--medium)", D: "var(--hard)", E: "var(--ink)" };
// rounded so the server render and the browser agree to the last digit (no hydration mismatch)
const at = (pos: number, r: number) => { const a = pos * 2 * Math.PI - Math.PI / 2, rd = (v: number) => Math.round(v * 100) / 100; return { x: rd(130 + r * Math.cos(a)), y: rd(130 + r * Math.sin(a)) }; };

export function HashRingLab() {
  const [n, setN] = useState("4");
  const [vn, setVn] = useState("1");
  const servers = SERVERS.slice(0, +n), v = +vn;
  const ring = hashRing(servers, KEYS, v), before = hashRing(SERVERS.slice(0, 4), KEYS, v).owner;
  const modNow = modOwner(servers, KEYS), modBefore = modOwner(SERVERS.slice(0, 4), KEYS);
  const moved = KEYS.filter((k) => ring.owner[k] !== before[k]);
  const modMoved = KEYS.filter((k) => modNow[k] !== modBefore[k]).length;
  const load = Object.fromEntries(servers.map((s) => [s, KEYS.filter((k) => ring.owner[k] === s).length]));
  return (
    <Lab title="Add a server to the ring" hint="Servers and keys are hashed onto the same circle; each key belongs to the first server point clockwise from it. Add server E and only the keys between E and the server before it move. With hash mod N almost every key moves.">
      <div className="flex flex-wrap gap-2">
        <Seg<string> label="Servers" value={n} onChange={setN} options={[["4", "A to D"], ["5", "add E"]]} />
        <Seg<string> label="Points per server" value={vn} onChange={setVn} options={[["1", "1"], ["3", "3 virtual"]]} />
      </div>
      <div className="grid items-center gap-3 sm:grid-cols-[260px_1fr]">
        <svg viewBox="0 0 260 260" className="mx-auto w-full max-w-[260px]" role="img"
          aria-label={`Hash ring with ${servers.length} servers and ${KEYS.length} keys. ${n === "5" ? `${moved.length} of ${KEYS.length} keys moved to E.` : "Add E to see which keys move."}`}>
          <circle cx="130" cy="130" r="100" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
          {KEYS.map((k) => {
            const p = at(ring.keyPos[k], 100), mv = moved.includes(k);
            return <motion.circle key={k} r={mv ? 6 : 4.5} cx={p.x} cy={p.y} initial={false} animate={{ fill: COLOR[ring.owner[k]] }} transition={spring}
              stroke={mv ? "var(--ink)" : "none"} strokeWidth="1.5" opacity={0.85} />;
          })}
          {ring.points.map((pt, i) => {
            const p = at(pt.pos, 100), lbl = at(pt.pos, 118);
            return (
              <g key={`${pt.server}-${i}`}>
                <rect x={p.x - 7} y={p.y - 7} width="14" height="14" rx="3" fill={COLOR[pt.server]} stroke="var(--surface)" strokeWidth="2" />
                <text x={lbl.x} y={lbl.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{pt.server}</text>
              </g>
            );
          })}
        </svg>
        <div className="grid gap-2 text-[13px]">
          <div className="grid grid-cols-2 gap-2">
            <div className="inset p-2.5"><div className="t-eyebrow text-[12px]">ring: keys moved</div><div className="num text-[20px] font-semibold">{moved.length} / {KEYS.length}</div></div>
            <div className="inset p-2.5"><div className="t-eyebrow text-[12px]">hash mod N: moved</div><div className="num text-[20px] font-semibold">{n === "5" ? modMoved : 0} / {KEYS.length}</div></div>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Keys per server">
            {servers.map((s) => <span key={s} className="pill num" style={{ background: tint(22, COLOR[s]) }}>{s}: {load[s]} keys</span>)}
          </div>
          <ul className="flex flex-wrap gap-1" aria-label="Which server owns each key">
            {KEYS.map((k) => (
              <li key={k} className="num rounded-[6px] px-1.5 py-0.5 text-[12px]" style={{ background: tint(moved.includes(k) ? 40 : 14, COLOR[ring.owner[k]]) }}>
                {k} → {ring.owner[k]}{moved.includes(k) ? " (moved)" : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="callout text-[13px]" role="status">
        {n === "5"
          ? `E took ${moved.length} keys, all from its clockwise neighbour; the other ${KEYS.length - moved.length} stayed put. Mod N would have moved ${modMoved}.`
          : v === 1 ? "With one point per server the arcs are uneven, so some servers own far more keys. Try 3 virtual points." : "Virtual points cut the ring into more, smaller arcs, so load evens out. Now add E."}
      </p>
    </Lab>
  );
}

/* ---------- rate limiting ---------- */
const LIMIT = 3, WINDOW = 1, SPAN = 4;
const PATTERNS: Record<string, { name: string; times: number[] }> = {
  burst: { name: "burst", times: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 1.5, 2.0, 2.5, 3.0, 3.5] },
  boundary: { name: "window edge", times: [0.85, 0.9, 0.95, 1.05, 1.1, 1.15, 2.5, 3.2] },
  steady: { name: "steady", times: [0.2, 0.6, 1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.4, 3.8] },
};
const ALGOS: [RateAlgo, string][] = [["token", "token bucket"], ["fixed", "fixed window"], ["sliding", "sliding window"]];

export function RateLimitLab() {
  const [algo, setAlgo] = useState<RateAlgo>("token");
  const [pat, setPat] = useState("boundary");
  const reduce = useReducedMotion();
  const steps = rateLimit(algo, PATTERNS[pat].times, LIMIT, WINDOW);
  const ok = steps.filter((s) => s.ok).length;
  const row = (t: number, i: number) => steps.slice(0, i).filter((s) => Math.abs(s.t - t) < 0.06).length;   // stack close requests
  return (
    <Lab title="Three rate limiters, same traffic" hint={`Limit: ${LIMIT} requests per ${WINDOW} second. Watch the window edge pattern: a fixed window resets at each whole second, so it lets 6 requests through in about 0.3 seconds.`}>
      <div className="flex flex-wrap gap-2">
        <Seg<RateAlgo> label="Algorithm" value={algo} onChange={setAlgo} options={ALGOS} />
        <Seg<string> label="Traffic" value={pat} onChange={setPat} options={Object.entries(PATTERNS).map(([k, p]) => [k, p.name] as const)} />
      </div>
      <div className="inset relative h-[132px] overflow-hidden p-0" role="img" aria-label={`${ok} of ${steps.length} requests allowed, ${steps.length - ok} rejected with 429.`}>
        {Array.from({ length: SPAN + 1 }, (_, s) => (
          <div key={s} className="absolute bottom-0 top-0 border-l border-dashed border-line" style={{ left: `${4 + (s / SPAN) * 92}%` }}>
            <span className="num absolute bottom-1 left-1 text-[11px] text-muted">{s}s</span>
          </div>
        ))}
        {steps.map((s, i) => (
          <motion.div key={`${pat}-${i}`} className="num absolute grid size-6 place-items-center rounded-full text-[12px] font-bold"
            style={{ left: `calc(${4 + (s.t / SPAN) * 92}% - 12px)`, top: 12 + row(s.t, i) * 26, background: tint(s.ok ? 55 : 40, s.ok ? "var(--easy)" : "var(--hard)"), color: "var(--ink)" }}
            initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: reduce ? 0 : i * 0.04 }}
            title={`${s.t.toFixed(2)}s ${s.ok ? "allowed" : "429"}`}>
            {s.ok ? "✓" : "✕"}
          </motion.div>
        ))}
      </div>
      <ol className="flex flex-wrap gap-1" aria-label="Each request">
        {steps.map((s, i) => (
          <li key={i} className="num rounded-[6px] px-1.5 py-0.5 text-[12px]" style={{ background: tint(18, s.ok ? "var(--easy)" : "var(--hard)") }}>
            {s.t.toFixed(2)}s {s.ok ? "ok" : "429"} · {algo === "token" ? `${s.level} tokens left` : `${s.level} in window`}
          </li>
        ))}
      </ol>
      <p className="callout text-[13px]" role="status">
        {ok} of {steps.length} allowed, {steps.length - ok} rejected. {algo === "fixed" && pat === "boundary"
          ? "Both windows were empty when their burst arrived, so all 6 got through in 0.3 s: double the intended rate."
          : algo === "token" ? "The bucket starts full, so a burst of 3 passes at once; after that it refills one token every third of a second."
          : algo === "sliding" ? "The sliding window always counts the last full second, so no edge trick gets past it."
          : "A fixed window is cheap: one counter per client per second."}
      </p>
    </Lab>
  );
}

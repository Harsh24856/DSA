"use client";
// Labs for chapters that had none: disk scheduling, NULL logic, quorums, estimates, availability, React re-renders,
// clocks and calendars. Every number comes from lib/other/sim.ts, checked in lib/other/sim-core.check.ts.
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  clockAngle, diskSchedule, downtimeMinutes, estimate, human, inParallel, inSeries, quorum, rerenders, triAnd, triEq, triNot, triOr, weekday,
  type DiskAlgo, type RNode, type Tri,
} from "@/lib/other/sim";
import { Seg } from "../ui";
import { Lab, Slider, spring, tint } from "../labs/kit";

const Tile = ({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) => (
  <div className="inset p-3"><div className="t-eyebrow text-xs">{label}</div><div className={`num text-xl font-semibold ${tone === "ok" ? "text-easy" : tone === "bad" ? "text-hard" : ""}`}>{value}</div></div>
);

/* ---------- disk scheduling ---------- */
const DISK = [98, 183, 37, 122, 14, 124, 65, 67], HEAD = 53, SIZE = 200;
const DISK_ALGOS: [DiskAlgo, string][] = [["fcfs", "FCFS"], ["sstf", "SSTF"], ["scan", "SCAN"], ["cscan", "C-SCAN"], ["look", "LOOK"], ["clook", "C-LOOK"]];
const DISK_NOTE: Record<DiskAlgo, string> = {
  fcfs: "First come, first served: fair, but the head swings back and forth across the disk.",
  sstf: "Always the closest request next. Short moves, but requests at the edges can starve while new ones keep arriving near the head.",
  scan: "The elevator: sweep to the edge of the disk, then reverse. No starvation, and the middle cylinders are visited most often.",
  cscan: "Sweep one way only, then jump back to the start. Waiting times are more even than SCAN; the return jump is counted as movement here.",
  look: "SCAN that turns at the last request instead of the disk's edge. What real elevators do.",
  clook: "C-SCAN that jumps from the last request straight to the lowest one. Usually the best of the sweeping kinds.",
};

export function DiskLab() {
  const [algo, setAlgo] = useState<DiskAlgo>("sstf");
  const [dir, setDir] = useState<"up" | "down">("up");
  const reduce = useReducedMotion();
  const run = diskSchedule(DISK, HEAD, algo, SIZE, dir === "up");
  const all = DISK_ALGOS.map(([k, l]) => [k, l, diskSchedule(DISK, HEAD, k, SIZE, dir === "up").moved] as const);
  const best = Math.min(...all.map((a) => a[2]));
  const W = 300, H = 170, x = (c: number) => 12 + (c / (SIZE - 1)) * (W - 24), y = (i: number) => 14 + (i / (run.path.length - 1)) * (H - 28);
  const d = run.path.map((c, i) => `${i ? "L" : "M"}${x(c).toFixed(1)} ${y(i).toFixed(1)}`).join(" ");
  return (
    <Lab title="Disk scheduling: where the head goes" hint={`Head at cylinder ${HEAD}, cylinders 0 to ${SIZE - 1}, requests ${DISK.join(", ")}. Pick an algorithm and watch the path; time runs down the chart.`}>
      <div className="flex flex-wrap gap-2">
        <Seg<DiskAlgo> label="Algorithm" value={algo} onChange={setAlgo} className="flex flex-wrap" options={DISK_ALGOS} />
        <Seg<"up" | "down"> label="Head moving" value={dir} onChange={setDir} options={[["up", "toward 199"], ["down", "toward 0"]]} />
      </div>
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_200px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${algo.toUpperCase()} visits ${run.path.join(", ")}: ${run.moved} cylinders of movement.`}>
          <line x1={x(0)} x2={x(SIZE - 1)} y1="6" y2="6" stroke="var(--line-strong)" />
          {[0, 50, 100, 150, 199].map((c) => <text key={c} x={x(c)} y="4" fontSize="8" textAnchor="middle" fill="var(--muted)">{c}</text>)}
          {DISK.map((c) => <line key={c} x1={x(c)} x2={x(c)} y1="10" y2={H - 4} stroke="var(--line)" strokeDasharray="2 3" />)}
          <motion.path key={`${algo}-${dir}`} d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
          {run.path.map((c, i) => <circle key={`${algo}-${i}`} cx={x(c)} cy={y(i)} r={i ? 3.5 : 5} fill={i ? "var(--ink)" : "var(--accent)"} />)}
        </svg>
        <div className="grid gap-2 text-sm">
          <Tile label="head movement" value={`${run.moved}`} tone={run.moved === best ? "ok" : undefined} />
          <ul className="grid gap-1" aria-label="Total movement by algorithm">
            {all.map(([k, l, m]) => (
              <li key={k} className="num flex justify-between rounded-control px-2 py-1" style={{ background: k === algo ? tint(24) : undefined }}><span>{l}</span><span>{m}{m === best ? " best" : ""}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <p className="num text-xs text-muted">Order: {run.path.join(" → ")}</p>
      <p className="callout text-sm" role="status">{DISK_NOTE[algo]}</p>
    </Lab>
  );
}

/* ---------- NULL and three-valued logic ---------- */
const ROWS: [string, number | null][] = [["Asha", 200], ["Ben", 50], ["Chen", null], ["Dia", 120]];
const gt = (v: number | null, k: number): Tri => (v === null ? "NULL" : v > k ? "TRUE" : "FALSE");
const isNull = (v: number | null): Tri => (v === null ? "TRUE" : "FALSE");
const CONDS: [string, string, (v: number | null) => Tri][] = [
  ["gt", "bonus > 100", (v) => gt(v, 100)],
  ["not", "NOT (bonus > 100)", (v) => triNot(gt(v, 100))],
  ["eq", "bonus = NULL", (v) => triEq(v, null)],
  ["is", "bonus IS NULL", isNull],
  ["or", "bonus > 100 OR bonus IS NULL", (v) => triOr(gt(v, 100), isNull(v))],
  ["and", "bonus > 100 AND bonus IS NULL", (v) => triAnd(gt(v, 100), isNull(v))],
];
const TRI_TONE: Record<Tri, string> = { TRUE: "var(--easy)", FALSE: "var(--hard)", NULL: "var(--medium)" };

export function NullLab() {
  const [c, setC] = useState("not");
  const [, label, f] = CONDS.find((x) => x[0] === c)!;
  const res = ROWS.map(([, v]) => f(v)), kept = ROWS.filter((_, i) => res[i] === "TRUE");
  return (
    <Lab title="Which rows does WHERE keep?" hint="Chen's bonus is NULL: unknown. Any comparison with it is UNKNOWN, and WHERE keeps a row only when the condition is TRUE. Pick a condition.">
      <ul className="flex flex-wrap gap-2" aria-label="Condition">
        {CONDS.map(([k, l]) => <li key={k}><button type="button" className="chip num" aria-pressed={c === k} onClick={() => setC(k)}>{l}</button></li>)}
      </ul>
      <pre className="code text-xs">{`SELECT name FROM staff\nWHERE ${label};`}</pre>
      <div className="gx-table-wrap">
        <table style={{ minWidth: 0 }}>
          <thead><tr><th>name</th><th>bonus</th><th>condition is</th><th>kept</th></tr></thead>
          <tbody>
            {ROWS.map(([n, v], i) => (
              <tr key={n}>
                <td>{n}</td><td className="num">{v ?? "NULL"}</td>
                <td><motion.span key={`${c}-${i}`} className="num rounded-control px-2 py-0.5 text-xs font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1, background: tint(26, TRI_TONE[res[i]]) }} transition={{ duration: 0.3, delay: i * 0.06 }}>{res[i] === "NULL" ? "UNKNOWN" : res[i]}</motion.span></td>
                <td>{res[i] === "TRUE" ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="callout text-sm" role="status">
        {kept.length} of {ROWS.length} rows: {kept.map((r) => r[0]).join(", ") || "none"}.{" "}
        {c === "not" ? "NOT UNKNOWN is still UNKNOWN, so Chen is dropped by both bonus > 100 and its opposite." : c === "eq" ? "= NULL is UNKNOWN for every row, even Chen's, so nothing comes back and there is no error. Use IS NULL." : c === "or" ? "TRUE OR UNKNOWN is TRUE, so adding IS NULL brings Chen back." : c === "and" ? "FALSE AND anything is FALSE: no bonus is both above 100 and unknown." : c === "is" ? "IS NULL is never UNKNOWN: it is the one test that sees NULL." : "Chen's comparison is UNKNOWN, so the row is dropped."}
      </p>
    </Lab>
  );
}

/* ---------- quorums ---------- */
export function QuorumLab() {
  const [n, setN] = useState(3), [w, setW] = useState(2), [r, setR] = useState(2);
  const W = Math.min(w, n), R = Math.min(r, n), q = quorum(n, R, W);
  const written = (i: number) => i < W, read = (i: number) => i >= n - R;
  return (
    <Lab title="Quorum reads and writes" hint="A write goes to all N replicas but returns after W acknowledge. A read asks R replicas and takes the newest version. If R + W > N, every read set overlaps the latest write.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Replicas N" value={n} min={1} max={7} onChange={(v) => { setN(v); setW((x) => Math.min(x, v)); setR((x) => Math.min(x, v)); }} />
        <Slider label="Write acks W" value={W} min={1} max={n} onChange={setW} />
        <Slider label="Read from R" value={R} min={1} max={n} onChange={setR} />
      </div>
      <ul className="flex flex-wrap justify-center gap-2" aria-label="Replicas">
        {Array.from({ length: n }, (_, i) => (
          <motion.li key={i} layout transition={spring} className="num grid size-16 place-items-center rounded-full text-xs font-semibold"
            style={{ background: written(i) ? tint(34, "var(--accent)") : "var(--surface-2)", boxShadow: read(i) ? `0 0 0 3px ${written(i) ? "var(--easy)" : "var(--medium)"}` : undefined }}>
            <span className="text-center leading-tight">{written(i) ? "v2" : "v1"}<br />{read(i) ? "read" : ""}</span>
          </motion.li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-2">
        <Tile label="R + W" value={`${R + W} ${q.strong ? ">" : "≤"} ${n}`} tone={q.strong ? "ok" : "bad"} />
        <Tile label="writes survive" value={`${q.writeSurvives} down`} />
        <Tile label="reads survive" value={`${q.readSurvives} down`} />
      </div>
      <p className="callout text-sm" role="status">
        {q.strong ? `Every read touches at least ${q.overlap} replica${q.overlap > 1 ? "s" : ""} with v2, so it always sees the latest write.` : `A read can land only on replicas that still hold v1: a stale read. Raise R or W until R + W > N.`}{" "}
        {W === n ? "W = N: one dead replica blocks every write." : R === n ? "R = N: one dead replica blocks every read." : n === 3 && W === 2 && R === 2 ? "N = 3, W = 2, R = 2 is the usual default (Cassandra QUORUM)." : ""}
      </p>
    </Lab>
  );
}

/* ---------- back-of-the-envelope ---------- */
const DAU: [string, string][] = [["1e6", "1 M"], ["1e7", "10 M"], ["1e8", "100 M"], ["1e9", "1 B"]];
const SIZE_OPTS: [string, string][] = [["100", "100 B text"], ["1000", "1 KB post"], ["200000", "200 KB photo"], ["5000000", "5 MB video"]];

export function EstimateLab() {
  const [dau, setDau] = useState("1e8"), [writes, setWrites] = useState(2), [reads, setReads] = useState(50), [bytes, setBytes] = useState("1000"), [peak, setPeak] = useState(3);
  const e = estimate(+dau, writes, reads, +bytes, peak);
  return (
    <Lab title="Back-of-the-envelope calculator" hint="Say these numbers out loud in the interview: a day is about 10^5 seconds, peak is a few times average, and storage is writes times size times 365.">
      <div className="flex flex-wrap gap-2">
        <Seg<string> label="Daily active users" value={dau} onChange={setDau} options={DAU} />
        <Seg<string> label="Size of one write" value={bytes} onChange={setBytes} className="flex flex-wrap" options={SIZE_OPTS} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Writes per user per day" value={writes} min={1} max={20} onChange={setWrites} />
        <Slider label="Reads per user per day" value={reads} min={1} max={200} onChange={setReads} />
        <Slider label="Peak / average" value={peak} min={1} max={10} onChange={setPeak} show={`${peak}x`} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="writes / s" value={human(e.writeQps)} />
        <Tile label="reads / s" value={human(e.readQps)} />
        <Tile label="peak / s" value={human(e.peakQps)} />
        <Tile label="storage / year" value={human(e.storagePerYear, "B")} />
      </div>
      <p className="callout text-sm" role="status">
        {human(+dau)} users × {writes} writes ÷ 86,400 s ≈ {human(e.writeQps)} writes a second. Reads are {Math.round(reads / writes)}x writes, so {reads / writes >= 10 ? "this is read heavy: cache and add read replicas." : "writes matter: think about sharding early."}{" "}
        At about 1,000 requests a second per server, peak needs roughly {e.servers.toLocaleString("en-US")} server{e.servers > 1 ? "s" : ""}.
      </p>
    </Lab>
  );
}

/* ---------- availability ---------- */
const NINES: [string, string][] = [["0.99", "99%"], ["0.999", "99.9%"], ["0.9999", "99.99%"]];
const fmtA = (a: number) => `${(a * 100).toFixed(a > 0.9999 ? 5 : a > 0.999 ? 4 : 3).replace(/0+$/, "").replace(/\.$/, "")}%`;
const fmtDown = (m: number) => (m >= 1440 ? `${(m / 1440).toFixed(1)} days` : m >= 60 ? `${(m / 60).toFixed(1)} hours` : `${Math.round(m)} min`);

export function AvailabilityLab() {
  const [each, setEach] = useState("0.999"), [lbs, setLbs] = useState(1), [apps, setApps] = useState(1), [dbs, setDbs] = useState(1);
  const a = +each, parts: [string, number, number][] = [["load balancer", inParallel(a, lbs), lbs], ["app servers", inParallel(a, apps), apps], ["database", inParallel(a, dbs), dbs]];
  const total = inSeries(parts.map((p) => p[1])), weakest = parts.reduce((w, p) => (p[1] < w[1] ? p : w));
  return (
    <Lab title="Nines: series and redundancy" hint="Parts in a chain all have to work, so their availabilities multiply and the chain is worse than its weakest link. Copies in parallel fail only if every copy fails.">
      <Seg<string> label="Availability of each machine" value={each} onChange={setEach} options={NINES} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Slider label="Load balancer copies" value={lbs} min={1} max={3} onChange={setLbs} />
        <Slider label="App server copies" value={apps} min={1} max={4} onChange={setApps} />
        <Slider label="Database copies (with failover)" value={dbs} min={1} max={3} onChange={setDbs} />
      </div>
      <ol className="grid gap-2 sm:grid-cols-3" aria-label="Request path">
        {parts.map(([name, av, k]) => (
          <motion.li key={name} layout className="inset grid gap-1 p-3 text-sm" animate={{ background: k > 1 ? tint(18, "var(--easy)") : tint(0) }}>
            <span className="t-eyebrow text-xs">{name}{k > 1 ? ` × ${k}` : ""}</span>
            <span className="num font-semibold">{fmtA(av)}</span>
            <span className="text-xs text-muted">down {fmtDown(downtimeMinutes(av))} a year</span>
          </motion.li>
        ))}
      </ol>
      <div className="grid grid-cols-2 gap-2">
        <Tile label="whole system" value={fmtA(total)} tone={total >= a ? "ok" : "bad"} />
        <Tile label="downtime a year" value={fmtDown(downtimeMinutes(total))} />
      </div>
      <p className="callout text-sm" role="status">
        {total < a ? `The chain is worse than any one machine: ${fmtA(total)}. The ${weakest[0]} ${weakest[2] > 1 ? "are" : "is"} the weakest link; add a copy there.` : `Every step has a spare, so the whole system beats a single machine. Each extra copy multiplies the chance that a step is fully down by ${(1 - a).toFixed(4).replace(/0+$/, "")}.`}
      </p>
    </Lab>
  );
}

/* ---------- React re-renders ---------- */
type Cause = "app" | "list" | "context";
export function RerenderLab() {
  const [memo, setMemo] = useState(false), [cause, setCause] = useState<Cause>("app"), [tick, setTick] = useState(0);
  const tree: RNode[] = [{ id: "App" }, { id: "Header", parent: "App" }, { id: "List", parent: "App", memo }, { id: "Item", parent: "List", reads: true }, { id: "Footer", parent: "App" }];
  const out = rerenders(tree, cause === "app" ? "App" : cause === "list" ? "List" : null, cause === "context");
  const fire = (c: Cause) => { setCause(c); setTick((t) => t + 1); };
  const depth = (id: string): number => { const p = tree.find((n) => n.id === id)?.parent; return p ? 1 + depth(p) : 0; };
  return (
    <Lab title="Who re-renders?" hint="A component renders again when its own state changes, when its parent renders, or when a context it reads changes. memo skips a child whose props did not change, but never blocks context.">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => fire("app")}>setState in App</button>
        <button type="button" className="btn btn-sm" onClick={() => fire("list")}>setState in List</button>
        <button type="button" className="btn btn-sm" onClick={() => fire("context")}>Change the theme context</button>
        <Seg<"off" | "on"> label="Wrap List in memo" value={memo ? "on" : "off"} onChange={(v) => setMemo(v === "on")} options={[["off", "List plain"], ["on", "memo(List)"]]} />
      </div>
      <ul className="grid gap-2" aria-label="Component tree">
        {tree.map((n) => {
          const hit = out.includes(n.id);
          return (
            <li key={n.id} style={{ paddingLeft: depth(n.id) * 24 }}>
              <motion.div key={`${n.id}-${tick}-${hit}`} className="flex items-center gap-2 rounded-control border border-line px-3 py-2 text-sm"
                initial={{ background: hit ? tint(50) : tint(0) }} animate={{ background: hit ? tint(22) : tint(0) }} transition={{ duration: 0.9 }}>
                <span className="num font-semibold">&lt;{n.memo ? `memo(${n.id})` : n.id} /&gt;</span>
                {n.reads && <span className="pill pill-muted text-xs">reads theme</span>}
                <span className={`ml-auto text-xs ${hit ? "font-semibold text-ink" : "text-muted"}`}>{hit ? "rendered" : "skipped"}</span>
              </motion.div>
            </li>
          );
        })}
      </ul>
      <p className="callout text-sm" role="status">
        {out.length} of {tree.length} rendered.{" "}
        {cause === "app" ? (memo ? "memo stopped the render at List, so Item was skipped too." : "Every child of App renders, even ones whose props did not change. Wrap List in memo to skip it.")
          : cause === "list" ? "State lives in List, so only List and below render. Moving state down is the cheapest optimisation there is."
          : "Only Item reads the context, so only Item renders, memo or not. Split contexts so a change wakes only the components that need it."}
      </p>
    </Lab>
  );
}

/* ---------- clocks and calendars ---------- */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function ClockLab() {
  const [h, setH] = useState(3), [m, setM] = useState(15), [date, setDate] = useState("2027-05-01");
  const ang = clockAngle(h, m), raw = Math.abs(30 * (h % 12) - 5.5 * m);
  const [y, mo, d] = date.split("-").map(Number), wd = y > 0 && mo && d ? weekday(y, mo, d) : null;
  const hand = (deg: number, len: number) => { const a = (deg - 90) * (Math.PI / 180); return { x2: +(60 + len * Math.cos(a)).toFixed(2), y2: +(60 + len * Math.sin(a)).toFixed(2) }; };
  return (
    <Lab title="Clock angles and weekdays" hint="The minute hand moves 6 degrees a minute and the hour hand 0.5, so the gap at h:m is |30h - 5.5m|. Weekdays come from counting odd days: days left over after whole weeks.">
      <div className="grid items-center gap-3 sm:grid-cols-[140px_1fr]">
        <svg viewBox="0 0 120 120" className="mx-auto w-full max-w-[140px]" role="img" aria-label={`Clock at ${h}:${String(m).padStart(2, "0")}, hands ${ang} degrees apart.`}>
          <circle cx="60" cy="60" r="54" fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="2" />
          {Array.from({ length: 12 }, (_, i) => { const p = hand(i * 30, 46); return <circle key={i} cx={p.x2} cy={p.y2} r="2" fill="var(--muted)" />; })}
          <motion.line x1="60" y1="60" animate={hand((h % 12) * 30 + m * 0.5, 30)} transition={spring} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <motion.line x1="60" y1="60" animate={hand(m * 6, 44)} transition={spring} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="60" cy="60" r="3" fill="var(--ink)" />
        </svg>
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Slider label="Hour" value={h} min={1} max={12} onChange={setH} />
            <Slider label="Minute" value={m} min={0} max={59} onChange={setM} />
          </div>
          <p className="num m-0 text-sm">|30 × {h % 12} − 5.5 × {m}| = {raw}{raw > 180 ? `, over 180, so 360 − ${raw}` : ""} = <b>{ang}°</b></p>
        </div>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Any date</span>
        <input type="date" className="field num w-fit" value={date} min="1600-01-01" max="2400-12-31" onChange={(e) => setDate(e.target.value)} />
      </label>
      <AnimatePresence mode="wait">
        {wd && (
          <motion.p key={date} className="callout text-sm" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            The {y - 1} whole years before {y} leave {wd.oddYears} odd day{wd.oddYears === 1 ? "" : "s"} (each year adds 1, each leap year 2, counting from 1 January of year 1, a Monday). Adding the days into {y} lands on <b>{DAYS[wd.day]}</b>.
          </motion.p>
        )}
      </AnimatePresence>
    </Lab>
  );
}

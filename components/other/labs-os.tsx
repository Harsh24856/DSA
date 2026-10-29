"use client";
// OS labs: page replacement, CPU scheduling and the Banker's algorithm. All numbers come from lib/other/sim.ts.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bankerSafety, pageReplace, schedule, type PageAlgo, type Proc, type SchedAlgo } from "@/lib/other/sim";
import { Seg } from "../ui";
import { Lab, Slider, spring, tint, useTicker } from "../labs/kit";

/* ---------- page replacement ---------- */
const DEFAULT_REFS = "7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1";
const BELADY = "1 2 3 4 1 2 5 1 2 3 4 5";
const ALGOS: [PageAlgo, string][] = [["fifo", "FIFO"], ["lru", "LRU"], ["opt", "Optimal"]];

export function PagingLab() {
  const [text, setText] = useState(DEFAULT_REFS);
  const [frames, setFrames] = useState(3);
  const refs = useMemo(() => text.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 100).slice(0, 24), [text]);
  const [t, setT] = useState(refs.length);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setT(refs.length); setPlaying(false); }, [refs.length, frames]);
  useTicker(playing, 450, () => setT((v) => { if (v >= refs.length) { setPlaying(false); return v; } return v + 1; }));
  const runs = ALGOS.map(([a, name]) => ({ a, name, ...pageReplace(refs, frames, a) }));
  return (
    <Lab title="Page replacement, three ways at once" hint="Each column is one memory reference. A shaded column is a page fault: the page was not in a frame, so one was loaded (and another evicted if all frames were full). Try the Belady string with 3 frames, then 4.">
      <label className="grid gap-1 text-[13px]"><span className="text-muted">Reference string (up to 24 pages)</span>
        <input className="field num" value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Slider label="frames" value={frames} min={1} max={6} onChange={setFrames} />
        <Slider label="step" value={t} min={0} max={refs.length} onChange={(v) => { setPlaying(false); setT(v); }} show={`${t} / ${refs.length}`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { if (t >= refs.length) setT(0); setPlaying((p) => !p); }}>{playing ? "Pause" : "Play"}</button>
        <button type="button" className="btn btn-sm" onClick={() => setText(DEFAULT_REFS)}>Classic string</button>
        <button type="button" className="btn btn-sm" onClick={() => setText(BELADY)}>Belady string</button>
      </div>
      {runs.map((run) => {
        const shown = run.steps.slice(0, t), faults = shown.filter((s) => !s.hit).length;
        return (
          <div key={run.a} className="grid gap-1.5">
            <div className="flex items-baseline justify-between text-[13px]"><span className="font-semibold">{run.name}</span><span className="num" role="status">{faults} faults so far · {run.faults} total</span></div>
            <div className="overflow-x-auto">
              <table className="gx-heat" aria-label={`${run.name} frames after each reference`}>
                <thead><tr><th scope="row">ref</th>{refs.map((p, i) => <th key={i} scope="col" className={i === t - 1 ? "text-accent" : ""}>{p}</th>)}</tr></thead>
                <tbody>
                  {Array.from({ length: frames }, (_, f) => (
                    <tr key={f}><th scope="row">F{f + 1}</th>{run.steps.map((s, i) => {
                      const on = i < t, fault = !s.hit;
                      return <td key={i} className="num" style={{ background: on && fault ? tint(28, "var(--hard)") : on ? tint(10) : "transparent", opacity: on ? 1 : 0.15, outline: i === t - 1 ? "2px solid var(--accent)" : undefined, outlineOffset: -2 }}>{on ? s.frames[f] ?? "" : ""}</td>;
                    })}</tr>
                  ))}
                  <tr><th scope="row" />{run.steps.map((s, i) => <td key={i} className="text-[11px] font-bold" style={{ color: s.hit ? "var(--easy)" : "var(--hard)" }}>{i < t ? (s.hit ? "hit" : "F") : ""}</td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className="text-[13px] text-muted">Optimal needs to know the future, so no real OS can run it; it is the yardstick. LRU is close to it in practice. FIFO is simple but can fault more when given more frames (Belady&apos;s anomaly).</p>
    </Lab>
  );
}

/* ---------- CPU scheduling ---------- */
const START: Proc[] = [{ id: "P1", arrival: 0, burst: 5, priority: 2 }, { id: "P2", arrival: 1, burst: 3, priority: 1 }, { id: "P3", arrival: 2, burst: 8, priority: 4 }, { id: "P4", arrival: 3, burst: 6, priority: 3 }];
const SCHED: [SchedAlgo, string][] = [["fcfs", "FCFS"], ["sjf", "SJF"], ["srtf", "SRTF"], ["rr", "Round robin"], ["priority", "Priority"]];
const PCOL = ["var(--accent)", "var(--easy)", "var(--medium)", "var(--hard)"];

export function SchedulingLab() {
  const [procs, setProcs] = useState(START);
  const [algo, setAlgo] = useState<SchedAlgo>("fcfs");
  const [q, setQ] = useState(2);
  const res = schedule(procs, algo, q);
  const end = res.gantt[res.gantt.length - 1].end;
  const set = (i: number, k: "arrival" | "burst" | "priority", v: number) => setProcs((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: Math.max(k === "burst" ? 1 : 0, Math.min(20, v || 0)) } : p)));
  return (
    <Lab title="CPU scheduling: draw the Gantt chart" hint="Change the algorithm or the numbers and watch the chart redraw. Waiting time = turnaround − burst; turnaround = completion − arrival. Lower priority number = more important.">
      <Seg<SchedAlgo> label="Algorithm" value={algo} onChange={setAlgo} className="flex flex-wrap" options={SCHED} />
      {algo === "rr" && <Slider label="time quantum" value={q} min={1} max={6} onChange={setQ} />}
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-[13px]" aria-label="Processes">
          <thead><tr><th>Process</th><th>Arrival</th><th>Burst</th><th>Priority</th><th>Waiting</th><th>Turnaround</th></tr></thead>
          <tbody>{procs.map((p, i) => {
            const s = res.stats.find((x) => x.id === p.id)!;
            return (
              <tr key={p.id}>
                <td><span className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: PCOL[i] }} aria-hidden />{p.id}</td>
                {(["arrival", "burst", "priority"] as const).map((k) => <td key={k}><input className="field field-sm num w-12 px-1 text-center" type="number" aria-label={`${p.id} ${k}`} value={p[k]} onChange={(e) => set(i, k, +e.target.value)} /></td>)}
                <td className="num">{s.waiting}</td><td className="num">{s.turnaround}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <div className="grid gap-1" role="img" aria-label={`Gantt chart: ${res.gantt.map((g) => `${g.id ?? "idle"} ${g.start} to ${g.end}`).join(", ")}`}>
        <div className="flex h-10 overflow-hidden rounded-tile border border-line">
          <AnimatePresence initial={false}>
            {res.gantt.map((g, i) => (
              <motion.div key={`${algo}-${q}-${i}-${g.id}-${g.start}`} className="grid place-items-center border-r border-surface text-[12px] font-semibold"
                style={{ width: `${((g.end - g.start) / end) * 100}%`, background: g.id ? tint(35, PCOL[procs.findIndex((p) => p.id === g.id)]) : "var(--surface-2)" }}
                initial={{ opacity: 0, scaleY: 0.3 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ ...spring, delay: i * 0.05 }}>
                {g.id ?? "idle"}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="relative h-4 text-[11px] text-muted">
          {[0, ...res.gantt.map((g) => g.end)].map((x, i) => <span key={i} className="num absolute -translate-x-1/2" style={{ left: `${(x / end) * 100}%` }}>{x}</span>)}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="tile"><div className="text-[12px] text-muted">average waiting</div><div className="num text-[16px] font-semibold">{res.avgWait.toFixed(2)}</div></div>
        <div className="tile"><div className="text-[12px] text-muted">average turnaround</div><div className="num text-[16px] font-semibold">{res.avgTurn.toFixed(2)}</div></div>
      </div>
    </Lab>
  );
}

/* ---------- Banker's algorithm ---------- */
const BANK = { max: [[5, 3, 2], [3, 2, 2], [4, 1, 3], [2, 2, 2], [3, 3, 1]], alloc: [[1, 1, 0], [2, 0, 1], [1, 0, 2], [1, 1, 1], [0, 2, 0]] };

export function BankerLab() {
  const [avail, setAvail] = useState<"safe" | "tight">("safe");
  const av = avail === "safe" ? [2, 1, 1] : [1, 1, 0];
  const res = bankerSafety(av, BANK.max, BANK.alloc.map((r) => [...r]));
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [avail]);
  const step = res.steps[Math.min(i, res.steps.length - 1)];
  const doneSet = new Set(res.steps.slice(1, i + 1).map((s) => s.pick).filter((p) => p !== null));
  const vec = (v: number[]) => `[${v.join(", ")}]`;
  return (
    <Lab title="Banker's algorithm: is this state safe?" hint="Need = Max − Allocation. Find a process whose Need fits in Work, pretend it finishes and returns its resources, repeat. If every process can finish in some order, the state is safe.">
      <Seg<"safe" | "tight"> label="Available" value={avail} onChange={setAvail} options={[["safe", "Available = [2, 1, 1]"], ["tight", "Available = [1, 1, 0]"]]} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 text-[13px]" aria-label="Allocation, Max and Need per process">
          <thead><tr><th>Process</th><th>Allocation</th><th>Max</th><th>Need</th></tr></thead>
          <tbody>{BANK.max.map((_, p) => (
            <tr key={p} style={{ background: step.pick === p ? tint(20) : doneSet.has(p) ? tint(8, "var(--easy)") : undefined }}>
              <td>P{p}{doneSet.has(p) && <span className="ml-1.5 text-[11px] font-semibold text-easy">done</span>}</td>
              <td className="num">{vec(BANK.alloc[p])}</td><td className="num">{vec(BANK.max[p])}</td><td className="num font-semibold">{vec(res.need[p])}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className="tile num">Work = {vec(step.work)}</span>
        <span className="text-muted">Safe sequence:</span>
        <AnimatePresence>{res.order.slice(0, Math.max(0, i)).map((p) => <motion.span key={p} className="pill pill-accent" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>P{p}</motion.span>)}</AnimatePresence>
      </div>
      <p className={`rounded-tile px-3 py-2 text-[13px] ${!res.safe && i >= res.steps.length - 1 ? "bg-hard/10 text-hard" : "bg-surface-2"}`} role="status">{step.note}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setI((v) => Math.min(res.steps.length - 1, v + 1))} disabled={i >= res.steps.length - 1}>Next step</button>
      </div>
    </Lab>
  );
}

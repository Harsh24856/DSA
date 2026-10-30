"use client";
// JavaScript event loop: call stack, microtask queue, macrotask queue and output, one step at a time.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LOOP_SCENARIOS } from "@/lib/other/labdata";
import { Seg } from "../ui";
import { Lab, spring, tint, useTicker } from "../labs/kit";

function Column({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5 rounded-tile border border-line bg-surface p-2.5">
      <div className="t-eyebrow text-[12px]">{title}</div>
      <ol className="grid gap-1" aria-label={title}>
        <AnimatePresence initial={false}>
          {items.length ? items.map((it, i) => (
            <motion.li key={`${it}-${i}`} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={spring}
              className="num truncate rounded-[6px] px-2 py-1 text-[12px]" style={{ background: tint(18, color) }}>{it}</motion.li>
          )) : <li className="text-[12px] text-muted">empty</li>}
        </AnimatePresence>
      </ol>
    </div>
  );
}

export function EventLoopLab() {
  const [s, setS] = useState("0");
  const sc = LOOP_SCENARIOS[+s];
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setI(0); setPlaying(false); }, [s]);
  useTicker(playing, 1100, () => setI((v) => { if (v >= sc.frames.length - 1) { setPlaying(false); return v; } return v + 1; }));
  const f = sc.frames[i];
  return (
    <Lab title="The event loop, step by step" hint="Predict the output order first, then step through. Synchronous code runs to completion; then every microtask (promises, await, queueMicrotask) runs before the next macrotask (timers, I/O).">
      <Seg<string> label="Scenario" value={s} onChange={setS} options={LOOP_SCENARIOS.map((x, k) => [String(k), x.name] as const)} />
      <pre className="code text-[12.5px]">{sc.code.split("\n").map((l, k) => <span key={k} className="block rounded px-1 transition-colors" style={{ background: f.line === k ? tint(25) : undefined }}>{l || " "}</span>)}</pre>
      <div className="grid gap-2 sm:grid-cols-4">
        <Column title="Call stack" items={[...f.stack].reverse()} color="var(--accent)" />
        <Column title="Microtasks" items={f.micro} color="var(--easy)" />
        <Column title="Macrotasks" items={f.macro} color="var(--medium)" />
        <Column title="Output" items={f.out} color="var(--muted)" />
      </div>
      <p className="callout text-[13px]" role="status">{f.note}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { if (i >= sc.frames.length - 1) setI(0); setPlaying((p) => !p); }}>{playing ? "Pause" : "Play"}</button>
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.min(sc.frames.length - 1, v + 1))} disabled={i >= sc.frames.length - 1}>Step</button>
        <span className="num self-center text-[12px] text-muted">step {i + 1} / {sc.frames.length}</span>
      </div>
    </Lab>
  );
}

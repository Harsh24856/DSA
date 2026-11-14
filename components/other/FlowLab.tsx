"use client";
// An interactive walk-through: the learner sets the numbers with sliders and the Remotion walk-through is recomputed
// from them (lib/other/flows-play.ts). A combination with no clean answer keeps the last good walk-through and says why.
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { ArrowCounterClockwise, SlidersHorizontal } from "@phosphor-icons/react";
import { knobDefaults, PLAY_FLOWS, PlayError } from "@/lib/other/flows-play";
import type { Flow } from "@/lib/other/flows";
import FlowPlayer from "./FlowPlayer";

export default function FlowLab({ id }: { id: string }) {
  const pf = PLAY_FLOWS[id];
  const [vals, setVals] = useState<Record<string, number>>(() => (pf ? knobDefaults(pf) : {}));
  const deferred = useDeferredValue(vals);          // dragging a slider stays smooth; the walk-through catches up
  const last = useRef<Flow | null>(null);
  const result = useMemo(() => {
    if (!pf) return { error: "" };
    try { return { flow: pf.make(deferred) }; }
    catch (e) { return { error: e instanceof PlayError ? e.message : "These numbers do not work together. Try others." }; }
  }, [pf, deferred]);
  if (result.flow) last.current = result.flow;
  if (!pf || !last.current) return null;
  const changed = pf.knobs.some((k) => vals[k.key] !== k.value);

  return (
    <section className="gx-diagram grid gap-4" aria-label={`Try your own numbers: ${pf.title}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="title-3 flex items-center gap-2 text-ink"><SlidersHorizontal size={16} className="text-accent" aria-hidden />Try your own numbers</h4>
        <button type="button" className="btn btn-sm" disabled={!changed} onClick={() => setVals(knobDefaults(pf))}><ArrowCounterClockwise size={14} aria-hidden />Reset</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pf.knobs.map((k) => {
          const v = vals[k.key], inputId = `${id}-${k.key}`;
          return (
            <div key={k.key} className="tile grid gap-2 p-3">
              <label htmlFor={inputId} className="flex items-baseline justify-between gap-2 text-sm font-medium">
                <span>{k.label}</span><span className="num text-base font-semibold text-accent">{v}{k.unit ?? ""}</span>
              </label>
              <input id={inputId} type="range" min={k.min} max={k.max} step={k.step ?? 1} value={v}
                aria-valuetext={`${v}${k.unit ?? ""}`}
                onChange={(e) => setVals((o) => ({ ...o, [k.key]: Number(e.target.value) }))}
                className="h-1.5 w-full cursor-pointer accent-[var(--accent)]" />
            </div>
          );
        })}
      </div>
      {result.error && <p role="status" className="callout callout-warn text-sm">{result.error} Showing the last numbers that worked.</p>}
      <FlowPlayer flow={last.current} />
    </section>
  );
}

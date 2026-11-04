"use client";
import { useState } from "react";
import { TickBurst } from "./TickBurst";
import { peeked, SolveButton, solveTarget } from "./SolvePanel";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, ArrowUpRight, Check } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { HOW, level, title, TRACK, url, type How } from "@/lib/logic";
import { P } from "@/lib/problems";
import { Seg } from "./ui";

type Props = { i: number; side?: string; compact?: boolean; revisit?: boolean };

export function ProblemRow({ i, side, compact, revisit }: Props) {
  const { state, toggle, setHow, setNote, revisitResult, say } = useStore();
  const [showTopic, setShowTopic] = useState(false);
  const [burst, setBurst] = useState(0);
  const reduce = useReducedMotion();
  const d = state.done[i];
  const checked = revisit ? false : !!d;
  const name = title(i);

  return (
    <motion.div layout={!reduce} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`group grid items-start gap-3 border-t border-line py-4 first:border-t-0 ${revisit ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto]"}`}>
      {!revisit && <button type="button" role="checkbox" aria-checked={checked} aria-label={(checked ? "Untick " : "Tick ") + name}
        onClick={() => { if (!checked) setBurst((b) => b + 1); toggle(i, !checked, peeked.get(i)); }}
        className="tick mt-0.5">
        {burst > 0 && <TickBurst key={burst} />}
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
              <Check size={14} weight="bold" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </button>}

      <div className="min-w-0">
        <a href={url(i)} target="_blank" rel="noopener"
          className={`inline-flex max-w-full items-center gap-1 font-medium decoration-line-strong underline-offset-4 transition-colors hover:text-accent ${checked ? "text-muted line-through" : ""}`}>
          <span className="truncate">{name}</span><ArrowUpRight size={14} className="shrink-0 opacity-50 transition group-hover:opacity-100" aria-hidden />
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{TRACK[P[i][0]]}</span>
          <span className={`pill lv-${level(i)}`}>{P[i][3]}</span>
          {showTopic ? <span>{P[i][5]}</span> : (
            <button type="button" onClick={() => setShowTopic(true)} className="cursor-pointer rounded-md px-1 text-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-ink">show topic</button>
          )}
          <SolveButton className="ml-auto" t={{ ...solveTarget(i), again: revisit }} />
        </div>
        {revisit && d?.n && <p className="mt-2 text-sm text-muted">Your insight: {d.n}</p>}
        {revisit && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-sm" aria-label={`Solved it without help: ${name}`} onClick={() => { revisitResult(i, true); say("Revisit saved."); }}><Check size={14} weight="bold" aria-hidden />Solved it</button>
            <button type="button" className="btn btn-sm btn-ghost" aria-label={`Needed help: ${name}`} onClick={() => { revisitResult(i, false); say("It comes back in 3 days."); }}><ArrowCounterClockwise size={14} aria-hidden />Needed help</button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {d && !compact && !revisit && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <Seg<How> label="How you solved it" value={d.h || "s"} onChange={(k) => setHow(i, k)} options={(Object.keys(HOW) as How[]).map((k) => [k, HOW[k]] as const)} />
                <input className="field field-sm flex-1 basis-52" defaultValue={d.n || ""} placeholder="Key insight in one line" aria-label={"Key insight for " + name}
                  onBlur={(e) => { if (e.target.value !== (d.n || "")) setNote(i, e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {side && <span className="mt-1 whitespace-nowrap text-xs text-muted">{side}</span>}
    </motion.div>
  );
}

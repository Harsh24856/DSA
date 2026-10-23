"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { HOW, level, title, TRACK, url, type How } from "@/lib/logic";
import { P } from "@/lib/problems";

type Props = { i: number; side?: string; compact?: boolean; revisit?: boolean };

export function ProblemRow({ i, side, compact, revisit }: Props) {
  const { state, toggle, setHow, setNote, revisitDone } = useStore();
  const [showTopic, setShowTopic] = useState(false);
  const reduce = useReducedMotion();
  const d = state.done[i];
  const checked = revisit ? false : !!d;
  const name = title(i);

  return (
    <motion.div layout={!reduce} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-line py-3.5 first:border-t-0">
      <button type="button" role="checkbox" aria-checked={checked} aria-label={(revisit ? "Mark revisit done: " : checked ? "Untick " : "Tick ") + name}
        onClick={() => (revisit ? revisitDone(i) : toggle(i, !checked))}
        className={`mt-0.5 grid size-6 cursor-pointer place-items-center rounded-full border-2 transition-colors duration-200 active:scale-90 ${checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong hover:border-accent"}`}>
        <AnimatePresence>
          {checked && (
            <motion.span initial={reduce ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
              <Check size={14} weight="bold" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <div className="min-w-0">
        <a href={url(i)} target="_blank" rel="noopener"
          className={`inline-flex max-w-full items-center gap-1 font-medium decoration-line-strong underline-offset-4 transition-colors hover:text-accent ${checked ? "text-muted line-through" : ""}`}>
          <span className="truncate">{name}</span><ArrowUpRight size={14} className="shrink-0 opacity-50 transition group-hover:opacity-100" aria-hidden />
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span>{TRACK[P[i][0]]}</span>
          <span className={`pill lv-${level(i)}`}>{P[i][3]}</span>
          {showTopic ? <span>{P[i][5]}</span> : (
            <button type="button" onClick={() => setShowTopic(true)} className="cursor-pointer rounded-md px-1 text-muted underline decoration-dotted underline-offset-2 hover:text-ink">show topic</button>
          )}
        </div>
        {revisit && d?.n && <p className="mt-1.5 text-[13px] text-muted">Your insight: {d.n}</p>}

        <AnimatePresence initial={false}>
          {d && !compact && !revisit && (
            <motion.div initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <div className="flex rounded-[10px] bg-surface-2 p-0.5" role="group" aria-label="How you solved it">
                  {(Object.keys(HOW) as How[]).map((k) => (
                    <button key={k} type="button" aria-pressed={(d.h || "s") === k} onClick={() => setHow(i, k)}
                      className="h-7 cursor-pointer rounded-[8px] px-2.5 text-[12px] font-medium text-muted transition aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-card">{HOW[k]}</button>
                  ))}
                </div>
                <input className="field h-8 flex-1 basis-52 text-[13px]" defaultValue={d.n || ""} placeholder="Key insight in one line" aria-label={"Key insight for " + name}
                  onBlur={(e) => { if (e.target.value !== (d.n || "")) setNote(i, e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {side && <span className="mt-1 whitespace-nowrap text-[12px] text-muted">{side}</span>}
    </motion.div>
  );
}

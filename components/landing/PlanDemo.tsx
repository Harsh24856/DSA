"use client";
// A small working copy of the daily plan: tick problems, skip a day, and see what rolls forward.
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowClockwise, Check } from "@phosphor-icons/react";

const QUEUE: [string, string][] = [["Path Sum II", "Medium"], ["Combine Two Tables", "Easy"], ["Longest Well Performing Interval", "Medium"], ["Big Countries", "Easy"], ["Jump Game III", "Medium"], ["Plus One", "Easy"], ["Duplicate Emails", "Easy"], ["Course Schedule", "Medium"], ["Rotate String", "Easy"], ["Sort Colors", "Medium"]];
const PER_DAY = 3;

export function PlanDemo() {
  const reduce = useReducedMotion();
  const [day, setDay] = useState(1);
  const [past, setPast] = useState<number[]>([]);    // solved on earlier days
  const [today, setToday] = useState<number[]>([]);  // solved today
  const [carried, setCarried] = useState<number[]>([]);
  const list = QUEUE.map((_, i) => i).filter((i) => !past.includes(i)).slice(0, PER_DAY);
  const left = list.filter((i) => !today.includes(i)).length;
  const toggle = (i: number) => setToday((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  const nextDay = () => { setPast((p) => [...p, ...today]); setCarried(list.filter((i) => !today.includes(i))); setToday([]); setDay((d) => d + 1); };
  const reset = () => { setDay(1); setPast([]); setToday([]); setCarried([]); };
  const finished = past.length + today.length >= QUEUE.length || list.length === 0;

  return (
    <div className="rounded-2xl border border-line-strong bg-surface p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="title-2">Day {day}</h3><p className="caption-5 text-muted" aria-live="polite">{left ? `${left} left today` : "Today is done"}</p></div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset} disabled={day === 1 && !today.length}><ArrowClockwise size={14} aria-hidden />Start over</button>
      </div>
      <ul className="mt-4 flex min-h-[176px] flex-col">
        <AnimatePresence initial={false} mode="popLayout">
          {list.map((i) => {
            const on = today.includes(i);
            return (
              <motion.li key={i} layout={!reduce} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <button type="button" role="checkbox" aria-checked={on} aria-label={`${on ? "Untick" : "Tick"} ${QUEUE[i][0]}`} onClick={() => toggle(i)} className="tick">{on && <Check size={14} weight="bold" aria-hidden />}</button>
                <span className={`min-w-0 flex-1 truncate body-5 ${on ? "text-muted line-through" : ""}`}>{QUEUE[i][0]}</span>
                {carried.includes(i) && <span className="pill lv-Medium shrink-0">Carried over</span>}
                <span className={`pill lv-${QUEUE[i][1]} shrink-0 max-sm:hidden`}>{QUEUE[i][1]}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
        <button type="button" className="btn" onClick={nextDay} disabled={finished}>{left ? "Skip to tomorrow" : "Go to tomorrow"}</button>
        <p className="min-w-0 flex-1 basis-48 caption-5 text-muted">{carried.length ? `${carried.length} missed, so ${carried.length === 1 ? "it stays" : "they stay"} at the top. Nothing is lost.` : "Tick some, skip the rest, and see what happens tomorrow."}</p>
      </div>
    </div>
  );
}

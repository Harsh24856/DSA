"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, CheckCircle, Plus } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { addDays, isWeekend, level, perDay, queue, revisitsDue, streak, title, todayPlan, TRACK, TRACKS, trackTotals, upcoming, url, weekStart, windowInfo, ymd } from "@/lib/logic";
import type { Track } from "@/lib/problems";
import { P } from "@/lib/problems";

import { ProblemRow } from "@/components/ProblemRow";
import { SolveButton, solveTarget } from "@/components/SolvePanel";
import { WeekBars } from "@/components/charts";
import { Bar, Card, Count, Skeleton, Stat } from "@/components/ui";

export default function Today() {
  const { ready, state, now } = useStore();
  const [extra, setExtra] = useState<Record<Track, number>>({ L: 0, S: 0, C: 0 });
  if (!ready) return <TodaySkeleton />;

  const t = ymd(now);
  const plan = todayPlan(state, now);
  const left = plan.main.filter((i) => !state.done[i]).length;
  const next = plan.main.find((i) => !state.done[i]);
  const rev = revisitsDue(state, now);
  const days = perDay(state);
  const solvedToday = days.get(t) || 0;
  const total = Object.keys(state.done).length;
  const st = streak(state, now);
  // "Add a problem" pulls the next unsolved ones of that track forward, the same way solving extra does
  // (extras already solved today count toward what was added, so ticking one does not pull in another)
  const nextUp = TRACKS.flatMap((tr) => {
    const solved = plan.extraDone.filter((i) => P[i][0] === tr).length;
    return queue(state, tr).filter((i) => !plan.main.includes(i)).slice(0, Math.max(0, extra[tr] - solved));
  });
  const extraIds = [...plan.extraDone, ...nextUp.filter((i) => !plan.extraDone.includes(i))];
  const q = plan.quota;
  const summary = TRACKS.filter((tr) => q[tr] > 0).map((tr) => `${q[tr]} ${TRACK[tr]}`).join(" + ");
  const ws = weekStart(now);
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = addDays(ws, k);
    return { day: d.toLocaleDateString(undefined, { weekday: "short" }), solved: days.get(ymd(d)) || 0, today: ymd(d) === t };
  });
  const weekTotal = week.reduce((a, b) => a + b.solved, 0);

  return (
    <div className="flex flex-col gap-6">
      {next !== undefined && <NextUp i={next} />}

      <section className="grid grid-cols-2 gap-3 max-sm:order-last xl:grid-cols-4" aria-label="Key numbers">
        <Stat label="Today" note={left ? `${left} left in today's plan` : "Today's plan is done"}><Count value={plan.main.length - left} /><Unit>/ {plan.main.length}</Unit></Stat>
        <Stat label="Streak" note={st ? "Keep it going today" : "Solve one to start"}><Count value={st} /><Unit>{st === 1 ? "day" : "days"}</Unit></Stat>
        <Stat label="Solved" note={`${solvedToday} today, ${weekTotal} this week`}><Count value={total} /><Unit>/ {P.length}</Unit></Stat>
        <Stat label="Revisits due" note={rev.length ? "Re-solve without looking" : "Nothing due"}><Count value={rev.length} /></Stat>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Do these today" aside={<Ring done={plan.main.length - left} total={plan.main.length} />}
            sub={(isWeekend(now) ? "Weekend plan: " : "Weekday plan: ") + summary}>
            <div className="flex flex-col gap-8">
              {TRACKS.map((tr) => {
                const ids = plan.byTrack[tr], extras = extraIds.filter((i) => P[i][0] === tr);
                const dn = ids.filter((i) => state.done[i]).length;
                const w = windowInfo(state, now, tr, ids);
                return (
                  <section key={tr} aria-labelledby={"tr-" + tr} className="grid gap-2">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 id={"tr-" + tr} className="t-h3">{TRACK[tr]}</h3>
                        {ids.length > 0 && (
                          <p className="num text-xs text-muted">
                            {w.from === w.to ? `#${w.from}` : `#${w.from} to ${w.to}`} of {w.total}
                            {w.carried > 0 && <span className="pill lv-Medium ml-2 font-sans">{w.carried} carried over</span>}
                          </p>
                        )}
                      </div>
                      {ids.length > 0 && <span className="num text-sm text-muted"><span className="font-semibold text-ink">{dn}</span> / {ids.length}</span>}
                    </div>
                    {ids.length > 0 && <Bar value={dn} max={ids.length} />}
                    {ids.length === 0 && extras.length === 0 ? (
                      <p className="empty py-4">{q[tr] === 0 ? (tr === "C" ? "Codeforces is on Saturday and Sunday, 2 a day." : "Nothing planned today.") : "Every problem in this list is solved."}</p>
                    ) : (
                      <div className="mt-1">
                        {ids.map((i) => <ProblemRow key={i} i={i} />)}
                        {extras.map((i) => <ProblemRow key={i} i={i} side={state.done[i] ? "extra" : "from tomorrow"} />)}
                      </div>
                    )}
                    {queue(state, tr).some((i) => !plan.main.includes(i)) && (
                      <div className="flex border-t border-line pt-3">
                        <button className="btn btn-sm btn-ghost" type="button" onClick={() => setExtra((e) => ({ ...e, [tr]: e[tr] + 1 }))}>
                          <Plus size={14} aria-hidden />{extra[tr] ? `Add another ${TRACK[tr]}` : `Add a ${TRACK[tr]} problem`}
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            {plan.main.length > 0 && left === 0 && (
              <motion.p initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="callout mt-3 flex items-center gap-2 text-sm font-medium text-accent">
                <CheckCircle size={18} weight="fill" aria-hidden />Today&apos;s plan is done. Anything extra moves tomorrow&apos;s problems up.
              </motion.p>
            )}
          </Card>

          {rev.length > 0 && (
            <Card title="Revisit" sub="Problems you needed help with. Re-solve them without looking.">
              {rev.map(({ i, r }) => <ProblemRow key={i} i={i} revisit side={`revisit ${r + 1} of 3`} />)}
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="This week" sub={st ? `${st}-day streak` : "Start your streak today"} delay={0.05}>
            <WeekBars data={week} />
          </Card>
          <Card title="Tracks" sub="Solved out of each list" delay={0.1}>
            <ul className="flex flex-col gap-4">
              {trackTotals(state).map((tr) => (
                <li key={tr.tr}>
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{tr.name}</span>
                    <span className="num text-muted"><span className="font-semibold text-ink">{tr.done}</span> / {tr.total}</span>
                  </div>
                  <Bar value={tr.done} max={tr.total} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Coming up" sub="Next 7 days. Solving extra pulls these earlier." delay={0.15}>
            <div className="flex max-h-[360px] flex-col gap-4 overflow-y-auto pr-1">
              {upcoming(state, now, plan.main).map(({ date, items }) => (
                <div key={ymd(date)}>
                  <div className="t-eyebrow mb-2 text-xs">{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</div>
                  <ul className="flex flex-col gap-2">
                    {items.map((i) => (
                      <li key={i} className="flex min-w-0 items-center gap-2 text-sm">
                        <span className={`pill lv-${level(i)} shrink-0`}>{level(i)}</span>
                        <a href={url(i)} target="_blank" rel="noopener" className="truncate hover:text-accent">{title(i)}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** The one thing to do now: the first unsolved problem of today's plan. */
function NextUp({ i }: { i: number }) {
  const { toggle } = useStore();
  const name = title(i), lc = P[i][0] !== "C";
  return (
    <section aria-labelledby="next-up" className="card flex flex-wrap items-center gap-x-6 gap-y-4 p-4 sm:p-6">
      <div className="min-w-0 flex-1 basis-64">
        <p className="caption-4 text-muted">Next up</p>
        <h2 id="next-up" className="t-h3 mt-1">{name}</h2>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted"><span className={`pill lv-${level(i)}`}>{P[i][3]}</span>{TRACK[P[i][0]]}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a href={url(i)} target="_blank" rel="noopener" className="btn btn-primary">{lc ? "Open on LeetCode" : "Open on Codeforces"}<ArrowUpRight size={16} aria-hidden /></a>
        <SolveButton t={solveTarget(i)} />
        <button type="button" className="btn" onClick={() => toggle(i, true)}><Check size={16} weight="bold" aria-hidden />Mark solved</button>
      </div>
    </section>
  );
}

const Unit = ({ children }: { children: React.ReactNode }) => <span className="text-sm font-normal text-muted">{children}</span>;

function Ring({ done, total }: { done: number; total: number }) {
  const reduce = useReducedMotion();
  const f = total ? done / total : 0;
  return (
    <div className="relative size-12" role="img" aria-label={`${done} of ${total} done today`}>
      <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <motion.circle cx="24" cy="24" r="20" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: f }} transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="num absolute inset-0 grid place-items-center text-xs font-semibold">{Math.round(f * 100)}%</span>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px]" />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]"><Skeleton className="h-[360px]" /><Skeleton className="h-[360px]" /></div>
    </div>
  );
}

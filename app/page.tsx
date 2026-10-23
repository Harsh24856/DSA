"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowClockwise, CheckCircle, CloudSlash, Code, Database, Fire, Lightning, Plus, Target, Trophy, type Icon } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { addDays, isWeekend, level, perDay, queue, revisitsDue, streak, title, todayPlan, TRACK, TRACKS, trackTotals, upcoming, url, weekStart, ymd } from "@/lib/logic";
import type { Track } from "@/lib/problems";
import { P } from "@/lib/problems";

const TRACK_ICON: Record<Track, Icon> = { L: Code, S: Database, C: Lightning };
import { ProblemRow } from "@/components/ProblemRow";
import { WeekBars } from "@/components/charts";
import { Bar, Card, Count, Skeleton } from "@/components/ui";

export default function Today() {
  const { ready, state, now, connected } = useStore();
  const [extra, setExtra] = useState(0);
  if (!ready) return <TodaySkeleton />;

  const t = ymd(now);
  const plan = todayPlan(state, now);
  const left = plan.main.filter((i) => !state.done[i]).length;
  const rev = revisitsDue(state, now);
  const days = perDay(state);
  const solvedToday = days.get(t) || 0;
  const total = Object.keys(state.done).length;
  const st = streak(state, now);
  const nextUp = queue(state, "L").filter((i) => !plan.main.includes(i)).slice(0, extra);
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
    <div className="flex flex-col gap-5">
      {!connected && <SyncCard />}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Key numbers">
        <Kpi icon={<Target size={18} aria-hidden />} label="Today" value={plan.main.length - left} suffix={`/ ${plan.main.length}`} note={left ? `${left} left in today's plan` : "Today's plan is done"} />
        <Kpi icon={<Fire size={18} weight="fill" aria-hidden />} label="Streak" value={st} suffix={st === 1 ? "day" : "days"} note={st ? "Keep it going today" : "Solve one to start"} />
        <Kpi icon={<Trophy size={18} aria-hidden />} label="Solved" value={total} suffix={`/ ${P.length}`} note={`${solvedToday} today, ${weekTotal} this week`} />
        <Kpi icon={<ArrowClockwise size={18} aria-hidden />} label="Revisits due" value={rev.length} note={rev.length ? "Re-solve without looking" : "Nothing due"} />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Do these today" aside={<Ring done={plan.main.length - left} total={plan.main.length} />}
            sub={(isWeekend(now) ? "Weekend plan: " : "Weekday plan: ") + summary}>
            <div className="flex flex-col gap-3">
              {TRACKS.map((tr) => {
                const I = TRACK_ICON[tr], ids = plan.byTrack[tr], extras = extraIds.filter((i) => P[i][0] === tr);
                const dn = ids.filter((i) => state.done[i]).length;
                return (
                  <section key={tr} aria-labelledby={"tr-" + tr} className="rounded-[14px] border border-line bg-surface-2/40 px-4 pb-1 pt-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-accent-soft text-accent"><I size={17} weight="bold" aria-hidden /></span>
                      <h3 id={"tr-" + tr} className="flex-1 text-[15px] font-semibold">{TRACK[tr]}</h3>
                      {ids.length > 0 && <span className="num text-[13px] text-muted"><span className="font-semibold text-ink">{dn}</span> / {ids.length}</span>}
                    </div>
                    {ids.length > 0 && <Bar value={dn} max={ids.length} className="mt-3" />}
                    {ids.length === 0 && extras.length === 0 ? (
                      <p className="py-3 text-[13px] text-muted">{q[tr] === 0 ? (tr === "C" ? "Codeforces is on Saturday and Sunday, 2 a day." : "Nothing planned today.") : "Every problem in this list is solved."}</p>
                    ) : (
                      <div className="mt-1">
                        {ids.map((i) => <ProblemRow key={i} i={i} />)}
                        {extras.map((i) => <ProblemRow key={i} i={i} side={state.done[i] ? "extra" : "from tomorrow"} />)}
                      </div>
                    )}
                    {tr === "L" && (
                      <div className="flex justify-center border-t border-line py-3">
                        <button className="btn h-9" type="button" onClick={() => setExtra((n) => n + 1)}><Plus size={16} aria-hidden />{nextUp.length ? "Show another" : "Got time? Do one more"}</button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            {plan.main.length > 0 && left === 0 && (
              <motion.p initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 flex items-center gap-2 rounded-[10px] bg-accent-soft px-3 py-2.5 text-[14px] font-medium text-accent">
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

        <div className="flex min-w-0 flex-col gap-5">
          <Card title="This week" sub={st ? `${st}-day streak` : "Start your streak today"} delay={0.05}>
            <WeekBars data={week} />
          </Card>
          <Card title="Tracks" sub="Solved out of each list" delay={0.1}>
            <ul className="flex flex-col gap-4">
              {trackTotals(state).map((tr) => (
                <li key={tr.tr}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[14px]">
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
                  <div className="mb-1.5 text-[12px] font-semibold text-muted">{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</div>
                  <ul className="flex flex-col gap-1.5">
                    {items.map((i) => (
                      <li key={i} className="flex min-w-0 items-center gap-2 text-[14px]">
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

function Kpi({ icon, label, value, suffix, note }: { icon: React.ReactNode; label: string; value: number; suffix?: string; note: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="card flex min-w-0 flex-col gap-2 p-4" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted"><span className="grid size-7 place-items-center rounded-[8px] bg-accent-soft text-accent">{icon}</span>{label}</div>
      <div className="flex items-baseline gap-1.5"><Count value={value} className="text-[28px] font-semibold leading-none" />{suffix && <span className="text-[13px] text-muted">{suffix}</span>}</div>
      <p className="truncate text-[12px] text-muted">{note}</p>
    </motion.div>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const reduce = useReducedMotion();
  const f = total ? done / total : 0;
  return (
    <div className="relative size-12" role="img" aria-label={`${done} of ${total} done today`}>
      <svg viewBox="0 0 48 48" className="size-12 -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        <motion.circle cx="24" cy="24" r="20" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: f }} transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
      <span className="num absolute inset-0 grid place-items-center text-[12px] font-semibold">{Math.round(f * 100)}%</span>
    </div>
  );
}

function SyncCard() {
  const { connect, say } = useStore();
  const [k, setK] = useState("");
  return (
    <section className="card flex flex-col gap-4 border-accent/40 bg-accent-soft p-5 md:flex-row md:items-end md:justify-between" aria-labelledby="syncH">
      <div className="max-w-[60ch]">
        <h2 id="syncH" className="flex items-center gap-2 text-[16px] font-semibold"><CloudSlash size={18} aria-hidden />Cloud sync is off on this device</h2>
        <p className="mt-1 text-[14px] text-muted">Enter your sync key once to save ticks to the cloud and keep every device the same. The first key you ever enter becomes yours, so pick a long one and keep it private.</p>
      </div>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); if (k.trim().length < 8) return say("Use at least 8 characters for the sync key."); connect(k.trim()); setK(""); }}>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">Sync key
          <input className="field w-full sm:w-64" type="password" minLength={8} autoComplete="current-password" value={k} onChange={(e) => setK(e.target.value)} placeholder="8 or more characters" />
        </label>
        <button className="btn btn-primary" type="submit">Turn on sync</button>
      </form>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px]" />)}</div>
      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"><Skeleton className="h-[360px]" /><Skeleton className="h-[360px]" /></div>
    </div>
  );
}

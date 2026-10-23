"use client";
import { useEffect, useMemo, useState } from "react";
import { P, type Track } from "@/lib/problems.ts";
import {
  carriedFrom, currentPhase, displayTitle, GROUP, isWeekend, markSeen, parse, PHASES, problemUrl, queue,
  revisitsDue, streak, todayPlan, TRACK, upcoming, weekDays, type Plan,
} from "@/lib/schedule.ts";
import ProblemRow from "./ProblemRow";
import { useProgress } from "./progress";

const shortDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });

export function TodayPanel({ plan }: { plan: Plan }) {
  const { state, update, t, now } = useProgress();
  const [extra, setExtra] = useState({ L: 0, S: 0 });

  // Remember when each problem first showed up, so tomorrow it can say "From Mon".
  useEffect(() => { update(s => markSeen(s, todayPlan(s, now).main, t), { quiet: true }); }, [plan, t, now, update]);

  const doneCount = plan.main.filter(i => state.done[i]).length;
  const parts = [`${plan.groups.L.length} DSA`, `${plan.groups.S.length} SQL`];
  if (plan.groups.C.length) parts.push(`${plan.groups.C.length} Codeforces`);

  const extraIds = [...plan.extraDone];
  for (const tr of ["L", "S"] as const)
    for (const i of queue(state, tr).filter(i => !plan.main.includes(i)).slice(0, extra[tr]))
      if (!extraIds.includes(i)) extraIds.push(i);

  return (
    <section className="panel hero" aria-labelledby="todayH">
      <div className="hero-top">
        <div>
          <h2 id="todayH">Today’s minimum</h2>
          <p className="sub">{(isWeekend(now) ? "Weekend: " : "Weekday: ") + parts.join(" + ")}</p>
        </div>
        <div className="tally" aria-live="polite">
          <b className="num">{doneCount}</b><span>of <span className="num">{plan.main.length}</span> done</span>
        </div>
      </div>
      <div className="meter" aria-hidden="true">
        {plan.main.map(i => <i key={i} className={"seg t-" + P[i][0] + (state.done[i] ? " on" : "")} />)}
      </div>

      {(["L", "S", "C"] as Track[]).map(tr => {
        const ids = plan.groups[tr];
        if (!ids.length) return null;
        const left = ids.filter(i => !state.done[i]).length;
        return (
          <div className="group" key={tr}>
            <div className="gh">
              <h3>{GROUP[tr]}</h3>
              <span className={"sub" + (left ? "" : " done")}>
                {tr === "C" ? `${plan.cfDone} of ${state.quota.C} this week` : left ? `${left} left` : "Done"}
              </span>
            </div>
            <div className="list">
              {ids.map(i => {
                const from = carriedFrom(state, i, t);
                return <ProblemRow key={i} i={i} grouped side={from ? "From " + shortDay(parse(from)) : ""} sideClass={from ? "carried" : ""} />;
              })}
            </div>
          </div>
        );
      })}

      {plan.main.length > 0 && doneCount === plan.main.length && (
        <div className="done-msg">Minimum done for today. Anything extra pulls later problems forward. Tomorrow’s minimum stays the same.</div>
      )}
      {!plan.main.length && <div className="done-msg">Nothing scheduled today. Raise the daily minimum in Settings to add problems.</div>}

      <div className="more">
        <button className="btn" type="button" onClick={() => setExtra(e => ({ ...e, L: e.L + 1 }))}>Add a DSA problem</button>
        <button className="btn" type="button" onClick={() => setExtra(e => ({ ...e, S: e.S + 1 }))}>Add a SQL problem</button>
      </div>
      {extraIds.length > 0 && (
        <div className="list extra">
          {extraIds.map(i => <ProblemRow key={i} i={i} side={state.done[i] ? "Extra" : "From tomorrow"} />)}
        </div>
      )}
    </section>
  );
}

export function Revisit() {
  const { state, now } = useProgress();
  const due = revisitsDue(state, now);
  if (!due.length) return null;
  return (
    <section className="panel" aria-labelledby="revH">
      <div className="ph"><h2 id="revH">Revisit</h2><span className="sub">You needed help on these. Re-solve without looking.</span></div>
      <div className="list">
        {due.map(({ i, r }) => <ProblemRow key={i + ":" + r} i={i} revisit side={`Revisit ${r + 1} of 3`} />)}
      </div>
    </section>
  );
}

export function WeekStrip() {
  const { state, now } = useProgress();
  const n = streak(state, now);
  return (
    <section className="panel" aria-labelledby="weekH">
      <div className="ph"><h2 id="weekH">This week</h2><span className="sub">{n ? `${n}-day streak` : "Solve one today to start a streak"}</span></div>
      <div className="days">
        {weekDays(state, now).map(d => (
          <div key={d.key} className={"day" + (d.isToday ? " today" : "") + (d.met ? " met" : "") + (d.future ? " future" : "")}
               aria-label={`${d.date.toLocaleDateString(undefined, { weekday: "long" })}: ${d.count} of ${d.goal}`}>
            <div className="dn">{shortDay(d.date)}</div>
            <div className="dc num">{d.count}<small> / {d.goal}</small></div>
            <div className="dbar"><i style={{ width: (d.goal ? Math.min(100, (100 * d.count) / d.goal) : 0) + "%" }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProgressPanel({ plan }: { plan: Plan }) {
  const { state } = useProgress();
  const totals = useMemo(() => { const c = { L: 0, S: 0, C: 0 }; for (const p of P) c[p[0]]++; return c; }, []);
  return (
    <section className="panel" aria-labelledby="progH">
      <div className="ph"><h2 id="progH">Progress</h2><span className="sub">{PHASES[currentPhase(plan)].split(" (")[0]}</span></div>
      <div className="progress">
        {(["L", "S", "C"] as Track[]).map(tr => {
          const tot = totals[tr];
          const dn = Object.keys(state.done).filter(i => P[+i]?.[0] === tr).length;
          return (
            <div className="prow" key={tr}>
              <span className="pk">{TRACK[tr]}</span>
              <div className="bar"><i style={{ width: ((100 * dn) / tot).toFixed(1) + "%" }} /></div>
              <span className="pn num">{dn}<small> / {tot}</small></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Upcoming({ plan }: { plan: Plan }) {
  const { state, now } = useProgress();
  const [open, setOpen] = useState(false);
  return (
    <details className="panel" onToggle={e => setOpen(e.currentTarget.open)}>
      <summary><h2>Coming up</h2><span className="sub">Next 7 days, if you finish today’s list</span></summary>
      {open && upcoming(state, now, plan).map(({ date, items }) => (
        <div key={date.toDateString()}>
          <div className="up-day">
            <span>{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</span>
            <span className="sub">{items.length} problems</span>
          </div>
          {items.map(i => (
            <div className="up" key={i}>
              <span className={"pill lv-" + (P[i][0] === "C" ? "CF" : P[i][3])}>{P[i][0] === "C" ? "CF" : P[i][3]}</span>
              <span className="ut">{P[i][0] === "C" ? "" : GROUP[P[i][0]]}</span>
              <a href={problemUrl(i)} target="_blank" rel="noopener">{displayTitle(i)}</a>
            </div>
          ))}
        </div>
      ))}
    </details>
  );
}

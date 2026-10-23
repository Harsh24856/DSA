"use client";
import { useMemo, useState } from "react";
import { CalendarCheck, Gauge, Lightning, TrendUp } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { addDays, bestStreak, byHow, byLevel, diffDays, parse, pace, perDay, PLACEMENT, topics, ymd } from "@/lib/logic";
import { P } from "@/lib/problems";
import { Donut, Heatmap, PaceChart, TopicBars } from "@/components/charts";
import { Card, Count, Seg, Skeleton } from "@/components/ui";

type Range = "30" | "90" | "all";

export default function Analytics() {
  const { ready, state, now } = useStore();
  const [range, setRange] = useState<Range>("30");
  const days = useMemo(() => perDay(state), [state]);
  const rows = useMemo(() => pace(state, now), [state, now]);
  if (!ready) return <div className="grid gap-5" aria-busy="true"><Skeleton className="h-28" /><Skeleton className="h-56" /><Skeleton className="h-72" /></div>;

  const total = Object.keys(state.done).length;
  const left = Math.max(1, diffDays(PLACEMENT, now));
  const need = (P.length - total) / left;
  let last30 = 0;
  for (let k = 0; k < 30; k++) last30 += days.get(ymd(addDays(now, -k))) || 0;
  const avg = last30 / 30;
  const dow = [0, 0, 0, 0, 0, 0, 0];
  days.forEach((n, k) => { dow[(parse(k).getDay() + 6) % 7] += n; });
  const bestDow = dow.some(Boolean) ? ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"][dow.indexOf(Math.max(...dow))] : "None yet";

  const todayIdx = rows.findIndex((r) => r.date === ymd(now));
  const end = todayIdx < 0 ? rows.length : todayIdx + 1;
  const shown = range === "all" ? rows : rows.slice(Math.max(0, end - +range), Math.min(rows.length, end + Math.round(+range / 3)));
  const ahead = todayIdx >= 0 ? (rows[todayIdx].solved ?? 0) - rows[todayIdx].target : 0;

  const lv = byLevel(state), how = byHow(state);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Insights">
        <Insight icon={<Gauge size={18} aria-hidden />} label="Needed per day" value={need.toFixed(1)} note={`to finish all ${P.length} by 1 May`} />
        <Insight icon={<TrendUp size={18} aria-hidden />} label="Your 30-day average" value={avg.toFixed(1)} note={avg >= need ? "On pace" : `${(need - avg).toFixed(1)} a day short of pace`} />
        <Insight icon={<Lightning size={18} weight="fill" aria-hidden />} label="Best streak" count={bestStreak(state)} note="Longest run of active days" />
        <Insight icon={<CalendarCheck size={18} aria-hidden />} label="Most active on" value={bestDow} note={`${days.size} active days so far`} />
      </section>

      <Card title="Activity" sub="Problems solved per day, last 26 weeks">
        <Heatmap days={days} now={now} />
      </Card>

      <Card title="Pace to placements" sub={ahead >= 0 ? `${ahead} ahead of the pace that finishes every problem by 1 May` : `${-ahead} behind the pace that finishes every problem by 1 May`}
        aside={<Seg<Range> label="Range" value={range} onChange={setRange} options={[["30", "30 days"], ["90", "90 days"], ["all", "All"]]} />}>
        <PaceChart rows={shown} />
        <div className="mt-3 flex gap-5 text-[12px] text-muted" aria-hidden>
          <span className="flex items-center gap-2"><i className="h-0.5 w-5 rounded bg-accent" />Solved</span>
          <span className="flex items-center gap-2"><i className="h-0 w-5 border-t-2 border-dashed border-muted" />Needed</span>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="By difficulty" sub="Solved LeetCode and SQL">
          <Donut center="solved" data={[{ name: "Easy", value: lv.Easy, color: "var(--easy)" }, { name: "Medium", value: lv.Medium, color: "var(--medium)" }, { name: "Hard", value: lv.Hard, color: "var(--hard)" }]} />
        </Card>
        <Card title="How you solved" sub="Hint and Editorial come back as revisits" delay={0.05}>
          <Donut center="solved" data={[{ name: "Solo", value: how.s, color: "var(--accent)" }, { name: "Hint", value: how.h, color: "var(--medium)" }, { name: "Editorial", value: how.e, color: "var(--hard)" }]} />
        </Card>
      </div>

      <Card title="Topics" sub="LeetCode tags, most common first. Light bar is the total, dark bar is what you solved.">
        <TopicBars rows={topics(state)} />
      </Card>
    </div>
  );
}

function Insight({ icon, label, value, count, note }: { icon: React.ReactNode; label: string; value?: string; count?: number; note: string }) {
  return (
    <div className="card flex min-w-0 flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted"><span className="grid size-7 place-items-center rounded-[8px] bg-accent-soft text-accent">{icon}</span>{label}</div>
      {count != null ? <Count value={count} className="text-[26px] font-semibold leading-none" /> : <span className="num truncate text-[26px] font-semibold leading-none">{value}</span>}
      <p className="truncate text-[12px] text-muted">{note}</p>
    </div>
  );
}

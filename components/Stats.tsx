"use client";
import { useMemo } from "react";
import { streak } from "@/lib/schedule.ts";
import { bestStreak, difficultyMix, heatmap, helpMix, journey, pace, topicStats } from "@/lib/stats.ts";
import { Heatmap, Meters, PaceChart, SplitBar, TopicBars } from "./charts";
import { useProgress } from "./progress";

export function paceLabel(p: { diff: number; onlyToday: boolean }) {
  if (p.diff > 0) return `${p.diff} ahead of plan`;
  if (p.diff === 0) return "Right on plan";
  return p.onlyToday ? `${-p.diff} to go today` : `${-p.diff} behind plan`;
}

export default function Stats() {
  const { state, now, t } = useProgress();
  const p = useMemo(() => pace(state, now), [state, now]);
  const help = helpMix(state), diff = difficultyMix(state), topics = topicStats(state);
  const solved = Object.keys(state.done).length;
  const j = journey(state, now);
  const behind = p.diff < 0 && !p.onlyToday;

  return (
    <>
      <section className="tiles" aria-label="Summary">
        <div className="tile"><span className="k">Solved</span><b>{solved}</b><span className="sub">all tracks</span></div>
        <div className="tile"><span className="k">Current streak</span><b>{streak(state, now)}</b><span className="sub">days in a row</span></div>
        <div className="tile"><span className="k">Best streak</span><b>{bestStreak(state)}</b><span className="sub">days</span></div>
        <div className={"tile" + (behind ? " behind" : "")}>
          <span className="k">Pace</span><b>{p.diff > 0 ? "+" + p.diff : p.diff}</b><span className="sub">{paceLabel(p)}</span>
        </div>
      </section>

      <section className="panel" aria-labelledby="paceH">
        <div className="ph"><h2 id="paceH">Pace</h2><span className="sub">DSA + SQL solved against your daily minimum</span></div>
        <PaceChart points={p.points} todayKey={t} />
      </section>

      <section className="panel" aria-labelledby="heatH">
        <div className="ph"><h2 id="heatH">Activity</h2><span className="sub">Week {Math.min(j.current + 1, j.total)} of {j.total} to placements</span></div>
        <Heatmap start={j.start} total={j.total} current={j.current} build={(from, weeks) => heatmap(state, now, from, weeks)} />
      </section>

      <div className="two">
        <section className="panel" aria-labelledby="helpH">
          <div className="ph"><h2 id="helpH">How you solved</h2></div>
          <SplitBar empty="Tick a problem and pick Solo, Hint or Editorial to see this."
            parts={[{ key: "c-acc", label: "Solo", value: help.s }, { key: "c-mid", label: "Hint", value: help.h }, { key: "c-weak", label: "Editorial", value: help.e }]} />
        </section>
        <section className="panel" aria-labelledby="diffH">
          <div className="ph"><h2 id="diffH">Difficulty</h2><span className="sub">Solved of each level</span></div>
          <Meters rows={(["Easy", "Medium", "Hard"] as const).map(l => ({ label: l, ...diff[l] }))} />
        </section>
      </div>

      <section className="panel" aria-labelledby="topH">
        <div className="ph"><h2 id="topH">Topics</h2><span className="sub">LeetCode topics you have practised most</span></div>
        {topics.length ? <TopicBars rows={topics} /> : <p className="sub chart-empty">Solve a few LeetCode problems to see which topics you have covered.</p>}
      </section>
    </>
  );
}

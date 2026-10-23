"use client";
import { P } from "@/lib/problems.ts";
import { currentPhase, type Plan } from "@/lib/schedule.ts";
import { useProgress } from "./progress";

const ROADMAP: [number, string, string, string[]][] = [
  [1, "Unseen Mediums", "26 Oct – 27 Dec 2026", ["2 new Mediums each weekday and 3 on weekends, on the most-asked OA topics: arrays, strings, hashing, two pointers, sliding window, binary search, graphs, trees, heaps.", "Hide topic tags and work out the pattern yourself.", "1 SQL problem each weekday and 2 on weekends, from the SQL 50 list."]],
  [2, "Medium–Hard", "28 Dec 2026 – 28 Feb 2027", ["Timed Mediums plus one Hard every few days.", "Company-tagged sets and light DP (1D, knapsack, grids).", "Codeforces on weekends at 1200–1500 rating."]],
  [3, "OA simulation", "1 Mar – 15 Apr 2027", ["2–3 problems in 90 minutes, twice a week, like a real OA.", "LeetCode weekly contests and upsolving.", "Harder SQL: window functions and joins."]],
  [4, "Revision", "16 Apr – 1 May 2027", ["Re-solve every problem you marked Hint or Editorial.", "Read your one-line insights daily.", "Light new practice only, to stay sharp."]],
];

export default function Roadmap({ plan }: { plan: Plan }) {
  const { state } = useProgress();
  const cur = currentPhase(plan);
  return (
    <section className="panel" aria-labelledby="rmH">
      <div className="ph"><h2 id="rmH">Roadmap to May 2027</h2><span className="sub">Four phases, about 2 hours a day</span></div>
      <div>
        {ROADMAP.map(([n, name, when, points]) => {
          const tot = P.filter(p => p[4] === n).length;
          const dn = Object.keys(state.done).filter(i => P[+i]?.[4] === n).length;
          return (
            <div className={"phase" + (n === cur ? " now" : "")} key={n}>
              <h3><span className="pnum">{n}</span>{name}{n === cur && <span className="here">You are here</span>}</h3>
              <div className="when">{when}, {dn} of {tot} solved</div>
              <div className="bar"><i style={{ width: (tot ? (100 * dn) / tot : 0).toFixed(1) + "%" }} /></div>
              <ul>{points.map(p => <li key={p}>{p}</li>)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

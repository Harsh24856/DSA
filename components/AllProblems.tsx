"use client";
import { useState } from "react";
import { P } from "@/lib/problems.ts";
import { displayTitle, parse, PHASES } from "@/lib/schedule.ts";
import ProblemRow from "./ProblemRow";
import { useProgress } from "./progress";

const PAGE = 60;

export default function AllProblems() {
  const { state } = useProgress();
  const [f, setF] = useState({ q: "", t: "", s: "", l: "" });
  const [shown, setShown] = useState(PAGE);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF({ ...f, [k]: e.target.value }); setShown(PAGE); };

  const q = f.q.trim().toLowerCase();
  const ids: number[] = [];
  P.forEach((p, i) => {
    const d = state.done[i];
    if (f.t && p[0] !== f.t) return;
    if (f.l && p[3] !== f.l) return;
    if (f.s === "todo" && d) return;
    if (f.s === "done" && !d) return;
    if (f.s === "help" && !(d && d.h && d.h !== "s")) return;
    if (q && !displayTitle(i).toLowerCase().includes(q)) return;
    ids.push(i);
  });

  return (
    <section className="panel" aria-labelledby="allH">
      <div className="ph"><h2 id="allH">All problems</h2><span className="sub">{ids.length} of {P.length}</span></div>
      <div className="filters">
        <input type="search" placeholder="Search by name" aria-label="Search problems by name" value={f.q} onChange={set("q")} />
        <select aria-label="Track" value={f.t} onChange={set("t")}>
          <option value="">All tracks</option><option value="L">LeetCode</option><option value="S">SQL</option><option value="C">Codeforces</option>
        </select>
        <select aria-label="Status" value={f.s} onChange={set("s")}>
          <option value="">Any status</option><option value="todo">Not solved</option><option value="done">Solved</option><option value="help">Needed help</option>
        </select>
        <select aria-label="Difficulty" value={f.l} onChange={set("l")}>
          <option value="">Any level</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
      </div>
      <div className="list">
        {ids.slice(0, shown).map(i => {
          const d = state.done[i];
          const side = d ? "Solved " + parse(d.d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : PHASES[P[i][4]].split(" · ")[0];
          return <ProblemRow key={i} i={i} side={side} />;
        })}
        {!ids.length && <p className="sub empty">No problems match. Clear the search or pick another filter.</p>}
      </div>
      {ids.length > shown && <div className="more"><button className="btn" type="button" onClick={() => setShown(n => n + PAGE)}>Show more</button></div>}
    </section>
  );
}

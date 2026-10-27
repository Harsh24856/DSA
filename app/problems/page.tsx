"use client";
import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { parse, PHASES, title } from "@/lib/logic";
import { P } from "@/lib/problems";
import { ProblemRow } from "@/components/ProblemRow";
import { Card, Skeleton } from "@/components/ui";

const PAGE = 60;

export default function Problems() {
  const { ready, state } = useStore();
  const [q, setQ] = useState(""), [tr, setTr] = useState(""), [st, setSt] = useState(""), [lv, setLv] = useState("");
  const [shown, setShown] = useState(PAGE);

  const ids = useMemo(() => {
    const needle = q.trim().toLowerCase(), out: number[] = [];
    P.forEach((p, i) => {
      const d = state.done[i];
      if (tr && p[0] !== tr) return;
      if (lv && p[3] !== lv) return;
      if (st === "todo" && d) return;
      if (st === "done" && !d) return;
      if (st === "help" && !(d && d.h && d.h !== "s")) return;
      if (needle && !title(i).toLowerCase().includes(needle)) return;
      out.push(i);
    });
    return out;
  }, [q, tr, st, lv, state]);

  const filter = (f: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { f(e.target.value); setShown(PAGE); };

  return (
    <Card title="All problems" sub={`${ids.length} of ${P.length}`}>
      <div className="mb-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_repeat(3,auto)]">
        <label className="relative">
          <span className="sr-only">Search problems by name</span>
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input className="field w-full pl-9" type="search" placeholder="Search by name" value={q} onChange={filter(setQ)} />
        </label>
        <select className="field" aria-label="Track" value={tr} onChange={filter(setTr)}><option value="">All tracks</option><option value="L">LeetCode</option><option value="S">SQL</option><option value="C">Codeforces</option></select>
        <select className="field" aria-label="Status" value={st} onChange={filter(setSt)}><option value="">Any status</option><option value="todo">Not solved</option><option value="done">Solved</option><option value="help">Needed help</option></select>
        <select className="field" aria-label="Difficulty" value={lv} onChange={filter(setLv)}><option value="">Any level</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
      </div>
      {!ready ? <div className="flex flex-col gap-3 pt-2" aria-busy="true" aria-label="Loading">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-tile" />)}</div> : (
        <>
          <div>
            {ids.slice(0, shown).map((i) => (
              <ProblemRow key={i} i={i} side={state.done[i] ? "solved " + parse(state.done[i].d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "Phase " + P[i][4]} />
            ))}
          </div>
          {!ids.length && <p className="empty">No problems match. Clear the search or pick another filter.</p>}
          {ids.length > shown && <div className="mt-4 flex justify-center"><button className="btn" type="button" onClick={() => setShown((n) => n + PAGE)}>Show more</button></div>}
        </>
      )}
      <span className="sr-only">{PHASES.length} phases</span>
    </Card>
  );
}

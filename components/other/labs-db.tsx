"use client";
// Database labs: B+ tree inserts, the logical order of a SQL query, and normalization with FD closure.
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { bplusInsertAll, candidateKeys, closure } from "@/lib/other/sim";
import { NF_ATTRS, NF_FDS, NF_STAGES, ORDER_SQL, orderSteps } from "@/lib/other/labdata";
import { Seg } from "../ui";
import { Lab, spring, tint } from "../labs/kit";

/* ---------- B+ tree ---------- */
export function BTreeLab() {
  const [text, setText] = useState("10 20 5 6 12 30 7 17 3 25");
  const [max, setMax] = useState<"2" | "3">("3");
  const keys = useMemo(() => [...new Set(text.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < 1000))].slice(0, 16), [text]);
  const { snaps } = useMemo(() => bplusInsertAll(keys, +max), [keys, max]);
  const [i, setI] = useState(snaps.length - 1);
  useEffect(() => setI(snaps.length - 1), [snaps.length, max]);
  const snap = snaps[Math.min(i, snaps.length - 1)];
  return (
    <Lab title="B+ tree: watch nodes split" hint="Each node holds at most the chosen number of keys. A full leaf splits in two and copies its first right-hand key up as a separator; a full inner node splits and moves its middle key up. The tree only grows taller at the root, so every leaf stays at the same depth.">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid gap-1 text-[13px]"><span className="text-muted">Keys to insert, in order (up to 16)</span>
          <input className="field num" value={text} onChange={(e) => setText(e.target.value)} /></label>
        <div className="grid gap-1 text-[13px]"><span className="text-muted">max keys per node</span>
          <Seg<"2" | "3"> label="Max keys per node" value={max} onChange={setMax} options={[["2", "2"], ["3", "3"]]} /></div>
      </div>
      <div className="grid gap-3 overflow-x-auto rounded-tile bg-surface p-3" aria-label={`Tree after ${i} inserts`}>
        {snap.levels.map((level, d) => (
          <div key={d} className="flex w-max min-w-full justify-center gap-2">
            {level.map((node, n) => (
              <motion.div key={`${d}-${node.join("-")}-${n}`} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={spring}
                className="flex overflow-hidden rounded-[8px] border border-line-strong" style={{ background: d === snap.levels.length - 1 ? tint(14, "var(--easy)") : tint(14) }}>
                {node.length ? node.map((k) => <span key={k} className="num border-r border-line px-2 py-1 text-[13px] font-semibold last:border-r-0">{k}</span>) : <span className="px-3 py-1 text-[12px] text-muted">empty</span>}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[12px] text-muted">Top: root and inner nodes (separators only). Bottom row: leaves, which hold every key in sorted order and are linked left to right for range scans.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setI((v) => Math.min(snaps.length - 1, v + 1))} disabled={i >= snaps.length - 1}>Insert next</button>
        <span className="text-[13px]" role="status">{snap.note} · height {snap.levels.length}</span>
      </div>
    </Lab>
  );
}

/* ---------- SQL logical execution order ---------- */
const STEPS = orderSteps();
const CLAUSE_LINE: Record<string, number[]> = { "FROM / JOIN": [1, 2], WHERE: [3], "GROUP BY": [4], HAVING: [5], SELECT: [0], "ORDER BY": [6], LIMIT: [7] };

export function SqlOrderLab() {
  const [i, setI] = useState(0);
  const st = STEPS[i];
  const lines = ORDER_SQL.split("\n");
  return (
    <Lab title="The order a query really runs in" hint="You write SELECT first, but the database starts from FROM. Step through and watch the rows shrink at each clause.">
      <pre className="code text-[12.5px]">{lines.map((l, k) => <span key={k} className="block rounded px-1 transition-colors" style={{ background: CLAUSE_LINE[st.clause].includes(k) ? tint(25) : undefined }}>{l}</span>)}</pre>
      <ol className="flex flex-wrap gap-1.5" aria-label="Clauses in execution order">
        {STEPS.map((s, k) => <li key={s.clause}><button type="button" className="chip" aria-pressed={k === i} onClick={() => setI(k)}>{k + 1}. {s.clause}</button></li>)}
      </ol>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} className="grid gap-2">
          <div className="overflow-x-auto rounded-tile border border-line">
            <table className="w-full min-w-0 text-[13px]" aria-label={`Rows after ${st.clause}`}>
              <thead><tr>{st.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{st.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} className="num">{typeof c === "number" && !Number.isInteger(c) ? c.toFixed(1) : c}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="callout text-[13px]" role="status">{st.note}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))} disabled={i === STEPS.length - 1}>Next clause</button>
      </div>
    </Lab>
  );
}

/* ---------- normalization + closure ---------- */
const SHORT: Record<string, string> = { StudentId: "SId", StudentName: "SName", CourseId: "CId", CourseName: "CName", Instructor: "Instr", InstructorPhone: "Phone", Grade: "Grade" };

export function NormalizeLab() {
  const [view, setView] = useState<"steps" | "closure">("steps");
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<string[]>(["CourseId"]);
  const cl = closure(pick, NF_FDS), keys = candidateKeys(NF_ATTRS, NF_FDS);
  const stage = NF_STAGES[i];
  return (
    <Lab title="Normalize a table step by step" hint="Functional dependencies (FDs) say which columns decide which. Normalization splits a table until every column depends on the key, the whole key, and nothing but the key.">
      <ul className="flex flex-wrap gap-1.5 text-[12px]" aria-label="Functional dependencies">
        {NF_FDS.map(([l, r]) => <li key={l.join()} className="pill pill-muted num">{l.map((a) => SHORT[a]).join(", ")} → {r.map((a) => SHORT[a]).join(", ")}</li>)}
      </ul>
      <Seg<"steps" | "closure"> label="View" value={view} onChange={setView} options={[["steps", "UNF → 3NF"], ["closure", "Closure calculator"]]} />
      {view === "steps" ? (
        <>
          <ol className="flex flex-wrap gap-1.5">{NF_STAGES.map((s, k) => <li key={s.name}><button type="button" className="chip" aria-pressed={k === i} onClick={() => setI(k)}>{s.name}</button></li>)}</ol>
          <AnimatePresence mode="wait">
            <motion.div key={i} className="grid gap-3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="grid gap-3 md:grid-cols-2">
                {stage.tables.map((tb) => (
                  <div key={tb.name} className="min-w-0 overflow-x-auto rounded-tile border border-line">
                    <div className="border-b border-line bg-surface-2 px-3 py-1.5 text-[13px] font-semibold">{tb.name}</div>
                    <table className="w-full min-w-0 text-[12px]">
                      <thead><tr>{tb.cols.map((c) => <th key={c} style={{ textDecoration: tb.key.includes(c) ? "underline" : undefined }}>{SHORT[c] ?? c}</th>)}</tr></thead>
                      <tbody>{tb.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ))}
              </div>
              <p className="callout text-[13px]" role="status"><b>{stage.name}:</b> {stage.why}</p>
            </motion.div>
          </AnimatePresence>
          <p className="text-[12px] text-muted">Underlined columns form each table&apos;s primary key.</p>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Attributes to start from">
            {NF_ATTRS.map((a) => <button key={a} type="button" className="chip" aria-pressed={pick.includes(a)} onClick={() => setPick((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))}>{SHORT[a]}</button>)}
          </div>
          <p className="text-[13px]" role="status">
            ({pick.map((a) => SHORT[a]).join(", ") || "nothing"})<sup>+</sup> = <b>{cl.map((a) => SHORT[a]).join(", ") || "∅"}</b>
            {cl.length === NF_ATTRS.length ? <span className="ml-2 pill pill-accent">superkey</span> : <span className="ml-2 text-muted">not a superkey ({NF_ATTRS.length - cl.length} columns not reached)</span>}
          </p>
          <p className="text-[13px] text-muted">Closure: start with your columns, then keep applying any FD whose left side you already have. Candidate key (minimal superkey): <b className="text-ink">{keys.map((k) => `{${k.map((a) => SHORT[a]).join(", ")}}`).join(", ")}</b>.</p>
        </>
      )}
    </Lab>
  );
}

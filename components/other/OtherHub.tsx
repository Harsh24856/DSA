"use client";
// Hub of the "Other" section: one card per CS core subject with chapter progress.
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Atom, Calculator, Code, Cpu, Cube, Database, Exam, Globe, HardDrives, ShareNetwork, Table, type Icon } from "@phosphor-icons/react";
import { chapterKey } from "@/lib/other";
import { usePatterns } from "@/lib/patternStore";
import { Bar, Count } from "../ui";
import { ProgressCard } from "../ProgressCard";

export type SubjectSummary = { id: string; name: string; short: string; blurb: string; chapters: string[]; cards: string[]; labs: number };   // cards: tick keys of its interview questions
const ICON: Record<string, Icon> = { os: Cpu, dbms: Database, cn: Globe, sql: Table, oops: Cube, aptitude: Calculator, syntax: Code, react: Atom, node: HardDrives, design: ShareNetwork };

export function OtherHub({ subjects, oaCount, syntaxCount }: { subjects: SubjectSummary[]; oaCount: number; syntaxCount: number }) {
  const { done } = usePatterns();
  const doneIn = (s: SubjectSummary) => s.chapters.filter((c) => done[chapterKey(s.id, c)]).length;
  const total = subjects.reduce((n, s) => n + s.chapters.length, 0), finished = subjects.reduce((n, s) => n + doneIn(s), 0);
  const cards = subjects.reduce((n, s) => n + s.cards.length, 0), labs = subjects.reduce((n, s) => n + s.labs, 0);
  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="t-h2">CS core subjects</h2>
          <p className="mt-1 text-sm text-muted">Operating systems, DBMS, networks, SQL, OOP, aptitude, system design, and the languages and frameworks you will code in: C++, Java, Python, JavaScript, TypeScript, React, Node and Express. Each chapter has short notes, diagrams, interactive labs and interview questions with answers you open after trying.</p>
          <div className="mt-3"><ProgressCard otherTotal={total} /></div>
        </div>
        <div className="flex shrink-0 gap-6">
          <div><span className="num text-2xl font-semibold"><Count value={finished} /><span className="text-sm font-normal text-muted"> / {total}</span></span><div className="text-xs text-muted">chapters done</div></div>
          <div><Count value={cards} className="text-2xl font-semibold" /><div className="text-xs text-muted">questions</div></div>
          <div><Count value={labs} className="text-2xl font-semibold" /><div className="text-xs text-muted">labs</div></div>
        </div>
      </section>
      <Link href="/other/oa" className="card group flex items-center gap-3 p-6 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
        <span className="badge-icon size-9 shrink-0"><Exam size={18} aria-hidden /></span>
        <div className="min-w-0 flex-1"><h3 className="t-h3">OA questions</h3><p className="mt-1 text-sm text-muted">{oaCount} multiple-choice questions on OS, DBMS, networks, SQL, OOP and aptitude. Practice by subject or sit a timed test.</p></div>
        <ArrowRight size={18} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
      </Link>
      <Link href="/syntax" className="card group flex items-center gap-3 p-6 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
        <span className="badge-icon size-9 shrink-0"><Code size={18} aria-hidden /></span>
        <div className="min-w-0 flex-1"><h3 className="t-h3">Syntax in six languages</h3><p className="mt-1 text-sm text-muted">{syntaxCount} runnable programs in C++, Java, Python, JavaScript, TypeScript and Rust, from printing to every DSA map, set and heap.</p></div>
        <ArrowRight size={18} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
      </Link>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s, k) => {
          const I = ICON[s.id] ?? Cube, dn = doneIn(s);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(k, 4) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              <Link href={`/other/${s.id}`} className="card group flex h-full flex-col gap-3 p-6 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><span className="badge-icon size-9"><I size={18} aria-hidden /></span><h3 className="t-h3">{s.name}</h3></div>
                  <ArrowRight size={18} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                </div>
                <p className="line-clamp-3 flex-1 text-sm text-muted">{s.blurb}</p>
                <div className="flex flex-wrap gap-2"><span className="pill pill-muted">{s.chapters.length} chapters</span><span className="pill pill-muted">{s.cards.length} questions</span>{s.labs > 0 && <span className="pill pill-muted">{s.labs} {s.labs === 1 ? "lab" : "labs"}</span>}</div>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-muted"><span>chapters</span><span className="num">{dn} / {s.chapters.length}</span></div>
                  <Bar value={dn} max={s.chapters.length} />
                  <div className="mb-2 mt-3 flex justify-between text-xs text-muted"><span>questions ticked</span><span className="num">{s.cards.filter((k) => done[k]).length} / {s.cards.length}</span></div>
                  <Bar value={s.cards.filter((k) => done[k]).length} max={s.cards.length || 1} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

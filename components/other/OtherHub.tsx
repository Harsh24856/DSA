"use client";
// Hub of the "Other" section: one card per CS core subject with chapter progress.
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Atom, Calculator, Code, Cpu, Cube, Database, Globe, HardDrives, Table, type Icon } from "@phosphor-icons/react";
import { chapterKey } from "@/lib/other";
import { usePatterns } from "@/lib/patternStore";
import { Bar, Count } from "../ui";

export type SubjectSummary = { id: string; name: string; short: string; blurb: string; chapters: string[]; cards: number; labs: number };
const ICON: Record<string, Icon> = { os: Cpu, dbms: Database, cn: Globe, sql: Table, oops: Cube, aptitude: Calculator, syntax: Code, react: Atom, node: HardDrives };

export function OtherHub({ subjects }: { subjects: SubjectSummary[] }) {
  const { done } = usePatterns();
  const doneIn = (s: SubjectSummary) => s.chapters.filter((c) => done[chapterKey(s.id, c)]).length;
  const total = subjects.reduce((n, s) => n + s.chapters.length, 0), finished = subjects.reduce((n, s) => n + doneIn(s), 0);
  const cards = subjects.reduce((n, s) => n + s.cards, 0), labs = subjects.reduce((n, s) => n + s.labs, 0);
  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="t-h2">CS core subjects</h2>
          <p className="mt-1 text-[14px] text-muted">Operating systems, DBMS, networks, SQL, OOP, aptitude, and the languages and frameworks you will code in: C++, Java, Python, JavaScript, TypeScript, React, Node and Express. Each chapter has short notes, diagrams, interactive labs and interview questions with answers you open after trying.</p>
        </div>
        <div className="flex shrink-0 gap-6">
          <div><span className="num text-[26px] font-semibold"><Count value={finished} /><span className="text-[13px] font-normal text-muted"> / {total}</span></span><div className="text-[12px] text-muted">chapters done</div></div>
          <div><Count value={cards} className="text-[26px] font-semibold" /><div className="text-[12px] text-muted">questions</div></div>
          <div><Count value={labs} className="text-[26px] font-semibold" /><div className="text-[12px] text-muted">labs</div></div>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s, k) => {
          const I = ICON[s.id] ?? Cube, dn = doneIn(s);
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: k * 0.04, ease: [0.16, 1, 0.3, 1] }}>
              <Link href={`/other/${s.id}`} className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent/60 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><span className="badge-icon size-9"><I size={18} aria-hidden /></span><h3 className="t-h3">{s.name}</h3></div>
                  <ArrowRight size={18} className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                </div>
                <p className="line-clamp-3 flex-1 text-[13px] text-muted">{s.blurb}</p>
                <div className="flex flex-wrap gap-1.5"><span className="pill pill-muted">{s.chapters.length} chapters</span><span className="pill pill-muted">{s.cards} questions</span>{s.labs > 0 && <span className="pill pill-muted">{s.labs} {s.labs === 1 ? "lab" : "labs"}</span>}</div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[12px] text-muted"><span>progress</span><span className="num">{dn} / {s.chapters.length}</span></div>
                  <Bar value={dn} max={s.chapters.length} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

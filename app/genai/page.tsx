"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, BookOpen, ChatsCircle, Check, Compass, ListBullets, TreeStructure, type Icon } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { GENAI } from "@/lib/genai/content";
import { Bar, Count } from "@/components/ui";

const MODULES = GENAI.filter((s) => s.module);
const REFS: [string, Icon, string][] = [["start", Compass, "Roadmap, setup, and what matters vs hype"], ["interview", ChatsCircle, "40 questions with short answers"], ["design", TreeStructure, "Eight-step framework for design rounds"], ["glossary", ListBullets, "Terms you will hear every day"], ["resources", BookOpen, "Where to go deeper, by module"]];

export default function GenAI() {
  const { done } = usePatterns();
  const isDone = (id: string) => !!done[`genai:${id}`];
  const n = MODULES.filter((m) => isDone(m.id)).length, nextUp = MODULES.find((m) => !isDone(m.id));

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="t-h2">Gen AI Engineer Playbook</h2>
          <p className="mt-1 text-[14px] text-muted">From neural network basics to production agents. Each module has notes, diagrams, runnable code, practice questions with answers and one project to build. Ticks sync to your account and never change your daily plan.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 md:w-[220px]">
          <div><span className="num text-[26px] font-semibold"><Count value={n} /><span className="text-[13px] font-normal text-muted"> / {MODULES.length}</span></span><div className="text-[12px] text-muted">modules done</div></div>
          <Bar value={n} max={MODULES.length} />
          <Link href={`/genai/${n ? nextUp?.id ?? "m9" : "start"}`} className="btn btn-primary btn-sm">{n ? (nextUp ? `Continue: ${nextUp.nav}` : "Review the capstone") : "Start here"}<ArrowRight size={14} aria-hidden /></Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m, k) => {
          const ok = isDone(m.id);
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: k * 0.03, ease: [0.16, 1, 0.3, 1] }}>
              <Link href={`/genai/${m.id}`} className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent/60 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="t-eyebrow">{m.eyebrow}</div>
                    <h3 className="t-h3 mt-0.5">{m.title}</h3>
                  </div>
                  {ok ? <span className="tick pointer-events-none mt-0.5" data-on aria-label="Done"><Check size={14} weight="bold" aria-hidden /></span>
                    : <ArrowRight size={18} className="mt-0.5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />}
                </div>
                <p className="line-clamp-3 flex-1 text-[13px] text-muted">{m.lede}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.chips.slice(0, 3).map((c) => <span key={c} className="pill pill-muted">{c}</span>)}
                  {m.chips.length > 3 && <span className="pill pill-muted">+{m.chips.length - 3} more</span>}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <section aria-labelledby="gx-ref" className="flex flex-col gap-3">
        <h2 id="gx-ref" className="t-h3">Start, prepare and look things up</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {REFS.map(([id, I, blurb]) => {
            const s = GENAI.find((x) => x.id === id)!;
            return (
              <Link key={id} href={`/genai/${id}`} className="card flex items-start gap-3 p-4 transition hover:border-accent/60 active:scale-[0.99]">
                <span className="badge-icon"><I size={16} aria-hidden /></span>
                <span className="min-w-0"><span className="block text-[14px] font-semibold">{s.nav}</span><span className="block text-[12px] text-muted">{blurb}</span></span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

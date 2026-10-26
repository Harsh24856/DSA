"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { ALL_LC, TOPICS, topicProblems } from "@/lib/patterns";
import { Bar, Card, Count } from "@/components/ui";

export default function Patterns() {
  const { done } = usePatterns();
  const reduce = useReducedMotion();
  const solved = ALL_LC.filter((lc) => done[lc]).length;
  const patternCount = TOPICS.reduce((a, t) => a + t.patterns.length, 0);

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="text-[18px] font-semibold">Learn by pattern</h2>
          <p className="mt-1 text-[14px] text-muted">Each pattern has the idea, a step-by-step visualiser, a code template, best, average and worst complexity, common traps, then practice problems. These problems are tracked here only and never change your daily plan.</p>
        </div>
        <div className="flex shrink-0 gap-6">
          <div><Count value={TOPICS.length} className="text-[26px] font-semibold" /><div className="text-[12px] text-muted">topics</div></div>
          <div><Count value={patternCount} className="text-[26px] font-semibold" /><div className="text-[12px] text-muted">patterns</div></div>
          <div><span className="num text-[26px] font-semibold"><Count value={solved} /><span className="text-[14px] text-muted"> / {ALL_LC.length}</span></span><div className="text-[12px] text-muted">problems solved</div></div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOPICS.map((t, k) => {
          const probs = topicProblems(t), dn = probs.filter((p) => done[p[0]]).length;
          return (
            <motion.div key={t.id} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: reduce ? 0 : k * 0.03, ease: [0.16, 1, 0.3, 1] }}>
              <Link href={`/patterns/${t.id}`} className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-accent/60 active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[16px] font-semibold">{t.name}</h3>
                  <ArrowRight size={18} className="mt-0.5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                </div>
                <p className="line-clamp-3 flex-1 text-[13px] text-muted">{t.blurb}</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.patterns.slice(0, 4).map((p) => <span key={p.n} className="pill bg-surface-2 text-muted">{p.name}</span>)}
                  {t.patterns.length > 4 && <span className="pill bg-surface-2 text-muted">+{t.patterns.length - 4} more</span>}
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-[12px] text-muted"><span>{t.patterns.length} patterns</span><span className="num">{dn} / {probs.length} solved</span></div>
                  <Bar value={dn} max={probs.length} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <Card title="How to use this section" sub="About 30 minutes per pattern">
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-[14px] text-muted marker:text-accent">
          <li>Read when to use it and the core idea. Say the idea out loud in one sentence.</li>
          <li>Step through the visualiser slowly, then change the input and predict each step before pressing next.</li>
          <li>Write the template from memory, then compare.</li>
          <li>Solve the first two problems without hints; tick them here when done.</li>
        </ol>
      </Card>
    </div>
  );
}

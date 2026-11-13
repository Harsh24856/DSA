"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { ALL_LC, patternByKey, STUDY_PATH, TOPICS, topicById, topicProblems } from "@/lib/patterns";
import { STAGES } from "@/lib/patterns/order";
import { Bar, Card, Count } from "@/components/ui";

export default function Patterns() {
  const { done } = usePatterns();
  const solved = ALL_LC.filter((lc) => done[lc]).length;
  const patternCount = TOPICS.reduce((a, t) => a + t.patterns.length, 0);

  return (
    <div className="study flex flex-col gap-6">
      <section className="glass flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="t-h2">Learn by pattern</h2>
          <p className="mt-1 text-base text-muted">Study the topics in the order below, from stage 1 to stage 6, and each topic's patterns from first to last: nothing is taught before what it needs. Each pattern page lists what to learn first. Each topic opens with the data structure itself; each pattern has the idea, a step-by-step visualiser, a code template, best, average and worst complexity, common traps, then practice problems. These problems are tracked here only and never change your daily plan.</p>
        </div>
        <div className="flex shrink-0 gap-6">
          <div><Count value={TOPICS.length} className="text-2xl font-semibold" /><div className="text-sm text-muted">topics</div></div>
          <div><Count value={patternCount} className="text-2xl font-semibold" /><div className="text-sm text-muted">patterns</div></div>
          <div><span className="num text-2xl font-semibold"><Count value={solved} /><span className="text-base font-normal text-muted"> / {ALL_LC.length}</span></span><div className="text-sm text-muted">problems solved</div></div>
        </div>
      </section>

      {STAGES.map((st, si) => (
        <section key={st.title} aria-labelledby={`stage-${si}`} className="flex flex-col gap-3">
          <div>
            <h2 id={`stage-${si}`} className="t-h2"><span className="num mr-2 text-accent">Stage {si + 1}</span>{st.title}</h2>
            <p className="mt-0.5 text-base text-muted">{st.blurb}</p>
          </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {st.topics.map((id) => {
          const t = topicById(id)!, k = TOPICS.indexOf(t);
          const probs = topicProblems(t), dn = probs.filter((p) => done[p[0]]).length;
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: k * 0.03, ease: [0.22, 1, 0.36, 1] }}>
              <Link href={`/patterns/${t.id}`} className="glass group flex h-full flex-col gap-3 p-6 transition hover:border-line-strong active:scale-[0.99]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="t-h3"><span className="num mr-2 text-muted">{k + 1}</span>{t.name}</h3>
                  <ArrowRight size={18} className="mt-0.5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
                </div>
                <p className="line-clamp-3 flex-1 text-base text-muted">{t.blurb}</p>
                <div className="flex flex-wrap gap-2">
                  {t.patterns.slice(0, 4).map((p) => <span key={p.n} className="pill pill-muted h-auto max-w-full whitespace-normal py-0.5">{p.name}</span>)}
                  {t.patterns.length > 4 && <span className="pill pill-muted">+{t.patterns.length - 4} more</span>}
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm text-muted"><span>{t.patterns.length} patterns</span><span className="num">{dn} / {probs.length} solved</span></div>
                  <Bar value={dn} max={probs.length} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
        </section>
      ))}

      <details className="glass group p-6">
        <summary className="cursor-pointer list-none">
          <h2 className="t-h2 inline">The full study path, pattern by pattern</h2>
          <p className="mt-0.5 text-base text-muted">All {STUDY_PATH.length} patterns in one order: each comes only after the patterns it needs, even from another topic.</p>
        </summary>
        <ol className="mt-4 grid gap-x-6 gap-y-1 text-base sm:grid-cols-2 xl:grid-cols-3">
          {STUDY_PATH.map((key, i) => {
            const x = patternByKey(key)!;
            return (
              <li key={key} className="flex gap-2">
                <span className="num w-8 shrink-0 text-right text-muted">{i + 1}</span>
                <Link href={`/patterns/${x.t.id}#p-${x.p.n}`} className="min-w-0 hover:text-accent"><span className="text-muted">{x.t.name}:</span> {x.p.name}</Link>
              </li>
            );
          })}
        </ol>
      </details>

      <Card title="How to use this section" sub="About 30 minutes per pattern">
        <ol className="flex list-decimal flex-col gap-2 pl-6 text-base text-muted marker:text-accent">
          <li>Take the topics in order, and start each one with its Overview: what the structure is, how it is built and what each operation costs.</li>
          <li>Read when to use it and the core idea. Say the idea out loud in one sentence.</li>
          <li>Step through the visualiser slowly, then change the input and predict each step before pressing next.</li>
          <li>Write the template from memory, then compare.</li>
          <li>Solve the first two problems without hints; tick them here when done.</li>
        </ol>
      </Card>
    </div>
  );
}

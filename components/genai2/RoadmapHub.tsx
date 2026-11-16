"use client";
// Hub of the Gen AI section: 11 stages of modules, each row a built module, its old page, or coming soon.
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react";
import { STAGES, entry, moduleKey, nextUp } from "@/lib/genai2/core";
import { usePatterns } from "@/lib/patternStore";
import { Bar, Count } from "@/components/ui";
import { ProgressCard } from "@/components/ProgressCard";

const ALL = STAGES.flatMap((s) => s.modules);

export function RoadmapHub() {
  const { done } = usePatterns();
  const reduce = useReducedMotion();
  const isDone = (id: string) => !!done[moduleKey(id)];
  const doneN = ALL.filter((m) => m.built && isDone(m.id)).length;
  const next = nextUp(done), nextE = next ? entry(next) : undefined;
  const cont = !nextE ? undefined : nextE.built ? `/genai/${nextE.id}` : nextE.old ? `/genai/${nextE.old}` : `#stage-${STAGES.find((s) => s.modules.some((m) => m.id === nextE.id))!.n}`;
  const first = ALL[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[62ch]">
          <h2 className="t-h2">Gen AI roadmap</h2>
          <p className="mt-1 text-sm text-muted">{STAGES.length} stages from Python habits to production agents. Each module is built to be seen and tried, with diagrams, labs and practice questions. Ticks sync to your account and never change your daily plan.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 md:w-[220px]">
          <div><span className="num text-2xl font-semibold"><Count value={doneN} /><span className="text-sm font-normal text-muted"> / {ALL.length}</span></span><div className="text-xs text-muted">modules done</div></div>
          <Bar value={doneN} max={ALL.length} />
          {cont ? <Link href={cont} className="btn btn-primary btn-sm">Continue: {nextE!.title}<ArrowRight size={14} aria-hidden /></Link>
            : <Link href={`/genai/${first.id}`} className="btn btn-primary btn-sm">Review {first.title}<ArrowRight size={14} aria-hidden /></Link>}
          <ProgressCard />
        </div>
      </section>

      {STAGES.map((s, k) => {
        const built = s.modules.filter((m) => m.built && isDone(m.id)).length;
        return (
          <motion.section key={s.n} id={`stage-${s.n}`} aria-labelledby={`stage-t-${s.n}`} className="card flex scroll-mt-24 flex-col gap-4 p-6"
            initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(k, 4) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
            <div>
              <div className="t-eyebrow">Stage {s.n}</div>
              <h3 id={`stage-t-${s.n}`} className="t-h3 mt-0.5">{s.title}</h3>
              <p className="mt-1 max-w-[62ch] text-sm text-muted">{s.blurb}</p>
            </div>
            {s.builds.length > 0 && (
              <p className="m-0 flex flex-wrap items-center gap-1 text-xs text-muted">
                <span className="mr-1">Builds on</span>
                {s.builds.map((b) => <a key={b} href={`#stage-${b}`} className="pill pill-muted hover:text-accent">Stage {b}: {STAGES[b].title}</a>)}
              </p>
            )}
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted"><span>modules</span><span className="num">{built} / {s.modules.length}</span></div>
              <Bar value={built} max={s.modules.length} />
            </div>
            <ul className="m-0 grid list-none gap-2 p-0">
              {s.modules.map((m) => {
                const ok = m.built && isDone(m.id);
                return (
                  <li key={m.id} className="tile flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {m.built && <span className="tick pointer-events-none size-5" data-on={ok || undefined} role="img" aria-label={ok ? "Done" : "Not done"}>{ok && <Check size={12} weight="bold" aria-hidden />}</span>}
                      {m.built ? <Link href={`/genai/${m.id}`} className="text-sm font-semibold hover:text-accent">{m.title}</Link> : <span className="text-sm font-semibold">{m.title}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.id === next && <span className="pill pill-accent">Next up</span>}
                      {!m.built && (m.old ? <Link href={`/genai/${m.old}`} className="pill pill-muted hover:text-accent focus-visible:text-accent">Old version<ArrowUpRight size={12} aria-hidden /></Link> : <span className="pill pill-muted">Coming soon</span>)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        );
      })}
    </div>
  );
}

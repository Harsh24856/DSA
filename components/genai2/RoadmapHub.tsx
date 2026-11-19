"use client";
// Home of the Gen AI course: progress and Continue, a stage strip to jump anywhere, then the learning path, one stage at a
// time. The stage you are on is open; the others show their progress and open on click.
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CaretDown, Check, Code } from "@phosphor-icons/react";
import { STAGES, entry, moduleKey, nextUp } from "@/lib/genai2/core";
import { usePatterns } from "@/lib/patternStore";
import { Bar, Count } from "@/components/ui";
import { ProgressCard } from "@/components/ProgressCard";

const ALL = STAGES.flatMap((s) => s.modules);
const stageOf = (id: string) => STAGES.find((s) => s.modules.some((m) => m.id === id))!.n;

export type LabCard = { id: string; title: string; blurb: string; steps: number };

export function RoadmapHub({ labs = [], children }: { labs?: LabCard[]; children?: React.ReactNode }) {
  const { done } = usePatterns();
  const isDone = (id: string) => !!done[moduleKey(id)];
  const doneN = ALL.filter((m) => isDone(m.id)).length;
  const next = nextUp(done), nextE = next ? entry(next) : undefined;
  const here = nextE ? stageOf(nextE.id) : 0;
  const [open, setOpen] = useState<Set<number>>(() => new Set([here]));
  const show = (n: number, only = false) => setOpen((o) => { const x = new Set(only ? [] : o); if (!only && x.has(n)) x.delete(n); else x.add(n); return x; });

  return (
    <div className="flex flex-col gap-6">
      <section className="card grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-end" aria-labelledby="gh-title">
        <div>
          <h2 id="gh-title" className="t-title">From arrays to agents</h2>
          <p className="mt-2 max-w-[58ch] text-base leading-relaxed text-muted">{STAGES.length} stages, {ALL.length} modules: from NumPy arrays to production agents. Every module is pictures first, then questions.</p>
        </div>
        <div className="grid gap-3">
          <div className="flex items-baseline justify-between"><span className="num text-2xl font-semibold"><Count value={doneN} /><span className="text-sm font-normal text-muted"> / {ALL.length}</span></span><span className="text-xs text-muted">modules done</span></div>
          <Bar value={doneN} max={ALL.length} />
          {nextE
            ? <Link href={`/genai/${nextE.id}`} className="btn btn-primary w-full justify-between"><span className="truncate">Continue: {nextE.title}</span><ArrowRight size={16} className="shrink-0" aria-hidden /></Link>
            : <Link href={`/genai/${ALL[0].id}`} className="btn btn-primary w-full justify-between">Start again<ArrowRight size={16} aria-hidden /></Link>}
          <ProgressCard />
        </div>
      </section>

      {/* every stage at a glance; a click opens it below */}
      <nav aria-label="Stages" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="m-0 flex w-max list-none gap-2 p-0 sm:w-auto sm:flex-wrap">
          {STAGES.map((s) => {
            const n = s.modules.filter((m) => isDone(m.id)).length, full = n === s.modules.length;
            return (
              <li key={s.n}>
                <a href={`#stage-${s.n}`} onClick={() => show(s.n, true)} aria-current={s.n === here ? "step" : undefined}
                  className="chip gap-2 whitespace-nowrap">
                  <span className="num font-semibold">{s.n}</span>{s.title}
                  {full ? <Check size={12} weight="bold" className="text-accent" aria-label="complete" /> : <span className="num text-xs opacity-75">{n}/{s.modules.length}</span>}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {children}

      {labs.length > 0 && (
        <section aria-labelledby="gl-labs" className="flex flex-col gap-3">
          <h2 id="gl-labs" className="t-h3">Build it from scratch</h2>
          <ul className={`m-0 grid list-none gap-3 p-0 ${labs.length > 1 ? "md:grid-cols-2" : ""}`}>
            {labs.map((l) => (
              <li key={l.id}>
                <Link href={`/genai/lab/${l.id}`} className="card flex h-full items-start gap-3 p-4 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                  <span className="badge-icon"><Code size={16} aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{l.title}</span><span className="mt-1 block text-xs text-muted">{l.blurb}</span></span>
                  <span className="pill pill-muted num shrink-0 text-xs">{l.steps} steps</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="gp-title" className="flex flex-col gap-3">
        <h2 id="gp-title" className="t-h3">The path</h2>
        <ol className="m-0 grid list-none gap-0 p-0">
          {STAGES.map((s, k) => {
            const n = s.modules.filter((m) => isDone(m.id)).length, isOpen = open.has(s.n), full = n === s.modules.length;
            return (
              <li key={s.n} id={`stage-${s.n}`} className="grid scroll-mt-28 grid-cols-[28px_minmax(0,1fr)] gap-x-2 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-x-3">
                {/* the rail: one node per stage, a line down to the next */}
                <div className="flex flex-col items-center">
                  <span className="num grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold sm:size-9 sm:text-sm"
                    style={{ borderColor: full ? "var(--accent)" : s.n === here ? "var(--accent)" : "var(--line-strong)", background: full ? "var(--accent)" : "var(--surface)", color: full ? "var(--accent-ink)" : "var(--ink)" }}>
                    {full ? <Check size={16} weight="bold" aria-label="complete" /> : s.n}
                  </span>
                  {k < STAGES.length - 1 && <span className="my-1 w-0.5 flex-1 rounded-full bg-line" aria-hidden />}
                </div>
                <div className={`card mb-4 min-w-0 ${isOpen ? "" : "hover:border-line-strong"}`}>
                  <button type="button" onClick={() => show(s.n)} aria-expanded={isOpen} aria-controls={`stage-mods-${s.n}`}
                    className="grid w-full gap-2 p-4 text-left sm:p-6">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="t-h3 block">{s.title}</span>
                        <span className="mt-1 block max-w-[62ch] text-sm text-muted">{s.blurb}</span>
                      </span>
                      <CaretDown size={16} className={`mt-1 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                    </span>
                    <span className="flex items-center gap-3"><Bar value={n} max={s.modules.length} className="flex-1" /><span className="num shrink-0 text-xs text-muted">{n} / {s.modules.length}</span></span>
                  </button>
                  {isOpen && (
                    <div id={`stage-mods-${s.n}`} className="grid gap-3 border-t border-line p-4 sm:px-6">
                      {s.builds.length > 0 && <p className="m-0 text-xs text-muted">Builds on {s.builds.map((b, i) => <span key={b}>{i ? ", " : ""}<a href={`#stage-${b}`} onClick={() => show(b, true)} className="font-medium text-ink underline underline-offset-2 hover:text-accent">{STAGES[b].title}</a></span>)}</p>}
                      <ol className="m-0 grid list-none gap-2 p-0 md:grid-cols-2">
                        {s.modules.map((m, i) => {
                          const ok = isDone(m.id);
                          return (
                            <li key={m.id}>
                              <Link href={`/genai/${m.id}`} className="tile flex h-full items-center gap-3 p-3 transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
                                <span className="tick pointer-events-none size-6 shrink-0" data-on={ok || undefined} aria-hidden>{ok ? <Check size={12} weight="bold" /> : <span className="num text-xs text-muted">{i + 1}</span>}</span>
                                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{m.title}<span className="sr-only">{ok ? " (done)" : ""}</span></span>
                                {m.id === next && <span className="pill pill-accent shrink-0">Next up</span>}
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                      {s.n === 0 && <p className="m-0 text-xs text-muted">Plain Python (dataclasses, generators, JSON, pydantic, asyncio) is in the <Link href="/syntax#gx-dataclass" className="font-medium text-ink underline underline-offset-2 hover:text-accent">Python for Gen AI</Link> syntax track.</p>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

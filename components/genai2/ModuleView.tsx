"use client";
// One Gen AI module: the course outline beside it (a sticky sidebar on wide screens, a drawer above it on phones),
// then the module head, its visual blocks, key points, lab, real-world stories, questions and prev/next.
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowSquareOut, Check, Code, ListBullets } from "@phosphor-icons/react";
import { moduleKey, STAGES } from "@/lib/genai2/core";
import type { GModule } from "@/lib/genai2/core";
import { usePatterns } from "@/lib/patternStore";
import { BlockView } from "./Blocks";
import { CourseOutline } from "./CourseOutline";
import { ginline, Questions } from "./Questions";

type Nav = { id: string; title: string } | null;
export type LabLink = { id: string; title: string; steps: number } | null;

export function ModuleView({ module: m, prev, next, lab = null }: { module: GModule; prev: Nav; next: Nav; lab?: LabLink }) {
  const { done, toggle } = usePatterns();
  const id = m.id, on = !!done[moduleKey(id)];
  const stage = STAGES.find((s) => s.n === m.stage)!;
  const pos = stage.modules.findIndex((e) => e.id === id) + 1;
  const jumps: [string, string][] = [["gm-learn", "Learn"], ["gk-title", "Key points"], ...(lab ? [["gl-title", "Lab"] as [string, string]] : []), ["gq-list", "Questions"]];

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
        <Link href="/genai" className="mb-3 inline-flex items-center gap-2 px-2 text-sm font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />Course home</Link>
        <CourseOutline current={id} />
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <Link href="/genai" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />Course home</Link>
          <details className="group relative">
            <summary className="btn btn-sm list-none"><ListBullets size={16} aria-hidden />Outline</summary>
            <div className="card absolute right-0 z-20 mt-2 max-h-[70dvh] w-[min(320px,calc(100vw-32px))] overflow-y-auto p-3">
              <CourseOutline current={id} />
            </div>
          </details>
        </div>

        <section className="card flex flex-col gap-4 p-6" aria-labelledby="gx-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={`/genai#stage-${stage.n}`} className="t-eyebrow hover:text-accent">Stage {stage.n}: {stage.title} · {pos} of {stage.modules.length}</Link>
            <button type="button" onClick={() => toggle(moduleKey(id), !on)} aria-pressed={on} className="btn btn-sm">
              <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>{on ? "Done" : "Mark done"}
            </button>
          </div>
          <h2 id="gx-title" className="t-title">{m.title}</h2>
          <p className="max-w-[72ch] text-base leading-relaxed text-muted">{ginline(m.hook)}</p>
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {jumps.map(([to, label]) => <a key={to} href={`#${to}`} className="chip">{label}</a>)}
          </nav>
        </section>

        <div id="gm-learn" className="flex scroll-mt-24 flex-col gap-6">
          {m.blocks.map((b, k) => <BlockView key={k} b={b} seed={`${id}:predict:${k}`} />)}
        </div>

        {m.keyPoints.length > 0 && (
          <section className="card flex flex-col gap-3 p-6" aria-labelledby="gk-title">
            <h2 id="gk-title" className="t-h2 scroll-mt-24">Key points</h2>
            <ul className="grid gap-2 text-sm leading-relaxed">{m.keyPoints.map((p) => <li key={p} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-accent" aria-hidden /><span>{ginline(p)}</span></li>)}</ul>
          </section>
        )}

        {lab && (
          <section className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="gl-title">
            <div className="flex items-start gap-3">
              <span className="badge-icon"><Code size={16} aria-hidden /></span>
              <div>
                <h2 id="gl-title" className="t-h2 scroll-mt-24">Build it yourself</h2>
                <p className="mt-1 text-sm text-muted">{lab.title}: {lab.steps} steps, each checked by hidden tests.</p>
              </div>
            </div>
            <Link href={`/genai/lab/${lab.id}`} className="btn btn-primary w-fit">Open the lab<ArrowRight size={16} aria-hidden /></Link>
          </section>
        )}

        {m.real && m.real.length > 0 && (
          <section className="card flex flex-col gap-3 p-6" aria-labelledby="gr-title">
            <h2 id="gr-title" className="t-h2">In the real world</h2>
            {m.real.map((s) => (
              <article key={s.who + s.when} className="inset grid gap-2 p-4 text-sm leading-relaxed">
                <div className="flex flex-wrap items-center gap-2"><b>{s.who}</b><span className="pill pill-muted num text-xs">{s.when}</span></div>
                <p>{s.what}</p>
                <p><b>Takeaway:</b> {s.takeaway}</p>
                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-muted hover:text-accent">Read the source<ArrowSquareOut size={12} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
              </article>
            ))}
          </section>
        )}

        <div id="gq-list" className="scroll-mt-24"><Questions moduleId={id} questions={m.questions} /></div>

        <nav className="grid gap-3 sm:grid-cols-2" aria-label="Modules">
          {prev ? <Link href={`/genai/${prev.id}`} className="btn btn-nav justify-start gap-3 whitespace-normal"><ArrowLeft size={16} aria-hidden /><span><span className="block text-xs font-normal text-muted">Previous</span>{prev.title}</span></Link> : <span />}
          {next && <Link href={`/genai/${next.id}`} className="btn btn-nav justify-end gap-3 text-right whitespace-normal"><span><span className="block text-xs font-normal text-muted">Next</span>{next.title}</span><ArrowRight size={16} aria-hidden /></Link>}
        </nav>
      </div>
    </div>
  );
}

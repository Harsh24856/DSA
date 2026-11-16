"use client";
// One rebuilt Gen AI module: head, visual blocks, key points, questions, prev/next along the roadmap.
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowSquareOut, Check } from "@phosphor-icons/react";
import { moduleKey, MODULES, STAGES } from "@/lib/genai2";
import { usePatterns } from "@/lib/patternStore";
import { BlockView } from "./Blocks";
import { Questions } from "./Questions";

export function ModuleView({ id }: { id: string }) {
  const { done, toggle } = usePatterns();
  const m = MODULES[id], on = !!done[moduleKey(id)];
  const stage = STAGES.find((s) => s.n === m.stage);
  const built = STAGES.flatMap((s) => s.modules).filter((e) => e.built);
  const i = built.findIndex((e) => e.id === id), prev = built[i - 1], next = built[i + 1];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/genai" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All modules</Link>
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="gx-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="t-eyebrow">Stage {m.stage} · {stage?.title}</span>
          <button type="button" onClick={() => toggle(moduleKey(id), !on)} aria-pressed={on} className="btn btn-sm">
            <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Module done
          </button>
        </div>
        <h2 id="gx-title" className="t-title">{m.title}</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{m.hook}</p>
      </section>

      {m.blocks.map((b, k) => <BlockView key={k} b={b} seed={`${id}:predict:${k}`} />)}

      {m.keyPoints.length > 0 && (
        <section className="card flex flex-col gap-3 p-6" aria-labelledby="gk-title">
          <h2 id="gk-title" className="t-h2">Key points</h2>
          <ul className="grid gap-2 text-sm leading-relaxed">{m.keyPoints.map((p) => <li key={p} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-accent" aria-hidden />{p}</li>)}</ul>
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

      <Questions moduleId={id} questions={m.questions} />

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Modules">
        {prev ? <Link href={`/genai/${prev.id}`} className="btn btn-nav justify-start gap-3"><ArrowLeft size={16} aria-hidden /><span><span className="block text-xs font-normal text-muted">Previous</span>{prev.title}</span></Link> : <span />}
        {next && <Link href={`/genai/${next.id}`} className="btn btn-nav justify-end gap-3 text-right"><span><span className="block text-xs font-normal text-muted">Next</span>{next.title}</span><ArrowRight size={16} aria-hidden /></Link>}
      </nav>
    </div>
  );
}

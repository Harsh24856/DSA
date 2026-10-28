"use client";
// One Gen AI playbook page: head (with the Module done tick for modules), the section's content, prev/next links.
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { GENAI } from "@/lib/genai/content";
import { usePatterns } from "@/lib/patternStore";
import { GenaiDoc } from "./GenaiDoc";

export function GenaiView({ id }: { id: string }) {
  const { done, toggle } = usePatterns();
  const i = GENAI.findIndex((s) => s.id === id), s = GENAI[i], prev = GENAI[i - 1], next = GENAI[i + 1];
  const on = !!done[`genai:${id}`];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/genai" className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All modules</Link>
      <section className="card flex flex-col gap-3 p-5" aria-labelledby="gx-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="t-eyebrow">{s.eyebrow}</span>
          {s.module && (
            <button type="button" onClick={() => toggle(`genai:${id}`, !on)} aria-pressed={on} className="btn btn-sm">
              <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Module done
            </button>
          )}
        </div>
        <h2 id="gx-title" className="t-title">{s.title}</h2>
        {s.lede && <p className="max-w-[72ch] text-[15px] leading-relaxed text-muted">{s.lede}</p>}
        {s.chips.length > 0 && <div className="flex flex-wrap gap-1.5">{s.chips.map((c) => <span key={c} className="pill pill-muted">{c}</span>)}</div>}
        {s.toc.length > 2 && (
          <nav aria-label="On this page" className="mt-2 border-t border-line pt-4">
            <h3 className="t-eyebrow mb-2">On this page</h3>
            <ol className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {s.toc.map((t, k) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="flex gap-2.5 rounded-control py-1 text-[14px] transition-colors hover:text-accent">
                    <span className="num w-5 shrink-0 pt-px text-[12px] text-muted">{String(k + 1).padStart(2, "0")}</span>
                    <span className="min-w-0"><span className="font-medium">{t.title}</span><span className="text-muted"> · {t.tag}</span></span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </section>

      <GenaiDoc html={s.html} />

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Playbook pages">
        {prev ? <Link href={`/genai/${prev.id}`} className="btn btn-nav justify-start gap-3"><ArrowLeft size={16} aria-hidden /><span><span className="block text-[12px] font-normal text-muted">Previous</span>{prev.nav}</span></Link> : <span />}
        {next && <Link href={`/genai/${next.id}`} className="btn btn-nav justify-end gap-3 text-right"><span><span className="block text-[12px] font-normal text-muted">Next</span>{next.nav}</span><ArrowRight size={16} aria-hidden /></Link>}
      </nav>
    </div>
  );
}

"use client";
// A Gen AI reference page (interview prep, system design, capstone, glossary, resources): sections of blocks, "I can answer"
// questions and reading lists. The same blocks and question cards as the modules, without the module rules.
import Link from "next/link";
import { ArrowLeft, ArrowSquareOut } from "@phosphor-icons/react";
import type { ExtraPage } from "@/lib/genai2/extras/types";
import { BlockView } from "./Blocks";
import { ginline, Questions } from "./Questions";

// a section that is only questions shows its title on the question card, not twice
const onlyQs = (s: ExtraPage["sections"][number]) => !s.blocks.length && !s.links?.length;

export function ExtraView({ page }: { page: ExtraPage }) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/genai" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All modules</Link>
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="gx-title">
        <span className="t-eyebrow">{page.eyebrow}</span>
        <h2 id="gx-title" className="t-title">{page.title}</h2>
        {page.lede && <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{ginline(page.lede)}</p>}
      </section>
      {page.sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-4" aria-label={s.title || s.tag}>
          {(s.title || s.tag) && (
            <div className="flex flex-col gap-1">
              {s.tag && <span className="t-eyebrow">{s.tag}</span>}
              {s.title && !onlyQs(s) && <h2 className="t-h2">{s.title}</h2>}
            </div>
          )}
          {s.blocks.map((b, k) => <BlockView key={k} b={b} seed={`${page.id}:${i}:${k}`} />)}
          {s.links && s.links.length > 0 && (
            <ul className="card grid gap-3 p-6 text-sm leading-relaxed">
              {s.links.map((l) => (
                <li key={l.title + l.url} className="grid gap-1">
                  {l.url
                    ? <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 font-semibold hover:text-accent">{l.title}<ArrowSquareOut size={12} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
                    : <span className="font-semibold">{ginline(l.title)}</span>}
                  {l.note && <span className="text-muted">{ginline(l.note)}</span>}
                </li>
              ))}
            </ul>
          )}
          {s.questions && s.questions.length > 0 && <Questions moduleId={page.id} questions={s.questions} title={onlyQs(s) && s.title ? s.title : "Check yourself"} />}
        </section>
      ))}
    </div>
  );
}

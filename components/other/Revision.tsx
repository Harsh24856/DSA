"use client";
// Last-day revision: a hub of sheets and one sheet per page. Answers can be hidden to quiz yourself, and each sheet has a
// "Revised" tick (`revise:<sheet>` in the patterns store).
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, WarningCircle } from "@phosphor-icons/react";
import type { Sheet, SheetSummary } from "@/lib/revise";
import type { CppTemplate } from "@/lib/revise/cpp";
import { usePatterns } from "@/lib/patternStore";
import { Rich, inline } from "./Rich";

const tick = (id: string) => `revise:${id}`;
const back = (href: string, label: string) => <Link href={href} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted no-underline transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />{label}</Link>;

export function RevisionHub({ sheets }: { sheets: SheetSummary[] }) {
  const { done } = usePatterns();
  const revised = sheets.filter((s) => done[tick(s.id)]).length;
  return (
    <div className="flex flex-col gap-6">
      {back("/other", "CS core")}
      <section className="card flex flex-col gap-2 p-6">
        <h2 className="t-title">Last-day revision</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-muted">One sheet per subject for the night before an interview: the questions interviewers ask, the answer to give in the first ten seconds, and the trap they wait for. Hide the answers to quiz yourself.</p>
        <p className="num text-xs text-muted">{revised} / {sheets.length} sheets revised</p>
      </section>
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sheets.map((s) => (
          <li key={s.id} className="max-w-none">
            <Link href={`/other/revise/${s.id}`} className="card group flex h-full flex-col gap-2 p-6 text-ink no-underline transition hover:border-line-strong hover:bg-surface-2 active:scale-[0.99]">
              <div className="flex items-center gap-3">
                <h3 className="t-h3 min-w-0 flex-1">{s.title}</h3>
                {done[tick(s.id)] ? <Check size={16} weight="bold" className="shrink-0 text-easy" aria-label="revised" /> : <ArrowRight size={16} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />}
              </div>
              <p className="m-0 line-clamp-3 flex-1 text-sm text-muted">{s.blurb}</p>
              <span className="pill pill-muted w-fit">{s.items} items</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Answer({ quiz, children }: { quiz: boolean; children: React.ReactNode }) {
  if (!quiz) return <>{children}</>;
  return <details className="mt-1"><summary className="cursor-pointer text-sm font-medium text-accent">Show answer</summary><div className="mt-1">{children}</div></details>;
}

function CodeCard({ t, quiz }: { t: CppTemplate; quiz: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard?.writeText(t.code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); });
  return (
    <li className="max-w-none rounded-tile border border-line bg-bg p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 font-semibold">{t.title}</p>
          <p className="m-0 text-sm text-muted">Use when: {t.when}. <span className="num">{t.cost}</span></p>
        </div>
        <button type="button" className="btn btn-sm" onClick={copy} aria-label={`Copy ${t.title}`}><Copy size={14} aria-hidden />{copied ? "Copied" : "Copy"}</button>
      </div>
      <Answer quiz={quiz}><pre className="code mt-2 overflow-x-auto text-xs" tabIndex={0}>{t.code}</pre></Answer>
    </li>
  );
}

export function RevisionView({ sheet, prev, next }: { sheet: Sheet; prev?: SheetSummary; next?: SheetSummary }) {
  const { done, toggle } = usePatterns();
  const [quiz, setQuiz] = useState(false);
  const on = !!done[tick(sheet.id)];
  return (
    <div className="gx flex min-w-0 flex-col gap-6">
      {back("/other/revise", "All revision sheets")}
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="rev-title">
        <span className="t-eyebrow">Last-day revision</span>
        <h2 id="rev-title" className="t-title">{sheet.title}</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{sheet.blurb}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-sm" aria-pressed={quiz} onClick={() => setQuiz((q) => !q)}>
            <span className="tick pointer-events-none size-5" data-on={quiz || undefined} aria-hidden>{quiz && <Check size={12} weight="bold" />}</span>Hide answers
          </button>
          <button type="button" className="btn btn-sm" aria-pressed={on} onClick={() => toggle(tick(sheet.id), !on)}>
            <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>Revised
          </button>
        </div>
        <nav aria-label="Sections" className="flex flex-wrap gap-2 border-t border-line pt-3">
          {sheet.sections.map((s) => <a key={s.id} href={`#${s.id}`} className="chip h-auto min-h-7 max-w-full whitespace-normal py-1 text-left no-underline">{s.title}</a>)}
        </nav>
      </section>

      {sheet.sections.map((s) => (
        <section key={s.id} id={s.id} className="card gx-slide min-w-0" aria-labelledby={`h-${s.id}`}>
          <h3 id={`h-${s.id}`}>{s.title}</h3>
          {s.lead && <Rich text={s.lead} className="text-sm text-muted" />}
          {s.points && s.points.length > 0 && <div className="text-sm"><ul>{s.points.map((p) => <li key={p}>{inline(p)}</li>)}</ul></div>}   {/* a bare ul gets the .gx bullets */}
          {s.table && (
            <div className="overflow-x-auto">
              <table className="pg-table w-full text-left text-sm">
                <thead><tr>{s.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{s.table.rows.map((r) => <tr key={r[0]}>{r.map((c, k) => <td key={k} className={k ? "num" : ""}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
          {s.code && <ol className="grid grid-cols-1 gap-3">{s.code.map((t) => <CodeCard key={t.id} t={t} quiz={quiz} />)}</ol>}
          {s.items && (
            <ol className="grid grid-cols-1 gap-3">
              {s.items.map((it, k) => (
                <li key={k} className="max-w-none border-t border-line pt-3 first:border-t-0 first:pt-0">
                  <p className="m-0 font-semibold">{inline(it.q)}</p>
                  <Answer quiz={quiz}>
                    <Rich text={it.a} className="text-sm" />
                    {it.trap && <p className="mt-1 flex gap-1 text-sm text-medium"><WarningCircle size={16} weight="bold" className="mt-0.5 shrink-0" aria-hidden /><span><b>Trap:</b> {inline(it.trap)}</span></p>}
                  </Answer>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Other sheets">
        {prev ? <Link href={`/other/revise/${prev.id}`} className="btn btn-nav justify-start gap-3 text-ink no-underline"><ArrowLeft size={16} aria-hidden /><span><span className="block text-xs font-normal text-muted">Previous sheet</span>{prev.title}</span></Link> : <span />}
        {next && <Link href={`/other/revise/${next.id}`} className="btn btn-nav justify-end gap-3 text-right text-ink no-underline"><span><span className="block text-xs font-normal text-muted">Next sheet</span>{next.title}</span><ArrowRight size={16} aria-hidden /></Link>}
      </nav>
    </div>
  );
}

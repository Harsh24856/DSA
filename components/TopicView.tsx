"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Lightbulb, Lightning, Warning } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { lcUrl, problemsOf, topicById, topicProblems, type Pattern, type Topic } from "@/lib/patterns";
import { PLAIN } from "@/lib/patterns/plain";
import { EXTRAS } from "@/lib/patterns/extras";
import type { Viz } from "@/lib/patterns/types";
import { Visualizer } from "./Visualizer";
import { ComplexityChart } from "./ComplexityChart";
import { Bar } from "./ui";
import { SolveButton } from "./SolvePanel";
import { TickBurst } from "./TickBurst";

const ease = [0.16, 1, 0.3, 1] as const;

export function TopicView({ id }: { id: string }) {
  const t = topicById(id)!;
  const { done } = usePatterns();
  const [sel, setSel] = useState(0); // 0 = overview, otherwise pattern number
  const top = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // the hash (#p-3) is the shareable, back-button friendly selection
  useEffect(() => {
    const read = () => { const m = location.hash.match(/^#p-(\d+)$/); const n = m ? +m[1] : 0; setSel(t.patterns.some((p) => p.n === n) ? n : 0); };
    read(); window.addEventListener("hashchange", read); return () => window.removeEventListener("hashchange", read);
  }, [t]);
  const pick = (n: number) => {
    history.pushState(null, "", n ? `#p-${n}` : location.pathname); setSel(n);
    top.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const rail = useRef<HTMLOListElement>(null);
  // keep the selected chip visible in the horizontal strip (phones and tablets)
  useEffect(() => {
    const ol = rail.current;
    if (!ol || ol.scrollWidth <= ol.clientWidth) return;
    const id = requestAnimationFrame(() => ol.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduce ? "auto" : "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [sel, reduce]);

  const probs = topicProblems(t), dn = probs.filter((p) => done[p[0]]).length;
  const idx = t.patterns.findIndex((p) => p.n === sel), p = t.patterns[idx];

  return (
    <div ref={top} className="scroll-mt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/patterns" className="btn btn-ghost btn-sm -ml-2.5"><ArrowLeft size={14} aria-hidden />All topics</Link>
        <div className="flex w-full max-w-60 items-center gap-3">
          <Bar value={dn} max={probs.length} className="flex-1" />
          <span className="num shrink-0 text-[12px] text-muted">{dn}/{probs.length} solved</span>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[232px_minmax(0,1fr)]">
        {/* pattern list: rail on wide screens, chip strip otherwise */}
        <nav aria-label={`${t.name} patterns`} className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <h2 className="t-h2 mb-2 hidden xl:block">{t.name}</h2>
          <ol ref={rail} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
            <li><RailItem on={sel === 0} onClick={() => pick(0)} label="Overview" /></li>
            {t.patterns.map((q) => {
              const pp = problemsOf(t.id, q.n), d = pp.filter((x) => done[x[0]]).length;
              return <li key={q.n}><RailItem on={sel === q.n} onClick={() => pick(q.n)} n={q.n} label={q.name} done={pp.length > 0 && d === pp.length} meta={pp.length ? `${d}/${pp.length}` : undefined} /></li>;
            })}
          </ol>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }} className="min-w-0">
            {p ? <PatternView t={t} p={p} prev={t.patterns[idx - 1]} next={t.patterns[idx + 1]} pick={pick} /> : <Overview t={t} pick={pick} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RailItem({ on, onClick, label, n, meta, done }: { on: boolean; onClick(): void; label: string; n?: number; meta?: string; done?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-current={on ? "page" : undefined}
      className={`flex w-full cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-control border px-3 py-2 text-left text-[13px] font-medium transition-colors active:scale-[0.98] xl:whitespace-normal ${on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:border-line-strong xl:border-transparent xl:bg-transparent xl:hover:bg-surface-2"}`}>
      {n != null && <span className={`num grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${on ? "bg-accent-ink text-accent" : done ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>{done && !on ? <Check size={11} weight="bold" aria-label="all solved" /> : n}</span>}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {meta && <span className={`num hidden text-[11px] xl:inline ${on ? "opacity-80" : "text-muted"}`}>{meta}</span>}
    </button>
  );
}

/* ---------- overview: basics + which-pattern chart ---------- */
function Overview({ t, pick }: { t: Topic; pick(n: number): void }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="t-title xl:hidden">{t.name}</h2>
        <p className="mt-1 max-w-[66ch] text-[16px] leading-relaxed text-muted">{t.blurb}</p>
      </header>
      <section aria-labelledby="basics" className="grid gap-3 md:grid-cols-3">
        <h3 id="basics" className="sr-only">Basics</h3>
        {t.basics.map((b) => <p key={b} className="tile p-4 text-[14px] leading-relaxed">{b}</p>)}
      </section>

      <section aria-labelledby="which" className="card p-5">
        <h3 id="which" className="t-h3">Which pattern?</h3>
        <p className="mt-0.5 text-[13px] text-muted">Match the wording of the problem to a pattern. The first match is usually right.</p>
        <ol className="mt-5 flex flex-col gap-3">
          {t.patterns.map((q) => (
            <li key={q.n} className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_40px_minmax(0,240px)]">
              <div className="flex flex-wrap gap-1.5">
                {q.signals.slice(0, 3).map((s) => <span key={s} className="rounded-lg bg-surface-2 px-2.5 py-1 text-[13px]">“{s}”</span>)}
              </div>
              <svg viewBox="0 0 40 12" className="hidden h-3 w-10 md:block" aria-hidden><path d="M0 6 H34 M30 2 L36 6 L30 10" fill="none" stroke="var(--line-strong)" strokeWidth={1.5} /></svg>
              <button type="button" onClick={() => pick(q.n)} className="flex cursor-pointer items-center justify-between gap-2 rounded-control bg-accent-soft px-3 py-2 text-left text-[14px] font-semibold text-accent transition hover:bg-accent hover:text-accent-ink active:scale-[0.98]">
                <span><span className="num mr-1.5">{q.n}</span>{q.name}</span><ArrowRight size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/* ---------- one pattern ---------- */
function PatternView({ t, p, prev, next, pick }: { t: Topic; p: Pattern; prev?: Pattern; next?: Pattern; pick(n: number): void }) {
  const { done, toggle } = usePatterns();
  const plain = PLAIN[`${t.id}:${p.n}`];
  const variants = useMemo<(Viz & { name: string })[]>(() => [{ ...p.viz, name: "Main idea" }, ...(EXTRAS[`${t.id}:${p.n}`] ?? [])], [t.id, p]);
  const [v, setV] = useState(0);
  const cur = variants[Math.min(v, variants.length - 1)];
  const [input, setInput] = useState(cur.input ?? "");
  const [applied, setApplied] = useState(cur.input);
  useEffect(() => { setInput(cur.input ?? ""); setApplied(cur.input); }, [cur]);
  const [copied, setCopied] = useState(false);
  // inputs too small to show anything (or that throw) fall back to the built-in example
  const diagram = useMemo(() => {
    try { const d = cur.make(applied); if (d.frames.length && !d.frames.some((f) => /NaN|undefined/.test(f.note))) return d; } catch {}
    return cur.make();
  }, [cur, applied]);
  const probs = problemsOf(t.id, p.n);
  const dn = probs.filter((x) => done[x[0]]).length;
  const [burst, setBurst] = useState<[number, number] | null>(null); // [lc, nonce] of the last tick

  return (
    <article aria-labelledby="pat" className="flex flex-col gap-6">
      <header>
        <h2 id="pat" className="t-title">{p.name}</h2>
        <p className="mt-1.5 max-w-[68ch] text-[15px] leading-relaxed text-muted">{p.summary}</p>
      </header>

      {plain && (
        <section aria-label="In plain words" className="callout">
          <h3 className="t-eyebrow text-accent">In plain words</h3>
          <p className="mt-1 max-w-[64ch] text-[17px] leading-relaxed">{plain.plain}</p>
          <p className="mt-3 text-[14px]"><span className="font-semibold">Remember: </span><code className="font-mono text-[13px]">{plain.remember}</code></p>
        </section>
      )}

      <section aria-label="Visualiser">
        {variants.length > 1 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Diagram">
            {variants.map((x, i) => (
              <button key={x.name} type="button" role="tab" aria-selected={i === v} onClick={() => setV(i)}
                className="chip">{x.name}</button>
            ))}
          </div>
        )}
        <Visualizer diagram={diagram} input={cur.input != null && (
          <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); setApplied(input); }}>
            <label className="sr-only" htmlFor={`in-${t.id}-${p.n}`}>{cur.label}</label>
            <input id={`in-${t.id}-${p.n}`} className="field field-sm w-48" value={input} onChange={(e) => setInput(e.target.value)} title={cur.label} placeholder={cur.label} />
            <button className="btn btn-sm" type="submit">Run</button>
          </form>
        )} />
        {cur.label && <p className="mt-1.5 text-[12px] text-muted">Try your own input: {cur.label}.</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="when">
          <h3 id="when" className="t-h3 mb-2.5 flex items-center gap-2"><Lightning size={16} className="text-accent" aria-hidden />When to use it</h3>
          <ul className="flex flex-col gap-2">{p.signals.map((s) => <li key={s} className="inset bg-surface px-3 py-2 text-[14px]">“{s}”</li>)}</ul>
        </section>
        <section aria-labelledby="idea">
          <h3 id="idea" className="t-h3 mb-2.5 flex items-center gap-2"><Lightbulb size={16} className="text-accent" aria-hidden />How it works</h3>
          <div className="flex max-w-[68ch] flex-col gap-3 text-[15px] leading-relaxed">{p.idea.map((x) => <p key={x}>{x}</p>)}</div>
          <ol className="mt-4 flex flex-col gap-0 border-l-2 border-line pl-4">
            {p.steps.map((s, i) => (
              <li key={s} className="relative pb-3 last:pb-0">
                <span className="num absolute -left-[27px] top-0 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-ink">{i + 1}</span>
                <code className="font-mono text-[13px]">{s}</code>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="cx" className="card p-5">
        <h3 id="cx" className="t-h3 mb-4">Time and space</h3>
        <ComplexityChart c={p.complexity}>
          <div>
            <dl className="grid grid-cols-2 gap-2">
              {([["Best case", p.complexity.best, "text-easy"], ["Average case", p.complexity.average, "text-accent"], ["Worst case", p.complexity.worst, "text-hard"], ["Extra space", p.complexity.space, "text-ink"]] as const).map(([k, val, cls]) => (
                <div key={k} className="tile"><dt className="text-[12px] text-muted">{k}</dt><dd className={`num mt-0.5 text-[16px] font-semibold ${cls}`}>{val}</dd></div>
              ))}
            </dl>
            <p className="mt-3 max-w-[72ch] text-[13px] leading-relaxed text-muted">{p.complexity.note}</p>
          </div>
        </ComplexityChart>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="tpl" className="min-w-0">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 id="tpl" className="t-h3">Template in Python</h3>
            <button type="button" className="btn btn-sm" onClick={() => { void navigator.clipboard?.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}
            </button>
          </div>
          <pre className="code"><code>{p.code}</code></pre>
        </section>
        <section aria-labelledby="traps">
          <h3 id="traps" className="t-h3 mb-2.5 flex items-center gap-2"><Warning size={16} className="text-medium" aria-hidden />Common traps</h3>
          <ul className="flex flex-col gap-2">{p.traps.map((x) => <li key={x} className="callout callout-warn py-2.5 text-[14px] leading-relaxed">{x}</li>)}</ul>
        </section>
      </div>

      {probs.length > 0 && (
        <section aria-labelledby="practice">
          <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="practice" className="t-h3">Practice <span className="num ml-1 text-[13px] font-normal text-muted">{dn} of {probs.length} solved</span></h3>
            <span className="text-[12px] text-muted">Tracked here only, not in your daily plan</span>
          </div>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {probs.map(([lc, title, slug, level, premium]) => {
              const on = !!done[lc];
              return (
                <li key={lc} className={`inset flex items-center gap-3 px-3 py-2.5 transition-colors ${on ? "border-accent/40 bg-accent-soft" : "bg-surface"}`}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={(on ? "Untick " : "Tick ") + title} onClick={() => { if (!on) setBurst([lc, Date.now()]); toggle(lc, !on); }}
                    className="tick">
                    {burst?.[0] === lc && <TickBurst key={burst[1]} />}
                    {on && <Check size={14} weight="bold" aria-hidden />}
                  </button>
                  <span className="num hidden w-10 shrink-0 text-[12px] text-muted sm:block">{lc}</span>
                  <a href={lcUrl(slug)} target="_blank" rel="noopener" className={`group flex min-w-0 flex-1 items-center gap-1 text-[14px] font-medium hover:text-accent ${on ? "text-muted line-through" : ""}`}>
                    <span className="truncate">{title}</span><ArrowUpRight size={14} className="shrink-0 opacity-50 transition group-hover:opacity-100" aria-hidden />
                  </a>
                  {premium && <span className="pill pill-muted" title="Needs LeetCode Premium">Premium</span>}
                  <span className={`pill lv-${level} shrink-0`}>{level}</span>
                  <SolveButton short t={{ slug, title, level, url: lcUrl(slug) }} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav aria-label="Next and previous pattern" className="grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
        {prev ? <button type="button" onClick={() => pick(prev.n)} className="btn btn-nav justify-start"><ArrowLeft size={16} aria-hidden /><span><span className="block text-[12px] font-normal text-muted">Previous</span>{prev.name}</span></button> : <button type="button" onClick={() => pick(0)} className="btn btn-nav justify-start"><ArrowLeft size={16} aria-hidden /><span><span className="block text-[12px] font-normal text-muted">Back to</span>Overview</span></button>}
        {next && <button type="button" onClick={() => pick(next.n)} className="btn btn-nav justify-end text-right sm:col-start-2"><span><span className="block text-[12px] font-normal text-muted">Next</span>{next.name}</span><ArrowRight size={16} aria-hidden /></button>}
      </nav>
    </article>
  );
}

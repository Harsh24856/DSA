"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, Copy, Lightbulb, Lightning, Warning } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { lcUrl, NEEDS, patternByKey, problemsOf, STUDY_PATH, topicById, topicProblems, TOPICS, type Pattern, type PProblem, type Topic } from "@/lib/patterns";
import { stageOf, WHY } from "@/lib/patterns/order";
import { PLAIN } from "@/lib/patterns/plain";
import { EXTRAS } from "@/lib/patterns/extras";
import type { Viz } from "@/lib/patterns/types";
import { Visualizer } from "./Visualizer";
import { ComplexityChart } from "./ComplexityChart";
import { Bar, Seg } from "./ui";
import { inline } from "./other/Rich";
import { CODE_LANGS, useCodeLang } from "./useCodeLang";
import { SolveButton } from "./SolvePanel";
import { TickBurst } from "./TickBurst";

const ease = [0.22, 1, 0.36, 1] as const;

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
    <div ref={top} className="study scroll-mt-4">
      <div className="photo-legible mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/patterns" className="btn btn-ghost btn-sm -ml-3"><ArrowLeft size={14} aria-hidden />All topics</Link>
        <div className="flex w-full max-w-60 items-center gap-3">
          <Bar value={dn} max={probs.length} className="flex-1" />
          <span className="num shrink-0 text-sm text-muted">{dn}/{probs.length} solved</span>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[232px_minmax(0,1fr)]">
        {/* pattern list: rail on wide screens, chip strip otherwise */}
        <nav aria-label={`${t.name} patterns`} className="glass sticky top-24 z-10 min-w-0 p-2 xl:self-start">
          <h2 className="t-h2 mb-2 hidden px-2 pt-2 xl:block">{t.name}</h2>
          <ol ref={rail} className="flex gap-2 overflow-x-auto xl:max-h-[calc(100dvh-160px)] xl:flex-col xl:overflow-y-auto">
            <li><RailItem on={sel === 0} onClick={() => pick(0)} label="Overview" /></li>
            {t.patterns.map((q, k) => {
              const pp = problemsOf(t.id, q.n), d = pp.filter((x) => done[x[0]]).length;
              return <li key={q.n}><RailItem on={sel === q.n} onClick={() => pick(q.n)} n={k + 1} label={q.name} done={pp.length > 0 && d === pp.length} meta={pp.length ? `${d}/${pp.length}` : undefined} /></li>;
            })}
          </ol>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease }} className="study-sheet min-w-0">
            {p ? <PatternView t={t} p={p} step={idx + 1} prev={t.patterns[idx - 1]} next={t.patterns[idx + 1]} pick={pick} /> : <Overview t={t} pick={pick} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function RailItem({ on, onClick, label, n, meta, done }: { on: boolean; onClick(): void; label: string; n?: number; meta?: string; done?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-current={on ? "page" : undefined}
      className={`flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-control border px-3 py-2 text-left text-base font-medium transition-colors active:scale-[0.98] xl:whitespace-normal ${on ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface text-ink hover:border-line-strong xl:border-transparent xl:bg-transparent xl:hover:bg-surface-2"}`}>
      {n != null && <span className={`num grid size-5 shrink-0 place-items-center rounded-full text-sm font-semibold ${on ? "bg-accent-ink text-accent" : done ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>{done && !on ? <Check size={11} weight="bold" aria-label="all solved" /> : n}</span>}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {meta && <span className={`num hidden text-sm xl:inline ${on ? "opacity-80" : "text-muted"}`}>{meta}</span>}
    </button>
  );
}

/* ---------- study order ---------- */
/** Where this topic sits in the study order, and what comes before it. */
function StudyStep({ t }: { t: Topic }) {
  const k = TOPICS.indexOf(t), st = stageOf(t.id), prev = TOPICS[k - 1];
  return (
    <p className="t-eyebrow">
      Step {k + 1} of {TOPICS.length}{st && <>, {st.title}</>}
      {prev && <> · after <Link href={`/patterns/${prev.id}`} className="underline underline-offset-2 hover:text-accent">{prev.name}</Link></>}
    </p>
  );
}
/** After a topic's last pattern: the next topic in the study order. */
function NextTopic({ t }: { t: Topic }) {
  const next = TOPICS[TOPICS.indexOf(t) + 1];
  if (!next) return <Link href="/patterns" className="btn btn-nav justify-end text-right sm:col-start-2"><span><span className="block text-sm font-normal text-muted">Last topic done</span>All topics</span><ArrowRight size={16} aria-hidden /></Link>;
  return <Link href={`/patterns/${next.id}`} className="btn btn-nav justify-end text-right sm:col-start-2"><span><span className="block text-sm font-normal text-muted">Next topic</span>{next.name}</span><ArrowRight size={16} aria-hidden /></Link>;
}

/** The patterns this one builds on: same-topic ones switch in place, others open their topic. */
function LearnFirst({ t, p, pick }: { t: Topic; p: Pattern; pick(n: number): void }) {
  const { done } = usePatterns();
  const needs = (NEEDS[`${t.id}:${p.n}`] ?? []).flatMap((k) => { const x = patternByKey(k); return x ? [{ k, ...x }] : []; });
  return (
    <section aria-labelledby="learn-first" className="glass p-4">
      <h3 id="learn-first" className="text-base font-semibold">Learn these first</h3>
      {needs.length === 0
        ? <p className="mt-1 text-base text-muted">Nothing beyond the {t.name} Overview: a good place to start this topic.</p>
        : <ul className="mt-2 flex flex-wrap gap-2">
            {needs.map(({ k, t: nt, p: np }) => {
              const pp = problemsOf(nt.id, np.n), ok = pp.length > 0 && pp.every((x) => done[x[0]]);
              const label = <>{ok && <Check size={12} weight="bold" aria-label="practice done" />}{nt.id === t.id ? np.name : `${nt.name}: ${np.name}`}</>;
              return <li key={k} className="max-w-full">{nt.id === t.id
                ? <button type="button" className="chip h-auto min-h-8 max-w-full whitespace-normal py-1 text-left" onClick={() => pick(np.n)}>{label}</button>
                : <Link href={`/patterns/${nt.id}#p-${np.n}`} className="chip h-auto min-h-8 max-w-full whitespace-normal py-1 text-left no-underline">{label}</Link>}</li>;
            })}
          </ul>}
    </section>
  );
}

/* ---------- overview: the data structure itself, then which pattern to pick ---------- */
/** A cost table: cards on phones, a table from the sm breakpoint up. */
function CostTable({ head, rows, title }: { head: string[]; rows: string[][]; title?: string }) {
  return (
    <div>
      {title && <h4 className="mb-2 text-base font-semibold">{title}</h4>}
      <dl className="grid gap-2 sm:hidden">
        {rows.map((r, i) => (
          <div key={i} className="tile p-3 text-base">
            <dt className="font-semibold">{inline(r[0])}</dt>
            {r.slice(1).map((c, k) => c && <dd key={k} className="m-0"><span className="text-muted">{head[k + 1]}: </span>{inline(c)}</dd>)}
          </div>
        ))}
      </dl>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-base">
          <thead><tr>{head.map((h) => <th key={h} className="border-b border-line-strong px-3 py-2 font-semibold text-muted">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className={`border-b border-line px-3 py-2 align-top ${k === 0 ? "font-medium" : ""}`}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function Overview({ t, pick }: { t: Topic; pick(n: number): void }) {
  const o = t.overview;
  const [lang, setLang] = useCodeLang();
  const [copied, setCopied] = useState(false);
  const inCpp = lang === "cpp" && !!t.cpp, code = o ? (inCpp ? t.cpp! : o.code) : "";
  const paras = (xs: string[]) => <div className="flex max-w-[72ch] flex-col gap-3 text-base leading-relaxed">{xs.map((x) => <p key={x}>{inline(x)}</p>)}</div>;
  const hints = (xs: string[], warn = false) => <ul className="flex flex-col gap-2">{xs.map((x) => <li key={x} className={warn ? "callout callout-warn py-3 text-base leading-relaxed" : "inset bg-surface px-3 py-2 text-base leading-relaxed"}>{inline(x)}</li>)}</ul>;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <StudyStep t={t} />
        <h2 className="t-title xl:hidden">{t.name}</h2>
        <p className="mt-1 max-w-[66ch] text-base leading-relaxed text-muted">{t.blurb}</p>
        {WHY[t.id] && <p className="mt-2 max-w-[66ch] text-base leading-relaxed">{WHY[t.id]}</p>}
      </header>
      <section aria-labelledby="basics" className="grid gap-3 md:grid-cols-3">
        <h3 id="basics" className="sr-only">Basics</h3>
        {t.basics.map((b) => <p key={b} className="tile p-4 text-base leading-relaxed">{b}</p>)}
      </section>

      {o && (
        <>
          <section aria-labelledby="ov-what">
            <h3 id="ov-what" className="t-h3 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-accent" aria-hidden />What it is</h3>
            {paras(o.what)}
          </section>

          {o.viz.length > 0 && <VizTabs variants={o.viz} id={`${t.id}-0`} />}

          <section aria-labelledby="ov-build" className="grid min-w-0 gap-4">
            <h3 id="ov-build" className="t-h3 flex items-center gap-2"><Lightbulb size={16} className="text-accent" aria-hidden />How it is built</h3>
            {paras(o.build)}
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-semibold">From scratch in {inCpp ? "C++" : "Python"}</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {t.cpp && <Seg label="Code language" value={lang} onChange={setLang} options={CODE_LANGS} />}
                  <button type="button" className="btn btn-sm" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                    {copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}
                  </button>
                </div>
              </div>
              <pre className="code"><code>{code}</code></pre>
            </div>
          </section>

          <section aria-labelledby="ov-ops" className="glass grid gap-6 p-6">
            <div>
              <h3 id="ov-ops" className="t-h3">Every operation and its cost</h3>
              <p className="mt-0.5 text-base text-muted">Average case, worst case, and the reason behind the number.</p>
            </div>
            {o.ops.map((g) => <CostTable key={g.title} title={o.ops.length > 1 ? g.title : undefined} head={["Operation", "Average", "Worst", "Why"]} rows={g.rows} />)}
            {o.builtins.length > 0 && <CostTable title="Already in the standard library" head={["Need", "C++", "Python"]} rows={o.builtins} />}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="ov-when">
              <h3 id="ov-when" className="t-h3 mb-3 flex items-center gap-2"><Lightning size={16} className="text-accent" aria-hidden />Reach for it when</h3>
              {hints(o.when)}
            </section>
            <section aria-labelledby="ov-avoid">
              <h3 id="ov-avoid" className="t-h3 mb-3 flex items-center gap-2"><Warning size={16} className="text-medium" aria-hidden />Use something else when</h3>
              {hints(o.avoid, true)}
            </section>
          </div>

          <section aria-labelledby="ov-tips">
            <h3 id="ov-tips" className="t-h3 mb-3">Interview tips and classic mistakes</h3>
            {hints(o.tips)}
          </section>
        </>
      )}

      <section aria-labelledby="which" className="glass p-6">
        <h3 id="which" className="t-h3">Which pattern?</h3>
        <p className="mt-0.5 text-base text-muted">Match the wording of the problem to a pattern. The first match is usually right.</p>
        <ol className="mt-6 flex flex-col gap-3">
          {t.patterns.map((q, k) => (
            <li key={q.n} className="grid items-center gap-2 md:grid-cols-[minmax(0,1fr)_40px_minmax(0,240px)]">
              <div className="flex flex-wrap gap-2">
                {q.signals.slice(0, 3).map((s) => <span key={s} className="rounded-lg bg-surface-2 px-3 py-1 text-base">“{s}”</span>)}
              </div>
              <svg viewBox="0 0 40 12" className="hidden h-3 w-10 md:block" aria-hidden><path d="M0 6 H34 M30 2 L36 6 L30 10" fill="none" stroke="var(--line-strong)" strokeWidth={1.5} /></svg>
              <button type="button" onClick={() => pick(q.n)} className="flex cursor-pointer items-center justify-between gap-2 rounded-control bg-accent-soft px-3 py-2 text-left text-base font-semibold text-accent transition hover:bg-accent hover:text-accent-ink active:scale-[0.98]">
                <span><span className="num mr-2">{k + 1}</span>{q.name}</span><ArrowRight size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <PracticeList id="must" title="Must-do questions outside the patterns" probs={problemsOf(t.id, 0)} />
    </div>
  );
}

/* ---------- shared by the overview and each pattern ---------- */
/** One or more visualisers as tabs, each with an optional "try your own input" box. */
function VizTabs({ variants, id }: { variants: (Viz & { name: string })[]; id: string }) {
  const [v, setV] = useState(0);
  const cur = variants[Math.min(v, variants.length - 1)];
  const [input, setInput] = useState(cur.input ?? "");
  const [applied, setApplied] = useState(cur.input);
  useEffect(() => { setInput(cur.input ?? ""); setApplied(cur.input); }, [cur]);
  // inputs too small to show anything (or that throw) fall back to the built-in example
  const diagram = useMemo(() => {
    try { const d = cur.make(applied); if (d.frames.length && !d.frames.some((f) => /NaN|undefined/.test(f.note))) return d; } catch {}
    return cur.make();
  }, [cur, applied]);
  return (
    <section aria-label="Visualiser">
      {variants.length > 1 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Diagram">
          {variants.map((x, i) => (
            <button key={x.name} type="button" role="tab" aria-selected={i === v} onClick={() => setV(i)}
              className="chip">{x.name}</button>
          ))}
        </div>
      )}
      <Visualizer diagram={diagram} input={cur.input != null && (
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(input); }}>
          <label className="sr-only" htmlFor={`in-${id}`}>{cur.label}</label>
          <input id={`in-${id}`} className="field field-sm w-48" value={input} onChange={(e) => setInput(e.target.value)} title={cur.label} placeholder={cur.label} />
          <button className="btn btn-sm" type="submit">Run</button>
        </form>
      )} />
      {cur.label && <p className="mt-2 text-sm text-muted">Try your own input: {cur.label}.</p>}
    </section>
  );
}

/** A ticked list of questions, each with its Solution button. */
function PracticeList({ id, title, note = "Tracked here only, not in your daily plan", probs }: { id: string; title: string; note?: string; probs: PProblem[] }) {
  const { done, toggle } = usePatterns();
  const [burst, setBurst] = useState<[number, number] | null>(null); // [lc, nonce] of the last tick
  const dn = probs.filter((x) => done[x[0]]).length;
  if (!probs.length) return null;
  return (
        <section aria-labelledby={id}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={id} className="t-h3">{title} <span className="num ml-1 text-base font-normal text-muted">{dn} of {probs.length} solved</span></h3>
            <span className="text-sm text-muted">{note}</span>
          </div>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
            {probs.map(([lc, title, slug, level, premium]) => {
              const on = !!done[lc];
              return (
                <li key={lc} className={`inset flex items-center gap-3 px-3 py-3 transition-colors ${on ? "border-accent/40 bg-accent-soft" : "bg-surface"}`}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={(on ? "Untick " : "Tick ") + title} onClick={() => { if (!on) setBurst([lc, Date.now()]); toggle(lc, !on); }}
                    className="tick">
                    {burst?.[0] === lc && <TickBurst key={burst[1]} />}
                    {on && <Check size={14} weight="bold" aria-hidden />}
                  </button>
                  <span className="num hidden w-10 shrink-0 text-sm text-muted sm:block">{lc}</span>
                  <a href={lcUrl(slug)} target="_blank" rel="noopener" className={`group flex min-w-0 flex-1 items-center gap-1 text-base font-medium hover:text-accent ${on ? "text-muted line-through" : ""}`}>
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
  );
}

function PatternView({ t, p, step, prev, next, pick }: { t: Topic; p: Pattern; step: number; prev?: Pattern; next?: Pattern; pick(n: number): void }) {
  const plain = PLAIN[`${t.id}:${p.n}`];
  const variants = useMemo<(Viz & { name: string })[]>(() => [{ ...p.viz, name: "Main idea" }, ...(EXTRAS[`${t.id}:${p.n}`] ?? [])], [t.id, p]);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useCodeLang();
  const inCpp = lang === "cpp" && !!p.cpp, code = inCpp ? p.cpp! : p.code;
  const probs = problemsOf(t.id, p.n);

  return (
    <article aria-labelledby="pat" className="flex flex-col gap-6">
      <header>
        <p className="t-eyebrow">{t.name}: pattern {step} of {t.patterns.length} · step {STUDY_PATH.indexOf(`${t.id}:${p.n}`) + 1} of {STUDY_PATH.length} in the study path</p>
        <h2 id="pat" className="t-title">{p.name}</h2>
        <p className="mt-2 max-w-[68ch] text-base leading-relaxed text-muted">{p.summary}</p>
      </header>

      <LearnFirst t={t} p={p} pick={pick} />

      {plain && (
        <section aria-label="In plain words" className="callout">
          <h3 className="t-eyebrow text-accent">In plain words</h3>
          <p className="mt-1 max-w-[64ch] text-base leading-relaxed">{plain.plain}</p>
          <p className="mt-3 text-base"><span className="font-semibold">Remember: </span><code className="font-mono text-base">{plain.remember}</code></p>
        </section>
      )}

      <VizTabs variants={variants} id={`${t.id}-${p.n}`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section aria-labelledby="when">
          <h3 id="when" className="t-h3 mb-3 flex items-center gap-2"><Lightning size={16} className="text-accent" aria-hidden />When to use it</h3>
          <ul className="flex flex-col gap-2">{p.signals.map((s) => <li key={s} className="inset bg-surface px-3 py-2 text-base">“{s}”</li>)}</ul>
        </section>
        <section aria-labelledby="idea">
          <h3 id="idea" className="t-h3 mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-accent" aria-hidden />How it works</h3>
          <div className="flex max-w-[68ch] flex-col gap-3 text-base leading-relaxed">{p.idea.map((x) => <p key={x}>{x}</p>)}</div>
          <ol className="mt-4 flex flex-col gap-0 border-l-2 border-line pl-4">
            {p.steps.map((s, i) => (
              <li key={s} className="relative pb-3 last:pb-0">
                <span className="num absolute -left-[27px] top-0 grid size-5 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{i + 1}</span>
                <code className="font-mono text-base">{s}</code>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {p.theory && p.theory.length > 0 && (
        <section aria-labelledby="theory">
          <h3 id="theory" className="t-h3 mb-3 flex items-center gap-2"><BookOpen size={16} className="text-accent" aria-hidden />Deeper theory</h3>
          <div className="flex max-w-[72ch] flex-col gap-3 text-base leading-relaxed">{p.theory.map((x) => <p key={x}>{inline(x)}</p>)}</div>
        </section>
      )}

      <section aria-labelledby="cx" className="glass p-6">
        <h3 id="cx" className="t-h3 mb-4">Time and space</h3>
        <ComplexityChart c={p.complexity}>
          <div>
            <dl className="grid grid-cols-2 gap-2">
              {([["Best case", p.complexity.best, "text-easy"], ["Average case", p.complexity.average, "text-accent"], ["Worst case", p.complexity.worst, "text-hard"], ["Extra space", p.complexity.space, "text-ink"]] as const).map(([k, val, cls]) => (
                <div key={k} className="tile"><dt className="text-sm text-muted">{k}</dt><dd className={`num mt-0.5 text-base font-semibold ${cls}`}>{val}</dd></div>
              ))}
            </dl>
            <p className="mt-3 max-w-[72ch] text-base leading-relaxed text-muted">{p.complexity.note}</p>
          </div>
        </ComplexityChart>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-labelledby="tpl" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 id="tpl" className="t-h3">Template in {inCpp ? "C++" : "Python"}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {p.cpp && <Seg label="Code language" value={lang} onChange={setLang} options={CODE_LANGS} />}
              <button type="button" className="btn btn-sm" onClick={() => { void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}
              </button>
            </div>
          </div>
          <pre className="code"><code>{code}</code></pre>
        </section>
        <section aria-labelledby="traps">
          <h3 id="traps" className="t-h3 mb-3 flex items-center gap-2"><Warning size={16} className="text-medium" aria-hidden />Common traps</h3>
          <ul className="flex flex-col gap-2">{p.traps.map((x) => <li key={x} className="callout callout-warn py-3 text-base leading-relaxed">{x}</li>)}</ul>
        </section>
      </div>

      <PracticeList id="practice" title="Practice" probs={probs} />

      <nav aria-label="Next and previous pattern" className="grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
        {prev ? <button type="button" onClick={() => pick(prev.n)} className="btn btn-nav justify-start"><ArrowLeft size={16} aria-hidden /><span><span className="block text-sm font-normal text-muted">Previous</span>{prev.name}</span></button> : <button type="button" onClick={() => pick(0)} className="btn btn-nav justify-start"><ArrowLeft size={16} aria-hidden /><span><span className="block text-sm font-normal text-muted">Back to</span>Overview</span></button>}
        {next ? <button type="button" onClick={() => pick(next.n)} className="btn btn-nav justify-end text-right sm:col-start-2"><span><span className="block text-sm font-normal text-muted">Next</span>{next.name}</span><ArrowRight size={16} aria-hidden /></button>
          : <NextTopic t={t} />}
      </nav>
    </article>
  );
}

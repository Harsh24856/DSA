"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Check, CheckCircle, Copy, Lightbulb, Lightning, ListNumbers, Warning } from "@phosphor-icons/react";
import { usePatterns } from "@/lib/patternStore";
import { lcUrl, problemsOf, topicById, topicProblems, type Pattern, type Topic } from "@/lib/patterns";
import { Visualizer } from "./Visualizer";
import { Bar } from "./ui";

export function TopicView({ id }: { id: string }) {
  const t = topicById(id)!;
  const { done } = usePatterns();
  const probs = topicProblems(t), dn = probs.filter((p) => done[p[0]]).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="card p-5">
        <Link href="/patterns" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-accent"><ArrowLeft size={14} aria-hidden />All topics</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[68ch]">
            <h2 className="text-[24px] font-semibold">{t.name}</h2>
            <p className="mt-1 text-[14px] text-muted">{t.blurb}</p>
          </div>
          <div className="w-full max-w-56">
            <div className="mb-1.5 flex justify-between text-[12px] text-muted"><span>{t.patterns.length} patterns</span><span className="num">{dn} / {probs.length} solved</span></div>
            <Bar value={dn} max={probs.length} />
          </div>
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          {t.basics.map((b) => <li key={b} className="flex gap-2 rounded-[10px] bg-surface-2 p-3 text-[13px]"><Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{b}</li>)}
        </ul>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Patterns in this topic">
          {t.patterns.map((p) => (
            <a key={p.n} href={`#p-${p.n}`} className="pill h-8 border border-line bg-surface px-3 text-[13px] font-medium text-ink transition hover:border-accent hover:text-accent">
              <span className="num mr-1.5 text-muted">{p.n}</span>{p.name}
            </a>
          ))}
        </nav>
      </section>

      {t.patterns.map((p) => <PatternSection key={p.n} t={t} p={p} />)}
    </div>
  );
}

const RATE: [RegExp, string, string][] = [
  [/^O\(1\)$|^O\(α/, "Constant", "text-easy"],
  [/log n\)$|log k\)$|log min|^O\(L\)$|^O\(h\)$/, "Fast", "text-easy"],
  [/^O\(n\)$|^O\(n \+ |^O\(V \+ E\)|^O\(R · C\)|^O\(m · n\)|^O\(k\)$|^O\(26\)|^O\(alphabet|^O\(digits|^O\(set bits|^O\(word size|^O\(n · 26\)|^O\(n · W\)|^O\(N log k\)|^O\(n \+ m/, "Linear", "text-accent"],
  [/log/, "n log n", "text-accent"],
];
const rate = (s: string) => RATE.find(([r]) => r.test(s)) ?? [null, "Heavy", "text-medium"];

function PatternSection({ t, p }: { t: Topic; p: Pattern }) {
  const reduce = useReducedMotion();
  const { done, toggle } = usePatterns();
  const [input, setInput] = useState(p.viz.input ?? "");
  const [applied, setApplied] = useState(p.viz.input);
  const [copied, setCopied] = useState(false);
  // inputs too small to show anything (or that throw) fall back to the built-in example
  const diagram = useMemo(() => {
    try { const d = p.viz.make(applied); if (d.frames.length && !d.frames.some((f) => /NaN|undefined/.test(f.note))) return d; } catch {}
    return p.viz.make();
  }, [p, applied]);
  const probs = problemsOf(t.id, p.n), dn = probs.filter((x) => done[x[0]]).length;
  const cx = p.complexity;

  return (
    <motion.section id={`p-${p.n}`} aria-labelledby={`h-p-${p.n}`} className="card scroll-mt-6 p-5"
      initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.05 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[70ch]">
          <p className="num text-[12px] font-semibold text-accent">Pattern {p.n} of {t.patterns.length}</p>
          <h2 id={`h-p-${p.n}`} className="mt-0.5 text-[20px] font-semibold">{p.name}</h2>
          <p className="mt-1 text-[14px] text-muted">{p.summary}</p>
        </div>
        {probs.length > 0 && <span className="num rounded-full bg-accent-soft px-3 py-1 text-[12px] font-semibold text-accent">{dn} / {probs.length} solved</span>}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><Lightning size={16} className="text-accent" aria-hidden />When to use it</h3>
            <ul className="flex flex-wrap gap-1.5">{p.signals.map((s) => <li key={s} className="rounded-[8px] border border-line bg-surface-2 px-2.5 py-1 text-[13px]">{s}</li>)}</ul>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><Lightbulb size={16} className="text-accent" aria-hidden />The idea</h3>
            <div className="flex flex-col gap-2.5 text-[14px] leading-relaxed">{p.idea.map((x) => <p key={x}>{x}</p>)}</div>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><ListNumbers size={16} className="text-accent" aria-hidden />Steps</h3>
            <ol className="flex flex-col gap-1.5">
              {p.steps.map((s, i) => <li key={s} className="flex gap-2.5 text-[14px]"><span className="num grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{i + 1}</span><code className="pt-0.5 font-mono text-[13px]">{s}</code></li>)}
            </ol>
          </div>
        </div>

        <div className="min-w-0">
          <Visualizer diagram={diagram} input={p.viz.input != null && (
            <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); setApplied(input); }}>
              <label className="sr-only" htmlFor={`in-${t.id}-${p.n}`}>{p.viz.label}</label>
              <input id={`in-${t.id}-${p.n}`} className="field h-8 w-48 text-[12px]" value={input} onChange={(e) => setInput(e.target.value)} title={p.viz.label} placeholder={p.viz.label} />
              <button className="btn h-8 px-2.5 text-[12px]" type="submit">Run</button>
            </form>
          )} />
          {p.viz.label && <p className="mt-1.5 text-[12px] text-muted">Try your own input: {p.viz.label}.</p>}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-[14px] font-semibold">Time and space</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {([["Best case", cx.best], ["Average case", cx.average], ["Worst case", cx.worst], ["Extra space", cx.space]] as const).map(([k, v]) => {
            const [, label, cls] = rate(v);
            return (
              <div key={k} className="rounded-[12px] border border-line bg-surface-2/60 p-3">
                <div className="text-[12px] text-muted">{k}</div>
                <div className="num mt-1 text-[17px] font-semibold">{v}</div>
                <div className={`mt-0.5 text-[11px] font-semibold ${cls}`}>{label}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted">{cx.note}</p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[14px] font-semibold">Template (Python)</h3>
            <button type="button" className="btn h-8 px-2.5 text-[12px]" onClick={() => { void navigator.clipboard?.writeText(p.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-[12px] border border-line bg-bg p-4 text-[12.5px] leading-relaxed"><code className="font-mono">{p.code}</code></pre>
        </div>
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><Warning size={16} className="text-medium" aria-hidden />Common traps</h3>
          <ul className="flex flex-col gap-2">{p.traps.map((x) => <li key={x} className="rounded-[10px] border border-medium/30 bg-medium/10 px-3 py-2.5 text-[13px]">{x}</li>)}</ul>
        </div>
      </div>

      {probs.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold">Practice problems</h3>
            <span className="text-[12px] text-muted">Tracked here only, not in your daily plan</span>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {probs.map(([lc, title, slug, level, premium]) => {
              const on = !!done[lc];
              return (
                <li key={lc} className={`flex items-center gap-3 rounded-[12px] border px-3 py-2.5 transition-colors ${on ? "border-easy/40 bg-easy/10" : "border-line bg-surface"}`}>
                  <button type="button" role="checkbox" aria-checked={on} aria-label={(on ? "Untick " : "Tick ") + title} onClick={() => toggle(lc, !on)}
                    className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border-2 transition active:scale-90 ${on ? "border-easy bg-easy text-surface" : "border-line-strong hover:border-accent"}`}>
                    {on && <CheckCircle size={14} weight="bold" aria-hidden />}
                  </button>
                  <span className="num w-10 shrink-0 text-[12px] text-muted">{lc}</span>
                  <a href={lcUrl(slug)} target="_blank" rel="noopener" className={`group flex min-w-0 flex-1 items-center gap-1 text-[14px] font-medium hover:text-accent ${on ? "text-muted line-through" : ""}`}>
                    <span className="truncate">{title}</span><ArrowUpRight size={13} className="shrink-0 opacity-50 group-hover:opacity-100" aria-hidden />
                  </a>
                  {premium && <span className="pill bg-surface-2 text-muted" title="LeetCode Premium">Premium</span>}
                  <span className={`pill lv-${level} shrink-0`}>{level}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.section>
  );
}

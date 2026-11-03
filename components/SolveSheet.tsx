"use client";
// "Solve" side sheet for any question: its hand-written solution and its closest pattern.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CaretLeft, CaretRight, Check, Copy, X } from "@phosphor-icons/react";
import { SOLUTIONS } from "@/lib/solutions";
import { SOLVE_EXACT, SOLVE_MAP } from "@/lib/patterns/solveMap";
import { topicById } from "@/lib/patterns";
import { PLAIN } from "@/lib/patterns/plain";
import { title, todayPlan, url } from "@/lib/logic";
import { P } from "@/lib/problems";
import { useStore } from "@/lib/store";
import { Visualizer } from "./Visualizer";
import type { SolveTarget } from "./SolvePanel";

const targetOf = (i: number): SolveTarget => ({ slug: P[i][2], title: title(i), level: P[i][3], url: url(i), sql: P[i][0] === "S", i });

export function SolveSheet({ t, onGo, onClose }: { t: SolveTarget; onGo(t: SolveTarget): void; onClose(): void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="scrim absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <motion.aside role="dialog" aria-modal="true" aria-labelledby="solve-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-line bg-surface shadow-card"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 36 }}>
        <Body key={t.slug} t={t} closeBtn={closeBtn} onClose={onClose} />
        {t.i !== undefined && <Footer i={t.i} onGo={onGo} />}
      </motion.aside>
    </div>
  );
}

/** Tick the question and move through today's list without going back to the page. */
function Footer({ i, onGo }: { i: number; onGo(t: SolveTarget): void }) {
  const { state, now, toggle } = useStore();
  const list = todayPlan(state, now).main.filter((x) => P[x][0] !== "C");
  const at = list.indexOf(i), done = !!state.done[i];
  const prev = at > 0 ? list[at - 1] : undefined, next = at >= 0 && at < list.length - 1 ? list[at + 1] : undefined;
  return (
    <footer className="flex items-center gap-2 border-t border-line px-6 py-3">
      <button type="button" className={`btn btn-sm ${done ? "" : "btn-primary"}`} aria-pressed={done} onClick={() => toggle(i, !done)}>
        <Check size={14} weight="bold" aria-hidden />{done ? "Solved" : "Mark solved"}
      </button>
      {at >= 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="num text-xs text-muted">{at + 1} of {list.length} today</span>
          <button type="button" className="btn btn-sm btn-icon" disabled={prev === undefined} onClick={() => prev !== undefined && onGo(targetOf(prev))} aria-label="Previous question"><CaretLeft size={14} aria-hidden /></button>
          <button type="button" className="btn btn-sm btn-icon" disabled={next === undefined} onClick={() => next !== undefined && onGo(targetOf(next))} aria-label="Next question"><CaretRight size={14} aria-hidden /></button>
        </div>
      )}
    </footer>
  );
}

function Body({ t, closeBtn, onClose }: { t: SolveTarget; closeBtn: React.RefObject<HTMLButtonElement | null>; onClose(): void }) {
  const sol = SOLUTIONS[t.slug];
  const key = SOLVE_MAP[t.slug], [topicId, nStr] = key?.split(":") ?? [], topic = topicId ? topicById(topicId) : undefined, pattern = topic?.patterns.find((p) => p.n === +nStr);
  const [tab, setTab] = useState<"solution" | "pattern">(sol ? "solution" : "pattern");
  const [copied, setCopied] = useState(false);
  const diagram = useMemo(() => (tab === "solution" ? sol?.viz() : pattern?.viz.make()), [tab, sol, pattern]);

  const code = tab === "solution" ? sol?.code : pattern?.code;
  const copy = () => { if (!code) return; void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <>
        <header className="flex items-start gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="solve-title" className="t-h2">{t.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`pill lv-${t.level}`}>{t.level}</span>
              <a href={t.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-muted transition-colors hover:text-accent">Open on LeetCode<ArrowUpRight size={14} aria-hidden /></a>
            </div>
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mr-2 shrink-0"><X size={18} aria-hidden /></button>
        </header>

        <div className="flex gap-1 border-b border-line px-6" role="tablist" aria-label="View">
          {([["solution", "Solution", !!sol], ["pattern", pattern ? `Pattern: ${pattern.name}` : "Pattern", !!pattern]] as const).filter(([, , ok]) => ok).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`relative cursor-pointer px-3 py-3 text-sm font-semibold transition-colors ${tab === k ? "text-ink" : "text-muted hover:text-ink"}`}>
              {label}
              {tab === k && <motion.span layoutId="solve-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
              {tab === "solution" && sol && (
                <>
                  <p className="callout text-sm leading-relaxed"><span className="font-semibold">Key move: </span>{sol.approach}</p>
                  <ol className="flex flex-col gap-2">{sol.idea.map((x, i) => <li key={x} className="flex gap-3 text-sm leading-relaxed"><span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-accent">{i + 1}</span>{x}</li>)}</ol>
                </>
              )}
              {tab === "pattern" && pattern && topic && (
                <>
                  <p className="text-sm text-muted">{SOLVE_EXACT.has(t.slug) ? "This question is in this pattern's practice list." : "Closest pattern, matched from the question's LeetCode tags."}</p>
                  {PLAIN[`${topic.id}:${pattern.n}`] && <p className="callout text-sm leading-relaxed">{PLAIN[`${topic.id}:${pattern.n}`].plain}</p>}
                  <p className="text-sm leading-relaxed">{pattern.summary}</p>
                </>
              )}
              {!sol && !pattern && <p className="empty">{t.sql ? "SQL questions get hand-written solutions in batches. This one is not written yet; open it on LeetCode and try a JOIN or GROUP BY first." : "No pattern matched this question yet."}</p>}

              {diagram && <Visualizer diagram={diagram} keys />}

              {(sol || pattern) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="tile"><div className="text-xs text-muted">Time</div><div className="num mt-0.5 text-base font-semibold">{tab === "solution" ? sol!.time : pattern!.complexity.average}</div></div>
                  <div className="tile"><div className="text-xs text-muted">Extra space</div><div className="num mt-0.5 text-base font-semibold">{tab === "solution" ? sol!.space : pattern!.complexity.space}</div></div>
                </div>
              )}

              {code && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="t-h3">{tab === "solution" ? (sol!.lang === "sql" ? "Solution (MySQL)" : "Solution (Python)") : "Pattern template (Python)"}</h3>
                    <button type="button" className="btn btn-sm" onClick={copy}>{copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}</button>
                  </div>
                  <pre className="code"><code>{code}</code></pre>
                </div>
              )}

              {pattern && topic && (
                <Link href={`/patterns/${topic.id}#p-${pattern.n}`} onClick={onClose} className="btn btn-nav justify-between">
                  <span><span className="block text-xs font-normal text-muted">Study the pattern</span>{topic.name}: {pattern.name}</span><ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
    </>
  );
}

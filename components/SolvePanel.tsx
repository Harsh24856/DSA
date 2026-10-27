"use client";
// "Solve" side sheet for any question: its hand-written solution (when there is one) and its closest pattern.
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, Copy, Lightbulb, X } from "@phosphor-icons/react";
import { SOLUTIONS } from "@/lib/solutions";
import { SOLVE_EXACT, SOLVE_MAP } from "@/lib/patterns/solveMap";
import { topicById } from "@/lib/patterns";
import { PLAIN } from "@/lib/patterns/plain";
import { Visualizer } from "./Visualizer";

export type SolveTarget = { slug: string; title: string; level: string; url: string; sql?: boolean };
const Ctx = createContext<(t: SolveTarget) => void>(() => {});
export const useSolve = () => useContext(Ctx);

export function SolveProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<SolveTarget | null>(null);
  const open = useCallback((t: SolveTarget) => setTarget(t), []);
  return (
    <Ctx.Provider value={open}>
      {children}
      <AnimatePresence>{target && <Sheet key={target.slug} t={target} onClose={() => setTarget(null)} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

/** Small button used on question rows. */
export function SolveButton({ t, className = "" }: { t: SolveTarget; className?: string }) {
  const open = useSolve();
  const has = !!SOLUTIONS[t.slug];
  return (
    <motion.button type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} onClick={() => open(t)}
      className={`inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-[12px] font-semibold transition-colors ${has ? "border-accent/50 bg-accent-soft text-accent hover:bg-accent hover:text-accent-ink" : "border-line bg-surface text-muted hover:border-accent/50 hover:text-ink"} ${className}`}
      aria-label={`${has ? "Solution" : "Approach"} for ${t.title}`}>
      <Lightbulb size={13} weight={has ? "fill" : "regular"} aria-hidden />{has ? "Solution" : "Approach"}
    </motion.button>
  );
}

function Sheet({ t, onClose }: { t: SolveTarget; onClose(): void }) {
  const sol = SOLUTIONS[t.slug];
  const key = SOLVE_MAP[t.slug], [topicId, nStr] = key?.split(":") ?? [], topic = topicId ? topicById(topicId) : undefined, pattern = topic?.patterns.find((p) => p.n === +nStr);
  const [tab, setTab] = useState<"solution" | "pattern">(sol ? "solution" : "pattern");
  const [copied, setCopied] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const diagram = useMemo(() => (tab === "solution" ? sol?.viz() : pattern?.viz.make()), [tab, sol, pattern]);

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const code = tab === "solution" ? sol?.code : pattern?.code;
  const copy = () => { if (!code) return; void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="fixed inset-0 z-50">
      <motion.div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden />
      <motion.aside role="dialog" aria-modal="true" aria-labelledby="solve-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col border-l border-line bg-surface shadow-card"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 36 }}>
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="solve-title" className="text-[19px] font-semibold leading-snug">{t.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
              <span className={`pill lv-${t.level}`}>{t.level}</span>
              <a href={t.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-muted hover:text-accent">Open on LeetCode<ArrowUpRight size={12} aria-hidden /></a>
            </div>
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-ink"><X size={18} aria-hidden /></button>
        </header>

        <div className="flex gap-1 border-b border-line px-5" role="tablist" aria-label="View">
          {([["solution", "Solution", !!sol], ["pattern", pattern ? `Pattern: ${pattern.name}` : "Pattern", !!pattern]] as const).filter(([, , ok]) => ok).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`relative cursor-pointer px-3 py-2.5 text-[13px] font-semibold transition-colors ${tab === k ? "text-ink" : "text-muted hover:text-ink"}`}>
              {label}
              {tab === k && <motion.span layoutId="solve-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex flex-col gap-5">
              {tab === "solution" && sol && (
                <>
                  <p className="rounded-[14px] border-l-4 border-accent bg-accent-soft px-4 py-3 text-[15px] leading-relaxed"><span className="font-semibold">Key move: </span>{sol.approach}</p>
                  <ol className="flex flex-col gap-2">{sol.idea.map((x, i) => <li key={x} className="flex gap-3 text-[14px] leading-relaxed"><span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold text-accent">{i + 1}</span>{x}</li>)}</ol>
                </>
              )}
              {tab === "pattern" && pattern && topic && (
                <>
                  <p className="text-[13px] text-muted">{SOLVE_EXACT.has(t.slug) ? "This question is in this pattern's practice list." : "Closest pattern, matched from the question's LeetCode tags."}</p>
                  {PLAIN[`${topic.id}:${pattern.n}`] && <p className="rounded-[14px] border-l-4 border-accent bg-accent-soft px-4 py-3 text-[15px] leading-relaxed">{PLAIN[`${topic.id}:${pattern.n}`].plain}</p>}
                  <p className="text-[14px] leading-relaxed">{pattern.summary}</p>
                </>
              )}
              {!sol && !pattern && <p className="text-[14px] text-muted">{t.sql ? "SQL questions get hand-written solutions in batches. This one is not written yet; open it on LeetCode and try a JOIN or GROUP BY first." : "No pattern matched this question yet."}</p>}

              {diagram && <Visualizer diagram={diagram} />}

              {(sol || pattern) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[12px] bg-surface-2 p-3"><div className="text-[12px] text-muted">Time</div><div className="num mt-0.5 text-[15px] font-semibold">{tab === "solution" ? sol!.time : pattern!.complexity.average}</div></div>
                  <div className="rounded-[12px] bg-surface-2 p-3"><div className="text-[12px] text-muted">Extra space</div><div className="num mt-0.5 text-[15px] font-semibold">{tab === "solution" ? sol!.space : pattern!.complexity.space}</div></div>
                </div>
              )}

              {code && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">{tab === "solution" ? (sol!.lang === "sql" ? "Solution (MySQL)" : "Solution (Python)") : "Pattern template (Python)"}</h3>
                    <button type="button" className="btn h-8 px-2.5 text-[12px]" onClick={copy}>{copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}</button>
                  </div>
                  <pre className="overflow-x-auto rounded-[14px] border border-line bg-bg p-4 text-[12.5px] leading-relaxed"><code className="font-mono">{code}</code></pre>
                </div>
              )}

              {pattern && topic && (
                <Link href={`/patterns/${topic.id}#p-${pattern.n}`} onClick={onClose} className="btn h-auto justify-between py-3">
                  <span><span className="block text-[12px] font-normal text-muted">Study the pattern</span>{topic.name}: {pattern.name}</span><ArrowRight size={16} aria-hidden />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.aside>
    </div>
  );
}

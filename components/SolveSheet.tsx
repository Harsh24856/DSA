"use client";
// "Solve" side sheet for any question: its hand-written solution and its closest pattern.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, CaretLeft, CaretRight, Check, Copy, X } from "@phosphor-icons/react";
import { HOW, todayPlan, type How } from "@/lib/logic";
import { hasPuzzle, patternOptions, shuffle } from "@/lib/practice";
import { SOLUTIONS } from "@/lib/solutions";
import { SOLVE_EXACT, SOLVE_MAP } from "@/lib/patterns/solveMap";
import { topicById } from "@/lib/patterns";
import { alsoRight, QUIZ } from "@/lib/patterns/quiz";
import { PLAIN } from "@/lib/patterns/plain";
import { CF_PATTERN } from "@/lib/solutions/codeforces";
import { useStore } from "@/lib/store";
import { LinePuzzle } from "./LinePuzzle";
import { Visualizer } from "./Visualizer";
import { peeked, solveTarget, type SolveTarget } from "./SolvePanel";

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
        <Sheet key={t.slug} t={t} closeBtn={closeBtn} onClose={onClose} onGo={onGo} />
      </motion.aside>
    </div>
  );
}

type Stage = 0 | 1 | 2 | 3;   // revealed so far: nothing, key move, steps, everything

/** Holds what has been revealed, because ticking in the footer counts it as help. */
function Sheet({ t, closeBtn, onClose, onGo }: { t: SolveTarget; closeBtn: React.RefObject<HTMLButtonElement | null>; onClose(): void; onGo(t: SolveTarget): void }) {
  const { state } = useStore();
  const [start] = useState(() => (t.i === undefined ? undefined : peeked.get(t.i)));
  const [how, setHow] = useState<How | undefined>(start);
  // A solved question opens in full, unless this is a revisit, which is a re-solve. No solution written means there is nothing to cover.
  const [stage, setStage] = useState<Stage>(() => (!SOLUTIONS[t.slug] || (t.i !== undefined && state.done[t.i] && !t.again) ? 3 : start === "e" ? 3 : start === "h" ? 1 : 0));
  const peek = (h: How) => { setHow((was) => { const next = was === "e" ? "e" : h; if (t.i !== undefined) peeked.set(t.i, next); return next; }); };
  const reveal = (s: Stage) => { setStage(s); peek(s === 3 ? "e" : "h"); };
  return (
    <>
      <Body t={t} closeBtn={closeBtn} onClose={onClose} stage={stage} reveal={reveal} peek={peek} />
      {t.i !== undefined && <Footer i={t.i} how={how} onGo={onGo} />}
    </>
  );
}

/** Tick the question and move through today's list without going back to the page. */
function Footer({ i, how, onGo }: { i: number; how?: How; onGo(t: SolveTarget): void }) {
  const { state, now, toggle } = useStore();
  const list = todayPlan(state, now).main;
  const at = list.indexOf(i), done = !!state.done[i];
  const prev = at > 0 ? list[at - 1] : undefined, next = at >= 0 && at < list.length - 1 ? list[at + 1] : undefined;
  return (
    <footer className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-3">
      <button type="button" className={`btn btn-sm ${done ? "" : "btn-primary"}`} aria-pressed={done} onClick={() => toggle(i, !done, how)}>
        <Check size={14} weight="bold" aria-hidden />{done ? "Solved" : "Mark solved"}
      </button>
      {!done && how && <span className="text-xs text-muted">Counts as {HOW[how]}</span>}
      {at >= 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="num text-xs text-muted">{at + 1} of {list.length} today</span>
          <button type="button" className="btn btn-sm btn-icon" disabled={prev === undefined} onClick={() => prev !== undefined && onGo(solveTarget(prev))} aria-label="Previous question"><CaretLeft size={14} aria-hidden /></button>
          <button type="button" className="btn btn-sm btn-icon" disabled={next === undefined} onClick={() => next !== undefined && onGo(solveTarget(next))} aria-label="Next question"><CaretRight size={14} aria-hidden /></button>
        </div>
      )}
    </footer>
  );
}

/** Try first: choose the pattern before any of the answer shows. */
function PatternPick({ slug, patternKey, peek }: { slug: string; patternKey: string; peek(h: How): void }) {
  const answer = QUIZ.find((p) => p.key === patternKey)!;
  const [options] = useState(() => shuffle(patternOptions(answer, QUIZ, alsoRight(slug, patternKey))));
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">Which pattern fits?</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const isRight = !!picked && o === answer.name, isWrong = picked === o && !isRight;
          return (
            <button key={o} type="button" aria-pressed={picked === o} onClick={() => { if (picked) return; setPicked(o); if (o !== answer.name) peek("h"); }}
              className={`btn btn-sm h-auto justify-start gap-2 py-2 text-left font-normal whitespace-normal ${isRight ? "border-easy text-easy" : isWrong ? "border-hard text-hard" : ""}`}>
              {isRight && <Check size={14} weight="bold" className="shrink-0" aria-hidden />}{isWrong && <X size={14} weight="bold" className="shrink-0" aria-hidden />}<span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked && <p className="text-sm leading-relaxed" aria-live="polite"><span className="font-semibold">{picked === answer.name ? "Right." : `It is ${answer.name}.`}</span> How to spot it: {answer.signals.join("; ")}.</p>}
    </div>
  );
}

function Body({ t, closeBtn, onClose, stage, reveal, peek }: { t: SolveTarget; closeBtn: React.RefObject<HTMLButtonElement | null>; onClose(): void; stage: Stage; reveal(s: Stage): void; peek(h: How): void }) {
  const sol = SOLUTIONS[t.slug];
  const cf = t.slug.startsWith("cf:");
  const key = SOLVE_MAP[t.slug] ?? CF_PATTERN[t.slug], [topicId, nStr] = key?.split(":") ?? [], topic = topicId ? topicById(topicId) : undefined, pattern = topic?.patterns.find((p) => p.n === +nStr);
  const [tab, setTab] = useState<"solution" | "pattern">(sol ? "solution" : "pattern");
  const [copied, setCopied] = useState(false);
  const [puzzle, setPuzzle] = useState(false);
  const covered = tab === "solution" && stage < 3;   // the player and code wait until everything is revealed
  const diagram = useMemo(() => (covered ? undefined : tab === "solution" ? sol?.viz() : pattern?.viz.make()), [covered, tab, sol, pattern]);
  // only a pattern that lists this question, not one matched from tags, is a fair quiz
  const quizzable = !!key && (cf || SOLVE_EXACT.has(t.slug));

  const code = tab === "solution" ? sol?.code : pattern?.code;
  const copy = () => { if (!code) return; void navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <>
        <header className="flex items-start gap-3 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="solve-title" className="t-h2">{t.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`pill lv-${t.level.split(" ")[0]}`}>{t.level}</span>
              <a href={t.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-medium text-muted transition-colors hover:text-accent">{cf ? "Open on Codeforces" : "Open on LeetCode"}<ArrowUpRight size={14} aria-hidden /></a>
            </div>
          </div>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-icon -mr-2 shrink-0"><X size={18} aria-hidden /></button>
        </header>

        <div className="flex gap-1 border-b border-line px-6" role="tablist" aria-label="View">
          {([["solution", "Solution", !!sol], ["pattern", pattern && stage > 0 ? `Pattern: ${pattern.name}` : "Pattern", !!pattern]] as const).filter(([, , ok]) => ok).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); if (k === "pattern" && stage < 1) reveal(1); }}
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
                  {sol.example && (
                    <div className="tile">
                      <p className="text-xs text-muted">This row opens your top unsolved problem on Codeforces, which changes as you solve. Here is a worked example of the same tag.</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed">{sol.example}</p>
                    </div>
                  )}
                  {stage === 0 && (
                    <div className="tile flex flex-col gap-4 p-4">
                      <div>
                        <h3 className="t-h3">Try it first</h3>
                        <p className="mt-1 text-sm text-muted">Recalling before you read is what makes it stick. Give it a real attempt, then reveal only as much as you need.</p>
                      </div>
                      {quizzable && <PatternPick slug={t.slug} patternKey={key} peek={peek} />}
                    </div>
                  )}
                  {stage >= 1 && <p className="callout text-sm leading-relaxed"><span className="font-semibold">Key move: </span>{sol.approach}</p>}
                  {stage >= 2 && <ol className="flex flex-col gap-2">{sol.idea.map((x, i) => <li key={x} className="flex gap-3 text-sm leading-relaxed"><span className="num grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-accent">{i + 1}</span>{x}</li>)}</ol>}
                  {stage < 3 && (
                    <div className="flex flex-wrap gap-2">
                      {stage < 2 && <button type="button" className="btn btn-sm btn-primary" onClick={() => reveal((stage + 1) as Stage)}>{stage === 0 ? "Show key move" : "Show steps"}</button>}
                      <button type="button" className={`btn btn-sm ${stage === 2 ? "btn-primary" : "btn-ghost"}`} onClick={() => reveal(3)}>{stage === 2 ? "Show full solution" : "Skip to full solution"}</button>
                    </div>
                  )}
                </>
              )}
              {tab === "pattern" && pattern && topic && (
                <>
                  <p className="text-sm text-muted">{cf ? "Closest pattern for this tag." : SOLVE_EXACT.has(t.slug) ? "This question is in this pattern's practice list." : "Closest pattern, matched from the question's LeetCode tags."}</p>
                  {PLAIN[`${topic.id}:${pattern.n}`] && <p className="callout text-sm leading-relaxed">{PLAIN[`${topic.id}:${pattern.n}`].plain}</p>}
                  <p className="text-sm leading-relaxed">{pattern.summary}</p>
                </>
              )}
              {!sol && !pattern && <p className="empty">{t.sql ? "SQL questions get hand-written solutions in batches. This one is not written yet; open it on LeetCode and try a JOIN or GROUP BY first." : "No pattern matched this question yet."}</p>}

              {diagram && <Visualizer diagram={diagram} keys />}

              {!covered && (sol || pattern) && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="tile"><div className="text-xs text-muted">Time</div><div className="num mt-0.5 text-base font-semibold">{tab === "solution" ? sol!.time : pattern!.complexity.average}</div></div>
                  <div className="tile"><div className="text-xs text-muted">Extra space</div><div className="num mt-0.5 text-base font-semibold">{tab === "solution" ? sol!.space : pattern!.complexity.space}</div></div>
                </div>
              )}

              {!covered && code && (
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="t-h3">{tab === "solution" ? (sol!.lang === "sql" ? "Solution (MySQL)" : "Solution (Python)") : "Pattern template (Python)"}</h3>
                    <div className="flex items-center gap-2">
                      {tab === "solution" && hasPuzzle(code) && <button type="button" className="btn btn-sm" aria-pressed={puzzle} onClick={() => setPuzzle((p) => !p)}>{puzzle ? "Show code" : "Line order puzzle"}</button>}
                      {!(tab === "solution" && puzzle) && <button type="button" className="btn btn-sm" onClick={copy}>{copied ? <><Check size={14} aria-hidden />Copied</> : <><Copy size={14} aria-hidden />Copy</>}</button>}
                    </div>
                  </div>
                  {tab === "solution" && puzzle ? <LinePuzzle code={code} /> : <pre className="code"><code>{code}</code></pre>}
                </div>
              )}

              {!covered && pattern && topic && (
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

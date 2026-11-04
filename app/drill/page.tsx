"use client";
// Pattern drill: name the pattern for a question or a signal, mixed across topics. Misses come back first in the next round.
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, X } from "@phosphor-icons/react";
import { PracticeTabs } from "@/components/PracticeTabs";
import { Bar, Card, Skeleton } from "@/components/ui";
import { drillPool, QUIZ } from "@/lib/patterns/quiz";
import { PLAIN } from "@/lib/patterns/plain";
import { usePatterns } from "@/lib/patternStore";
import { drillRound, type DrillQ } from "@/lib/practice";

const ROUND = 10;

export default function Drill() {
  const { ready, done, toggle } = usePatterns();
  const pool = useMemo(drillPool, []);
  const [round, setRound] = useState<DrillQ[] | null>(null);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const missed = useMemo(() => new Set(Object.keys(done).filter((k) => k.startsWith("drill:")).map((k) => k.slice(6))), [done]);

  const start = () => { setRound(drillRound(pool, QUIZ, missed, ROUND)); setAt(0); setPicks([]); };
  const answer = (q: DrillQ, o: string) => {
    setPicks((p) => [...p, o]);
    if (!q.slug) return;
    if (o !== q.answer.name) toggle(`drill:${q.slug}`, true); else if (missed.has(q.slug)) toggle(`drill:${q.slug}`, false);
  };

  if (!ready) return <><PracticeTabs /><Skeleton className="h-72" /></>;

  if (!round) return (
    <><PracticeTabs />
      <Card title="Name the pattern" sub={`${ROUND} questions mixed across topics, the way a real test mixes them.`}>
        <p className="text-sm leading-relaxed">Spotting the pattern is the step you have to do alone in an OA. Each question gives you a problem name or a signal, and you choose the pattern. Wrong answers show how to spot it.</p>
        <p className="mt-2 text-sm text-muted">{missed.size ? `${missed.size} ${missed.size === 1 ? "question" : "questions"} you missed will come back first.` : `${pool.length} questions to draw from.`}</p>
        <button type="button" className="btn btn-primary mt-4" onClick={start}>Start round</button>
      </Card>
    </>
  );

  if (at >= round.length) {
    const score = round.filter((q, k) => picks[k] === q.answer.name).length, wrong = round.filter((q, k) => picks[k] !== q.answer.name);
    return (
      <><PracticeTabs />
        <Card title="Round finished" sub={`${score} of ${round.length} right`}>
          <Bar value={score} max={round.length} />
          {wrong.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {wrong.map((q) => { const [topic, n] = q.answer.key.split(":"); return (
                <li key={q.prompt}><Link href={`/patterns/${topic}#p-${n}`} className="btn btn-nav justify-between"><span className="min-w-0"><span className="block truncate text-xs font-normal text-muted">{q.prompt}</span>{q.answer.name}</span><ArrowRight size={16} className="shrink-0" aria-hidden /></Link></li>
              ); })}
            </ul>
          )}
          <button type="button" className="btn btn-primary mt-4" onClick={start}>Start another round</button>
        </Card>
      </>
    );
  }

  const q = round[at], picked = picks[at], [topic, n] = q.answer.key.split(":");
  return (
    <><PracticeTabs />
      <Card title={`Question ${at + 1} of ${round.length}`} sub={q.kind === "title" ? "Which pattern solves this question?" : "Which pattern does this signal point to?"}>
        <Bar value={at + (picked ? 1 : 0)} max={round.length} />
        <p className="t-h3 mt-4">{q.prompt}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.options.map((o) => {
            const isRight = !!picked && o === q.answer.name, isWrong = picked === o && !isRight;
            return (
              <button key={o} type="button" aria-pressed={picked === o} onClick={() => { if (!picked) answer(q, o); }}
                className={`btn h-auto justify-start gap-2 py-2 text-left whitespace-normal ${isRight ? "border-easy text-easy" : isWrong ? "border-hard text-hard" : ""}`}>
                {isRight && <Check size={16} weight="bold" className="shrink-0" aria-hidden />}{isWrong && <X size={16} weight="bold" className="shrink-0" aria-hidden />}<span>{o}</span>
              </button>
            );
          })}
        </div>
        {picked && (
          <div className="mt-4 flex flex-col gap-3" aria-live="polite">
            <div className="callout text-sm leading-relaxed">
              <p className="font-semibold">{picked === q.answer.name ? "Right" : "Not this one"}: {q.answer.name}</p>
              {PLAIN[q.answer.key] && <p className="mt-1">{PLAIN[q.answer.key].remember}</p>}
              <p className="mt-2 text-muted">How to spot it: {q.answer.signals.join("; ")}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => setAt((a) => a + 1)}>{at + 1 < round.length ? "Next question" : "See results"}</button>
              <Link href={`/patterns/${topic}#p-${n}`} className="btn">Study this pattern</Link>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

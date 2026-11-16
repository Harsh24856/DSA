"use client";
// The question bank at the bottom of a module: filter by level, answer, see why. The score is for this visit only.
import { useMemo, useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import { mcqOptions, questionKey, seededRng, type GQuestion, type Level } from "@/lib/genai2/core";
import { usePatterns } from "@/lib/patternStore";
import { Rich } from "../other/Rich";

const LEVELS: ("all" | Level)[] = ["all", "easy", "medium", "hard"];
type Picks = Record<string, string | boolean>;
type Pick = (id: string, v: string | boolean) => void;

function Mcq({ q, moduleId, pick, onPick }: { q: Extract<GQuestion, { answer: string; wrong: string[] }>; moduleId: string; pick?: string | boolean; onPick: Pick }) {
  const opts = useMemo(() => mcqOptions(q, seededRng(`${moduleId}:${q.id}`)), [q, moduleId]);
  return (
    <>
      <Rich className="font-medium" text={q.q} />
      {q.code && <pre className="code"><code>{q.code}</code></pre>}
      <Choices className="grid gap-2" opts={opts} answer={q.answer} pick={pick} onPick={(o) => onPick(q.id, o)} />
      <Verdict pick={pick !== undefined} ok={pick === q.answer} answer={q.answer} why={q.why} />
    </>
  );
}

// Answer buttons. Once answered they stay readable (aria-disabled, not disabled) and mark your pick and the right answer.
export function Choices<T extends string | boolean>({ opts, answer, pick, onPick, className }: { opts: T[]; answer: T; pick?: string | boolean | null; onPick: (o: T) => void; className: string }) {
  const done = pick !== undefined && pick !== null;
  return (
    <div className={className}>
      {opts.map((o) => {
        const mine = done && pick === o, right = done && o === answer;
        return (
          <button key={String(o)} type="button" aria-disabled={done || undefined} aria-pressed={mine} onClick={() => { if (!done) onPick(o); }}
            className={`btn justify-start whitespace-normal text-left ${done ? "cursor-default" : ""} ${right ? "text-easy" : mine ? "text-hard" : ""}`}>
            {right ? <Check size={16} weight="bold" className="shrink-0" aria-hidden /> : mine ? <X size={16} weight="bold" className="shrink-0" aria-hidden /> : null}
            {typeof o === "boolean" ? (o ? "True" : "False") : o}
            {(mine || right) && <span className="sr-only">, {[mine && "your answer", right && "correct answer"].filter(Boolean).join(", ")}</span>}
          </button>
        );
      })}
    </div>
  );
}

const Verdict = ({ pick, ok, answer, why }: { pick: boolean; ok: boolean; answer: string; why: string }) => (
  <div className="text-sm leading-relaxed" role="status">
    {pick && <><strong className={ok ? "text-easy" : "text-hard"}>{ok ? "Right. " : `Not quite, it is ${answer}. `}</strong><Rich text={why} /></>}
  </div>
);

function Trap({ q, pick, onPick }: { q: Extract<GQuestion, { kind: "trap" }>; pick?: string | boolean; onPick: Pick }) {
  return (
    <>
      <Rich className="font-medium" text={q.claim} />
      <Choices className="flex flex-wrap gap-2" opts={[true, false]} answer={q.truth} pick={pick} onPick={(v) => onPick(q.id, v)} />
      <Verdict pick={pick !== undefined} ok={pick === q.truth} answer={q.truth ? "true" : "false"} why={q.why} />
    </>
  );
}

function Explain({ q, moduleId }: { q: Extract<GQuestion, { kind: "explain" }>; moduleId: string }) {
  const { done, toggle } = usePatterns();
  const [open, setOpen] = useState(false);
  const key = questionKey(moduleId, q.id), on = !!done[key];
  return (
    <>
      <Rich className="font-medium" text={q.q} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide answer" : "Show answer"}</button>
        <button type="button" className="btn btn-sm" aria-pressed={on} onClick={() => toggle(key, !on)}>
          <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>I can answer
        </button>
      </div>
      {open && <div className="callout text-sm leading-relaxed"><Rich text={q.answer} /></div>}
    </>
  );
}

export function Questions({ moduleId, questions }: { moduleId: string; questions: GQuestion[] }) {
  const [level, setLevel] = useState<"all" | Level>("all");
  const [picks, setPicks] = useState<Picks>({});
  const onPick: Pick = (id, v) => setPicks((p) => ({ ...p, [id]: v }));
  const right = (q: GQuestion) => (q.kind === "trap" ? picks[q.id] === q.truth : q.kind !== "explain" && picks[q.id] === q.answer);
  const score = { right: questions.filter((q) => q.id in picks && right(q)).length, tried: questions.filter((q) => q.id in picks).length };
  const shown = questions.filter((q) => level === "all" || q.level === level);
  return (
    <section className="card flex flex-col gap-4 p-6" aria-labelledby="gq-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="gq-title" className="t-h2">Questions</h2>
        <span className="num text-sm text-muted">{score.right} right of {score.tried} tried</span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
        {LEVELS.map((l) => <button key={l} type="button" className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>{l === "all" ? "All" : l[0].toUpperCase() + l.slice(1)}</button>)}
      </div>
      <ol className="grid gap-4">
        {shown.map((q) => (
          <li key={q.id} className="tile grid min-w-0 gap-3 p-4">
            <span className={`pill lv-${q.level} w-fit`}>{q.level}</span>
            {q.kind === "explain" ? <Explain q={q} moduleId={moduleId} /> : q.kind === "trap" ? <Trap q={q} pick={picks[q.id]} onPick={onPick} /> : <Mcq q={q} moduleId={moduleId} pick={picks[q.id]} onPick={onPick} />}
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";
// The question bank at the bottom of a module: filter by level, answer, see why. The score is for this visit only.
import { useMemo, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { mcqOptions, questionKey, type GQuestion, type Level } from "@/lib/genai2";
import { usePatterns } from "@/lib/patternStore";
import { Rich } from "../other/Rich";

const LEVELS: ("all" | Level)[] = ["all", "easy", "medium", "hard"];
type Report = (right: boolean) => void;

function Mcq({ q, report }: { q: Extract<GQuestion, { answer: string; wrong: string[] }>; report: Report }) {
  const opts = useMemo(() => mcqOptions(q), [q]);
  const [pick, setPick] = useState<string | null>(null);
  return (
    <>
      <p className="font-medium"><Rich text={q.q} /></p>
      {q.code && <pre className="code"><code>{q.code}</code></pre>}
      <div className="grid gap-2">
        {opts.map((o) => <button key={o} type="button" className="btn justify-start text-left" disabled={pick !== null} aria-pressed={pick === o} onClick={() => { setPick(o); report(o === q.answer); }}>{o}</button>)}
      </div>
      {pick !== null && <Verdict ok={pick === q.answer} answer={q.answer} why={q.why} />}
    </>
  );
}

const Verdict = ({ ok, answer, why }: { ok: boolean; answer: string; why: string }) => (
  <p className="text-sm leading-relaxed" role="status">
    <strong className={ok ? "text-easy" : "text-hard"}>{ok ? "Right. " : `Not quite, it is ${answer}. `}</strong><Rich text={why} />
  </p>
);

function Trap({ q, report }: { q: Extract<GQuestion, { kind: "trap" }>; report: Report }) {
  const [pick, setPick] = useState<boolean | null>(null);
  return (
    <>
      <p className="font-medium"><Rich text={q.claim} /></p>
      <div className="flex gap-2">
        {[true, false].map((v) => <button key={String(v)} type="button" className="btn" disabled={pick !== null} aria-pressed={pick === v} onClick={() => { setPick(v); report(v === q.truth); }}>{v ? "True" : "False"}</button>)}
      </div>
      {pick !== null && <Verdict ok={pick === q.truth} answer={q.truth ? "true" : "false"} why={q.why} />}
    </>
  );
}

function Explain({ q, moduleId }: { q: Extract<GQuestion, { kind: "explain" }>; moduleId: string }) {
  const { done, toggle } = usePatterns();
  const [open, setOpen] = useState(false);
  const key = questionKey(moduleId, q.id), on = !!done[key];
  return (
    <>
      <p className="font-medium"><Rich text={q.q} /></p>
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
  const [score, setScore] = useState({ right: 0, tried: 0 });
  const report: Report = (right) => setScore((s) => ({ right: s.right + +right, tried: s.tried + 1 }));
  const shown = questions.filter((q) => level === "all" || q.level === level);
  return (
    <section className="card flex flex-col gap-4 p-6" aria-labelledby="gq-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="gq-title" className="t-h2">Questions</h2>
        <span className="num text-sm text-muted" role="status">{score.right} right of {score.tried} tried</span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
        {LEVELS.map((l) => <button key={l} type="button" className="chip" aria-pressed={level === l} onClick={() => setLevel(l)}>{l === "all" ? "All" : l[0].toUpperCase() + l.slice(1)}</button>)}
      </div>
      <ol className="grid gap-4">
        {shown.map((q) => (
          <li key={q.id} className="tile grid gap-3 p-4">
            <span className={`pill lv-${q.level} w-fit`}>{q.level}</span>
            {q.kind === "explain" ? <Explain q={q} moduleId={moduleId} /> : q.kind === "trap" ? <Trap q={q} report={report} /> : <Mcq q={q} report={report} />}
          </li>
        ))}
      </ol>
    </section>
  );
}

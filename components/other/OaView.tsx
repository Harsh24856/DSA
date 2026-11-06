"use client";
// OA questions for CS core: practice one subject with answers as you go, or sit a timed mixed test with answers at the end.
// The running round lives in localStorage, so a reload keeps it. Misses and test scores go in the patterns store.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Timer, X } from "@phosphor-icons/react";
import { fmtDay, parse } from "@/lib/logic";
import type { OaQuestion, OaSubject } from "@/lib/other/types";
import { usePatterns } from "@/lib/patternStore";
import { clock, mockLeft, oaRound, shuffle } from "@/lib/practice";
import { inline, Rich } from "./Rich";
import { Bar, Card, Skeleton } from "../ui";

const LS = "dsa-oa-v1", PRACTICE_SIZE = 10, TEST_SIZE = 20, TEST_MINUTES = 20;
type Q = OaQuestion & { key: string; subject: string };
/** `subject` is null for the timed mixed test. */
type Run = { subject: string | null; start: number; keys: string[]; options: string[][]; picks: (string | null)[]; at: number; ended?: number };
const save = (r: Run | null) => { try { if (r) localStorage.setItem(LS, JSON.stringify(r)); else localStorage.removeItem(LS); } catch {} };
const tick = (key: string) => `oa:${key}`;

function Body({ q }: { q: Q }) {
  return (
    <>
      <Rich text={q.q} className="text-sm leading-relaxed" />
      {q.code && <pre className="code mt-2 overflow-x-auto text-xs" tabIndex={0}>{[q.code.setup, q.code.src].filter(Boolean).join("\n\n")}</pre>}
    </>
  );
}

export function OaView({ subjects }: { subjects: OaSubject[] }) {
  const { ready, done, toggle } = usePatterns();
  const [run, setRun] = useState<Run | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [time, setTime] = useState(0);
  const [sure, setSure] = useState(false);
  const pool = useMemo(() => subjects.flatMap((s) => s.questions.map((q): Q => ({ ...q, subject: s.id, key: `${s.id}:${q.id}` }))), [subjects]);
  const byKey = useMemo(() => new Map(pool.map((q) => [q.key, q])), [pool]);
  const missed = useMemo(() => new Set(pool.filter((q) => done[tick(q.key)]).map((q) => q.key)), [pool, done]);

  const update = (r: Run | null) => { save(r); setRun(r); };
  const begin = (subject: string | null) => {
    const qs = oaRound(subject ? pool.filter((q) => q.subject === subject) : pool, missed, subject ? PRACTICE_SIZE : TEST_SIZE);
    update({ subject, start: Date.now(), keys: qs.map((q) => q.key), options: qs.map((q) => shuffle([q.answer, ...q.wrong])), picks: qs.map(() => null), at: 0 });
  };
  const finish = (r: Run, at: number) => {
    let right = 0;
    r.keys.forEach((key, k) => {
      const pick = r.picks[k];
      if (pick === byKey.get(key)!.answer) { right++; if (missed.has(key)) toggle(tick(key), false); }
      else if (pick || !r.subject) toggle(tick(key), true);   // leaving a practice round early does not count the rest as missed
    });
    if (!r.subject) toggle(`oatest:${r.start}`, true, { s: right, n: r.keys.length });
    update({ ...r, ended: at });
    setSure(false);
  };

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(LS) || "null") as Run | null; if (r?.keys?.length && r.keys.every((k) => byKey.has(k))) setRun(r); } catch {}
    setTime(Date.now()); setLoaded(true);
  }, [byKey]);
  useEffect(() => {
    if (!run || run.ended || run.subject) return;
    const step = () => { const t = Date.now(); setTime(t); if (!mockLeft(run.start, t, TEST_MINUTES)) finish(run, run.start + TEST_MINUTES * 60000); };
    step();
    const id = setInterval(step, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const back = <Link href="/other" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted no-underline transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />All subjects</Link>;
  if (!ready || !loaded) return <div className="flex flex-col gap-6">{back}<Skeleton className="h-72" /></div>;

  if (!run) {
    const past = Object.entries(done).filter(([k]) => k.startsWith("oatest:")).sort((a, b) => +b[0].slice(7) - +a[0].slice(7)).slice(0, 5);
    return (
      <div className="gx flex flex-col gap-6">
        {back}
        <h2 className="t-title">OA questions</h2>
        <Card title="Timed test" sub={`${TEST_SIZE} questions mixed across subjects, ${TEST_MINUTES} minutes, answers at the end.`}>
          <p className="text-sm leading-relaxed">Practice for the CS core round of an online assessment: concepts, numericals and code output. All {pool.length} questions are original, written for this site, not copied from any company's paper.</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => begin(null)}><Timer size={16} aria-hidden />Start the test</button>
          {past.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              {past.map(([k, v]) => <li key={k} className="flex justify-between gap-4 text-sm"><span>{fmtDay(parse(v.d), true)}</span><span className="num text-muted"><span className="font-semibold text-ink">{v.s ?? 0}</span> of {v.n ?? TEST_SIZE} right</span></li>)}
            </ul>
          )}
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const miss = s.questions.filter((q) => missed.has(`${s.id}:${q.id}`)).length;
            return (
              <section key={s.id} className="card flex flex-col gap-3 p-6" aria-label={s.name}>
                <h3 className="t-h3">{s.name}</h3>
                <div className="flex flex-1 flex-wrap items-start gap-2"><span className="pill pill-muted">{s.questions.length} questions</span>{miss > 0 && <span className="pill pill-accent">{miss} to retry</span>}</div>
                <button type="button" className="btn w-fit" aria-label={`Practice ${s.name}`} onClick={() => begin(s.id)}>Practice {PRACTICE_SIZE}</button>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  const qs = run.keys.map((k) => byKey.get(k)!), timed = !run.subject;
  if (run.ended) {
    const isRight = (k: number) => run.picks[k] === qs[k].answer;
    const score = qs.filter((_, k) => isRight(k)).length;
    const asked = timed ? qs.length : run.picks.filter(Boolean).length;
    const wrong = qs.map((q, k) => ({ q, k })).filter(({ k }) => !isRight(k) && (timed || run.picks[k]));
    return (
      <div className="gx flex flex-col gap-6">
        <Card title={timed ? "Test finished" : "Round finished"} sub={`${score} of ${asked} right`}>
          <Bar value={score} max={asked || 1} />
          {timed && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {subjects.filter((s) => qs.some((q) => q.subject === s.id)).map((s) => {
                const mine = qs.map((q, k) => ({ q, k })).filter(({ q }) => q.subject === s.id);
                return <li key={s.id} className="flex justify-between gap-4 text-sm"><span>{s.name}</span><span className="num text-muted">{mine.filter(({ k }) => isRight(k)).length} of {mine.length}</span></li>;
              })}
            </ul>
          )}
          <button type="button" className="btn btn-primary mt-4" onClick={() => update(null)}>Back to OA questions</button>
        </Card>
        {wrong.length > 0 && (
          <Card title="Review" sub="These come back first next time.">
            <ul className="grid grid-cols-1">
              {wrong.map(({ q, k }) => (
                <li key={q.key} className="border-t border-line py-4 first:border-t-0 first:pt-0">
                  <Body q={q} />
                  <p className="mt-2 text-sm"><span className="text-muted">Your answer: </span>{run.picks[k] ? inline(run.picks[k]!) : "not answered"}</p>
                  <p className="mt-1 text-sm font-semibold">Right answer: {inline(q.answer)}</p>
                  <Rich text={q.why} className="mt-1 text-sm leading-relaxed text-muted" />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  const q = qs[run.at], picked = run.picks[run.at], left = mockLeft(run.start, time, TEST_MINUTES);
  const shown = !timed && !!picked, last = run.at + 1 === qs.length;
  const pick = (o: string) => { if (shown) return; update({ ...run, picks: run.picks.map((p, k) => (k === run.at ? (timed && p === o ? null : o) : p)) }); };
  const go = (at: number) => update({ ...run, at });
  return (
    <div className="gx flex flex-col gap-6">
      <Card title={`Question ${run.at + 1} of ${qs.length}`} sub={subjects.find((s) => s.id === q.subject)!.name}
        aside={timed ? <p className="num text-3xl font-semibold" role="timer" aria-label={`${Math.ceil(left / 60000)} minutes left`}>{clock(left)}</p> : undefined}>
        {timed
          ? <nav aria-label="Questions" className="mb-4 flex flex-wrap gap-2">{qs.map((_, k) => <button key={k} type="button" className="chip num" aria-current={k === run.at ? "step" : undefined} aria-label={`Question ${k + 1}${run.picks[k] ? ", answered" : ""}`} onClick={() => go(k)}>{k + 1}{run.picks[k] && <Check size={12} weight="bold" aria-hidden />}</button>)}</nav>
          : <Bar value={run.at + (picked ? 1 : 0)} max={qs.length} className="mb-4" />}
        <Body q={q} />
        <div className="mt-4 grid gap-2">
          {run.options[run.at].map((o) => {
            const right = shown && o === q.answer, bad = shown && picked === o && !right;
            return (
              <button key={o} type="button" aria-pressed={picked === o} onClick={() => pick(o)}
                className={`btn h-auto justify-start gap-2 py-2 text-left whitespace-normal ${right ? "border-easy text-easy" : bad ? "border-hard text-hard" : timed && picked === o ? "btn-primary" : ""}`}>
                {right && <Check size={16} weight="bold" className="shrink-0" aria-hidden />}{bad && <X size={16} weight="bold" className="shrink-0" aria-hidden />}<span>{inline(o)}</span>
              </button>
            );
          })}
        </div>
        {shown && (
          <div className="callout mt-4 text-sm leading-relaxed" aria-live="polite">
            <p className="font-semibold">{picked === q.answer ? "Right" : "Not this one"}: {inline(q.answer)}</p>
            <Rich text={q.why} className="mt-1" />
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {timed && run.at > 0 && <button type="button" className="btn" onClick={() => go(run.at - 1)}>Back</button>}
          {!last && (timed || shown) && <button type="button" className="btn btn-primary" onClick={() => go(run.at + 1)}>Next question</button>}
          {last && shown && <button type="button" className="btn btn-primary" onClick={() => finish(run, Date.now())}>See results</button>}
          <span className="flex-1" />
          {sure ? <>
            <span className="text-sm">{timed ? `${run.picks.filter(Boolean).length} of ${qs.length} answered. End now?` : "End this round?"}</span>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => finish(run, Date.now())}>{timed ? "End test" : "End round"}</button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSure(false)}>Keep going</button>
          </> : <button type="button" className="btn btn-sm" onClick={() => setSure(true)}>{timed ? "End test" : "End round"}</button>}
        </div>
      </Card>
    </div>
  );
}

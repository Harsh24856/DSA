"use client";
// A code lab: write each step in the editor, Run tests grades it with hidden tests in a sandboxed Pyodide worker.
// Gets one lab as props from the server page; never imports lab content itself.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, Check, Eye, Lightbulb, Play, X } from "@phosphor-icons/react";
import { buildProgram, MAX_CODE, RUN_SECONDS, userLineOffset } from "@/lib/genai2/labs/harness";
import type { Fw, Lab } from "@/lib/genai2/labs/types";
import { usePatterns } from "@/lib/patternStore";
import { Rich } from "@/components/other/Rich";
import { Seg } from "@/components/ui";
import { useLabRunner } from "./useLabRunner";

const Editor = dynamic(() => import("@/components/other/playground/Editor").then((m) => m.Editor), { ssr: false, loading: () => <div className="h-[280px]" aria-hidden /> });

const FW_KEY = "dsa-genai-fw2";
const FWS = [["numpy", "NumPy"], ["torch", "PyTorch"]] as const;
const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const save = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
const testName = (n: string) => { const s = n.replace(/^test_/, "").replaceAll("_", " "); return s.charAt(0).toUpperCase() + s.slice(1); };
// Tracebacks count lines from the top of the whole program; point them at the editor instead.
const mapLines = (text: string, off: number, n: number) =>
  text.replace(/File "main\.py", line (\d+)/g, (_, d: string) => { const m = +d - off; return m >= 1 && m <= n ? `Your code, line ${m}` : "Lab code"; });

export function LabView({ lab }: { lab: Lab }) {
  const { ready, done, toggle } = usePatterns();
  const runner = useLabRunner();
  const [i, setI] = useState(0);
  const [fwPick, setFwPick] = useState<Fw>("numpy");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [edition, setEdition] = useState(0);
  const [hints, setHints] = useState(0);
  const [reveal, setReveal] = useState(0);   // 0 hidden, 1 asked once ("Show it"), 2 shown
  const [note, setNote] = useState("");
  const ran = useRef({ key: "", off: 0, lines: 0, program: "" });
  const started = useRef(false);

  const step = lab.steps[i], n = lab.steps.length;
  const fw: Fw = step.starter.numpy ? fwPick : "torch";
  const key = `${lab.id}:${step.id}:${fw}`, draftKey = `dsa-genailab:${key}`;
  const starter = step.starter[fw] ?? "";
  const code = edits[key] ?? load(draftKey) ?? starter;
  const pkey = (id: string) => `genailab:${lab.id}:${id}`;
  const passedCount = lab.steps.filter((s) => done[pkey(s.id)]).length;

  useEffect(() => { if (load(FW_KEY) === "torch") setFwPick("torch"); }, []);
  // open at the first step not yet passed, once progress has loaded
  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const k = lab.steps.findIndex((s) => !done[`genailab:${lab.id}:${s.id}`]);
    if (k > 0) setI(k);
  }, [ready, done, lab]);

  const mine = ran.current.key === key;   // results on screen belong to this step and framework
  const results = mine && runner.state === "done" ? runner.results : null;
  const allPass = !!results?.length && results.every((r) => r.pass);
  const busy = runner.state === "loading" || runner.state === "running";

  // a full pass stores progress; the first pass is kept
  // ponytail: stores a plain tick, not "numpy" / "torch": PTick has no string field, and only NumPy is graded today
  useEffect(() => {
    const k = `genailab:${lab.id}:${step.id}`;
    if (allPass && !done[k]) toggle(k, true);
  }, [allPass, done, toggle, lab.id, step.id]);

  const go = (k: number) => { setI(k); setHints(0); setReveal(0); setNote(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pickFw = (f: Fw) => { setFwPick(f); setReveal(0); setNote(""); save(FW_KEY, f); };
  const edit = (v: string) => { setEdits((e) => ({ ...e, [key]: v })); save(draftKey, v === starter ? null : v); };
  const reset = () => { edit(starter); setEdition((e) => e + 1); };
  const run = () => {
    if (busy) return;
    if (code.length > MAX_CODE) { setNote(`Your code is over ${MAX_CODE / 1000} KB, so it was not run. Trim it and try again.`); return; }
    setNote("");
    const token = crypto.randomUUID().replaceAll("-", "");
    const program = buildProgram(lab.steps, i, fw, code, token);
    ran.current = { key, off: userLineOffset(lab.steps, i, fw), lines: code.split("\n").length, program };
    runner.run(program, token);
  };
  const retry = () => runner.run(ran.current.program, crypto.randomUUID().replaceAll("-", ""));

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/genai/${lab.module}`} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent"><ArrowLeft size={14} aria-hidden />Back to the module</Link>
      <section className="card flex flex-col gap-3 p-6" aria-labelledby="lab-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="t-eyebrow">Code lab</span>
          <span className="pill pill-muted num text-xs">{passedCount} of {n} steps passed</span>
        </div>
        <h2 id="lab-title" className="t-title">{lab.title}</h2>
        <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{lab.blurb}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <label className="flex flex-col gap-2 lg:hidden">
          <span className="t-eyebrow">Step</span>
          <select className="field" value={i} onChange={(e) => go(+e.target.value)}>
            {lab.steps.map((s, k) => <option key={s.id} value={k}>{k + 1}. {s.title}{done[pkey(s.id)] ? " (passed)" : ""}</option>)}
          </select>
        </label>
        <nav className="card hidden p-2 lg:sticky lg:top-24 lg:block" aria-label="Steps">
          <ol className="grid gap-1">
            {lab.steps.map((s, k) => {
              const on = !!done[pkey(s.id)];
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => go(k)} aria-current={k === i ? "step" : undefined}
                    className={`flex w-full items-center gap-2 rounded-control px-2 py-2 text-left text-sm transition-colors hover:bg-surface-2 ${k === i ? "bg-accent-soft font-semibold" : ""}`}>
                    <span className="tick pointer-events-none size-5" data-on={on || undefined} aria-hidden>{on && <Check size={12} weight="bold" />}</span>
                    <span className="num text-xs text-muted">{k + 1}</span>
                    <span className="min-w-0 flex-1">{s.title}</span>
                    {on && <span className="sr-only">(passed)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section className="card flex min-w-0 flex-col gap-4 p-4 sm:p-6" aria-labelledby="step-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="t-eyebrow">Step {i + 1} of {n}</span>
            {step.starter.numpy ? <Seg value={fw} options={FWS} onChange={pickFw} label="Framework" /> : <span className="pill pill-muted text-xs">PyTorch only</span>}
          </div>
          <h2 id="step-title" className="t-h2">{step.title}</h2>
          <Rich text={step.goal} className="max-w-[72ch] text-sm leading-relaxed" />
          <code className="code text-sm">{step.signature}</code>

          <div className="overflow-hidden rounded-tile border border-line [&_.cm-editor]:min-h-[280px] [&_.pg-editor]:border-b-0">
            <Editor key={`${key}:${edition}`} value={code} mode="python" onChange={edit} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fw === "numpy" && (
              <button type="button" className="btn btn-primary" onClick={run} aria-disabled={busy || undefined}>
                <Play size={16} weight="fill" aria-hidden />{busy ? "Running..." : "Run tests"}
              </button>
            )}
            <button type="button" className="btn" onClick={reset}><ArrowCounterClockwise size={16} aria-hidden />Reset to starter</button>
            {hints < step.hints.length && (
              <button type="button" className="btn btn-ghost" onClick={() => setHints((h) => h + 1)}><Lightbulb size={16} aria-hidden />Hint {hints + 1} of {step.hints.length}</button>
            )}
            {reveal < 2 && (
              <button type="button" className="btn btn-ghost" onClick={() => setReveal((r) => r + 1)}><Eye size={16} aria-hidden />{reveal ? "Show it" : "Show solution"}</button>
            )}
          </div>

          {fw === "torch" && <p className="callout text-sm">PyTorch grading comes online soon. You can write here and your code is saved; switch to NumPy to run the tests{step.starter.numpy ? "" : " (this step is PyTorch only)"}.</p>}
          {note && <p className="callout callout-warn text-sm" role="alert">{note}</p>}
          {hints > 0 && <ol className="grid gap-2">{step.hints.slice(0, hints).map((h, k) => <li key={k} className="callout text-sm leading-relaxed"><b>Hint {k + 1}.</b> {h}</li>)}</ol>}

          <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
            {mine && runner.state === "loading" && <p className="text-sm text-muted">Loading Python. The first run downloads about 10 MB, so it can take a moment.</p>}
            {mine && runner.state === "running" && <p className="text-sm text-muted">Running the tests...</p>}
            {mine && runner.state === "failed" && (
              <div className="callout callout-warn flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>Python could not load. Check your connection and try again.</span>
                <button type="button" className="btn btn-sm" onClick={retry}>Retry</button>
              </div>
            )}
            {mine && runner.state === "stopped" && (
              <p className="callout callout-warn text-sm"><b>Stopped after {RUN_SECONDS} s.</b> Your code ran too long, often because of an endless loop. Fix it and run again.</p>
            )}
            {mine && runner.state === "done" && !results && <p className="text-sm font-semibold text-hard">Your code did not run to the tests. Every test counts as failed.</p>}
            {results && (
              <>
                <p className="text-sm font-semibold"><span className="num">{results.filter((r) => r.pass).length} of {results.length}</span> passed</p>
                <ul className="grid gap-2">
                  {results.map((r) => (
                    <li key={r.name} className="inset flex items-start gap-3 p-3 text-sm">
                      {r.pass
                        ? <span className="tick pointer-events-none size-5" data-on aria-hidden><Check size={12} weight="bold" /></span>
                        : <X size={20} weight="bold" className="shrink-0 text-hard" aria-hidden />}
                      <span className="min-w-0"><span className="sr-only">{r.pass ? "Passed: " : "Failed: "}</span>{testName(r.name)}{r.msg && <span className="mt-1 block break-words font-mono text-xs text-muted">{mapLines(r.msg, ran.current.off, ran.current.lines)}</span>}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {mine && runner.output && (runner.state === "done" || runner.state === "stopped") && (
              <div className="flex flex-col gap-2">
                <span className="t-eyebrow">{results ? "Printed" : "Output"}</span>
                <pre className="code whitespace-pre-wrap break-words">{mapLines(runner.output, ran.current.off, ran.current.lines)}</pre>
              </div>
            )}
          </div>

          {(reveal === 2 || allPass) && (
            <div className="flex flex-col gap-2">
              <span className="t-eyebrow">{allPass ? "All tests passed. Compare with the reference" : "Reference solution"}</span>
              <pre className="code whitespace-pre-wrap">{step.reference[fw]}</pre>
            </div>
          )}
          {allPass && i < n - 1 && (
            <button type="button" className="btn btn-primary w-fit" onClick={() => go(i + 1)}>Next step<ArrowRight size={16} aria-hidden /></button>
          )}
        </section>
      </div>
    </div>
  );
}

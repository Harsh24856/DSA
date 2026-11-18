"use client";
// Runs one graded lab program: NumPy in the sandboxed Pyodide worker, PyTorch on the Modal grader through /api/genai/grade.
import { useCallback, useEffect, useRef, useState } from "react";
import { wasmHost, type WasmMsg } from "@/components/other/playground/wasm";
import { parseResults, RUN_SECONDS } from "@/lib/genai2/labs/harness";
import type { TestResult } from "@/lib/genai2/labs/types";

export type RunState = "idle" | "loading" | "running" | "done" | "failed" | "stopped" | "error";

export function useLabRunner() {
  const [state, setState] = useState<RunState>("idle");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [output, setOutput] = useState("");
  const host = useRef<ReturnType<typeof wasmHost> | null>(null);
  const cur = useRef({ id: 0, token: "", started: false, out: [] as string[], err: [] as string[] });

  // what the learner printed and the traceback, without the result lines
  const shown = () => {
    const mark = `@@${cur.current.token} `;
    return [...cur.current.out.filter((l) => !l.startsWith(mark)), ...cur.current.err].join("\n").trim();
  };

  useEffect(() => {
    const on = (m: WasmMsg) => {
      if (m.type === "failed") { host.current?.dispose(); setState("failed"); setOutput(m.text); return; }
      if (m.type === "loaded" || m.id !== cur.current.id) return;
      if (m.type === "started") { cur.current.started = true; setState("running"); }
      // before "started", Pyodide prints its package downloads ("Loading numpy"); keep only errors from then
      if (m.type === "log" && (cur.current.started || m.kind !== "log")) (m.kind === "log" ? cur.current.out : cur.current.err).push(m.text);
      if (m.type === "done") { setResults(parseResults(cur.current.out.join("\n"), cur.current.token)); setOutput(shown()); setState("done"); }
    };
    const h = wasmHost("python", on, () => { setResults(null); setOutput(shown()); setState("stopped"); }, RUN_SECONDS * 1000);
    host.current = h;
    return () => h.dispose();
  }, []);

  const run = useCallback((program: string, token: string) => {
    setResults(null); setOutput(""); setState("loading");
    cur.current = { id: 0, token, started: false, out: [], err: [] };
    cur.current.id = host.current?.run(program) ?? 0;
  }, []);

  // PyTorch: the server builds the program with the hidden tests, so only the step and the learner's code go out
  const runRemote = useCallback(async (job: { lab: string; step: string; code: string }) => {
    setResults(null); setOutput(""); setState("running");
    const id = ++cur.current.id;
    let data: { error?: string; results?: TestResult[] | null; output?: string; timedOut?: boolean } | null = null;
    try {
      const res = await fetch("/api/genai/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(job) });
      data = await res.json();
    } catch { data = null; }
    if (id !== cur.current.id) return;   // a newer run started meanwhile
    if (!data || data.error) { setOutput(data?.error ?? "Could not reach the grader. Check your connection and try again."); setState("error"); return; }
    setResults(data.results ?? null); setOutput(data.output ?? "");
    setState(data.timedOut ? "stopped" : "done");
  }, []);

  return { state, results, output, run, runRemote };
}

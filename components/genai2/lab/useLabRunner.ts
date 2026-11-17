"use client";
// Runs one graded lab program in the sandboxed Pyodide worker and reads its results.
import { useCallback, useEffect, useRef, useState } from "react";
import { wasmHost, type WasmMsg } from "@/components/other/playground/wasm";
import { parseResults, RUN_SECONDS } from "@/lib/genai2/labs/harness";
import type { TestResult } from "@/lib/genai2/labs/types";

export type RunState = "idle" | "loading" | "running" | "done" | "failed" | "stopped";

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

  return { state, results, output, run };
}

"use client";
// Runs one Python script in the browser (Pyodide, loaded on first click) and shows its output. Used by GenaiDoc and the Gen AI module blocks.
import { useState } from "react";
import { runPython } from "./runPython";

export function RunPanel({ src }: { src: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [status, setStatus] = useState("");
  const run = async () => {
    setLines([]); setState("busy");
    try { await runPython(src, (l) => setLines((x) => [...x, l]), setStatus); setState("done"); }
    catch (e) { setLines((x) => [...x, String((e as Error).message ?? e)]); setState("error"); }
  };
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => void run()} disabled={state === "busy"}>{state === "busy" ? "Running..." : state === "idle" ? "Run in browser" : "Run again"}</button>
        <span className="text-xs text-muted" role="status">{state === "busy" ? status : state === "done" ? "Finished. The asserts at the end passed." : state === "error" ? "Stopped with an error." : "Runs this script with Python in your browser; nothing is sent to a server."}</span>
      </div>
      {lines.length > 0 && <pre className={`code max-h-[260px] overflow-auto text-xs ${state === "error" ? "text-hard" : ""}`} aria-label="Output">{lines.join("\n")}</pre>}
    </div>
  );
}

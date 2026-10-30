"use client";
// Renders one playbook section's HTML (lib/genai/content.ts): draws its mermaid diagrams (useMermaid), wires the code blocks' Copy buttons, mounts the interactive labs
// (lib/genai/labs.ts) into their slides, adds a PyTorch / TensorFlow switch to code blocks that have a TF version,
// and a Run button (Pyodide, components/runPython.ts) under the deep-dive scripts that need only stdlib, numpy or pydantic.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LabKind } from "@/lib/genai/labs";
import { TF } from "@/lib/genai/tensorflow";
import { GenaiLab } from "./labs";
import { Seg } from "./ui";
import { useMermaid } from "./useMermaid";
import { runPython } from "./runPython";

type Fw = "torch" | "tf";
const FW_KEY = "dsa-genai-fw";
type Mount = { node: HTMLElement; lab?: LabKind; code?: { el: HTMLElement; key: string }; run?: { src: string } };

// Deep-dive scripts that need only the standard library, numpy or pydantic, so they run in the browser.
const RUNNABLE = new Set(["backprop_by_hand.py", "param_count.py", "online_softmax.py", "attention_by_hand.py", "rope_relative.py",
  "context_budget.py", "rrf_hybrid.py", "lora_memory.py", "batching_sim.py", "vision_tokens.py", "capacity.py", "structured_retry.py",
  "judge_calibration.py", "ab_significance.py", "self_consistency.py", "constrained_decode.py", "kv_paging.py", "quantize.py"]);

function RunPanel({ src }: { src: string }) {
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
        <span className="text-[12px] text-muted" role="status">{state === "busy" ? status : state === "done" ? "Finished. The asserts at the end passed." : state === "error" ? "Stopped with an error." : "Runs this script with Python in your browser; nothing is sent to a server."}</span>
      </div>
      {lines.length > 0 && <pre className={`code max-h-[260px] overflow-auto text-[12px] ${state === "error" ? "text-hard" : ""}`} aria-label="Output">{lines.join("\n")}</pre>}
    </div>
  );
}

function CodeTabs({ el, file, code, fw, setFw }: { el: HTMLElement; file: string; code: string; fw: Fw; setFw(f: Fw): void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { el.hidden = fw === "tf"; return () => { el.hidden = false; }; }, [el, fw]);
  return (
    <div className="grid gap-2">
      <Seg<Fw> label="Framework" value={fw} onChange={setFw} className="w-fit" options={[["torch", "PyTorch"], ["tf", "TensorFlow"]]} />
      {fw === "tf" && (
        <div className="gx-code">
          <div className="gx-code-head"><span>{file}</span><button type="button" data-own className="gx-copy" onClick={() => void navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); })}>{copied ? "Copied" : "Copy"}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      )}
    </div>
  );
}

const NO_LABS: [string, LabKind][] = [];

export function GenaiDoc({ html, labs = NO_LABS }: { html: string; labs?: [string, LabKind][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [fw, setFwRaw] = useState<Fw>("torch");
  useEffect(() => { try { if (localStorage.getItem(FW_KEY) === "tf") setFwRaw("tf"); } catch {} }, []);
  const setFw = (f: Fw) => { setFwRaw(f); try { localStorage.setItem(FW_KEY, f); } catch {} };

  // mount points: one at the end of each lab's slide, one above each PyTorch block that has a TensorFlow twin
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const made: Mount[] = [];
    for (const [slide, lab] of labs) {
      const host = root.querySelector<HTMLElement>(`#${slide}`);
      if (!host) continue;
      const node = document.createElement("div"); host.append(node); made.push({ node, lab });
    }
    for (const el of root.querySelectorAll<HTMLElement>(".gx-code")) {
      const key = el.querySelector(".gx-code-head span")?.textContent?.split(" ")[0] ?? "";
      if (RUNNABLE.has(key)) { const node = document.createElement("div"); el.after(node); made.push({ node, run: { src: el.querySelector("code")?.textContent ?? "" } }); }
      if (!TF[key]) continue;
      const node = document.createElement("div"); el.before(node); made.push({ node, code: { el, key } });
    }
    setMounts(made);
    return () => { made.forEach((m) => m.node.remove()); setMounts([]); };
  }, [html, labs]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".gx-copy:not([data-own])");
      const code = btn?.closest(".gx-code")?.querySelector("code");
      if (!btn || !code) return;
      void navigator.clipboard?.writeText(code.innerText).then(() => { btn.textContent = "Copied"; setTimeout(() => { btn.textContent = "Copy"; }, 1400); });
    };
    root.addEventListener("click", onClick);

    return () => root.removeEventListener("click", onClick);
  }, [html]);
  useMermaid(ref, html);

  // the HTML is the app's own static playbook content, not user input
  return (
    <>
      <div ref={ref} className="gx" dangerouslySetInnerHTML={{ __html: html }} />
      {mounts.map((m, i) => createPortal(
        m.lab ? <GenaiLab kind={m.lab} /> : m.run ? <RunPanel src={m.run.src} /> : <CodeTabs el={m.code!.el} file={TF[m.code!.key].file} code={TF[m.code!.key].code} fw={fw} setFw={setFw} />,
        m.node, `${m.lab ?? m.code?.key ?? "run"}-${i}`,
      ))}
    </>
  );
}

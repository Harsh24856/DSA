"use client";
// Renders one playbook section's HTML (lib/genai/content.ts): draws its mermaid diagrams in the current theme's
// colors (again whenever the theme changes), wires the code blocks' Copy buttons, mounts the interactive labs
// (lib/genai/labs.ts) into their slides, and adds a PyTorch / TensorFlow switch to code blocks that have a TF version.
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LabKind } from "@/lib/genai/labs";
import { TF } from "@/lib/genai/tensorflow";
import { GenaiLab } from "./labs";
import { Seg } from "./ui";

type Fw = "torch" | "tf";
const FW_KEY = "dsa-genai-fw";
type Mount = { node: HTMLElement; lab?: LabKind; code?: { el: HTMLElement; key: string } };

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

/** Token value as rgba, since mermaid cannot parse color-mix() or oklab. */
function tokenColor(name: string) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d")!;
  const probe = document.createElement("span"); probe.style.color = `var(${name})`; document.body.append(probe);
  cx.fillStyle = getComputedStyle(probe).color; probe.remove();
  cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
}

const NO_LABS: [string, LabKind][] = [];

export function GenaiDoc({ html, labs = NO_LABS }: { html: string; labs?: [string, LabKind][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/\W/g, "");
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

    let alive = true, run = 0;
    const draw = async () => {
      const pres = [...root.querySelectorAll<HTMLElement>("pre.mermaid")];
      if (!pres.length) return;
      const n = ++run;
      const { default: mermaid } = await import("mermaid");
      const surface = tokenColor("--surface"), ink = tokenColor("--ink"), muted = tokenColor("--muted"), accent = tokenColor("--accent"), bg = tokenColor("--bg");
      mermaid.initialize({
        startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: getComputedStyle(document.body).fontFamily,
        themeVariables: { primaryColor: surface, primaryTextColor: ink, primaryBorderColor: accent, lineColor: muted, secondaryColor: surface, tertiaryColor: bg, edgeLabelBackground: bg, fontSize: "14px" },
      });
      for (const [i, el] of pres.entries()) {
        el.dataset.src ??= el.textContent ?? "";
        try {
          const { svg } = await mermaid.render(`gx${uid}${i}r${n}`, el.dataset.src);
          if (!alive || n !== run) return;
          el.innerHTML = svg;
          const g = el.querySelector("svg");
          if (g) { g.removeAttribute("width"); g.style.maxWidth = "none"; g.style.width = `${g.viewBox.baseVal.width}px`; }
          el.setAttribute("role", "img"); el.setAttribute("aria-label", el.parentElement?.querySelector("figcaption")?.textContent || "Diagram");
        } catch { el.textContent = el.dataset.src; }
        el.dataset.done = "";
      }
    };
    void draw();
    const mo = new MutationObserver(() => void draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "data-look"] });
    const mq = matchMedia("(prefers-color-scheme: dark)"), onScheme = () => void draw();
    mq.addEventListener("change", onScheme);
    return () => { alive = false; root.removeEventListener("click", onClick); mo.disconnect(); mq.removeEventListener("change", onScheme); };
  }, [html, uid]);

  // the HTML is the app's own static playbook content, not user input
  return (
    <>
      <div ref={ref} className="gx" dangerouslySetInnerHTML={{ __html: html }} />
      {mounts.map((m, i) => createPortal(
        m.lab ? <GenaiLab kind={m.lab} /> : <CodeTabs el={m.code!.el} file={TF[m.code!.key].file} code={TF[m.code!.key].code} fw={fw} setFw={setFw} />,
        m.node, `${m.lab ?? m.code!.key}-${i}`,
      ))}
    </>
  );
}

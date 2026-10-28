"use client";
// Renders one playbook section's HTML (lib/genai/content.ts): draws its mermaid diagrams in the current theme's
// colors (again whenever the theme changes) and wires the code blocks' Copy buttons.
import { useEffect, useId, useRef } from "react";

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

export function GenaiDoc({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/\W/g, "");

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".gx-copy");
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
  return <div ref={ref} className="gx" dangerouslySetInnerHTML={{ __html: html }} />;
}

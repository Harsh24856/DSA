"use client";
// Draws every `.mermaid` element inside `ref` in the current theme's colors, and again whenever the theme
// changes. The source is the element's data-src (or its text, read once). Used by the Gen AI and Other pages.
import { useEffect, useId, type RefObject } from "react";

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

export function useMermaid(ref: RefObject<HTMLElement | null>, key: unknown) {
  const uid = useId().replace(/\W/g, "");
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let alive = true, run = 0;
    const draw = async () => {
      const els = [...root.querySelectorAll<HTMLElement>(".mermaid")];
      if (!els.length) return;
      const n = ++run;
      const { default: mermaid } = await import("mermaid");
      const surface = tokenColor("--surface"), ink = tokenColor("--ink"), muted = tokenColor("--muted"), accent = tokenColor("--accent"), bg = tokenColor("--bg");
      mermaid.initialize({
        startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: getComputedStyle(document.body).fontFamily,
        themeVariables: { primaryColor: surface, primaryTextColor: ink, primaryBorderColor: accent, lineColor: muted, secondaryColor: surface, tertiaryColor: bg, edgeLabelBackground: bg, fontSize: "14px" },
      });
      for (const [i, el] of els.entries()) {
        el.dataset.src ??= el.textContent ?? "";
        try {
          const { svg } = await mermaid.render(`mm${uid}${i}r${n}`, el.dataset.src);
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
    return () => { alive = false; mo.disconnect(); mq.removeEventListener("change", onScheme); };
  }, [ref, key, uid]);
}

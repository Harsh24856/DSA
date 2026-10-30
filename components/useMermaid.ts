"use client";
// Draws every `.mermaid` element inside `ref` in the current theme's colors, and again whenever the theme
// changes or the page gets narrower or wider. The source is the element's data-src (or its text, read once).
// Used by the Gen AI and Other pages.
// - Flowcharts can tag nodes `:::ok`, `:::bad`, `:::warn` or `:::hot` (green, red, amber, accent).
// - A left-to-right flowchart that would not fit its box is drawn top-to-bottom instead, so phones do not scroll sideways.
// - Every diagram gets an Expand button that opens it full screen.
import { useEffect, useId, type RefObject } from "react";

/** Token value as #rrggbbaa, since mermaid cannot parse color-mix() or oklab (and classDef splits on commas). */
function tokenColor(name: string, alpha = 1) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d")!;
  const probe = document.createElement("span"); probe.style.color = `var(${name})`; document.body.append(probe);
  cx.fillStyle = getComputedStyle(probe).color; probe.remove();
  cx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
  return "#" + [r, g, b, Math.round(a * alpha)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const FLOW = /^\s*(?:flowchart|graph)\s+/;
const WIDE = /^(\s*(?:flowchart|graph)\s+)(LR|RL)\b/;

function expand(fig: HTMLElement) {
  const svg = fig.querySelector(".mermaid svg");
  if (!svg) return;
  const dlg = document.createElement("dialog");
  dlg.className = "gx-zoom";
  dlg.setAttribute("aria-label", fig.querySelector("figcaption")?.textContent || "Diagram");
  const close = document.createElement("button");
  close.type = "button"; close.className = "btn btn-sm"; close.textContent = "Close";
  close.onclick = () => dlg.close();
  const body = document.createElement("div");
  const copy = svg.cloneNode(true) as SVGSVGElement;
  // mermaid scopes its styles to the svg's id, so the copy gets its own id and a rewritten <style>
  const id = `${svg.id}z`, style = copy.querySelector("style");
  if (style) style.textContent = style.textContent!.split(`#${svg.id}`).join(`#${id}`);
  copy.id = id; copy.style.maxWidth = "none";
  body.append(copy);
  dlg.append(close, body);
  dlg.onclick = (e) => { if (e.target === dlg) dlg.close(); };
  dlg.onclose = () => dlg.remove();
  document.body.append(dlg);
  dlg.showModal();
  // up to twice the size on a big screen; never smaller than natural size, so a phone pans around it
  const w = copy.viewBox.baseVal.width;
  copy.style.width = `${Math.max(w, Math.min(body.clientWidth - 40, w * 2))}px`;
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
      const narrow = root.clientWidth < 520;
      const surface = tokenColor("--surface"), ink = tokenColor("--ink"), muted = tokenColor("--muted"), accent = tokenColor("--accent"), bg = tokenColor("--bg");
      mermaid.initialize({
        startOnLoad: false, securityLevel: "strict", theme: "base", fontFamily: getComputedStyle(document.body).fontFamily,
        // phones: pack nodes tighter and let short labels make small nodes (mermaid 12 pads every label to 120px by default), wrap a little sooner
        flowchart: narrow ? { padding: 8, nodeSpacing: 16, rankSpacing: 34, wrappingWidth: 100, minNodeWidth: 0 } : { padding: 12, nodeSpacing: 36, rankSpacing: 44 },
        sequence: narrow ? { width: 96, actorMargin: 14, boxMargin: 6, messageMargin: 28, wrap: true, mirrorActors: false } : {},
        themeVariables: { primaryColor: surface, primaryTextColor: ink, primaryBorderColor: accent, lineColor: muted, secondaryColor: surface, tertiaryColor: bg, edgeLabelBackground: bg, fontSize: narrow ? "13px" : "14px" },
      });
      const cls = ([["ok", "--easy"], ["bad", "--hard"], ["warn", "--medium"], ["hot", "--accent"]] as const)
        .map(([c, t]) => `\nclassDef ${c} fill:${tokenColor(t, 0.16)},stroke:${tokenColor(t)},color:${ink},stroke-width:1.5px`).join("");
      for (const [i, el] of els.entries()) {
        el.dataset.src ??= el.textContent ?? "";
        const src = el.dataset.src, flow = FLOW.test(src);
        try {
          const render = async (s: string, tag: string) => (await mermaid.render(`mm${uid}${i}r${n}${tag}`, flow ? s + cls : s)).svg;
          let svg = await render(src, "a");
          if (!alive || n !== run) return;
          el.innerHTML = svg;
          let g = el.querySelector("svg");
          const room = el.clientWidth, tooWide = () => !!g && room > 0 && g.viewBox.baseVal.width > room;
          // too wide: turn the chart top-to-bottom, then its subgraphs too
          for (const [tag, alt] of [["b", src.replace(WIDE, "$1TB")], ["c", src.replace(WIDE, "$1TB").replace(/direction\s+(LR|RL)/g, "direction TB")]]) {
            if (!tooWide() || !flow) break;
            if (alt === src) continue;
            const next = await render(alt, tag);
            if (!alive || n !== run) return;
            const before = g!.viewBox.baseVal.width;
            el.innerHTML = next; g = el.querySelector("svg");
            if (g && g.viewBox.baseVal.width >= before) { el.innerHTML = svg; g = el.querySelector("svg"); break; }
            svg = next;
          }
          // a little too wide: shrink to fit (text stays readable down to ~70%); more than that scrolls, and Expand shows it whole
          if (g) { const w = g.viewBox.baseVal.width; g.removeAttribute("width"); g.style.maxWidth = "none"; g.style.width = `${tooWide() && room / w >= 0.7 ? room : w}px`; }
          el.setAttribute("role", "img"); el.setAttribute("aria-label", el.parentElement?.querySelector("figcaption")?.textContent || "Diagram");
          const fig = el.closest<HTMLElement>(".gx-diagram");
          if (fig && !fig.querySelector(":scope > .gx-expand")) {
            const b = document.createElement("button");
            b.type = "button"; b.className = "gx-expand btn btn-sm btn-ghost"; b.textContent = "Expand";
            b.setAttribute("aria-label", "Expand diagram");
            b.onclick = () => expand(fig);
            fig.prepend(b);
          }
        } catch { el.textContent = el.dataset.src; }
        el.dataset.done = "";
      }
    };
    void draw();
    const mo = new MutationObserver(() => void draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette", "data-look"] });
    const mq = matchMedia("(prefers-color-scheme: dark)"), onScheme = () => void draw();
    mq.addEventListener("change", onScheme);
    let width = root.clientWidth, t = 0;
    const ro = new ResizeObserver(() => {
      if (Math.abs(root.clientWidth - width) < 40) return;
      width = root.clientWidth; clearTimeout(t); t = window.setTimeout(() => void draw(), 200);
    });
    ro.observe(root);
    return () => { alive = false; mo.disconnect(); ro.disconnect(); clearTimeout(t); mq.removeEventListener("change", onScheme); };
  }, [ref, key, uid]);
}

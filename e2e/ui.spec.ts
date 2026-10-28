import { expect, test, type Page } from "@playwright/test";

// UI consistency checks: every page and panel at 1280px and 375px, in Classic light, Classic dark, one light
// picture theme and one dark picture theme. Each run saves a full-page screenshot to test-results/ui/ and
// fails on horizontal overflow, console errors, or text below WCAG AA contrast where it can be measured.

const THEMES = [
  { name: "classic-light", look: "classic", mode: "light" },
  { name: "classic-dark", look: "classic", mode: "dark" },
  { name: "frieren", look: "frieren", mode: "light" }, // light picture theme
  { name: "starfall", look: "starfall", mode: "dark" }, // dark picture theme
] as const;
const WIDTHS = [1280, 375] as const;
const VIEWS: { name: string; path: string; open?: (p: Page) => Promise<void> }[] = [
  { name: "today", path: "/" },
  { name: "analytics", path: "/analytics" },
  { name: "patterns", path: "/patterns" },
  { name: "topic", path: "/patterns/array" },
  { name: "pattern", path: "/patterns/array#p-1" },
  { name: "problems", path: "/problems" },
  { name: "roadmap", path: "/roadmap" },
  { name: "genai", path: "/genai" },
  { name: "genai-module", path: "/genai/m4" },
  { name: "settings", path: "/", open: (p) => p.locator('button[aria-label="Settings"]:visible').click() },
  { name: "solve", path: "/", open: (p) => p.getByRole("button", { name: /^Solution for/ }).first().click() },
];

// Known issues in files the navigation session owns (components/Shell.tsx page transition and email line,
// Card in components/ui.tsx), reported to it. Delete each entry once it is fixed there.
const KNOWN_CONTRAST = [/^"e2e@test\.local"/]; // Shell sidebar email at opacity-80 on --bg
const KNOWN_CONSOLE = [/A tree hydrated but some attributes/]; // `initial={reduce ? false : ...}` differs between server and client

/** Runs in the page: every visible text element in `scope` whose contrast against its painted background is below AA. */
function lowContrast(scope: string) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true })!;
  type C = [number, number, number, number];
  const rgba = (c: string): C => {
    cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (t: C, b: C): C => {
    const a = t[3] + b[3] * (1 - t[3]);
    if (!a) return [0, 0, 0, 0];
    return [0, 1, 2].map((k) => (t[k] * t[3] + b[k] * b[3] * (1 - t[3])) / a).concat(a) as C;
  };
  const lum = (c: C) => {
    const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const photo = document.documentElement.dataset.kind === "photo";
  const out: string[] = [];

  for (const el of document.querySelectorAll<HTMLElement>(`${scope} *`)) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
    if (el.closest("svg, option, [aria-hidden='true'], [data-preview], [inert]") || (el as HTMLButtonElement).disabled) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1 || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const cs = getComputedStyle(el);

    // background: composite the ancestors' fills until one is opaque; images and gradients are not measurable
    let alpha = 1, bg: C = [0, 0, 0, 0], unknown = false, painted = false;
    const layers: C[] = [];
    for (let a: HTMLElement | null = el; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      alpha *= +s.opacity;
      if (a !== document.documentElement && s.backgroundImage !== "none") { unknown = true; break; }
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) { layers.push(c); if (a !== document.documentElement) painted = true; if (c[3] >= 1) break; }
    }
    // text straight on a picture theme's photo (page headers) sits on an image: not measurable
    if (unknown || (photo && !painted)) continue;
    for (const l of layers.reverse()) bg = over(l, bg);
    bg = over(bg, [255, 255, 255, 1]);
    const fg0 = rgba(cs.color);
    const fg = over([fg0[0], fg0[1], fg0[2], fg0[3] * alpha], bg);

    const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.push(`"${el.textContent!.trim().slice(0, 40)}" ${ratio.toFixed(2)} < ${need}: ${cs.color} on rgb(${bg.slice(0, 3).map(Math.round).join(" ")})`);
  }
  return out;
}

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

for (const theme of THEMES)
  for (const width of WIDTHS)
    test.describe(`${theme.name} ${width}px`, () => {
      test.use({ viewport: { width, height: width > 400 ? 900 : 812 }, reducedMotion: "reduce", colorScheme: theme.mode });

      for (const view of VIEWS)
        test(view.name, async ({ page }) => {
          const errors: string[] = [];
          page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
          page.on("pageerror", (e) => errors.push(e.message));

          // a little progress so solved rows, notes and revisits render too
          const d = today();
          await page.addInitScript(({ look, mode, d }) => {
            localStorage.setItem("dsa-daily-look", look);
            localStorage.setItem("dsa-daily-theme", mode);
            localStorage.setItem("dsa-daily-v1:owner", "e2e@test.local");
            if (!localStorage.getItem("dsa-daily-v1"))
              localStorage.setItem("dsa-daily-v1", JSON.stringify({ done: { 0: { d, h: "h", n: "Two pointers from both ends" }, 1: { d, h: "s" } } }));
          }, { look: theme.look, mode: theme.mode, d });

          await page.goto(view.path);
          await expect(page.locator("main h1")).toBeVisible();
          await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
          if (view.open) { await view.open(page); await expect(page.getByRole("dialog")).toBeVisible(); }
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(1200); // picture crossfade (opacity) still runs under reduced motion

          await page.screenshot({ path: `test-results/ui/${theme.name}-${width}-${view.name}.png`, fullPage: !view.open });

          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          expect.soft(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);
          const low = await page.evaluate(lowContrast, view.open ? "dialog[open], [role=dialog]" : "body");
          expect.soft(low.filter((l) => !KNOWN_CONTRAST.some((k) => k.test(l))), "text below AA contrast").toEqual([]);
          expect.soft(errors.filter((e) => !KNOWN_CONSOLE.some((k) => k.test(e))), "console errors").toEqual([]);
        });
    });

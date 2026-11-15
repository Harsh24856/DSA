import { expect, test, type Page } from "@playwright/test";
import { loadSubject } from "../lib/other/index.ts";
import { TOPIC_FLOWS } from "../lib/other/flows-dsa.ts";
import { PATTERN_PLAY, PLAY_FLOWS } from "../lib/other/flows-play.ts";

// Walks every step of every animated walk-through: stepping must work, and no text may be clipped or run off the picture.
// CS core has one chapter per page, so each subject's test visits every chapter that has a walk-through
const SUBJECTS = ["os", "dbms", "cn", "sql", "oops", "aptitude", "syntax", "react", "node", "design"] as const;
const GENAI = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m10", "m11", "m12"].map((m) => `/genai/${m}`);

const clipped = (page: Page, i: number, selector = ".gx-flow") => page.evaluate(([k, sel]) => {
  const fig = document.querySelectorAll(sel as string)[k as number];
  const box = fig.querySelector(".rounded-tile")!.getBoundingClientRect(), out: string[] = [];
  fig.querySelectorAll<HTMLElement>(".rounded-tile div").forEach((el) => {
    if (el.children.length > 1 || !el.textContent?.trim() || el.querySelector("div")) return;
    const r = el.getBoundingClientRect();
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) out.push(`cut: "${el.textContent.slice(0, 40)}"`);
    if (r.right > box.right + 1 || r.left < box.left - 1 || r.bottom > box.bottom + 1) out.push(`off the picture: "${el.textContent.slice(0, 40)}"`);
  });
  return { title: fig.querySelector("figcaption")?.textContent ?? "", out: [...new Set(out)] };
}, [i, selector] as const);

test.describe.configure({ timeout: 300_000 });
test.use({ reducedMotion: "reduce" });

/** Steps through every walk-through on the current page, collecting clipped text into `problems`. */
async function walkAll(page: Page, problems: string[], selector = ".gx-flow") {
  const flows = page.locator(selector);
  await expect(flows.first()).toBeVisible({ timeout: 30_000 });
  const n = await flows.count();
  for (let i = 0; i < n; i++) {
    const f = flows.nth(i);
    await f.scrollIntoViewIfNeeded();
    const next = f.getByRole("button", { name: "Next step" });
    await expect(f.locator(".__remotion-player, [style*='aspect-ratio'] div").first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);   // the Player measures its box, then scales the picture to fit
    const total = Number((await f.locator(".flow-note b").textContent())!.match(/of (\d+)/)![1]);
    // a recomputed walk-through keeps its step: go back to the first one
    for (let g = 0; g < 20 && !(await f.locator(".flow-note b").textContent())!.startsWith("Step 1 "); g++) await f.getByRole("button", { name: "Previous step" }).click();
    for (let s = 1; s <= total; s++) {
      await expect(f.locator(".flow-note b")).toHaveText(`Step ${s} of ${total}.`);
      let r = await clipped(page, i, selector);
      // the Player can be measured mid-render (unscaled for one frame); a real clip is still there a moment later
      if (r.out.length) { await page.waitForTimeout(300); r = await clipped(page, i, selector); }
      r.out.forEach((o) => problems.push(`${r.title}, step ${s}: ${o}`));
      if (s < total) await next.click();
    }
    await expect(next).toBeDisabled();
    await f.getByRole("button", { name: "Previous step" }).click();
    await expect(f.locator(".flow-note b")).toHaveText(`Step ${total - 1} of ${total}.`);
  }
}

for (const s of SUBJECTS) test(`flows on /other/${s}`, async ({ page }) => {
  const problems: string[] = [];
  for (const c of (await loadSubject(s)).chapters.filter((c) => c.anim || c.play)) {   // play: the interactive walk-through
    await page.goto(`/other/${s}/${c.id}`);
    await walkAll(page, problems);
  }
  expect([...new Set(problems)]).toEqual([]);
});

// each topic Overview on /patterns: its "See it move" walk-throughs
for (const topic of Object.keys(TOPIC_FLOWS)) test(`flows on /patterns/${topic}`, async ({ page }) => {
  const problems: string[] = [];
  await page.goto(`/patterns/${topic}`);
  await walkAll(page, problems);
  expect([...new Set(problems)]).toEqual([]);
});

for (const path of GENAI) test(`flows on ${path}`, async ({ page }) => {
  const problems: string[] = [];
  await page.goto(path);
  await walkAll(page, problems);
  expect([...new Set(problems)]).toEqual([]);
});

/** Drags every slider of the interactive walk-through on the page; each must change it or explain why not. */
async function dragSliders(page: Page, where: string) {
  const lab = page.locator('section[aria-label^="Try your own numbers"]');
  await expect(lab.locator("figcaption"), `${where}: interactive walk-through`).toBeVisible({ timeout: 30_000 });
  const sliders = lab.locator('input[type="range"]');
  const shown = async () => `${await lab.locator("figure").textContent()}`;   // title, picture and caption
  for (let i = 0; i < await sliders.count(); i++) {
    const before = await shown(), slider = sliders.nth(i), start = await slider.inputValue();
    await slider.focus();
    await page.keyboard.press("End");
    if (await slider.inputValue() === start) await page.keyboard.press("Home");   // it already sat at its maximum
    await expect.poll(async () => await shown() !== before || await lab.getByRole("status").count() > 0,
      { message: `${where}: slider ${i + 1} changes the walk-through or explains why not`, timeout: 15_000 }).toBe(true);
    await lab.getByRole("button", { name: "Reset" }).click();
  }
}

// interactive walk-throughs: every slider moves the walk-through (or explains why not), and nothing throws
test("interactive walk-throughs follow their sliders", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const s of ["aptitude", "design"] as const) for (const c of (await loadSubject(s)).chapters.filter((c) => c.play)) {
    await page.goto(`/other/${s}/${c.id}`);
    await dragSliders(page, `${s}/${c.id}`);
  }
  expect(errors).toEqual([]);
});

// the same on /patterns: each topic Overview and key pattern with one, walked for clipped text, then its sliders dragged
for (const [where] of Object.entries(PATTERN_PLAY)) test(`patterns slider walk-through ${where}`, async ({ page }) => {
  const errors: string[] = [], problems: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const [topic, n] = where.split(":");
  await page.goto(`/patterns/${topic}${n === "0" ? "" : `#p-${n}`}`);
  // the Overview renders first and the pattern from the hash after it: wait for this place's own walk-through
  await expect(page.locator(`section[aria-label="Try your own numbers: ${PLAY_FLOWS[PATTERN_PLAY[where]].title}"]`)).toBeVisible({ timeout: 30_000 });
  await dragSliders(page, where);
  const lab = 'section[aria-label^="Try your own numbers"]';
  await walkAll(page, problems, `${lab} .gx-flow`);
  // the widest picture comes at the largest settings: push every slider to its maximum and walk that too
  const sliders = page.locator(`${lab} input[type="range"]`);
  for (let i = 0; i < await sliders.count(); i++) { await sliders.nth(i).focus(); await page.keyboard.press("End"); }
  if (await page.locator(`${lab} [role="status"]`).count() === 0) await walkAll(page, problems, `${lab} .gx-flow`);
  expect([...new Set(problems)]).toEqual([]);
  expect(errors).toEqual([]);
});

// System Design walk-throughs at their largest settings, where the longest numbers and the most rows appear
test("design slider walk-throughs at their largest settings", async ({ page }) => {
  const problems: string[] = [], lab = 'section[aria-label^="Try your own numbers"]';
  for (const c of (await loadSubject("design")).chapters.filter((c) => c.play)) {
    await page.goto(`/other/design/${c.id}`);
    await expect(page.locator(`${lab} figcaption`)).toBeVisible({ timeout: 30_000 });
    const sliders = page.locator(`${lab} input[type="range"]`);
    for (let i = 0; i < await sliders.count(); i++) { await sliders.nth(i).focus(); await page.keyboard.press("End"); }
    if (await page.locator(`${lab} [role="status"]`).count() === 0) await walkAll(page, problems, `${lab} .gx-flow`);
  }
  expect([...new Set(problems)]).toEqual([]);
});

test("play all runs through to the end, then offers replay", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 }, baseURL: test.info().project.use.baseURL });
  const page = await ctx.newPage();
  await page.goto("/other/os/process");
  const f = page.locator(".gx-flow").filter({ hasText: "A context switch" });
  await f.scrollIntoViewIfNeeded();
  await expect(f.locator(".flow-note b")).toHaveText("Step 1 of 6.", { timeout: 30_000 });
  await f.getByRole("button", { name: "Next step" }).click();
  await expect(f.locator(".flow-note b")).toHaveText("Step 2 of 6.");
  await expect(f.getByRole("button", { name: "Play all" })).toBeVisible({ timeout: 8_000 });   // one step only: it stops by itself
  await f.getByRole("button", { name: "Play all" }).click();
  await expect(f.getByRole("button", { name: "Replay" })).toBeVisible({ timeout: 30_000 });
  await expect(f.locator(".flow-note b")).toHaveText("Step 6 of 6.");
  await ctx.close();
});

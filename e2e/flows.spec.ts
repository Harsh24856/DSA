import { expect, test, type Page } from "@playwright/test";
import { loadSubject } from "../lib/other/index.ts";

// Walks every step of every animated walk-through: stepping must work, and no text may be clipped or run off the picture.
// CS core has one chapter per page, so each subject's test visits every chapter that has a walk-through
const SUBJECTS = ["os", "dbms", "cn", "sql", "oops", "aptitude", "syntax", "react", "node", "design"] as const;
const GENAI = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m10", "m11", "m12"].map((m) => `/genai/${m}`);

const clipped = (page: Page, i: number) => page.evaluate((k) => {
  const fig = document.querySelectorAll(".gx-flow")[k];
  const box = fig.querySelector(".rounded-tile")!.getBoundingClientRect(), out: string[] = [];
  fig.querySelectorAll<HTMLElement>(".rounded-tile div").forEach((el) => {
    if (el.children.length > 1 || !el.textContent?.trim() || el.querySelector("div")) return;
    const r = el.getBoundingClientRect();
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) out.push(`cut: "${el.textContent.slice(0, 40)}"`);
    if (r.right > box.right + 1 || r.left < box.left - 1 || r.bottom > box.bottom + 1) out.push(`off the picture: "${el.textContent.slice(0, 40)}"`);
  });
  return { title: fig.querySelector("figcaption")?.textContent ?? "", out: [...new Set(out)] };
}, i);

test.describe.configure({ timeout: 300_000 });
test.use({ reducedMotion: "reduce" });

/** Steps through every walk-through on the current page, collecting clipped text into `problems`. */
async function walkAll(page: Page, problems: string[]) {
  const flows = page.locator(".gx-flow");
  await expect(flows.first()).toBeVisible({ timeout: 30_000 });
  const n = await flows.count();
  for (let i = 0; i < n; i++) {
    const f = flows.nth(i);
    await f.scrollIntoViewIfNeeded();
    const next = f.getByRole("button", { name: "Next step" });
    await expect(f.locator(".__remotion-player, [style*='aspect-ratio'] div").first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);   // the Player measures its box, then scales the picture to fit
    const total = Number((await f.locator(".flow-note b").textContent())!.match(/of (\d+)/)![1]);
    for (let s = 1; s <= total; s++) {
      await expect(f.locator(".flow-note b")).toHaveText(`Step ${s} of ${total}.`);
      const r = await clipped(page, i);
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
  for (const c of (await loadSubject(s)).chapters.filter((c) => c.anim)) {
    await page.goto(`/other/${s}/${c.id}`);
    await walkAll(page, problems);
  }
  expect([...new Set(problems)]).toEqual([]);
});

for (const path of GENAI) test(`flows on ${path}`, async ({ page }) => {
  const problems: string[] = [];
  await page.goto(path);
  await walkAll(page, problems);
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

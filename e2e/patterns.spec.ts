import { expect, test } from "@playwright/test";
import { PATTERN_CPP } from "../lib/patterns/cpp.ts";

// Every topic overview and every pattern: the page opens with its visualiser, its theory and the C++ code, with no errors.
test.describe.configure({ timeout: 600_000 });

test("every pattern page shows its visualiser, deeper theory and C++ template", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/hydrated but some attributes|hmr|WebSocket/i.test(m.text())) errors.push(m.text()); });
  const byTopic = new Map<string, number[]>();
  for (const key of Object.keys(PATTERN_CPP)) { const [t, n] = key.split(":"); byTopic.set(t, [...(byTopic.get(t) ?? []), +n]); }
  for (const [topic, ns] of byTopic) {
    ns.sort((a, b) => a - b);
    await page.goto(`/patterns/${topic}${ns[0] ? `#p-${ns[0]}` : ""}`);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 60_000 });   // the dev server compiles the page on first visit
    for (const n of ns) {
      if (n === 0) {   // <topic>:0 is the data structure itself: the Overview
        await expect(page.getByRole("heading", { name: "What it is" }), `${topic} overview`).toBeVisible({ timeout: 15_000 });
        await expect(page.getByRole("heading", { name: "Every operation and its cost" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "From scratch in C++" })).toBeVisible();
        await expect(page.getByRole("heading", { name: /Must-do questions outside the patterns/ })).toBeVisible();
        await expect(page.locator("[aria-label*='. Step 1 of']").first(), `${topic} overview visualiser`).toBeVisible();
        continue;
      }
      // the overview is server-rendered, so it can show before the hash listener exists: retry until the pattern opens
      await expect(async () => {
        await page.evaluate((h) => { location.hash = h; dispatchEvent(new HashChangeEvent("hashchange")); }, `p-${n}`);
        await expect(page.locator("#pat")).toHaveText(/.+/, { timeout: 2_000 });
        expect(await page.evaluate(() => location.hash)).toBe(`#p-${n}`);
      }, `${topic}:${n} opens`).toPass({ timeout: 30_000 });
      await expect(page.getByRole("heading", { name: "Deeper theory" }), `${topic}:${n} theory`).toBeVisible();
      await expect(page.getByRole("heading", { name: "Template in C++" }), `${topic}:${n} C++`).toBeVisible();
      await expect(page.locator("[aria-label*='. Step 1 of']").first(), `${topic}:${n} visualiser`).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

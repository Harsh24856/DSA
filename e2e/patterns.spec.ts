import { expect, test } from "@playwright/test";
import { PATTERN_CPP } from "../lib/patterns/cpp.ts";

// Every pattern, old and new: the page opens with its visualiser, its deeper theory and the C++ template, with no errors.
test.describe.configure({ timeout: 600_000 });

test("every pattern page shows its visualiser, deeper theory and C++ template", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/hydrated but some attributes|hmr|WebSocket/i.test(m.text())) errors.push(m.text()); });
  const byTopic = new Map<string, number[]>();
  for (const key of Object.keys(PATTERN_CPP)) { const [t, n] = key.split(":"); byTopic.set(t, [...(byTopic.get(t) ?? []), +n]); }
  for (const [topic, ns] of byTopic) {
    ns.sort((a, b) => a - b);
    await page.goto(`/patterns/${topic}#p-${ns[0]}`);
    await expect(page.locator("main h1")).toBeVisible({ timeout: 60_000 });   // the dev server compiles the page on first visit
    for (const n of ns) {
      await page.evaluate((h) => { location.hash = h; }, `p-${n}`);
      await expect(page.locator("#pat"), `${topic}:${n} opens`).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("heading", { name: "Deeper theory" }), `${topic}:${n} theory`).toBeVisible();
      await expect(page.getByRole("heading", { name: "Template in C++" }), `${topic}:${n} C++`).toBeVisible();
      await expect(page.locator("[aria-label*='. Step 1 of']").first(), `${topic}:${n} visualiser`).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

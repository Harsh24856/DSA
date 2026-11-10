import { expect, test } from "@playwright/test";
import { OA } from "../lib/other/oa/index.ts";

test("try first: the answer stays covered until asked for, and ticking counts the help", async ({ page }) => {
  await page.goto("/");
  const next = page.getByRole("region", { name: /Path Sum II/ });
  await next.getByRole("button", { name: /Solution for/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Try it first" })).toBeVisible();
  await expect(sheet.getByText("Key move:")).toBeHidden();
  await expect(sheet.locator("pre.code")).toBeHidden();
  await expect(sheet.locator('[aria-label*="Step "]')).toBeHidden();

  await sheet.getByRole("button", { name: "Show key move" }).click();
  await expect(sheet.getByText("Key move:")).toBeVisible();
  await expect(sheet.getByText("Counts as Hint")).toBeVisible();
  await sheet.getByRole("button", { name: "Show steps" }).click();
  await sheet.getByRole("button", { name: "Show full solution" }).click();
  await expect(sheet.locator("pre.code")).toBeVisible();
  await expect(sheet.getByText("Counts as Editorial")).toBeVisible();

  await sheet.getByRole("button", { name: "Mark solved" }).click();
  const saved = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("dsa-daily-v1")!).done) as { h: string }[]);
  expect(saved[0].h).toBe("e");
});

test("predict mode holds the next step until it is answered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("region", { name: /Path Sum II/ }).getByRole("button", { name: /Solution for/ }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Skip to full solution" }).click();
  const player = sheet.locator('[aria-label*="Step "]');
  await sheet.getByRole("button", { name: "Predict next step" }).click();
  await expect(sheet.getByText("What happens next?")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(player).toHaveAttribute("aria-label", /Step 1 of/);
  const options = sheet.locator(".btn.h-auto");
  await expect(options).toHaveCount(3);
  await options.first().click();
  await expect(sheet.getByText(/of 1 so far/)).toBeVisible();
  await sheet.getByRole("button", { name: "Next step", exact: true }).first().click();
  await expect(player).toHaveAttribute("aria-label", /Step 2 of/);
});

test("line order puzzle checks the order and can be solved", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("region", { name: /Path Sum II/ }).getByRole("button", { name: /Solution for/ }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("button", { name: "Skip to full solution" }).click();
  const code = (await sheet.locator("pre.code").innerText()).split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() && !/^\s*#/.test(l));
  await sheet.getByRole("button", { name: "Line order puzzle" }).click();
  await expect(sheet.locator("pre.code")).toBeHidden();
  for (const line of code) await sheet.getByRole("list", { name: "Lines left" }).getByRole("button", { name: `Place: ${line.trim()}`, exact: true }).first().click();
  await expect(sheet.getByText(`All ${code.length} lines are in order.`)).toBeVisible();
});

test("a failed revisit comes back, a solved one moves on", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: /Path Sum II/ })).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("dsa-daily-v1") ?? '{"quota":{}}');
    s.done = { 0: { d: "2026-01-01", h: "h", r: 0 }, 1: { d: "2026-01-01", h: "s", r: 0 } };
    localStorage.setItem("dsa-daily-v1", JSON.stringify(s));
  });
  await page.reload();
  const card = page.getByRole("region", { name: "Revisit" });
  await expect(card.getByText("check-in")).toBeVisible();
  await card.getByRole("button", { name: /Needed help: Path Sum II/ }).click();
  await expect(card.getByText("Path Sum II")).toBeHidden();
  await card.getByRole("button", { name: /Solved it/ }).click();
  await expect(card).toBeHidden();
  const done = await page.evaluate(() => JSON.parse(localStorage.getItem("dsa-daily-v1")!).done);
  expect(done[0].r).toBe(0);
  expect(done[0].b).toMatch(/^\d{4}-/);
  expect(done[1].r).toBe(1);
});

test("pattern drill runs a mixed round and remembers misses", async ({ page }) => {
  await page.goto("/drill");
  await page.getByRole("button", { name: "Start round" }).click();
  for (let k = 0; k < 10; k++) {
    await expect(page.getByRole("heading", { name: `Question ${k + 1} of 10` })).toBeVisible();
    await page.locator("main .btn.h-auto").first().click();
    await page.getByRole("button", { name: k < 9 ? "Next question" : "See results" }).click();
  }
  await expect(page.getByRole("heading", { name: "Round finished" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start another round" })).toBeVisible();
});

test("mock OA survives a reload, hides solutions and records the score", async ({ page }) => {
  await page.goto("/mock");
  await page.getByRole("button", { name: "Start the clock" }).click();
  await expect(page.getByRole("timer")).toContainText(/^(90:00|89:\d\d)$/);
  await expect(page.getByRole("button", { name: /Solution for/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Mark solved/ }).first().click();
  await page.reload();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Solved:/ })).toHaveCount(1);
  await page.getByRole("button", { name: "End test" }).click();
  await page.getByRole("button", { name: "End test" }).click();
  await expect(page.getByRole("heading", { name: "Test finished" })).toBeVisible();
  await expect(page.getByText(/1 of 3 solved/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Solution for/ })).toHaveCount(3);
  await page.getByRole("button", { name: "Set up another test" }).click();
  await expect(page.getByRole("heading", { name: "Past tests" })).toBeVisible();
});

test("a clock that ran out while away ends the test by itself", async ({ page }) => {
  await page.goto("/mock");
  await page.getByRole("button", { name: "Start the clock" }).click();
  await page.evaluate(() => { const m = JSON.parse(localStorage.getItem("dsa-mock-v1")!); m.start -= 91 * 60000; localStorage.setItem("dsa-mock-v1", JSON.stringify(m)); });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Test finished" })).toBeVisible();
  await expect(page.getByText(/0 of 3 solved in 90:00/)).toBeVisible();
});

test("weak spots on Analytics rank topics by solo rate", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.getByText("Solve 3 problems in a topic")).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("dsa-daily-v1") ?? '{"quota":{}}');
    s.done = { 1: { d: "2026-11-01", h: "e" }, 3: { d: "2026-11-01", h: "s" }, 4: { d: "2026-11-01", h: "s" } };   // three Array rows
    localStorage.setItem("dsa-daily-v1", JSON.stringify(s));
  });
  await page.reload();
  const card = page.getByRole("region", { name: "Weak spots" });
  await expect(card.getByRole("listitem").filter({ hasText: "Array" })).toContainText("2 of 3 solo");
  await expect(card.getByRole("link", { name: "Study Array" })).toHaveAttribute("href", "/patterns/array");
});

test("OA practice shows the answer after a pick and saves a miss", async ({ page }) => {
  await page.goto("/other");
  await page.locator('main a[href="/other/oa"]').click();
  await page.getByRole("button", { name: "Practice DBMS" }).click();
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();
  await expect(page.locator("main .callout")).toBeHidden();
  const options = page.locator("main .btn.h-auto");
  await expect(options).toHaveCount(4);
  await options.first().click();
  await expect(page.locator("main .callout")).toContainText(/Right|Not this one/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();   // the round survives a reload
  await expect(page.locator("main .callout")).toBeVisible();
  await page.getByRole("button", { name: "End round" }).click();
  await page.getByRole("button", { name: "End round" }).click();
  await expect(page.getByRole("heading", { name: "Round finished" })).toBeVisible();
  await expect(page.getByText(/of 1 right/)).toBeVisible();
});

test("OA timed test hides answers, keeps its clock, and brings misses back first", async ({ page }) => {
  await page.goto("/other/oa");
  await page.getByRole("button", { name: "Start the test" }).click();
  await expect(page.getByRole("heading", { name: "Question 1 of 20" })).toBeVisible();
  const start = await page.evaluate(() => JSON.parse(localStorage.getItem("dsa-oa-v1")!).start);
  await page.locator("main .btn.h-auto").first().click();
  await expect(page.locator("main .btn.h-auto").first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main .callout")).toBeHidden();
  await page.getByRole("button", { name: "Question 2", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Question 2 of 20" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("timer")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("dsa-oa-v1")!).start)).toBe(start);

  await page.getByRole("button", { name: "End test" }).click();
  await page.getByRole("button", { name: "End test" }).click();
  await expect(page.getByRole("heading", { name: "Test finished" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  const missed = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("dsa-patterns-v1")!)).filter((k) => k.startsWith("oa:")));
  expect(missed.length).toBeGreaterThanOrEqual(19);
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("dsa-patterns-v1")!)).filter((k) => k.startsWith("oatest:")).length)).toBe(1);

  await page.getByRole("button", { name: "Back to OA questions" }).click();
  await expect(page.getByText(/of 20 right/)).toBeVisible();
  const sql = missed.filter((k) => k.startsWith("oa:sql:")).map((k) => k.slice(3));
  await page.getByRole("button", { name: "Practice SQL" }).click();
  const keys = await page.evaluate(() => JSON.parse(localStorage.getItem("dsa-oa-v1")!).keys as string[]);
  for (const k of sql) expect(keys).toContain(k);
});

test("OA test ends itself when the clock runs out", async ({ page }) => {
  await page.goto("/other/oa");
  await page.getByRole("button", { name: "Start the test" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem("dsa-oa-v1")!); r.start -= 21 * 60000; localStorage.setItem("dsa-oa-v1", JSON.stringify(r)); });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Test finished" })).toBeVisible();
});

test("search finds the OA section", async ({ page, isMobile }) => {
  test.skip(isMobile, "the shortcut needs a keyboard");
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("dialog").getByRole("combobox").or(page.getByRole("dialog").getByRole("textbox")).or(page.getByRole("dialog").getByRole("searchbox")).first().fill("CS core OA");
  await page.getByRole("dialog").getByText("CS core OA questions").click();
  await expect(page).toHaveURL(/\/other\/oa$/);
});

test("every OA question fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const qs = OA.flatMap((s) => s.questions.map((q) => ({ key: `${s.id}:${q.id}`, options: [q.answer, ...q.wrong] })));
  await page.addInitScript((run) => localStorage.setItem("dsa-oa-v1", JSON.stringify(run)), { subject: null, start: 1, ended: 2, at: 0, keys: qs.map((q) => q.key), options: qs.map((q) => q.options), picks: qs.map(() => null) });
  await page.goto("/other/oa");
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByRole("main").locator("li pre").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("CS core ticks: chapters in their sections, questions one by one, with progress", async ({ page }) => {
  await page.goto("/other/design");
  const nav = page.getByRole("navigation", { name: "Chapters" });
  await expect(nav.getByRole("heading", { name: "Advanced designs" })).toBeVisible();
  await nav.getByRole("button", { name: "Done: Design a stock exchange" }).click();
  await expect(nav.getByRole("button", { name: "Done: Design a stock exchange" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("1 / 40 done")).toBeVisible();
  await page.goto("/other/design/exchange");
  await page.getByRole("button", { name: /^I can answer: / }).first().click();
  await expect(page.getByText("1 of 5", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("1 of 5", { exact: true })).toBeVisible();   // kept in the synced patterns store
  await page.goto("/other/design");
  await expect(page.getByText(/^1 \/ \d+ ticked$/)).toBeVisible();
  await page.goto("/other");
  await expect(page.getByRole("link", { name: /System Design/ }).getByText("1 / 40")).toBeVisible();
});

test("Syntax: the same program in every language, run live, compared and ticked", async ({ page }) => {
  await page.goto("/syntax#closures");
  await expect(page.getByRole("heading", { name: "Lambdas, closures, map and filter" })).toBeVisible();
  const langs = page.getByRole("group", { name: "Language" });
  await langs.getByRole("button", { name: "JavaScript" }).click();
  await expect(page.locator(".pg-log")).toContainText("total of evens squared: 20");   // JavaScript runs live in the browser
  await langs.getByRole("button", { name: "TypeScript" }).click();
  await expect(page.locator(".pg-log")).toContainText("counter: 1 2 3");
  await langs.getByRole("button", { name: "C++" }).click();
  await expect(page.getByRole("button", { name: "Run", exact: true })).toBeVisible();   // compiled languages wait for Run
  await page.getByRole("combobox").selectOption("rust");
  await expect(page.getByLabel("Lambdas, closures, map and filter in Rust")).toContainText("move ||");
  await page.getByRole("button", { name: "Learned in C++" }).click();
  await expect(page.getByText(/^1 \/ \d+ learned$/)).toBeVisible();
  await page.goto("/syntax#hello");
  await expect(page.getByRole("heading", { name: "Printing and variables" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("dsa-syntax-lang"))).toBe("cpp");
});

test("Syntax containers: the table of what exists, and the line that shows what fails", async ({ page }) => {
  await page.goto("/syntax#map-keys");
  await page.getByRole("group", { name: "Language" }).getByRole("button", { name: "JavaScript" }).click();
  await expect(page.locator(".pg-log")).toContainText("array key, equal contents: undefined");
  await expect(page.locator("pre.code").filter({ hasText: "array key, equal contents: undefined" })).toBeVisible();
  await page.getByText("Every container in JavaScript").click();
  await expect(page.getByRole("cell", { name: "write a binary heap" })).toBeVisible();
  await page.goto("/other");
  await page.getByRole("link", { name: /Syntax in six languages/ }).click();
  await expect(page).toHaveURL(/\/syntax$/);
});

test("Revision: the DSA cheat sheet, answers hidden on demand, and sheets ticked off", async ({ page }) => {
  await page.goto("/drill");
  await page.getByRole("link", { name: "DSA cheat sheet" }).click();
  await expect(page.getByRole("heading", { name: "DSA tech interview cheat sheet" })).toBeVisible({ timeout: 30_000 });   // the dev server compiles the sheet on first visit
  await expect(page.getByRole("heading", { name: "C++ templates to know by heart" })).toBeVisible();
  await expect(page.getByText("Use when: Shortest paths with non-negative weights")).toBeVisible();
  const trap = page.getByText("Unsigned size()").locator("..");
  await expect(trap.getByText(/huge number/)).toBeVisible();
  await page.getByRole("button", { name: "Hide answers" }).click();
  await expect(trap.getByText(/huge number/)).toBeHidden();
  await page.getByRole("button", { name: "Revised" }).click();
  await page.goto("/other/revise");
  await expect(page.getByText(/^1 \/ \d+ sheets revised$/)).toBeVisible();
  await page.locator('main a[href="/other/revise/genai"]').click();
  await expect(page.getByText("Explain self-attention to a non-ML engineer.")).toBeVisible();
});

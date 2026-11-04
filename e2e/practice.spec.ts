import { expect, test } from "@playwright/test";

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

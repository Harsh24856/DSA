import { expect, test } from "@playwright/test";

test("Next up, the solve sheet and its keys work from Today", async ({ page }) => {
  await page.goto("/");
  const next = page.getByRole("region", { name: /Path Sum II/ });
  await next.getByRole("button", { name: /Solution for/ }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Path Sum II" })).toBeVisible();

  const player = sheet.locator('[aria-label*="Step "]');
  await expect(player).toHaveAttribute("aria-label", /Step 1 of/);
  await page.keyboard.press("ArrowRight");
  await expect(player).toHaveAttribute("aria-label", /Step 2 of/);

  await sheet.getByRole("button", { name: "Mark solved" }).click();
  await expect(sheet.getByRole("button", { name: "Solved" })).toBeVisible();
  await sheet.getByRole("button", { name: "Next question" }).click();
  await expect(sheet.getByRole("heading", { name: /Count Triplets/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(page.getByRole("region", { name: /Count Triplets/ })).toBeVisible();   // Next up moved on
});

test("search finds a question from the keyboard and opens it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: /Path Sum II/ })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox").fill("course sched");
  await expect(page.getByRole("option").first()).toContainText("Course Schedule");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByRole("heading", { name: /Course Schedule/ })).toBeVisible();
});

test("a Codeforces row opens the worked example for its tag", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: /Path Sum II/ })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox").fill("rating 1200 greedy");
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("link", { name: /Open on Codeforces/ })).toBeVisible();
  await expect(sheet.getByText(/Swap up to k pairs/)).toBeVisible();
  await expect(sheet.locator('[aria-label*="Step "]')).toHaveAttribute("aria-label", /Step 1 of/);
});

test("landing: the hero player, plan demo and playground work signed out", async ({ page }) => {
  await page.goto("/welcome");
  const player = page.locator('[aria-label*="Step "]').first();
  await expect(player).toBeVisible();
  await page.getByRole("button", { name: "SQL", exact: true }).click();
  await expect(page.getByText("Combine Two Tables").first()).toBeVisible();

  await page.getByRole("checkbox", { name: /Tick Path Sum II/ }).click();
  await page.getByRole("button", { name: "Skip to tomorrow" }).click();
  await expect(page.getByText("Carried over").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Day 2" })).toBeVisible();

  await page.getByRole("button", { name: "Try it here" }).click();
  await expect(page.frameLocator("iframe").getByText("Solved today: 0")).toBeVisible({ timeout: 15000 });
});

import { loadSubject } from "../lib/other/index.ts";
import { expect, test, type FrameLocator, type Locator, type Page } from "@playwright/test";

// The live code playground: every React sample must render, every Node sample must run without an error,
// typing must update the result, and an endless loop must not freeze the tab.
const openSample = async (block: Locator) => { await block.scrollIntoViewIfNeeded(); await block.click(); };
const type = async (page: Page, pg: Locator, text: string) => {
  await pg.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.insertText(text);
};

test.describe.configure({ mode: "serial", timeout: 120_000 });

test("React: starter renders and updates as you type", async ({ page }) => {
  await page.goto("/other/react");
  await page.getByRole("button", { name: "Start coding" }).click();
  const pg = page.locator(".pg").first();
  const preview: FrameLocator = pg.frameLocator("iframe.pg-frame");
  await expect(preview.getByRole("heading", { name: "Clicked 0 times" })).toBeVisible({ timeout: 20_000 });
  await preview.getByRole("button", { name: "Add one" }).click();
  await expect(preview.getByRole("heading", { name: "Clicked 1 times" })).toBeVisible();
  await type(page, pg, 'export function App() { console.log("hi from app"); return <h1>Changed live</h1>; }');
  await expect(preview.getByRole("heading", { name: "Changed live" })).toBeVisible({ timeout: 10_000 });
  await expect(pg.locator(".pg-log")).toContainText("hi from app");
  await type(page, pg, "export function App( { return <h1>broken");
  await expect(pg.locator(".pg-syntax")).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Changed live" })).toBeVisible();
});

test("React: every sample shows a component", async ({ page }) => {
  let total = 0;
  for (const c of (await loadSubject("react")).chapters) {   // one chapter per page
    await page.goto(`/other/react/${c.id}`);
    const tries = page.locator(".gx-try");
    const n = await tries.count();
    total += n;
    for (let i = 0; i < n; i++) {
      await openSample(tries.nth(i));
      const pg = page.locator(".pg").last();
      await expect(pg.locator(".pg-pane-title").first()).toContainText("<", { timeout: 20_000 });
      await expect(pg.locator(".pg-log .text-hard")).toHaveCount(0);
      await tries.nth(i).click();
    }
  }
  expect(total).toBeGreaterThanOrEqual(8);
});

test("Node: Express starter answers requests", async ({ page }) => {
  await page.goto("/other/node");
  await page.getByRole("button", { name: "Start coding" }).click();
  const pg = page.locator(".pg").first();
  await expect(pg.locator(".pg-log").getByText("listening on port 3000")).toBeVisible({ timeout: 20_000 });
  await expect(pg.getByText("200 OK")).toBeVisible({ timeout: 10_000 });
  await pg.getByLabel("HTTP method").selectOption("POST");
  await pg.getByLabel("Path").fill("/notes");
  await pg.getByLabel("JSON request body").fill('{"text":"hello"}');
  await pg.getByRole("button", { name: "Send" }).click();
  await expect(pg.getByText("201 Created")).toBeVisible();
  await expect(pg.getByText('"id": 2')).toBeVisible();
});

test("Node: every sample runs without an error", async ({ page }) => {
  await page.goto("/other/node");
  const tries = page.locator(".gx-try");
  const n = await tries.count();
  for (let i = 0; i < n; i++) {
    await openSample(tries.nth(i));
    const pg = page.locator(".pg").last();
    await expect(pg.getByRole("status").first()).toHaveText("Up to date", { timeout: 20_000 });
    await page.waitForTimeout(400);
    await expect(pg.locator(".pg-log .text-hard")).toHaveCount(0);
    await tries.nth(i).click();
  }
});

test("an endless loop is stopped and the page stays alive", async ({ page }) => {
  await page.goto("/other/syntax");
  await page.getByRole("button", { name: "Start coding" }).click();
  await page.locator('section[aria-labelledby="pg-title"]').getByRole("button", { name: "JavaScript" }).click();
  const pg = page.locator(".pg").first();
  await expect(pg.locator(".pg-log")).toContainText("most common", { timeout: 20_000 });
  await type(page, pg, "while (true) {}");
  await expect(pg.locator(".pg-log")).toContainText("Stopped", { timeout: 10_000 });
  await type(page, pg, 'console.log("back")');
  await expect(pg.locator(".pg-log")).toContainText("back", { timeout: 10_000 });
});

test("SQL: real SQLite answers as you type", async ({ page }) => {
  await page.goto("/other/sql");
  await page.getByRole("button", { name: "Start coding" }).click();
  const pg = page.locator(".pg").first();
  await expect(pg.getByRole("cell", { name: "Engineering" })).toBeVisible({ timeout: 30_000 });
  await type(page, pg, "SELECT name FROM employees WHERE salary > 80000");
  await expect(pg.getByRole("cell", { name: "Asha" })).toBeVisible({ timeout: 10_000 });
  await expect(pg.getByRole("cell", { name: "Ben" })).toHaveCount(0);
});

test("Python: real CPython runs after the first Run press", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/other/syntax");
  await page.getByRole("button", { name: "Start coding" }).click();
  const pg = page.locator(".pg").first();
  await pg.getByRole("button", { name: "Run" }).click();
  await expect(pg.locator(".pg-log")).toContainText("heap", { timeout: 90_000 });
  await type(page, pg, "print(sum(range(10)))");
  await expect(pg.locator(".pg-log")).toContainText("45", { timeout: 20_000 });
  await type(page, pg, "while True: pass");
  await expect(pg.locator(".pg-log")).toContainText("Stopped", { timeout: 30_000 });
});

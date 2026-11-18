import { expect, test, type Page } from "@playwright/test";
import { LABS } from "../lib/genai2/labs/index.ts";

// Grading runs real Pyodide from the CDN, so these run once, on desktop.
test.skip(({ isMobile }) => isMobile, "desktop only");
test.setTimeout(180_000);

const URL = "/genai/lab/transformer";
const REF = LABS.transformer.steps[0].reference.numpy!;

async function write(page: Page, code: string) {
  await page.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(code);   // no auto-indent, unlike typing
}

test("the step 1 reference passes, and an endless loop is stopped at 20 s", async ({ page }) => {
  await page.goto(URL);
  await write(page, REF);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByText("4 of 4 passed")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Next step" })).toBeVisible();

  await write(page, "while True:\n    pass\n");
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByText("Stopped after 20 s")).toBeVisible({ timeout: 45_000 });
  // the page is still usable: the next run loads a fresh sandbox and passes
  await write(page, REF);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByText("4 of 4 passed")).toBeVisible({ timeout: 60_000 });
});

test("Python failing to load offers Retry", async ({ page }) => {
  await page.route("**/pyodide/**", (r) => r.abort());
  await page.goto(URL);
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByText("Python could not load")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("a PyTorch step goes to the grader route and shows its results", async ({ page }) => {
  // the real grader runs on Modal; tests never call it, so the route answers here
  let sent: { lab: string; step: string; code: string } | null = null;
  await page.route("**/api/genai/grade", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ json: { results: [{ name: "test_loss_falls", pass: true, msg: "" }, { name: "test_adamw", pass: false, msg: "expected AdamW" }], output: "step done", timedOut: false } });
  });
  await page.goto(URL);
  await page.getByRole("button", { name: /Training step/ }).click();
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByText("1 of 2 passed")).toBeVisible();
  expect(sent).toMatchObject({ lab: "transformer", step: "train-step" });

  await page.unroute("**/api/genai/grade");
  await page.route("**/api/genai/grade", (route) => route.fulfill({ status: 429, json: { error: "That is 30 PyTorch runs in 10 minutes." } }));
  await page.getByRole("button", { name: "Run tests" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "30 PyTorch runs" })).toBeVisible();
});

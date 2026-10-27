import { expect, test, type Page } from "@playwright/test";

const ROUTES = ["/", "/analytics", "/patterns", "/patterns/array", "/problems", "/roadmap"];

/** Main content is on screen: it has text, and nothing in the viewport is still faded out. */
async function visible(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main || !main.innerText.trim()) return "empty";
    const opacity = (el: Element | null) => {
      let o = 1;
      for (; el && el !== document.body; el = el.parentElement) o *= Number(getComputedStyle(el).opacity);
      return o;
    };
    const hidden = [...main.querySelectorAll("section, .card, h2, p, a, button")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && opacity(el) < 0.95;
    });
    return hidden.length ? `faded: ${hidden.slice(0, 3).map((el) => el.outerHTML.slice(0, 80)).join(" | ")}` : "ok";
  });
}

test("every page shows its content right after a nav click", async ({ page }) => {
  // the Next dev-tools badge sits over the mobile "Today" tab
  await page.addInitScript(() => addEventListener("DOMContentLoaded", () => document.head.append(Object.assign(document.createElement("style"), { textContent: "nextjs-portal{display:none}" }))));
  // compile every route once so dev-server compile time does not count against the 500 ms budget
  for (const r of ROUTES) await page.goto(r);
  await page.goto("/");
  await expect.poll(() => visible(page)).toBe("ok");

  const nav = page.getByRole("navigation", { name: "Sections" }).filter({ visible: true });
  for (let round = 0; round < 4; round++) {
    for (const r of ROUTES) {
      // half the time leave the old page scrolled down, which is when blank pages showed up
      if (round % 2) await page.mouse.wheel(0, 3000);
      if (r === "/patterns/array") await page.locator('main a[href="/patterns/array"]').click();
      else await nav.locator(`a[href="${r}"]`).click();
      await expect(page).toHaveURL(r);
      await expect.poll(() => visible(page), { timeout: Number(process.env.NAV_BUDGET ?? 500), intervals: [50] }).toBe("ok");
    }
  }
});

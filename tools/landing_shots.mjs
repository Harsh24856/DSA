// Takes the real screenshots the landing page shows. Start the app with NEXT_PUBLIC_E2E=1 on :4123 first, then:
//   node tools/landing_shots.mjs
// Progress is sample data, seeded into this browser only.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:4123", OUT = "public/landing";
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const done = {};
[[0, 10], [1, 11], [2, 7], [3, 12], [4, 8], [5, 13], [6, 9], [7, 14], [8, 5], [9, 15], [10, 6], [11, 16]].forEach(([i, d], k) => { done[i + 3] = { d: day(d % 7), h: k % 4 ? "s" : "h", r: 0, t: 0 }; });
done[0] = { d: day(0), h: "s", r: 0, t: 0 };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, colorScheme: "dark", reducedMotion: "reduce" });
await ctx.addInitScript((d) => { localStorage.setItem("dsa-daily-v1", JSON.stringify({ done: d })); localStorage.setItem("dsa-daily-theme", "dark"); }, done);
const page = await ctx.newPage();
const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const shot = async (name, opts = {}) => { await hideDev(); await page.waitForTimeout(900); await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82, ...opts }); console.log(name); };

await page.goto(`${BASE}/`); await page.waitForTimeout(2500);
await shot("today");

await page.getByRole("button", { name: "Solution" }).first().click(); await page.waitForTimeout(1500);
await page.getByRole("button", { name: /Next|Step/ }).first().click().catch(() => {});
await hideDev(); await page.waitForTimeout(900);
await page.locator("dialog, [role=dialog]").filter({ visible: true }).first().screenshot({ path: `${OUT}/visualizer.jpg`, type: "jpeg", quality: 82 }); console.log("visualizer");

await page.goto(`${BASE}/other/react`); await page.getByRole("button", { name: "Start coding" }).click(); await page.waitForTimeout(3000);
await page.locator(".pg").first().scrollIntoViewIfNeeded(); await page.evaluate(() => { const r = document.querySelector(".pg").getBoundingClientRect(); scrollBy(0, r.top - 88); });
await page.locator(".pg").first().frameLocator("iframe.pg-frame").getByRole("button", { name: "Add one" }).click(); await hideDev(); await page.waitForTimeout(900);
await page.locator(".pg").first().screenshot({ path: `${OUT}/playground.jpg`, type: "jpeg", quality: 82 }); console.log("playground");

await page.goto(`${BASE}/other/design`); await page.waitForTimeout(2500);
await hideDev();
await page.locator("#consistency h4", { hasText: "In the real world" }).locator("..").screenshot({ path: `${OUT}/story.jpg`, type: "jpeg", quality: 82 }); console.log("story");
await b.close();

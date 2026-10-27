import { defineConfig, devices } from "@playwright/test";

// Navigation checks run against a dev server on its own port with the E2E sign-in bypass (lib/store.tsx).
// E2E_PORT lets two checkouts run their checks at the same time.
const PORT = Number(process.env.E2E_PORT ?? 4100);
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "desktop", testIgnore: /ui\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", testIgnore: /ui\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    // UI consistency: every page and panel at 1280px and 375px in four themes (sets its own viewports)
    { name: "ui", testMatch: /ui\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { NEXT_PUBLIC_E2E: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

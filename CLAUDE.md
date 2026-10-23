# DSA Daily

Placement practice tracker for harsh (placements May 2027; ~2 hrs/day, mostly Mediums; weekdays 2 DSA + 1 SQL, weekends 3 DSA + 2 SQL, a few Codeforces).

## Layout
- The live website is a Next.js (App Router) + TypeScript app: `app/` (layout, page, `globals.css`), `components/` (client UI), `lib/schedule.ts` (pure scheduling rules), `lib/problems.ts` (problem data), `public/` (favicon, manifest). Deployed on Vercel, framework Next.js (set in `vercel.json`).
- `trackers/DSA_Prep_Tracker.xlsx`: Excel/Google Sheets version (ticks in the Plan tab; open as a Google Sheet, it uses FILTER/SPARKLINE/ARRAY_CONSTRAIN).
- `trackers/DSA_Daily_Claude_Artifact.html`: the single-file version published as a Claude artifact (saves via the Claude `db` capability, falls back to localStorage).
- `tools/`: the generators that produced the above. They are reference, not part of the site (`.vercelignore` keeps them off Vercel).

## How the site works
- `P` (in lib/problems.ts) rows: `[track L/S/C, title, slug-or-url, level, phase 1-4, topic]`. LeetCode slugs become `https://leetcode.com/problems/<slug>/`.
- Progress lives in localStorage key `dsa-daily-v1`: `{done:{<row index>:{d:"YYYY-MM-DD", h:"s|h|e", r:revisits, n:note, t:ms}}, quota:{L,S,wL,wS,C}, seen:{<row index>:"YYYY-MM-DD"}}`. `L/S` are per weekday, `wL/wS` per weekend day, `C` Codeforces per week; `normalize()` fills keys missing from old saves. `seen` is the first day a problem was on the list (drives the "From Mon" tag). Ticks are keyed by row index, so never reorder or delete rows in problems.ts; only append.
- Today's list per track = lowest-index problems among (done today + undone) up to that day's quota, so missed problems come back the next day and extras pull later problems forward without lowering the next day's minimum. Codeforces appears on Sat/Sun with a weekly quota.
- Rules are pure functions in `lib/schedule.ts`; `npm test` runs `lib/schedule.test.ts`. Add a test there when changing scheduling.
- Hint/Editorial problems resurface in "Revisit" at +3, +7, +21 days.
- Themes: `data-palette` (midnight default, galaxy, ocean, forest, sunset, rose, mono) and `data-theme` (light/dark, absent = follow system) on `<html>`; tokens are CSS variables in app/globals.css. An inline script in app/layout.tsx applies them before first paint. Theme choice is stored in `dsa-daily-palette` / `dsa-daily-theme`.
- Backup/restore downloads/reads a JSON file of the progress state.

## Regenerating (optional)
`tools/build_sheet.py midnight` rebuilds the xlsx and needs two datasets in its working dir (not committed, 38 MB):
- https://raw.githubusercontent.com/noworneverev/leetcode-api/main/data/leetcode_questions.json
- https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json
`tools/build_site.py` then `tools/build_site2.py` generated the original static site from `tools/template.html` + `tools/data/problems.json`; the site is now Next.js, so they are a historical record. To change the problem list, append rows to `lib/problems.ts`.

## Run locally
`npm install`, then `npm run dev` and open http://localhost:4000. Checks: `npm test`, `npm run lint` (tsc), `npm run build`.

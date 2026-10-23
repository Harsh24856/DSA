# DSA Daily

Placement practice tracker for harsh (placements May 2027; ~2 hrs/day, mostly Mediums, 1 SQL daily, a few Codeforces).

## Layout
- `index.html`, `assets/style.css`, `assets/app.js`, `assets/problems.js`: the live website (static, no build). Deployed on Vercel from the repo root, preset "Other".
- `trackers/DSA_Prep_Tracker.xlsx`: Excel/Google Sheets version (ticks in the Plan tab; open as a Google Sheet, it uses FILTER/SPARKLINE/ARRAY_CONSTRAIN).
- `trackers/DSA_Daily_Claude_Artifact.html`: the single-file version published as a Claude artifact (saves via the Claude `db` capability, falls back to localStorage).
- `tools/`: the generators that produced the above. They are reference, not part of the site (`.vercelignore` keeps them off Vercel).

## How the site works
- `P` (in problems.js) rows: `[track L/S/C, title, slug-or-url, level, phase 1-4, topic]`. LeetCode slugs become `https://leetcode.com/problems/<slug>/`.
- Progress lives in localStorage key `dsa-daily-v1`: `{done:{<row index>:{d:"YYYY-MM-DD", h:"s|h|e", r:revisits, n:note, t:ms}}, quota:{L,S,C}}`. Ticks are keyed by row index, so never reorder or delete rows in problems.js; only append.
- Today's list per track = lowest-index problems among (done today + undone) up to the daily quota, so extras pull later problems forward and misses roll over. Codeforces appears on Sat/Sun with a weekly quota.
- Hint/Editorial problems resurface in "Revisit" at +3, +7, +21 days.
- Themes: `data-palette` (midnight default, galaxy, ocean, forest, sunset, rose, mono) and `data-theme` (light/dark, absent = follow system) on `<html>`; tokens are CSS variables in style.css. Theme choice is stored in `dsa-daily-palette` / `dsa-daily-theme`.
- Backup/restore downloads/reads a JSON file of the progress state.

## Regenerating (optional)
`tools/build_sheet.py midnight` rebuilds the xlsx and needs two datasets in its working dir (not committed, 38 MB):
- https://raw.githubusercontent.com/noworneverev/leetcode-api/main/data/leetcode_questions.json
- https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json
`tools/build_site.py` then `tools/build_site2.py` regenerate the site from `tools/template.html` + `tools/data/problems.json` (they expect to run from a folder containing `page/template.html` and `problems.json`). For UI work, editing `index.html`/`assets/` directly is simpler; the generators are a record of how they were made.

## Run locally
`npx serve -l 4000 .` then open http://localhost:4000.

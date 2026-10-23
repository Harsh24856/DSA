# DSA Daily

Daily placement practice tracker: 2 LeetCode + 1 SQL a day, Codeforces on weekends, 624 problems scheduled up to May 2027.
Three views (Today, All problems, Roadmap) and 7 colour themes, each with light and dark mode.
Plain HTML, CSS and JavaScript. No build step, no backend.

## Deploy on Vercel

**Option A: drag and drop (no Git)**
2. Go to https://vercel.com/new and choose to deploy without Git, or install the CLI: `npm i -g vercel`.
3. With the CLI, run `vercel` inside this folder, accept the defaults, then `vercel --prod`.

**Option B: from GitHub**
1. On https://vercel.com/new, import the repository.
2. Framework preset: **Other**. Leave the build command empty and the output directory as the root. Click Deploy.

## Run locally
Run `npx serve -l 4000 .` and open http://localhost:4000.

## Where progress is saved
Ticks, notes and settings are saved in your browser's local storage, so they stay on that device and browser.
Use **Settings & rules → Download backup** now and then, and **Restore backup** on a new device.

## Also in this repo
- `trackers/`: the Excel tracker and the single-file Claude artifact version.
- `tools/`: scripts that generated everything (see CLAUDE.md).

## Files
- `index.html`: page layout
- `assets/style.css`: themes (Midnight, Galaxy, Ocean, Forest, Sunset, Rose, Mono). Pick one with the round button top-right
- `assets/app.js`: scheduling, ticking, revisits, backup
- `assets/problems.js`: the problem list. Edit it to add or reorder problems (ticks are stored by row position, so add new ones at the end of a track).

# DSA Daily

Daily placement practice tracker, 624 problems scheduled up to May 2027:
- Weekdays: 2 DSA (LeetCode) + 1 SQL. Weekends: 3 DSA + 2 SQL, plus a weekly Codeforces goal.
- Anything you don't finish comes back the next day, marked with the day it was first scheduled.
- Solving extra pulls later problems forward, but the next day's minimum stays the same.

Four views (Today, Stats, Problems, Roadmap) and 7 colour themes, each with light and dark mode, switchable from the Theme section or the round button top-right.
Stats shows your pace against the plan, an activity grid from your first week to placements, how often you needed help, difficulty coverage and your most-practised topics.
Built with Next.js (App Router) and TypeScript. No backend: progress lives in the browser.

## Run locally
```
npm install
npm run dev      # http://localhost:4000
npm test         # scheduling rules (node --test)
npm run lint     # type check
npm run build    # production build
```

## Deploy on Vercel
Import the repository on https://vercel.com/new. `vercel.json` sets the framework to Next.js, so the defaults work.
If the project was created earlier with the "Other" preset, change it to **Next.js** in Project Settings → Build and Deployment.

## Where progress is saved
Ticks, notes and settings are saved in your browser's local storage, so they stay on that device and browser.
Use **Settings and rules → Download backup** now and then, and **Restore backup** on a new device.

## Files
- `app/`: layout, page and `globals.css` (themes: Midnight, Galaxy, Ocean, Forest, Sunset, Rose, Mono).
- `components/`: the UI. `progress.tsx` holds the saved state, `Today.tsx` the daily view.
- `lib/schedule.ts`: the scheduling rules (daily list, rollover, revisits, week goals), tested in `lib/schedule.test.ts`.
- `lib/stats.ts` + `components/charts.tsx`: the Stats tab's numbers and charts, tested in `lib/stats.test.ts`.
- `lib/problems.ts`: the problem list. Ticks are stored by row position, so add new problems at the end; never reorder or delete.
- `trackers/`: the Excel tracker and the single-file Claude artifact version.
- `tools/`: scripts that generated everything (see CLAUDE.md).

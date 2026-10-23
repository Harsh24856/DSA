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

## Cloud sync with Supabase (optional)
Without these steps the site keeps progress in the browser only. With them, you sign in with an email link and every
solve is stored in your Supabase project, synced across devices, with a full history of every change.

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run `supabase/migrations/0001_progress.sql`. It creates three tables
   (`solves`, `settings`, `solve_events`) with row-level security so each account only sees its own rows.
3. In **Authentication → URL Configuration**, set the Site URL to your Vercel address and add
   `http://localhost:4000` and your Vercel address under Redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the Project URL and the anon (publishable) key from
   **Project Settings → API**. Never use the `service_role` key here.
5. Add the same two variables in **Vercel → Project → Settings → Environment Variables**, then redeploy.

The first time you sign in, progress already saved in that browser is uploaded to your account.
After that, ticks made offline are queued and sent when the connection returns.

## Where progress is saved
Ticks, notes and settings are saved in your browser's local storage. When signed in (see above) they are also kept in Supabase.
Without an account, use **Settings and rules → Download backup** now and then, and **Restore backup** on a new device.

## Files
- `app/`: layout, page and `globals.css` (themes: Midnight, Galaxy, Ocean, Forest, Sunset, Rose, Mono).
- `components/`: the UI. `progress.tsx` holds the saved state, `Today.tsx` the daily view.
- `lib/schedule.ts`: the scheduling rules (daily list, rollover, revisits, week goals), tested in `lib/schedule.test.ts`.
- `lib/stats.ts` + `components/charts.tsx`: the Stats tab's numbers and charts, tested in `lib/stats.test.ts`.
- `lib/sync.ts` + `components/cloud.ts`: Supabase sync (diff, merge, outbox), tested in `lib/sync.test.ts`. Schema in `supabase/migrations/`.
- `lib/problems.ts`: the problem list. Ticks are stored by row position, so add new problems at the end; never reorder or delete.
- `trackers/`: the Excel tracker and the single-file Claude artifact version.
- `tools/`: scripts that generated everything (see CLAUDE.md).

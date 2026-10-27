# DSA Daily

Placement practice tracker, now public: anyone can sign in with Google and gets their own progress. Built by harsh (placements May 2027; plan starts 24 Oct 2026); the schedule constants in `lib/logic.ts` are still his.

## Layout
- Next.js 16 (App Router) + TypeScript + Tailwind v4. Deployed on Vercel (`vercel.json` sets framework `nextjs`).
- `app/`: routes `/` (Today), `/analytics`, `/patterns` + `/patterns/[topic]`, `/problems`, `/roadmap`; `layout.tsx` (fonts, theme script, store, shell); `globals.css` (all design tokens).
- `components/`: `Shell` (sidebar, mobile tab bar, toast), `Settings` (sheet dialog), `ProblemRow`, `charts.tsx` (Recharts + custom heatmap/topic bars), `ui.tsx` (Card, Count, Bar, Seg, Skeleton).
- `lib/`: `problems.ts` (data), `logic.ts` (scheduling + analytics, pure functions), `sync.ts` (Supabase RPC), `store.tsx` (client context: state, actions, sync, theme).
- Patterns section: `lib/patterns/*.ts` (14 topics, 85 patterns: theory, steps, Python template, best/average/worst complexity, traps, visualiser), `lib/patterns/problems.ts` (generated practice lists keyed by LeetCode number), `lib/sim.ts` (simulators that record real algorithm steps as frames), `lib/diagram.ts` (frame types), `components/Visualizer.tsx` (player + 7 renderers), `components/TopicView.tsx`. Pattern problems are separate from the daily plan: ticks live in localStorage `dsa-patterns-v1` and the Supabase `patterns` column via RPC `dsa_patterns_sync` (same sync key), and never touch `lib/problems.ts`, Today or Analytics. The written content is original; the cheatsheets only supplied the pattern list and problem numbers.
- `public/`: favicon and manifest.
- `trackers/`: the Excel/Google Sheets tracker and the single-file Claude artifact version. `tools/`: generators that produced the original site and xlsx (reference only; `.vercelignore` keeps both off Vercel).

## How it works
- `P` rows in `lib/problems.ts`: `[track L/S/C, title, slug-or-url, level, phase 1-4, topic]`. LeetCode slugs become `https://leetcode.com/problems/<slug>/`.
- Progress lives in localStorage key `dsa-daily-v1`: `{done:{<row index>:{d:"YYYY-MM-DD", h:"s|h|e", r:revisits, n:note, t:ms}}, quota:{L,S,C,wL,wS,wC,v:2}}`. Ticks are keyed by row index, so never reorder or delete rows in problems.ts; only append.
- Today's list per track = lowest-index problems among (done today + undone) up to the daily quota, so extras pull later problems forward and misses roll over. Quotas are per weekday (3 LeetCode + 1 SQL) and per weekend day (3 + 2 + 2 Codeforces), stored with `v: 2`; each track has an add-a-problem button that pulls its next problems forward.
- Hint/Editorial problems resurface in Revisit at +3, +7, +21 days.
- Themes: `data-palette` (midnight default, galaxy, ocean, forest, sunset, rose, mono) and `data-theme` (light/dark, absent = follow system) on `<html>`. Stored in `dsa-daily-palette` / `dsa-daily-theme`.
- Sign-in and sync: Supabase project `dsa-daily` (ref `dmiiflynxamcooowyhps`, schema in `supabase/schema.sql`). "Continue with Google" via Supabase Auth; `@supabase/ssr` keeps the session in cookies (`lib/supabase/client.ts`, `server.ts`), `proxy.ts` refreshes it on every request and sends signed-out visitors to `/login`; `app/auth/callback/route.ts` exchanges the OAuth code. Progress lives in table `dsa_progress` (one row per email, RLS read-own) via RPCs `progress_sync` and `progress_patterns_sync` (any signed-in user, own row only, payload size-capped). Local copies are tagged with their owner (`lib/owner.ts`): a different account signing in on the same browser starts clean, and sign-out clears local progress. The client diffs local state against `dsa-daily-base:<email>` and sends only changes, so offline edits sync later. The legacy sync-key row `dsa_state` is kept read-only as a backup; its RPCs are revoked. Supabase Auth URL config: Site URL https://dsa-visualizer-ashy-omega.vercel.app, redirects to /auth/callback on that host and on http://localhost:4000.

## Commands
- `npm run dev`: local dev server on http://localhost:4000
- `npm run build`: production build (must pass before shipping)
- `npm run typecheck`: `tsc --noEmit` (must pass before shipping)
- `npm run check`: rolling-window schedule checks (`lib/logic.check.ts`)

## Design system
Source of truth: tokens in `app/globals.css`, mapped to Tailwind colors in `@theme inline` (`bg-surface`, `bg-surface-2`, `text-ink`, `text-muted`, `border-line`, `border-line-strong`, `bg-accent`, `text-accent-ink`, `bg-accent-soft`, `text-easy|medium|hard`, `--heat-0..4` for chart intensity).
- Fonts: Geist (UI) and Geist Mono (numbers, `.num`) via `next/font`.
- Icons: `@phosphor-icons/react` only, one family, decorative icons get `aria-hidden`.
- Radius: cards 16px (`.card`), controls 10px (`.field`, `.btn`), pills full.
- Motion: `motion/react`, ease `[0.16, 1, 0.3, 1]`, 0.25-0.9s. Every animation has a reason (state change, new content, feedback) and respects `useReducedMotion()` / the reduced-motion CSS block.
- Charts: colors from tokens only; each chart has a text alternative (`aria-label` summary or visible numbers) and never relies on color alone.

### Cannot ship if
- A component uses a hex/rgb color literal instead of a token (exceptions: palette swatches in `lib/store.tsx`, the dialog scrim in `globals.css`). Check: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgb\(" app components | grep -v globals.css`
- Any visible string contains an em dash. Check: `grep -rn "—" app components lib`
- An interactive element is a `div` with `onClick`, or an icon-only button lacks `aria-label`.
- `npm run typecheck` or `npm run build` fails.
- A view was not checked in both light and dark mode and at 375px width.

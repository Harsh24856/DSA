# DSA Daily

Placement practice tracker for harsh (placements May 2027; plan starts 24 Oct 2026; ~2 hrs/day, mostly Mediums, 1 SQL daily, a few Codeforces).

## Layout
- Next.js 16 (App Router) + TypeScript + Tailwind v4. Deployed on Vercel (`vercel.json` sets framework `nextjs`).
- `app/`: routes `/` (Today), `/analytics`, `/problems`, `/roadmap`; `layout.tsx` (fonts, theme script, store, shell); `globals.css` (all design tokens).
- `components/`: `Shell` (sidebar, mobile tab bar, toast), `Settings` (sheet dialog), `ProblemRow`, `charts.tsx` (Recharts + custom heatmap/topic bars), `ui.tsx` (Card, Count, Bar, Seg, Skeleton).
- `lib/`: `problems.ts` (data), `logic.ts` (scheduling + analytics, pure functions), `sync.ts` (Supabase RPC), `store.tsx` (client context: state, actions, sync, theme).
- `public/`: favicon and manifest.
- `trackers/`: the Excel/Google Sheets tracker and the single-file Claude artifact version. `tools/`: generators that produced the original site and xlsx (reference only; `.vercelignore` keeps both off Vercel).

## How it works
- `P` rows in `lib/problems.ts`: `[track L/S/C, title, slug-or-url, level, phase 1-4, topic]`. LeetCode slugs become `https://leetcode.com/problems/<slug>/`.
- Progress lives in localStorage key `dsa-daily-v1`: `{done:{<row index>:{d:"YYYY-MM-DD", h:"s|h|e", r:revisits, n:note, t:ms}}, quota:{L,S,C}}`. Ticks are keyed by row index, so never reorder or delete rows in problems.ts; only append.
- Today's list per track = lowest-index problems among (done today + undone) up to the daily quota, so extras pull later problems forward and misses roll over. Codeforces appears on Sat/Sun with a weekly quota.
- Hint/Editorial problems resurface in Revisit at +3, +7, +21 days.
- Themes: `data-palette` (midnight default, galaxy, ocean, forest, sunset, rose, mono) and `data-theme` (light/dark, absent = follow system) on `<html>`. Stored in `dsa-daily-palette` / `dsa-daily-theme`.
- Cloud sync: Supabase project `dsa-daily` (ref `dmiiflynxamcooowyhps`, schema in `supabase/schema.sql`). No auth; the browser sends a sync key (localStorage `dsa-daily-sync-key`) to RPC `dsa_sync`, which stores only its hash, and the first key ever used claims the single row. The client diffs local state against `dsa-daily-base` (last server-confirmed state) and sends only the changes, so offline edits sync later. It syncs after each change, when the tab is focused, and every 60s.

## Commands
- `npm run dev`: local dev server on http://localhost:4000
- `npm run build`: production build (must pass before shipping)
- `npm run typecheck`: `tsc --noEmit` (must pass before shipping)

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

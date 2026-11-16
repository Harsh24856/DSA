# Gen AI rebuild, step 1 (foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the new Gen AI roadmap hub, a visual-first module page with placement questions, and one gold-standard module (self-attention), while every old Gen AI page keeps working.

**Architecture:** Typed module data in `lib/genai2/` (roadmap of 11 stages, module registry, needs computed and checked at import), rendered by new client components in `components/genai2/`. The existing dynamic route `app/genai/[id]` serves both new module ids and old ids (`m0` to `m12` etc.); unbuilt roadmap entries link to their old page. Visual blocks reuse `FlowPlayer`, `FlowLab`, `GenaiLab` and `useMermaid`; new figures are SVG components using tokens.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4 tokens, motion/react, Remotion player (via `FlowPlayer`), Node `--experimental-strip-types` checks, Python 3 + NumPy for output-question checks.

**Spec:** `docs/superpowers/specs/2026-11-16-genai-rebuild-design.md`

## Global Constraints

- Design tokens only; no hex/rgb literals in components (`grep -rnE "#[0-9a-fA-F]{3,8}\b|rgb\(" app components | grep -v globals.css` stays clean).
- No em dash in any visible string (`grep -rn "—" app components lib` returns nothing new).
- Phosphor icons only; icon-only buttons have `aria-label`; no `div` with `onClick`.
- Spacing scale 0/2/4/8/12/16/24/32/40/48/64/80/96 px; radius card 16, tile 12, control 8.
- Motion: `motion/react`, ease `[0.22, 1, 0.36, 1]`, honours `useReducedMotion()`.
- Every number shown is computed in code, never typed.
- Never copy text, code or images from the course notes.
- Ticks in the patterns store: `genai2:<module>` (module done), `genaiq:<module>:<q>` ("I can answer" on explain questions). Old `genai:<id>` keys untouched.
- Module rules (checked): at least 3 visual blocks (`flow`, `play`, `lab`, `figure`, `mermaid`); visual blocks outnumber text blocks; a text block is at most 80 words; 12 to 20 questions; at least one each of concept, numeric-or-output, explain, trap; MCQs have 4 distinct options and never "of the above".
- `npm run typecheck`, `npm run build`, `npm run check:genai` pass; pages checked at 1280px and 375px in light and dark.

## Review Focus

1. **Old links:** `/genai/m2`, `/genai/start`, `/genai/interview` must still render the old pages exactly as before. Test: navigation spec visits `/genai/m2` and `/genai/self-attention`.
2. **Signed-out or fresh user on the hub:** no ticks at all; Next up must point at the first module of stage 0, and stage progress shows 0 without dividing by zero. Test: `nextUp({})` in the check returns the first module id.
3. **Answer shuffling:** the correct option must not always sit in the same slot, and choosing it must mark it right after the shuffle. Test: unit check that `mcqOptions(q, rng)` contains the answer once and 4 items.
4. **Reduced motion and phone width:** the module page must not scroll sideways at 375px and must render without animation under reduced motion. Test: add `/genai` and `/genai/self-attention` to `e2e/ui.spec.ts`.
5. **Needs order:** a module needing a later module must fail loudly at import, not render a broken roadmap. Test: check asserts `withNeeds` throws on a bad fixture.

---

### Task 1: Data model, roadmap and checks

**Files:**
- Create: `lib/genai2/types.ts`, `lib/genai2/roadmap.ts`, `lib/genai2/index.ts`, `lib/genai2/genai.check.ts`
- Modify: `package.json` (add `"check:genai": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON lib/genai2/genai.check.ts"`)

**Interfaces:**
- Produces (in `types.ts`):
  - `type Level = "easy" | "medium" | "hard"`
  - `type GQuestion = { id: string; level: Level } & ({ kind: "concept" | "numeric" | "output"; q: string; code?: string; answer: string; wrong: string[]; why: string } | { kind: "explain"; q: string; answer: string } | { kind: "trap"; claim: string; truth: boolean; why: string })` (`code` is Python for output questions)
  - `type Block = { kind: "flow"; id: string } | { kind: "play"; id: string } | { kind: "lab"; id: LabKind } | { kind: "figure"; id: string; caption: string } | { kind: "mermaid"; src: string; caption: string } | { kind: "text"; md: string } | { kind: "compare"; head: string[]; rows: string[][] } | { kind: "code"; src: string; run?: boolean } | { kind: "predict"; q: string; answer: string; wrong: string[]; why: string }`
  - `type GModule = { id: string; stage: number; title: string; hook: string; blocks: Block[]; keyPoints: string[]; questions: GQuestion[]; lab?: string; real?: { who: string; when: string; what: string; takeaway: string; url: string }[] }`
  - `type RoadEntry = { id: string; title: string; old?: string; needs: string[]; built: boolean }`
  - `type Stage = { n: number; title: string; blurb: string; builds: number[]; modules: RoadEntry[] }`
- Produces (in `index.ts`): `STAGES: Stage[]`, `MODULES: Record<string, GModule>`, `entry(id: string): RoadEntry | undefined`, `nextUp(done: Record<string, unknown>): string | undefined`, `moduleKey(id) => "genai2:" + id`, `questionKey(m, q) => "genaiq:" + m + ":" + q`, `withNeeds(stages): Stage[]` (throws `Error("<id> needs <other>, which comes later")`), `mcqOptions(q, rng = Math.random): string[]`.

- [ ] **Step 1: Write the failing check** in `lib/genai2/genai.check.ts` using `node:assert/strict`:
  - `STAGES.length === 11`, stage numbers 0..10 in order, every module id unique across stages and not equal to any old id (`m0`..`m12`, `start`, `interview`, `design`, `glossary`, `resources`).
  - `nextUp({})` equals `STAGES[0].modules[0].id`; with every module key set, `nextUp` is `undefined`.
  - `withNeeds` throws on a fixture where module `b` (stage 0, index 0) needs `a` (stage 1).
  - `mcqOptions` on a 3-wrong question returns 4 strings containing the answer exactly once, for 20 seeded rngs.
  - every `MODULES` entry: `entry(id)?.built === true`, and the module rules from Global Constraints (count visual vs text blocks, words per text block by `md.split(/\s+/).length <= 80`, 12 to 20 questions, kind coverage, 4 distinct MCQ options, no option matching `/of the above/i`).
- [ ] **Step 2: Run** `npm run check:genai`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `roadmap.ts`** with the 11 stages and module titles from the spec's roadmap table (one module per semicolon item, slug ids such as `arrays-broadcasting`, `self-attention`, `multi-head-masks`). `old` maps a module to its nearest old page: stage 2 to `m0`, stage 3 to `m1`, stage 4 to `m2`, stage 5 to `m6`, stage 6 to `m3`, stage 7 to `m4`, stage 8 to `m5`, stage 9 to `m7` (serving, security) or `m10` (evals) or `m12` (speedups), stage 10 to `m11` (reasoning) or `m8` (multimodal) or `m1` (MoE, SSM); stages 0 and 1 have no `old`. `builds`: stage n builds on n minus 1 (stage 0 on none; stage 6 builds on 4; stage 7 on 6; stage 10 on 5 and 9). Default `needs`: the previous module in the stage; the first module of a stage needs the last module of each stage in `builds`. `built` is computed in `index.ts` as `id in MODULES`.
- [ ] **Step 4: Implement `index.ts`** (`MODULES` starts empty; Task 4 adds `self-attention`). `nextUp` returns the first module, in stage order, whose `moduleKey` is not truthy in `done`. `mcqOptions` = `shuffle([answer, ...wrong])` using `shuffle` from `lib/practice.ts`.
- [ ] **Step 5: Run** `npm run check:genai`. Expected: PASS (module rules loop runs over zero modules).
- [ ] **Step 6: Run** `npm run typecheck`. Expected: no errors.
- [ ] **Step 7: Commit** `git add lib/genai2 package.json && git commit -m "Gen AI rebuild: roadmap data, needs and checks"`

### Task 2: Module page and questions

**Files:**
- Create: `components/genai2/ModuleView.tsx` (client: header with stage eyebrow, title, hook, Module done tick; blocks; key points; questions; prev/next within the roadmap), `components/genai2/Blocks.tsx` (renders one `Block`), `components/genai2/Questions.tsx`, `components/genai2/figures/index.tsx` (`FIGURES: Record<string, () => React.JSX.Element>`, empty for now)
- Modify: `app/genai/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 1 exports; `FlowPlayer` (`components/other/FlowPlayer`, default export, prop `id`), `FlowLab` (`components/other/FlowLab`, prop `id`), `GenaiLab` (`components/labs`, prop `kind`), `Rich` (`components/other/Rich`, prop `text`), `useMermaid` (`components/useMermaid.ts`), `usePatterns()` (`{ done, toggle(key, on) }`).
- Produces: `<ModuleView id={string} />`; `<Questions moduleId={string} questions={GQuestion[]} />`.

Behaviour decided here:
- `FlowPlayer` and `FlowLab` load with `next/dynamic` and `ssr: false`, with the same placeholders as `OtherView.tsx:24-25`.
- `predict` block: three or four buttons (shuffled with `mcqOptions`); after a pick, shows right or wrong with `why`, buttons disabled.
- `Questions`: filter chips by level (All, Easy, Medium, Hard) using `.chip`. Concept/numeric/output: options as buttons, reveal `why` after pick; output shows `code` in a `.code` block above. Explain: question, "Show answer" button revealing `answer` via `Rich`, and an "I can answer" tick stored at `questionKey`. Trap: "True" / "False" buttons, then `why`. A header line shows `answered right / tried` for this visit (not stored).
- `compare`: a table in `.tile` with horizontal scroll inside the tile only.
- `code` with `run`: reuse `RunPanel` from `GenaiDoc.tsx` (export it there) to run in Pyodide.
- `app/genai/[id]/page.tsx`: `generateStaticParams` returns old ids plus `Object.keys(MODULES)`; if `MODULES[id]` render `<ModuleView id={id} />`, else existing `<GenaiView id={id} />`, else `notFound()`.

- [ ] **Step 1: Add the check** in `genai.check.ts`: for a fixture module with every block kind, `JSON.stringify` round-trips (data only, no functions) and every `figure` id in real `MODULES` exists in a `FIGURE_IDS` string array exported from `lib/genai2/index.ts`. Run `npm run check:genai`: FAIL (`FIGURE_IDS` missing).
- [ ] **Step 2: Export `FIGURE_IDS: readonly string[]`** from `index.ts` (empty now; Task 4 adds ids) and make `figures/index.tsx` typed as `Record<(typeof FIGURE_IDS)[number], ...>`. Run the check: PASS.
- [ ] **Step 3: Build the components** described above.
- [ ] **Step 4: Run** `npm run typecheck` and `npm run build`. Expected: both pass; build lists `/genai/m2` among static pages.
- [ ] **Step 5: Commit** `git commit -am "Gen AI rebuild: module page, blocks and questions"` (add the new files first).

### Task 3: Roadmap hub

**Files:**
- Create: `components/genai2/RoadmapHub.tsx`
- Modify: `app/genai/page.tsx`

**Interfaces:**
- Consumes: `STAGES`, `nextUp`, `moduleKey` (Task 1); `Bar`, `Count` from `components/ui.tsx`; `ProgressCard`.
- Produces: `<RoadmapHub />` (client).

Behaviour decided here: one header card (title "Gen AI roadmap", one-line blurb, modules done / total with `Count`, Continue button to `nextUp` or first module; when `nextUp` is an unbuilt module the button opens its `old` page or, without one, the module's stage anchor `#stage-<n>`). Then one card per stage, anchored `id="stage-<n>"`: "Stage n" eyebrow, title, blurb, "Builds on" pills, a `Bar` of done/total, and its modules as rows: built modules link to `/genai/<id>` with a done tick; unbuilt ones show the title, a muted "Old version" link to `/genai/<old>` when `old` is set, else a muted "Coming soon" pill. The Next up module gets `.pill-accent` "Next up". Below the stages, keep the existing reference links (Interview prep, System design, Glossary, Resources) as they are now in `app/genai/page.tsx`. Cards enter with `motion` fade-up staggered 0.04 s, skipped under reduced motion.

- [ ] **Step 1: Build `RoadmapHub`** and render it from `app/genai/page.tsx`.
- [ ] **Step 2: Run** `npm run typecheck` and `npm run build`. Expected: pass.
- [ ] **Step 3: Commit** `git commit -m "Gen AI rebuild: roadmap hub"` (with files added).

### Task 4: Gold-standard module: self-attention

**Files:**
- Create: `lib/genai2/modules/self-attention.ts`, `lib/genai2/play.ts` (Gen AI slider walk-throughs), `components/genai2/figures/Qkv.tsx`
- Modify: `lib/genai2/index.ts` (register module, add `"qkv"` to `FIGURE_IDS`), `components/genai2/figures/index.tsx`, `lib/other/flows-play.ts` (spread the new `PLAY` into `PLAY_FLOWS`)

**Interfaces:**
- Consumes: `GModule`, `Block`, `GQuestion` (Task 1); `concept`/`numeric` builders are not reused (different type); existing flows `g-attn`, `g-mask` (`lib/other/flows-genai.ts`); lab kind `attention`; `PlayFlow`, `PlayError` from `lib/other/flows-play-types.ts`.
- Produces: `MODULES["self-attention"]`; `PLAY` in `play.ts` with key `"ga-attn-scale"`.

Content decided here (written fresh, never from the notes):
- Blocks in order: `figure` `qkv` (each token's vector splits into query, key, value; one query line to every key), `text` (what attention answers: which other words matter for this word), `flow` `g-attn`, `play` `ga-attn-scale`, `predict` (if every score is equal, what are the weights? answer: uniform 1/n, computed), `lab` `attention`, `flow` `g-mask`, `compare` (RNN vs attention: path length, parallelism, memory, computed from n = 512 and n = 4096: steps n vs 1, pairs n squared), `code` (`run: true`: NumPy scaled dot-product attention with a causal mask on 4 tokens, printing weights rounded to 2 places), `text` (cost: n squared time and memory, why long context is expensive, pointer to FlashAttention in Stage 9).
- `ga-attn-scale` knobs: `d` (head dimension, 2 to 256, step 2, default 64), `t` (temperature, 0.25 to 4, step 0.25, default 1). `make` builds 5 fixed token vectors from a seeded generator scaled so raw dot products grow with `d`; returns a `bars` flow with three steps: raw softmax without scaling, with `1/sqrt(d)`, with `1/(sqrt(d) * t)`; each note states the largest weight. Throws `PlayError` if any weight is `NaN`.
- `keyPoints`: 5 lines (Q K V roles, score = dot product, scale by sqrt d, softmax rows sum to 1, output is weighted sum of values; mask for decoders).
- `questions`: 16. Levels 5 easy, 7 medium, 4 hard. Kinds: 7 concept, 2 numeric (softmax of `[2, 1, 0]` largest weight, computed with `Math.exp`; attention matrix entries for n = 1024, computed), 2 output (Python NumPy snippets whose printed result the check verifies), 3 explain (why divide by sqrt d; why attention replaced RNNs; what the causal mask does during training vs generation), 2 trap (claim: "softmax over the scores is taken column-wise", false; claim: "self-attention cost grows linearly with sequence length", false).
- `real`: one entry, the 2017 transformer paper (Vaswani et al., "Attention Is All You Need", https://arxiv.org/abs/1706.03762), with only what the paper states.

- [ ] **Step 0: Load the `remotion:remotion-best-practices` skill** (Harsh asked for it for every animation) and follow it for the walk-through and figure work in this task.
- [ ] **Step 1: Extend the check:** for every `output` question, write `code` to a temp file, run `python3 -I` on it, and assert stdout trimmed equals `answer`; for `ga-attn-scale`, run `make` at defaults and on 150 random knob settings and require at least 50 to return a flow (matching the `check:other` rule). Run `npm run check:genai`: FAIL (module missing).
- [ ] **Step 2: Write `self-attention.ts`, `play.ts`, `Qkv.tsx`** as specified and register them.
- [ ] **Step 3: Run** `npm run check:genai`. Expected: PASS, including the module rules and output questions.
- [ ] **Step 4: Run** `npm run check:other`. Expected: PASS (play flow registry still valid).
- [ ] **Step 5: Run** `npm run typecheck` and `npm run build`. Expected: pass; `/genai/self-attention` is a static page.
- [ ] **Step 6: Commit** `git commit -m "Gen AI rebuild: self-attention module"` (with files added).

### Task 5: End-to-end and visual verification

**Files:**
- Modify: `e2e/navigation.spec.ts` (add `/genai/self-attention`), `e2e/ui.spec.ts` (add `{ name: "genai-hub", path: "/genai" }`, `{ name: "genai-attention", path: "/genai/self-attention" }`), `e2e/flows.spec.ts` (add `/genai/self-attention` to the pages it walks, so `ga-attn-scale` sliders are dragged)

- [ ] **Step 1: Add the routes** above.
- [ ] **Step 2: Run** `npx playwright test e2e/navigation.spec.ts e2e/flows.spec.ts`. Expected: PASS.
- [ ] **Step 3: Run** `npm run test:ui -- -g "genai"`. Expected: PASS, no sideways scroll, no console errors, contrast at AA; open the screenshots in `test-results/ui/` for the hub and module at 375px in light and dark and check that visuals lead each section.
- [ ] **Step 4: Run** the cannot-ship greps from Global Constraints. Expected: no new matches.
- [ ] **Step 5: Commit** `git commit -am "Gen AI rebuild: e2e coverage for hub and module"`.

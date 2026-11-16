# Gen AI rebuild, step 4 (all stages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Stage tasks run in parallel, each in its own git worktree, because every stage owns its own files (Task 0 sets that up). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build every remaining module of the 11-stage roadmap (64 modules) to the bar set by `self-attention`, so the new Gen AI section is complete.

**Architecture:** Task 0 splits every registry (modules, built ids, figure ids, figure components, slider walk-throughs, animated flows) into per-stage files that the shared registries spread. After that, one builder per stage edits only its own stage files, so stage branches merge without conflicts.

**Tech Stack:** as step 1, plus Remotion through the existing `FlowPlayer` pipeline (`lib/other/flows.ts` kinds chain, lanes, grid, bars).

**Spec:** `docs/superpowers/specs/2026-11-16-genai-rebuild-design.md`

## Global Constraints

- Everything in the step 1 plan's Global Constraints, and the module rules enforced by `npm run check:genai`.
- Each module copies the shape of `lib/genai2/modules/self-attention.ts`. Read it, and the figure `components/genai2/figures/Qkv.tsx` and the walk-through `ga-attn-scale`, before writing.
- A stage builder edits only: `lib/genai2/stages/s<N>.ts`, `s<N>.built.ts`, `s<N>.play.ts`, `s<N>.flows.ts`, `lib/genai2/modules/s<N>/*`, `components/genai2/figures/s<N>.tsx`, `components/genai2/figures/s<N>/*`. Nothing else. If something shared truly needs a change, the builder writes it in its report instead of making it.
- Ids: module ids come from `lib/genai2/roadmap.ts` (never rename). Question ids are unique within a module. Figure ids, flow ids and play ids are prefixed `s<N>-` so stages never clash.
- The browser never receives module text. Figures, flows and plays import only client-safe files (`lib/genai2/rng.ts`, `lib/other/flows*.ts` types, `lib/other/flows-play-types.ts`).

## Module authoring guide (every module)

1. **Visual first.** The `blocks` array opens with a visual. Every module has:
   - at least one animated walk-through (`flow`), either an existing `g-*` flow from `lib/other/flows-genai.ts` or a new `s<N>-*` flow in `s<N>.flows.ts`;
   - one original SVG `figure`;
   - one `predict` check.
   Add a slider walk-through (`play`), an interactive lab (`lab`, an existing `LabKind`), `mermaid`, `compare` and a runnable NumPy `code` block wherever they explain better than text. Text blocks bridge visuals; each is at most 80 words.
2. **Remotion.** Load `remotion:remotion-best-practices` before writing flows. Flows follow `CLAUDE.md`: computed by code, phone-first, short notes, token tones.
3. **Numbers.** Every number is computed in code (TypeScript at module load, or the flow's own code). Output questions print exactly their answer; the check runs them.
4. **Questions** (12 to 20 per module), placement mix:
   - about 40% concept MCQ, 20% numeric or output, 25% explain (model answer an interviewer accepts), and 15% trap;
   - levels spread easy, medium and hard;
   - distractors are believable mistakes;
   - every `why` teaches;
   - no company names.
5. **Current facts.** Stage 10, `real` entries and any model, tool or year claim need a source URL you checked with web search. Write only what the source says. Use model names only where the source names them.
6. **Reuse.** The old module named in the roadmap entry's `old` field (`lib/genai/content.ts`, `/genai/<old>`) was written for this site and may be condensed. Its labs (`lib/genai/labs.ts` `LABS`) and flows (`FLOW_SLOTS`) should be placed in the matching new modules.
7. **Never** copy text, code or images from outside sources. No em dashes. Short, plain sentences.
8. **Gate.** Before reporting:
   - `npm run check:genai`, `npm run check:other`, `npm run typecheck` and `npm run build` pass;
   - each new page returns 200 under `npm run dev` on the port assigned in the dispatch.

## Review Focus

1. **Wrong answer keys:** an MCQ whose marked answer is wrong or whose distractor is also right. Reviewer re-derives every answer.
2. **Stale or unsourced claims:** a model, benchmark or date with no URL, or a URL that does not say it. Reviewer opens every `real` URL.
3. **Text-heavy modules:** a module that passes the counts but teaches through text with decorative visuals. Reviewer checks that each visual carries a point the text does not repeat.
4. **Phone layout:** a figure or flow wider than 343px, or a table that forces sideways scroll. Builder checks every new page at 375px in the dev server.
5. **Cross-stage clashes:** a stage builder touching another stage's or a shared file. Reviewer checks the diff's file list.

---

### Task 0: Per-stage registries (runs alone, before any stage)

**Files:**
- Create for each N in 0..10:
  - `lib/genai2/stages/s<N>.ts`: server; `export const MODULES_<N>: Record<string, GModule> = {}`.
  - `lib/genai2/stages/s<N>.built.ts`: client-safe; `export const BUILT_<N> = [] as const` and `export const FIGURE_IDS_<N> = [] as const`.
  - `lib/genai2/stages/s<N>.play.ts`: `export const PLAY_<N>: Record<string, PlayFlow> = {}`.
  - `lib/genai2/stages/s<N>.flows.ts`: `export const FLOWS_<N>: Record<string, Flow> = {}`.
  - `components/genai2/figures/s<N>.tsx`: `export const FIGURES_<N> = {} satisfies Record<string, () => React.JSX.Element>`.
- Create aggregators:
  - `lib/genai2/stages/built.ts`: spreads all `BUILT_N` and `FIGURE_IDS_N` into `BUILT` and `FIGURE_IDS`, preserving literal types.
  - `lib/genai2/stages/play.ts`: `GENAI_PLAY`.
  - `lib/genai2/stages/flows.ts`: `GENAI2_FLOWS`.
  - `lib/genai2/stages/modules.ts`: `MODULES`.
- Modify:
  - `lib/genai2/core.ts`: `BUILT` and `FIGURE_IDS` come from `stages/built.ts`.
  - `lib/genai2/index.ts`: `MODULES` comes from `stages/modules.ts`.
  - `components/genai2/figures/index.tsx`: `FIGURES` spreads all `FIGURES_N`, still typed by `FIGURE_IDS`.
  - `lib/other/flows-play.ts`: spreads `GENAI_PLAY` instead of `lib/genai2/play.ts`.
  - `lib/other/flows.ts`: spreads `GENAI2_FLOWS`.
- Move:
  - `lib/genai2/modules/self-attention.ts` to `lib/genai2/modules/s4/self-attention.ts`, registered in `s4.ts` and `s4.built.ts`.
  - `qkv` to `s4-qkv`: the figure moves to `components/genai2/figures/s4/Qkv.tsx`, and the module's block id is updated.
  - `ga-attn-scale` from `lib/genai2/play.ts` into `s4.play.ts` as `s4-attn-scale`. Update the module and `e2e/flows.spec.ts` if it names the id. Delete `lib/genai2/play.ts`.
- Modify `lib/genai2/genai.check.ts`:
  - Its import scan covers `stages/*.built.ts`, `*.play.ts` and `*.flows.ts`, which must never import modules or the index.
  - Every id in `FIGURE_IDS_N`, `PLAY_N` and `FLOWS_N` starts with `s<N>-`.
  - Every module in `MODULES_N` belongs to stage N in the roadmap.

- [ ] **Step 1:** Make the changes. Run `npm run check:genai`, `npm run check:other`, `npm run typecheck`, `npm run build`, and `npx playwright test e2e/flows.spec.ts -g genai`. All must pass.
- [ ] **Step 2:** Commit `"Gen AI rebuild: per-stage registries"`.

### Tasks 1 to 10: one per stage (parallel, each in its own worktree)

Stage order by placement value: 5, 2, 3, then 4 (the rest of the stage), 6, 7, 8, 9, 10, 1, 0. Run at most five at once. Each task builds every module listed for its stage in `lib/genai2/roadmap.ts`, except modules that are already built.

For each stage task:
- [ ] **Step 1:** Read the authoring guide above, `self-attention.ts`, the roadmap entries for stage N and the old module(s) they map to.
- [ ] **Step 2:** For each module, write the module file, its figures, flows and plays, and register them in the stage files.
- [ ] **Step 3:** Run the gate (guide item 8). Check every new page at 375px and 1280px in light and dark with the Playwright screenshot script or the dev server. Fix overflow.
- [ ] **Step 4:** Commit one commit per module: `"Gen AI stage <N>: <module title>"`.
- [ ] **Step 5:** Report per module: the visuals, the question counts by kind and level, the sources used, and any shared change you need.

Each stage is reviewed (spec and quality, with answer keys re-derived) before its branch is merged into the rebuild branch. After merging, run the gate on the merged branch.

Stage 4 also gets a lab link: modules `tokenisation-bpe` and `transformer-block` (or the closest ids in the roadmap) set `lab: "transformer"` once step 2 lands. The controller does this after both are merged.

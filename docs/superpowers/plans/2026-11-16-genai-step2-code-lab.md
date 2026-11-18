# Gen AI rebuild, step 2 (code lab, NumPy grading) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Learners write a transformer from scratch, step by step, and the site grades each step in the browser (NumPy, Pyodide), with PyTorch starters and references ready for the step 3 grader.

**Architecture:** Lab data lives server-side in `lib/genai2/labs/` (like modules). One Python harness, built as a string by `buildProgram`, runs the earlier steps' references, the learner's code and the step's tests, and prints one JSON line per test. The browser runs it in the existing sandboxed Pyodide worker (`components/other/playground/wasm.ts`). `check:genai` runs every reference through the same harness with local `python3` (NumPy and PyTorch) and proves every starter fails.

**Tech Stack:** Next.js 16, TypeScript, Pyodide 0.28.3 (sandboxed worker), Python 3 + NumPy + PyTorch 2.x locally for checks, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-genai-rebuild-design.md` (section "Code labs" and "Decisions after review" item 3)

## Global Constraints

- Everything in the step 1 plan's Global Constraints (tokens, no em dash, Phosphor, spacing, motion, 375px, light and dark, typecheck and build).
- Lab content is server-only: no client component imports `lib/genai2/labs/index.ts`; the page passes one lab as props.
- Steps 1 to 9 of the transformer lab have NumPy and PyTorch versions; step 10 (training step, loss falls) is PyTorch only and shows "Graded once the PyTorch grader is live" with its reference in step 2.
- One test file per step, shared by both frameworks; tests convert with `to_np` and build inputs with `T(x)` (NumPy array or torch tensor by framework).
- Browser time limit for a lab run: 20 s; code size cap 50 KB (refuse larger with a message).
- Progress keys: `genailab:<lab>:<step>` in the patterns store, value `"numpy"` or `"torch"` (the framework that passed; a later pass with the other framework keeps the first).
- Drafts are per-viewer conveniences in localStorage `dsa-genailab:<lab>:<step>:<fw>`, wrapped in try/catch.
- Framework choice remembered in localStorage `dsa-genai-fw2` (default `"numpy"`).
- All text written fresh; never from the course notes.

## Review Focus

1. **Infinite loop or huge allocation in learner code:** the run must stop at 20 s with a readable "Stopped after 20 s" and the page must stay usable. Test: e2e runs `while True: pass` as a step and expects the stop message.
2. **Syntax error in learner code:** shows the traceback line and marks every test failed, not a blank panel. Test: harness check with `def softmax(x) return x` expects `parseResults` to return null and stderr/stdout to contain "SyntaxError".
3. **Learner prints a line that looks like a result:** a `print("@@RESULT ...")` in user code must not count as a pass. Test: harness check where user code prints a fake pass line; the runner uses a per-run random token in the marker.
4. **Wrong shape output:** the failing test message names expected and got shapes. Test: harness check with attention returning `weights` instead of `out`.
5. **Pyodide download fails (offline):** the panel says Python could not load and offers Retry. Test: unit-level, the runner maps a `failed` message to that state (covered in Task 3's component test via the e2e with the CDN blocked by `page.route`).

---

### Task 1: Lab model, harness and checks

**Files:**
- Create: `lib/genai2/labs/types.ts`, `lib/genai2/labs/harness.ts`, `lib/genai2/labs/index.ts`, `lib/genai2/labs/transformer.ts` (steps 1 to 3 only in this task), `lib/genai2/labs/labs.check.ts`
- Modify: `package.json` script `check:genai` to also run `lib/genai2/labs/labs.check.ts` (chain with `&&`)

**Interfaces:**
- Produces (`types.ts`): `type Fw = "numpy" | "torch"`; `type LabStep = { id: string; title: string; goal: string; signature: string; starter: Partial<Record<Fw, string>>; reference: Partial<Record<Fw, string>>; tests: string; hints: string[] }` (a missing `numpy` key means PyTorch only); `type Lab = { id: string; title: string; blurb: string; module: string; steps: LabStep[] }`; `type TestResult = { name: string; pass: boolean; msg: string }`.
- Produces (`harness.ts`, client-safe, no lab imports): `buildProgram(steps: LabStep[], index: number, fw: Fw, userCode: string, token: string): string`; `parseResults(stdout: string, token: string): TestResult[] | null` (null when no result lines, meaning the program crashed before tests ran); `MAX_CODE = 50_000`; `RUN_SECONDS = 20`.
- Produces (`index.ts`, server-only): `LABS: Record<string, Lab>`.

Harness behaviour decided here (Python emitted by `buildProgram`):
- Prelude: `import json, numpy as np`; when `fw === "torch"`, `import torch` and `torch.manual_seed(0)`; helpers `T(x)` (returns `torch.tensor(x, dtype=torch.float32)` for torch, `np.asarray(x, dtype=np.float64)` for numpy) and `to_np(x)` (`x.detach().cpu().numpy()` for tensors, else `np.asarray(x)`); a `@test` decorator that records functions in order.
- Then the reference code of steps `0..index-1` for this framework, then the learner code, then the step's `tests`.
- Runner: for each recorded test, call it; print `@@<token> ` + `json.dumps({"name": fn.__name__, "pass": True/False, "msg": ...})`; an `AssertionError` message becomes `msg`; any other exception becomes `"<ExcType>: <message>"`.
- A learner `SyntaxError` happens before tests run: the runner catches nothing, the browser sees no result lines, and `parseResults` returns null; the UI then shows the traceback and marks the step failed.

- [ ] **Step 1: Write `labs.check.ts`** (Node strip-types, imports with `.ts`): for every lab, step and framework present: write `buildProgram(steps, i, fw, reference[fw], tok)` to a temp file, run `python3 -I`, assert `parseResults` is non-null and every result passes; then with `starter[fw]` assert at least one result fails or `parseResults` is null. Plus the Review Focus checks 2, 3 and 4 above as named cases against step 1 and step 2. Temp dir removed in `finally`. Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON lib/genai2/labs/labs.check.ts`. Expected: FAIL (modules missing).
- [ ] **Step 2: Implement `types.ts`, `harness.ts`, `index.ts`** as specified.
- [ ] **Step 3: Write transformer steps 1 to 3** in `transformer.ts` (lab id `transformer`, title "Build a GPT from scratch", module `self-attention`):
  1. `softmax(x)`: numerically stable along the last axis. Tests: matches a hidden reference on a random (3, 5) input with tolerance 1e-6; rows sum to 1; `softmax([[1000.0, 1001.0]])` has no NaN and equals `[0.2689, 0.7311]` to 4 places; works on a 3-D input.
  2. `attention(q, k, v, mask=None)`: returns `(out, weights)`, scaled by `sqrt(d_k)`, mask positions where `mask` is False get weight 0. Tests: shapes for (2, 4, 8) inputs; weights rows sum to 1; equals hidden reference to 1e-5; with a mask, masked weights are exactly 0; shape-mismatch message names expected and got shapes.
  3. `causal_mask(t)`: boolean (t, t), True on and below the diagonal. Tests: t = 1, t = 4 exact; dtype is bool; count of True is t(t+1)/2 for t = 7.
  Starters contain the signature, a docstring and `raise NotImplementedError`. Torch versions use `torch` ops only.
- [ ] **Step 4: Run** the check. Expected: PASS for steps 1 to 3 in both frameworks, starters fail, focus cases pass.
- [ ] **Step 5: Run** `npm run check:genai` and `npm run typecheck`. Expected: PASS.
- [ ] **Step 6: Commit** `"Gen AI lab: harness, checks and first transformer steps"`.

### Task 2: Transformer lab steps 4 to 10

**Files:** Modify `lib/genai2/labs/transformer.ts`.

**Interfaces:** Consumes Task 1 types and the harness; every step may call the functions of earlier steps (their references run first).

Steps (all with NumPy and PyTorch unless noted; tests compare against hidden references with tolerance 1e-5 using fixed seeds, and check shapes):
4. `multi_head_attention(x, p, n_heads, mask=None)`: `p` has `wq, wk, wv, wo` of shape (d, d); split heads, attend with step 2, merge, project. Tests: shape (2, 5, 16) with 4 heads; equals reference; one head equals plain attention through the projections; `d % n_heads != 0` raises `ValueError`.
5. `layer_norm(x, g, b, eps=1e-5)`: Tests: equals reference; output mean about 0 and variance about 1 per row when `g = 1, b = 0`.
6. `feed_forward(x, p)`: `p` has `w1 (d, 4d), b1, w2 (4d, d), b2`, GELU tanh approximation. Tests: equals reference; GELU(0) = 0.
7. `block(x, p, n_heads)`: pre-norm `x = x + mha(ln1(x), causal)`, `x = x + ffn(ln2(x))`. Tests: equals reference; changing token 3 does not change outputs at positions 0 to 2 (causality).
8. `gpt_forward(idx, p, n_heads)`: token plus position embeddings, `p["blocks"]` list, final layer norm, logits with tied weights `x @ p["wte"].T`. Tests: logits shape (B, T, vocab); equals reference; causality as in step 7.
9. `generate(idx, p, n_heads, n_new)`: greedy, appends the argmax token `n_new` times, crops context to `p["ctx"]`. Tests: output length; equals reference tokens for a fixed model; context crop respected (input longer than `ctx` works).
10. `train_step(model_params, batch, lr)` PyTorch only: one AdamW step on next-token cross-entropy using autograd; the test runs 60 steps on a 200-character corpus with a tiny model (d = 32, 2 layers, 2 heads, ctx 32) and asserts final loss is below 0.6 times the first loss, finishing in under 15 s on one CPU (time it in the check and assert).
- [ ] **Step 1: Add the steps** with starters, references, tests and 2 to 3 hints each (hints reveal the idea, not the code).
- [ ] **Step 2: Run** `npm run check:genai`. Expected: PASS, including step 10 under 15 s locally.
- [ ] **Step 3: Commit** `"Gen AI lab: transformer steps 4 to 10"`.

### Task 3: Lab page and browser runner

**Files:**
- Create: `app/genai/lab/[id]/page.tsx` (server: `generateStaticParams` from `LABS`, passes the lab as props), `components/genai2/lab/LabView.tsx`, `components/genai2/lab/useLabRunner.ts`
- Modify: `components/other/playground/wasm.ts` (optional third argument `limitMs` to `wasmHost`, default unchanged)

**Interfaces:**
- Consumes: `Lab`, `buildProgram`, `parseResults`, `MAX_CODE`, `RUN_SECONDS` (Task 1); `wasmHost`; `Editor` (`components/other/playground/Editor.tsx`, props `value, mode, onChange`, mode `"python"`); `usePatterns`; `Rich`.
- Produces: `useLabRunner(): { state: "idle" | "loading" | "running" | "done" | "failed" | "stopped"; results: TestResult[] | null; output: string; run(program: string, token: string): void }`.

Page behaviour decided here:
- Layout: step list (ticks from the progress key; current step highlighted; on phones a select at the top), then the step panel: title, goal (Rich), signature in `.code`, framework Seg (NumPy / PyTorch), Editor (draft or starter), Run tests (`.btn-primary`), Reset to starter, Hints (revealed one at a time), Show solution (reveals the reference after a confirm-free second click: first click changes the label to "Show it", second reveals).
- Results: one row per test with a pass or fail tick and `msg`; above them "n of m passed". `parseResults` null shows the program output (traceback) in a `.code` block and "Your code did not run to the tests".
- PyTorch: steps can be read, edited and saved, but Run tests shows "PyTorch grading comes online soon" and the reference button; no run. Step 10 shows the same.
- All tests passed: store the progress key, show the reference for comparison, and a "Next step" button.
- Token per run: `crypto.randomUUID()` without dashes.
- Under 375px the editor is full width and at least 280px tall.

- [ ] **Step 1: Build** the runner hook, the page and the view.
- [ ] **Step 2: Run** `npm run typecheck` and `npm run build`. Expected: pass; `/genai/lab/transformer` is static.
- [ ] **Step 3: Manual run** with `npm run dev` (`NEXT_PUBLIC_E2E=1`): paste the step 1 NumPy reference into the editor, Run tests, all pass. Stop the server.
- [ ] **Step 4: Commit** `"Gen AI lab: lab page and in-browser grading"`.

### Task 4: Links, e2e and visual check

**Files:**
- Modify: `lib/genai2/modules/self-attention.ts` (set `lab: "transformer"`), `components/genai2/ModuleView.tsx` (when `lab` is set, a "Build it yourself" card after the key points linking to `/genai/lab/<lab>`, showing the lab title and step count passed as props from the server page), `app/genai/[id]/page.tsx` (pass lab title and step count), `components/genai2/RoadmapHub.tsx` + `app/genai/page.tsx` (a "Code labs" card listing labs: title, blurb, steps, link; data passed from the server page), `e2e/navigation.spec.ts`, `e2e/ui.spec.ts`
- Create: `e2e/genai-lab.spec.ts`

- [ ] **Step 1: Write `e2e/genai-lab.spec.ts`:** (a) open `/genai/lab/transformer`, put the step 1 NumPy reference into the editor (the test imports `LABS` server-side via Node or reads the reference from a fixture file written by the check), Run tests, expect "4 of 4 passed" within 60 s; (b) run `while True: pass` and expect "Stopped after 20 s"; (c) with `page.route("**/pyodide/**", r => r.abort())` expect the could-not-load message and a Retry button.
- [ ] **Step 2: Add** `/genai/lab/transformer` to navigation and UI specs.
- [ ] **Step 3: Run** `npx playwright test e2e/genai-lab.spec.ts e2e/navigation.spec.ts` and `npm run test:ui -- -g "genai"`. Expected: PASS. Open the 375px and 1280px light and dark screenshots of the lab page and judge layout.
- [ ] **Step 4: Commit** `"Gen AI lab: links from module and hub, e2e"`.

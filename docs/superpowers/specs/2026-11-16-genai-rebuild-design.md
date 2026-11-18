# Gen AI section rebuild: design

Date: 2026-11-16. Status: draft for approval.

## Intent

Harsh is preparing for placements (May 2027). The current Gen AI section (`/genai`, 13 modules m0 to m12 plus interview, design, glossary, resources, about 400 KB of HTML in `lib/genai/content.ts`) is deep but reads like a textbook: long slides, 17 labs, 24 animated flows. He wants to understand things quickly by seeing them, keep up with what the industry uses in 2026, practise placement questions in every module, and prove understanding by writing code (a transformer from scratch, a small ChatGPT from scratch) that the site checks.

Source material: his course notes in Google Drive ("Gen Ai" folder, 26 PDFs, modules 4 to 43). They supplied the topic order only. The notes cover Python, NumPy, Pandas, plotting, classical ML, classical NLP, neural nets, RNN/LSTM/GRU/BiRNN, transformers, LLM history and RLHF, LangChain, RAG, agents, Streamlit/FastAPI projects and deployment. Much of their code is outdated (Keras 2, old LangChain imports, 2024 model names). Never copy their text, code or images.

## Goals

1. A systematic roadmap: 11 stages, each a short list of modules with prerequisites, a Next up pointer and progress, like the System Design and CS core roadmaps.
2. Visual first: every module is mostly animations, interactive labs and diagrams, with short text beside them. Text explains what the visual shows, not the other way round.
3. Current: covers what the industry uses now (list under Stage 10 and spread through stages).
4. Questions: every module ends with a placement mix of questions.
5. Code labs: build-from-scratch exercises that you write and the site grades, in NumPy (checked in the browser) and in PyTorch (checked on a Modal sandbox).
6. Highly interactive: sliders, predict-the-next-step, drag to reorder, step-through players.

## Non-goals

- No anti-cheat. Tests and reference solutions may be visible to a determined user; this is self-study.
- No GPU training. Labs use tiny tensors and finish in seconds on CPU.
- No hosted LLM calls from the site (no API keys needed to study).
- TensorFlow labs are not built. The existing PyTorch / TensorFlow switch is dropped with the old content.

## Anti-goals (failure even if it works)

- Walls of text. A module whose visuals are decoration rather than the explanation has failed.
- Text, code or pictures lifted from the course notes or the web.
- Numbers typed by hand. Every number shown is computed in code, as elsewhere on the site.
- Broken at 375px or in light mode. (Code labs are desktop-first but must still work on a phone.)
- Running strangers' code without isolation.

## Constraints

- Everything in `CLAUDE.md`: design tokens only, no em dashes in visible text, Phosphor icons, spacing scale, motion rules with reduced motion, checked at 375px and in light and dark, `typecheck` and `build` pass.
- Static export friendly pages; server-only imports for heavy content, as in `lib/other`.
- Pyodide is about 10 MB on first run and is loaded only when Run is pressed (`components/runPython.ts`).
- Vercel cannot host PyTorch (function size limit), so PyTorch grading runs on Modal.

## Approaches considered

Code checking:
- NumPy in the browser only. Free, instant, offline-safe; but no PyTorch.
- PyTorch on a self-hosted VPS. Fixed cost, sandbox maintenance falls on Harsh.
- **Chosen: NumPy in the browser plus PyTorch on Modal sandboxes.** Same tests for both. Modal isolates each run (gVisor), charges per second, and its free monthly credit covers small CPU tests.
- Local runner only (PyTorch on Harsh's Mac). Rejected: only works for him.

Content:
- Patch the existing HTML modules. Rejected: the format (long slides extracted from HTML) is the thing that makes it text-heavy.
- **Chosen: new typed module data**, like `lib/other`, built from blocks (visual blocks first), reusing existing labs, flows and verified scripts wherever they fit.

## Roadmap (stages and modules)

Module ids are short slugs, unique across the section. Each module lists `needs` (modules to finish first); a check throws if a module needs a later one.

| Stage | Title | Modules | Build from scratch |
|---|---|---|---|
| 0 | Python for AI | arrays and broadcasting; data with pandas; vectorising loops | vectorised softmax and cross-entropy |
| 1 | ML basics for LLMs | learning as fitting; loss and gradient descent; overfitting and evaluation; text as numbers (one-hot, TF-IDF, word2vec) | TF-IDF search |
| 2 | Neural networks | neuron and activations; MLP and the forward pass; backprop on a graph; optimisers (SGD, Adam, AdamW, schedules); making deep nets train (init, normalisation, residuals, dropout) | tiny autograd engine, then an MLP trained on it |
| 3 | Sequences | why order matters; RNN and BPTT; LSTM and GRU; seq2seq and the bottleneck; attention as the fix | character-level RNN |
| 4 | The transformer | tokenisation and BPE; embeddings and positions (sinusoidal, RoPE); self-attention; multi-head and masks; the block (norm, FFN, residual); encoder, decoder, encoder-decoder; decoding (greedy, temperature, top-k, top-p, beam) | BPE tokenizer; transformer from scratch |
| 5 | Training LLMs | pretraining and scaling laws; data pipelines; SFT and chat templates; preference tuning (RLHF, DPO); RL with verifiable rewards (GRPO); LoRA and QLoRA; distillation and small models | tiny GPT: pretrain on a small corpus, then SFT into a chat model ("ChatGPT from scratch") |
| 6 | Using LLMs | API calls, roles and streaming; prompting patterns; structured output; context engineering and caching; local models | JSON schema validator and retry loop |
| 7 | RAG | ingest (parse, chunk, embed); vector search (cosine, ANN, HNSW); hybrid search and reranking; advanced RAG (query rewrite, GraphRAG, agentic RAG); RAG evals | BM25 plus vector search plus RRF fusion |
| 8 | Agents | tool calling; the agent loop and ReAct; state graphs (LangGraph); MCP and A2A; memory; computer and browser use; multi-agent patterns | agent loop with tools and a step limit |
| 9 | Production | where time and memory go; KV cache and paged attention; batching and serving engines; quantisation; speculative decoding; evals and LLM as judge; observability and rollouts; security (prompt injection, guardrails) | KV cache; int8 quantisation |
| 10 | Frontier (2026) | reasoning models and test-time compute; mixture of experts; state space models and hybrids; long context; vision language models; voice and realtime; diffusion and flow matching; video and world models; AI coding agents | flow matching sampler |

Then, outside the stages: Interview prep (top questions), Gen AI system design, Capstone projects, Glossary. These keep their current content, moved into the new format.

Coverage map from the course notes: Python/OOP/NumPy/Pandas/plots fold into Stage 0 (only what LLM work needs; the Syntax page already has a "Python for Gen AI" track); classical ML and NLP into Stage 1; DL modules into Stage 2; RNN/LSTM/GRU/BiRNN into Stage 3; transformers and LLM history into Stages 4 and 5; LangChain, LCEL, retrievers, RAG apps into Stages 6 and 7; tools and agents into Stage 8; FastAPI, Streamlit and deployment into Stage 9.

## Module page

A module is typed data in `lib/genai2/<stage>.ts` (folder name is the builder's call). Shape:

```ts
type GModule = {
  id: string; stage: number; title: string; needs: string[];
  hook: string;            // one sentence: why this matters
  blocks: Block[];         // the lesson, visual first
  keyPoints: string[];     // 3 to 6 lines for revision
  questions: GQuestion[];  // placement mix
  lab?: string;            // id of a code lab
  real?: Real[];           // "In the industry": who uses it, sourced
};
type Block =
  | { kind: "flow"; id: string }        // Remotion walk-through (FlowPlayer)
  | { kind: "play"; id: string }        // slider walk-through (FlowLab)
  | { kind: "lab"; id: LabKind }        // motion/react interactive (components/labs)
  | { kind: "figure"; id: string }      // original SVG diagram component
  | { kind: "mermaid"; src: string }
  | { kind: "text"; md: string }        // Rich markup, at most about 80 words
  | { kind: "compare"; table: Table }
  | { kind: "code"; lang: "python"; src: string; run?: boolean }
  | { kind: "predict"; ... };           // "what happens next" check inside the lesson
```

Rule enforced by a check: a module has at least 3 visual blocks (flow, play, lab, figure, mermaid) and no text block over the word limit; visual blocks outnumber text blocks.

"Photos": original diagrams and animations only. Remotion walk-throughs follow the `remotion-best-practices` skill and the existing FlowPlayer / FlowScene pipeline (token colours, phone first, numbers from code).

## Questions

Each module has 12 to 20 questions, tagged by level (easy, medium, hard) and kind:
- MCQ concept and numeric (reuse `concept` / `numeric` / `output` builders from `lib/other/oa/make.ts`; numbers computed in code; 4 distinct options, no "of the above").
- Output: "what does this NumPy / PyTorch snippet print", verified by running it in the check.
- Explain: an interview question with a model answer behind a reveal and an "I can answer" tick.
- Trap: a common wrong belief to spot.
- Code: a link to a lab step.
Target mix per module: about 40% concept MCQ, 20% numeric or output, 25% explain, 15% trap or code. No company names on questions.

A Gen AI practice mode reuses the OA round logic (`oaRound`): 10 from one stage, or a mixed timed test; misses come back first.

## Code labs

A lab is a sequence of steps that build one thing. Example, transformer from scratch: softmax, scaled dot-product attention, causal mask, multi-head attention, layer norm, feed-forward, block, GPT forward pass, one training step (loss goes down), generation. Example, ChatGPT from scratch: tokenizer, dataset batching, GPT model, pretraining loop on a tiny corpus, chat template, SFT on a few dozen dialogues, sampling a reply.

```ts
type Lab = { id: string; title: string; steps: LabStep[] };
type LabStep = {
  id: string; title: string; goal: string;       // what to implement, with a visual
  starter: { numpy: string; torch: string };     // function signatures plus TODOs
  tests: string;                                  // Python; same file for both frameworks
  reference: { numpy: string; torch: string };    // shown after a pass, or on "show solution"
  hints: string[];
};
```

Grading protocol: one Python harness (shared by both runners) runs the user code plus all earlier steps' reference code in a fresh namespace, then runs the tests (deterministic seeds, tolerance compares against the reference) and prints one JSON line per test: name, pass, message. The page shows each test as pass or fail with the message and, for shape errors, expected and got shapes.

- NumPy: runs in the browser with Pyodide (extend `components/runPython.ts`), with a time limit (worker terminated after 20 s, like `wasm.ts`).
- PyTorch: `POST /api/genai/grade` with `{ lab, step, code }`.
  - Checks the Supabase session; signed-out users get a sign-in prompt. E2E mode uses a fake runner.
  - Rate limit per user (for example 30 runs per 10 minutes and 300 per day), counted in a new Supabase table through an RPC, own rows only.
  - Sends the code, harness and tests to a Modal web endpoint authenticated with a secret shared only with the server route.
  - The Modal function starts a `modal.Sandbox` from an image with Python 3.12, CPU PyTorch and NumPy, with no network, 20 s timeout, about 1 GB memory, 1 CPU, and returns the JSON lines.
  - Code size capped (for example 50 KB). Errors return a readable message, never a stack from the server.
- Editor: reuse the playground editor (`components/other/playground/Editor.tsx`).
- Progress: a passed step is stored as `genailab:<lab>:<step>` in the patterns store, with the framework that passed.
- `npm run check:genai` (new): runs every reference solution against its tests in NumPy and in PyTorch locally (needs `torch` installed), validates module data (needs order, visual block rule, question rules), and runs every output question.

Labs planned: vectorised softmax (0), TF-IDF search (1), autograd engine and MLP (2), char RNN (3), BPE tokenizer and transformer (4), tiny GPT pretrain plus SFT (5), JSON schema retry (6), BM25 + vectors + RRF (7), agent loop (8), KV cache and int8 quantisation (9), flow matching sampler (10).

## Progress and routes

- `/genai`: roadmap hub, stages 0 to 10 with progress bars, "Builds on" tags and a Next up pill (same pattern as `OtherHub`).
- `/genai/[id]`: module page. Old ids (`m0` to `m12`, `start`, `interview`, `design`, `glossary`, `resources`) redirect to their nearest new module or page.
- `/genai/lab/[id]`: code lab.
- `/genai/practice`: question rounds.
- Ticks in the patterns store: `genai2:<module>` done, `genaiq:<module>:<q>` "I can answer", `genailab:<lab>:<step>` passed. Old `genai:<id>` ticks are left alone and not shown.
- The revision sheet (`lib/revise`) and search pick up the new modules.

## Build order

The work is several projects. Agreed order (each ends shippable):
1. Foundation: data model, roadmap hub, module page with every block kind, questions UI, redirects, `check:genai` data checks; one complete gold-standard module (Stage 4, self-attention) to set the bar.
2. Code lab with NumPy grading in the browser; transformer-from-scratch lab.
3. Modal PyTorch grader (Modal app, API route, rate limit table, sandbox), both frameworks on the transformer lab.
4. Stages one by one (4, 5, 2, 3, 6, 7, 8, 9, 10, 1, 0, in that order of placement value), each with its flows, questions and lab, including the tiny GPT pretrain plus SFT lab.
5. Interview, design, capstone, glossary moved over; old `lib/genai/content.ts`, `tools/genai_*` pipeline and unused labs removed.

## Decisions after review (builder's calls, open to correction)

1. **One module = one semicolon item** in the roadmap table: about 65 modules. Plans detail build steps 1 to 3; each later stage gets its own plan when it starts. If time runs short before May 2027, stages ship in the order listed in step 4 and the rest stay on the old pages.
2. **During the build**, `/genai` is the new roadmap hub. A stage that is not built yet shows its modules as "Old version" links to the existing pages, which stay at their current URLs with their old ticks. An old id redirects only once its replacement ships. Step 5 removes the old pages.
3. **Frameworks per lab.** Forward-pass steps (softmax, attention, masks, MHA, norm, FFN, block, GPT forward, generation with given weights, BPE, TF-IDF, BM25/RRF, KV cache, quantisation) have both NumPy and PyTorch versions. Training steps need autograd, so they are **PyTorch only**: the training step of the transformer lab, the whole tiny GPT pretrain plus SFT lab, char RNN training, and flow matching training. The Stage 2 autograd lab is NumPy only (building autograd is the point) and trains on a tiny dataset that fits Pyodide. Every training run is sized to finish in under 15 s on 1 CPU (tiny model, a few kB of text, a few hundred steps); the test checks that loss falls below a threshold. One test file per step: tests convert results with a `to_np` helper (`x.detach().cpu().numpy()` for tensors, `np.asarray` otherwise). Stage 0 uses NumPy only; pandas appears in visuals and questions, not graded labs.
4. **PyTorch grading is not blocking.** If Modal credentials are not ready at step 3, the content stages go ahead and PyTorch steps show "Grader coming soon" with the reference solution. The Supabase migration for the rate-limit table is applied with the Supabase tools after Harsh approves it at that time.
5. **Interview, system design, capstone and glossary** are exempt from the visual-block and question-count rules. They move into typed data (the HTML is not kept), the interview page's questions become explain-kind questions with "I can answer" ticks, and design gets its existing diagrams.
6. **Current facts** come from web research with a source URL on every `real` entry and every frontier claim, as the `real` rule in `CLAUDE.md` already requires. Model names appear only where the source names them; otherwise the text stays generic.
7. **Existing assets.** The old Gen AI text was written for this site, so it may be condensed and reused. The 17 labs, 24 flows and the verified scripts in `tools/genai_deep` move to the matching modules where they fit. The PyTorch code blocks become lab references or code blocks; the TensorFlow versions are retired.
8. **Practice scores** are stored as `genaitest:<start ms>` with `{s, n}`, and misses as `genaiq-miss:<module>:<q>`. Search and the revision sheet pick up each stage when it ships.

## Left to the builder

File and folder names, component split, exact rate limits and sandbox sizes, which existing labs and flows move to which module, word limits per text block, the visual design of the hub and lab pages within the design system, question counts within the range.

## Needs from Harsh

- A Modal account, with the deployed endpoint URL and a shared secret added to Vercel env vars (step 3).
- Approval of this document.

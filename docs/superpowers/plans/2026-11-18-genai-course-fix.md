# Gen AI course fix pass and visualizers

The user wants one systematic Gen AI course. Every module should be complete and follow its prerequisites, with nothing repeated and nothing useless. ML and NN topics should be clear from diagrams without reading.

Work happens on branch `claude/google-drive-access-6e63ab`, one agent at a time and directly in the branch worktree. The authoring guide is `docs/superpowers/plans/2026-11-16-genai-step4-stages.md`. The Python env is `/Users/harsh/.venvs/ml`, so put `PATH=/Users/harsh/.venvs/ml/bin:$PATH` first for every gate.

The 2026-11-18 audit found 106 issues: 31 prerequisite gaps, 30 repeats, 10 filler, 21 incomplete and 14 course flow. The audit files were lost when the scratchpad was wiped. The fixer for each remaining group therefore re-audits its own stages before fixing them.

## Rulings
1. **Links.** `[[module-id]]` and `[[module-id|label]]` render as links to `/genai/<id>`. `check:genai` checks the ids, and requires the word "later" or "next" near a forward link. Prefer backward "Builds on [[x]]" links, built from what the module uses.
2. **Moves.** Module ids never change.
   - `evals-judge` sits at the end of stage 6.
   - `security-guardrails` sits in stage 8 after `tool-calling`.
3. **Stage 6** is `builds: [4, 5]`. Stage blurbs promise only what each stage teaches. Stage 8 promises planning, so add a short planning block to `agent-loop-react`.
4. **KV cache** is introduced in stage 4 `decoding`. `kv-cache-paged` covers paging and prefix sharing only, links back, and drops its repeat of `g-kv` and the KV formula.
5. **long-context** loses what repeats RoPE, GQA, KV size and lost in the middle. Each cut is replaced by a backward link, and only the new material stays.
6. **Repeats.** Keep the deeper teaching in the earlier module, or in the natural home. Elsewhere, use a one-line link and replace near-duplicate questions.
7. **Missing topics**, folded into existing modules:
   - Hallucination goes in `prompting-patterns`, linked from `rag-ingest` and `rag-evals`.
   - Embeddings get a new stage 7 module, `embedding-models`, between `rag-ingest` and `vector-search`. It covers contrastive or InfoNCE training, pooling, normalisation, dimension trade-off (Matryoshka) and benchmarks. Move the embedding paragraph out of `rag-ingest` into it.
   - Generation metrics go in `evals-judge`: perplexity, BLEU and ROUGE, exact match and F1, pass@k, benchmark contamination.
   - Number formats and parallelism go in `pretraining-scaling`: fp16, bf16, fp8, mixed precision, data, tensor and pipeline parallelism, ZeRO and FSDP, activation checkpointing. Perplexity is defined there too.
   - Policy gradient and PPO are defined in `preference-tuning`.
   - Cost of attention goes in `time-memory`, which links back to `self-attention`.
   - Fine-tune vs RAG vs prompt: one decision table in `rag-ingest`.
8. **Authoring rules** for every new block and question:
   - Numbers are computed in code. Text blocks stay at 80 words or fewer.
   - Facts about a model, tool or year need a source URL that was fetched.
   - No em dashes and no copied text.
   - Each module has 12 to 20 questions with the placement mix.
   - Figures are at most 343px wide.
9. **Gate:**
   - `check:genai`, `typecheck` and `check:other` pass.
   - Changed pages return 200 under `NEXT_PUBLIC_E2E=1 npx next dev`, with no sideways scroll at 375px.
   - Skip `npm run build` and never run `next upgrade`.
   - Commit with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and do not push. Never commit `.superpowers/`.

## Visualizers (user request)
- **V-a.** Every module in stages 1, 2 and 3 gets one interactive diagram visualizer as its first or second block, driven by step, slider or click.
  - The structure changes on screen: a tree grows, activations flow, a kernel slides, gates open and close.
  - Values come from real code in `s<N>.calc.ts`, and the caption says what to try in one line.
  - Where a module already has such a visualizer, improve it instead of adding another.
- **V-b.** Two new stage 1 modules go after `overfitting-evaluation`:
  - `decision-trees`, "Decision trees and ensembles": Gini and entropy, best split, depth and overfitting, random forest, boosting.
  - `classic-models`, "Classic models (logistic regression, k-NN, SVM, k-means, PCA)".
  Each model family gets its own visualizer.
- **V-c.** A new stage 2 module, `cnn`, "Convolutional networks (convolution, pooling, feature maps)", goes after `mlp-forward`. A kernel slides over a small image and produces the computed feature map.
- **V-d.** The ANN or MLP, unrolled RNN, LSTM and GRU cells, and seq2seq each get a step-through that shows the data moving.
- **V-e. Remotion.**
  - Animated visualizers use the existing `@remotion/player` pipeline: `components/other/FlowPlayer.tsx` and `FlowScene.tsx`, flows in `s<N>.flows.ts`, plays in `s<N>.play.ts`.
  - Read the remotion-markup reference in the remotion-best-practices skill before writing.
  - Drive animation from `useCurrentFrame()` with `interpolate` or `spring`, and keep it deterministic.
  - Where the four flow kinds (chain, lanes, grid, bars) cannot draw what is needed, such as a tree, a network graph or a conv grid, add a small client-safe, token-coloured Remotion scene next to FlowScene, and report it.

## Status
- [x] A, links and moves: 834a76b
- [x] Stages 0 to 2: 1406405. Adds the `torch: true` flag for PyTorch code blocks, KL, ROC-AUC, bytes per parameter and PyTorch autograd.
- [x] Stages 3 and 4: 9f9fc0a. Adds the KV cache in decoding, cost of attention, FlashAttention and PyTorch attention, and drops the transformer-block repeats.
- [x] V1: stage 1 visualizers, plus `decision-trees` and `classic-models`: 7bc21d7 to the "Text as numbers" commit (six commits). Adds the `scene` flow kind (`components/other/FlowShapes.tsx`, typed in `lib/other/flows.ts`) for trees, scatter plots, regions and curves; shapes keep their id between steps and glide.
- [x] V2: stage 2 visualizers, plus `cnn` (network forward and backward scenes, kernel slide with pooling, receptive field figure, CNN shapes flow)
- [x] V3: stage 3 visualizers (unrolled RNN with the pulse fading, LSTM cell with live gates; seq2seq keeps its lanes flow, GRU its gate slider)
- [x] Stages 5 and 6: 3dbc59f (ZeRO memory slider, formats and parallelism, PPO, hallucination, generation metrics; evals-judge no longer assumes RAG). Done by the main agent, no subagents.
- [x] Stages 7 and 8: new `embedding-models` (contrastive training scene, InfoNCE flow, pooling figure, index-size slider, MTEB and Matryoshka sources fetched), fine-tune vs RAG vs prompt table in `rag-ingest`, planning block in `agent-loop-react`.
- [x] Stages 9 and 10: `kv-cache-paged` links back to `decoding` instead of repeating it, `time-memory` links the attention cost, `long-context` loses its GQA and lost-in-the-middle repeats. All six unfetched stage 9 arXiv sources (LLM.int8, GPTQ, AWQ, speculative sampling, MT-Bench, indirect prompt injection) were fetched; each says what its entry claims.
- [ ] Final read-through of all modules, and every check.

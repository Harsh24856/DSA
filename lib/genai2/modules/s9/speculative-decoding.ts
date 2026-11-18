// Stage 9: speculative decoding, several tokens per expensive step with the same output. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { bestK, specCost, specSpeedup, specTokens } from "../../stages/s9.calc.ts";
import { SPEC_ROUNDS } from "../../stages/s9.flows.ts";

const f2 = (x: number) => x.toFixed(2);
// predict and the classic example
const [A, K, C] = [0.8, 4, 0.05], E = specTokens(A, K), S = specSpeedup(A, K, C);
// numeric: low acceptance
const [LA, LK, LC] = [0.4, 6, 0.15], lowS = specSpeedup(LA, LK, LC);
// numeric: best k
const [BA, BC] = [0.7, 0.1], bk = bestK(BA, BC), bS = specSpeedup(BA, bk, BC);
// flow totals
const flowTokens = SPEC_ROUNDS.accepted.reduce((a, n) => a + n + 1, 0);
// output: expected tokens per pass
const [OA, OK] = [0.5, 3], oE = specTokens(OA, OK);

export const SPECULATIVE_DECODING: GModule = {
  id: "speculative-decoding",
  stage: 9,
  title: "Speculative decoding",
  hook: "A large model spends each decode step mostly waiting for its weights to arrive. If a cheap model guesses the next few tokens, the large one can check them all in that same wait, and the text comes out exactly as it would have anyway.",
  blocks: [
    { kind: "figure", id: "s9-spec-tokens", caption: "One step: the draft guesses four tokens, the large model checks them together, keeps the run up to the first miss and adds one token of its own." },
    { kind: "flow", id: "s9-spec-rounds" },
    {
      kind: "predict",
      q: `Each drafted token is accepted with chance ${A}, and the draft writes ${K}. On average, how many tokens does one large-model pass produce?`,
      answer: f2(E), wrong: [f2(K * A), f2(K + 1), f2(K * A + 1)],
      why: `The run stops at the first rejection, and the large model always adds one token. The average is 1 + ${A} + ${A}² + ... + ${A}^${K} = (1 - ${A}^${K + 1}) / (1 - ${A}) = ${f2(E)}. ${K} × ${A} ignores that one miss throws away everything after it.`,
    },
    { kind: "text", md: `**Why checking is cheap.** Decode is memory bound: one step reads every weight to make one token. Scoring ${K + 1} positions in one pass reads the same weights once, so it costs about the same as one normal step.\n\n**Why the output is unchanged.** A guess is kept with a rule based on both models' probabilities. When it is rejected, the large model samples a replacement from a corrected distribution. The result follows the large model's distribution exactly.` },
    { kind: "lab", id: "speculative" },
    { kind: "play", id: "s9-spec" },
    {
      kind: "compare",
      head: ["Where guesses come from", "How", "Trade-off"],
      rows: [
        ["A small draft model", "Same tokenizer, much smaller, runs first", "Must be kept and served next to the large one"],
        ["Extra heads on the large model", "Small layers trained to predict several tokens ahead", "Needs training; no second model"],
        ["Matching text already seen", "Copy the next tokens from the prompt where they repeat (n-gram lookup)", "Free; works for edits, code and quoting"],
      ],
    },
    { kind: "text", md: `**When it stops helping.** The gain relies on idle compute during a memory-bound step. On a busy server, big batches already keep the GPU near its compute limit, so checking extra positions is no longer free and the speedup shrinks. Low acceptance hurts too: at ${LA} acceptance, ${LK} guesses and a draft cost of ${LC}, the speedup is ${f2(lowS)}.` },
    {
      kind: "code",
      run: true,
      src: `import random
random.seed(0)
a, k, c = ${A}, ${K}, ${C}          # acceptance chance, draft length, draft cost per step

def one_pass():
    kept = 0
    while kept < k and random.random() < a:
        kept += 1
    return kept + 1                  # the large model always adds one token

passes = 100_000
tokens = sum(one_pass() for _ in range(passes)) / passes
formula = (1 - a ** (k + 1)) / (1 - a)
print(f"simulated {tokens:.2f} tokens a pass, formula {formula:.2f}")
print(f"speedup {formula / (k * c + 1):.2f}x")
assert abs(tokens - formula) < 0.02
`,
    },
  ],
  keyPoints: [
    "A cheap source guesses k tokens; the large model checks them all in one pass and keeps the run up to the first rejection, plus one token of its own.",
    "With acceptance chance a, a pass yields (1 - a^(k+1)) / (1 - a) tokens on average; the speedup divides that by the pass cost, k × draft cost + 1.",
    "A rejection rule based on both models' probabilities keeps the output distribution exactly the large model's.",
    "It pays most at small batch sizes, where decode is memory bound and checking extra positions is nearly free; at large batches the gain shrinks.",
    "Guesses can come from a small draft model, extra prediction heads, or text already in the prompt.",
  ],
  questions: [
    { id: "same-output", level: "easy", kind: "concept",
      q: "Does speculative decoding change what the large model would generate?",
      answer: "No: the accept and resample rule keeps its output distribution exactly",
      wrong: ["Yes: the draft model's style leaks into the answer", "Yes, unless temperature is 0", "Only the first token is guaranteed to match"],
      why: "Accepted guesses are ones the large model agrees with by its own probabilities, and rejected ones are replaced by sampling from a corrected distribution. The draft only changes speed." },
    { id: "why-free", level: "easy", kind: "concept",
      q: "Why can the large model check several guessed tokens for about the cost of one step?",
      answer: "The step is limited by reading the weights, and one read serves all the positions",
      wrong: ["Checking skips the attention layers", "The guesses are checked by the draft model", "The large model runs at lower precision while checking"],
      why: "In memory-bound decode the cores mostly wait. Scoring a few extra positions uses that idle compute while the weights stream in once." },
    { id: "reject-after", level: "medium", kind: "concept",
      q: "The large model rejects guess 2 of 4. What happens to guesses 3 and 4?",
      answer: "They are thrown away, because they were written after a wrong token",
      wrong: ["They are kept if the large model agrees with them", "They are checked again in the next pass as they are", "They replace guess 2"],
      why: "Each guess depends on the ones before it. Once guess 2 is replaced, guesses 3 and 4 continue a text that no longer exists." },
    { id: "busy-server", level: "medium", kind: "concept",
      q: "Speculative decoding gives a big speedup on your laptop at batch 1 but little on a busy server. Why?",
      answer: "Large batches already keep the GPU busy, so checking extra positions is no longer free",
      wrong: ["Servers cannot run two models", "The draft model is slower on servers", "Acceptance falls when there are many users"],
      why: "At batch 1, decode wastes compute waiting on memory. With a large batch the compute is in use, so the extra positions cost real time and the gain shrinks." },
    { id: "draft-need", level: "medium", kind: "concept",
      q: "What must a draft model share with the large model?",
      answer: "The tokenizer, so its guesses are the same tokens the large model scores",
      wrong: ["The same number of layers", "The same weights", "The same training data, exactly"],
      why: "Guesses are checked token by token. A draft with a different vocabulary would propose tokens the large model cannot score directly." },
    { id: "ngram", level: "hard", kind: "concept",
      q: "For which task does guessing by copying from the prompt (n-gram lookup) work best?",
      answer: "Editing a long document, where most of the output repeats the input",
      wrong: ["Writing a new poem", "Translating into a new language", "Answering a short trivia question"],
      why: "When the answer repeats long stretches of the prompt, the next tokens are often right there. No draft model is needed, and acceptance is high on the copied parts." },
    { id: "low-accept", level: "medium", kind: "numeric",
      q: `Acceptance ${LA}, draft length ${LK}, each draft step costs ${LC} of a large step. What is the speedup?`,
      answer: f2(lowS), wrong: [f2(specTokens(LA, LK)), f2(LK * LA), f2(lowS * 2)],
      why: `Tokens a pass: (1 - ${LA}^${LK + 1}) / (1 - ${LA}) = ${f2(specTokens(LA, LK))}. Cost: ${LK} × ${LC} + 1 = ${f2(specCost(LK, LC))}. Speedup ${f2(lowS)}: a weak draft can make things slower.` },
    { id: "best-k", level: "hard", kind: "numeric",
      q: `Acceptance ${BA}, draft cost ${BC} per step. Which draft length k (1 to 12) gives the best speedup?`,
      answer: String(bk), wrong: [String(bk + 4), "12", String(bk - 2)],
      why: `Speedup ${f2(bS)} at k = ${bk}. Longer drafts add cost every step, but each extra guess is less likely to survive: the chance that guess i is kept is ${BA}^i. Past the best k, the cost grows faster than the tokens.` },
    { id: "classic", level: "easy", kind: "numeric",
      q: `Acceptance ${A}, ${K} guesses, draft cost ${C}. About what speedup do you get?`,
      answer: `${S.toFixed(1)} times`, wrong: [`${E.toFixed(1)} times`, `${K} times`, `${(1 / (1 - A)).toFixed(1)} times`],
      why: `${f2(E)} tokens per pass, at a cost of ${K} × ${C} + 1 = ${f2(specCost(K, C))} passes: ${f2(E)} / ${f2(specCost(K, C))} = ${f2(S)}.` },
    { id: "e-out", level: "medium", kind: "output",
      q: "Expected tokens per large pass. What does this print?",
      code: `a, k = ${OA}, ${OK}\nprint(round((1 - a ** (k + 1)) / (1 - a), 3))`,
      answer: String(Math.round(oE * 1000) / 1000), wrong: [String(OA * OK), String(OK + 1), String(Math.round((oE - 1) * 1000) / 1000)],
      why: `1 + ${OA} + ${OA}² + ${OA}³ = ${oE}. Even at a coin-flip acceptance, a pass yields almost 2 tokens.` },
    { id: "explain-how", level: "medium", kind: "explain",
      q: "Explain speculative decoding and why it does not change the output.",
      answer: `A cheap draft proposes k tokens. The large model scores all k in one forward pass, which costs about one normal step because decode is memory bound.\n\nGoing left to right, each guess is kept with a chance based on the two models' probabilities. At the first rejection, the large model samples a replacement from a corrected distribution and the rest is dropped. If all are kept, it adds one more token.\n\nThe rule makes every output token follow the large model's distribution, so you get several tokens per expensive pass (${flowTokens} tokens in ${SPEC_ROUNDS.accepted.length} passes in the walk-through) with no change in quality.` },
    { id: "explain-when", level: "hard", kind: "explain",
      q: "Would you turn on speculative decoding for a high-traffic chat service? How would you decide?",
      answer: "Measure, do not assume.\n\n- It helps most when per-user latency matters and batches are small or the GPU is memory bound.\n- At high load with large batches, the spare compute is gone and the gain may vanish or turn negative.\n- Acceptance depends on the traffic: code and edits accept more, creative text less.\n- A draft model costs memory that could hold KV cache for more users.\n\nLoad test with real traffic at several batch sizes, track TPOT, throughput and acceptance rate, and enable it where it wins." },
    { id: "explain-distill", level: "medium", kind: "explain",
      q: "How is speculative decoding different from distilling a small model and serving it instead?",
      answer: "Speculative decoding keeps the large model's exact output; the small model only proposes, and the large one has the final word. It saves time, not compute or memory.\n\nDistillation replaces the large model with a small student trained on its outputs. It is much cheaper to run but its answers can differ, so you must prove on evals that quality holds, and keep a fallback for hard cases." },
    { id: "trap-quality", level: "easy", kind: "trap",
      claim: "Speculative decoding trades a little answer quality for speed.",
      truth: false,
      why: "The accept and resample rule keeps the large model's output distribution exactly. Only the speed changes, up or down." },
    { id: "trap-slower", level: "medium", kind: "trap",
      claim: "With a poor draft model, speculative decoding can be slower than plain decoding.",
      truth: true,
      why: `Each pass pays for the draft steps whether or not the guesses survive. At acceptance ${LA}, ${LK} guesses and a draft cost of ${LC}, the speedup is ${f2(lowS)}.` },
  ],
  real: [
    { who: "Yaniv Leviathan, Matan Kalman and Yossi Matias", when: "2022",
      what: "Their paper on speculative decoding reports 2 to 3 times faster inference for T5-XXL than the standard T5X implementation, with identical outputs, on existing models with no retraining or change of architecture.",
      takeaway: "Speed can come from scheduling the same model better, not from a different model.",
      url: "https://arxiv.org/abs/2211.17192" },
    { who: "Charlie Chen and co-authors", when: "2023",
      what: "Speculative sampling with a modified rejection sampling scheme gave a 2 to 2.5 times decoding speedup for Chinchilla, a 70B model, in a distributed setup, while preserving the target model's distribution within hardware numerics.",
      takeaway: "The same idea, found independently, worked at 70B scale.",
      url: "https://arxiv.org/abs/2302.01318" },
  ],
};

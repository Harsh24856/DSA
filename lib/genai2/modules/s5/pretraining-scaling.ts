// Stage 5: Pretraining and scaling laws. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { big, sci, trainMem } from "../../stages/s5.play.ts";

const r2 = (x: number) => x.toFixed(2);
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const flops = (N: number, D: number) => 6 * N * D;

// predict: double the compute, split it the compute-optimal way
const grow = Math.SQRT2;
// compare: three sizes at 20 tokens per parameter
const SIZES = [1e9, 8e9, 70e9];
// numeric: 6ND for 7B on 2T tokens; GPU-days at an assumed 1.6e14 FLOP/s per GPU
const [N7, D2] = [7e9, 2e12], C7 = flops(N7, D2), GPU = 400e12 * 0.4, gpuDays = C7 / GPU / 86400, CLUSTER = 256;
// numeric: loss of a uniform guess over the vocabulary, and perplexity at loss 2
const V = 50_000, initLoss = Math.log(V), PL = 2, ppl = Math.exp(PL);
// numeric: a power law with exponent 0.05, 10x more compute
const EXP = 0.05, drop = 1 - 10 ** -EXP;
// output: inputs and targets are the same tokens shifted by one
const TOK = [5, 9, 2, 7];
// trap: doubling N at fixed D doubles 6ND
const twice = flops(2 * N7, D2) / flops(N7, D2);
// numeric: mixed-precision Adam memory per GPU, plain data parallel and ZeRO stage 3
const gb = (m: { w: number; g: number; o: number }) => (m.w + m.g + m.o) / 1e9;
const MEM7 = gb(trainMem(N7, 8, 0)), [ZB, ZN] = [70e9, 64], MEMZ3 = gb(trainMem(ZB, ZN, 3));

export const PRETRAINING_SCALING: GModule = {
  id: "pretraining-scaling",
  stage: 5,
  title: "Pretraining and scaling laws",
  hook: "Feed a network trillions of words and ask it, again and again, what comes next. Bigger models and more data lower the loss in a way you can predict before you spend the money.",
  blocks: [
    { kind: "figure", id: "s5-scaling", caption: "Each grey curve is one model size trained on more and more data. Every size flattens out. The dashed line is the best loss each budget can buy, and it moves to bigger models as the budget grows." },
    { kind: "text", md: "**Pretraining** is one task at huge scale: predict the next token of real text. No labels are needed, because the text is its own answer key.\n\nTo predict well, the model has to pick up grammar, facts, code and some reasoning. The result is a **base model**. It continues text; it does not yet follow instructions." },
    { kind: "flow", id: "s5-next-token" },
    {
      kind: "predict",
      q: "Your compute budget doubles. On the compute-optimal path, how should parameters N and tokens D change?",
      answer: `Both grow by about ${r2(grow)}x`,
      wrong: ["N doubles, D stays the same", "D doubles, N stays the same", "Both double"],
      why: `Compute is C = 6ND, and the Chinchilla result is to scale N and D equally. If both grow by k, C grows by k², so k = sqrt(2) = ${r2(grow)}. Doubling both would need 4 times the compute.`,
    },
    { kind: "play", id: "s5-compute-budget" },
    { kind: "text", md: "**Fitting training into memory.** Weights and gradients are kept in a 2-byte format. **bf16** keeps fp32's 8 exponent bits, so it covers the same range with fewer digits; **fp16** has more digits but overflows sooner and needs loss scaling. Newer GPUs also train parts in 1-byte **fp8**. Adam adds an fp32 copy of the weights plus two moments: 16 bytes per parameter in all, before activations." },
    { kind: "play", id: "s5-train-memory" },
    {
      kind: "compare",
      head: ["Split", "Each GPU holds", "Talks", "Use when"],
      rows: [
        ["Data parallel", "the whole model, its own slice of the batch", "gradients once a step", "the model fits on one GPU"],
        ["ZeRO / FSDP", "a shard of weights, gradients and Adam state", "gathers weights layer by layer", "the model state does not fit"],
        ["Tensor parallel", "a slice of every big matrix", "inside every layer, so fast links", "one layer is too big or too slow"],
        ["Pipeline parallel", "a block of whole layers", "activations between stages", "many layers, many machines"],
      ],
    },
    { kind: "text", md: "**Activation checkpointing** keeps only some layer outputs in the forward pass and recomputes the rest during the backward pass: about a third more compute for much less memory. Big runs combine all of these." },
    {
      kind: "compare",
      head: ["Params", "Tokens at 20 / param", "Compute, 6ND"],
      rows: SIZES.map((N) => [big(N), big(20 * N), `${sci(flops(N, 20 * N))} FLOPs`]),
    },
    {
      kind: "mermaid",
      caption: "The road through this stage. Pretraining makes the base model; every later step reshapes it with far less data.",
      src: `flowchart TB
  A["Pretrain: next token, trillions of tokens"] --> B["Base model: continues text"]
  B --> C["SFT: imitate good answers"]
  C --> D["Preference tuning: RLHF or DPO"]
  D --> E["RL with checkable rewards"]:::hot
  E --> F["Distil into small models"]:::ok`,
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# Five made-up training runs whose loss follows a power law in compute, with a little noise.
rng = np.random.default_rng(0)
C = np.logspace(18, 22, 5)                       # FLOPs
loss = 25 * C ** -0.05 * np.exp(rng.normal(0, 0.005, 5))

# A power law is a straight line on log-log axes, so fit a line to the logs.
slope, icpt = np.polyfit(np.log10(C), np.log10(loss), 1)
print("fitted exponent:", round(-slope, 3))
print("predicted loss at 1e23 FLOPs:", round(10 ** (icpt + slope * 23), 3))

N, D = 7e9, 2e12                                 # 7B params, 2T tokens
print(f"training compute 6ND = {6 * N * D:.1e} FLOPs")

assert abs(-slope - 0.05) < 0.01
`,
    },
    { kind: "text", md: `**Why labs care:** scaling laws let a team fit small, cheap runs and extrapolate the loss of a run ${n0(1000)} times bigger before paying for it.\n\nCompute-optimal is not the whole story. A model is trained once but served billions of times, and serving cost grows with N. So many small open models are trained on far more than 20 tokens per parameter.` },
  ],
  keyPoints: [
    "Mixed-precision Adam needs 16 bytes per parameter (2 weights, 2 gradients, 12 optimizer state); ZeRO or FSDP shard it across GPUs, and tensor or pipeline parallelism split the model itself.",
    "Pretraining minimises next-token cross-entropy on raw text: every position predicts the following token, and the text is its own label.",
    "Training compute is about C = 6ND FLOPs: 6 per parameter per token (2 forward, 4 backward).",
    "Loss falls as a power law in parameters, data and compute: a straight line on log-log axes, until it nears an irreducible floor.",
    "Chinchilla: for a fixed budget, scale parameters and tokens equally; a common rule of thumb is about 20 tokens per parameter.",
    "Small models are often trained far past that point, because a smaller model is cheaper to serve for its whole life.",
  ],
  questions: [
    { id: "objective", level: "easy", kind: "concept",
      q: "What does a decoder LLM learn to do during pretraining?",
      answer: "Predict the next token of raw text, using cross-entropy loss",
      wrong: ["Fill in randomly hidden words using context from both sides", "Answer questions from human-labelled question and answer pairs", "Rank two answers by which one people prefer"],
      why: "A GPT-style model reads left to right and predicts each next token. Filling in hidden words with both sides is BERT's masked objective. Labelled answers and rankings come later, in SFT and preference tuning." },
    { id: "base-behaviour", level: "easy", kind: "concept",
      q: "You type \"What is the capital of France?\" into a base model that was never fine-tuned. What is a likely output?",
      answer: "More text that fits the pattern, such as a list of further quiz questions",
      wrong: ["A polite one-line answer in assistant style, every time", "A refusal, because it has no system prompt", "Nothing, because a base model needs a chat template"],
      why: "A base model continues documents. A line like this often sits in a quiz page, so the likeliest continuation can be more questions. Following instructions is taught later, by SFT." },
    { id: "chinchilla", level: "medium", kind: "concept",
      q: "What was the main finding of the Chinchilla paper about a fixed compute budget?",
      answer: "Grow parameters and training tokens in equal proportion",
      wrong: ["Spend almost all extra compute on parameters; data matters little", "Keep training tokens fixed at a few hundred billion for every size", "Bigger models always win at equal compute, whatever the data size"],
      why: "The paper found that many large models of the time were under-trained. A 70B model trained on 4 times more data beat the 280B Gopher with the same compute." },
    { id: "over-train", level: "medium", kind: "concept",
      q: "Why would a lab train an 8B model on far more than 20 tokens per parameter?",
      answer: "A smaller model is cheaper for every request it serves, so extra one-time training pays off",
      wrong: ["Because that ratio is the compute-optimal one", "Because more tokens per parameter lowers the training bill", "Because small models overfit unless they see more data"],
      why: "Compute-optimal minimises training cost for a target loss, not lifetime cost. Serving costs about 2N FLOPs per token, forever. Spending more on training to keep N small is a good trade for a widely used model." },
    { id: "log-log", level: "hard", kind: "concept",
      q: "On which axes does a scaling law show up as a straight line?",
      answer: "Log of loss against log of compute (log-log)",
      wrong: ["Loss against compute, both linear", "Loss against log of compute", "Log of loss against compute"],
      why: "A power law L = a × C^(-b) becomes log L = log a - b log C: a straight line in the logs with slope -b. Close to the irreducible floor the line bends, because the floor is not a power law." },
    { id: "floor", level: "hard", kind: "concept",
      q: "Why can the pretraining loss never reach 0, however big the model?",
      answer: "Real text is partly unpredictable, so some entropy is irreducible",
      wrong: ["Gradients vanish in very deep networks", "The tokenizer loses information", "Weight decay keeps every weight away from its best value"],
      why: "Even a perfect model cannot know which of several fine next words a writer chose. That inherent uncertainty is the floor E in a loss of the form E + A/N^a + B/D^b." },
    { id: "flops-7b", level: "medium", kind: "numeric",
      q: `About how many FLOPs does it take to train a ${big(N7)} model on ${big(D2)} tokens?`,
      answer: sci(C7), wrong: [sci(N7 * D2), sci(2 * N7 * D2), sci(C7 / 10)],
      why: `C = 6ND = 6 × ${sci(N7)} × ${sci(D2)} = ${sci(C7)}. The 6 is 2 FLOPs per parameter per token for the forward pass and about 4 for the backward pass. ${sci(2 * N7 * D2)} would be the forward pass only.` },
    { id: "init-loss", level: "easy", kind: "numeric",
      q: `A fresh model spreads its guess evenly over a vocabulary of ${n0(V)} tokens. What is its cross-entropy loss in nats, to 2 decimals?`,
      answer: r2(initLoss), wrong: [r2(Math.log2(V)), r2(Math.log10(V)), r2(1 / V)],
      why: `Each right token gets p = 1/${n0(V)}, so the loss is -ln(1/${n0(V)}) = ln ${n0(V)} = ${r2(initLoss)}. ${r2(Math.log2(V))} is the same in bits (log base 2). A first loss near ln V is a good sign the setup is sane.` },
    { id: "perplexity", level: "easy", kind: "numeric",
      q: `The average loss is ${PL} nats per token. What is the perplexity, to 2 decimals?`,
      answer: r2(ppl), wrong: [r2(PL ** 2), r2(PL), r2(Math.exp(-PL))],
      why: `Perplexity = e^loss = e^${PL} = ${r2(ppl)}: the model is as unsure as a fair pick among about ${Math.round(ppl)} tokens. ${r2(PL ** 2)} would use base 2 by mistake.` },
    { id: "power-drop", level: "hard", kind: "numeric",
      q: `Loss follows L = a × C^(-${EXP}). You spend 10 times more compute. By what percent does the loss fall?`,
      answer: `${(drop * 100).toFixed(1)}%`, wrong: ["50.0%", "90.0%", `${(EXP * 100).toFixed(1)}%`],
      why: `The new loss is 10^(-${EXP}) = ${(1 - drop).toFixed(3)} of the old one, so it falls by ${(drop * 100).toFixed(1)}%. Small exponents are why each real gain needs a large multiple of compute.` },
    { id: "shift", level: "easy", kind: "output",
      q: "How are training inputs and targets made from one token list? What does this print?",
      code: `tokens = [${TOK.join(", ")}]\nprint(tokens[:-1], tokens[1:])`,
      answer: `[${TOK.slice(0, -1).join(", ")}] [${TOK.slice(1).join(", ")}]`,
      wrong: [`[${TOK.join(", ")}] [${TOK.join(", ")}]`, `[${TOK.slice(1).join(", ")}] [${TOK.slice(0, -1).join(", ")}]`, `[${TOK.slice(0, -1).join(", ")}] [${TOK.slice(0, -1).join(", ")}]`],
      why: `Inputs drop the last token, targets drop the first. Position i reads ${TOK[0]}..${TOK[1]}.. and must predict the token one step on, so a list of ${TOK.length} gives ${TOK.length - 1} training examples at once.` },
    { id: "why-next-token", level: "medium", kind: "explain",
      q: "Why does plain next-token prediction produce such capable models?",
      answer: "- **Free labels at scale:** any text is training data, so the model can see trillions of tokens.\n- **Prediction needs understanding:** to guess the next word of a proof, a recipe or a bug fix, the model must track grammar, facts, and the logic of the text.\n- **One general task:** translation, summary and Q and A all appear inside web text, so one objective covers many skills.\n\nIt still only predicts likely text. Following instructions and refusing safely are added afterwards." },
    { id: "use-laws", level: "hard", kind: "explain",
      q: "How do teams use scaling laws before a big training run?",
      answer: "- Train a ladder of small models at several sizes and data amounts.\n- Fit power laws to their final losses, then extrapolate to the big budget.\n- Pick the split of parameters and tokens that gives the lowest predicted loss, or a smaller model if serving cost matters.\n- Use the same small runs to tune learning rate and batch size.\n\nThis turns a very expensive bet into a forecast. The caveat: loss is predictable, but specific skills on benchmarks can appear less smoothly." },
    { id: "gpu-days", level: "hard", kind: "explain",
      q: `Estimate the GPU time to train a ${big(N7)} model on ${big(D2)} tokens. Assume each GPU sustains ${sci(GPU)} FLOP/s.`,
      answer: `- Compute: C = 6ND = ${sci(C7)} FLOPs.\n- One GPU: ${sci(C7)} / ${sci(GPU)} = ${sci(C7 / GPU)} seconds, about ${n0(gpuDays)} GPU-days.\n- On ${CLUSTER} GPUs: about ${Math.round(gpuDays / CLUSTER)} days, if utilisation holds.\n\nSay your assumptions out loud: peak FLOP/s times a realistic utilisation (often 30 to 50%), and that restarts and failed runs add more.` },
    { id: "adam-memory", level: "medium", kind: "numeric",
      q: "With mixed-precision Adam and plain data parallelism, how much GPU memory do a 7B model's weights, gradients and optimizer state need on each GPU?",
      answer: `${MEM7.toFixed(0)} GB`, wrong: [`${(N7 * 2 / 1e9).toFixed(0)} GB`, `${(N7 * 4 / 1e9).toFixed(0)} GB`, `${(N7 * 8 / 1e9).toFixed(0)} GB`],
      why: `16 bytes per parameter: 2 for bf16 weights, 2 for gradients, 4 + 4 + 4 for the fp32 copy and Adam's two moments. 7B × 16 = ${MEM7.toFixed(0)} GB, more than an 80 GB card, before any activations. Data parallelism alone does not help, because every GPU holds a full copy.` },
    { id: "zero3", level: "hard", kind: "numeric",
      q: `With ZeRO stage 3 (or FSDP) a ${ZB / 1e9}B model trains on ${ZN} GPUs. How much model state does each GPU hold?`,
      answer: `${MEMZ3.toFixed(1)} GB`, wrong: [`${gb(trainMem(ZB, ZN, 0)).toFixed(0)} GB`, `${gb(trainMem(ZB, ZN, 1)).toFixed(1)} GB`, `${(ZB * 2 / 1e9 / ZN).toFixed(1)} GB`],
      why: `Stage 3 shards weights, gradients and optimizer state, so each GPU keeps 1/${ZN} of 16 × ${ZB / 1e9}B bytes = ${MEMZ3.toFixed(1)} GB. Stage 1 would leave ${gb(trainMem(ZB, ZN, 1)).toFixed(1)} GB, because the 2-byte weights and gradients stay whole on every GPU.` },
    { id: "trap-bf16", level: "medium", kind: "trap",
      claim: "bf16 covers about the same range of numbers as fp32, but with fewer digits of precision.",
      truth: true,
      why: "bf16 keeps fp32's 8 exponent bits and cuts the mantissa to 7 bits. Range survives, so large and tiny values rarely overflow, which is why it trains without the loss scaling fp16 often needs." },
    { id: "trap-optimal-serve", level: "medium", kind: "trap",
      claim: "A compute-optimal model is the cheapest choice to run in production.",
      truth: false,
      why: "Compute-optimal minimises the training cost for a given loss. Serving cost depends on model size, so a smaller model trained on more tokens can reach a similar loss and be much cheaper per request." },
    { id: "trap-double-n", level: "easy", kind: "trap",
      claim: "With the number of training tokens fixed, doubling the model size doubles the training compute.",
      truth: true,
      why: `C = 6ND is linear in N. Going from ${big(N7)} to ${big(2 * N7)} parameters at ${big(D2)} tokens multiplies compute by ${twice}.` },
  ],
  real: [
    { who: "Jared Kaplan and co-authors", when: "2020",
      what: "\"Scaling Laws for Neural Language Models\" reported that test loss follows power laws in model size, dataset size and training compute, and that width or depth matter little within a wide range.",
      takeaway: "Loss became something you could forecast from small runs before paying for a large one.",
      url: "https://arxiv.org/abs/2001.08361" },
    { who: "Jordan Hoffmann and co-authors", when: "2022",
      what: "The Chinchilla paper found that for compute-optimal training, model size and training tokens should be scaled equally. Chinchilla, 70B parameters trained on 4 times more data, beat the 280B Gopher on the same compute.",
      takeaway: "A smaller model on more data can beat a bigger one that is under-trained.",
      url: "https://arxiv.org/abs/2203.15556" },
  ],
};

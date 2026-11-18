// Stage 10: long context. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { kvBytesPerToken, kvGB, LC, n0, r1, r2, ropeAngle, turns } from "../../stages/s10.calc.ts";
import { ROPE_EX } from "../../stages/s10.flows.ts";

const PER = kvBytesPerToken(), K128 = 131072, G128 = kvGB(K128), MHA = kvGB(K128, { ...LC, kvHeads: 32 });
const CROSS = Math.ceil((LC.weightsGB * 1e9) / PER);
// predict: 4 times the context, how many attention scores
const [C1, C2] = [32768, 131072], SC = (C2 / C1) ** 2;
// numeric: users at 128K on an 80 GB GPU
const ROOM = 80 * 0.9 - LC.weightsGB, USERS = Math.floor(ROOM / G128);
const stretch = ROPE_EX.target / ROPE_EX.train;

export const LONG_CONTEXT: GModule = {
  id: "long-context",
  stage: 10,
  title: "Long context",
  hook: "Models now read hundreds of thousands of tokens in one prompt. Getting there means taming positions the model never trained on, a KV cache bigger than the model, and a model that tends to skim the middle.",
  blocks: [
    { kind: "figure", id: "s10-ctx-memory", caption: `Each token keeps ${PER / 1024} KiB of keys and values in the example 8B model. Past about ${n0(CROSS)} tokens, one request's cache outweighs the ${LC.weightsGB} GB of weights.` },
    { kind: "text", md: "**Three walls.** Positions: a model trained to 4K tokens has never seen the angles RoPE gives to position 16K. Memory: the KV cache grows with every token, and attention's work grows with n squared. Use: even when it fits, the model may not use the middle of a long prompt well. Each wall has its own fix." },
    { kind: "flow", id: "s10-rope" },
    {
      kind: "predict",
      q: `A prompt grows from ${n0(C1)} to ${n0(C2)} tokens. How many more attention scores does each head compute in prefill?`,
      answer: `${SC} times as many`, wrong: [`${C2 / C1} times as many`, "The same number", `${SC * 2} times as many`],
      why: `Every token scores every earlier one, so the count grows with n squared: (${n0(C2)} / ${n0(C1)})² = ${SC}. The KV cache grows only ${C2 / C1} times. FlashAttention saves memory, not this work.`,
    },
    { kind: "play", id: "s10-ctx" },
    {
      kind: "compare",
      head: ["Wall", "Fix", "What it changes"],
      rows: [
        ["Unseen positions", `Position interpolation, YaRN: stretch RoPE by ${stretch}, short fine-tune`, "The model reads longer inputs without wild angles"],
        ["KV cache size", "Fewer KV heads (GQA), 8-bit cache, hybrids with few attention layers", `${r1(MHA)} GB to ${r1(G128)} GB at ${n0(K128)} tokens with 32 to 8 KV heads`],
        ["Attention work", "FlashAttention, ring attention across GPUs", "Same maths, less memory traffic, split over devices"],
        ["Using the middle", "Put key facts and the question at the start or end, or retrieve less", "Higher accuracy on what matters"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def rope(v, pos, base=10000.0):
    # rotate each pair (v[2i], v[2i+1]) by pos * base^(-2i/d)
    d = v.shape[0]
    ang = pos * base ** (-np.arange(0, d, 2) / d)
    c, s = np.cos(ang), np.sin(ang)
    out = np.empty_like(v)
    out[0::2] = v[0::2] * c - v[1::2] * s
    out[1::2] = v[0::2] * s + v[1::2] * c
    return out

rng = np.random.default_rng(0)
q, k = rng.normal(size=8), rng.normal(size=8)
near = rope(q, 10) @ rope(k, 7)           # offset 3
far = rope(q, 5010) @ rope(k, 5007)       # offset 3, far along
print(round(near, 4), round(far, 4))
assert np.isclose(near, far)               # the score depends only on the offset
`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph R1["Whole document matters, read once?"]
    Q1["yes"] --> A1["long context"]:::ok
  end
  subgraph R2["Large corpus, many questions?"]
    Q2["yes"] --> A2["RAG: retrieve the parts"]:::hot
  end
  subgraph R3["Same long prefix, many calls?"]
    Q3["yes"] --> A3["long context + prompt caching"]:::warn
  end
  R1 ~~~ R2
  R2 ~~~ R3`,
      caption: "Long context and retrieval are tools for different jobs, and often work together.",
    },
    { kind: "text", md: `**Test what you use.** Finding one planted sentence (a needle in a haystack) is easy for most models. Tracing a chain of facts, or counting across the whole input, is much harder, and scores drop as the input grows. Measure your own task at the lengths you will really send.` },
  ],
  keyPoints: [
    "RoPE encodes position as rotation angles; positions past the trained length give unseen angles, so models are extended with interpolation (as in YaRN) and a short fine-tune.",
    `The KV cache grows with every token (${PER / 1024} KiB a token in the example model) and can outweigh the weights at long context.`,
    "Grouped-query attention, a quantised cache and hybrid layers shrink the cache; FlashAttention and ring attention handle the n squared work.",
    "Models often use information at the start and end of a long prompt better than the middle.",
    "A claimed context length is not an effective one: test multi-step tasks at your real lengths, not just a needle search.",
  ],
  questions: [
    { id: "kv-big", level: "easy", kind: "concept",
      q: "What usually limits how long a context a GPU can serve?",
      answer: "The KV cache, which grows with every token", wrong: ["The size of the vocabulary", "The number of layer norms", "The tokenizer's speed"],
      why: `Weights are fixed; the cache grows. In the example model ${n0(K128)} tokens need ${r1(G128)} GB, more than the ${LC.weightsGB} GB of weights.` },
    { id: "middle", level: "medium", kind: "concept",
      q: "In the lost in the middle study, where did models use relevant information best?",
      answer: "At the beginning or end of the input", wrong: ["In the middle", "Evenly everywhere", "Only in the last 100 tokens"],
      why: "Accuracy was often highest when the key passage was first or last, and dropped when it sat in the middle, even for long-context models. Put the question and key facts at the edges." },
    { id: "gqa", level: "medium", kind: "concept",
      q: "How does grouped-query attention shrink the KV cache?",
      answer: "Several query heads share each key and value head, so fewer keys and values are stored",
      wrong: ["It stores only every second token", "It drops the value vectors", "It compresses the cache with a zip algorithm"],
      why: `Queries keep their full count; keys and values are shared in groups. Going from 32 to ${LC.kvHeads} KV heads cuts the cache ${32 / LC.kvHeads} times, with quality close to full multi-head attention.` },
    { id: "interp", level: "hard", kind: "concept",
      q: `A model trained to ${n0(ROPE_EX.train)} tokens must read ${n0(ROPE_EX.target)}. What does position interpolation do?`,
      answer: `Divides positions by ${stretch}, so every angle stays inside the trained range`,
      wrong: [`Repeats the first ${n0(ROPE_EX.train)} positions ${stretch} times`, "Removes RoPE above position 4,096", "Adds a new embedding table for the extra positions"],
      why: `The slowest RoPE pair would reach ${r2(turns(ropeAngle(ROPE_EX.target, ROPE_EX.pair)))} turns, against ${r2(turns(ropeAngle(ROPE_EX.train, ROPE_EX.pair)))} in training. Dividing by ${stretch} maps position ${n0(ROPE_EX.target)} onto the angle of ${n0(ROPE_EX.train)}; a short fine-tune adapts the model to the finer spacing.` },
    { id: "needle", level: "medium", kind: "concept",
      q: "A model finds a planted sentence anywhere in 128K tokens. What does that tell you?",
      answer: "Only that it can retrieve one fact; harder tasks over the same length may still fail",
      wrong: ["That it reasons over all 128K tokens as well as over 1K", "That its effective context is above 128K", "Nothing; needle tests are random"],
      why: "The RULER study found models near perfect on the plain needle test but falling off on multi-hop tracing and aggregation as length grows. Only half kept good scores at 32K." },
    { id: "ring", level: "hard", kind: "concept",
      q: "A context is too long for one GPU's memory. What does ring attention do?",
      answer: "Splits the sequence across GPUs and passes key and value blocks around a ring, so each GPU attends over all of them in turn",
      wrong: ["Drops the oldest tokens when memory is full", "Runs attention only within each GPU's own block", "Sends the whole KV cache to every GPU first"],
      why: "Each device holds one block of queries and receives the other blocks one by one, overlapping the transfer with compute. The result is exact attention over the full length." },
    { id: "kv-128", level: "medium", kind: "numeric",
      q: `The example model has ${LC.layers} layers, ${LC.kvHeads} KV heads of size ${LC.headDim}, in 16-bit. How big is one request's KV cache at ${n0(K128)} tokens?`,
      answer: `${r1(G128)} GB`, wrong: [`${r1(G128 / 2)} GB`, `${r1(MHA)} GB`, `${r1(G128 / LC.layers)} GB`],
      why: `2 (key and value) × ${LC.layers} × ${LC.kvHeads} × ${LC.headDim} × 2 bytes = ${n0(PER)} bytes a token. Times ${n0(K128)} = ${r1(G128)} GB. Forgetting the factor 2 for values halves it.` },
    { id: "users", level: "easy", kind: "numeric",
      q: `An 80 GB GPU keeps 10% spare and holds the ${LC.weightsGB} GB of weights. How many ${n0(K128)} token requests fit at once?`,
      answer: String(USERS), wrong: [String(Math.floor(80 / G128)), String(USERS + 2), "0"],
      why: `${80 * 0.9} - ${LC.weightsGB} = ${ROOM} GB left; ${ROOM} / ${r1(G128)} = ${(ROOM / G128).toFixed(1)}, so ${USERS}. Long context cuts batch size, which cuts throughput.` },
    { id: "rope-out", level: "hard", kind: "output",
      q: "With RoPE, does the score depend on where the pair sits? What does this print?",
      code: `import numpy as np\ndef rope(v, pos):\n    d = len(v); ang = pos * 10000.0 ** (-np.arange(0, d, 2) / d)\n    c, s = np.cos(ang), np.sin(ang); o = np.empty_like(v)\n    o[0::2] = v[0::2] * c - v[1::2] * s; o[1::2] = v[0::2] * s + v[1::2] * c\n    return o\nq, k = np.arange(1.0, 5.0), np.arange(4.0, 0.0, -1)\nprint(bool(np.isclose(rope(q, 9) @ rope(k, 4), rope(q, 905) @ rope(k, 900))))`,
      answer: "True", wrong: ["False", "0", "None"],
      why: "Both pairs are 5 positions apart. Rotating q by angle a and k by angle b gives a dot product that depends only on a - b, so RoPE encodes relative position." },
    { id: "explain-effective", level: "medium", kind: "explain",
      q: "Why is a model's advertised context length not the same as its useful context length?",
      answer: "The advertised length is what fits without error. The useful length is where quality holds on your task.\n\nModels often find a single planted fact anywhere, but tasks that combine facts from many places, or count across the whole input, degrade as length grows. Information in the middle is used less well than at the edges. So test your real task at your real lengths, and put the question and key facts at the start or end." },
    { id: "explain-cheap", level: "hard", kind: "explain",
      q: "How would you make a long-context feature cheaper and faster to serve?",
      answer: "- Send less: retrieve only the relevant parts instead of the whole corpus, and trim old turns.\n- Reuse: keep the long, stable part first so prompt caching skips its prefill on later calls.\n- Shrink the cache: a model with fewer KV heads, an 8-bit KV cache, or a hybrid with few attention layers.\n- Kernels and parallelism: FlashAttention for prefill, and ring or sequence parallelism when one GPU's memory is not enough.\n- Measure: accuracy against length, so you do not pay for tokens the model ignores." },
    { id: "explain-rag", level: "medium", kind: "explain",
      q: "If a model can read 1M tokens, do you still need RAG?",
      answer: "Often yes. A corpus is usually far larger than any window, and paying to prefill a million tokens on every question is slow and costly. Models also use long inputs unevenly.\n\nLong context wins when one whole document matters and is read once, or when the same prefix is reused with caching. RAG wins for large or changing corpora and many questions. Many systems retrieve generously and then let a long context read the results." },
    { id: "trap-edges", level: "easy", kind: "trap",
      claim: "Models often use information at the start or end of a long prompt better than information in the middle.",
      truth: true,
      why: "The lost in the middle study found exactly this U shape on multi-document question answering and key-value retrieval." },
    { id: "trap-needle", level: "medium", kind: "trap",
      claim: "A model that passes needle-in-a-haystack at 128K tokens can do any task over 128K tokens equally well.",
      truth: false,
      why: "Retrieving one fact is the easiest case. RULER's multi-hop and aggregation tasks show large drops as length grows, even for models that ace the plain needle test." },
  ],
  real: [
    { who: "Nelson F. Liu and co-authors", when: "2023",
      what: "Lost in the Middle tested multi-document question answering and key-value retrieval. Performance was often highest when relevant information was at the start or end, and dropped sharply in the middle, even for long-context models.",
      takeaway: "Where you put the key facts in a long prompt changes the answer.",
      url: "https://arxiv.org/abs/2307.03172" },
    { who: "Joshua Ainslie and co-authors", when: "2023",
      what: "Grouped-query attention uses more than one but fewer key-value heads than query heads. Uptrained from multi-head checkpoints with about 5% of the original pre-training compute, it reached quality close to multi-head attention at speed close to multi-query attention.",
      takeaway: "Sharing keys and values is the cheapest big cut to the KV cache.",
      url: "https://arxiv.org/abs/2305.13245" },
    { who: "Bowen Peng and co-authors", when: "2023",
      what: "YaRN extends the context window of RoPE models with 10 times fewer tokens and 2.5 times fewer training steps than earlier methods, and can extrapolate past the length of its fine-tuning data.",
      takeaway: "Context can be extended after pretraining, cheaply, by reshaping positions.",
      url: "https://arxiv.org/abs/2309.00071" },
    { who: "Cheng-Ping Hsieh and co-authors", when: "2024",
      what: "RULER adds multi-hop tracing and aggregation to the needle test, 13 tasks in all. Of 17 long-context models, all claiming 32K or more, only half kept satisfactory performance at 32K.",
      takeaway: "Measure effective context on hard tasks, not the number on the box.",
      url: "https://arxiv.org/abs/2404.06654" },
    { who: "Hao Liu, Matei Zaharia and Pieter Abbeel", when: "2023",
      what: "Ring attention computes attention and feed-forward layers in blocks split across devices, passing key-value blocks around while fully overlapping that communication with compute. Sequences can be up to device count times longer than with earlier memory-efficient Transformers, without approximation.",
      takeaway: "Exact attention over very long inputs is a matter of spreading it over enough GPUs.",
      url: "https://arxiv.org/abs/2310.01889" },
  ],
};

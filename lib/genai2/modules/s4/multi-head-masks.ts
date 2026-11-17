// Stage 4: multi-head attention and masks. Every number below is computed here.
import type { GModule } from "../../types.ts";
import { MHA } from "../../stages/s4.flows.ts";
import { KV_SHAPE, kvGB } from "../../stages/s4.play.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);

// predict: projection size with heads
const PD = 512, PH = 8;
// numeric: head size; GQA grouping; KV cache
const [D1, H1] = [768, 12];
const [QH, KVH] = [32, 8];
const CTX = 4096, mhaGB = kvGB(QH, CTX), gqaGB = kvGB(KVH, CTX), mqaGB = kvGB(1, CTX);
// output: split into heads
const { T, d, h } = MHA;
// output: causal and padding together, left padded (pads first, as in batched generation)
const MN = 4, REAL = [false, true, true, true];
let open = 0;
for (let i = 0; i < MN; i++) for (let j = 0; j <= i; j++) if (REAL[j]) open++;
const causalPairs = (MN * (MN + 1)) / 2, padIdx = REAL.indexOf(false);

export const MULTI_HEAD_MASKS: GModule = {
  id: "multi-head-masks",
  stage: 4,
  title: "Multi-head and masks",
  hook: "One attention pattern per token is not enough: a word needs its subject, its neighbour and the topic all at once. Many small heads look for different things in parallel, and masks decide what each is allowed to see.",
  blocks: [
    { kind: "figure", id: "s4-heads", caption: `One token's 8 numbers cut into 4 head slices. Each head runs its own causal attention with its own pattern, then the slices are joined and mixed by W_O. The patterns are illustrations of the kinds real heads learn; nobody assigns them.` },
    { kind: "text", md: "**Why several heads.** One softmax gives one weighting per token, so one head would have to average every relation into a single pattern. Cutting the width into h slices gives h independent patterns for the same cost: each head attends over the full sequence with its own d / h numbers, and W_O mixes what they found." },
    { kind: "flow", id: "s4-mha-shapes" },
    {
      kind: "predict",
      q: `Model width ${PD}. How many weights are in W_Q with ${PH} heads of ${PD / PH}, compared with 1 head of ${PD}?`,
      answer: `${n0(PD * PD)} in both cases`,
      wrong: [`${n0(PH * PD * PD)} with ${PH} heads, ${n0(PD * PD)} with 1`, `${n0(PD * (PD / PH))} with ${PH} heads, ${n0(PD * PD)} with 1`, `${n0(PD * PD)} with ${PH} heads, ${n0(PD)} with 1`],
      why: `Heads are slices of one ${PD} by ${PD} matrix: ${PH} slices of ${PD} by ${PD / PH} make ${n0(PD * PD)} weights, the same as one big head. More heads change how the width is split, not how many weights there are.`,
    },
    { kind: "flow", id: "s4-pad-mask" },
    {
      kind: "compare",
      head: ["Mask", "Blocks", "Used for"],
      rows: [
        ["Causal", "Keys after the query", "Decoders, so a token cannot see the word it predicts"],
        ["Padding", "Pad keys", "Encoders on any padded batch; decoders when pads come first (left padding)"],
        ["Sliding window", "Keys more than W back", "Long context at lower cost; stacked layers still reach further"],
        ["Document", "Keys from another document", "Training on several documents packed into one sequence"],
      ],
    },
    { kind: "play", id: "s4-gqa-cache" },
    {
      kind: "compare",
      head: ["Variant", "K, V heads", `KV cache at ${n0(CTX)} tokens`],
      rows: [
        ["Multi-head (MHA)", `${QH}, one per query head`, `${r2(mhaGB)} GB`],
        ["Grouped-query (GQA)", `${KVH}, each shared by ${QH / KVH}`, `${r2(gqaGB)} GB`],
        ["Multi-query (MQA)", "1, shared by all", `${r2(mqaGB)} GB`],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def mha(X, Wq, Wk, Wv, Wo, h, key_ok):
    T, d = X.shape
    dh = d // h
    split = lambda M: M.reshape(T, h, dh).transpose(1, 0, 2)   # (h, T, dh)
    Q, K, V = split(X @ Wq), split(X @ Wk), split(X @ Wv)
    s = Q @ K.transpose(0, 2, 1) / np.sqrt(dh)                  # (h, T, T)
    allowed = np.tril(np.ones((T, T), dtype=bool)) & key_ok[None, :]   # causal and padding
    allowed[~key_ok] = np.eye(T, dtype=bool)[~key_ok]           # a pad query reads only itself; its output is ignored
    s = np.where(allowed, s, -np.inf)
    w = np.exp(s - s.max(-1, keepdims=True))
    w = w / w.sum(-1, keepdims=True)
    out = (w @ V).transpose(1, 0, 2).reshape(T, d)              # concat the heads
    return out @ Wo, w

rng = np.random.default_rng(0)
T, d, h = 5, 8, 2
X = rng.normal(size=(T, d))
Wq, Wk, Wv, Wo = (rng.normal(size=(d, d)) / np.sqrt(d) for _ in range(4))
key_ok = np.array([False, True, True, True, True])              # left padded: the first token is padding
out, w = mha(X, Wq, Wk, Wv, Wo, h, key_ok)
print("output", out.shape, "weights", w.shape)
print("head 1, token 5:", np.round(w[0, 4], 2))

assert np.allclose(w.sum(-1), 1)          # every row sums to 1
assert np.all(w[:, 1:, 0] == 0)           # no real token reads the pad key
assert np.all(np.triu(w[0], k=1) == 0)    # nobody reads the future
`,
    },
  ],
  keyPoints: [
    "Multi-head attention splits the width into h slices; each head runs its own attention, and W_O mixes the joined outputs.",
    "With the same model width, more heads add no projection weights: the matrices are only sliced.",
    "Masks add minus infinity to scores before softmax: causal hides the future, padding hides pad keys, and they combine.",
    "Grouped-query attention shares each K, V head among a group of query heads, shrinking the KV cache with little quality loss.",
    "Head roles are learned, not assigned.",
  ],
  questions: [
    { id: "why-heads", level: "easy", kind: "concept",
      q: "Why use several attention heads instead of one?",
      answer: "Each head can learn a different pattern, such as the previous word or the subject, at the same time",
      wrong: ["One head cannot attend to more than one token", "Heads let the model skip the softmax", "More heads always mean more parameters, and so a smarter model"],
      why: "One softmax gives one weighting per token. With h heads, a token can follow h relations at once, each in its own slice of the width." },
    { id: "pad-why", level: "easy", kind: "concept",
      q: "What does a padding mask do?",
      answer: "Stops every query from attending to pad tokens added to even out a batch",
      wrong: ["Stops tokens from seeing later tokens", "Removes pad tokens from the vocabulary", "Gives pad tokens a weight of exactly 1"],
      why: "Pad tokens are filler with no meaning. Their key columns get minus infinity, so their weights are 0 and real tokens are unaffected by how much padding a batch needs." },
    { id: "wo-role", level: "medium", kind: "concept",
      q: "After the heads' outputs are joined, what does W_O do?",
      answer: "Mixes information across heads and maps it back to the model width for the residual stream",
      wrong: ["Applies the causal mask", "Normalises each head's output to length 1", "Chooses the single best head and discards the rest"],
      why: "The joined vector holds each head's findings side by side. W_O is a learned d by d matrix that combines them before the result is added back to x." },
    { id: "gqa-speed", level: "hard", kind: "concept",
      q: "Why does grouped-query attention make text generation faster?",
      answer: "Decoding is limited by memory reads, and a smaller KV cache means fewer bytes to read per token",
      wrong: ["It reduces the number of query heads, so less math", "It removes the softmax from attention", "It makes attention cost linear in length"],
      why: "Each new token reads every cached key and value. Sharing K, V heads cuts that cache, and so the reads, by the group size; the query heads and the math per head stay." },
    { id: "head-roles", level: "medium", kind: "concept",
      q: "How does a head end up tracking, say, the previous token?",
      answer: "It is learned in training; nothing assigns roles to heads",
      wrong: ["Each head is given a fixed role when the model is built", "The tokenizer labels tokens for each head", "Heads are sorted by role after training"],
      why: "All heads start random and are trained together. Some end up with readable patterns, which interpretability work finds afterwards; many do not." },
    { id: "mask-combine", level: "hard", kind: "concept",
      q: "A decoder generates for a batch of prompts padded on the left, so the pads come first. Which masks does it need?",
      answer: "Both: a key is open only if it is not in the future and is not padding",
      wrong: ["Only the causal mask, since it already hides the pads", "Only the padding mask, since the causal mask is for training only", "Both, averaged, so blocked keys get half weight"],
      why: "Pads at the front come before every real token, so the causal mask leaves them open. The padding mask closes their columns, and adding both minus-infinity masks blocks the union. With right padding the pads come after the real tokens, so the causal mask alone already hides them from every real token." },
    { id: "head-size", level: "easy", kind: "numeric",
      q: `Model width ${D1} with ${H1} heads. What is each head's size?`,
      answer: String(D1 / H1), wrong: [String(D1), String(D1 * H1), String(H1)],
      why: `The width is split evenly: ${D1} / ${H1} = ${D1 / H1}.` },
    { id: "gqa-group", level: "medium", kind: "numeric",
      q: `A model has ${QH} query heads and ${KVH} K, V heads. How many query heads share each K, V head?`,
      answer: String(QH / KVH), wrong: [String(KVH), String(QH), String(QH - KVH)],
      why: `${QH} / ${KVH} = ${QH / KVH}. The KV cache is ${QH / KVH} times smaller than with one K, V head per query head.` },
    { id: "kv-size", level: "hard", kind: "numeric",
      q: `${KV_SHAPE.layers} layers, ${KVH} K, V heads of size ${KV_SHAPE.headDim}, ${KV_SHAPE.bytes} bytes a number, ${n0(CTX)} tokens. How big is the KV cache for one sequence?`,
      answer: `${r2(gqaGB)} GB`, wrong: [`${r2(gqaGB / 2)} GB`, `${r2(mhaGB)} GB`, `${r2(gqaGB * KV_SHAPE.layers)} GB`],
      why: `2 (K and V) x ${KV_SHAPE.layers} x ${KVH} x ${KV_SHAPE.headDim} x ${n0(CTX)} x ${KV_SHAPE.bytes} = ${n0(2 * KV_SHAPE.layers * KVH * KV_SHAPE.headDim * CTX * KV_SHAPE.bytes)} bytes, about ${r2(gqaGB)} GB. Forgetting the factor 2 for K and V is the usual slip.` },
    { id: "split-shape", level: "medium", kind: "output",
      q: "What shape does this print?",
      code: `import numpy as np\nx = np.zeros((${T}, ${d}))\nprint(x.reshape(${T}, ${h}, ${d / h}).transpose(1, 0, 2).shape)`,
      answer: `(${h}, ${T}, ${d / h})`, wrong: [`(${T}, ${h}, ${d / h})`, `(${h}, ${d / h}, ${T})`, `(${T}, ${d})`],
      why: `reshape cuts each of the ${T} rows into ${h} slices of ${d / h}; transpose(1, 0, 2) moves the head axis first, so each head gets its own (${T}, ${d / h}) block.` },
    { id: "open-count", level: "medium", kind: "output",
      q: `${MN} tokens, left padded: token ${padIdx + 1} is padding. How many query-key pairs stay open under both masks? What does this print?`,
      code: `import numpy as np\nn = ${MN}\ncausal = np.tril(np.ones((n, n), dtype=bool))\nreal = np.array([${REAL.map((x) => (x ? "True" : "False")).join(", ")}])\nprint(int((causal & real[None, :]).sum()))`,
      answer: String(open), wrong: [String(causalPairs), String(MN * MN), String(causalPairs - 1)],
      why: `The causal mask leaves ${causalPairs} pairs. The pad comes first, so every query can see it: its whole column of ${causalPairs - open} closes, leaving ${open}. With the pad last instead, only its own diagonal cell would close (${causalPairs - 1}), because the causal mask already hides a trailing pad.` },
    { id: "explain-mha", level: "medium", kind: "explain",
      q: "Walk through multi-head attention with shapes.",
      answer: `Take x of shape (${T}, ${d}) with ${h} heads.\n1. Q, K, V = x W_Q, x W_K, x W_V, each (${T}, ${d}).\n2. Split each into ${h} heads: (${h}, ${T}, ${d / h}).\n3. Each head: softmax(Q K^T / sqrt(${d / h}) + mask) V, giving (${h}, ${T}, ${d / h}). The scores are (${h}, ${T}, ${T}).\n4. Join the heads: (${T}, ${d}).\n5. Multiply by W_O and add to the residual stream.\n\nSame weights as one big head; the gain is ${h} separate attention patterns.` },
    { id: "explain-gqa", level: "hard", kind: "explain",
      q: "Compare MHA, MQA and GQA.",
      answer: `- MHA: every query head has its own K and V head. Best quality, biggest KV cache (${r2(mhaGB)} GB in the example above).\n- MQA: one K, V head shared by all query heads. Smallest cache (${r2(mqaGB)} GB) and fastest decoding, but quality can drop.\n- GQA: groups of query heads share a K, V head (${QH} query heads, ${KVH} K, V heads). Quality close to MHA with a cache ${QH / KVH} times smaller (${r2(gqaGB)} GB).\n\nOnly K and V are shared. Every head keeps its own queries, so the attention patterns can still differ.` },
    { id: "explain-masks", level: "medium", kind: "explain",
      q: "Why does a decoder need a causal mask in training, and when is a padding mask needed?",
      answer: "Training feeds the whole sentence at once and every position predicts its next token. Without the causal mask, position i could read token i + 1, its own answer, and learn to copy instead of predict.\n\nA padding mask is needed whenever an encoder reads a padded batch, since every token sees every position. In a decoder it is needed when the pads come before real tokens, as with left padding for batched generation, because the causal mask leaves earlier positions open. With right padding the causal mask already hides the trailing pads from every real token; only the pad positions read them, and their outputs are ignored. Pad positions are left out of the loss either way." },
    { id: "trap-params", level: "medium", kind: "trap",
      claim: `Attention with ${PH} heads of ${PD / PH} has the same number of projection weights as one head of ${PD}.`,
      truth: true,
      why: `W_Q, W_K, W_V and W_O are each ${PD} by ${PD} either way, ${n0(4 * PD * PD)} weights in all. Heads only slice them.` },
    { id: "trap-pad-decoder", level: "easy", kind: "trap",
      claim: "Padding masks are only needed in decoders.",
      truth: false,
      why: "Encoders need one most: every token sees every position, so an encoder that classifies short and long reviews in one batch must stop real tokens from attending to pads. A decoder needs one when pads come first; with right padding its causal mask already hides them." },
    { id: "trap-gqa-queries", level: "hard", kind: "trap",
      claim: "Grouped-query attention makes all heads in a group use the same attention weights.",
      truth: false,
      why: "Heads in a group share keys and values, but each has its own queries, so each computes its own scores and weights. Only the cached K and V are shared." },
  ],
  real: [
    { who: "Joshua Ainslie and co-authors", when: "2023",
      what: "The paper \"GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints\" proposed grouped-query attention, with more than one but fewer K, V heads than query heads. It also converted existing multi-head checkpoints using about 5% of the original pre-training compute.",
      takeaway: "The paper reports that uptrained GQA reaches quality close to multi-head attention at speeds comparable to multi-query attention.",
      url: "https://arxiv.org/abs/2305.13245" },
  ],
};

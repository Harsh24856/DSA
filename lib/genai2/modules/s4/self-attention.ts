// Stage 4, the gold-standard module: every later module copies this shape. Every number below is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);
const softmax = (s: number[]) => { const e = s.map(Math.exp), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };

// predict: equal scores
const EQ = 4, uniform = r2(1 / EQ);
// compare: RNN against attention
const [N1, N2] = [512, 4096];
// numeric: softmax of [2, 1, 0]
const S = [2, 1, 0], sw = softmax(S), half = softmax(S.map((x) => x / 2));
// trap: adding a constant to every score
const SHIFT = 10, shifted = softmax(S.map((x) => x + SHIFT));
// numeric: matrix size
const N = 1024;
// cost text and trap: growth when the context grows
const growth = (4096 / 1024) ** 2, [T1, T2] = [512, 1024];
// output: masked entries for n tokens; shapes
const M = 4, [SN, DK, DV] = [5, 8, 16];

export const SELF_ATTENTION: GModule = {
  id: "self-attention",
  stage: 4,
  title: "Self-attention",
  lab: "transformer",
  hook: "Every word looks at every other word and decides how much each one matters right now. That one idea is the engine of the transformer.",
  blocks: [
    { kind: "figure", id: "s4-qkv", caption: "Each word's whole vector is projected three ways, by three learned matrices. The query of \"sat\" is compared with the key of every word, itself included." },
    { kind: "text", md: "**What attention answers:** for this word, which other words matter? In \"the animal did not cross the road because it was tired\", the word \"it\" should look hard at \"animal\".\n\nEach token makes a **query** (what am I looking for), a **key** (what do I offer) and a **value** (what do I pass on). Its query is scored against every key. The best matches get the most weight, and their values are mixed into its new vector." },
    { kind: "flow", id: "g-attn" },
    { kind: "play", id: "s4-attn-scale" },
    {
      kind: "predict",
      q: `${EQ} tokens all get the same score, 3.0. What weights does softmax give them?`,
      answer: `${uniform} each`,
      wrong: [`${r2(3 / EQ)} each`, `${r2(1)} on the first token, ${r2(0)} on the rest`, `${r2(1)} each`],
      why: `Softmax only cares about differences between scores. Equal scores give equal weights, 1/n = 1/${EQ} = ${uniform}, so the output is a plain average of the values.`,
    },
    { kind: "lab", id: "attention" },
    { kind: "flow", id: "g-mask" },
    {
      kind: "compare",
      head: ["Property", "RNN", "Self-attention"],
      rows: [
        ["Path from first to last word", `${n0(N1 - 1)} hops at n = ${n0(N1)}, ${n0(N2 - 1)} at n = ${n0(N2)}`, "1 hop at any length"],
        ["Steps that must run in order", `${n0(N1)} at n = ${n0(N1)}, ${n0(N2)} at n = ${n0(N2)}`, "1: all positions at once"],
        ["Memory for comparisons", "One state vector, carried forward", `${n0(N1 * N1)} scores at n = ${n0(N1)}, ${n0(N2 * N2)} at n = ${n0(N2)}, per head`],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def attention(Q, K, V, causal=True):
    d = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d)            # row i: query i against every key
    if causal:                               # hide the future: j > i
        n = scores.shape[0]
        future = np.triu(np.ones((n, n), dtype=bool), k=1)
        scores = np.where(future, -np.inf, scores)
    scores = scores - scores.max(axis=-1, keepdims=True)   # stable softmax
    w = np.exp(scores)
    w = w / w.sum(axis=-1, keepdims=True)    # each row sums to 1
    return w @ V, w

# 4 tokens, 4 numbers each; Q = K = V = X keeps the sums easy to follow
X = np.array([[1.0, 0.0, 1.0, 0.0],
              [0.0, 2.0, 0.0, 1.0],
              [1.0, 1.0, 1.0, 1.0],
              [0.0, 1.0, 2.0, 0.0]])
out, w = attention(X, X, X)
print(np.round(w, 2))
print("new vector for token 4:", np.round(out[-1], 2))

assert np.allclose(w.sum(axis=1), 1)        # rows sum to 1
assert np.all(np.triu(w, k=1) == 0)         # no weight on the future
`,
    },
    { kind: "text", md: `**The price is n squared.** Every query meets every key, so n tokens make n × n scores per head, in every layer. Go from ${n0(1024)} to ${n0(4096)} tokens and there are ${growth} times as many scores, not 4. That is why long context is slow and memory hungry.\n\nFlashAttention (Stage 9, Production) computes the same answer in tiles so the full matrix is never stored at once. The work stays quadratic.` },
  ],
  keyPoints: [
    "Each token makes a query (what it looks for), a key (what it offers) and a value (what it passes on), each a learned projection of its vector.",
    "The score between two tokens is the dot product of one's query with the other's key.",
    "Scores are divided by sqrt(d), the square root of the head size, so softmax does not saturate as d grows.",
    "Softmax runs along each row, so one token's weights over all keys sum to 1, and its output is the weighted sum of the values.",
    "Decoders add a causal mask: future positions get minus infinity before softmax, so each token sees only itself and the past.",
  ],
  questions: [
    { id: "query-role", level: "easy", kind: "concept",
      q: "In self-attention, which vector does a token use to say what it is looking for?",
      answer: "Its query", wrong: ["Its key", "Its value", "Its position encoding"],
      why: "The query asks the question. Keys are what other tokens offer to be matched against, and values are what they hand over once matched." },
    { id: "rows-sum", level: "easy", kind: "concept",
      q: "After softmax, what is true of each row of the attention weight matrix?",
      answer: "It sums to 1", wrong: ["It sums to n, the number of tokens", "It sums to 0", "Its largest entry is exactly 1"],
      why: "Softmax turns one query's scores into a probability split over all the keys, so each row adds up to 1. The largest entry is 1 only in the extreme case where one key takes everything." },
    { id: "output-is", level: "medium", kind: "concept",
      q: "What is a token's output from one attention head?",
      answer: "A weighted sum of all the value vectors, using its attention weights",
      wrong: ["The value vector of the single key with the highest score", "The sum of all the query vectors", "Its own value vector, scaled by its own weight"],
      why: "Attention is soft: every value contributes in proportion to its weight. Picking only the best key would be hard attention, which is not differentiable." },
    { id: "mask-value", level: "medium", kind: "concept",
      q: "In a causal mask, what goes into the scores above the diagonal before softmax?",
      answer: "Minus infinity, so those weights become exactly 0",
      wrong: ["Zero, so those weights become exactly 0", "One, so the future gets an equal share", "Nothing; the mask is applied to the outputs after attention"],
      why: "Softmax exponentiates, and e to the minus infinity is 0. A score of zero is not a block at all: e^0 = 1, so the future would still get weight." },
    { id: "qkv-from-x", level: "medium", kind: "concept",
      q: "In self-attention, Q, K and V all come from the same input X. How?",
      answer: "Three learned matrices: Q = X W_Q, K = X W_K, V = X W_V",
      wrong: ["Q = X, K = X transposed and V = X, with nothing learned", "Q, K and V are three different input sentences", "K and V are fixed random projections; only W_Q is learned"],
      why: "The three projections are trained with the rest of the model, so a token can learn to ask for one thing while offering something else. Using X directly, as in the small walk-through, only keeps the arithmetic easy." },
    { id: "double-d", level: "hard", kind: "concept",
      q: "Query and key entries are independent with mean 0 and variance 1. You double the head size d and do not scale. What happens to the typical size (standard deviation) of q · k?",
      answer: `It grows by sqrt(2), about ${r2(Math.SQRT2)} times`, wrong: ["It doubles", "It stays the same", "It halves"],
      why: `q · k is a sum of d products, each with variance 1, so its variance is d and its standard deviation sqrt(d). Doubling d multiplies the standard deviation by sqrt(2) = ${r2(Math.SQRT2)}. Dividing by sqrt(d) cancels exactly this.` },
    { id: "permute", level: "hard", kind: "concept",
      q: "With no position information added, you shuffle the order of the input tokens. What happens to the self-attention outputs?",
      answer: "They come out shuffled the same way, each token's output unchanged",
      wrong: ["They change completely, because attention reads tokens left to right", "They stay in the original order", "Softmax fails because the scores no longer sum to 1"],
      why: "Attention compares every pair regardless of position, so it treats the input as a set. That is why transformers add position encodings: without them \"dog bites man\" and \"man bites dog\" look alike." },
    { id: "softmax-210", level: "medium", kind: "numeric",
      q: "Softmax of the scores [2, 1, 0]: what is the largest weight, to 2 decimals?",
      answer: r2(sw[0]), wrong: [r2(1 / 3), r2(1), r2(sw[1])],
      why: `e^2 / (e^2 + e^1 + e^0) = ${r2(Math.exp(2))} / ${r2(Math.exp(2) + Math.exp(1) + 1)} = ${r2(sw[0])}. The weights are ${sw.map(r2).join(", ")}. Halve the scores first and the largest weight drops to ${r2(half[0])}: smaller scores mean flatter weights.` },
    { id: "matrix-size", level: "easy", kind: "numeric",
      q: `A sequence has ${n0(N)} tokens. How many entries does one head's attention weight matrix have?`,
      answer: n0(N * N), wrong: [n0(N), n0(2 * N), n0((N * (N + 1)) / 2)],
      why: `One score for every query and key pair: ${n0(N)} × ${n0(N)} = ${n0(N * N)}. A causal mask zeroes the upper part, but the matrix is still n by n.` },
    { id: "mask-count", level: "easy", kind: "output",
      q: "How many positions does a causal mask hide for these tokens? What does this print?",
      code: `import numpy as np\nn = ${M}\nmask = np.triu(np.ones((n, n)), k=1)\nprint(int(mask.sum()))`,
      answer: String((M * (M - 1)) / 2), wrong: [String((M * (M + 1)) / 2), String(M * M), String(M)],
      why: `k=1 starts one above the diagonal, so only strict future pairs count: n(n - 1) / 2 = ${(M * (M - 1)) / 2} for n = ${M}. The diagonal stays visible because each token may look at itself.` },
    { id: "out-shape", level: "medium", kind: "output",
      q: `Keys are ${DK} wide but values are ${DV} wide. What shape does this print?`,
      code: `import numpy as np\nQ = np.ones((${SN}, ${DK}))\nK = np.ones((${SN}, ${DK}))\nV = np.ones((${SN}, ${DV}))\ns = Q @ K.T / np.sqrt(${DK})\nw = np.exp(s) / np.exp(s).sum(axis=1, keepdims=True)\nprint((w @ V).shape)`,
      answer: `(${SN}, ${DV})`, wrong: [`(${SN}, ${DK})`, `(${SN}, ${SN})`, `(${DK}, ${DV})`],
      why: `The weights are ${SN} × ${SN} (tokens by tokens). Multiplying by V, ${SN} × ${DV}, gives one ${DV} wide output per token. Q and K only need to match each other; V sets the output width.` },
    { id: "why-sqrt-d", level: "hard", kind: "explain",
      q: "Why are attention scores divided by sqrt(d)?",
      answer: `A score is a dot product: a sum of d products. If query and key entries have mean 0 and variance 1, the score has variance d, so at d = 64 a typical score is about ${Math.sqrt(64)} in size.\n\nSoftmax of large numbers is nearly one-hot. Almost all weight goes to one key and the gradients for the others vanish, so training stalls.\n\nDividing by sqrt(d) brings the variance back to 1 for any head size, so softmax stays soft and gradients keep flowing.` },
    { id: "why-not-rnn", level: "medium", kind: "explain",
      q: "Why did attention replace RNNs in language models?",
      answer: `- Short paths: any word reaches any other in 1 step. In an RNN, word 1 reaches word ${n0(N1)} through ${n0(N1 - 1)} hops, and the signal fades on the way.\n- Parallel training: an RNN must go one step at a time, but attention handles every position at once, which suits GPUs.\n- No bottleneck: an RNN squeezes all the past into one state vector; attention can look back at every token directly.\n\nThe cost is n squared memory and time in the length, which is why long context is expensive.` },
    { id: "mask-train-gen", level: "hard", kind: "explain",
      q: "What does the causal mask do during training, and what changes during generation?",
      answer: "**Training:** the whole sentence goes in at once and every position predicts its next token in parallel. The mask stops position i from seeing any j > i, otherwise it could copy the answer.\n\n**Generation:** tokens come one at a time. The new token's single query row has no future to hide, since later tokens do not exist yet, so the mask matters only when the prompt is processed in one pass (prefill). The keys and values of earlier tokens are cached and reused." },
    { id: "trap-shift", level: "medium", kind: "trap",
      claim: "Adding the same number to every score in a row leaves that row's attention weights unchanged.",
      truth: true,
      why: `Softmax only sees differences: e^(s + c) = e^c × e^s, and e^c cancels top and bottom. Scores [${S.join(", ")}] give ${sw.map(r2).join(", ")}, and [${S.map((x) => x + SHIFT).join(", ")}] give ${shifted.map(r2).join(", ")}. The code above relies on this when it subtracts each row's max.` },
    { id: "trap-linear", level: "medium", kind: "trap",
      claim: "Self-attention cost grows linearly with sequence length.",
      truth: false,
      why: `Every token scores every other token, so the work and the score matrix grow with n squared. Going from ${n0(T1)} to ${n0(T2)} tokens takes the scores from ${n0(T1 * T1)} to ${n0(T2 * T2)}, ${(T2 * T2) / (T1 * T1)} times as many.` },
  ],
  real: [
    { who: "Ashish Vaswani and co-authors", when: "2017",
      what: "The paper \"Attention Is All You Need\" proposed the Transformer, a model built only on attention, with no recurrence and no convolutions. It defined the scaled dot-product attention taught here, including the division by the square root of the key size.",
      takeaway: "Removing recurrence let every position be computed in parallel, which the paper reports made training faster.",
      url: "https://arxiv.org/abs/1706.03762" },
  ],
};

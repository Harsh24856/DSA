// Stage 3, module 5: attention (Bahdanau, then Luong) as the fix for the seq2seq bottleneck. Every number is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const softmax = (s: number[]) => { const m = Math.max(...s), e = s.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };
const py = (xs: number[]) => `[${xs.map((x) => String(Number(x.toFixed(2)))).join(", ")}]`;

// predict and numeric: how many weights
const [PN, PM] = [30, 20];
// numeric: a context vector by hand
const AW = [0.7, 0.2, 0.1], AH = [[1, 0], [0, 1], [1, 1]];
const ctx = [0, 1].map((k) => AW.reduce((s, w, j) => s + w * AH[j][k], 0));
// output: which source word wins
const OUT_WORDS = ["the", "black", "cat"], OUT_S = [0.5, 1.0, 2.5], ow = softmax(OUT_S), top = ow.indexOf(Math.max(...ow));
// softmax dilution in the trap
const GAP = 2, [DN1, DN2] = [10, 100], right = (n: number) => Math.exp(GAP) / (Math.exp(GAP) + n - 1);

export const ATTENTION_FIX: GModule = {
  id: "attention-fix",
  stage: 3,
  title: "Attention as the fix",
  hook: "Stop squeezing the sentence into one vector. Keep every encoder state, and at each output word let the decoder look back and choose which ones to read.",
  blocks: [
    { kind: "figure", id: "s3-align", caption: "Attention weights for \"the black cat\" to \"le chat noir\". Each row is one output word and sums to 1. The adjective moves, so the strong cells leave the diagonal." },
    { kind: "flow", id: "s3-bahdanau" },
    { kind: "text", md: "**One decoder step, in three moves.** Score every encoder state h_j against the decoder's state: e_j = v · tanh(W s + U h_j), a tiny learned network. Softmax the scores into weights α_j that sum to 1. Mix the states: c = Σ α_j h_j.\n\nThe context c is rebuilt for every output word, so \"noir\" can read \"black\" while \"chat\" reads \"cat\"." },
    {
      kind: "predict",
      q: `The source has ${PN} words. At one decoder step, how many attention weights are computed, and what do they add up to?`,
      answer: `${PN}, adding up to 1`, wrong: [`${PN}, adding up to ${PN}`, `${n0(PN * PM)}, adding up to 1`, "1, for the best source word only"],
      why: `One weight per source word, ${PN} in all, from a softmax, so they add up to 1. Over a ${PM} word output that is ${PM} × ${PN} = ${n0(PN * PM)} weights: cost grows with both lengths.`,
    },
    { kind: "play", id: "s3-align-sharp" },
    { kind: "flow", id: "g-rnn" },
    {
      kind: "compare",
      head: ["", "Bahdanau (2014)", "Luong (2015)"],
      rows: [
        ["Score", "Additive: v · tanh(W s + U h_j)", "dot: h_t · h_j, general: h_t · W h_j, or concat"],
        ["Decoder state used", "Previous state s_(i-1), before this word", "Current top-layer state h_t"],
        ["Encoder", "Bidirectional RNN, forward and backward states joined", "Top layer of a stacked LSTM"],
        ["Context used to", "Compute the next decoder state", "Form tanh(W [c ; h_t]), then predict"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
n, h, a = 5, 4, 6                      # source length, state size, scorer size
H = rng.normal(size=(n, h))            # encoder states h_1..h_n
s = rng.normal(size=h)                 # decoder state before this word
W, U = rng.normal(size=(a, h)), rng.normal(size=(a, h))
v = rng.normal(size=a)

def additive_attention(s, H):
    e = np.tanh(W @ s + H @ U.T) @ v   # one score per source position
    w = np.exp(e - e.max())
    w = w / w.sum()                    # softmax over the source
    return w, w @ H                    # weights, context

w, c = additive_attention(s, H)
print("weights:", np.round(w, 3), " sum:", round(w.sum(), 3))
print("context:", np.round(c, 3))

assert np.isclose(w.sum(), 1) and np.all(w > 0)
# the context lies inside the range of the encoder states, never outside it
assert np.all(c <= H.max(axis=0) + 1e-9) and np.all(c >= H.min(axis=0) - 1e-9)
`,
    },
    { kind: "text", md: "**From here to the transformer.** Attention made the recurrence optional. If every word can look at every other word directly, the encoder can do the same inside the source (self-attention), and the decoder inside what it has written so far. Remove the RNNs, run all positions at once, and you have the transformer of the next stage." },
  ],
  keyPoints: [
    "Attention keeps every encoder state instead of only the last one, removing the fixed-size bottleneck.",
    "At each output step, scores between the decoder state and each encoder state become softmax weights that sum to 1.",
    "The context vector is the weighted sum of encoder states, rebuilt for every output word.",
    "Bahdanau scores with a small additive network on the previous decoder state; Luong uses the current state with dot, general or concat scores.",
    "Each output has a one-step path to every input, which helps long sentences and gradients; the cost is n × m weights per sentence pair.",
  ],
  questions: [
    { id: "keeps", level: "easy", kind: "concept",
      q: "What does attention give the decoder that a basic seq2seq decoder lacks?",
      answer: "Access to every encoder state, weighted anew at each output step",
      wrong: ["A bigger final encoder state", "The true target words at inference time", "A second encoder that reads the sentence backwards"],
      why: "The basic decoder sees only the last encoder state. With attention it can read any of them directly, so nothing has to survive the whole encoder pass to be used." },
    { id: "softmax-over", level: "easy", kind: "concept",
      q: "At one decoder step, the attention weights are a softmax over what?",
      answer: "The source positions: one weight per encoder state", wrong: ["The target vocabulary", "The dimensions of the hidden state", "The decoder steps written so far"],
      why: "Scores compare the decoder state with each encoder state, and softmax turns them into a split of attention across the source. The vocabulary softmax is a separate step that picks the output word." },
    { id: "per-step", level: "medium", kind: "concept",
      q: "How does the context vector in an attention model differ from the basic seq2seq context?",
      answer: "It is recomputed for every output word, from different weights",
      wrong: ["It is computed once and reused, but is larger", "It is the first encoder state instead of the last", "It is the sum of all encoder states with equal weights"],
      why: "Each output step has its own scores, so \"chat\" can draw on \"cat\" and \"noir\" on \"black\". An equal-weight sum would be one fixed blend, close to the old bottleneck." },
    { id: "additive-score", level: "medium", kind: "concept",
      q: "Which is Bahdanau's (additive) attention score between decoder state s and encoder state h_j?",
      answer: "v · tanh(W s + U h_j)", wrong: ["s · h_j", "softmax(s) · softmax(h_j)", "tanh(s) + tanh(h_j)"],
      why: "A one-hidden-layer network scores the pair, with W, U and v learned with the rest of the model. s · h_j is the dot score, which came later with Luong and is the one transformers scale and use." },
    { id: "dot-vs-additive", level: "medium", kind: "concept",
      q: "What is a practical difference between dot-product and additive attention scores?",
      answer: "Dot product needs the two vectors to have the same size and has no parameters; additive learns weights and can join different sizes",
      wrong: ["Dot product cannot be followed by a softmax", "Additive scores are always smaller, so they need no scaling", "Dot product works only with GRU encoders"],
      why: "The dot score is a single matrix multiply, fast on GPUs, which is why transformers use it (with scaling). The additive score projects both vectors into a shared space first, at the cost of extra weights and compute." },
    { id: "luong-state", level: "hard", kind: "concept",
      q: "Which decoder state does each classic attention use to score the source?",
      answer: "Bahdanau the previous state s_(i-1); Luong the current top-layer state h_t",
      wrong: ["Both use the final encoder state", "Bahdanau the current state; Luong the previous one", "Both use the embedding of the last output word"],
      why: "Bahdanau computes the context before the new state, and uses it to make that state. Luong first runs the decoder step, then attends with the new state and combines: tanh(W [c ; h_t])." },
    { id: "gradient-path", level: "hard", kind: "concept",
      q: "Why does attention also make long-range dependencies easier to learn, not just to represent?",
      answer: "The loss at each output has a direct path to every encoder state, so its gradient need not travel back through many recurrent steps",
      wrong: ["Softmax gradients are always larger than tanh gradients", "Attention removes the need for backpropagation", "It shortens the input sentence before encoding"],
      why: "Without attention, a gradient from output word 1 to source word 1 crosses the whole encoder chain and shrinks at every step. With attention it reaches h_1 in one hop, through the weight on it." },
    { id: "to-transformer", level: "medium", kind: "concept",
      q: "What step turned attention-based seq2seq into the transformer?",
      answer: "Dropping the RNNs and using attention within each sequence (self-attention) as well as between them",
      wrong: ["Replacing softmax with a sigmoid", "Using a larger context vector", "Adding a third RNN between encoder and decoder"],
      why: "If words can reach each other directly, recurrence is no longer needed to carry information, and removing it lets every position run in parallel. That is the subject of the next stage." },
    { id: "weight-count", level: "easy", kind: "numeric",
      q: `A source of ${PN} words is translated into ${PM} words. How many attention weights are computed?`,
      answer: n0(PN * PM), wrong: [n0(PN + PM), n0(PM), n0(PN * PM * 2)],
      why: `${PM} decoder steps, each with ${PN} weights: ${n0(PN * PM)}. Each row of ${PN} sums to 1.` },
    { id: "context-by-hand", level: "medium", kind: "numeric",
      q: `Weights [${AW.join(", ")}] over encoder states ${AH.map((h) => `[${h.join(", ")}]`).join(", ")}. What is the context vector?`,
      answer: py(ctx), wrong: [py([1, 1]), py([AW[0], AW[1]]), py([ctx[1], ctx[0]])],
      why: `Weighted sum, one slot at a time: first slot ${AW.map((w, j) => `${w} × ${AH[j][0]}`).join(" + ")} = ${Number(ctx[0].toFixed(2))}; second slot ${AW.map((w, j) => `${w} × ${AH[j][1]}`).join(" + ")} = ${Number(ctx[1].toFixed(2))}.` },
    { id: "winner", level: "easy", kind: "output",
      q: "Scores for the source words while writing \"chat\". What does this print?",
      code: `import math\nwords = ${JSON.stringify(OUT_WORDS)}\nscores = [${OUT_S.join(", ")}]\ne = [math.exp(s) for s in scores]\nw = [x / sum(e) for x in e]\ni = w.index(max(w))\nprint(words[i], round(w[i], 2))`,
      answer: `${OUT_WORDS[top]} ${Number(ow[top].toFixed(2))}`,
      wrong: [`${OUT_WORDS[top]} ${OUT_S[top]}`, `${OUT_WORDS[0]} ${Number(ow[0].toFixed(2))}`, `${OUT_WORDS[top]} 1.0`],
      why: `Softmax of [${OUT_S.join(", ")}] gives ${ow.map((x) => x.toFixed(2)).join(", ")}. "${OUT_WORDS[top]}" wins with ${ow[top].toFixed(2)}, not 1: the other words still get some weight, which is what makes attention soft and differentiable.` },
    { id: "explain-bahdanau", level: "hard", kind: "explain",
      q: "Explain how Bahdanau attention works at one decoder step.",
      answer: "1. The encoder, a bidirectional RNN, has produced a state h_j for every source word.\n2. Take the decoder's previous state s_(i-1).\n3. Score each source word: e_j = v · tanh(W s_(i-1) + U h_j).\n4. Softmax the scores over the source: weights α_j that sum to 1.\n5. Context c_i = Σ α_j h_j.\n6. The decoder uses c_i, the previous word and s_(i-1) to compute its new state s_i and predict the next word.\n\nEverything is differentiable, so the scorer learns where to look from the translation loss alone, with no alignment labels." },
    { id: "vs-self", level: "medium", kind: "explain",
      q: "How does Bahdanau attention differ from the self-attention in transformers?",
      answer: "- **Between or within:** Bahdanau attention goes from decoder to encoder (cross-attention). Self-attention lets each token attend to tokens of its own sequence.\n- **Score:** additive, a small network, against scaled dot products of learned queries and keys.\n- **Around it:** Bahdanau's model is still built on RNNs, so steps run in order. The transformer drops recurrence and runs all positions at once, adding position information instead.\n- **Shared idea:** soft weights from a softmax, and a weighted sum of vectors." },
    { id: "cost", level: "medium", kind: "explain",
      q: "Attention fixed the bottleneck. What did it cost, and what problems remained?",
      answer: `- **Cost:** one weight per (output, source) pair, ${n0(PN * PM)} for ${PN} source and ${PM} target words, plus storing every encoder state.\n- **Still sequential:** encoder and decoder are RNNs, so training steps through each sentence in order and cannot use all positions at once.\n- **Inside each sequence**, words still reach each other only through the recurrence.\n\nSelf-attention in the transformer removed both remaining limits.` },
    { id: "trap-sum-one", level: "easy", kind: "trap",
      claim: "In Bahdanau attention, the weights at one decoder step sum to 1 over the source positions.",
      truth: true,
      why: `They come from a softmax over the source, so the context is a weighted average of encoder states. A side effect is dilution: with a score lead of ${GAP} for the right word, its weight is ${right(DN1).toFixed(2)} among ${DN1} words but ${right(DN2).toFixed(2)} among ${DN2}.` },
    { id: "trap-no-rnn", level: "medium", kind: "trap",
      claim: "Bahdanau's 2014 attention model removed the RNN encoder, keeping only attention.",
      truth: false,
      why: "Its encoder was a bidirectional RNN and its decoder an RNN; attention was added between them. Removing recurrence entirely came in 2017 with the transformer." },
  ],
  real: [
    { who: "Dzmitry Bahdanau, Kyunghyun Cho and Yoshua Bengio", when: "2014",
      what: "\"Neural Machine Translation by Jointly Learning to Align and Translate\" conjectured that the fixed-length vector is a bottleneck for encoder-decoder models. It let the model softly search the source for the parts relevant to each target word, and reached results comparable to the leading phrase-based system on English to French. In its tests the basic encoder-decoder dropped sharply on long sentences, while the attention model trained on sentences up to 50 words showed no drop on sentences of 50 or more.",
      takeaway: "Attention was invented to fix a measured weakness, and the fix showed most on long inputs.",
      url: "https://arxiv.org/abs/1409.0473" },
    { who: "Minh-Thang Luong, Hieu Pham and Christopher Manning", when: "2015",
      what: "\"Effective Approaches to Attention-based Neural Machine Translation\" compared global attention, over all source words, with local attention over a window. Local attention gained 5.0 BLEU over non-attentional systems, and an ensemble reached 25.9 BLEU on WMT'15 English to German.",
      takeaway: "It named the dot, general and concat scores that are still used to describe attention variants.",
      url: "https://arxiv.org/abs/1508.04025" },
  ],
};

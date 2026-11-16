// Stage 3, module 1: why a model for sequences must see order. Every number below is computed here.
import type { GModule } from "../../types.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);

// bag of words: two sentences with the same words in a different order
const A = ["dog", "bites", "man"], B = ["man", "bites", "dog"];
const counts = (ws: string[]) => ws.reduce<Record<string, number>>((c, w) => ((c[w] = (c[w] ?? 0) + 1), c), {});
const cosine = (a: Record<string, number>, b: Record<string, number>) => {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const dot = keys.reduce((s, k) => s + (a[k] ?? 0) * (b[k] ?? 0), 0);
  const norm = (x: Record<string, number>) => Math.sqrt(Object.values(x).reduce((s, v) => s + v * v, 0));
  return dot / (norm(a) * norm(b));
};
const pairs = (ws: string[]) => ws.slice(1).map((w, i) => `${ws[i]} ${w}`);
const bowSim = cosine(counts(A), counts(B)), biSim = cosine(counts(pairs(A)), counts(pairs(B)));
// feature counts for n-grams
const V = 10_000;
// a fixed window MLP
const [K, D, H] = [5, 100, 200], windowW = K * D * H;
// an RNN's weights for the same sizes, for the compare table
const rnnW = D * H + H * H;
// the agreement example: "keys ... are"
const KEYS = ["the", "keys", "to", "the", "old", "cabinet", "are"], gap = KEYS.length - 1 - KEYS.indexOf("keys");
const WIN = 3;
// output: Counter equality
const SENT = ["not", "bad", "good"];

export const WHY_ORDER_MATTERS: GModule = {
  id: "why-order-matters",
  stage: 3,
  title: "Why order matters",
  hook: "\"Dog bites man\" and \"man bites dog\" use the same three words. Only the order tells you who is in trouble, so a model for language must read order.",
  blocks: [
    { kind: "figure", id: "s3-bag", caption: "Counted as a bag, the two sentences are identical. Counted as neighbouring pairs, they share nothing. The order holds the meaning." },
    { kind: "text", md: `**Order is information.** A bag of words throws it away: both sentences above give the vector dog 1, bites 1, man 1, so their cosine similarity is ${r2(bowSim)}. Counting word pairs (bigrams) brings some order back, and there the similarity is ${r2(biSim)}.\n\nBut every fix that stores order as extra input slots runs into size limits. The walk-through shows where.` },
    { kind: "flow", id: "s3-order" },
    {
      kind: "predict",
      q: `A bag-of-words model reads "${A.join(" ")}" and "${B.join(" ")}". What is the cosine similarity of their count vectors?`,
      answer: r2(bowSim), wrong: [r2(0), r2(1 / 3), r2(-1)],
      why: `Both vectors are [1, 1, 1] over the words dog, bites and man. Identical vectors have cosine ${r2(bowSim)}, so the model cannot tell the sentences apart, whatever it is trained on.`,
    },
    { kind: "play", id: "s3-window" },
    {
      kind: "mermaid",
      caption: "Four shapes of sequence task. Each one decides what the network reads and when it answers.",
      src: `flowchart TB
  subgraph R1[" "]
    direction LR
    Q1(["many in, one out"]) --> A1["review to sentiment"]:::ok
  end
  subgraph R2[" "]
    direction LR
    Q2(["one in, many out"]) --> A2["image to caption"]:::ok
  end
  subgraph R3[" "]
    direction LR
    Q3(["many in, many out, aligned"]) --> A3["a tag for every word"]:::hot
  end
  subgraph R4[" "]
    direction LR
    Q4(["many in, many out, lengths differ"]) --> A4["translation"]:::warn
  end
  R1 ~~~ R2
  R2 ~~~ R3
  R3 ~~~ R4`,
    },
    {
      kind: "compare",
      head: ["Approach", "Sees order?", "Any length?", "Weights"],
      rows: [
        ["Bag of words", "No", "Yes", `${n0(V)} inputs for a ${n0(V)} word vocabulary`],
        ["Bigram counts", "Only neighbours", "Yes", `${n0(V * V)} possible features`],
        [`Window of ${K} words into an MLP`, `Only inside the ${K} words`, "No, cut to the window", `${n0(windowW)} in the first layer (d = ${D}, h = ${H})`],
        ["Recurrent net (next module)", "Yes, step by step", "Yes", `${n0(rnnW)} at the same sizes, for any length`],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
from collections import Counter

def vec(counter, vocab):
    return np.array([counter[w] for w in vocab], dtype=float)

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

a = "dog bites man".split()
b = "man bites dog".split()

# 1. bag of words: order is gone
vocab = sorted(set(a) | set(b))
print("bag of words:", round(cosine(vec(Counter(a), vocab), vec(Counter(b), vocab)), 2))

# 2. neighbouring pairs keep some order
bi = lambda ws: Counter(zip(ws, ws[1:]))
pairs = sorted(set(bi(a)) | set(bi(b)))
print("bigrams:     ", round(cosine(vec(bi(a), pairs), vec(bi(b), pairs)), 2))

# 3. a fixed window sees only its last k words
sentence = "the keys to the old cabinet are".split()
k = 3
print("window sees:", sentence[-k - 1:-1], "but the subject is", sentence[1])

assert cosine(vec(Counter(a), vocab), vec(Counter(b), vocab)) > 0.999
assert cosine(vec(bi(a), pairs), vec(bi(b), pairs)) == 0
`,
    },
    { kind: "text", md: "**What we want instead:** read one token at a time, keep a running summary of the past, and use the same weights at every step. Then the model handles any length, a pattern learned at position 3 also works at position 30, and the weight count does not grow with the sentence. That is a recurrent network, the next module." },
  ],
  keyPoints: [
    "Word order carries meaning: a bag of words gives \"dog bites man\" and \"man bites dog\" the same vector.",
    "n-gram counts keep local order, but the number of possible features grows as V to the power n.",
    "A fixed window MLP sees only k words, needs separate weights per slot, and cannot take longer input.",
    "Sequence tasks come in shapes: many to one, one to many, many to many aligned, and many to many with different lengths.",
    "The chain rule writes any sequence probability exactly as a product of next-token probabilities, which is how language models are trained.",
  ],
  questions: [
    { id: "bow-loses", level: "easy", kind: "concept",
      q: "Which text representation cannot tell \"dog bites man\" from \"man bites dog\"?",
      answer: "A bag of words (word counts)", wrong: ["Bigram counts", "A recurrent network reading word by word", "A list of word ids in order"],
      why: "A bag of words keeps only how often each word appears. Bigram counts see \"dog bites\" against \"man bites\", and anything that reads in order sees the difference directly." },
    { id: "shape-sentiment", level: "easy", kind: "concept",
      q: "Classifying a movie review as positive or negative is which kind of sequence task?",
      answer: "Many in, one out", wrong: ["One in, many out", "Many in, many out, aligned", "Many in, many out, with different lengths"],
      why: "The whole review is read, and a single label comes out at the end. Captioning is one in, many out; tagging every word is aligned many to many." },
    { id: "shape-tagging", level: "medium", kind: "concept",
      q: "Part-of-speech tagging gives one tag per input word. Which shape is it?",
      answer: "Many to many, aligned: one output per input step", wrong: ["Many to one: one tag for the sentence", "Many to many with an encoder and decoder, since lengths differ", "One to many: one word gives many tags"],
      why: "The output has exactly as many items as the input, in the same order, so each step can emit its tag as it reads. Translation needs an encoder and decoder because the lengths differ." },
    { id: "shape-translate", level: "medium", kind: "concept",
      q: "Why does translation not fit the aligned many-to-many shape?",
      answer: "The output length differs from the input length, and word order can change",
      wrong: ["Translation outputs one label per sentence", "The input is an image, not a sequence", "Aligned models cannot use word embeddings"],
      why: "\"the black cat\" becomes \"le chat noir\": same length here, but the adjective moves, and other sentences change length. That is why translation reads the whole input first, then writes the output (the seq2seq module)." },
    { id: "share-weights", level: "medium", kind: "concept",
      q: "Why do sequence models use the same weights at every time step?",
      answer: "A pattern like \"not good\" means the same wherever it appears, and the weight count stays fixed for any length",
      wrong: ["It makes each step compute faster on a GPU", "It is required for the softmax to sum to 1", "It stops the model from overfitting to word frequencies"],
      why: "Shared weights let what was learned at one position work at every position, and the model can read sequences longer than any seen in training. A window MLP has separate weights per slot, so it must learn the same pattern again in each slot." },
    { id: "chain-rule", level: "hard", kind: "concept",
      q: "Which is the exact factorisation of P(x1, x2, x3) that a left-to-right language model learns?",
      answer: "P(x1) P(x2 | x1) P(x3 | x1, x2)",
      wrong: ["P(x1) P(x2) P(x3)", "P(x1) P(x2 | x1) P(x3 | x2)", "P(x3 | x1, x2) P(x1, x2 | x3)"],
      why: "The chain rule is exact: each token is conditioned on everything before it. Dropping x1 from the last term is the Markov (bigram) approximation, and the plain product assumes the words are independent." },
    { id: "window-reach", level: "hard", kind: "concept",
      q: `A model predicts "is" or "are" from a window of the last ${WIN} words. In "${KEYS.join(" ")}", what goes wrong?`,
      answer: `The subject "keys" is ${gap} words back, outside the window, so the model cannot see it is plural`,
      wrong: ["Nothing: the window always contains the subject", "The model sees \"keys\" but cannot count it", "The softmax over the vocabulary is too large"],
      why: `The window holds only "${KEYS.slice(-1 - WIN, -1).join(" ")}". Agreement depends on a word ${gap} steps back. Long-range links like this are why models need a memory that is not cut to a fixed width.` },
    { id: "bigram-features", level: "easy", kind: "numeric",
      q: `A vocabulary has ${n0(V)} words. How many possible bigram (word pair) features are there?`,
      answer: n0(V * V), wrong: [n0(2 * V), n0(V), n0((V * (V - 1)) / 2)],
      why: `Any of ${n0(V)} words can be followed by any of ${n0(V)}: ${n0(V)} × ${n0(V)} = ${n0(V * V)}. Order matters, so "dog bites" and "bites dog" are different pairs. Trigrams would give ${n0(V ** 3)}.` },
    { id: "window-params", level: "medium", kind: "numeric",
      q: `An MLP reads a window of ${K} words, each a ${D} number embedding, into a hidden layer of ${H}. How many weights are in that first layer (ignore biases)?`,
      answer: n0(windowW), wrong: [n0(D * H), n0(K * D + H), n0(K * H)],
      why: `The ${K} embeddings are concatenated into ${K * D} inputs, each wired to ${H} hidden units: ${K * D} × ${H} = ${n0(windowW)}. Double the window and this doubles. An RNN at the same sizes uses ${n0(rnnW)} weights for any length.` },
    { id: "counter-eq", level: "easy", kind: "output",
      q: "What does this print?",
      code: `from collections import Counter\na = "${SENT.join(" ")}".split()\nb = "${[...SENT].reverse().join(" ")}".split()\nprint(Counter(a) == Counter(b), a == b)`,
      answer: "True False", wrong: ["False False", "True True", "False True"],
      why: `The two Counters hold the same words with the same counts, so they are equal. The lists keep order, and "${SENT.join(" ")}" is not "${[...SENT].reverse().join(" ")}". A model that only sees the Counter cannot tell a mild review from a harsh one.` },
    { id: "why-not-mlp", level: "medium", kind: "explain",
      q: "Why is a plain MLP over a fixed window a poor model for language?",
      answer: `- **Fixed length:** it sees only the last k words. Anything further back, like a subject ${gap} words earlier, is invisible.\n- **No sharing across positions:** each slot has its own weights, so a pattern learned in slot 1 must be learned again in slot 3.\n- **Cost grows with the window:** the first layer has k × d × h weights, ${n0(windowW)} at k = ${K}, d = ${D}, h = ${H}.\n\nA recurrent net fixes all three: one set of weights, applied step by step, with a state that carries the past.` },
    { id: "timeseries-split", level: "medium", kind: "explain",
      q: "You have three years of daily sales and want to test a forecasting model. Why is a random train/test split wrong?",
      answer: "Order matters in time too. A random split puts days from the future into training, so the model learns from information it would never have in real use. Its test score looks better than it will be.\n\nSplit by time instead: train on the earlier period, test on the later one. For tuning, use rolling or expanding windows, always training on the past and testing on what follows." },
    { id: "four-shapes", level: "hard", kind: "explain",
      q: "Describe the main shapes of sequence task, with an example of each and the model that suits it.",
      answer: "- **Many to one:** read a whole sequence, output one label. Sentiment, spam detection. Use the final state, or a pooled state.\n- **One to many:** one input, a generated sequence. Image captioning. A decoder that generates step by step.\n- **Many to many, aligned:** one output per input step. Part-of-speech tagging, named entity tagging. Emit at every step; a bidirectional reader helps because the next words matter too.\n- **Many to many, different lengths:** translation, summarisation. An encoder reads all the input, a decoder writes the output (seq2seq), later with attention." },
    { id: "trap-chain-exact", level: "hard", kind: "trap",
      claim: "Writing P(sentence) as a product of next-token probabilities, each conditioned on all earlier tokens, is exact and needs no assumption.",
      truth: true,
      why: "That is the chain rule of probability, true for any distribution. The approximation comes only when a model limits how much of the past it can use, as an n-gram model or a fixed window does." },
    { id: "trap-padding", level: "medium", kind: "trap",
      claim: "Padding every input to the same length lets an MLP treat a pattern the same way wherever it appears in the sentence.",
      truth: false,
      why: "Padding fixes the input size, not the sharing. Each position still has its own weights, so \"not good\" at slot 2 and at slot 9 are learned separately. Shared weights across steps (recurrence, convolution or attention) are what make a pattern position independent." },
  ],
  real: [
    { who: "Jeffrey Elman", when: "1990",
      what: "The paper \"Finding Structure in Time\" argued against giving time a spatial representation, where each moment is one slot of a long input vector. It listed the problems: the input must be buffered, there is a rigid limit on pattern length, and the same pattern shifted by a step looks like a different vector. It proposed feeding the hidden unit patterns back to the network as a memory instead.",
      takeaway: "The objections to fixed windows in this module are the ones that led to the simple recurrent network.",
      url: "https://www.coli.uni-saarland.de/~crocker/Teaching/Connectionist/CogSci90-Elman.pdf" },
  ],
};

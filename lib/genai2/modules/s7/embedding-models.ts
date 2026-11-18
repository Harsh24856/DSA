// Stage 7: embedding models. How a text becomes one vector, how the encoder is trained, and what the vectors cost.
// Every number below is computed here or in s7.calc.ts.
import type { GModule } from "../../types.ts";
import { cosine, indexBytes, infoNCE, trainPairs } from "../../stages/s7.calc.ts";

const r2 = (x: number) => x.toFixed(2);
const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// predict: temperature and the loss floor
const hot = trainPairs(1, [300])[0], cold = trainPairs(0.2, [300])[0];
// numeric: index size
const [IN, ID] = [5e6, 768], indexGB = indexBytes(IN, ID, 32) / 1e9, int8GB = indexBytes(IN, ID, 8) / 1e9;
// numeric: in-batch negatives
const BATCH = 256;
// output: normalise then dot equals cosine
const VA = [3, 4], VB = [4, 3], cosAB = cosine(VA, VB);
// numeric: InfoNCE loss of one question when the right passage has the same score as every wrong one
const flatLoss = Math.log(4);
const flat = infoNCE([[1, 0]], [[1, 0]], 1).loss;
if (Math.abs(flat) > 1e-12) throw new Error("one-pair InfoNCE must be 0");

export const EMBEDDING_MODELS: GModule = {
  id: "embedding-models",
  stage: 7,
  title: "Embedding models",
  hook: "Retrieval is only as good as the vectors. An embedding model is trained so that a question lands next to the passage that answers it. Builds on [[rag-ingest]], the cosine similarity from [[text-as-numbers]] and softmax from [[loss-gradient-descent]].",
  blocks: [
    { kind: "play", id: "s7-contrastive" },
    { kind: "text", md: "**Contrastive training.** Take pairs that belong together: a question and its answer, a title and its article. In a batch, each question's own passage is the positive and every other passage is a free negative. The InfoNCE loss is cross-entropy over the similarities, divided by a temperature: pull the positive close, push the rest away." },
    {
      kind: "predict",
      q: "Train the same pairs at temperature 0.2 and at 1.0 until nothing moves. Which ends with the lower loss?",
      answer: `Temperature 0.2 (about ${r2(cold.loss)} against ${r2(hot.loss)})`,
      wrong: ["Temperature 1.0, because larger temperatures train faster", "Both reach 0 once the pairs line up", "Neither: the loss does not depend on temperature"],
      why: `Similarities are divided by the temperature before the softmax. At 1.0 a cosine of 1 against -0.33 is only a small gap, so even a perfect layout keeps a loss of ${r2(hot.loss)}. At 0.2 the same gap is 5 times larger and the loss falls to ${r2(cold.loss)}.`,
    },
    { kind: "flow", id: "s7-infonce" },
    { kind: "figure", id: "s7-pooling", caption: "One vector per token comes out of the encoder. Pooling turns them into one vector for the whole text; normalising it to length 1 makes the dot product a cosine." },
    {
      kind: "compare",
      head: ["Pooling", "How", "Seen in"],
      rows: [
        ["Mean", "average every token's vector", "most sentence encoders"],
        ["First token", "use a special token's vector, like CLS", "BERT-style models"],
        ["Last token", "use the final token's vector", "decoder-based embedders"],
      ],
    },
    { kind: "play", id: "s7-index-size" },
    { kind: "text", md: "**Choosing a model.** The MTEB benchmark covers 8 task types over 58 datasets and 112 languages, and its authors found no single method best at all of them. Look at the retrieval scores in your language and domain, then test on your own questions. Fine-tune on your pairs when the domain has its own words." },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def info_nce(q, p, tau):
    q = q / np.linalg.norm(q, axis=1, keepdims=True)   # unit vectors: dot = cosine
    p = p / np.linalg.norm(p, axis=1, keepdims=True)
    s = q @ p.T / tau                                  # every question against every passage
    s = s - s.max(axis=1, keepdims=True)
    logp = s - np.log(np.exp(s).sum(axis=1, keepdims=True))
    return -np.mean(np.diag(logp))                     # the right passage is on the diagonal

rng = np.random.default_rng(0)
q = rng.normal(size=(8, 16))
good = q + 0.1 * rng.normal(size=q.shape)              # passages close to their questions
bad = rng.normal(size=q.shape)                         # passages unrelated to them
lo, hi = info_nce(q, good, 0.1), info_nce(q, bad, 0.1)
print(f"aligned pairs {lo:.3f}, random pairs {hi:.3f}")
assert lo < 0.1 < hi`,
    },
  ],
  keyPoints: [
    "An embedding model is an encoder plus pooling: one vector for a whole text, usually normalised so dot product equals cosine.",
    "It is trained contrastively: pull each question towards its passage and away from the batch's other passages, with InfoNCE and a temperature.",
    "More in-batch negatives and hard negatives (close but wrong) make the model sharper.",
    "Index memory is chunks × dimensions × bytes: quantise to int8 or binary, or cut Matryoshka vectors, then rescore with full vectors.",
    "Pick from a benchmark like MTEB, then decide on your own eval set; fine-tune on in-domain pairs when needed.",
  ],
  questions: [
    { id: "why-normalise", level: "easy", kind: "concept",
      q: "Why are embeddings usually normalised to length 1?",
      answer: "So a plain dot product equals cosine similarity, which is fast and ignores vector length",
      wrong: ["So the vectors take less memory", "Because the encoder cannot output large numbers", "So that every dimension has the same value"],
      why: "For unit vectors, a · b = cos θ. Vector databases can then use a fast inner product, and a longer text does not win just because its vector is longer." },
    { id: "in-batch", level: "medium", kind: "concept",
      q: `With a batch of ${BATCH} question and passage pairs, how many negatives does each question get from in-batch training?`,
      answer: String(BATCH - 1), wrong: [String(BATCH), "1", String(BATCH * (BATCH - 1))],
      why: `Every passage in the batch except its own is a negative: ${BATCH} - 1 = ${BATCH - 1}. They come for free, which is why contrastive training likes big batches.` },
    { id: "hard-neg", level: "hard", kind: "concept",
      q: "What is a hard negative, and why add them?",
      answer: "A passage that looks relevant but does not answer the question; it teaches fine distinctions random negatives cannot",
      wrong: ["A negative with a very long text, to teach length", "A duplicate of the positive, to stabilise training", "A passage in another language, to teach translation"],
      why: "Random negatives are easy to push away, so the loss soon stops teaching. A near miss, often found by retrieving with BM25 or an earlier model, forces the encoder to learn what really matches." },
    { id: "temp-role", level: "medium", kind: "concept",
      q: "What does a lower temperature do in the InfoNCE loss?",
      answer: "It sharpens the softmax, so small gaps in similarity count for more",
      wrong: ["It slows the learning rate", "It adds more negatives", "It shortens the vectors"],
      why: "Similarities are divided by the temperature. A small temperature magnifies gaps, so the loss focuses on the closest wrong passages; too small makes training unstable." },
    { id: "pooling-q", level: "easy", kind: "concept",
      q: "An encoder returns 12 token vectors for a sentence. How does mean pooling make one embedding?",
      answer: "Averages the 12 vectors, dimension by dimension",
      wrong: ["Keeps the vector of the longest word", "Joins the 12 vectors end to end", "Picks the vector with the largest length"],
      why: "Mean pooling is a column-wise average, so the output keeps the model's dimension whatever the sentence length. It is then usually normalised." },
    { id: "index-gb", level: "medium", kind: "numeric",
      q: `How much memory do ${n0(IN)} chunk vectors of ${ID} dimensions take at float32, before any index structure?`,
      answer: `${indexGB.toFixed(2)} GB`, wrong: [`${int8GB.toFixed(2)} GB`, `${(indexGB * 2).toFixed(2)} GB`, `${(indexBytes(IN, ID, 16) / 1e9).toFixed(2)} GB`],
      why: `${n0(IN)} × ${ID} numbers × 4 bytes = ${indexGB.toFixed(2)} GB. At int8 it would be ${int8GB.toFixed(2)} GB.` },
    { id: "loss-floor", level: "hard", kind: "numeric",
      q: "One question, four passages in the batch, and the model gives all four exactly the same similarity. What is the InfoNCE loss for that question (natural log)?",
      answer: r2(flatLoss), wrong: ["0", "1.00", r2(Math.log(3))],
      why: `Equal scores make the softmax 1/4 for each passage, so the loss is -ln(1/4) = ln 4 = ${r2(flatLoss)}. That is where an untrained model starts.` },
    { id: "cos-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np
a, b = np.array(${JSON.stringify(VA)}), np.array(${JSON.stringify(VB)})
a, b = a / np.linalg.norm(a), b / np.linalg.norm(b)
print(round(float(a @ b), 2))`,
      answer: r2(cosAB), wrong: ["24", "1.0", "0.5"],
      why: `After normalising, a = (0.6, 0.8) and b = (0.8, 0.6), so a · b = 0.48 + 0.48 = ${r2(cosAB)}. Without normalising the dot product would be 24.` },
    { id: "explain-train", level: "medium", kind: "explain",
      q: "Explain how a text embedding model is trained.",
      answer: "Start from a pretrained encoder. Collect pairs that should match, such as a question and the passage that answers it. In each batch, embed all questions and passages, compute every question's similarity to every passage, divide by a temperature and apply softmax cross-entropy with the matching passage as the target. That pulls true pairs together and pushes the other passages, the in-batch negatives, away. Hard negatives, passages that look right but are not, make it sharper." },
    { id: "explain-choose", level: "hard", kind: "explain",
      q: "How would you choose an embedding model for a RAG system over legal contracts?",
      answer: "Shortlist models from a public benchmark like MTEB by retrieval score, language and size, but do not trust the leaderboard alone, because no model wins every task. Build 100 or so real questions with the clauses that answer them and measure recall@k for each candidate. Weigh dimension and speed against the budget, since the index is chunks × dimensions × bytes. If generic models miss legal wording, fine-tune on in-domain pairs with hard negatives, then re-embed the corpus." },
    { id: "explain-shrink", level: "medium", kind: "explain",
      q: "Your vector index no longer fits in memory. What can you do without changing the documents?",
      answer: "Quantise the vectors to int8 or binary and rescore the top results with full vectors; cut dimensions if the model was trained Matryoshka-style; use a smaller embedding model; or move to a disk-based or compressed index such as product quantisation. Measure recall on an eval set after each change." },
    { id: "trap-dims", level: "medium", kind: "trap",
      claim: "An embedding model with more dimensions always retrieves better.",
      truth: false,
      why: "Training data and method matter more than size, and the MTEB authors found no one method best across tasks. More dimensions cost memory and speed; Matryoshka training shows a vector can often be cut a lot at little loss." },
    { id: "trap-matryoshka", level: "hard", kind: "trap",
      claim: "A Matryoshka-trained embedding can be cut to its first few hundred numbers and still be useful.",
      truth: true,
      why: "Matryoshka training makes the first dimensions carry the coarse meaning, so prefixes work as smaller embeddings. Its paper reports up to 14 times smaller embeddings for image classification at the same accuracy." },
  ],
  real: [
    { who: "The MTEB authors", when: "2022", what: "Built a benchmark of 8 embedding tasks over 58 datasets and 112 languages, and found that no text embedding method dominates across all tasks.", takeaway: "Check a model on tasks like yours, not only its overall rank.", url: "https://arxiv.org/abs/2210.07316" },
    { who: "The Matryoshka Representation Learning authors", when: "2022", what: "Trained embeddings whose prefixes are usable, coarse-to-fine, with up to 14 times smaller embeddings for ImageNet-1K classification at the same accuracy.", takeaway: "Shorter vectors can be nearly free if the model was trained for it.", url: "https://arxiv.org/abs/2205.13147" },
  ],
};

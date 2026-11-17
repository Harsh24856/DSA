// Stage 7: finding the nearest chunks to a question, exactly and then approximately. Every number below is computed here or in s7.calc.ts.
import type { GModule } from "../../types.ts";
import { cosine, hnswLayers } from "../../stages/s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);

// output: cosine of two short vectors
const [VA, VB] = [[3, 4], [4, 3]], cos34 = cosine(VA, VB);
// numeric: HNSW layer sizes (each node reaches layer l with chance M^-l)
const [HN, HM] = [1_000_000, 16], layers = hnswLayers(HN, HM);
// numeric: raw memory at float32 and binary
const [MN, MD] = [10_000_000, 1024], f32 = (MN * MD * 4) / 1e9, bin = (MN * MD) / 8 / 1e9;
// trap: unit vectors, squared distance against cosine
const u = [0.6, 0.8], w = [1, 0], dist2 = (u[0] - w[0]) ** 2 + (u[1] - w[1]) ** 2, cuw = cosine(u, w);

export const VECTOR_SEARCH: GModule = {
  id: "vector-search",
  stage: 7,
  title: "Vector search (cosine, ANN, HNSW)",
  hook: "A question becomes a vector, and the answer is hiding among millions of other vectors. Finding the closest few, fast enough for a chat, takes a clever index and one honest trade.",
  blocks: [
    { kind: "flow", id: "s7-cosine" },
    { kind: "text", md: "**Similar meaning, small angle.** The question is embedded with the same model as the chunks, and the chunks whose vectors point most nearly the same way win. Cosine similarity measures that angle: 1 for the same direction, 0 for unrelated, negative for opposite. Store unit-length vectors and a plain dot product gives the same ranking for less work." },
    {
      kind: "predict",
      q: "Every stored vector and the query have length 1. You rank by dot product instead of cosine similarity. What changes?",
      answer: "Nothing: the scores and the order are identical",
      wrong: ["Long documents now rank higher", "The order reverses, so you must sort ascending", "Scores change but the top result stays the same"],
      why: "Cosine is the dot product divided by both lengths. With every length equal to 1 the division does nothing, so the two are the same number for every pair.",
    },
    { kind: "lab", id: "vector" },
    { kind: "text", md: `**Exact search reads everything.** Comparing the query with every vector is simple and perfect, and fine up to perhaps a few hundred thousand vectors. Beyond that, indexes look at a small part of the data and accept missing a few true neighbours. Their quality is measured as recall@k: the share of the true top k they return.` },
    { kind: "figure", id: "s7-hnsw-layers", caption: "HNSW keeps a few nodes on the upper layers with long links, and every node on the bottom one. The search hops greedily toward the query, then drops a layer when no neighbour is closer." },
    { kind: "flow", id: "g-hnsw" },
    { kind: "play", id: "s7-vec-memory" },
    {
      kind: "compare",
      head: ["Index", "How a query is answered", "Trade"],
      rows: [
        ["Flat", "Score every vector", "Exact, but time grows with every vector added"],
        ["HNSW", "Greedy hops through a layered graph", "Fast and high recall; the graph lives in memory"],
        ["IVF", "Score only the few clusters nearest the query", "Fewer reads; misses neighbours in clusters it skips"],
        ["IVF + PQ", "IVF over compressed codes, then re-score the best", "Tiny memory; distances are approximate"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

rng = np.random.default_rng(0)
centres = rng.normal(size=(40, 32))
X = centres[rng.integers(0, 40, 20000)] + 0.6 * rng.normal(size=(20000, 32))
X /= np.linalg.norm(X, axis=1, keepdims=True)           # unit length: dot = cosine
q = X[123] + 0.3 * rng.normal(size=32)
q /= np.linalg.norm(q)

exact = np.argsort(-(X @ q))[:10]                       # flat search: score every vector

# IVF: group vectors under 64 cells, then search only the nprobe cells nearest the query
cells = X[rng.choice(len(X), 64, replace=False)]
for _ in range(5):                                      # a few rounds of k-means
    owner = np.argmax(X @ cells.T, axis=1)
    cells = np.array([X[owner == c].mean(axis=0) if np.any(owner == c) else cells[c] for c in range(64)])
    cells /= np.linalg.norm(cells, axis=1, keepdims=True)
owner = np.argmax(X @ cells.T, axis=1)

order = np.argsort(-(cells @ q))
recalls = []
for nprobe in [1, 2, 4, 8, 64]:
    cand = np.where(np.isin(owner, order[:nprobe]))[0]
    top = cand[np.argsort(-(X[cand] @ q))[:10]]
    recalls.append(len(set(top) & set(exact)) / 10)
    print(f"nprobe {nprobe:2d}: scanned {len(cand) / len(X):6.1%}, recall@10 {recalls[-1]:.1f}")

assert all(a <= b for a, b in zip(recalls, recalls[1:]))   # more cells, never worse
assert recalls[-1] == 1.0                                  # every cell: exact again
`,
    },
  ],
  keyPoints: [
    "Cosine similarity compares direction, not length; with unit-length vectors, dot product and distance give the same order.",
    "Exact (flat) search scores every vector: perfect, but its cost grows with the collection.",
    "Approximate indexes read a small part of the data and are judged by recall@k against exact search.",
    "HNSW walks a layered graph greedily from sparse upper layers down to the full bottom layer; a bigger candidate list (ef) buys recall with time.",
    "Quantising vectors (int8, binary, PQ) cuts memory many times over; re-score the best candidates with full vectors.",
  ],
  questions: [
    { id: "cosine-is", level: "easy", kind: "concept",
      q: "What does cosine similarity between two embeddings measure?",
      answer: "How closely they point the same way, ignoring their lengths",
      wrong: ["The straight-line distance between their tips", "How many numbers the two vectors share exactly", "The difference in their lengths"],
      why: "Cosine is the dot product divided by both lengths, so it depends only on the angle. That suits embeddings, where direction carries the meaning." },
    { id: "why-ann", level: "easy", kind: "concept",
      q: "Why do vector databases use approximate nearest neighbour search?",
      answer: "Scoring the query against every one of millions of vectors is too slow per request",
      wrong: ["Exact search gives wrong answers for high dimensions", "Approximate search is more accurate than exact search", "Embeddings are only approximate, so exact search is not allowed"],
      why: "Exact search is perfectly accurate but reads every vector on every query. Approximate indexes read a small part and miss a few true neighbours, a trade you measure with recall@k." },
    { id: "ef", level: "medium", kind: "concept",
      q: "In HNSW, you raise ef, the size of the candidate list kept during a query. What happens?",
      answer: "Recall goes up and each query gets slower",
      wrong: ["Recall goes down and queries get faster", "The index must be rebuilt first", "Memory use of the index doubles"],
      why: "A longer candidate list explores more of the bottom layer before stopping, so fewer true neighbours are missed, at the cost of more distance computations. It is a query-time knob; no rebuild is needed." },
    { id: "m-links", level: "hard", kind: "concept",
      q: "The HNSW paper calls M, the number of links per node, the only meaningful build parameter left for the user. What does a larger M cost?",
      answer: "More memory, since memory use grows in proportion to M",
      wrong: ["Nothing; larger M is always better", "Lower recall on high-dimensional data", "It forces exact search on the bottom layer"],
      why: "Each node stores M links per layer, so memory grows with M. The paper reports larger M helps high recall and high-dimensional data, while smaller M suits lower recall or lower dimensions." },
    { id: "post-filter", level: "hard", kind: "concept",
      q: "After adding a strict filter (one team's documents, about 1% of the index), searches often return 0 to 2 results. The filter runs after the top 10 come back. Why?",
      answer: "The index returns its global top 10 first, and the filter then removes almost all of them",
      wrong: ["The filter corrupts the vectors it touches", "HNSW cannot store metadata", "Cosine similarity is undefined for filtered vectors"],
      why: "Post-filtering keeps only the matches among results chosen without the filter. Filter during the search, ask for far more candidates when filters are strict, or keep a separate index per team." },
    { id: "pq", level: "medium", kind: "concept",
      q: "What does product quantisation (PQ) do to a stored vector?",
      answer: "Cuts it into pieces and replaces each piece with the id of its nearest learned centroid",
      wrong: ["Rounds every number to 0 or 1", "Removes the dimensions with the smallest values", "Stores only the vector's length and direction angle"],
      why: "A long float vector becomes a few bytes of centroid ids. Distances come from small lookup tables, fast but approximate, so systems re-score the best candidates with the full vectors." },
    { id: "layer-size", level: "medium", kind: "numeric",
      q: `In HNSW a node reaches layer l or higher with chance M to the power -l. With ${n0(HN)} vectors and M = ${HM}, about how many nodes are on layer 2?`,
      answer: n0(layers[2]), wrong: [n0(layers[1]), n0(HN / (2 * HM)), n0(layers[3])],
      why: `${n0(HN)} / ${HM}² = ${n0(HN)} / ${HM * HM} ≈ ${n0(layers[2])}. The layers go ${layers.map(n0).join(", ")}: each is about ${HM} times smaller, which is why a search needs only a few hops per layer.` },
    { id: "memory", level: "medium", kind: "numeric",
      q: `${n0(MN)} vectors of ${MD} numbers. How much memory as 4-byte floats, and as 1 bit per number?`,
      answer: `${f32.toFixed(1)} GB and ${r2(bin)} GB`,
      wrong: [`${f32.toFixed(1)} GB and ${(f32 / 4).toFixed(1)} GB`, `${(f32 / 8).toFixed(1)} GB and ${r2(bin / 8)} GB`, `${(f32 * 8).toFixed(1)} GB and ${r2(bin * 4)} GB`],
      why: `${n0(MN)} × ${MD} × 4 bytes = ${f32.toFixed(1)} GB. One bit each is ${MD} / 8 = ${MD / 8} bytes per vector, ${r2(bin)} GB in all, 32 times smaller. ${(f32 / 4).toFixed(1)} GB is int8, one byte per number.` },
    { id: "cos-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\na = np.array([${VA.join(", ")}])\nb = np.array([${VB.join(", ")}])\nprint(round(float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b))), 2))`,
      answer: r2(cos34), wrong: [String(VA[0] * VB[0] + VA[1] * VB[1]), "1.0", r2(1 - cos34)],
      why: `Dot product ${VA[0]}×${VB[0]} + ${VA[1]}×${VB[1]} = ${VA[0] * VB[0] + VA[1] * VB[1]}, and both lengths are ${Math.hypot(VA[0], VA[1])}, so ${VA[0] * VB[0] + VA[1] * VB[1]} / ${Math.hypot(VA[0], VA[1]) * Math.hypot(VB[0], VB[1])} = ${r2(cos34)}: nearly the same direction. ${VA[0] * VB[0] + VA[1] * VB[1]} is the raw dot product before dividing.` },
    { id: "hnsw-walk", level: "medium", kind: "explain",
      q: "How does an HNSW search find neighbours?",
      answer: "The index is a stack of graphs. Every vector is on the bottom layer; each higher layer holds a random, much smaller subset with longer links.\n\nA query starts at an entry point on the top layer and hops greedily to whichever neighbour is closer to it. When no neighbour is closer, it drops to the next layer and continues from there. On the bottom layer it keeps a candidate list of size ef and returns the best k. Only a tiny part of the data is touched, which is why it is fast, and why it can occasionally miss a true neighbour." },
    { id: "which-metric", level: "medium", kind: "explain",
      q: "Cosine, dot product or Euclidean distance: which should a RAG system use?",
      answer: "Use the one the embedding model was trained with, as its documentation says.\n\nIn practice most text embeddings are compared by cosine. If you normalise every vector to length 1 when you store it, then dot product equals cosine and squared distance equals 2 - 2 × cosine, so all three give the same order. Then use dot product, which is the cheapest to compute." },
    { id: "fit-ram", level: "hard", kind: "explain",
      q: "100 million chunks, 1,024 numbers each. The raw floats do not fit in memory. What are your options?",
      answer: "- Quantise: int8 is 4 times smaller with little loss; binary is 32 times smaller.\n- Use product quantisation for even smaller codes.\n- Search the compressed vectors for a few hundred candidates, then re-score them with the full floats kept on disk.\n- Use a disk-based graph index that keeps only compressed vectors in memory.\n- Shrink the vectors: some models are trained so the first part of each vector works on its own.\n- Shard across machines if latency allows.\n\nMeasure recall@k against exact search on a sample at every step." },
    { id: "trap-exact", level: "easy", kind: "trap",
      claim: "HNSW always returns the exact nearest neighbours.",
      truth: false,
      why: "It is an approximate method: greedy hops can stop near, but not at, a true neighbour. Its recall is usually high and grows with ef, but it is measured, not guaranteed." },
    { id: "trap-unit", level: "hard", kind: "trap",
      claim: "For vectors of length 1, the squared distance between them equals 2 minus 2 times their cosine similarity.",
      truth: true,
      why: `|a - b|² = |a|² + |b|² - 2 a·b = 1 + 1 - 2 cos. For [${u.join(", ")}] and [${w.join(", ")}]: cosine ${r2(cuw)}, squared distance ${r2(dist2)} = 2 - 2 × ${r2(cuw)}.` },
  ],
  real: [
    { who: "Yu. A. Malkov and D. A. Yashunin", when: "2016",
      what: "Their paper introduced Hierarchical Navigable Small World graphs. Each element's top layer is drawn at random with a chance that falls steeply per layer, so upper layers are sparse with long links, and a search works down from the top. They show logarithmic scaling, give a reasonable range of 5 to 48 for M, and note that memory grows in proportion to M.",
      takeaway: "Most vector databases' default index is a graph you walk, not a table you scan.",
      url: "https://arxiv.org/abs/1603.09320" },
  ],
};

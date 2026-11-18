// Stage 7: keyword search and vector search together, fused by rank, then reranked. Every number below is computed here or in s7.calc.ts.
import type { GModule } from "../../types.ts";
import { bm25, cosine, DOC_TOKENS, DOCS, idf, recallAt, rrf, tok } from "../../stages/s7.calc.ts";

const f4 = (x: number) => x.toFixed(4);
const r2 = (x: number) => x.toFixed(2);

// the hybrid demo (the same numbers as the Python block): a query with a code and a paraphrase
const HQ = "refund after error E-4021", QV = [0.4, 0.9, 0.0];
const EMB: Record<string, number[]> = { D1: [0.3, 0.9, 0.1], D2: [0.9, 0.2, 0.0], D3: [0.1, 0.95, 0.1], D4: [0.0, 0.1, 0.95], D5: [0.9, 0.3, 0.0], D6: [0.1, 0.8, 0.4] };
const REL = new Set(["D1", "D2"]);
const kwScores = bm25(tok(HQ), DOC_TOKENS);
const kw = DOCS.map(([id], i) => [id, kwScores[i]] as const).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([id]) => id);
const vec = Object.keys(EMB).sort((a, b) => cosine(QV, EMB[b]) - cosine(QV, EMB[a])).slice(0, 4);
const fused = rrf([kw, vec]).map(([id]) => id);
const [rKw, rVec, rHy] = [kw, vec, fused].map((l) => recallAt(l, REL, 2));
if (!(rHy > rKw && rHy > rVec)) throw new Error("hybrid-rerank: the demo must show fusion beating both lists");
// numeric: RRF score of rank 1 and rank 3
const [RA, RB, K] = [1, 3, 60], rrfAB = 1 / (K + RA) + 1 / (K + RB);
// numeric: idf of a term in 1 of 6 documents
const [IN, In] = [DOCS.length, 1], idf1 = idf(IN, In);
// trap: rank 3 in both against rank 1 in one
const both3 = 2 / (K + 3), one1 = 1 / (K + 1);
// output: fusion of two short lists
const OL = [["A", "B", "C"], ["C", "D", "A"]], oFused = rrf(OL).map(([id]) => id);

export const HYBRID_RERANK: GModule = {
  id: "hybrid-rerank",
  stage: 7,
  title: "Hybrid search and reranking",
  hook: "Vector search understands meaning but fumbles exact codes. Keyword search nails codes but misses paraphrases. Run both, merge by rank, then let a slower, sharper model put the best on top.",
  blocks: [
    { kind: "flow", id: "s7-bm25" },
    { kind: "text", md: "**Two searches, two blind spots.** BM25 rewards rare exact words, so it finds \"E-4021\" at once, but \"refund\" never matches \"money back\". Vector search matches meaning, so it links those two, but a code like E-4021 carries little meaning to embed. Hybrid search runs both and merges the lists." },
    {
      kind: "predict",
      q: "Users search for error codes like \"E-4021\" and a vector-only RAG returns chunks about other errors. What is the most direct fix?",
      answer: "Add keyword (BM25) search and fuse its results with the vector results",
      wrong: ["Switch to an embedding model with more dimensions", "Raise the number of chunks retrieved from 5 to 50", "Lower the temperature of the answering model"],
      why: "The code is a rare exact string. BM25 gives rare terms the highest weight, so the one chunk that contains it ranks first. A bigger embedding or more chunks still compares meaning, and temperature does not touch retrieval.",
    },
    { kind: "flow", id: "g-rrf" },
    { kind: "play", id: "s7-rrf" },
    { kind: "figure", id: "s7-bi-cross", caption: "A bi-encoder compares two vectors made apart, so chunk vectors are ready in advance. A cross-encoder reads both texts together: sharper, but it must run once for every candidate." },
    {
      kind: "mermaid",
      src: `flowchart TB
  Q["question"]:::hot --> K["keyword search: top 50"]
  Q --> V["vector search: top 50"]
  K --> F["fuse by rank: RRF"]
  V --> F
  F --> R["cross-encoder reranks the fused list"]:::warn
  R --> T["best 5 go into the prompt"]:::ok`,
      caption: "A retrieval funnel: cheap searches cast a wide net, fusion merges them, and the expensive reranker only sees a few dozen candidates.",
    },
    {
      kind: "code",
      run: true,
      src: `import math, re
import numpy as np

docs = {${DOCS.map(([id, t]) => `\n    "${id}": "${t}",`).join("")}
}
tok = lambda s: re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", s.lower())
D = {k: tok(v) for k, v in docs.items()}
avg = sum(map(len, D.values())) / len(D)

def bm25(query, k1=1.2, b=0.75):
    out = {}
    for d, words in D.items():
        s = 0.0
        for t in tok(query):
            f = words.count(t)
            if f:
                n = sum(t in w for w in D.values())
                idf = math.log(1 + (len(D) - n + 0.5) / (n + 0.5))
                s += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * len(words) / avg))
        out[d] = s
    return sorted((d for d in out if out[d] > 0), key=lambda d: -out[d])

# toy embeddings, 3 numbers each: [payment problem, refund or return, shipping]
E = {${Object.entries(EMB).map(([id, v]) => `"${id}": [${v.join(", ")}]`).join(", ")}}
def dense(qv, k=4):
    q = np.array(qv) / np.linalg.norm(qv)
    cos = {d: float(np.array(v) @ q / np.linalg.norm(v)) for d, v in E.items()}
    return sorted(cos, key=lambda d: -cos[d])[:k]

def rrf(lists, k=60):
    s = {}
    for l in lists:
        for r, d in enumerate(l, 1):
            s[d] = s.get(d, 0) + 1 / (k + r)
    return sorted(s, key=lambda d: (-s[d], d))

relevant = {"D1", "D2"}                      # what E-4021 means, and how refunds work
kw, vec = bm25("${HQ}"), dense([${QV.join(", ")}])
hy = rrf([kw, vec])
recall2 = lambda l: len(set(l[:2]) & relevant) / len(relevant)
print("keyword:", kw, "vector:", vec, "fused:", hy)
print("recall@2:", recall2(kw), recall2(vec), recall2(hy))
assert (recall2(kw), recall2(vec), recall2(hy)) == (${rKw}, ${rVec}, ${rHy})
`,
    },
    { kind: "text", md: `In this toy run, keyword search alone finds ${kw.join(", ")}, and vector search ranks ${vec.join(", ")}. Each gets recall@2 of ${r2(rKw)}. Fused, the top two are ${fused.slice(0, 2).join(" and ")}: recall@2 of ${r2(rHy)}. A reranker would then order those few by reading each one against the question.` },
  ],
  keyPoints: [
    "BM25 scores exact words, weighting rare terms most: strong on codes, names and IDs, blind to paraphrase.",
    "Vector search matches meaning but handles rare exact strings poorly; hybrid search runs both.",
    "Reciprocal rank fusion adds 1 / (k + rank) from each list, so it needs no score calibration; k = 60 is the usual default.",
    "A cross-encoder reranker reads question and chunk together: more accurate, but it runs once per pair, so only on the top few dozen.",
  ],
  questions: [
    { id: "bm25-good", level: "easy", kind: "concept",
      q: "Which query does BM25 keyword search handle better than vector search?",
      answer: "\"What does error E-4021 mean?\"",
      wrong: ["\"My laptop will not turn on\" against a document saying \"device fails to boot\"", "\"How do I get my money back?\" against a page titled \"Refunds\"", "A question in Spanish against English documents"],
      why: "BM25 rewards exact, rare terms, and an error code is exactly that. The other three need meaning to bridge different words, which is what embeddings do." },
    { id: "dense-good", level: "easy", kind: "concept",
      q: "Why does vector search find \"device fails to boot\" for the query \"laptop will not turn on\"?",
      answer: "Their embeddings are close because the meanings are close, though they share no words",
      wrong: ["Both contain the same rare keyword", "The vector database stems words to their roots", "Vector search matches the first letters of each word"],
      why: "An embedding model maps text to a point by meaning, so paraphrases land near each other. BM25 would score this pair 0: not one word matches." },
    { id: "why-rrf", level: "medium", kind: "concept",
      q: "Why fuse keyword and vector results by rank instead of adding their scores?",
      answer: "The scores are on different scales that shift with the data, while ranks are directly comparable",
      wrong: ["Ranks are more accurate than scores", "Adding scores is too slow for production", "BM25 scores are always negative"],
      why: "BM25 has no fixed upper bound and cosine sits between -1 and 1, so a raw sum lets one list drown the other. RRF uses only positions, so it needs no tuning of weights to start." },
    { id: "rerank-top", level: "medium", kind: "concept",
      q: "Why is a cross-encoder reranker run only on the top 30 to 50 candidates, not on the whole index?",
      answer: "It must run the model once per question and chunk pair, so scoring millions would be far too slow",
      wrong: ["It can only read 50 documents in total", "It is less accurate than the first-stage search on big lists", "Its scores are only valid for the top 50"],
      why: "Nothing about a pair can be computed ahead of time, because the model reads both texts together. So it reranks a short list that cheaper searches already narrowed down." },
    { id: "idf-rare", level: "medium", kind: "concept",
      q: "In BM25, which query term gets the largest weight (idf)?",
      answer: "The one that appears in the fewest documents",
      wrong: ["The one that appears in the most documents", "The longest word in the query", "The first word of the query"],
      why: `idf = ln(1 + (N - n + 0.5) / (n + 0.5)) falls as n, the number of documents containing the term, rises. A term found everywhere tells you little about which document is the right one.` },
    { id: "bm25-b", level: "hard", kind: "concept",
      q: "In BM25, what happens if you set b = 0?",
      answer: "Document length is ignored: a match in a long document scores the same as in a short one",
      wrong: ["Every score becomes 0", "Only the first query term counts", "Repeated words stop counting at all"],
      why: "b controls length normalisation. At b = 0 the length term drops out; at b = 1 the score is fully scaled by length against the average. The default 0.75 sits in between. Saturation of repeats is set by k1, not b." },
    { id: "rrf-k", level: "hard", kind: "concept",
      q: "In RRF, what does a larger k do?",
      answer: "It shrinks the gap between ranks, so agreement across lists counts for more than one first place",
      wrong: ["It keeps only the top k results from each list", "It multiplies every score by k, changing nothing", "It makes the first list count k times more"],
      why: "Scores are 1 / (k + rank). With small k, rank 1 is worth far more than rank 5; with large k they are close, so a document both lists rank well collects more in total." },
    { id: "rrf-score", level: "easy", kind: "numeric",
      q: `With k = ${K}, a chunk is ranked ${RA} by keyword search and ${RB} by vector search. What is its RRF score, to 4 decimals?`,
      answer: f4(rrfAB), wrong: [f4(1 / (K + RA)), f4(1 / RA + 1 / RB), f4(2 / (K + RA + RB))],
      why: `1 / (${K} + ${RA}) + 1 / (${K} + ${RB}) = ${f4(1 / (K + RA))} + ${f4(1 / (K + RB))} = ${f4(rrfAB)}. Each list adds its own share.` },
    { id: "idf-num", level: "medium", kind: "numeric",
      q: `A collection has ${IN} documents and a term appears in ${In} of them. What is its BM25 idf, ln(1 + (N - n + 0.5) / (n + 0.5)), to 2 decimals?`,
      answer: r2(idf1), wrong: [r2(Math.log(IN / In)), r2((IN - In + 0.5) / (In + 0.5)), r2(idf(IN, IN))],
      why: `(${IN} - ${In} + 0.5) / (${In} + 0.5) = ${r2((IN - In + 0.5) / (In + 0.5))}; ln(1 + ${r2((IN - In + 0.5) / (In + 0.5))}) = ${r2(idf1)}. A term in every document would get only ${r2(idf(IN, IN))}.` },
    { id: "rrf-out", level: "medium", kind: "output",
      q: "Two ranked lists are fused with RRF. What does this print?",
      code: `lists = [${OL.map((l) => `[${l.map((x) => `"${x}"`).join(", ")}]`).join(", ")}]\nscore = {}\nfor l in lists:\n    for rank, d in enumerate(l, 1):\n        score[d] = score.get(d, 0) + 1 / (60 + rank)\nprint("".join(sorted(score, key=lambda d: (-score[d], d))))`,
      answer: oFused.join(""), wrong: ["CABD", "ABCD", "ACDB", "CADB"].filter((x) => x !== oFused.join("")).slice(0, 3),
      why: `A gets 1/61 + 1/63 and C gets 1/63 + 1/61, an exact tie, broken by name. B (1/62) and D (1/62) are each in one list only, so they come after both. Order: ${oFused.join(", ")}.` },
    { id: "why-hybrid", level: "medium", kind: "explain",
      q: "Why do production RAG systems use hybrid search instead of vector search alone?",
      answer: "Each search fails where the other is strong. Vector search bridges paraphrases (\"money back\" and \"refund\") but handles exact strings like product codes, error IDs and names poorly. BM25 nails those exact terms but scores a paraphrase 0.\n\nRunning both and fusing the lists, usually with RRF, catches both kinds of query. The extra cost is small: a keyword index next to the vector index and one merge step. Measure recall@k on code-style and meaning-style questions separately to see the gain." },
    { id: "bi-cross", level: "hard", kind: "explain",
      q: "Bi-encoder or cross-encoder: what is the difference, and where is each used?",
      answer: "A bi-encoder embeds the question and each chunk separately. Chunk vectors are computed once, offline, so search is a fast vector lookup. It is used for first-stage retrieval over the whole index.\n\nA cross-encoder reads the question and one chunk together and outputs one relevance score. Every word can attend to every other, so it judges relevance much better, but nothing can be precomputed: it runs once per pair. It is used to rerank the top few dozen candidates." },
    { id: "trap-add", level: "easy", kind: "trap",
      claim: "Adding a document's BM25 score to its cosine score is a reliable way to combine keyword and vector search.",
      truth: false,
      why: "BM25 is unbounded and cosine lies between -1 and 1, so the larger scale dominates the sum, and the balance shifts with each corpus and query. Rank fusion avoids this; weighted sums need normalisation and tuning first." },
    { id: "trap-both", level: "medium", kind: "trap",
      claim: `With RRF and k = ${K}, a document ranked 3rd in both lists beats one ranked 1st in only one list.`,
      truth: true,
      why: `3rd in both: 2 / ${K + 3} = ${f4(both3)}. 1st in one: 1 / ${K + 1} = ${f4(one1)}. Agreement wins by a wide margin; with this k it would win down to rank ${K + 1} in both.` },
  ],
  real: [
    { who: "Gordon V. Cormack, Charles L. A. Clarke and Stefan Büttcher", when: "2009",
      what: "Their SIGIR paper proposed reciprocal rank fusion: sort documents by the sum of 1 / (k + rank) over the input rankings, with k = 60 fixed after a pilot run. On TREC collections its MAP beat the best individual run and Condorcet Fuse every time, and CombMNZ in all but one case.",
      takeaway: "A formula with one constant and no training is a strong, safe default for merging search results.",
      url: "https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf" },
  ],
};

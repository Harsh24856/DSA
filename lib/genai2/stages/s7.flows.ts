// Stage 7 (RAG) animated walk-throughs. Every number is computed here or in s7.calc.ts.
import type { Flow, FlowTone, GridTable, LaneStep } from "../../other/flows.ts";
import { PAIRS, trainPairs } from "./s7.calc.ts";
import { B, bm25, chunkStarts, cosine, dcg, DOC_TOKENS, DOCS, dot, idf, K1, ndcg, norm, storedTokens, tok } from "./s7.calc.ts";

const n0 = (x: number) => Math.round(x).toLocaleString("en-US");

// rag-ingest: one corpus from files to stored vectors
export const INGEST = { docs: 2000, docLen: 6000, size: 500, overlap: 50, dims: 1024 };
function ingest(): Flow {
  const I = INGEST, per = chunkStarts(I.docLen, I.size, I.overlap).length, stored = storedTokens(I.docLen, I.size, I.overlap);
  const total = I.docs * per, mb = (total * I.dims * 4) / 1e6;
  return { title: "Ingest: from files to an index", steps: [
    { node: "parse: PDF, HTML, slides to text", note: "Keep headings and page numbers. Turn each table into Markdown rows, so a value stays next to its column name. Errors made here reach every later step.", tone: "warn" },
    { node: "clean: drop page furniture", note: "Headers, footers, menus and cookie banners repeat on every page. Left in, they add the same noise to every chunk." },
    { node: "split on headings first", note: "A section is a natural unit of meaning. Only sections that are still too long get cut further." },
    { node: `chunk: ${I.size} tokens, ${I.overlap} overlap`, note: `A ${n0(I.docLen)} token document becomes ${per} chunks holding ${n0(stored)} tokens, ${Math.round((stored / I.docLen - 1) * 100)}% more than the original because of the overlap.`, tone: "hot" },
    { node: "attach metadata", note: "Source, page, heading, date and who may read it. Citations, date filters and permission checks all depend on it." },
    { node: "embed every chunk", note: `${n0(I.docs)} documents × ${per} chunks = ${n0(total)} chunks, each turned into one vector of ${n0(I.dims)} numbers by the same embedding model.` },
    { node: "store vector, text, metadata", note: `As 4-byte floats the vectors take ${n0(total)} × ${n0(I.dims)} × 4 bytes = ${n0(mb)} MB. Keep a hash of each file, so a nightly run re-embeds only what changed.`, tone: "ok" },
  ] };
}

// vector-search: dot product against cosine, then normalising so they agree
export const COS = { q: [0.6, 0.8], docs: [["A", [3, 4]], ["B", [0.8, 0.6]], ["C", [9, 1]], ["D", [0, 1]]] as [string, number[]][] };
function cosineFlow(): Flow {
  const { q, docs } = COS, r2 = (x: number) => x.toFixed(2);
  const rows = docs.map(([id, v]) => ({ id, v, len: norm(v), dp: dot(q, v), cos: cosine(q, v) }));
  const byDot = [...rows].sort((a, b) => b.dp - a.dp), byCos = [...rows].sort((a, b) => b.cos - a.cos);
  const unit = (v: number[]) => v.map((x) => x / norm(v)), l2 = (v: number[]) => unit(v).reduce((s, x, i) => s + (x - q[i]) ** 2, 0);
  const T = (cols: string[], cell: (r: (typeof rows)[number]) => (string | number)[], tones?: Record<string, FlowTone>): GridTable =>
    ({ head: ["doc", ...cols], rows: rows.map((r) => [r.id, ...cell(r)]), tones });
  const at = (id: string) => String(rows.findIndex((r) => r.id === id));
  return { kind: "grid", title: `Ranking 4 vectors for the query [${q.join(", ")}]`, steps: [
    { note: `The query has length ${r2(norm(q))}. The documents point in different directions and have different lengths. C is the longest at ${r2(norm(docs[2][1]))}.`, tables: [T(["vector", "length"], (r) => [`[${r.v.join(", ")}]`, r2(r.len)])] },
    { note: `Plain dot product: ${byDot.map((r) => `${r.id} ${r2(r.dp)}`).join(", ")}. ${byDot[0].id} wins only because it is long, though it points away from the query.`, tone: "warn", tables: [T(["vector", "dot"], (r) => [`[${r.v.join(", ")}]`, r2(r.dp)], { [at(byDot[0].id)]: "warn" })] },
    { note: `Cosine divides by both lengths, so only the angle counts: ${byCos.map((r) => `${r.id} ${r2(r.cos)}`).join(", ")}. ${byCos[0].id} points the same way as the query and scores ${r2(byCos[0].cos)}.`, tone: "hot", tables: [T(["dot", "cosine"], (r) => [r2(r.dp), r2(r.cos)], { [at(byCos[0].id)]: "ok", ":2": "hot" })] },
    { note: "Scale every vector to length 1 when you store it. Then the dot product is the cosine, and squared distance is 2 - 2 × cosine: all three give the same order, and dot is the cheapest.", tone: "ok", tables: [T(["dot of unit", "distance²"], (r) => [r2(dot(q, unit(r.v))), r2(l2(r.v))], { [at(byCos[0].id)]: "ok" })] },
  ] };
}

// hybrid-rerank: BM25 by hand on the toy corpus
export const BM25_Q = "card declined e-4021";
function bm25Flow(): Flow {
  const q = tok(BM25_Q), N = DOCS.length, r2 = (x: number) => x.toFixed(2);
  const df = q.map((t) => DOC_TOKENS.filter((d) => d.includes(t)).length);
  const scores = bm25(q, DOC_TOKENS), order = DOCS.map(([id], i) => ({ id, s: scores[i], len: DOC_TOKENS[i].length, hits: q.filter((t) => DOC_TOKENS[i].includes(t)) })).sort((a, b) => b.s - a.s);
  const avg = DOC_TOKENS.reduce((s, d) => s + d.length, 0) / N, rare = q[df.indexOf(Math.min(...df))];
  const none = bm25(["refund"], DOC_TOKENS);
  if (none.some((x) => x > 0) || order[0].id !== "D2") throw new Error("s7-bm25: the walk-through no longer matches its text");
  const terms: GridTable = { label: `${N} documents`, head: ["term", "docs with it", "idf"], rows: q.map((t, i) => [t, df[i], r2(idf(N, df[i]))]), tones: { [String(q.indexOf(rare))]: "hot" } };
  const docs = (withScore: boolean, tones?: Record<string, FlowTone>): GridTable => ({ head: ["doc", "words", "matches", ...(withScore ? ["BM25"] : [])], rows: order.map((o) => [o.id, o.len, o.hits.join(", ") || "none", ...(withScore ? [r2(o.s)] : [])]), tones });
  return { kind: "grid", title: `BM25 for "${BM25_Q}"`, steps: [
    { note: `BM25 scores exact words. First, how rare is each query term? idf = ln(1 + (N - n + 0.5) / (n + 0.5)), with N = ${N} documents and n containing the term. "${rare}" is in only ${Math.min(...df)}, so it counts most.`, tone: "hot", tables: [terms] },
    { note: `Then, for each document, which query terms it holds and how long it is. The average is ${r2(avg)} words; longer documents are scaled down a little (b = ${B}), and repeats of a word add less and less (k1 = ${K1}).`, tables: [docs(false)] },
    { note: `Sum idf times the damped term count over the query terms: ${order.filter((o) => o.s > 0).map((o) => `${o.id} ${r2(o.s)}`).join(", ")}. ${order[0].id} holds the rare code and wins clearly.`, tone: "ok", tables: [docs(true, { "0": "ok" })] },
    { note: `The weakness: search for "refund" and every score is 0, because the documents say "refunds" and "money back". BM25 matches spellings, not meaning, so pair it with vector search.`, tone: "warn", tables: [{ head: ["doc", "BM25 for \"refund\""], rows: DOCS.map(([id], i) => [id, r2(none[i])]), tones: { ":1": "warn" } }] },
  ] };
}

// advanced-rag: retrieval as a tool the model calls until it has enough (lanes: model, your code, search)
export const AGENT_SEARCHES = ["Payments team suppliers", "2025 audit failures"];
function agentic(): Flow {
  const [s1, s2] = AGENT_SEARCHES;
  const steps: LaneStep[] = [
    { from: 1, to: 0, label: "question + search tool", note: "Your code sends the question and describes one tool: search(query) over the document index. The model decides whether and how to use it." },
    { from: 0, to: 1, label: `search("${s1.split(" ")[0]} ...")`, note: `The model splits the question. First it asks for "${s1}".`, tone: "hot" },
    { from: 1, to: 2, label: "hybrid search", note: "Your code runs the normal retrieval: keyword plus vector, fused and reranked." },
    { from: 2, to: 0, label: "contracts: A, B", note: "Two contract chunks come back: Supplier A and Supplier B serve the Payments team. Nothing about audits yet." },
    { from: 0, to: 1, label: `search("${s2.split(" ")[0]} ...")`, note: `The model sees a gap and searches again with a new query, "${s2}", built from what it just learned.`, tone: "hot" },
    { from: 1, to: 2, label: "hybrid search", note: "Your code runs the same retrieval again with the new query." },
    { from: 2, to: 0, label: "audit report: A, C", note: "The audit report says Supplier A and Supplier C failed. Joining the two results gives the answer." },
  ];
  const calls = steps.filter((s) => s.from === 0).length + 1;
  return { kind: "lanes", title: "Agentic RAG: search, read, search again", lanes: ["Model", "Your code", "Search"], steps: [...steps,
    { from: 0, to: 1, label: "answer: Supplier A", note: `It answers with both sources cited. That took ${calls} model calls and ${AGENT_SEARCHES.length} searches, against 1 and 1 for plain RAG: more cost and latency, bought for a question one search could not answer.`, tone: "ok" },
  ] };
}

// rag-evals: nDCG@5 by hand, with graded relevance 0 to 3
export const NDCG = { got: ["C4", "C1", "C9", "C2", "C7"], grade: { C1: 3, C2: 2, C3: 1, C4: 1 } as Record<string, number> };
function ndcgFlow(): Flow {
  const { got, grade } = NDCG, r2 = (x: number) => x.toFixed(2), g = got.map((d) => grade[d] ?? 0), all = Object.values(grade);
  const disc = got.map((_, i) => 1 / Math.log2(i + 2)), DCG = dcg(g), ideal = [...all].sort((a, b) => b - a).slice(0, got.length);
  const IDCG = dcg(ideal), score = ndcg(g, all), swapped = [g[1], g[0], ...g.slice(2)], better = ndcg(swapped, all);
  const T = (cols: ("discount" | "gain")[], tones?: Record<string, FlowTone>): GridTable => ({ label: "retrieved, best first", head: ["rank", "chunk", "grade", ...cols], rows: got.map((d, i) => [i + 1, d, g[i], ...cols.map((c) => (c === "discount" ? r2(disc[i]) : r2(g[i] * disc[i])))]), tones });
  const best = got.indexOf(Object.keys(grade).find((d) => grade[d] === Math.max(...all))!);
  return { kind: "grid", title: "nDCG@5 for one query", steps: [
    { note: `Recall treats every relevant chunk alike. Here a human graded them: 3 is the exact answer, 1 is related. ${got.filter((d) => grade[d]).length} of the 5 results have a grade above 0.`, tables: [T([])] },
    { note: `A result counts less the lower it sits: its grade is divided by log2(rank + 1). Rank 1 keeps it all, rank 2 keeps ${Math.round(disc[1] * 100)}%, rank 5 only ${Math.round(disc[4] * 100)}%.`, tone: "hot", tables: [T(["discount"], { ":3": "hot" })] },
    { note: `DCG adds the discounted grades: ${r2(DCG)}. The best possible order of the graded chunks, ${ideal.join(", ")}, would give ${r2(IDCG)} (the ideal DCG).`, tables: [T(["discount", "gain"], { ":4": "hot" }), { label: "ideal order", head: ["rank", "grade"], rows: ideal.map((x, i) => [i + 1, x]) }] },
    { note: `nDCG = ${r2(DCG)} / ${r2(IDCG)} = ${r2(score)}. The best chunk sits at rank ${best + 1}; swap the top two and nDCG rises to ${r2(better)}. Recall@5 cannot see that difference.`, tone: "ok", tables: [T(["gain"], { [String(best)]: "ok" }), { head: ["metric", "value"], rows: [["DCG", r2(DCG)], ["ideal DCG", r2(IDCG)], ["nDCG@5", r2(score)]], tones: { "2": "ok" } }] },
  ] };
}

// embedding-models: the InfoNCE loss for one question, number by number, before and after training
function infoNceSteps(): Flow {
  const TAU = 0.2, [s0, s1] = trainPairs(TAU, [0, 100]), q = 0, r2 = (x: number) => (x !== 0 && Math.abs(x) < 0.005 ? x.toExponential(1) : x.toFixed(2));
  const row = (snap: typeof s0) => {
    const sims = snap.p.map((p) => dot(snap.q[q], p)), sc = sims.map((x) => x / TAU), m = Math.max(...sc);
    const e = sc.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0), pr = e.map((x) => x / z);
    return { sims, sc, pr, loss: -Math.log(pr[q]) };
  };
  const a = row(s0), b = row(s1);
  const table = (r: ReturnType<typeof row>, cols: number): GridTable => ({
    head: ["cosine", "÷ τ", "softmax"].slice(0, cols - 1), rowHead: PAIRS,
    rows: PAIRS.map((_, j) => [r2(r.sims[j]), r2(r.sc[j]), r2(r.pr[j])].slice(0, cols - 1)),
    tones: { [`${q}`]: "hot" as FlowTone },
  });
  return { kind: "grid", title: `InfoNCE for the question "${PAIRS[q]}", τ = ${TAU}`, steps: [
    { note: `Compare the question with every passage in the batch. Its own passage, "${PAIRS[q]}", is the target; the other three are in-batch negatives.`, tables: [table(a, 2)] },
    { note: `Divide by the temperature τ = ${TAU}: every gap grows ${1 / TAU} times.`, tables: [table(a, 3)] },
    { note: `Softmax turns the scores into probabilities. The right passage gets ${r2(a.pr[q])}, so the loss -ln(${r2(a.pr[q])}) = ${r2(a.loss)}. Training moves the vectors to raise it.`, tone: "bad", tables: [table(a, 4)] },
    { note: `After 100 steps the right passage is closest and gets ${r2(b.pr[q])} of the probability: loss ${r2(b.loss)}.`, tone: "ok", tables: [table(b, 4)] },
  ] };
}

export const FLOWS_7: Record<string, Flow> = {
  "s7-infonce": infoNceSteps(),
  "s7-ndcg": ndcgFlow(),
  "s7-agentic": agentic(),
  "s7-bm25": bm25Flow(),
  "s7-ingest": ingest(),
  "s7-cosine": cosineFlow(),
};

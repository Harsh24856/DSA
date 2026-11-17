// Stage 7 (RAG): the retrieval maths shared by the flows, the walk-throughs and the module text. Client-safe: no module text here.

export const tok = (s: string) => s.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
export const norm = (a: number[]) => Math.sqrt(dot(a, a));
export const cosine = (a: number[], b: number[]) => dot(a, b) / (norm(a) * norm(b));

// fixed-size chunks with overlap: the start of each chunk; the last one is cut short at the end of the document
export function chunkStarts(n: number, size: number, overlap: number): number[] {
  if (overlap >= size) throw new Error("overlap must be smaller than the chunk size");
  const out: number[] = [];
  for (let s = 0; ; s += size - overlap) { out.push(s); if (s + size >= n) break; }
  return out;
}
export const storedTokens = (n: number, size: number, overlap: number) => chunkStarts(n, size, overlap).reduce((t, s) => t + Math.min(size, n - s), 0);

// BM25 with the usual k1 = 1.2, b = 0.75 and the idf that never goes negative: ln(1 + (N - n + 0.5) / (n + 0.5))
export const K1 = 1.2, B = 0.75;
export const idf = (N: number, n: number) => Math.log(1 + (N - n + 0.5) / (n + 0.5));
export function bm25(query: string[], docs: string[][], k1 = K1, b = B): number[] {
  const N = docs.length, avg = docs.reduce((s, d) => s + d.length, 0) / N;
  return docs.map((d) => query.reduce((s, t) => {
    const f = d.filter((w) => w === t).length;
    if (!f) return s;
    const n = docs.filter((x) => x.includes(t)).length;
    return s + idf(N, n) * (f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avg));
  }, 0));
}

// reciprocal rank fusion: each list gives a document 1 / (k + rank)
export function rrf(lists: string[][], k = 60): [string, number][] {
  const score = new Map<string, number>();
  for (const l of lists) l.forEach((d, i) => score.set(d, (score.get(d) ?? 0) + 1 / (k + i + 1)));
  return [...score].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// retrieval metrics for one query: got is best first, rel the set of relevant ids
export const recallAt = (got: string[], rel: Set<string>, k: number) => got.slice(0, k).filter((d) => rel.has(d)).length / rel.size;
export const precisionAt = (got: string[], rel: Set<string>, k: number) => got.slice(0, k).filter((d) => rel.has(d)).length / k;
export const rr = (got: string[], rel: Set<string>) => { const i = got.findIndex((d) => rel.has(d)); return i < 0 ? 0 : 1 / (i + 1); };
// DCG with linear gain: sum of grade / log2(rank + 1)
export const dcg = (grades: number[]) => grades.reduce((s, g, i) => s + g / Math.log2(i + 2), 0);
export const ndcg = (grades: number[], all: number[] = grades) => { const ideal = dcg([...all].sort((a, b) => b - a).slice(0, grades.length)); return ideal ? dcg(grades) / ideal : 0; };

// HNSW: a node reaches layer l or higher with chance M^-l (level = floor(-ln(u) / ln M)), so layer l holds about N / M^l nodes
export const hnswLayers = (N: number, M: number) => { const out: number[] = []; for (let l = 0; N / M ** l >= 1; l++) out.push(Math.round(N / M ** l)); return out; };

// Wilson 95% interval for a rate measured on n questions
export function wilson(p: number, n: number, z = 1.96) {
  const d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)] as const;
}

// The toy help-centre corpus used across the stage.
export const DOCS: [string, string][] = [
  ["D1", "Refunds are paid back to the original card within 5 working days."],
  ["D2", "Error E-4021 means the payment card was declined by the bank."],
  ["D3", "To get your money back, open Orders and choose Return item."],
  ["D4", "Shipping is free on orders above 50 dollars."],
  ["D5", "A declined card can be retried once the bank approves the payment."],
  ["D6", "Return labels can be printed from the Orders page for 30 days."],
];
export const DOC_TOKENS = DOCS.map(([, t]) => tok(t));

// Stage 5 (Training LLMs) animated walk-throughs. Client-safe: types only. Every number is computed here.
import type { Flow, GridTable } from "../../other/flows.ts";

const r2 = (x: number) => x.toFixed(2);
const r3 = (x: number) => x.toFixed(3);

// Pretraining: the next-token loss for one short sentence, with made-up model probabilities.
function nextToken(): Flow {
  const words = ["the", "cat", "sat", "on", "the", "mat"], p = [0.2, 0.35, 0.6, 0.7, 0.45];
  const nll = p.map((x) => -Math.log(x)), loss = nll.reduce((a, b) => a + b, 0) / nll.length, ppl = Math.exp(loss);
  const T = (showP: boolean, showL: boolean, tones?: GridTable["tones"]): GridTable => ({
    head: ["input", "target", "p", "-ln p"],
    rows: p.map((x, i) => [words[i], words[i + 1], showP ? r2(x) : "", showL ? r2(nll[i]) : ""]), tones,
  });
  const worst = nll.indexOf(Math.max(...nll)), best = nll.indexOf(Math.min(...nll));
  return { kind: "grid", title: "The pretraining loss, one sentence", steps: [
    { note: "Raw text needs no labels. Shift it by one: the target at each position is simply the next token.", tables: [T(false, false, { ":1": "hot" })] },
    { note: "The model gives a probability to every token in its vocabulary. Column p is what it gave the right next token.", tables: [T(true, false, { ":2": "hot" })] },
    { note: `The loss at one position is -ln p. "${words[worst + 1]}" got only ${r2(p[worst])}, so it costs ${r2(nll[worst])}; "${words[best + 1]}" got ${r2(p[best])} and costs ${r2(nll[best])}.`, tone: "warn",
      tables: [T(true, true, { [`${worst}:3`]: "bad", [`${best}:3`]: "ok" })] },
    { note: `Average the positions: loss = ${r2(loss)}. Perplexity = e^loss = ${r2(ppl)}, as unsure as a fair pick among ${r2(ppl)} tokens. A causal mask lets all positions train in one pass.`, tone: "ok",
      tables: [T(true, true), { head: ["loss", "perplexity"], rows: [[r3(loss), r2(ppl)]], tones: { "0": "ok" } }] },
  ] };
}

// Data pipelines: exact hashing misses a near copy; shingles, Jaccard and MinHash catch it.
const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const pairs = (t: string) => { const w = t.split(" "); return [...new Set(w.slice(0, -1).map((x, i) => `${x} ${w[i + 1]}`))]; };
function minhash(): Flow {
  const docA = "the cat sat on the mat today", docB = "the cat sat on the red mat today", K = 8;
  const A = pairs(docA), B = pairs(docB), all = [...new Set([...A, ...B])];
  const shared = all.filter((s) => A.includes(s) && B.includes(s)).length, jac = shared / all.length;
  const sig = (S: string[]) => Array.from({ length: K }, (_, k) => Math.min(...S.map((s) => fnv(`${k + 1}:${s}`))));
  const sa = sig(A), sb = sig(B), same = sa.map((x, i) => x === sb[i]), est = same.filter(Boolean).length / K;
  // the table shows the last 3 digits; they must never look equal when the full hashes differ
  sa.forEach((x, i) => { if (!same[i] && x % 1000 === sb[i] % 1000) throw new Error("s5-minhash: shown hashes collide"); });
  const exact: GridTable = { head: ["page", "words", "exact hash"], rows: [["A", docA.split(" ").length, fnv(docA) % 100000], ["B", docB.split(" ").length, fnv(docB) % 100000]], tones: { ":2": "bad" } };
  const sh = (tones?: GridTable["tones"]): GridTable => ({ head: ["word pair", "in A", "in B"], rows: all.map((s) => [s, A.includes(s) ? "yes" : "", B.includes(s) ? "yes" : ""]), tones });
  const both = Object.fromEntries(all.flatMap((s, i) => (A.includes(s) && B.includes(s) ? [[String(i), "ok" as const]] : [])));
  const mh: GridTable = { head: ["hash", "min A", "min B", "same"], rows: sa.map((x, i) => [i + 1, x % 1000, sb[i] % 1000, same[i] ? "yes" : "no"]),
    tones: Object.fromEntries(same.map((s, i) => [`${i}:3`, s ? "ok" as const : "bad" as const])) };
  return { kind: "grid", title: "Catching a near-duplicate page", steps: [
    { note: `Page A: "${docA}". Page B adds one word. Their exact hashes share nothing, so exact dedup keeps both.`, tone: "bad", tables: [exact] },
    { note: `Cut each page into overlapping word pairs (shingles). A has ${A.length}, B has ${B.length}; ${shared} appear in both.`, tables: [sh(both)] },
    { note: `Jaccard similarity = shared / all distinct = ${shared} / ${all.length} = ${r2(jac)}. The pages are mostly the same text.`, tone: "hot",
      tables: [{ head: ["shared", "all distinct", "Jaccard"], rows: [[shared, all.length, r2(jac)]], tones: { ":2": "hot" } }] },
    { note: `Comparing every pair of billions of pages is too slow. MinHash keeps, for each of ${K} hash functions, the smallest hash in each page. Last 3 digits shown.`, tables: [mh] },
    { note: `Two minimums match with probability equal to the Jaccard similarity. ${same.filter(Boolean).length} of ${K} match, an estimate of ${r2(est)} against the true ${r2(jac)}. More hash functions tighten it. Above the threshold, keep one page.`, tone: "ok",
      tables: [{ head: ["MinHash estimate", "true Jaccard"], rows: [[r2(est), r2(jac)]], tones: { "0": "ok" } }] },
  ] };
}

export const FLOWS_5: Record<string, Flow> = {
  "s5-next-token": nextToken(),
  "s5-minhash": minhash(),
};

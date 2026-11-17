// Stage 4 animated walk-throughs, plus the small client-safe helpers its figures, walk-throughs and modules share.
// Every number shown is computed here.
import type { Bar, Flow, GridTable } from "../../other/flows.ts";
import { seededRng } from "../rng.ts";

const r2 = (x: number) => x.toFixed(2);
export const softmax = (s: number[]) => { const m = Math.max(...s), e = s.map((x) => Math.exp(x - m)), z = e.reduce((a, b) => a + b, 0); return e.map((x) => x / z); };

/* ---------- BPE ---------- */
// A tiny word-count corpus; "_" marks the end of a word, so "low_" (a whole word) differs from "low" inside "lower".
export const CORPUS: [string, number][] = [["low", 5], ["lower", 2], ["lowest", 3], ["slow", 2], ["new", 4], ["newer", 2], ["newest", 4]];
export type BpeWord = { w: string; n: number; toks: string[] };
export type BpeFrame = { words: BpeWord[]; merge?: { a: string; b: string; count: number } };

/** Classic BPE training: count adjacent pairs weighted by word count, merge the most frequent (ties: first seen), repeat. */
export function bpeTrain(corpus: [string, number][], merges: number): BpeFrame[] {
  let words: BpeWord[] = corpus.map(([w, n]) => ({ w, n, toks: [...w, "_"] }));
  const frames: BpeFrame[] = [{ words }];
  for (let m = 0; m < merges; m++) {
    const pairs = new Map<string, number>();
    for (const { n, toks } of words) for (let i = 0; i + 1 < toks.length; i++) { const k = toks[i] + " " + toks[i + 1]; pairs.set(k, (pairs.get(k) ?? 0) + n); }
    let best = "", count = 0;
    for (const [k, c] of pairs) if (c > count) { best = k; count = c; }
    if (!best) break;
    const [a, b] = best.split(" ");
    words = words.map((wd) => ({ ...wd, toks: mergePair(wd.toks, a, b) }));
    frames.push({ words, merge: { a, b, count } });
  }
  return frames;
}
export const mergePair = (toks: string[], a: string, b: string) => {
  const out: string[] = [];
  for (let i = 0; i < toks.length; i++) if (i + 1 < toks.length && toks[i] === a && toks[i + 1] === b) { out.push(a + b); i++; } else out.push(toks[i]);
  return out;
};
/** Encode a new word by applying the learned merges in the order they were learned. */
export const bpeEncode = (word: string, frames: BpeFrame[]) => frames.slice(1).reduce((t, f) => mergePair(t, f.merge!.a, f.merge!.b), [...word, "_"]);
export const corpusTokens = (f: BpeFrame) => f.words.reduce((s, w) => s + w.n * w.toks.length, 0);
export const BPE_STEPS = 8;
const BPE = bpeTrain(CORPUS, BPE_STEPS);
const baseVocab = new Set(CORPUS.flatMap(([w]) => [...w, "_"])).size;

function bpeFlow(): Flow {
  const T = (i: number): GridTable => {
    const f = BPE[i], m = f.merge, made = m ? m.a + m.b : "";
    const tones: GridTable["tones"] = {};
    f.words.forEach((w, r) => { if (made && w.toks.includes(made)) tones[`${r}:2`] = "hot"; });
    return { head: ["word", "count", "pieces"], rows: f.words.map((w) => [w.w, w.n, w.toks.join(" ")]), tones };
  };
  const size = (i: number): GridTable => ({ head: ["vocab size", "corpus tokens"], rows: [[baseVocab + i, corpusTokens(BPE[i])]] });
  return { kind: "grid", title: "Training BPE, one merge at a time", steps: BPE.map((f, i) => ({
    note: i === 0
      ? `Start from single characters: a vocabulary of ${baseVocab} symbols, and ${corpusTokens(f)} tokens to cover the corpus. Count every adjacent pair, weighted by how often its word appears.`
      : `Merge ${i}: "${f.merge!.a}" + "${f.merge!.b}" appears ${f.merge!.count} times, the most of any pair, so "${f.merge!.a + f.merge!.b}" becomes a new token.${i === BPE.length - 1 ? " Frequent words are now one or two tokens; the rule list is the tokenizer." : ""}`,
    tone: i === 0 ? undefined : i === BPE.length - 1 ? "ok" : "hot",
    tables: [T(i), size(i)],
  })) };
}

/* ---------- sinusoidal positions and RoPE ---------- */
export const sinusoid = (pos: number, d: number) => Array.from({ length: d }, (_, j) => { const i = Math.floor(j / 2), a = pos / 10000 ** ((2 * i) / d); return j % 2 ? Math.cos(a) : Math.sin(a); });
/** Rotate each pair (x[2i], x[2i+1]) by pos / base^(2i/d). */
export const rope = (x: number[], pos: number, base = 10000) => {
  const d = x.length, out = x.slice();
  for (let i = 0; i < d / 2; i++) { const a = pos / base ** ((2 * i) / d), c = Math.cos(a), s = Math.sin(a); out[2 * i] = x[2 * i] * c - x[2 * i + 1] * s; out[2 * i + 1] = x[2 * i] * s + x[2 * i + 1] * c; }
  return out;
};
export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

function embedFlow(): Flow {
  const words = ["the", "dog", "saw", "the"], vocab = ["the", "dog", "saw"], ids = words.map((w) => 17 + 40 * vocab.indexOf(w)), d = 4;
  const rng = seededRng("s4-embed"), table = vocab.map(() => Array.from({ length: d }, () => Math.round((rng() * 2 - 1) * 100) / 100));
  const emb = words.map((w) => table[vocab.indexOf(w)]), pe = words.map((_, p) => sinusoid(p, d)), sum = emb.map((e, p) => e.map((v, j) => v + pe[p][j]));
  const head = ["token", "pos", "d1", "d2", "d3", "d4"];
  const T = (rows: number[][], label: string, tones?: GridTable["tones"]): GridTable => ({ label, head, rows: rows.map((v, p) => [words[p], p, ...v.map(r2)]), tones });
  return { kind: "grid", title: "Token ids to vectors, plus position", steps: [
    { note: `The tokenizer gives ids. "the" is id ${ids[0]} both times it appears. An id is only a row number.`, tables: [{ head: ["token", "pos", "id"], rows: words.map((w, p) => [w, p, ids[p]]) }] },
    { note: `The embedding layer looks up row ${ids[0]}, ${ids[1]} and so on in a vocab by d table of learned numbers. Both "the" rows are identical.`, tone: "warn", tables: [T(emb, "embedding rows", { "0": "warn", "3": "warn" })] },
    { note: `Sinusoidal positions: pair i of position p is sin and cos of p / 10000^(2i/d). Position 0 is always [0, 1, 0, 1].`, tone: "hot", tables: [T(pe, "position vectors", { ":2": "hot", ":3": "hot" })] },
    { note: `Add them. The two "the" rows now differ, so later layers can tell position 0 from position 3. RoPE instead leaves these vectors alone and rotates q and k inside attention.`, tone: "ok", tables: [T(sum, "embedding + position", { "0": "ok", "3": "ok" })] },
  ] };
}

/* ---------- multi-head shapes and masks ---------- */
export const MHA = { T: 10, d: 512, h: 8 };
function mhaFlow(): Flow {
  const { T, d, h } = MHA, dh = d / h;
  return { title: "Multi-head attention, shape by shape", steps: [
    { node: `x: (${T}, ${d})`, note: `${T} tokens, each a ${d} number vector from the layer below.` },
    { node: `Q, K, V: (${T}, ${d}) each`, note: `Three learned ${d} by ${d} matrices make queries, keys and values for every token.` },
    { node: `split: (${h}, ${T}, ${dh})`, note: `Cut each ${d} wide row into ${h} slices of ${dh}. Each slice belongs to one head.`, tone: "hot" },
    { node: `scores: (${h}, ${T}, ${T})`, note: `Every head runs its own attention: its own ${T} by ${T} weights, its own idea of what matters.` },
    { node: `outputs: (${h}, ${T}, ${dh})`, note: `Each head mixes its own value slices.` },
    { node: `concat: (${T}, ${d})`, note: `Glue the ${h} slices back side by side: ${h} x ${dh} = ${d}.` },
    { node: `x W_O: (${T}, ${d})`, note: `W_O, ${d} by ${d}, mixes what the heads found. The result is added back to x.`, tone: "ok" },
  ] };
}

function padFlow(): Flow {
  // left padding, as in batched generation: the pads come first, so the causal mask alone does not hide them
  const a = ["I", "like", "tea"], b = ["pad", "pad", "Hi"], real = [false, false, true], n = 3, np = real.filter((x) => !x).length;
  const right = ["Hi", "pad", "pad"], realR = [true, false, false];
  const cell = (ok: boolean) => (ok ? "0" : "-inf");
  const M = (f: (i: number, j: number) => boolean): (string | number)[][] => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => cell(f(i, j))));
  const tones = (f: (i: number, j: number) => boolean): GridTable["tones"] => { const t: GridTable["tones"] = {}; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!f(i, j)) t[`${i}:${j}`] = "bad"; return t; };
  const pad = (_: number, j: number) => real[j], causal = (i: number, j: number) => j <= i, both = (i: number, j: number) => pad(i, j) && causal(i, j);
  const G = (f: (i: number, j: number) => boolean, label: string, h = b): GridTable => ({ label, head: h, rowHead: h, rows: M(f), tones: tones(f) });
  const hi = n - 1, seenByHi = (f: (i: number, j: number) => boolean) => Array.from({ length: n }, (_, j) => j).filter((j) => f(hi, j) && !real[j]).length;
  const rightHiPads = Array.from({ length: n }, (_, j) => j).filter((j) => causal(0, j) && !realR[j]).length;
  return { kind: "grid", title: "Padding and causal masks together", steps: [
    { note: `A batch must be a rectangle. For generation, short prompts are padded on the left, so every row ends on a real token and the next token goes straight after it. "Hi" gets ${np} pads in front.`, tables: [{ head: ["", "1", "2", "3"], rows: [["row 1", ...a], ["row 2", ...b]], tones: Object.fromEntries(real.flatMap((r, j) => (r ? [] : [[`1:${j + 1}`, "warn"]]))) as GridTable["tones"] }] },
    { note: `Causal mask alone: query i may read keys up to i. The pads come before "Hi", so it leaves them open: "Hi" would mix in ${seenByHi(causal)} pads.`, tone: "warn", tables: [G(causal, "causal mask, row 2")] },
    { note: "Padding mask: no query may read a pad key, so pad columns get minus infinity before softmax.", tone: "hot", tables: [G(pad, "padding mask, row 2")] },
    { note: `Add the two masks: a key is open only if it is real and not in the future. "Hi" now reads ${seenByHi(both)} pads. The pad rows are fully closed; in practice they read something harmless, and their outputs are ignored.`, tone: "ok", tables: [G(both, "combined, row 2")] },
    { note: `With right padding the pads come after "Hi", so the causal mask alone already hides them: "Hi" reads ${rightHiPads} pads. Only pad queries see pads, and their outputs are ignored.`, tone: "ok", tables: [G(causal, "causal mask, right padded", right)] },
  ] };
}

/* ---------- the block ---------- */
export const rmsnorm = (x: number[]) => { const r = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length + 1e-6); return x.map((v) => v / r); };
export function blockPass() {
  const X = [[1, 0, 2, -1], [0, 1, 1, 0], [2, -1, 0, 1]], x = X[2], d = 4;
  const h = X.map(rmsnorm), q = h[2], s = h.map((k) => dot(q, k) / Math.sqrt(d)), w = softmax(s);
  const attn = [0, 1, 2, 3].map((j) => 0.5 * w.reduce((acc, wi, i) => acc + wi * h[i][j], 0));   // W_O = 0.5 I keeps it readable
  const x1 = x.map((v, j) => v + attn[j]);
  const rng = seededRng("s4-ffn"), W1 = Array.from({ length: d }, () => Array.from({ length: 2 * d }, () => Math.round((rng() * 2 - 1) * 10) / 10));
  const W2 = Array.from({ length: 2 * d }, () => Array.from({ length: d }, () => Math.round((rng() * 2 - 1) * 10) / 10));
  const n1 = rmsnorm(x1), hid = W1[0].map((_, k) => Math.max(0, n1.reduce((acc, v, j) => acc + v * W1[j][k], 0)));
  const ffn = [0, 1, 2, 3].map((j) => hid.reduce((acc, v, k) => acc + v * W2[k][j], 0)), x2 = x1.map((v, j) => v + ffn[j]);
  return { x, nx: h[2], attn, x1, n1, ffn, x2, w };
}
function blockFlow(): Flow {
  const p = blockPass(), head = ["", "d1", "d2", "d3", "d4"];
  const row = (l: string, v: number[]) => [l, ...v.map(r2)];
  const T = (rows: (string | number)[][], tones?: GridTable["tones"]): GridTable => ({ head, rows, tones });
  const rms = Math.sqrt(p.x.reduce((s, v) => s + v * v, 0) / p.x.length);
  return { kind: "grid", title: "One token through one pre-norm block", steps: [
    { note: "The third token's vector arrives on the residual stream: 4 numbers here, thousands in a real model.", tables: [T([row("x", p.x)])] },
    { note: `RMSNorm divides by the root mean square, ${r2(rms)}, so the sublayer always sees numbers of size about 1. The stream itself is not changed.`, tone: "hot", tables: [T([row("x", p.x), row("norm(x)", p.nx)], { "1": "hot" })] },
    { note: `Attention reads the earlier tokens (weights ${p.w.map(r2).join(", ")}) and returns an update.`, tables: [T([row("x", p.x), row("attn", p.attn)], { "1": "hot" })] },
    { note: "Residual: add the update to x. The block edits the stream; it never replaces it.", tone: "ok", tables: [T([row("x", p.x), row("attn", p.attn), row("x + attn", p.x1)], { "2": "ok" })] },
    { note: "Normalise again, then the feed-forward network works on this token alone: widen to 8, ReLU, back to 4.", tone: "hot", tables: [T([row("x + attn", p.x1), row("norm", p.n1), row("ffn", p.ffn)], { "2": "hot" })] },
    { note: "Add again. This is the block's output, and the next block's input. A model stacks dozens of these.", tone: "ok", tables: [T([row("x + attn", p.x1), row("ffn", p.ffn), row("out", p.x2)], { "2": "ok" })] },
  ] };
}

/* ---------- encoder-decoder ---------- */
const crossFlow: Flow = { kind: "lanes", title: "Translating with an encoder-decoder", lanes: ["Encoder", "Decoder", "Output"], steps: [
  { from: 0, to: 0, label: "read all source", note: "The encoder reads the whole source sentence at once, with no mask: every source word sees every other." },
  { from: 0, to: 1, label: "K, V once", note: "Its final vectors become the keys and values for cross-attention. They are computed once per input.", tone: "hot" },
  { from: 1, to: 1, label: "causal self", note: "The decoder reads the target so far, starting from a start token, with a causal mask." },
  { from: 1, to: 0, label: "query", note: "Cross-attention: decoder queries score the source keys, so each target word picks the source words it needs." },
  { from: 1, to: 2, label: "next token", note: "The decoder's top layer predicts one target token.", tone: "ok" },
  { from: 2, to: 1, label: "append", note: "That token joins the target, and the decoder runs again. The encoder does not run again." },
] };

function objectivesFlow(): Flow {
  const head = ["family", "input", "target"];
  const rows = [["encoder", "a [M] sat down", "cat"], ["decoder", "a cat sat", "cat sat down"], ["enc-dec", "a <X> down", "<X> cat sat"]];
  const T = (show: number, tone?: GridTable["tones"]): GridTable => ({ head, rows: rows.map((r, i) => (i < show ? r : [r[0], "", ""])), tones: tone });
  return { kind: "grid", title: "What each family learns to predict", steps: [
    { note: "Encoder: hide some tokens and predict them from both sides. Good for understanding, not for writing left to right.", tables: [T(1, { "0": "hot" })] },
    { note: "Decoder: predict every next token from the left only. The target is the input shifted by one, so every position is a training example.", tables: [T(2, { "1": "hot" })] },
    { note: "Encoder-decoder: the encoder reads a corrupted input, and the decoder writes out the missing span.", tables: [T(3, { "2": "hot" })] },
    { note: "Decoder-only training is just text plus a shift, so any text works. That simplicity is a big reason chat models use it.", tone: "ok", tables: [T(3, { "1": "ok" })] },
  ] };
}

/* ---------- decoding ---------- */
export const NEXT: [string, number][] = [["mat", 3.0], ["sofa", 2.2], ["floor", 1.6], ["roof", 0.6], ["moon", -0.5]];
export const SAMPLE = { t: 0.7, k: 4, p: 0.9 };
/** Temperature, then top-k, then top-p, then renormalise: returns each stage's probabilities. */
export function sampleStages(logits: number[], t: number, k: number, p: number) {
  const raw = softmax(logits), temp = softmax(logits.map((x) => x / t));
  const order = temp.map((_, i) => i).sort((a, b) => temp[b] - temp[a]);
  const rank = order.reduce<number[]>((r, i, j) => { r[i] = j; return r; }, []);
  const topk = temp.map((v, i) => (rank[i] < k ? v : 0)), zk = topk.reduce((a, b) => a + b, 0);
  let cum = 0; const keepP = new Set<number>();   // top-p reads the top-k survivors, renormalised
  for (const i of order) { if (rank[i] >= k || cum >= p) break; keepP.add(i); cum += temp[i] / zk; }
  const topp = temp.map((v, i) => (keepP.has(i) ? v : 0)), z = topp.reduce((a, b) => a + b, 0), final = topp.map((v) => v / z);
  return { raw, temp, topk, topp, final };
}
function decodeFlow(): Flow {
  const { t, k, p } = SAMPLE, s = sampleStages(NEXT.map((x) => x[1]), t, k, p);
  const bars = (v: number[], tone?: (i: number) => Bar["tone"]): Bar[] => NEXT.map(([w], i) => ({ label: w, value: v[i], tone: tone?.(i) }));
  const kept = s.topp.filter((v) => v > 0).length;
  return { kind: "bars", title: `"The cat sat on the ..." at T = ${t}, top-k ${k}, top-p ${p}`, max: 1, format: r2, steps: [
    { note: `The model's logits become probabilities with softmax. "mat" leads with ${r2(s.raw[0])}.`, bars: bars(s.raw) },
    { note: `Divide the logits by temperature ${t} first. Below 1 the gaps grow: "mat" rises to ${r2(s.temp[0])}. The order never changes.`, tone: "hot", bars: bars(s.temp, (i) => (i === 0 ? "hot" : undefined)) },
    { note: `Top-k ${k}: keep only the ${k} most likely tokens. "moon" is cut.`, tone: "warn", bars: bars(s.topk, (i) => (s.topk[i] ? undefined : "bad")) },
    { note: `Top-p ${p}: keep the smallest top set whose probabilities reach ${p}. Here that is ${kept} tokens.`, tone: "warn", bars: bars(s.topp, (i) => (s.topp[i] ? undefined : "bad")) },
    { note: `Renormalise the survivors so they sum to 1, then draw one at random. "mat" now has ${r2(s.final[0])}, but "${NEXT[kept - 1][0]}" still has a chance.`, tone: "ok", bars: bars(s.final, (i) => (s.final[i] ? "ok" : undefined)) },
  ] };
}

// A two-level tree where the greedy first choice leads to a weaker whole sentence.
export const TREE = { first: [["cat", 0.5], ["dog", 0.4], ["bird", 0.1]] as [string, number][], second: { cat: [["sat", 0.4], ["ran", 0.35], ["ate", 0.25]], dog: [["barked", 0.9], ["ran", 0.1]], bird: [["sang", 1]] } as Record<string, [string, number][]> };

export const FLOWS_4: Record<string, Flow> = {
  "s4-bpe-train": bpeFlow(),
  "s4-embed-lookup": embedFlow(),
  "s4-mha-shapes": mhaFlow(),
  "s4-pad-mask": padFlow(),
  "s4-block-pass": blockFlow(),
  "s4-cross-attn": crossFlow,
  "s4-objectives": objectivesFlow(),
  "s4-decode-pipeline": decodeFlow(),
};

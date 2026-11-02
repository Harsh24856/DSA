// Animated walk-throughs for the Gen AI playbook. Every number an algorithm produces is computed here, so it cannot drift.
import type { Bar, BarStep, Flow, GridStep, GridTable } from "./flows.ts";

const softmax = (x: number[]) => { const e = x.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const r2 = (x: number) => Number(x.toFixed(2));
const r3 = (x: number) => Number(x.toFixed(3));

function backprop(): Flow {
  const x = 3, t = 10, lr = 0.01; let w = 2, b = 1;
  const y = w * x + b, L = (y - t) ** 2, dy = 2 * (y - t), dw = dy * x, db = dy;
  const w2 = r2(w - lr * dw), b2 = r2(b - lr * db), y2 = w2 * x + b2, L2 = r2((y2 - t) ** 2);
  const T = (rows: (string | number)[][], tones?: GridTable["tones"]): GridTable => ({ head: ["quantity", "value", "how"], rows, tones });
  return { kind: "grid", title: "One step of backprop, by hand", steps: [
    { note: `A one-neuron model: y = w x + b, starting with w = ${w} and b = ${b}. The input is x = ${x}, and we want ${t}.`, tables: [T([["w", w, "start"], ["b", b, "start"], ["x", x, "input"], ["target", t, "wanted"]])] },
    { note: `Forward pass: y = ${w} x ${x} + ${b} = ${y}. Loss = (${y} - ${t}) squared = ${L}.`, tone: "warn", tables: [T([["y", y, "w x + b"], ["loss", L, "(y - target)^2"]], { "1": "warn" })] },
    { note: `Backward, one local derivative at a time. dL/dy = 2(y - target) = ${dy}. dy/dw = x = ${x}. dy/db = 1.`, tables: [T([["dL/dy", dy, "2(y - target)"], ["dy/dw", x, "x"], ["dy/db", 1, "1"]], { ":1": "hot" })] },
    { note: `The chain rule multiplies them: dL/dw = ${dy} x ${x} = ${dw}, and dL/db = ${db}. Negative means increasing w lowers the loss.`, tone: "hot", tables: [T([["dL/dw", dw, "dL/dy x dy/dw"], ["dL/db", db, "dL/dy x dy/db"]], { ":1": "hot" })] },
    { note: `Update with learning rate ${lr}: w = ${w2}, b = ${b2}. Run forward again and the loss falls from ${L} to ${L2}. Training is this, millions of times.`, tone: "ok", tables: [T([["w", w2, `${w} - ${lr} x ${dw}`], ["b", b2, `${b} - ${lr} x ${db}`], ["new loss", L2, `was ${L}`]], { "2": "ok" })] },
  ] };
}

function attention(): Flow {
  const words = ["the", "cat", "sat"], X = [[1, 0], [1, 1], [0, 1]], q = X[2], d = 2;
  const raw = X.map((k) => dot(q, k)), scaled = raw.map((s) => s / Math.sqrt(d)), w = softmax(scaled);
  const out = [0, 1].map((j) => w.reduce((s, wi, i) => s + wi * X[i][j], 0));
  const head = ["word", "vector", "score", "weight"];
  const T = (score: (string | number)[], weight: (string | number)[], tones?: GridTable["tones"]): GridTable => ({ head, rows: words.map((wd, i) => [wd, `[${X[i].join(", ")}]`, score[i], weight[i]]), tones });
  const blank = ["", "", ""];
  return { kind: "grid", title: `Self-attention for the word "sat"`, steps: [
    { note: `Three words, each a 2 number vector. "sat" will decide how much to listen to each word, including itself. To keep the sums simple, Q, K and V are the vectors themselves.`, tables: [T(blank, blank, { "2:0": "hot" })] },
    { note: `Score = query dot key: how well does each word's key match what "sat" is looking for? ${raw.join(", ")}.`, tables: [T(raw, blank, { ":2": "hot" })] },
    { note: `Divide by the square root of d (${r2(Math.sqrt(d))}). Without this, large dimensions make scores huge and softmax collapses onto one word.`, tone: "warn", tables: [T(scaled.map(r2), blank, { ":2": "warn" })] },
    { note: `Softmax turns scores into weights that add up to 1: ${w.map(r2).join(", ")}. "sat" pays most attention to "cat" and itself.`, tables: [T(scaled.map(r2), w.map(r2), { ":3": "hot" })] },
    { note: `The output is the weighted average of the value vectors: [${out.map(r2).join(", ")}]. "sat" now carries context from the words around it. Every word does this in parallel.`, tone: "ok", tables: [T(scaled.map(r2), w.map(r2), { ":3": "ok" }), { label: `new vector for "sat"`, rows: [[`[${out.map(r2).join(", ")}]`]], tones: { "0": "ok" } }] },
  ] };
}

function mask(): Flow {
  const words = ["I", "like", "red", "tea"], X = [[1, 0.5], [0.5, 1], [1, 1], [0.2, 1.2]];
  const scores = X.map((a) => X.map((b) => r2(dot(a, b))));
  const masked = scores.map((row, i) => row.map((v, j) => (j > i ? "-inf" : v)));
  const weights = scores.map((row, i) => { const w = softmax(row.slice(0, i + 1)); return row.map((_, j) => (j > i ? 0 : r2(w[j]))); });
  const T = (rows: (string | number)[][], tones?: GridTable["tones"], label?: string): GridTable => ({ label, head: words, rowHead: words, rows, tones });
  const up: GridTable["tones"] = {}; words.forEach((_, i) => words.forEach((__, j) => { if (j > i) up[`${i}:${j}`] = "bad"; }));
  return { kind: "grid", title: "The causal mask", steps: [
    { note: "Attention scores: each row is a word asking about every word. When training on a whole sentence, this includes words that come later.", tables: [T(scores, undefined, "raw scores")] },
    { note: `That is cheating: "like" must not see "red" when predicting the next word. Everything above the diagonal is the future.`, tone: "bad", tables: [T(scores, up, "the future, in red")] },
    { note: "Set the future to minus infinity before softmax. Softmax turns minus infinity into exactly zero.", tone: "warn", tables: [T(masked, up, "after masking")] },
    { note: `Each row now sums to 1 using only itself and earlier words. "I" can only look at itself. This is what makes a decoder a decoder.`, tone: "ok", tables: [T(weights, { "0:0": "ok", "1:0": "ok", "1:1": "ok", "2:0": "ok", "2:1": "ok", "2:2": "ok", "3:0": "ok", "3:1": "ok", "3:2": "ok", "3:3": "ok" }, "softmax per row")] },
  ] };
}

function kvCache(): Flow {
  const P = 100, without = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += P + i; return s; }, withC = (n: number) => P + Math.max(0, n - 1);
  const step = (n: number, note: string, tone?: BarStep["tone"]): BarStep => ({ note, tone, bars: [{ label: "no cache", value: without(n), tone: "bad" }, { label: "KV cache", value: withC(n), tone: "ok" }] });
  return { kind: "bars", title: "Tokens processed: why the KV cache matters", format: (v) => Math.round(v).toLocaleString("en-US"), steps: [
    step(1, `A ${P} token prompt, first new token. Both must process the whole prompt once: this is prefill.`),
    step(10, `After 10 new tokens. Without a cache, every step re-reads everything: ${without(10).toLocaleString("en-US")} tokens against ${withC(10)}.`, "warn"),
    step(50, `After 50. The uncached cost grows quadratically, because keys and values for old tokens never change, yet get recomputed.`, "warn"),
    step(100, `After 100: ${without(100).toLocaleString("en-US")} against ${withC(100)}. The cache trades memory for speed, which is why it dominates GPU memory while serving.`, "ok"),
  ] };
}

function stateless(): Flow {
  const SYS = 500, Q = 100, EX = 300, turn = (t: number) => SYS + EX * (t - 1) + Q, turns = [1, 2, 3, 4, 5];
  const bars = (upto: number): Bar[] => turns.map((t) => ({ label: `turn ${t}`, value: t <= upto ? turn(t) : 0, tone: t === upto ? "hot" : undefined }));
  return { kind: "bars", title: "The API has no memory (example token counts)", format: (v) => (v ? String(Math.round(v)) : ""), steps: [
    { note: `Turn 1 sends the system prompt (${SYS}) and the question (${Q}). The model answers and then forgets everything.`, bars: bars(1) },
    { note: `Turn 2 must resend all of it plus the last answer: ${turn(2)} tokens. "Memory" is your app replaying the conversation.`, bars: bars(2) },
    { note: `Turn 3: ${turn(3)} tokens. Every turn costs more than the last, even if the question is short.`, tone: "warn", bars: bars(3) },
    { note: `Turn 5: ${turn(5)}. In long chats this gets expensive and slow, then hits the context limit.`, tone: "warn", bars: bars(5) },
    { note: "That is why real apps summarise old turns, trim tool output, and cache the unchanging prefix.", tone: "ok", bars: bars(5) },
  ] };
}

function promptCache(): Flow {
  const IN = 3, CACHED = 0.3, fresh = 2000, stable = 4000, cost = (full: number, c: number) => (full * IN + c * CACHED) / 1e6;
  const a = cost(fresh + stable, 0), b = cost(fresh, stable), fmt = (v: number) => `$${v.toFixed(4)}`;
  return { kind: "bars", title: "Input cost of one request, with made-up prices", format: fmt, steps: [
    { note: `A RAG call with ${stable} stable tokens (system prompt and tools) and ${fresh} that change. At $${IN} per million input tokens it costs ${fmt(a)}.`, bars: [{ label: "no cache", value: a, tone: "warn" }, { label: "with cache", value: a }] },
    { note: "Providers can cache the longest unchanged prefix. So the order matters: stable content first, the question last. Change one early token and the cache misses.", tone: "warn", bars: [{ label: "no cache", value: a, tone: "warn" }, { label: "with cache", value: a }] },
    { note: `Cached reads at $${CACHED} per million bring it to ${fmt(b)}, about ${Math.round((1 - b / a) * 100)}% less. The first call usually pays a little extra to write the cache.`, tone: "ok", bars: [{ label: "no cache", value: a, tone: "warn" }, { label: "with cache", value: b, tone: "ok" }] },
  ] };
}

function rrf(): Flow {
  const k = 60, bm25 = ["D3", "D1", "D7", "D2"], vec = ["D1", "D5", "D3", "D9"];
  const score = new Map<string, number>();
  [bm25, vec].forEach((list) => list.forEach((d, i) => score.set(d, (score.get(d) ?? 0) + 1 / (k + i + 1))));
  const order = [...score].sort((a, b) => b[1] - a[1]);
  const rank = (l: string[], d: string) => (l.includes(d) ? l.indexOf(d) + 1 : "");
  const lists: GridTable = { head: ["rank", "BM25", "vector"], rows: bm25.map((d, i) => [i + 1, d, vec[i]]) };
  return { kind: "grid", title: "Reciprocal rank fusion", steps: [
    { note: "Keyword search and vector search each return a ranked list. Their scores are on different scales, so you cannot just add them.", tables: [lists] },
    { note: `RRF ignores the scores and uses only rank. Each list gives a document 1 / (${k} + rank). The ${k} stops the top spot from dominating.`, tone: "hot", tables: [{ ...lists, tones: { "0:2": "hot", "1:1": "hot", "2:2": "hot", "0:1": "hot" } }] },
    { note: `D1: 1/${k + 2} + 1/${k + 1} = ${score.get("D1")!.toFixed(4)}. D3: 1/${k + 1} + 1/${k + 3} = ${score.get("D3")!.toFixed(4)}. Being found by both lists beats being first in one.`, tone: "ok", tables: [{ label: "fused order", head: ["doc", "BM25", "vector", "score"], rows: order.map(([d, s]) => [d, rank(bm25, d), rank(vec, d), s.toFixed(4)]), tones: { "0": "ok", "1": "ok" } }] },
    { note: "Send the top of this list to a reranker, which is slower but reads each passage against the question.", tables: [{ label: "fused order", head: ["doc", "BM25", "vector", "score"], rows: order.map(([d, s]) => [d, rank(bm25, d), rank(vec, d), s.toFixed(4)]), tones: { "0": "ok", "1": "ok", "2": "ok" } }] },
  ] };
}

function retrievalMetrics(): Flow {
  const got = ["D4", "D1", "D9", "D2", "D7"], rel = new Set(["D1", "D2", "D3"]), hits = got.filter((d) => rel.has(d)).length;
  const first = got.findIndex((d) => rel.has(d)) + 1, recall = hits / rel.size, precision = hits / got.length, mrr = 1 / first;
  const tones: GridTable["tones"] = {}; got.forEach((d, i) => { tones[String(i)] = rel.has(d) ? "ok" : "bad"; });
  const T = (t?: GridTable["tones"]): GridTable => ({ label: "retrieved, best first", head: ["rank", "doc", "relevant?"], rows: got.map((d, i) => [i + 1, d, rel.has(d) ? "yes" : "no"]), tones: t });
  const M = (rows: (string | number)[][], t?: GridTable["tones"]): GridTable => ({ head: ["metric", "value", "working"], rows, tones: t });
  return { kind: "grid", title: "Scoring one query's retrieval", steps: [
    { note: `For this question, your golden set says the right chunks are D1, D2 and D3. The retriever returned five.`, tables: [T()] },
    { note: "Mark each one against the golden set.", tables: [T(tones)] },
    { note: `Recall@5 = ${hits} found of ${rel.size} relevant = ${r2(recall)}. D3 was missed, and the model can never use a chunk it never sees.`, tone: "warn", tables: [T(tones), M([["recall@5", r2(recall), `${hits} / ${rel.size}`]], { "0": "warn" })] },
    { note: `MRR = 1 / rank of the first hit = 1 / ${first} = ${r2(mrr)}. Precision@5 = ${hits} / ${got.length} = ${r2(precision)}. Measure these over many questions, before you ever judge the generated answer.`, tone: "ok", tables: [T(tones), M([["recall@5", r2(recall), `${hits} / ${rel.size}`], ["precision@5", r2(precision), `${hits} / ${got.length}`], ["MRR", r2(mrr), `1 / ${first}`]], { ":1": "ok" })] },
  ] };
}

function lora(): Flow {
  const d = 4096, r = 8, full = d * d, low = 2 * d * r;
  const fmt = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1e3)}K`);
  return { kind: "bars", title: "Trainable numbers in one layer", format: fmt, steps: [
    { note: `One ${d} x ${d} weight matrix has ${full.toLocaleString("en-US")} numbers. Fine-tuning all of it, across every layer, needs a lot of GPU memory.`, bars: [{ label: "full matrix", value: full, tone: "warn" }, { label: "LoRA, r = 8", value: full }] },
    { note: `LoRA freezes it and learns a small update instead: A (${d} x ${r}) times B (${r} x ${d}). That product is the same shape as the original.`, tone: "hot", bars: [{ label: "full matrix", value: full, tone: "warn" }, { label: "LoRA, r = 8", value: full, tone: "hot" }] },
    { note: `A and B together hold only ${low.toLocaleString("en-US")} numbers: ${Math.round(full / low)} times fewer. It works because the change a task needs is usually low rank.`, tone: "ok", bars: [{ label: "full matrix", value: full, tone: "warn" }, { label: "LoRA, r = 8", value: low, tone: "ok" }] },
  ] };
}

function grpo(): Flow {
  const right = 42, ans = [42, 17, 42, 40], rew: number[] = ans.map((a) => (a === right ? 1 : 0));
  const mean = rew.reduce((a, b) => a + b, 0) / rew.length, std = Math.sqrt(rew.reduce((s, v) => s + (v - mean) ** 2, 0) / rew.length), adv = rew.map((v) => (v - mean) / std);
  const T = (reward: boolean, advantage: boolean, tones?: GridTable["tones"]): GridTable => ({ head: ["sample", "answer", "reward", "advantage"], rows: ans.map((a, i) => [i + 1, a, reward ? rew[i] : "", advantage ? r2(adv[i]) : ""]), tones });
  return { kind: "grid", title: "GRPO: learning from a group of answers", steps: [
    { note: "Sample a group of answers to one question from the current model. No separate value model is needed.", tables: [T(false, false)] },
    { note: `A verifier checks each one: the right answer is ${right}. This only works for tasks you can check, such as maths or code.`, tone: "hot", tables: [T(true, false, { ":2": "hot" })] },
    { note: `Compare each answer with its own group: (reward - mean) / std, with mean ${r2(mean)} and std ${r2(std)}. Positive means better than this group's average.`, tables: [T(true, true, { ":3": "hot" })] },
    { note: "Raise the probability of answers with positive advantage and lower the others, with a limit on how far the model can move in one step.", tone: "ok", tables: [T(true, true, { "0:3": "ok", "2:3": "ok", "1:3": "bad", "3:3": "bad" })] },
  ] };
}

function batching(): Flow {
  const SLOTS = 3, reqs: [string, number][] = [["A", 2], ["B", 6], ["C", 1], ["D", 3], ["E", 2], ["F", 1]];
  const queue = reqs.map(([n, l]) => ({ n, left: l })), slots: ({ n: string; left: number } | null)[] = Array(SLOTS).fill(null);
  const steps: GridStep[] = []; let t = 0;
  const statics = [reqs.slice(0, 3), reqs.slice(3)].reduce((s, b) => s + Math.max(...b.map((r) => r[1])), 0);
  steps.push({ note: `${reqs.length} requests of different lengths and ${SLOTS} batch slots. Static batching waits for the longest in each batch: ${statics} steps in total, with slots sitting idle. Below, A: 2 means request A has 2 tokens left.`, tables: [{ label: "waiting requests", head: reqs.map((r) => r[0]), rows: [reqs.map((r) => r[1])], tones: { "0": "warn" } }] });
  while (queue.length || slots.some(Boolean)) {
    t++;
    const joined: number[] = [];
    slots.forEach((s, i) => { if (!s && queue.length) { slots[i] = queue.shift()!; joined.push(i); } });
    const view = slots.map((s) => (s ? `${s.n}: ${s.left}` : "idle"));
    const tones: GridTable["tones"] = {}; joined.forEach((i) => { tones[`0:${i}`] = "hot"; });
    const done = slots.filter((s) => s && s.left === 1).map((s) => s!.n);
    done.forEach((n) => { tones[`0:${slots.findIndex((s) => s?.n === n)}`] = "ok"; });
    steps.push({ note: `Step ${t}. ${joined.length ? `${joined.map((i) => slots[i]!.n).join(", ")} joined a free slot straight away. ` : ""}${done.length ? `${done.join(", ")} finished, freeing a slot for the next step.` : "All slots generate one token each."}`, tables: [{ head: ["slot 1", "slot 2", "slot 3"], rows: [view], tones }, { label: "still waiting", rows: [[queue.map((q) => q.n).join(", ") || "none"]] }] });
    slots.forEach((s, i) => { if (s) { s.left--; if (s.left === 0) slots[i] = null; } });
  }
  steps.push({ note: `Continuous batching finished in ${t} steps against ${statics} for static batching, because a slot refills the moment it frees. This is the main trick behind vLLM-style throughput.`, tone: "ok", tables: [{ head: ["static", "continuous"], rows: [[statics, t]], tones: { "0:1": "ok" } }] });
  return { kind: "grid", title: "Continuous batching", steps };
}

function kappa(): Flow {
  const both = 14, jOnly = 3, hOnly = 1, none = 2, n = both + jOnly + hOnly + none;
  const po = (both + none) / n, pj = (both + jOnly) / n, ph = (both + hOnly) / n, pe = pj * ph + (1 - pj) * (1 - ph), k = (po - pe) / (1 - pe);
  const lazyPo = ph, lazyK = 0;
  const conf: GridTable = { label: `${n} answers graded by both`, head: ["", "human: good", "human: bad"], rows: [["judge: good", both, jOnly], ["judge: bad", hOnly, none]], tones: { "0:1": "ok", "1:2": "ok" } };
  return { kind: "grid", title: "Should you trust your LLM judge?", steps: [
    { note: "A person and the LLM judge both grade the same answers. Green cells are where they agree.", tables: [conf] },
    { note: `Raw agreement = (${both} + ${none}) / ${n} = ${r2(po)}. It sounds good, but most answers here are good, so even lazy judging agrees often.`, tone: "warn", tables: [conf, { rows: [["agreement", r2(po)]], tones: { ":1": "warn" } }] },
    { note: `A judge that always says "good" scores ${r2(lazyPo)} and learned nothing. Its kappa is exactly ${lazyK}.`, tone: "bad", tables: [{ head: ["judge", "agreement", "kappa"], rows: [["always good", r2(lazyPo), lazyK]], tones: { "0": "bad" } }] },
    { note: `Chance agreement = ${r2(pj)} x ${r2(ph)} + ${r2(1 - pj)} x ${r2(1 - ph)} = ${r3(pe)}. Kappa = (${r2(po)} - ${r3(pe)}) / (1 - ${r3(pe)}) = ${r2(k)}. Below 0.4 is weak: fix the rubric before trusting this judge.`, tone: "warn", tables: [{ head: ["judge", "agreement", "kappa"], rows: [["always good", r2(lazyPo), lazyK], ["your judge", r2(po), r2(k)]], tones: { "1:2": "warn" } }] },
  ] };
}

function grammar(): Flow {
  const toks = ["Sure", "The", "{", `"`], logits = [3, 2, 1, 0.5], p = softmax(logits), allowed = [false, false, true, true];
  const kept = softmax(logits.filter((_, i) => allowed[i])); let j = 0; const after = allowed.map((a) => (a ? kept[j++] : 0));
  const bars = (v: number[], tone?: (i: number) => BarStep["tone"]): Bar[] => toks.map((t, i) => ({ label: t, value: v[i], tone: tone?.(i) }));
  return { kind: "bars", title: "Constrained decoding: invalid output becomes impossible", max: 1, steps: [
    { note: `You asked for JSON, but the model's next-token probabilities favour chatty text: "${toks[0]}" at ${r2(p[0])}.`, tone: "warn", bars: bars(p, (i) => (i === 0 ? "warn" : undefined)) },
    { note: "A grammar compiled from your schema knows which tokens are legal here. JSON must start with an opening brace, so the rest are illegal.", tone: "bad", bars: bars(p, (i) => (allowed[i] ? "ok" : "bad")) },
    { note: `Set illegal tokens to minus infinity and renormalise. "{" now has ${r2(after[2])}. Sampling can only produce valid output, at every token, with no retry loop.`, tone: "ok", bars: bars(after, (i) => (allowed[i] ? "ok" : undefined)) },
    { note: "It guarantees the shape, not the truth: valid JSON can still contain a wrong value, so you still need evals.", bars: bars(after, (i) => (allowed[i] ? "ok" : undefined)) },
  ] };
}

function quant(): Flow {
  const w = [0.02, -0.05, 0.03, 50], q127 = (x: number, s: number) => Math.round(x / s);
  const sAll = Math.max(...w.map(Math.abs)) / 127, row = (s: number) => w.map((x) => { const q = q127(x, s); return [x, q, r3(q * s), r3(Math.abs(x - q * s))]; });
  const small = w.slice(0, 3), sSmall = Math.max(...small.map(Math.abs)) / 127, sBig = 50 / 127;
  const fine = w.map((x, i) => { const s = i < 3 ? sSmall : sBig, q = q127(x, s); return [x, q, r3(q * s), r3(Math.abs(x - q * s))]; });
  const head = ["weight", "int8", "restored", "error"];
  const lost: GridTable["tones"] = { "0:1": "bad", "1:1": "bad", "2:1": "bad" };
  return { kind: "grid", title: "Quantizing weights to int8", steps: [
    { note: "Four weights, three small and one outlier. int8 stores whole numbers from -127 to 127, using a scale s, so that q = round(x / s).", tables: [{ head: ["weight"], rows: w.map((x) => [x]), tones: { "3": "warn" } }] },
    { note: `One scale per tensor must fit the outlier: s = 50 / 127 = ${r3(sAll)}. Now every small weight rounds to 0.`, tone: "bad", tables: [{ label: "per-tensor scale", head, rows: row(sAll), tones: lost }] },
    { note: `Give the small group its own scale: s = 0.05 / 127. Same 8 bits, but the small weights keep their values. The cost is storing one extra scale per group.`, tone: "ok", tables: [{ label: "per-group scales", head, rows: fine, tones: { ":2": "ok" } }] },
  ] };
}

export const GENAI_FLOWS: Record<string, Flow> = {
  "g-backprop": backprop(),
  "g-rnn": { title: "Why attention replaced RNNs", steps: [
    { node: "read word 1, update hidden state", note: "An RNN reads one word at a time and keeps a fixed-size memory." },
    { node: "read word 2, overwrite part of it", note: "Each new word gets squeezed into the same small vector." },
    { node: "...word 50", note: "Early words have been overwritten many times over, and their gradients shrink at each step back.", tone: "warn" },
    { node: "translation needs word 1 again", note: "The information may be gone. And words must be processed in order, so GPUs cannot run them in parallel.", tone: "bad" },
    { node: "attention: look at any word directly", note: "Each word can reach every other word in one hop, and all of them compute at once. That is the transformer's real advantage.", tone: "ok" },
  ] },
  "g-text": { title: "From text to the next token", steps: [
    { node: "text: \"The cat\"", note: "Models never see letters. The text must become numbers first." },
    { node: "tokenizer: [464, 3797]", note: "Pieces of words become IDs, which is why counting letters is hard for an LLM.", tone: "hot" },
    { node: "embedding: a vector per token", note: "Each ID looks up a learned vector, for example 768 numbers." },
    { node: "transformer blocks", note: "Attention mixes context between tokens, repeated across many layers." },
    { node: "logits: a score per vocab word", note: "One number per token in the vocabulary, such as 50,000 scores for what comes next." },
    { node: "softmax, then sample", note: "Scores become probabilities, and temperature and top-p choose one.", tone: "ok" },
    { node: "append it and repeat", note: "The new token joins the input and the loop runs again. That is all generation is." },
  ] },
  "g-attn": attention(),
  "g-mask": mask(),
  "g-kv": kvCache(),
  "g-stateless": stateless(),
  "g-cache": promptCache(),
  "g-rag": { title: "RAG: offline, then online", steps: [
    { node: "offline: parse and chunk documents", note: "Bad parsing here causes most later failures, like tables turned to noise.", tone: "warn" },
    { node: "embed and index each chunk", note: "Chunks become vectors, stored with metadata such as who may read them." },
    { node: "online: question arrives", note: "Everything from here runs per request, so latency matters." },
    { node: "hybrid search: keyword + vector", note: "Keyword search catches exact names and codes. Vectors catch meaning. Use both." , tone: "hot" },
    { node: "rerank the top 50 down to 5", note: "A slower model reads each candidate against the question." },
    { node: "generate, citing the chunks", note: "The prompt has the question and chunks, with instructions to answer only from them.", tone: "ok" },
  ] },
  "g-rrf": rrf(),
  "g-recall": retrievalMetrics(),
  "g-hnsw": { title: "Finding neighbours fast with HNSW", steps: [
    { node: "millions of vectors: too many to scan", note: "Comparing with every vector is exact but too slow. Trade a little recall for a lot of speed." },
    { node: "top layer: few nodes, long links", note: "The index is layers of graphs. The top is sparse, like motorways.", tone: "hot" },
    { node: "hop greedily toward the query", note: "From an entry point, keep moving to whichever neighbour is closest." },
    { node: "stuck? drop down a layer", note: "Each lower layer has more nodes and shorter links, so the search gets more local." },
    { node: "bottom layer: every vector", note: "Search here with a candidate list of size ef. Bigger ef means better recall but slower queries.", tone: "warn" },
    { node: "top k, in milliseconds", note: "Search visits only a tiny fraction of the vectors. Tune ef with a recall measurement, not by guessing.", tone: "ok" },
  ] },
  "g-toolloop": { kind: "lanes", title: "The tool-use loop", lanes: ["Your code", "Model", "Tool"], steps: [
    { from: 0, to: 1, label: "question + tool schemas", note: "You send the conversation and a description of each tool." },
    { from: 1, to: 0, label: "tool_use: search(...)", note: "The model cannot run anything. It only asks, and stops with stop_reason tool_use.", tone: "hot" },
    { from: 0, to: 2, label: "run search(...)", note: "Your code runs the tool. This is where you validate input and check permissions.", tone: "warn" },
    { from: 2, to: 0, label: "result", note: "Trim it: return only what the model needs, not a 5,000 line JSON." },
    { from: 0, to: 1, label: "tool_result", note: "Append it and call the model again with the whole history." },
    { from: 1, to: 0, label: "end_turn: answer", note: "When it has enough, it answers. Always cap the number of loops and the budget.", tone: "ok" },
  ] },
  "g-mcp": { kind: "lanes", title: "One tool call over MCP", lanes: ["App + LLM", "MCP client", "MCP server"], steps: [
    { from: 1, to: 2, label: "initialize", note: "When the app starts, each client connects to one server and they agree capabilities." },
    { from: 1, to: 2, label: "tools/list", note: "The client asks what the server offers." },
    { from: 2, to: 1, label: "names + schemas", note: "The app adds these to the model's tool list. It did not need custom code for this tool.", tone: "hot" },
    { from: 0, to: 1, label: "LLM wants a tool", note: "The model picks a tool in the usual way. A good app asks the user first if the action is risky.", tone: "warn" },
    { from: 1, to: 2, label: "tools/call", note: "A JSON-RPC request over stdio for local servers, or HTTP for remote ones." },
    { from: 2, to: 0, label: "result", note: "Write the tool once and every MCP-capable app can use it. Treat its output as untrusted input.", tone: "ok" },
  ] },
  "g-interrupt": { title: "Human approval in an agent graph", steps: [
    { node: "agent plans a refund of 5,000", note: "A real, irreversible action. The agent must not do this alone." },
    { node: "checkpoint: save the whole state", note: "After every step, the graph state goes to a database under a thread id.", tone: "hot" },
    { node: "interrupt(): stop and ask", note: "The run ends here. No process is sitting and waiting, and no memory is held.", tone: "warn" },
    { node: "hours later, a person approves", note: "Servers may have restarted since. It does not matter, because the state is in the database." },
    { node: "resume from the checkpoint", note: "The graph continues at that exact node, with the approval as input. Nodes before it do not run again.", tone: "ok" },
    { node: "refund runs once", note: "Make the tool idempotent anyway, since a retry can still happen." },
  ] },
  "g-lora": lora(),
  "g-grpo": grpo(),
  "g-batching": batching(),
  "g-injection": { kind: "lanes", title: "Indirect prompt injection", lanes: ["Web page", "Agent", "Email tool"], steps: [
    { from: 1, to: 0, label: "read page", note: "You asked the agent to summarise a page. The user is innocent." },
    { from: 0, to: 1, label: "hidden instructions", note: "The page contains text saying to send the user's data elsewhere. To the model, it all looks like one prompt.", tone: "bad" },
    { from: 1, to: 2, label: "send_email(secrets)", note: "The attacker never touched your app. They only planted text the model would read.", tone: "bad" },
    { from: 2, to: 1, label: "blocked: needs approval", note: "You cannot filter this out reliably. So limit what can happen: no secrets plus untrusted input plus outbound tools in one run, and approval for risky actions.", tone: "ok" },
  ] },
  "g-vision": { title: "How an LLM sees an image", steps: [
    { node: "image: 448 x 448 pixels", note: "A model cannot read pixels directly. They must become tokens, like text." },
    { node: "cut into 16 x 16 patches", note: "That gives 28 x 28 = 784 patches. Each one will act like a word.", tone: "hot" },
    { node: "vision encoder (ViT)", note: "A transformer runs over the patches and adds position, so it knows what is next to what." },
    { node: "project to text embedding size", note: "A small projection makes image tokens the same shape as text tokens." },
    { node: "insert into the prompt", note: "They sit among the text tokens, so an image costs tokens, and bigger images cost more.", tone: "warn" },
    { node: "LLM reads both together", note: "From here it is ordinary attention. It can read charts, but small text can get lost to low resolution.", tone: "ok" },
  ] },
  "g-voice": { kind: "bars", title: "A voice reply's latency budget (example numbers)", max: 1000, format: (v) => `${Math.round(v)} ms`, steps: [
    { note: "People notice pauses over about a second in conversation. Treat one second as a budget and spend it.", bars: [{ label: "speech to text", value: 0 }, { label: "LLM first word", value: 0 }, { label: "text to speech", value: 0 }, { label: "total", value: 0, tone: "hot" }] },
    { note: "Streaming speech to text gives a transcript soon after the person stops talking.", bars: [{ label: "speech to text", value: 300, tone: "hot" }, { label: "LLM first word", value: 0 }, { label: "text to speech", value: 0 }, { label: "total", value: 300, tone: "hot" }] },
    { note: "Only the first token matters here, because the reply is spoken as it streams. Waiting for the full reply would add seconds.", bars: [{ label: "speech to text", value: 300 }, { label: "LLM first word", value: 400, tone: "hot" }, { label: "text to speech", value: 0 }, { label: "total", value: 700, tone: "hot" }] },
    { note: "Send text to the speech model sentence by sentence, and play audio as soon as the first chunk arrives. Total: 900 ms.", tone: "ok", bars: [{ label: "speech to text", value: 300 }, { label: "LLM first word", value: 400 }, { label: "text to speech", value: 200, tone: "hot" }, { label: "total", value: 900, tone: "ok" }] },
  ] },
  "g-diffusion": { title: "Generating an image from noise", steps: [
    { node: "prompt becomes text embeddings", note: "A text encoder turns your prompt into vectors that guide every later step." },
    { node: "start with pure noise", note: "Usually in a small latent space, not pixels, which is what makes this affordable.", tone: "hot" },
    { node: "model predicts the direction to clean", note: "Diffusion predicts the noise. Flow matching predicts a velocity along a straight path from noise to image." },
    { node: "take a small step, repeat", note: "Dozens of steps gradually remove noise. Straighter paths need fewer steps, hence flow matching.", tone: "warn" },
    { node: "guidance: favour the prompt", note: "Compare predictions with and without the prompt, then push further that way." },
    { node: "decode latents to pixels", note: "A VAE decoder turns the final latent into the image.", tone: "ok" },
  ] },
  "g-evalloop": { title: "The eval loop", steps: [
    { node: "versioned dataset", note: "Real inputs with expected outputs, including past failures. This is your product's spec." },
    { node: "run the system", note: "The whole thing, retriever and prompt included, not just the model." },
    { node: "graders score each output", note: "Code checks first, since they are cheap and exact, then an LLM judge, then people for samples.", tone: "hot" },
    { node: "compare with the last version", note: "On the same items, with a confidence interval. A 2% gain on 50 items is usually noise.", tone: "warn" },
    { node: "ship, or block in CI", note: "An eval that cannot block a release is only a dashboard.", tone: "ok" },
    { node: "production failures join the dataset", note: "Every bad answer a user finds becomes a test, so the set gets harder over time." },
  ] },
  "g-kappa": kappa(),
  "g-grammar": grammar(),
  "g-quant": quant(),
};

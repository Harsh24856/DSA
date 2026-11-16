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

// SFT: a chat becomes one token sequence through a template, and only the answer is trained. Words stand in for tokens.
export const CHAT: [string, string][] = [["system", "Be brief."], ["user", "Capital of Japan?"], ["assistant", "Tokyo."]];
export const tag = (role: string) => `<|${role}|>`, END = "<|end|>";
export const toks = (s: string) => s.split(" ");
function chatTemplate(): Flow {
  const sizes = CHAT.map(([, c]) => 1 + toks(c).length + 1), total = sizes.reduce((a, b) => a + b, 0);
  const answer = toks(CHAT[2][1]).length + 1, masked = total - answer;
  return { kind: "grid", title: "From chat messages to SFT labels", steps: [
    { note: "Training data is a list of messages, each with a role. The model never sees this list directly.", tables: [{ head: ["role", "content"], rows: CHAT }] },
    { note: "The chat template wraps each turn in special tokens and joins them into one sequence. Serving must use exactly the same template.", tone: "hot",
      tables: [{ head: ["header", "text", "end"], rows: CHAT.map(([r, c]) => [tag(r), c, END]), tones: { ":0": "hot", ":2": "hot" } }] },
    { note: "Labels: every prompt token gets -100, which the loss ignores. Only the answer and its end token are trained.", tone: "ok",
      tables: [{ head: ["part", "tokens", "label"], rows: [["system turn", sizes[0], "-100"], ["user turn", sizes[1], "-100"], [tag("assistant"), 1, "-100"], [`${CHAT[2][1]} ${END}`, answer, "trained"]], tones: { "3": "ok" } }] },
    { note: `${answer} of ${total} tokens count in the loss. The loss is still next-token cross-entropy; the mask decides where. Training ${END} is what teaches the model to stop.`, tone: "ok",
      tables: [{ head: ["in sequence", "ignored", "trained"], rows: [[total, masked, answer]], tones: { ":2": "ok" } }] },
  ] };
}

// Preference tuning: one DPO loss computed by hand from the four log-probabilities.
export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
function dpoStep(): Flow {
  const beta = 0.1, pc = -12, rc = -14, pr = -15, rr = -13, dc = pc - rc, dr = pr - rr, m = dc - dr, z = beta * m, p = sigmoid(z), loss = -Math.log(p);
  const sgn = (x: number) => (x > 0 ? `+${x.toFixed(1)}` : x.toFixed(1));
  const lp = (show: boolean): GridTable => ({ head: ["answer", "policy", "reference", "change"],
    rows: [["chosen", pc.toFixed(1), rc.toFixed(1), show ? sgn(dc) : ""], ["rejected", pr.toFixed(1), rr.toFixed(1), show ? sgn(dr) : ""]], tones: show ? { "0:3": "ok", "1:3": "ok" } : undefined });
  return { kind: "grid", title: "One DPO step, by hand", steps: [
    { note: "One preference pair: the same prompt, a chosen answer and a rejected one, picked by a person or a judge model.",
      tables: [{ head: ["part", "text"], rows: [["prompt", "Is 91 prime?"], ["chosen", "No: 91 = 7 × 13."], ["rejected", "Yes, 91 is prime."]], tones: { "1": "ok", "2": "bad" } }] },
    { note: "Score each whole answer: the summed log-probability of its tokens, under the policy being trained and under the frozen reference (the SFT model).",
      tables: [lp(false)] },
    { note: `What counts is the change from the reference. The policy already likes the chosen answer ${sgn(dc)} more and the rejected one ${sgn(dr)}.`, tone: "hot",
      tables: [lp(true)] },
    { note: `Margin = ${sgn(dc)} - (${sgn(dr)}) = ${m.toFixed(1)}. Times β = ${beta}: ${r2(z)}. Sigmoid gives ${r2(p)}, the odds the chosen answer wins. Loss = -ln ${r2(p)} = ${r3(loss)}.`, tone: "ok",
      tables: [lp(true), { head: ["margin", "β × margin", "σ", "loss"], rows: [[m.toFixed(1), r2(z), r2(p), r3(loss)]], tones: { ":3": "ok" } }] },
    { note: `The gradient raises the chosen answer and lowers the rejected one, scaled by σ(-${r2(z)}) = ${r2(1 - p)}. Pairs the model already ranks well push less. No reward model, no sampling.`, tone: "ok",
      tables: [{ head: ["pair", "push weight"], rows: [["this pair", r2(1 - p)], ["policy = reference", r2(0.5)]], tones: { "0": "ok" } }] },
  ] };
}

// Distillation: the soft-target loss for one example, by hand.
export const softmaxT = (z: number[], T: number) => { const e = z.map((x) => Math.exp(x / T)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
function distill(): Flow {
  const cls = ["cat", "dog", "car"], zt = [4, 2, 0], zs = [3, 1, 1], T = 2, alpha = 0.5;
  const t1 = softmaxT(zt, 1), tT = softmaxT(zt, T), sT = softmaxT(zs, T), s1 = softmaxT(zs, 1);
  const terms = tT.map((p, i) => p * Math.log(p / sT[i])), kl = terms.reduce((a, b) => a + b, 0), soft = kl * T * T, hard = -Math.log(s1[0]), total = alpha * soft + (1 - alpha) * hard;
  return { kind: "grid", title: "One distillation loss, by hand", steps: [
    { note: "A big teacher and a small student score the same image of a cat. These are their raw scores (logits).", tables: [{ head: ["class", "teacher", "student"], rows: cls.map((c, i) => [c, zt[i], zs[i]]) }] },
    { note: `At T = 1 the teacher is fairly sure: ${r2(t1[0])} on cat. Dividing logits by T = ${T} softens it, and its hint that a dog looks more like a cat than a car does shows up: ${r2(tT[1])} against ${r2(tT[2])}.`, tone: "hot",
      tables: [{ head: ["class", "teacher T=1", `teacher T=${T}`], rows: cls.map((c, i) => [c, r2(t1[i]), r2(tT[i])]), tones: { ":2": "hot" } }] },
    { note: `Soften the student with the same T and compare: KL = sum of p ln(p / q), where p is the teacher and q the student.`,
      tables: [{ head: ["class", "teacher", "student", "p ln(p/q)"], rows: cls.map((c, i) => [c, r2(tT[i]), r2(sT[i]), r3(terms[i])]) }] },
    { note: `KL = ${r3(kl)}. Multiply by T² = ${T * T} so its gradients keep their size: ${r3(soft)}. Add the usual loss on the true label, ${r3(hard)}, and weight them half and half: ${r3(total)}.`, tone: "ok",
      tables: [{ head: ["soft (KL × T²)", "hard (true label)", "total"], rows: [[r3(soft), r3(hard), r3(total)]], tones: { ":2": "ok" } }] },
  ] };
}

export const FLOWS_5: Record<string, Flow> = {
  "s5-distill": distill(),
  "s5-dpo-step": dpoStep(),
  "s5-chat-template": chatTemplate(),
  "s5-next-token": nextToken(),
  "s5-minhash": minhash(),
};

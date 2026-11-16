// Stage 3 (Sequences) animated walk-throughs. Every number is computed here by the algorithm it shows.
import type { Flow, GridTable } from "../../other/flows.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => Number(x.toFixed(2));

// why-order-matters: bag of words, bigrams, and a window that is too short
function order(): Flow {
  const A = ["dog", "bites", "man"], B = ["man", "bites", "dog"], V = 10_000;
  const count = (ws: string[]) => (w: string) => ws.filter((x) => x === w).length;
  const pairs = (ws: string[]) => ws.slice(1).map((w, i) => `${ws[i]} ${w}`);
  const cos = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0) / Math.sqrt(a.reduce((s, x) => s + x * x, 0) * b.reduce((s, x) => s + x * x, 0));
  const words = [...new Set(A)], bi = [...new Set([...pairs(A), ...pairs(B)])];
  const wa = words.map(count(A)), wb = words.map(count(B)), ba = bi.map(count(pairs(A))), bb = bi.map(count(pairs(B)));
  const keys = ["the", "keys", "to", "the", "old", "cabinet", "are"], k = 3, last = keys.length - 1, subj = keys.indexOf("keys");
  const winTones: GridTable["tones"] = { [String(subj)]: "bad" };
  for (let i = last - k; i < last; i++) winTones[String(i)] = "hot";
  return { kind: "grid", title: "What order adds, and what it costs", steps: [
    { note: `Count the words of A = "${A.join(" ")}" and B = "${B.join(" ")}". The counts match, so the cosine similarity is ${r2(cos(wa, wb))}: a bag of words sees one sentence.`, tone: "bad",
      tables: [{ head: ["word", "A", "B"], rows: words.map((w, i) => [w, wa[i], wb[i]]) }] },
    { note: `Count neighbouring pairs instead. A and B share no pair, so the similarity drops to ${r2(cos(ba, bb))}. Local order is back.`, tone: "ok",
      tables: [{ head: ["pair", "A", "B"], rows: bi.map((p, i) => [p, ba[i], bb[i]]), tones: Object.fromEntries(bi.map((_, i) => [`${i}:${ba[i] ? 1 : 2}`, "hot"])) }] },
    { note: `The price: with ${n0(V)} words there are V to the n possible n-grams. Most never appear, so their counts teach nothing.`, tone: "warn",
      tables: [{ head: ["n", "possible n-grams"], rows: [1, 2, 3].map((n) => [n, n0(V ** n)]), tones: { "2": "bad" } }] },
    { note: `A fixed window of ${k} words: to choose "are" the model needs the plural subject "keys", ${last - subj} words back. The window holds only "${keys.slice(last - k, last).join(" ")}".`, tone: "bad",
      tables: [{ head: ["position", "word", "in window?"], rows: keys.map((w, i) => [i + 1, w, i === last ? "predict" : i >= last - k ? "yes" : "no"]), tones: winTones }] },
    { note: "What we need: read one word at a time, carry a summary of everything so far, and reuse the same weights at every step. That is a recurrent network.", tone: "ok",
      tables: [{ head: ["need", "bag", "window", "recurrent"], rows: [["order", "no", "inside k", "yes"], ["any length", "yes", "no", "yes"], ["shared weights", "n/a", "no", "yes"]], tones: { ":3": "ok" } }] },
  ] };
}

// rnn-bptt: a one-number RNN, forward on a pulse, then the gradient back through every step
function rnnSteps(): Flow {
  const u = 0.8, xs = [1, 0, 0, 0, 0], hs: number[] = [];
  xs.forEach((x, t) => hs.push(Math.tanh(x + u * (t ? hs[t - 1] : 0))));
  const fac = hs.map((h) => u * (1 - h * h)), T = xs.length;
  const back = fac.slice(1).reduce((p, f) => p * f, 1), far = 40, farVal = back ** (far / (T - 1));
  const r3 = (x: number) => Number(x.toFixed(3));
  const T_ = (h: (string | number)[], f: (string | number)[], tones?: GridTable["tones"]): GridTable => ({ head: ["t", "x", "h", "dh_t/dh_t-1"], rows: xs.map((x, i) => [i + 1, x, h[i], f[i]]), tones });
  const blank = xs.map(() => "");
  return { kind: "grid", title: `A one-number RNN, h = tanh(x + ${u} h)`, steps: [
    { note: `One input pulse at step 1, then zeros. The same rule, with recurrent weight u = ${u}, runs at every step.`, tables: [T_(blank, blank, { "0:1": "hot" })] },
    { note: `Step 1: h = tanh(1 + ${u} × 0) = ${r3(hs[0])}. The pulse is now in the state.`, tables: [T_([r3(hs[0]), ...blank.slice(1)], blank, { "0:2": "hot" })] },
    { note: `Steps 2 to ${T}: no new input, so each state is tanh(${u} × previous). The memory fades: ${hs.map(r3).join(", ")}.`, tone: "warn", tables: [T_(hs.map(r3), blank, { ":2": "warn" })] },
    { note: `Backward: each step multiplies the gradient by its local slope, u × (1 - h squared). Every factor is below 1.`, tables: [T_(hs.map(r3), fac.map(r3), { ":3": "hot" })] },
    { note: `From h${T} back to h1 the gradient is ${fac.slice(1).map(r3).join(" × ")} = ${back.toFixed(4)}. At this rate, ${far} steps would leave ${farVal.toExponential(1)}: the gradient vanishes.`, tone: "bad", tables: [T_(hs.map(r3), fac.map(r3), { ":3": "bad" }), { label: `dh${T}/dh1`, rows: [[back.toFixed(4)]], tones: { "0": "bad" } }] },
  ] };
}

// lstm-gru: one LSTM step with one number per slot, then the gradient along the cell
function lstmStep(): Flow {
  const sig = (a: number) => 1 / (1 + Math.exp(-a)), r3 = (x: number) => Number(x.toFixed(3));
  const hp = 0.5, cp = 0.8, x = 1.0;
  // [weight on x, weight on h(t-1), bias] for each gate; the forget bias starts at 1
  const Wt = { f: [0.5, 0.5, 1], i: [1, -0.5, 0], o: [0.8, 0.4, 0], g: [1.2, -0.4, 0] } as const;
  const pre = (k: keyof typeof Wt) => Wt[k][0] * x + Wt[k][1] * hp + Wt[k][2];
  const f = sig(pre("f")), i = sig(pre("i")), o = sig(pre("o")), g = Math.tanh(pre("g"));
  const c = f * cp + i * g, h = o * Math.tanh(c), u = 0.8, rnnF = u * (1 - h * h), N = 20;
  const gates: GridTable = { head: ["gate", "pre", "value", "job"], rows: [
    ["f", r3(pre("f")), r3(f), "keep old"], ["i", r3(pre("i")), r3(i), "write amount"], ["g", r3(pre("g")), r3(g), "new content"], ["o", r3(pre("o")), r3(o), "show amount"]] };
  return { kind: "grid", title: "One LSTM step, one number per slot", steps: [
    { note: `The cell gets the previous output h = ${hp}, the previous cell c = ${cp} and the input x = ${x}. Four small layers will read [h, x].`,
      tables: [{ head: ["input", "value"], rows: [["h(t-1)", hp], ["c(t-1)", cp], ["x(t)", x]], tones: { "1": "hot" } }] },
    { note: `Each gate is weight × x + weight × h + bias, then a squash. Gates use sigmoid (0 to 1); the candidate g uses tanh (-1 to 1).`,
      tables: [{ ...gates, tones: { ":2": "hot" } }] },
    { note: `Update the cell: c = f × c(t-1) + i × g = ${r3(f)} × ${cp} + ${r3(i)} × ${r3(g)} = ${r3(c)}. Keep most of the old, add some new.`, tone: "ok",
      tables: [gates, { head: ["part", "value"], rows: [["keep: f × c(t-1)", r3(f * cp)], ["write: i × g", r3(i * g)], ["new c(t)", r3(c)]], tones: { "2": "ok" } }] },
    { note: `Output: h = o × tanh(c) = ${r3(o)} × ${r3(Math.tanh(c))} = ${r3(h)}. The output gate decides how much of the memory to show.`,
      tables: [gates, { head: ["state", "value"], rows: [["c(t)", r3(c)], ["h(t)", r3(h)]], tones: { "1": "hot" } }] },
    { note: `Backward along the cell, one step multiplies the gradient by f = ${r3(f)} alone. Over ${N} steps that keeps ${r3(f ** N)}. A plain RNN step with weight ${u} at this h multiplies by ${r3(rnnF)}, which keeps ${(rnnF ** N).toExponential(1)}.`, tone: "ok",
      tables: [{ head: ["path", "1 step", `${N} steps`], rows: [["LSTM cell", r3(f), r3(f ** N)], ["plain RNN", r3(rnnF), (rnnF ** N).toExponential(1)]], tones: { "0": "ok", "1": "bad" } }] },
  ] };
}

// seq2seq-bottleneck: the encoder reads, one vector crosses over, the decoder writes
function seq2seq(): Flow {
  const src = ["the", "cat", "sleeps"], tgt = ["le", "chat", "dort"], H = 256;
  return { kind: "lanes", title: "Translating with an encoder and a decoder", lanes: ["Encoder", "Context", "Decoder"], steps: [
    ...src.map((w, i) => ({ from: 0, to: 0, label: `read "${w}"`, note: i === 0 ? `The encoder reads the source one word at a time, updating its ${H} number state.` : `Word ${i + 1} is folded into the same ${H} numbers.` })),
    { from: 0, to: 1, label: "final state", note: `Only the last state crosses over: ${H} numbers for all ${src.length} words, and it would still be ${H} for 50.`, tone: "warn" as const },
    { from: 1, to: 2, label: "start state", note: "The context becomes the decoder's first state. A start token is its first input." },
    ...tgt.map((w, i) => ({ from: 2, to: 2, label: `write "${w}"`, note: i === 0 ? `It writes "${w}", then feeds "${w}" back in as the next input.` : `It writes "${w}" from its own state and the word before.`, tone: "hot" as const })),
    { from: 2, to: 2, label: "write <end>", note: `An end token stops it: ${src.length} words in, ${tgt.length} out here, but the lengths may differ.`, tone: "ok" as const },
  ] };
}

export const FLOWS_3: Record<string, Flow> = {
  "s3-seq2seq": seq2seq(),
  "s3-order": order(),
  "s3-rnn-steps": rnnSteps(),
  "s3-lstm-step": lstmStep(),
};

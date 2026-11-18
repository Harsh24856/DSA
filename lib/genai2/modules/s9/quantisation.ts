// Stage 9: quantisation, storing weights in fewer bits. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { decodeCeiling, effBits, GPU, pct, qmax, quantGB, quantise, relErr, WEIGHTS } from "../../stages/s9.calc.ts";

// predict: per-tensor int8 with an outlier
const PW = [0.02, -0.05, 0.03, 50], pS = 50 / qmax(8), pQ = Math.round(0.02 / pS);
// sizes
const g70 = quantGB(70, 16), i70 = quantGB(70, 4, 128), g8 = quantGB(8, 16), i8 = quantGB(8, 4, 128);
// numeric: effective bits
const [EB, EG] = [4, 64], eb = effBits(EB, EG);
// numeric: speed limit
const s16 = decodeCeiling(g8), s4 = decodeCeiling(i8);
// error on the sample layer
const e4t = relErr(WEIGHTS, 4, WEIGHTS.length), e4g = relErr(WEIGHTS, 4, 128), e8t = relErr(WEIGHTS, 8, WEIGHTS.length), e3g = relErr(WEIGHTS, 3, 128);
// output: quantise a small row
const OW = [0.5, -1.1, 0.05, 2.4], oq = quantise(OW, 4).map((x) => x.q);
const ff = (x: number) => x.toFixed(x < 10 ? 1 : 0);

export const QUANTISATION: GModule = {
  id: "quantisation",
  stage: 9,
  title: "Quantisation",
  hook: "Weights trained in 16 bits rarely need all 16 to work well. Storing them in 8 or 4 bits makes the model smaller and decode faster, because decode is waiting on bytes. The art is losing as little quality as possible.",
  blocks: [
    { kind: "figure", id: "s9-quant-sizes", caption: `A 70B model needs ${ff(g70)} GB in 16-bit, more than one ${GPU.mem} GB GPU. In 4-bit with a scale per 128 weights it needs about ${ff(i70)} GB and fits.` },
    { kind: "text", md: "**The idea.** Map each real weight x to a small whole number q with a scale s: q = round(x / s), and restore it as q × s. With b bits, symmetric quantisation keeps whole numbers from -(2^(b-1) - 1) to 2^(b-1) - 1, and s = max|x| / that limit.\n\nThe scale is set by the largest weight it covers. That is the whole difficulty." },
    { kind: "flow", id: "g-quant" },
    {
      kind: "predict",
      q: `int8 with one scale for the weights [${PW.join(", ")}]. What does 0.02 come back as?`,
      answer: "0", wrong: ["0.02", "0.0197", "50"],
      why: `The outlier sets s = 50 / ${qmax(8)} = ${pS.toFixed(3)}. Then 0.02 / ${pS.toFixed(3)} = ${(0.02 / pS).toFixed(3)}, which rounds to ${pQ}. Every small weight is lost. Smaller groups with their own scales fix this.`,
    },
    { kind: "play", id: "s9-quant" },
    {
      kind: "compare",
      head: ["Choice", "What it means", "Trade-off"],
      rows: [
        ["Per tensor", "One scale for a whole matrix", "Cheapest; one outlier ruins it"],
        ["Per channel", "One scale per row or column", "Good for 8-bit weights"],
        ["Per group", "One scale per 32 to 128 weights", `Standard for 4-bit; adds ${16 / 128} bits a weight at 128`],
        ["Weight only", "Weights small, activations stay 16-bit", "Speeds memory-bound decode"],
        ["Weights and activations", "Both in 8 bits (for example FP8)", "Also speeds the matrix maths: prefill, big batches"],
      ],
    },
    { kind: "text", md: `**Outliers and calibration.** A few channels in large models carry values far bigger than the rest. Methods keep them in higher precision, or choose scales from sample data so the weights that matter most keep their accuracy. On the sample layer here, 4-bit error falls from ${pct(e4t)} with one scale to ${pct(e4g)} with groups of 128.\n\n**Always rerun your evals.** Averages often hold while rare, hard cases slip.` },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
rng = np.random.default_rng(0)
w = rng.normal(0, 0.02, 1024)
w[[7, 516]] = 0.5                                  # two outliers, as real layers have

def quantise(x, bits, group):
    top = 2 ** (bits - 1) - 1
    out = np.empty_like(x)
    for i in range(0, len(x), group):
        g = x[i:i + group]
        s = np.abs(g).max() / top                  # the scale fits the largest weight in the group
        out[i:i + group] = np.round(g / s) * s
    return out

for group in (1024, 128, 32):
    err = np.sqrt(np.mean((w - quantise(w, 4, group)) ** 2)) / np.sqrt(np.mean(w ** 2))
    print(f"4-bit, groups of {group:>4}: error {err:.1%}, {4 + 16 / group:.3f} bits a weight")
assert np.allclose(quantise(w, 8, 1024), w, atol=0.5 / 127)
`,
    },
  ],
  keyPoints: [
    "Quantisation stores each weight as a few-bit whole number times a scale: q = round(x / s), restored as q × s.",
    "Fewer bytes mean a smaller model and faster memory-bound decode: 4-bit weights are about a quarter of 16-bit.",
    "The scale fits the largest value it covers, so one outlier can round every small weight to zero; per-channel or per-group scales keep the damage local.",
    "Weight-only quantisation helps decode; quantising activations too (such as 8-bit floats) also speeds the matrix maths of prefill and large batches.",
    "Calibrated methods choose scales from sample data and protect the weights that matter most; always rerun evals after quantising.",
  ],
  questions: [
    { id: "why-faster", level: "easy", kind: "concept",
      q: "Why does 4-bit weight quantisation speed up decode for one user?",
      answer: "Each step reads about a quarter as many bytes of weights", wrong: ["4-bit maths has fewer FLOPs per token", "It shortens the prompt", "It removes the KV cache"],
      why: `Decode waits on memory. The ceiling rises with fewer bytes: about ${Math.round(s16)} to ${Math.round(s4)} tokens a second for an 8B model on the example GPU.` },
    { id: "scale-set", level: "easy", kind: "concept",
      q: "In symmetric int8 quantisation, what sets the scale s?",
      answer: "The largest absolute value it covers, divided by 127", wrong: ["The average weight", "The number of weights", "A fixed constant of 1/256"],
      why: "s = max|x| / 127, so the largest weight maps to ±127 and everything else falls in between. That is why one huge value stretches the step for all the others." },
    { id: "group-why", level: "medium", kind: "concept",
      q: "Why do 4-bit formats keep a separate scale for every group of, say, 128 weights?",
      answer: "So an outlier only stretches the scale of its own group",
      wrong: ["Groups let the GPU skip zero weights", "Each group is stored in a different precision", "It makes the model file larger on purpose"],
      why: `With 4 bits there are only ${2 * qmax(4) + 1} levels, so a stretched scale is costly. On the sample layer, error drops from ${pct(e4t)} (one scale) to ${pct(e4g)} (groups of 128).` },
    { id: "w-vs-wa", level: "medium", kind: "concept",
      q: "Weight-only 4-bit cuts decode time a lot but barely changes prefill time. Why?",
      answer: "Prefill is limited by matrix maths, which still runs at 16-bit activations",
      wrong: ["Prefill does not use the weights", "Prefill is always cached", "4-bit weights are unpacked once at startup"],
      why: "Weight-only formats shrink the bytes read, which is decode's limit. Prefill is compute bound; to speed it you need faster maths, such as 8-bit weights and activations." },
    { id: "outlier-fix", level: "hard", kind: "concept",
      q: "Which approach does the LLM.int8() method use for outlier features?",
      answer: "It keeps the few outlier dimensions in a 16-bit multiply and does the rest in 8-bit",
      wrong: ["It deletes outlier dimensions after training", "It retrains the model until outliers disappear", "It stores every weight in 16-bit"],
      why: "The paper reports that over 99.9% of values are multiplied in 8-bit, with the outlier dimensions split into 16-bit, and no loss of inference quality up to 175B parameters." },
    { id: "awq-idea", level: "hard", kind: "concept",
      q: "How does activation-aware weight quantisation (AWQ) pick which weights to protect?",
      answer: "From activation statistics: the channels that see large activations matter most",
      wrong: ["From the largest weights alone", "At random, about 1% of them", "From the gradient during a full retrain"],
      why: "The paper says to look at the activation distribution, not the weights, and that protecting about 1% of salient weights greatly reduces error." },
    { id: "eval-after", level: "medium", kind: "concept",
      q: "After quantising, average benchmark scores barely move. What should you still check?",
      answer: "Your own evals, especially rare and hard cases such as long reasoning or exact numbers",
      wrong: ["Nothing: equal averages mean equal models", "Only the file size", "Only the speed of prefill"],
      why: "Rounding error can hurt a few hard cases while the average holds. Compare item by item on your task and look at the failures." },
    { id: "eff-bits", level: "medium", kind: "numeric",
      q: `${EB}-bit weights with one 16-bit scale per ${EG} weights. How many bits does each weight cost in all?`,
      answer: eb.toFixed(2), wrong: [String(EB), (EB + 16).toFixed(2), (EB + 1 / EG).toFixed(2)],
      why: `${EB} + 16 / ${EG} = ${eb.toFixed(2)}. The scales are small overhead, but smaller groups cost more: 16 / 32 = 0.5 bits.` },
    { id: "size-70", level: "easy", kind: "numeric",
      q: "About how many GB of weights does a 70B model need in 4-bit with a scale per 128 weights?",
      answer: `About ${ff(i70)}`, wrong: [`About ${ff(g70)}`, `About ${ff(quantGB(70, 8))}`, `About ${ff(i70 / 4)}`],
      why: `70 × ${effBits(4, 128)} / 8 = ${i70.toFixed(1)} GB, against ${ff(g70)} in 16-bit. It now fits on one ${GPU.mem} GB GPU, with room for KV cache.` },
    { id: "q-out", level: "hard", kind: "output",
      q: "Symmetric 4-bit, one scale. What does this print?",
      code: `w = ${JSON.stringify(OW)}\ns = max(abs(x) for x in w) / 7\nprint([round(x / s) for x in w])`,
      answer: JSON.stringify(oq).replace(/,/g, ", "), wrong: [JSON.stringify(OW.map((x) => Math.round(x))).replace(/,/g, ", "), JSON.stringify(OW.map((x) => Math.round((x / 2.4) * 127))).replace(/,/g, ", "), JSON.stringify(oq.map((x) => x + 1)).replace(/,/g, ", ")],
      why: `s = 2.4 / 7 = ${(2.4 / 7).toFixed(3)}. Dividing gives ${OW.map((x) => (x / (2.4 / 7)).toFixed(2)).join(", ")}, which round to ${oq.join(", ")}. The small 0.05 becomes 0: with 15 levels there is no room for it.` },
    { id: "explain-outlier", level: "medium", kind: "explain",
      q: "Why can one outlier ruin per-tensor int8 or int4 quantisation, and how do you contain it?",
      answer: "The scale is the largest absolute value divided by the top level. One huge value makes every step huge, so most small weights round to zero or to a few coarse levels.\n\nContain it with finer scales (per channel, or per group of 32 to 128), by keeping outlier channels in higher precision, or by choosing scales from calibration data so the weights that matter most keep accuracy." },
    { id: "explain-choose", level: "hard", kind: "explain",
      q: "You must serve a 70B model on one 80 GB GPU. Walk through the quantisation choice.",
      answer: `- 16-bit needs ${ff(g70)} GB: impossible. 8-bit needs ${ff(quantGB(70, 8))} GB, leaving almost nothing for KV cache.\n- 4-bit with groups of 128 needs about ${ff(i70)} GB, leaving room for the cache.\n- Use a calibrated method rather than plain rounding, and an engine that supports the format.\n- Compare on your evals against the 16-bit model (served elsewhere) item by item, and check speed and memory under real load.\n- If quality drops on key cases, try 8-bit on two GPUs or a smaller model.` },
    { id: "explain-kv", level: "medium", kind: "explain",
      q: "Can you quantise the KV cache as well as the weights? What does it buy and risk?",
      answer: "Yes. Storing keys and values in 8 bits halves the cache against 16-bit, so more users or longer contexts fit, and each decode step reads fewer bytes.\n\nThe risk is attention errors on long contexts, where small key errors shift which tokens get weight. Test long-context and retrieval tasks before and after." },
    { id: "trap-free", level: "easy", kind: "trap",
      claim: "Going from 8-bit to 4-bit weights always loses nothing, as long as average scores hold.",
      truth: false,
      why: `Error grows quickly as bits drop: on the sample layer it is ${pct(e8t, 1)} at 8-bit with one scale and ${pct(e4t)} at 4-bit, and ${pct(e3g)} at 3-bit even with groups. Averages can hide losses on hard cases.` },
    { id: "trap-bytes", level: "medium", kind: "trap",
      claim: "For memory-bound decode, halving the bytes per weight roughly doubles the upper limit on tokens per second.",
      truth: true,
      why: `The limit is bandwidth ÷ bytes read per step. For an 8B model on the example GPU: ${Math.round(s16)} tokens a second at 16-bit, ${Math.round(decodeCeiling(quantGB(8, 8)))} at 8-bit.` },
  ],
  real: [
    { who: "Tim Dettmers and co-authors", when: "2022",
      what: "LLM.int8() found highly systematic outlier features in large transformers. It multiplies more than 99.9% of values in 8-bit and moves the outlier dimensions into a 16-bit multiply, and reports no loss of inference performance for models up to 175B parameters.",
      takeaway: "Treat the few outliers differently and the rest can be stored cheaply.",
      url: "https://arxiv.org/abs/2208.07339" },
    { who: "Elias Frantar and co-authors", when: "2022",
      what: "GPTQ quantises weights to 3 or 4 bits after training, using approximate second-order information. It quantised a 175B model in about four GPU hours and reports inference speedups over FP16 of about 3.25 times on one GPU type and 4.5 times on another.",
      takeaway: "Careful one-shot quantisation lets very large models run on far less hardware.",
      url: "https://arxiv.org/abs/2210.17323" },
    { who: "Ji Lin and co-authors", when: "2023",
      what: "AWQ observed that protecting only about 1% of salient weights greatly reduces quantisation error, and that the salient channels should be found from activations, not from the weights themselves.",
      takeaway: "Which weights matter depends on the data flowing through them.",
      url: "https://arxiv.org/abs/2306.00978" },
  ],
};

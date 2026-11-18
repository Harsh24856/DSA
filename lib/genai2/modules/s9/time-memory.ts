// Stage 9: where time and memory go when a model serves users. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { BF16, decodeCeiling, decodeStep, GPU, intensity, kvGB, kvPerToken, latency, MODEL, n0, prefillS, r1, ridge, weightsGB } from "../../stages/s9.calc.ts";
import { REQ } from "../../stages/s9.flows.ts";

const ceil16 = decodeCeiling(weightsGB(MODEL.params, BF16));                // predict: batch 1 decode ceiling
const w70 = weightsGB(70, BF16), w8i4 = weightsGB(MODEL.params, 0.5);
const RIDGE = ridge();
const perTok = kvPerToken(), perTokKiB = perTok / 1024;
const [CTX, USERS] = [8192, 16], kvBig = kvGB(CTX, USERS);
const mha = kvPerToken(MODEL.layers, 32, MODEL.headDim);                    // the same model with 32 KV heads (no grouping)
const one = decodeStep(1, 2048), b32 = decodeStep(32, 2048);
const pre = prefillS(REQ.prompt), tpot = decodeStep(1, REQ.prompt + REQ.out / 2).stepS, lat = latency(REQ.queue + pre, REQ.out, tpot);
const msx = (s: number) => `${(s * 1000).toFixed(1)} ms`;
// output question: weights plus KV for a small deployment
const [OP, OL, OH, OD, OT, OU] = [8, 32, 8, 128, 4096, 10];
const outGB = Math.round(OP * 2 + (2 * OL * OH * OD * 2 * OT * OU) / 1e9);

export const TIME_MEMORY: GModule = {
  id: "time-memory",
  stage: 9,
  title: "Where time and memory go",
  hook: "A model that answers in a notebook can still be slow and expensive for a thousand users. Before any fix, know the two phases of a request and which one is waiting on memory rather than maths.",
  blocks: [
    { kind: "figure", id: "s9-roofline", caption: `The roof is what the example GPU can reach. Decode for one user does about ${intensity(1)} FLOP per byte it reads, so it sits far down the memory slope. The bend is at about ${Math.round(RIDGE)} FLOPs per byte.` },
    { kind: "text", md: "**Two phases.** *Prefill* reads the whole prompt in one pass. Many tokens share each weight read, so it is limited by maths (compute bound). It sets the **time to first token** (TTFT).\n\n**Decode** makes one token per step, and each step reads every weight again for only a few FLOPs. It waits on memory bandwidth (memory bound). It sets the **time per output token** (TPOT)." },
    { kind: "flow", id: "s9-request" },
    {
      kind: "predict",
      q: `An ${MODEL.params}B model in bf16 (${BF16} bytes a weight) runs for one user on a GPU with ${GPU.bw} TB/s of memory bandwidth. About how many tokens a second can decode reach at most?`,
      answer: `About ${n0(ceil16)}`, wrong: [`About ${n0(GPU.tflops / MODEL.params)}`, `About ${n0(ceil16 * 10)}`, `About ${n0(ceil16 / 10)}`],
      why: `Each token needs every weight read once: ${weightsGB(MODEL.params, BF16)} GB. ${GPU.bw} TB/s ÷ ${weightsGB(MODEL.params, BF16)} GB ≈ ${n0(ceil16)} reads a second, so at most ${n0(ceil16)} tokens. The FLOP rate is not the limit here.`,
    },
    { kind: "play", id: "s9-roofline" },
    { kind: "text", md: `**Memory = weights + KV cache + a little more.** Weights are parameters × bytes: ${weightsGB(MODEL.params, BF16)} GB for ${MODEL.params}B in bf16, ${w8i4} GB in 4-bit, ${w70} GB for 70B in bf16. The KV cache is per user and per token: ${perTokKiB} KiB a token for the example model, so ${USERS} users at ${n0(CTX)} tokens hold ${r1(kvBig)} GB. Leave room for activations and the runtime.` },
    { kind: "lab", id: "memory" },
    {
      kind: "compare",
      head: ["", "Prefill", "Decode"],
      rows: [
        ["Tokens per pass", "The whole prompt", "One per user"],
        ["Limited by", "Compute (FLOPs)", "Memory bandwidth"],
        ["User feels it as", "Time to first token", "Speed of the stream"],
        ["Helped by", "Prefix caching, shorter prompts", "Batching, quantisation, speculative decoding"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `# decode time for one step: the slower of moving the bytes and doing the maths
params, bytes_w = ${MODEL.params}e9, ${BF16}                  # weights
kv_per_token = 2 * ${MODEL.layers} * ${MODEL.kvHeads} * ${MODEL.headDim} * 2   # K and V, layers, KV heads, head size, bf16
bw, flops = ${GPU.bw}e12, ${GPU.tflops}e12           # bytes/s and FLOP/s of the example GPU

def step(batch, ctx):
    move = (params * bytes_w + batch * ctx * kv_per_token) / bw
    maths = 2 * params * batch / flops
    return max(move, maths), "memory" if move >= maths else "compute"

for b in (1, 32):
    t, bound = step(b, 2048)
    print(f"batch {b:>2}: {t*1000:.1f} ms a step, {b/t:,.0f} tok/s in all, {bound} bound")
assert step(1, 2048)[1] == "memory"
`,
    },
  ],
  keyPoints: [
    "A request has two phases: prefill reads the prompt in one compute-bound pass and sets time to first token; decode makes one token per step and sets time per output token.",
    "Decode is memory bound: each step reads every weight for about 2 FLOPs, so tokens per second for one user is at most bandwidth divided by the bytes of weights.",
    "Batching reuses each weight read for many users, so total throughput rises almost for free until the KV cache fills memory or compute becomes the limit.",
    "GPU memory holds the weights (parameters × bytes) plus the KV cache, which grows with context length × concurrent users.",
    "Latency ≈ queue + TTFT + output tokens × TPOT; track p50 and p95, not only the average.",
  ],
  questions: [
    { id: "ttft-phase", level: "easy", kind: "concept",
      q: "Users wait a long time before the first word appears, then the text streams fast. Which phase is slow?",
      answer: "Prefill (or queueing before it)", wrong: ["Decode", "Tokenising the output", "Sampling the next token"],
      why: "Time to first token covers the queue and the prefill pass over the prompt. A fast stream afterwards means decode is fine. Look at prompt length, prefix caching and queueing." },
    { id: "decode-bound", level: "easy", kind: "concept",
      q: "Why is decode for a single user limited by memory bandwidth?",
      answer: "Each step reads every weight to make one token, doing only about 2 FLOPs per weight",
      wrong: ["The GPU has too few cores for one token", "The tokenizer runs on the CPU", "The KV cache must be rebuilt every step"],
      why: `With so little maths per byte (about ${intensity(1)} FLOP per byte in bf16), the cores finish long before the next weights arrive. The KV cache is read, not rebuilt.` },
    { id: "batching-free", level: "medium", kind: "concept",
      q: "Why does serving 32 users in one batch cost little more time per step than serving 1?",
      answer: "The weights are read once per step and used for every user in the batch",
      wrong: ["Each user gets its own copy of the weights", "The batch skips the KV cache", "The GPU runs at a higher clock for batches"],
      why: `The step is dominated by reading ${weightsGB(MODEL.params, BF16)} GB of weights. In the example, batch 1 takes ${msx(one.stepS)} a step and batch 32 takes ${msx(b32.stepS)}; the extra is mostly each user's own KV cache.` },
    { id: "kv-grows", level: "medium", kind: "concept",
      q: "Which change makes the KV cache grow?",
      answer: "Longer contexts or more users at once", wrong: ["A higher sampling temperature", "Quantising the weights to 4 bits", "Shorter system prompts"],
      why: "The cache holds a key and a value per token, per layer, per KV head, for every active sequence. Weight precision changes the weights, not the cache (unless you also quantise the cache)." },
    { id: "gqa", level: "hard", kind: "concept",
      q: `The example model keeps ${MODEL.kvHeads} KV heads instead of one per query head (${32}). What does that buy?`,
      answer: `A KV cache ${32 / MODEL.kvHeads} times smaller, so more users or longer contexts fit`,
      wrong: ["Faster prefill but a larger cache", "Smaller weights but the same cache", "Nothing at serving time; it only helps training"],
      why: `Per token: ${n0(mha / 1024)} KiB with ${32} KV heads, ${perTokKiB} KiB with ${MODEL.kvHeads}. Grouped query attention shares each key and value head across several query heads.` },
    { id: "p95", level: "medium", kind: "concept",
      q: "Why track p95 latency and not only the average?",
      answer: "A slow tail hurts many users while barely moving the average",
      wrong: ["p95 is always lower than the average", "The average cannot be computed for streaming", "p95 measures throughput"],
      why: "One user in twenty waits at least the p95. Long prompts, queueing at peaks and cold starts live in the tail, and the mean hides them." },
    { id: "ceiling", level: "easy", kind: "numeric",
      q: `A ${w8i4} GB model (8B in 4-bit) on a ${GPU.bw} TB/s GPU, one user, short context. What is the decode ceiling in tokens per second?`,
      answer: `About ${n0(decodeCeiling(w8i4))}`, wrong: [`About ${n0(ceil16)}`, `About ${n0(decodeCeiling(w8i4) * 2)}`, `About ${n0(GPU.tflops)}`],
      why: `${GPU.bw} TB/s ÷ ${w8i4} GB ≈ ${n0(decodeCeiling(w8i4))}. Quarter the bytes and the ceiling rises 4 times, from ${n0(ceil16)} in bf16. That is why quantisation speeds decode.` },
    { id: "kv-size", level: "medium", kind: "numeric",
      q: `KV cache per token is ${perTokKiB} KiB. How much do ${USERS} users at ${n0(CTX)} tokens each need?`,
      answer: `About ${r1(kvBig)} GB`, wrong: [`About ${r1(kvBig / USERS)} GB`, `About ${r1(kvBig * 2)} GB`, `About ${r1(kvBig / 8)} GB`],
      why: `${n0(perTok)} bytes × ${n0(CTX)} tokens × ${USERS} users = ${r1(kvBig)} GB, on top of ${weightsGB(MODEL.params, BF16)} GB of weights. At this scale the cache, not the weights, decides how many users fit.` },
    { id: "lat-total", level: "medium", kind: "numeric",
      q: `TTFT is ${msx(REQ.queue + pre)} and each output token takes ${msx(tpot)}. About how long does a ${REQ.out} token answer take?`,
      answer: `About ${lat.toFixed(2)} s`, wrong: [`About ${msx(REQ.queue + pre + tpot)}`, `About ${(REQ.out * (REQ.queue + pre)).toFixed(0)} s`, `About ${(lat / 10).toFixed(2)} s`],
      why: `Latency ≈ TTFT + tokens × TPOT = ${msx(REQ.queue + pre)} + ${REQ.out} × ${msx(tpot)} = ${lat.toFixed(2)} s. Capping output length is often the cheapest latency fix.` },
    { id: "fit-out", level: "hard", kind: "output",
      q: "Weights plus KV cache, in GB, for a small deployment. What does this print?",
      code: `params_b, bytes_w = ${OP}, 2\nlayers, kv_heads, head, bytes_kv = ${OL}, ${OH}, ${OD}, 2\nctx, users = ${OT}, ${OU}\nweights = params_b * bytes_w\nkv = 2 * layers * kv_heads * head * bytes_kv * ctx * users / 1e9\nprint(round(weights + kv))`,
      answer: String(outGB), wrong: [String(OP * 2), String(Math.round(OP * 2 + (OL * OH * OD * 2 * OT * OU) / 1e9)), String(Math.round(OP * 4 + (2 * OL * OH * OD * 2 * OT * OU) / 1e9))],
      why: `Weights: ${OP} × 2 = ${OP * 2} GB. KV: 2 × ${OL} × ${OH} × ${OD} × 2 bytes × ${n0(OT)} × ${OU} ≈ ${r1((2 * OL * OH * OD * 2 * OT * OU) / 1e9)} GB. The 2 at the front counts keys and values; leaving it out halves the cache.` },
    { id: "explain-phases", level: "medium", kind: "explain",
      q: "Why is prefill compute bound while decode is memory bound?",
      answer: `Prefill processes all prompt tokens in one pass, so each weight read from memory is used for many tokens: many FLOPs per byte, and the cores are the limit.\n\nDecode makes one token per sequence per step. It reads every weight for about 2 FLOPs, so the cores sit idle waiting for memory. In bf16 that is about ${intensity(1)} FLOP per byte, against a GPU balance point near ${Math.round(RIDGE)}.` },
    { id: "explain-slow", level: "hard", kind: "explain",
      q: "Users say the chatbot feels slow, but GPU throughput looks high. What do you check and fix?",
      answer: "- Split latency: queue time, TTFT and TPOT, at p50 and p95, not throughput.\n- Long TTFT: long prompts (trim, prefix caching), queueing at peaks (more replicas), cold starts, no streaming.\n- Slow stream: big batches slowing each user, a model too large for the hardware; quantise, use a smaller model or speculative decoding.\n- Long answers: cap output length.\n\nHigh throughput can come from huge batches that make each user wait." },
    { id: "explain-fit", level: "medium", kind: "explain",
      q: "How do you estimate whether a model fits on a GPU for your traffic?",
      answer: `Weights = parameters × bytes per weight (bf16 = 2, int8 = 1, int4 ≈ 0.5).\n\nKV cache = 2 × layers × KV heads × head size × bytes × context × concurrent users.\n\nAdd about 10% for activations and the runtime. If it does not fit: quantise weights or cache, cut context or users per GPU, or split the model across GPUs. For the example ${MODEL.params}B model the cache is ${perTokKiB} KiB a token.` },
    { id: "trap-flops", level: "medium", kind: "trap",
      claim: "Doubling a GPU's FLOP rate roughly doubles decode speed for a single user.",
      truth: false,
      why: `Single-user decode waits on memory, not maths. Its ceiling is bandwidth ÷ bytes of weights (${n0(ceil16)} tok/s in the example). More FLOPs help prefill and very large batches.` },
    { id: "trap-batch", level: "easy", kind: "trap",
      claim: "Larger batches raise total tokens per second but can make each user's stream slower.",
      truth: true,
      why: `Each step carries more KV cache to read, and past the compute bend more maths too. In the example, one user gets ${n0(one.perUser)} tok/s alone and ${n0(b32.perUser)} in a batch of 32, while the GPU's total rises to ${n0(b32.total)}.` },
  ],
  real: [
    { who: "Tri Dao and co-authors", when: "2022",
      what: "FlashAttention computes exact attention while cutting reads and writes between GPU high-bandwidth memory and on-chip SRAM, using tiling. The paper reports about 3 times faster training for GPT-2 at sequence length 1K.",
      takeaway: "The speed came from moving fewer bytes, not from doing fewer FLOPs: memory traffic is the cost to watch.",
      url: "https://arxiv.org/abs/2205.14135" },
  ],
};

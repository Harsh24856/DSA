// Stage 9: how serving engines batch requests, and what the main engines offer. Every number below is computed here or in the stage files.
import type { GModule } from "../../types.ts";
import { BATCH_LENS, BATCH_SLOTS, continuous, decodeStep, mean, n0, prefillS, staticSpans, staticSteps } from "../../stages/s9.calc.ts";
import { LONGP } from "../../stages/s9.flows.ts";

const ST = staticSpans(BATCH_LENS, BATCH_SLOTS), CO = continuous(BATCH_LENS, BATCH_SLOTS);
const endS = staticSteps(BATCH_LENS, BATCH_SLOTS), endC = Math.max(...CO.map((s) => s[1]));
const mS = Math.round(mean(ST.map((s) => s[1]))), mC = Math.round(mean(CO.map((s) => s[1])));
// predict: when does the short request's slot free up under static batching
const first = BATCH_LENS.slice(0, BATCH_SLOTS), firstMax = Math.max(...first);
// numeric: idle share in a static batch
const IB = [50, 50, 50, 450], ibMax = Math.max(...IB), busy = IB.reduce((a, b) => a + b, 0) / (IB.length * ibMax);
// numeric: throughput gain from batching
const b1 = decodeStep(1, 2048), b64 = decodeStep(64, 2048);
// output: continuous batching finish time
const OL = [5, 3, 4, 2], OS = 2, oc = continuous(OL, OS), oEnd = Math.max(...oc.map((s) => s[1])), oStatic = staticSteps(OL, OS);
const stall = prefillS(LONGP.prompt), stepMs = decodeStep(LONGP.batch, LONGP.ctx).stepS;
const msx = (s: number) => `${Math.round(s * 1000)} ms`;

export const BATCHING_ENGINES: GModule = {
  id: "batching-engines",
  stage: 9,
  title: "Batching and serving engines",
  hook: "A GPU that serves one user at a time wastes almost all of its power. Serving engines win by packing many requests into every step, and by keeping slots full as requests come and go.",
  blocks: [
    { kind: "figure", id: "s9-batch-gantt", caption: `Same ${BATCH_LENS.length} requests, same ${BATCH_SLOTS} slots. Static batching waits for the longest request in each batch: ${endS} steps. Continuous batching refills a slot as soon as it frees: ${endC} steps.` },
    { kind: "text", md: "**Why batch at all.** Decode is memory bound: each step reads every weight. A batch of users shares that read, so total tokens per second rise almost in proportion, until memory or compute runs out.\n\n**Static batching** groups requests and runs them to the end together. Requests end at different times, so finished slots sit idle." },
    { kind: "flow", id: "g-batching" },
    {
      kind: "predict",
      q: `Static batching, ${BATCH_SLOTS} slots. The first batch has requests of ${first.join(", ")} tokens. After which step can a new request use the slot of the ${first[0]} token one?`,
      answer: `After step ${firstMax}`, wrong: [`After step ${first[0]}`, `After step ${first.reduce((a, b) => a + b, 0)}`, `After step ${Math.round(mean(first))}`],
      why: `A static batch ends together, when its longest member (${firstMax} tokens) ends. The slot sits idle from step ${first[0]} to ${firstMax}. Continuous batching would hand it to a waiting request at step ${first[0]}.`,
    },
    { kind: "play", id: "s9-batching" },
    { kind: "flow", id: "s9-long-prompt" },
    {
      kind: "compare",
      head: ["Engine", "Its own docs say", "Typical use"],
      rows: [
        ["vLLM", "Continuous batching, PagedAttention, prefix caching, chunked prefill, an OpenAI-compatible server", "Open models on GPUs"],
        ["SGLang", "RadixAttention to reuse the KV cache across model calls", "Programs with many calls sharing prefixes"],
        ["TensorRT-LLM", "Built for NVIDIA GPUs; speculative decoding, prefill and decode disaggregation, FP8 and FP4", "Top speed on NVIDIA hardware"],
        ["llama.cpp", "Minimal setup on a wide range of hardware, an OpenAI-compatible server", "Laptops, desktops, local demos"],
      ],
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  U["requests"] --> Q["queue"]
  Q --> S["scheduler: every step"]:::hot
  S --> A["admit waiting requests if KV blocks are free"]
  S --> P["prefill new prompts, in chunks"]
  S --> D["decode one token for every running request"]
  A --> B["one batched forward pass"]
  P --> B
  D --> B
  B --> F["finished? free its blocks, return it"]:::ok
  F --> S`,
      caption: "An engine's loop. The scheduler decides each step who runs, limited by free KV blocks.",
    },
    {
      kind: "code",
      run: true,
      src: `lens, slots = ${JSON.stringify(BATCH_LENS)}, ${BATCH_SLOTS}

def static(lens, slots):
    t, ends = 0, []
    for i in range(0, len(lens), slots):
        batch = lens[i:i + slots]
        ends += [t + n for n in batch]
        t += max(batch)                       # the batch ends with its longest member
    return ends, t

def continuous(lens, slots):
    free, ends = [0] * slots, []
    for n in lens:                            # each request takes the slot that frees first
        i = free.index(min(free))
        free[i] += n
        ends.append(free[i])
    return ends, max(free)

for name, f in (("static", static), ("continuous", continuous)):
    ends, total = f(lens, slots)
    print(f"{name:>10}: {total} steps, average finish {sum(ends) / len(ends):.0f}")
assert continuous(lens, slots)[1] < static(lens, slots)[1]
`,
    },
  ],
  keyPoints: [
    "Batching shares each weight read across many users, so total throughput rises steeply while decode is memory bound.",
    "Static batching runs a group to the end together, so short requests wait for the longest and finished slots idle.",
    "Continuous batching (iteration-level scheduling) lets requests join and leave the batch at every step, which raises throughput and cuts average latency.",
    "Chunked prefill splits long prompts so they do not freeze everyone's stream; large services may run prefill and decode on separate GPU pools.",
    "Engines such as vLLM, SGLang, TensorRT-LLM and llama.cpp package these tricks; pick by hardware and workload, then measure on your own traffic.",
  ],
  questions: [
    { id: "why-batch", level: "easy", kind: "concept",
      q: "Why does batching raise total tokens per second so much during decode?",
      answer: "All requests in the batch share one read of the weights per step",
      wrong: ["Each request gets a smaller copy of the model", "The GPU skips attention for batched requests", "Batched requests need no KV cache"],
      why: `Reading the weights dominates each step. In the example, one user gets ${n0(b1.total)} tok/s; a batch of 64 makes ${n0(b64.total)} tok/s in all from the same GPU.` },
    { id: "static-flaw", level: "easy", kind: "concept",
      q: "What is the main flaw of static batching for chat traffic?",
      answer: "Every request waits for the longest one in its batch, and freed slots stay idle",
      wrong: ["It cannot batch more than two requests", "It changes the model's answers", "It needs a separate GPU per request"],
      why: "Answer lengths vary a lot. A static batch ends with its longest member, so a short answer is held back and its slot does no work." },
    { id: "continuous-is", level: "medium", kind: "concept",
      q: "What does continuous batching change?",
      answer: "The scheduler admits and removes requests at every decode step, not once per batch",
      wrong: ["Requests are sorted by length before each batch", "Every request gets its own GPU stream", "The batch size grows by one each step"],
      why: "Scheduling per iteration means a finished request leaves at once and a waiting one takes its slot on the next step." },
    { id: "limit", level: "medium", kind: "concept",
      q: "With continuous batching, what usually limits how many requests run at once?",
      answer: "Free KV cache memory", wrong: ["The number of CPU cores", "The vocabulary size", "The length of the system prompt only"],
      why: "Each running request holds KV cache that grows as it generates. The scheduler admits new requests only while blocks are free, which is why paged attention and a smaller cache raise concurrency." },
    { id: "chunked", level: "medium", kind: "concept",
      q: `A ${n0(LONGP.prompt)} token prompt arrives and every other user's stream freezes for about ${msx(stall)}. What fixes this first?`,
      answer: "Chunked prefill: process the prompt in pieces mixed with decode steps",
      wrong: ["A larger vocabulary", "Static batching", "A higher temperature"],
      why: `The long prefill pass blocks the batch, about ${Math.round(stall / stepMs)} missed decode steps here. Chunks let decode keep running between pieces.` },
    { id: "disagg", level: "hard", kind: "concept",
      q: "Why do some services run prefill and decode on separate pools of GPUs?",
      answer: "The phases have different bottlenecks, so each pool can be sized and tuned for its own",
      wrong: ["Decode cannot run on the GPU that did prefill", "It removes the need for a KV cache", "It halves the number of model weights needed"],
      why: "Prefill is compute bound and bursty; decode is memory bound and steady. Splitting them stops one from stalling the other, at the cost of moving the KV cache between pools." },
    { id: "pick-engine", level: "easy", kind: "concept",
      q: "You must demo an open model offline on a laptop. Which engine fits best?",
      answer: "llama.cpp", wrong: ["TensorRT-LLM", "A multi-GPU cluster with disaggregated serving", "None: open models need a data centre"],
      why: "llama.cpp aims at minimal setup on a wide range of hardware. TensorRT-LLM targets NVIDIA data-centre GPUs." },
    { id: "idle", level: "medium", kind: "numeric",
      q: `A static batch holds requests of ${IB.join(", ")} tokens. What share of slot-steps does real work?`,
      answer: `${Math.round(busy * 100)}%`, wrong: [`${Math.round((1 - busy) * 100)}%`, "100%", `${Math.round(100 / IB.length)}%`],
      why: `Work: ${IB.reduce((a, b) => a + b, 0)} token steps. Capacity: ${IB.length} slots × ${ibMax} steps = ${IB.length * ibMax}. ${IB.reduce((a, b) => a + b, 0)} / ${IB.length * ibMax} = ${Math.round(busy * 100)}%.` },
    { id: "avg-finish", level: "hard", kind: "numeric",
      q: `In the figure, average finish time is ${mS} steps with static batching. With continuous batching it is ${mC}. By what factor does continuous batching cut the average wait?`,
      answer: `About ${(mS / mC).toFixed(1)} times`, wrong: [`About ${(endS / endC).toFixed(1)} times`, "No change", `About ${((mS / mC) * 2).toFixed(1)} times`],
      why: `${mS} / ${mC} ≈ ${(mS / mC).toFixed(1)}. The total run shrinks less (${endS} to ${endC} steps); most of the gain is short requests no longer waiting for long ones.` },
    { id: "cont-out", level: "medium", kind: "output",
      q: `Continuous batching with ${OS} slots. What does this print?`,
      code: `lens, slots = ${JSON.stringify(OL)}, ${OS}\nfree = [0] * slots\nfor n in lens:\n    i = free.index(min(free))\n    free[i] += n\nprint(max(free))`,
      answer: String(oEnd), wrong: [String(oStatic), String(OL.reduce((a, b) => a + b, 0)), String(Math.max(...OL))],
      why: `Slot 1 runs ${OL[0]}, slot 2 runs ${OL[1]}. At step ${OL[1]} slot 2 frees and takes ${OL[2]}, ending at ${OL[1] + OL[2]}; slot 1 frees at ${OL[0]} and takes ${OL[3]}, ending at ${OL[0] + OL[3]}. The run ends at ${oEnd}. Static batches would take ${oStatic}.` },
    { id: "explain-cont", level: "medium", kind: "explain",
      q: "Why does continuous batching help so much?",
      answer: `Answer lengths vary widely. Under static batching a 30 token answer waits for the longest answer in its batch, and its slot does nothing meanwhile.\n\nContinuous batching schedules every step: a finished request leaves at once and a waiting request takes its slot. The GPU stays full, so throughput rises, and short requests return as soon as they are done. In the figure, average finish falls from ${mS} to ${mC} steps.` },
    { id: "explain-self-host", level: "hard", kind: "explain",
      q: "Self-host an open model or use a hosted API? List the deciding factors.",
      answer: "- Data rules: privacy, residency, or contracts that forbid sending data out.\n- Quality: the best hosted models are often ahead; test on your own evals.\n- Volume and steadiness: self-hosting pays only when GPUs stay busy; idle GPUs still cost.\n- Latency needs and where users are.\n- Team skill to run, patch and scale GPU servers.\n- Customisation: fine-tuned weights or adapters you must serve.\n\nMany teams mix: an API for hard tasks, a small self-hosted model for high-volume simple ones." },
    { id: "explain-engine", level: "medium", kind: "explain",
      q: "How would you choose a serving engine and settings for a new product?",
      answer: "Start from the hardware and the traffic. Data-centre GPUs with many users: an engine with continuous batching, paged KV cache and prefix caching. Laptops or edge: a light local engine.\n\nThen load test with real prompt and answer lengths. Measure TTFT and TPOT at p50 and p95, and throughput, while changing batch limits, chunk size, quantisation and the number of replicas. Pick the cheapest setting that meets the latency goal." },
    { id: "trap-sort", level: "medium", kind: "trap",
      claim: "Continuous batching changes the tokens a model generates for a request.",
      truth: false,
      why: "Each request's tokens depend only on its own context and sampling settings. Batching changes when its steps run, not what they compute, apart from tiny floating point differences." },
    { id: "trap-tail", level: "hard", kind: "trap",
      claim: "Pushing batch size as high as memory allows can make each user's stream slower even as total throughput rises.",
      truth: true,
      why: "Every step must also read each user's KV cache, and past the compute bend the maths grows too. Engines cap batch size to keep time per output token inside a target." },
  ],
  real: [
    { who: "Gyeong-In Yu and co-authors", when: "2022",
      what: "The Orca paper proposed iteration-level scheduling: requests that finish leave the batch, and new ones join, at each model iteration rather than per batch. On GPT-3 175B it reports 36.9 times the throughput of FasterTransformer at the same latency.",
      takeaway: "Scheduling per step, not per batch, is what lets a server keep its GPUs full on traffic of mixed lengths.",
      url: "https://www.usenix.org/conference/osdi22/presentation/yu" },
    { who: "The vLLM project", when: "2026",
      what: "Its documentation lists continuous batching, chunked prefill, prefix caching, PagedAttention, an OpenAI-compatible server, speculative decoding and several quantisation formats among its features.",
      takeaway: "The techniques in this stage ship together in one open-source engine.",
      url: "https://docs.vllm.ai/en/latest/" },
    { who: "The TensorRT-LLM project", when: "2026",
      what: "Its repository describes an open-source library for optimising inference on NVIDIA GPUs, listing speculative decoding, prefill and decode disaggregation, and FP8 and FP4 quantised models.",
      takeaway: "Vendor engines trade portability for speed on one kind of hardware.",
      url: "https://github.com/NVIDIA/TensorRT-LLM" },
    { who: "The llama.cpp project", when: "2026",
      what: "Its repository states the goal of running models with minimal setup on a wide range of hardware, and its quick start includes an OpenAI-compatible API server.",
      takeaway: "Local engines make it easy to try open models without a GPU cluster.",
      url: "https://github.com/ggml-org/llama.cpp" },
  ],
};

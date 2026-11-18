// Stage 10: mixture of experts. Every number below is computed here or in s10.calc.ts.
import type { GModule } from "../../types.ts";
import { B, capacity, dropped, expertParams, MOE, moeCount, n0, pct, r2 } from "../../stages/s10.calc.ts";

const M = moeCount(), DENSE = moeCount({ ...MOE, experts: 1, topK: 1 }), M16 = moeCount({ ...MOE, experts: 16 });
const vsDense = M.active / DENSE.total;
// numeric: expert capacity
const [CT, CF] = [4096, 1.25], CAP = capacity(CT, MOE.experts, MOE.topK, CF);
// numeric: dropped tokens with an uneven load
const LOADS = [2100, 1400, 900, 800, 700, 600, 1000, 692], DROP = dropped(LOADS, CAP);
// output: a toy layer's stored and used FFN weights
const OD = 1024, OF = 4096, OE = 8, OK = 2, OP = 3 * OD * OF;

export const MIXTURE_OF_EXPERTS: GModule = {
  id: "mixture-of-experts",
  stage: 10,
  title: "Mixture of experts",
  hook: "Store many feed-forward networks, but run only a couple of them for each token. A mixture of experts gets the knowledge of a big model at the compute of a small one, and pays for it in memory.",
  blocks: [
    { kind: "figure", id: "s10-moe-layer", caption: `A small router picks 2 of 8 expert FFNs for each token. The example model stores ${B(M.total)} parameters but each token uses only ${B(M.active)}.` },
    { kind: "text", md: `**Where the experts go.** In a transformer block, the FFN holds most of the parameters. An MoE layer replaces that one FFN with several experts plus a **router**: a small linear layer that scores every expert for each token. The top k run, and their outputs are mixed by the router's renormalised weights. Attention and embeddings stay shared.` },
    { kind: "flow", id: "s10-moe-route" },
    {
      kind: "predict",
      q: `The example model goes from ${MOE.experts} to 16 experts per layer, still top-${MOE.topK}. What happens to the parameters each token uses?`,
      answer: `They stay at ${B(M16.active)}, while the stored total grows to ${B(M16.total)}`,
      wrong: [`They double to ${B(2 * M.active)}`, `They halve, because each expert does less`, `They grow to ${B(M16.total)}`],
      why: `A token still runs ${MOE.topK} experts of the same size, so its compute does not change. Only memory grows: 8 more experts of ${n0(expertParams() / 1e6)}M parameters in each of ${MOE.layers} layers.`,
    },
    { kind: "play", id: "s10-moe" },
    {
      kind: "compare",
      head: ["", "Dense model", `MoE, ${MOE.experts} experts, top-${MOE.topK}`],
      rows: [
        ["Parameters stored", B(DENSE.total), B(M.total)],
        ["Parameters used per token", B(DENSE.active), B(M.active)],
        ["Memory to serve", "Fits the parameter count", "Must hold every expert"],
        ["Extra work", "None", "Routing, load balance, moving tokens between GPUs"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
rng = np.random.default_rng(0)
tokens, d, experts, k = 6, 8, 4, 2
x = rng.normal(size=(tokens, d))
W_router = rng.normal(size=(d, experts))
W_experts = rng.normal(size=(experts, d, d)) * 0.1   # each expert: one matrix, for brevity

logits = x @ W_router                          # one score per token per expert
top = np.argsort(-logits, axis=1)[:, :k]       # the k best experts per token
w = np.take_along_axis(logits, top, axis=1)
w = np.exp(w - w.max(axis=1, keepdims=True)); w /= w.sum(axis=1, keepdims=True)

out = np.zeros_like(x)
for t in range(tokens):
    for j in range(k):
        e = top[t, j]
        out[t] += w[t, j] * (x[t] @ W_experts[e])   # only k experts run

load = np.bincount(top.ravel(), minlength=experts)
print("experts per token:", top.tolist())
print("tokens per expert:", load.tolist())
assert np.allclose(w.sum(axis=1), 1) and load.sum() == tokens * k
`,
    },
    {
      kind: "mermaid",
      src: `flowchart TB
  T["tokens on GPU 1"] --> R["router picks experts"]
  R --> A["all-to-all: send each token to its experts' GPU"]:::warn
  A --> E["experts run on their own GPUs"]:::hot
  E --> B["all-to-all: send results back"]:::warn
  B --> M["mix by router weights, add residual"]:::ok`,
      caption: "Expert parallelism: each GPU holds some experts, and tokens travel to them and back in every MoE layer.",
    },
    { kind: "text", md: `**Keep the load even.** If the router sends most tokens to a few experts, those experts' GPUs become the bottleneck and the others idle. Each expert gets a capacity, a fixed number of slots per batch; tokens past it are dropped from that layer and carried on only by the residual. Training adds pressure, a loss term or a bias, to spread tokens out.` },
  ],
  keyPoints: [
    "An MoE layer replaces one FFN with many experts and a router that sends each token to the top k of them.",
    "Compute per token follows the active parameters; memory follows the total, because every expert must be loaded.",
    "Adding experts at the same top-k grows knowledge and memory without growing compute per token.",
    "Routers must keep the load even, with a balancing loss or bias and a capacity per expert, or busy experts become the bottleneck.",
    "Serving spreads experts over GPUs, and tokens move to them and back in every MoE layer (all-to-all).",
  ],
  questions: [
    { id: "replaces", level: "easy", kind: "concept",
      q: "In a typical MoE transformer, which part of the block becomes the set of experts?",
      answer: "The feed-forward network", wrong: ["The attention heads", "The token embeddings", "The layer norm"],
      why: "The FFN holds most of a block's parameters, so splitting it into experts gives the biggest gain in capacity. Attention stays shared by every token." },
    { id: "router", level: "easy", kind: "concept",
      q: "What does the router in an MoE layer decide?",
      answer: "Which experts each token is sent to, and how their outputs are weighted",
      wrong: ["Which GPU the whole model runs on", "Which tokens are removed from the prompt", "How many layers the token passes through"],
      why: "It is a small linear layer: one score per expert, softmax, keep the top k, renormalise. It is trained with the rest of the model." },
    { id: "mem-compute", level: "medium", kind: "concept",
      q: `An MoE model stores ${B(M.total)} parameters and uses ${B(M.active)} per token. Which statement is right?`,
      answer: `It needs memory for ${B(M.total)} but about the compute of a ${B(M.active)} dense model per token`,
      wrong: [`It needs memory for only ${B(M.active)}`, `It needs the compute of a ${B(M.total)} dense model`, "It needs both memory and compute for the total"],
      why: "Any token might pick any expert, so all of them must be loaded. But each token's matrix multiplies touch only the shared layers and its chosen experts." },
    { id: "collapse", level: "medium", kind: "concept",
      q: "Early in training, a router sends almost every token to the same two experts. Why is that bad?",
      answer: "The other experts get no training signal, and the two busy ones become the bottleneck",
      wrong: ["It makes the model use more memory", "It breaks the causal mask", "It has no effect, since the outputs are the same"],
      why: "Unused experts never learn, so the model is a small dense model in disguise. Load balancing pressure spreads the tokens so all experts train and GPUs share the work." },
    { id: "drop", level: "hard", kind: "concept",
      q: "A token is routed to an expert that is already at capacity for this batch. In a capacity-limited MoE, what usually happens?",
      answer: "The expert skips it, and the token passes on through the residual connection",
      wrong: ["The batch is restarted with a larger capacity", "The token is deleted from the sequence", "The token waits until the next forward pass"],
      why: "Capacity keeps the work per GPU fixed. A dropped token still carries its vector forward through the residual, so it loses this layer's update, not its place." },
    { id: "decode", level: "hard", kind: "concept",
      q: "Why can an MoE model be slow for one user decoding alone, even with few active parameters?",
      answer: "Different tokens pick different experts, so over a few steps most expert weights are read from memory anyway",
      wrong: ["Routers are slower than attention", "Experts cannot use the KV cache", "Top-k routing needs a sort over the vocabulary"],
      why: "Decode is limited by reading weights. Across steps the reads touch many experts, so the memory traffic is closer to the total than to the active count. Large batches amortise this." },
    { id: "ratio", level: "easy", kind: "numeric",
      q: `What fraction of the example model's ${B(M.total)} parameters does one token use?`,
      answer: pct(M.ratio), wrong: [pct(MOE.topK / MOE.experts), pct(1 / MOE.experts), pct(1)],
      why: `${B(M.active)} / ${B(M.total)} = ${pct(M.ratio)}. It is more than ${MOE.topK}/${MOE.experts} = ${pct(MOE.topK / MOE.experts)} because attention and embeddings, ${B(M.shared)}, are used by every token.` },
    { id: "capacity", level: "medium", kind: "numeric",
      q: `A batch has ${n0(CT)} tokens, ${MOE.experts} experts, top-${MOE.topK}, capacity factor ${CF}. How many slots does each expert get?`,
      answer: n0(CAP), wrong: [n0(CT / MOE.experts), n0((CT * MOE.topK) / MOE.experts), n0(CT * CF)],
      why: `There are ${n0(CT)} × ${MOE.topK} = ${n0(CT * MOE.topK)} assignments, a fair share of ${n0((CT * MOE.topK) / MOE.experts)} per expert. Times ${CF} for headroom: ${n0(CAP)}.` },
    { id: "dropped", level: "hard", kind: "numeric",
      q: `With ${n0(CAP)} slots each, the experts receive ${LOADS.join(", ")} tokens. How many assignments are dropped?`,
      answer: n0(DROP), wrong: [n0(LOADS[0] - CAP), "0", n0(LOADS.filter((l) => l > CAP).reduce((a, b) => a + b, 0))],
      why: `Only experts over ${n0(CAP)} drop: ${LOADS.filter((l) => l > CAP).map((l) => `${l} - ${CAP} = ${l - CAP}`).join(", ")}. Total ${n0(DROP)}. Spare slots on quiet experts cannot take them, which is why balance matters.` },
    { id: "out-params", level: "medium", kind: "output",
      q: "A toy MoE layer with SwiGLU experts. What does this print?",
      code: `d, ff, experts, k = ${OD}, ${OF}, ${OE}, ${OK}\nper_expert = 3 * d * ff\nprint(experts * per_expert, k * per_expert)`,
      answer: `${OE * OP} ${OK * OP}`, wrong: [`${OP} ${OK * OP}`, `${OE * OP} ${OP}`, `${OK * OP} ${OE * OP}`],
      why: `Each expert has 3 × ${OD} × ${OF} = ${n0(OP)} weights. The layer stores ${OE} of them and runs ${OK} per token.` },
    { id: "explain-why", level: "medium", kind: "explain",
      q: "Why are many frontier models mixtures of experts?",
      answer: "Quality grows with parameters, but so does compute per token in a dense model. An MoE breaks that link: it stores many experts, so it can hold more knowledge, while each token runs only a few, so training and inference FLOPs stay near those of a much smaller model.\n\nThe costs are memory for every expert, communication when experts sit on different GPUs, and the work of keeping the router's load even." },
    { id: "explain-serve", level: "hard", kind: "explain",
      q: "You must serve a large MoE model. What changes compared with a dense model of the same active size?",
      answer: "- Memory: the whole model must be loaded, so you need GPUs for the total, not the active count. Quantisation helps.\n- Parallelism: experts are spread over GPUs (expert parallelism), and each MoE layer does two all-to-all exchanges. Fast links between GPUs matter.\n- Batching: big batches let each expert see enough tokens to be efficient; tiny batches read many experts for little work.\n- Balance: hot experts make some GPUs wait, so watch per-expert load." },
    { id: "explain-balance", level: "medium", kind: "explain",
      q: "What is load balancing in an MoE, and how is it done?",
      answer: "It keeps tokens spread across experts, so every expert trains and no GPU is overloaded.\n\nThe common way is an extra loss term that grows when the router's choices are uneven. Another is a per-expert bias on the router scores, raised for idle experts and lowered for busy ones, which some recent models use instead of a loss. A capacity per expert caps the damage when balance fails." },
    { id: "trap-memory", level: "easy", kind: "trap",
      claim: `An MoE model with ${B(M.total)} stored and ${B(M.active)} active parameters still needs memory for all ${B(M.total)}.`,
      truth: true,
      why: "The router can pick any expert for the next token, so all of them must be ready in memory. Only the compute per token is reduced." },
    { id: "trap-twice", level: "medium", kind: "trap",
      claim: "With top-2 routing, a token costs exactly twice the compute of the matching dense model with one FFN of the same size.",
      truth: false,
      why: `Only the FFN part doubles. Attention and embeddings run once either way, so here it is ${r2(vsDense)} times (${B(M.active)} against ${B(DENSE.total)}), not 2.` },
  ],
  real: [
    { who: "Noam Shazeer and co-authors", when: "2017",
      what: "The sparsely-gated MoE layer used up to thousands of feed-forward experts and a trainable gate that picks a sparse few per example. It reported over 1000 times more model capacity with only minor losses in efficiency.",
      takeaway: "Sparse routing lets capacity grow far faster than compute.",
      url: "https://arxiv.org/abs/1701.06538" },
    { who: "William Fedus, Barret Zoph and Noam Shazeer", when: "2021",
      what: "Switch Transformers simplified MoE routing and trained models up to a trillion parameters. They reported up to 7 times faster pre-training than dense T5 models at the same compute.",
      takeaway: "Simpler routing made huge sparse models practical to train.",
      url: "https://arxiv.org/abs/2101.03961" },
    { who: "Albert Q. Jiang and co-authors", when: "2024",
      what: "Mixtral has 8 feed-forward experts per layer, and a router picks 2 for each token at each layer. Each token has access to 47B parameters but uses only 13B active ones during inference.",
      takeaway: "Open MoE models made the total against active split familiar.",
      url: "https://arxiv.org/abs/2401.04088" },
    { who: "DeepSeek-AI", when: "2024",
      what: "DeepSeek-V3 is an MoE model with 671B total parameters, 37B activated per token. It uses an auxiliary-loss-free load balancing strategy and was trained on 14.8 trillion tokens in 2.788M H800 GPU hours.",
      takeaway: `Very sparse models, with about 1 in ${Math.round(671 / 37)} parameters active, are trained at the frontier.`,
      url: "https://arxiv.org/abs/2412.19437" },
  ],
};

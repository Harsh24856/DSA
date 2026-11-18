// Stage 4: the transformer block. Every number below is computed here or in blockPass (stages/s4.flows.ts).
import type { GModule } from "../../types.ts";
import { blockPass } from "../../stages/s4.flows.ts";

const n0 = (x: number) => x.toLocaleString("en-US");
const r2 = (x: number) => x.toFixed(2);

const pass = blockPass();
// predict: a sublayer that outputs zeros
const X0 = [1.5, -2, 0.5];
// numeric: FFN weights; SwiGLU width that matches; attention weights
const DF = 768, ffn = 2 * DF * 4 * DF, swiH = (8 * DF) / 3;
const DA = 512;
// compare: a whole small decoder, counted (RMSNorm scales only, output tied to the embedding table)
const [CV, CD, CL] = [50_000, 768, 12], cEmb = CV * CD, cAttn = 4 * CD * CD, cFfn = 8 * CD * CD, cNorm = 2 * CD;
const cStack = CL * (cAttn + cFfn + cNorm) + CD, cTotal = cEmb + cStack;
// per token per block: weights cost 2 FLOPs per weight (24d^2), attention scores and the value mix 4nd, so they cross at n = 6d
const blockF = (d: number) => 2 * (4 + 8) * d * d, crossN = (d: number) => blockF(d) / (4 * d);
const DX = 4096;
if (crossN(CD) !== 6 * CD) throw new Error("block crossover");

export const TRANSFORMER_BLOCK: GModule = {
  id: "transformer-block",
  stage: 4,
  title: "The block (norm, FFN, residual)",
  lab: "transformer",
  hook: "A transformer is one block repeated dozens of times. Each block lets tokens talk (attention), lets each token think on its own (the FFN), and never throws away what came before (the residual). Builds on [[deep-nets-train]] (norms, residuals, pre-norm) and [[multi-head-masks]].",
  blocks: [
    { kind: "figure", id: "s4-block", caption: "A pre-norm block. The residual stream runs straight down. Each sublayer reads a normalised copy and adds its answer back, so the stream is edited, never replaced." },
    { kind: "text", md: "**Two sublayers, two jobs.** Attention moves information between tokens. The feed-forward network (FFN) then works on each token alone, with the same weights at every position: widen, apply a nonlinearity, narrow back.\n\n**Residuals and norms** work as in deep nets: each sublayer reads a normalised copy of x and adds its answer back." },
    { kind: "flow", id: "s4-block-pass" },
    {
      kind: "predict",
      q: `A pre-norm block's attention and FFN both output all zeros for a token whose vector is [${X0.join(", ")}]. What leaves the block?`,
      answer: `[${X0.join(", ")}], unchanged`,
      wrong: [`[${X0.map(() => 0).join(", ")}]`, `Its normalised copy, [${X0.map((v) => r2(v / Math.sqrt(X0.reduce((s, x) => s + x * x, 0) / X0.length))).join(", ")}]`, "Nothing: the token is dropped from the sequence"],
      why: "Each sublayer is added: x + 0 = x. A block can therefore learn to do almost nothing, which is why stacking many blocks is safe, and why gradients reach early layers through the plain additions.",
    },
    { kind: "play", id: "s4-ffn-share" },
    {
      kind: "compare",
      head: ["Part", "Formula", `At d = ${CD}`],
      rows: [
        ["Embedding table, tied with the output", "V × d", `${n0(cEmb)} at V = ${n0(CV)}`],
        ["Attention, one block", "4d²", n0(cAttn)],
        ["FFN 4d wide, one block", "8d²", n0(cFfn)],
        ["Two norm scales, one block", "2d", n0(cNorm)],
        [`${CL} blocks and a final norm`, `${CL} × (12d² + 2d) + d`, n0(cStack)],
        ["Whole model", "", n0(cTotal)],
        ["Forward FLOPs per token, one block", "24d² for the weights, 4nd for attention", `Equal at n = 6d = ${n0(crossN(CD))}`],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def rmsnorm(x, g, eps=1e-6):
    return g * x / np.sqrt((x ** 2).mean(-1, keepdims=True) + eps)

def attention(x, Wq, Wk, Wv, Wo):
    T, d = x.shape
    s = (x @ Wq) @ (x @ Wk).T / np.sqrt(d)
    s = np.where(np.tril(np.ones((T, T), dtype=bool)), s, -np.inf)   # causal
    w = np.exp(s - s.max(-1, keepdims=True)); w /= w.sum(-1, keepdims=True)
    return w @ (x @ Wv) @ Wo

def swiglu(x, Wg, Wu, Wd):
    gate = x @ Wg
    return (gate / (1 + np.exp(-gate)) * (x @ Wu)) @ Wd   # SiLU(gate) times up, then down

def block(x, p):
    x = x + attention(rmsnorm(x, p["g1"]), *p["attn"])   # pre-norm, residual
    x = x + swiglu(rmsnorm(x, p["g2"]), *p["ffn"])
    return x

rng = np.random.default_rng(0)
T, d, hid = 4, 8, 16
W = lambda a, b: rng.normal(size=(a, b)) / np.sqrt(a)
p = {"g1": np.ones(d), "g2": np.ones(d),
     "attn": [W(d, d) for _ in range(4)], "ffn": [W(d, hid), W(d, hid), W(hid, d)]}
x = rng.normal(size=(T, d))
y = block(x, p)
print("in", x.shape, "out", y.shape)
print("rms after norm:", np.round(np.sqrt((rmsnorm(x, p["g1"]) ** 2).mean(-1)), 3))

assert y.shape == x.shape                       # a block keeps the shape, so blocks stack
zero = {**p, "attn": [np.zeros((d, d))] * 4, "ffn": [np.zeros((d, hid))] * 2 + [np.zeros((hid, d))]}
assert np.allclose(block(x, zero), x)           # zero sublayers: the residual passes x through
`,
    },
    { kind: "text", md: "**Modern defaults.** RMSNorm is the usual norm. SwiGLU replaces the plain ReLU FFN: a gate branch and an up branch are multiplied, then projected down. With three matrices instead of two, the hidden width is cut to about 8d/3 to keep the weights equal." },
  ],
  keyPoints: [
    "A block is attention (tokens exchange information) then an FFN (each token processed alone with shared weights).",
    "Each sublayer is residual: x = x + sublayer(norm(x)), so the stream is added to, never replaced.",
    "SwiGLU is a gated FFN with three matrices, so its hidden width drops to about 8d/3 to keep the weights equal.",
    "The FFN holds most of a block's weights: about 8d squared against 4d squared for attention at a 4d hidden width.",
    "Per token and block, the weights cost about 24d² FLOPs and attention 4nd, so attention dominates only past n = 6d.",
  ],
  questions: [
    { id: "ffn-job", level: "easy", kind: "concept",
      q: "What does the feed-forward network in a block do?",
      answer: "Transforms each token's vector on its own, with the same weights at every position",
      wrong: ["Moves information between tokens", "Predicts the next token directly", "Applies the causal mask"],
      why: "Mixing between tokens happens only in attention. The FFN is a small MLP run on every position independently, which is where much of the model's stored knowledge appears to live." },
    { id: "swiglu-width", level: "hard", kind: "concept",
      q: "SwiGLU uses three matrices where the ReLU FFN uses two. How do models keep the weight count about the same?",
      answer: "They shrink the hidden width from 4d to about 8d/3",
      wrong: ["They drop the down projection", "They share one matrix between gate and up", "They halve the model width d"],
      why: "2 x d x 4d = 8d squared. With three d by h matrices, 3 x d x h = 8d squared gives h = 8d/3." },
    { id: "ffn-share", level: "easy", kind: "concept",
      q: "With a 4d FFN, which part of a block holds most of its weights?",
      answer: "The FFN, about two thirds", wrong: ["Attention, about two thirds", "They hold the same number", "The norms, since there are two of them"],
      why: `The FFN has 8d² weights and attention 4d², so the FFN holds 8 / 12 of the block. The norms add only 2d, ${n0(cNorm)} at d = ${CD}.` },
    { id: "swiglu-gate", level: "medium", kind: "concept",
      q: "In a SwiGLU FFN, what does the gate branch do?",
      answer: "Passed through SiLU, it multiplies the up branch unit by unit, deciding how much of each hidden unit goes on",
      wrong: ["It decides which tokens attend to which", "It replaces the down projection", "It normalises the hidden vector to length 1"],
      why: "Two projections of the same token, gate and up, are multiplied elementwise after SiLU on the gate, then projected down. The FFN still works on one token alone; only attention mixes tokens." },
    { id: "long-n", level: "hard", kind: "concept",
      q: "A model's context doubles. Per token, which part of a block's compute doubles?",
      answer: "The attention scores and value mix; the weight multiplies stay the same",
      wrong: ["The FFN, because it is the largest part", "Everything doubles together", "Nothing: per-token cost does not depend on length"],
      why: "Each token's query meets n keys and mixes n values, about 4nd FLOPs, which doubles with n. The projections and the FFN touch only the token itself, about 24d², whatever the length." },
    { id: "ffn-params", level: "medium", kind: "numeric",
      q: `d = ${DF}, and the FFN widens to 4d and back, with no biases. How many weights does it have?`,
      answer: n0(ffn), wrong: [n0(ffn / 2), n0(DF * DF), n0(ffn * 2)],
      why: `Two matrices: ${DF} x ${n0(4 * DF)} and ${n0(4 * DF)} x ${DF}, so 2 x ${DF} x ${n0(4 * DF)} = ${n0(ffn)}.` },
    { id: "swiglu-h", level: "medium", kind: "numeric",
      q: `d = ${DF}. What SwiGLU hidden width gives the same weight count as a 4d ReLU FFN?`,
      answer: n0(swiH), wrong: [n0(4 * DF), n0(3 * DF), n0(DF)],
      why: `8d/3 = 8 x ${DF} / 3 = ${n0(swiH)}. Check: 3 x ${DF} x ${n0(swiH)} = ${n0(3 * DF * swiH)}, the same as 2 x ${DF} x ${n0(4 * DF)}.` },
    { id: "attn-params", level: "easy", kind: "numeric",
      q: `d = ${DA}. How many weights are in a block's attention projections W_Q, W_K, W_V and W_O, without biases?`,
      answer: n0(4 * DA * DA), wrong: [n0(DA * DA), n0(3 * DA * DA), n0(4 * DA)],
      why: `Four ${DA} by ${DA} matrices: 4 x ${n0(DA * DA)} = ${n0(4 * DA * DA)}. Forgetting W_O gives 3d squared.` },
    { id: "cross-block", level: "hard", kind: "numeric",
      q: `Per token and block, the weights cost about 24d² FLOPs and attention about 4nd. At d = ${n0(DX)}, from what context length n does attention cost more?`,
      answer: n0(crossN(DX)), wrong: [n0(2 * DX), n0(DX), n0(4 * DX)],
      why: `4nd = 24d² gives n = 6d = ${n0(crossN(DX))}. ${n0(2 * DX)} is the crossover for the attention layer alone, from [[self-attention]], before the FFN's 16d² is counted.` },
    { id: "explain-block", level: "medium", kind: "explain",
      q: "Walk through one pre-norm decoder block.",
      answer: `1. Take the residual stream x.\n2. h = RMSNorm(x); run masked multi-head attention on h; x = x + result.\n3. h = RMSNorm(x); run the FFN on h, each token alone; x = x + result.\n4. Pass x to the next block. The shape never changes, so blocks stack.\n\nIn the walk-through above the token went from [${pass.x.join(", ")}] to [${pass.x2.map(r2).join(", ")}]: two additions, never a replacement.` },
    { id: "explain-roles", level: "medium", kind: "explain",
      q: "Attention and the FFN both transform vectors. What is the difference in their roles?",
      answer: "- Attention is communication: a token's output is a weighted mix of other tokens' values, so information moves between positions. It is the only place this happens.\n- The FFN is computation: it looks at one token's vector alone and transforms it, with the same weights everywhere. It holds most of the block's weights, and much factual knowledge appears to be stored there.\n\nA block alternates the two: gather context, then process it." },
    { id: "explain-count", level: "hard", kind: "explain",
      q: "Count the weights of a decoder-only model with vocabulary V, width d, L blocks and a 4d FFN.",
      answer: `- Embedding table: V x d. With tied output it is counted once.\n- Each block: attention 4d² (W_Q, W_K, W_V, W_O) plus FFN 8d², so 12d², plus 2d for two norm scales.\n- Total: about V d + 12 L d².\n\nAt V = ${n0(CV)}, d = ${CD}, L = ${CL}: ${n0(cEmb)} + ${n0(cStack)} = ${n0(cTotal)}, about ${(cTotal / 1e6).toFixed(0)}M. Each weight costs about 2 FLOPs per token in the forward pass.` },
    { id: "trap-ffn-shared", level: "easy", kind: "trap",
      claim: "The FFN in a block applies the same weights to every token position.",
      truth: true,
      why: "It is one MLP run on each position independently. That is why it cannot move information between tokens; only attention can." },
    { id: "trap-no-residual", level: "hard", kind: "trap",
      claim: "Without residual connections, a 100-block transformer trains just as well, only more slowly.",
      truth: false,
      why: "Without the additive path, the gradient must pass through every sublayer's derivative in turn and tends to vanish or explode. Deep transformers rely on residuals to train at all." },
  ],
  real: [
    { who: "Noam Shazeer", when: "2020",
      what: "The paper \"GLU Variants Improve Transformer\" tested gated linear units, an elementwise product of two linear projections with one passed through a nonlinearity, in the transformer's feed-forward sublayer.",
      takeaway: "Some variants gave quality improvements over the standard ReLU or GELU activations.",
      url: "https://arxiv.org/abs/2002.05202" },
  ],
};

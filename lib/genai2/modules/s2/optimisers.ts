// Stage 2: how gradients become weight updates. SGD, momentum, Adam, AdamW, schedules and clipping. Every number below is computed here or in stages/s2.flows.ts.
import type { GModule } from "../../types.ts";
import { ADAM, adamSteps, fmt, lrAt, SCHED } from "../../stages/s2.flows.ts";

const sci = (x: number) => x.toExponential(2).replace(/\.?0+e/, "e");
// predict: Adam's first step at very different gradient scales
const [GBIG, GSMALL] = [1000, 0.001], first = adamSteps([GBIG])[0].step, firstSmall = adamSteps([GSMALL])[0].step;
// uncorrected first step
const raw = adamSteps([1], false)[0].step / ADAM.lr;
// numeric: optimiser memory for a 7 billion parameter model
const NP = 7e9, GB = (bytes: number) => `${Math.round(bytes / 1e9)} GB`;
// numeric: cosine schedule halfway through the decay
const HALF = (SCHED.warm + SCHED.total) / 2;
// numeric: SGD stability on L = c w^2 / 2
const C = 50;
// output: momentum on three equal gradients
let vel = 0; for (const g of [1, 1, 1]) vel = 0.9 * vel + g;
let ema = 0; for (const g of [1, 1, 1]) ema = 0.9 * ema + 0.1 * g;
// clipping
const [NORM, MAXN] = [5, 1];

export const OPTIMISERS: GModule = {
  id: "optimisers",
  stage: 2,
  title: "Optimisers (SGD, Adam, AdamW, schedules)",
  hook: "Backprop says which way is downhill. The optimiser decides how big a step to take, for every weight, every step. Get it wrong and training crawls or blows up. Builds on [[backprop-graph]] and [[loss-gradient-descent]].",
  blocks: [
    { kind: "lab", id: "descent" },
    { kind: "text", md: "**SGD** takes one step against the gradient: w = w - lr × g, using a mini-batch to estimate g. One learning rate serves every weight.\n\n**Momentum** keeps a running sum of past gradients and steps along that instead. Noise cancels out, and a steady slope builds up speed, like a ball rolling downhill. Try both in the lab above." },
    { kind: "play", id: "s2-ravine" },
    { kind: "flow", id: "s2-adam" },
    {
      kind: "predict",
      q: `Adam, lr ${ADAM.lr}. At step 1 one weight's gradient is ${GBIG} and another's is ${GSMALL}. How far does each move?`,
      answer: `About ${fmt(first)} each`, wrong: [`${fmt(ADAM.lr * GBIG)} and ${fmt(ADAM.lr * GSMALL)}`, `${fmt(ADAM.lr * GBIG)} and ${fmt(ADAM.lr)}`, `About ${fmt(ADAM.lr * raw)} each`],
      why: `At t = 1 the bias-corrected m̂ is g and √v̂ is |g|, so the step is lr × g / |g| = lr in size: ${fmt(first)} and ${fmt(firstSmall)}. ${fmt(ADAM.lr * GBIG)} and ${fmt(ADAM.lr * GSMALL)} is what plain SGD would do.`,
    },
    { kind: "figure", id: "s2-schedule", caption: `Warmup then cosine decay, the usual schedule for transformers: ${SCHED.warm.toLocaleString("en-US")} warmup steps to a peak of ${sci(SCHED.peak)}, then a smooth fall to ${sci(SCHED.min)}.` },
    { kind: "text", md: "**Why warm up?** At the start the weights are random and Adam's averages hold only a few noisy gradients, so full-size steps can throw training off a cliff. A short linear ramp avoids that. Cosine decay then shrinks steps as the model nears a minimum, so it settles instead of bouncing around it." },
    {
      kind: "compare",
      head: ["Optimiser", "Update", "Extra numbers per weight", "Good at", "Watch out"],
      rows: [
        ["SGD", "w -= lr × g", "0", "Simple; generalises well when tuned", "One lr for every weight; slow in ravines"],
        ["Momentum", "v = β v + g; w -= lr × v", "1 (velocity)", "Speeds along steady slopes, smooths noise", "Can overshoot and swing"],
        ["Adam", "w -= lr × m̂ / (√v̂ + ε)", "2 (m and v)", "Per-weight step size, little tuning", "L2 decay is distorted: rescaled by the adaptive step, so weights with small gradients get stronger decay and weights with large ones weaker"],
        ["AdamW", "Adam step, then w -= lr × λ × w", "2 (m and v)", "Decay that does what λ says", "Same memory as Adam"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

def adam(w, g, m, v, t, lr=0.01, b1=0.9, b2=0.999, eps=1e-8):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g * g
    m_hat, v_hat = m / (1 - b1 ** t), v / (1 - b2 ** t)
    return w - lr * m_hat / (np.sqrt(v_hat) + eps), m, v

# a weight the loss no longer cares about (loss gradient 0): only decay acts on it
# Adam+L2 distorts the decay: lam * w is the whole gradient here, and Adam rescales it by its adaptive
# step, m_hat / sqrt(v_hat), to about lr per step whatever lam is, so the decay no longer follows lam
lr, steps, out = 0.01, 50, {}
for lam in (0.001, 0.1):
    w1, m, v = 1.0, 0.0, 0.0
    for t in range(1, steps + 1):        # Adam + L2: lam * w is added to the gradient
        w1, m, v = adam(w1, 0.0 + lam * w1, m, v, t, lr)
    w2 = 1.0
    for t in range(1, steps + 1):        # AdamW: the Adam step on a zero gradient is 0,
        w2 = w2 - lr * lam * w2          # then decay shrinks the weight directly
    out[lam] = (w1, w2)
    print(f"lambda {lam}: Adam+L2 -> {w1:.3f}   AdamW -> {w2:.3f}")

# with L2 inside Adam, a 100 times stronger lambda decays the weight the same way
assert abs(out[0.001][0] - out[0.1][0]) < 0.01
# AdamW's decay follows lambda
assert out[0.1][1] < out[0.001][1] - 0.03
`,
    },
  ],
  keyPoints: [
    "SGD steps against the gradient with one learning rate for every weight; momentum steps along a running sum of past gradients.",
    "Adam divides each weight's averaged gradient by the root of its averaged squared gradient, so every weight moves about lr per step whatever its gradient's scale.",
    "Bias correction divides m and v by (1 - β^t) because both start at zero.",
    "AdamW subtracts weight decay from the weights directly; the L2 penalty from [[overfitting-evaluation]], added to the gradient, is rescaled by Adam's adaptive step, which distorts the decay.",
    "Transformers usually train with AdamW, a short linear warmup, cosine decay and gradient clipping by norm.",
  ],
  questions: [
    { id: "sgd-rule", level: "easy", kind: "concept",
      q: "What is the plain SGD update for a weight w with gradient g and learning rate lr?",
      answer: "w = w - lr × g", wrong: ["w = w + lr × g", "w = w - g / lr", "w = lr × g"],
      why: "The gradient points uphill, so you step the other way, scaled by lr. Adding it climbs the loss; dividing by lr makes small learning rates take huge steps." },
    { id: "momentum-keeps", level: "medium", kind: "concept",
      q: "What extra state does momentum keep for each weight?",
      answer: "A running sum (velocity) of past gradients",
      wrong: ["The best weight value seen so far", "A running average of squared gradients", "The loss from the previous step"],
      why: "Velocity v = β v + g. Gradients that keep pointing the same way add up; ones that flip sign cancel. The squared-gradient average is Adam's second moment, not momentum." },
    { id: "adam-v", level: "medium", kind: "concept",
      q: "In Adam, what is v used for?",
      answer: "It averages squared gradients; the step is divided by √v, giving each weight its own step size",
      wrong: ["It is the velocity, the same as in momentum", "It holds the exact curvature (second derivative) of the loss", "It stores the learning rate schedule"],
      why: "Weights with big gradients get divided by a big √v, and weights with tiny gradients by a tiny one. m plays the momentum role. √v only roughly tracks scale; it is not the true curvature." },
    { id: "bias-correction", level: "hard", kind: "concept",
      q: "Why does Adam divide m by (1 - β1^t) and v by (1 - β2^t)?",
      answer: "Both start at 0, so early averages are pulled toward 0; the division undoes that bias",
      wrong: ["To decay the learning rate over time", "To clip unusually large gradients", "To apply weight decay"],
      why: `With β1 = ${ADAM.b1}, after one step m = ${fmt(1 - ADAM.b1)} × g. Dividing by 1 - ${ADAM.b1}^1 = ${fmt(1 - ADAM.b1)} recovers g. As t grows, β^t goes to 0 and the correction fades away.` },
    { id: "adamw-w", level: "medium", kind: "concept",
      q: "What does the W in AdamW change?",
      answer: "Weight decay is applied to the weights directly, separate from the gradient step",
      wrong: ["It adds a warmup to the learning rate", "It uses each weight's size to set β2", "It removes the second moment v"],
      why: "In Adam with L2, λw is added to the gradient and then divided by √v, so the decay is distorted per weight: Adam rescales it by its adaptive step. AdamW keeps the Adam step as it is and then shrinks the weights by lr × λ × w." },
    { id: "warmup-why", level: "easy", kind: "concept",
      q: "Why start training with a learning-rate warmup?",
      answer: "Early weights are random and Adam's averages hold only a few noisy gradients, so small first steps avoid a blow-up",
      wrong: ["It gives the data loader time to fill its buffer", "It makes the model memorise the first batches", "It slowly increases the batch size"],
      why: "Large early steps on poorly estimated statistics can push the model into a bad region it never recovers from (a loss spike or NaN). A few hundred or thousand steps of linear ramp is cheap insurance." },
    { id: "clip-norm", level: "medium", kind: "concept",
      q: `Gradient clipping by norm with max ${MAXN}. The whole gradient has norm ${NORM}. What happens?`,
      answer: `Every entry is multiplied by ${MAXN}/${NORM}, keeping the direction`,
      wrong: [`Each entry is clipped into [-${MAXN}, ${MAXN}] on its own`, "The step is skipped", `The learning rate is divided by ${NORM} for the rest of training`],
      why: `Norm clipping rescales the whole vector to norm ${MAXN}, so it still points the same way. Clipping entries one by one (value clipping) changes the direction. It only acts on this step.` },
    { id: "adam-memory", level: "medium", kind: "numeric",
      q: "A model has 7 billion parameters. How much memory do Adam's m and v take in 32-bit floats?",
      answer: GB(NP * 2 * 4), wrong: [GB(NP * 4), GB(NP * 16), GB(NP * 2)],
      why: `Two extra numbers per weight, 4 bytes each: 7 × 10^9 × 2 × 4 = ${GB(NP * 8)}. One state is ${GB(NP * 4)}. Weights, gradients, m and v together in fp32 are 16 bytes per weight, ${GB(NP * 16)}. Optimiser state is a big reason training needs far more memory than inference.` },
    { id: "cosine-half", level: "medium", kind: "numeric",
      q: `Warmup ends at step ${SCHED.warm.toLocaleString("en-US")}; cosine decay runs from ${sci(SCHED.peak)} down to ${sci(SCHED.min)} at step ${SCHED.total.toLocaleString("en-US")}. What is the learning rate at step ${HALF.toLocaleString("en-US")}?`,
      answer: sci(lrAt(HALF)), wrong: [sci(SCHED.peak / 2), sci(SCHED.peak), sci(SCHED.min)],
      why: `Halfway through the decay, cos(π/2) = 0, so lr = min + (peak - min) / 2 = ${sci(SCHED.min)} + ${sci((SCHED.peak - SCHED.min) / 2)} = ${sci(lrAt(HALF))}. Halving the peak forgets the floor.` },
    { id: "sgd-stable", level: "hard", kind: "numeric",
      q: `Loss L = ${C} w² / 2, plain SGD. Below what learning rate does w shrink toward 0 instead of blowing up?`,
      answer: fmt(2 / C), wrong: [fmt(1 / C), fmt(4 / C), "2"],
      why: `The gradient is ${C} w, so one step gives w × (1 - lr × ${C}). That shrinks only if |1 - ${C} lr| < 1, so lr < 2 / ${C} = ${fmt(2 / C)}. At ${fmt(1 / C)} it lands on 0 in one step; between that and ${fmt(2 / C)} it overshoots but still shrinks. Steep directions set the ceiling for the whole model.` },
    { id: "momentum-out", level: "easy", kind: "output",
      q: "What does this print?",
      code: "v = 0.0\nfor g in [1.0, 1.0, 1.0]:\n    v = 0.9 * v + g\nprint(round(v, 2))",
      answer: String(Number(vel.toFixed(2))), wrong: [(3).toFixed(1), String(Number(ema.toFixed(3))), (1).toFixed(1)],
      why: `1, then 0.9 + 1 = 1.9, then 0.9 × 1.9 + 1 = ${fmt(vel)}. A steady gradient builds speed toward 1 / (1 - 0.9) = 10 times its size. The averaging form with 0.1 × g would give ${fmt(ema)}.` },
    { id: "adam-vs-sgd", level: "medium", kind: "explain",
      q: "Adam or SGD: when would you pick each?",
      answer: "- Adam (in practice AdamW): the default for transformers and most new models. Per-weight step sizes cope with gradients of very different scales across layers and embeddings, and it needs little tuning.\n- SGD with momentum: still common for image CNNs, where with a tuned schedule it can generalise as well or better, and it stores less state (one number per weight, not two).\n\nIf memory is tight, SGD's smaller state matters. If you have little time to tune, Adam is the safer start." },
    { id: "adamw-explain", level: "hard", kind: "explain",
      q: "Explain the difference between Adam with L2 regularisation and AdamW.",
      answer: "L2 adds λw to the loss gradient. With plain SGD that is the same as shrinking the weights a little each step.\n\nIn Adam, the gradient is divided by √v. The λw term is divided too, so weights with large gradients barely decay, and the decay's strength depends on gradient history rather than on λ.\n\nAdamW decouples them: take the normal Adam step on the loss gradient, then shrink the weights directly by lr × λ × w. Decay now does what λ says. That is why AdamW is the standard for transformers." },
    { id: "schedule-explain", level: "medium", kind: "explain",
      q: "Why train with linear warmup and then cosine decay?",
      answer: "- Warmup: early steps happen with random weights and noisy optimiser statistics. Ramping lr up over the first steps prevents early loss spikes.\n- Peak: a high learning rate for most of training makes fast progress and helps escape poor regions.\n- Cosine decay: the lr falls smoothly, slowly at first and then faster, so late steps are small and the model settles into a minimum instead of bouncing around it.\n\nIt has few knobs (peak, warmup length, floor) and works well across many model sizes." },
    { id: "trap-adam-scale", level: "medium", kind: "trap",
      claim: "In Adam, a weight whose gradient is 100 times larger takes a step about 100 times larger.",
      truth: false,
      why: "Adam divides the averaged gradient by the root of the averaged squared gradient, so scaling a weight's gradients by 100 scales both by 100 and the ratio stays the same. Steps are about lr in size whatever the scale. That is SGD's behaviour, not Adam's." },
    { id: "trap-l2-sgd", level: "medium", kind: "trap",
      claim: "With plain SGD, L2 regularisation and weight decay are the same thing once the decay is scaled by the learning rate.",
      truth: true,
      why: "SGD with L2: w -= lr × (g + λw) = w - lr × g - lr λ w. Decay: shrink w by lr λ w. Identical. They differ only in adaptive optimisers like Adam, which is the point of AdamW." },
    { id: "trap-no-hats", level: "hard", kind: "trap",
      claim: `With the usual β1 = ${ADAM.b1} and β2 = ${ADAM.b2}, Adam without bias correction would take first steps that are too small, because m and v start at zero.`,
      truth: false,
      why: `Both start at zero, but the step is m / √v. After one step m = ${fmt(1 - ADAM.b1)} g and √v = √${fmt(1 - ADAM.b2)} × |g|, so the step is ${fmt(raw)} times lr: too big, not too small. v is biased down more than m, and the square root does not undo that.` },
  ],
  real: [
    { who: "Diederik Kingma and Jimmy Ba", when: "2014",
      what: "The paper \"Adam: A Method for Stochastic Optimization\" introduced Adam, built on adaptive estimates of the first and second moments of the gradient. The abstract says it is invariant to diagonal rescaling of the gradients, needs little memory and usually needs little tuning.",
      takeaway: "The rescaling invariance is the per-weight step size seen in this module.",
      url: "https://arxiv.org/abs/1412.6980" },
    { who: "Ilya Loshchilov and Frank Hutter", when: "2017",
      what: "The paper \"Decoupled Weight Decay Regularization\" showed that L2 regularisation and weight decay are equivalent for SGD but not for adaptive methods such as Adam, and proposed decoupling weight decay from the gradient update. The authors report this substantially improved Adam's generalisation.",
      takeaway: "Many libraries called L2 \"weight decay\" inside Adam; the fix is AdamW.",
      url: "https://arxiv.org/abs/1711.05101" },
  ],
};

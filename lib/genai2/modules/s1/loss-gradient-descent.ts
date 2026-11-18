// Stage 1: the loss as a landscape and gradient descent as walking downhill on it. Every number below is computed here or in stages/s1.calc.ts.
// Optimisers (momentum, Adam, schedules) are stage 2; this module stops at plain gradient descent, batches and the learning rate.
import type { GModule } from "../../types.ts";
import { BEST, fmt, GD, gdLine, gradLine, LIMIT, mean, OUTLIER } from "../../stages/s1.calc.ts";

// predict: one step on L = (w - 3)^2
const [PW, PC, PLR] = [5, 3, 0.25], pg = 2 * (PW - PC), pw1 = PW - PLR * pg;
// numeric: cross-entropy for a confident right and a confident wrong answer
const [PR, PWR] = [0.9, 0.1];
// text: one epoch of mini-batches
const [NEX, BATCH] = [10000, 100];
// numeric: steps in training
const [QEX, QBATCH, EPOCHS] = [60000, 200, 4];
// numeric: MSE and MAE on the outlier errors
const mseO = mean(OUTLIER.map((e) => e * e)), maeO = mean(OUTLIER.map(Math.abs));
// output: gradient of the MSE at w = b = 0
const OX = [1, 2, 3], OY = [2, 4, 6], og = gradLine(0, 0, OX, OY);
// text: the gradient descent run and the stability limit
const run = gdLine(GD.lr, 100), end = run[100];

export const LOSS_GRADIENT_DESCENT: GModule = {
  id: "loss-gradient-descent",
  stage: 1,
  title: "Loss and gradient descent",
  hook: "A line has a formula for its best fit. A network with billions of knobs does not. Gradient descent finds good knobs anyway: measure which way is downhill, take a small step, repeat.",
  blocks: [
    { kind: "figure", id: "s1-bowl", caption: "The loss of the practice line as you vary its slope: a bowl. The dashed tangent is the gradient at the start. Each step moves against it, and the steps shrink as the bowl flattens." },
    { kind: "text", md: "**The loss is a landscape.** Every setting of the parameters has a height: its loss. Training wants the lowest point.\n\nThe **gradient** is the slope of that landscape, one number per parameter. It points uphill, so gradient descent steps the other way:\n\nw = w - lr × dL/dw\n\nThe **learning rate** lr sets the step size. The formula needs only the slope where you stand, so it works for any model you can differentiate." },
    { kind: "flow", id: "s1-gd" },
    {
      kind: "predict",
      q: `The loss is L(w) = (w - ${PC})². You are at w = ${PW} with learning rate ${PLR}. Where does one gradient descent step take you?`,
      answer: `w = ${fmt(pw1)}`, wrong: [`w = ${fmt(PC)}`, `w = ${fmt(PW + PLR * pg)}`, `w = ${fmt(PW - PLR * (PW - PC))}`],
      why: `The gradient is 2(w - ${PC}) = ${fmt(pg)} at w = ${PW}. The step is ${PLR} × ${fmt(pg)} = ${fmt(PLR * pg)}, so w = ${PW} - ${fmt(PLR * pg)} = ${fmt(pw1)}. Jumping straight to ${PC} would need the exact lr = 0.5 for this bowl. Adding the step climbs uphill.`,
    },
    { kind: "play", id: "s1-lr" },
    { kind: "flow", id: "s1-outlier" },
    {
      kind: "compare",
      head: ["Loss", "Formula, per example", "Used for", "Behaviour"],
      rows: [
        ["Mean squared error (MSE)", "(prediction - y)²", "Predicting numbers", "Gradient 2 × error: a big miss pulls hard"],
        ["Mean absolute error (MAE)", "|prediction - y|", "Numbers with outliers", "Gradient is only the sign: every example pulls equally"],
        ["Cross-entropy (log loss)", "-ln(probability given to the right answer)", "Classes, and every next token in an LLM", `Near 0 when confident and right, ${fmt(-Math.log(PWR))} at p = ${PWR}, unbounded as p goes to 0`],
      ],
    },
    { kind: "text", md: `**Batches.** The true gradient averages over every example, which is slow for a big dataset. A **mini-batch** estimates it from a random handful, say ${BATCH}, so each step is cheap and slightly noisy. One **epoch** is one pass through all the data: ${NEX.toLocaleString("en-US")} examples in batches of ${BATCH} make ${NEX / BATCH} steps.` },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# 10,000 noisy points on y = 1.15 x + 1.68; mini-batches of 100, so one epoch is 100 steps
rng = np.random.default_rng(0)
x = rng.uniform(0.5, 4, 10_000)
y = 1.15 * x + 1.68 + 0.2 * rng.standard_normal(10_000)

w, b, lr, batch = 0.0, 0.0, 0.1, 100
for epoch in range(3):
    order = rng.permutation(len(x))              # new shuffle every epoch
    for start in range(0, len(x), batch):
        i = order[start:start + batch]
        e = w * x[i] + b - y[i]                  # errors on this batch only
        w -= lr * 2 * np.mean(e * x[i])
        b -= lr * 2 * np.mean(e)
    print(f"epoch {epoch + 1}: w {w:.3f}  b {b:.3f}  loss on all data {np.mean((w * x + b - y) ** 2):.4f}")

w_best, b_best = np.polyfit(x, y, 1)
# 300 cheap, noisy steps land close to the exact answer, but not on it: the last batches still jitter
assert abs(w - w_best) < 0.05 and abs(b - b_best) < 0.1
`,
    },
  ],
  keyPoints: [
    "The loss gives every parameter setting a height; training looks for the lowest point.",
    "The gradient points uphill, so gradient descent updates w = w - lr × dL/dw for every parameter at once.",
    "Too small a learning rate crawls; above a limit set by the steepest direction, every step overshoots and the loss grows.",
    "MSE punishes big misses most, MAE is robust to outliers, and cross-entropy, -ln of the probability of the right answer, is the loss for classes and for LLMs.",
    "A mini-batch estimates the gradient from a few examples; an epoch is one pass through all the data.",
  ],
  questions: [
    { id: "grad-dir", level: "easy", kind: "concept",
      q: "Which way does the gradient of the loss point?",
      answer: "Uphill: the direction in which the loss grows fastest", wrong: ["Downhill: the direction in which the loss falls fastest", "Toward the parameters' starting values", "Toward zero for every parameter"],
      why: "The gradient is the direction of steepest increase. That is why the update subtracts it: minus the gradient is the steepest way down from where you stand." },
    { id: "at-min", level: "easy", kind: "concept",
      q: "At the bottom of a smooth loss bowl, what is the gradient?",
      answer: "Zero for every parameter", wrong: ["Its largest value", "Equal to the learning rate", "Negative for every parameter"],
      why: "At a minimum the landscape is flat, so the slope in every direction is 0 and the update w - lr × 0 stops moving. That is also how the closed-form line is derived: set the derivatives to zero." },
    { id: "lr-big", level: "medium", kind: "concept",
      q: "The training loss gets larger every step and soon prints as inf. What is the most likely cause?",
      answer: "The learning rate is too large, so each step overshoots the minimum", wrong: ["The learning rate is too small", "The model has too few parameters", "The data set is too large"],
      why: `Beyond a limit each step lands further from the bottom than it started, so the error grows geometrically. For the practice line that happens above lr ${fmt(LIMIT.max)}; stage 2, Optimisers, shows where such a limit comes from. Too small a rate makes the loss fall slowly, never rise.` },
    { id: "minibatch", level: "medium", kind: "concept",
      q: "Why train on mini-batches instead of computing the gradient over the whole data set each step?",
      answer: "Each step is far cheaper, and a noisy estimate of the gradient is good enough to make progress", wrong: ["The gradient from a mini-batch is exact", "Mini-batches remove the need for a learning rate", "Full-data gradients point uphill"],
      why: "The average gradient over 100 random examples points roughly the same way as the average over a billion, at a tiny fraction of the cost. The noise even helps a little. Stage 2 builds optimisers on top of this." },
    { id: "ce-why", level: "medium", kind: "concept",
      q: "A classifier outputs probabilities. Why is cross-entropy preferred to squared error on those probabilities?",
      answer: "It punishes confident wrong answers without limit, so their gradient stays strong", wrong: ["It is always smaller than squared error", "It does not need a label", "It ignores the probability of the right class"],
      why: `Cross-entropy is -ln(p of the right class): ${fmt(-Math.log(PR))} at p = ${PR}, ${fmt(-Math.log(PWR))} at p = ${PWR}, and it grows without end as p goes to 0. Squared error on a probability can never exceed 1, so a badly wrong model gets a weak signal.` },
    { id: "mae-outlier", level: "hard", kind: "concept",
      q: "Your labels contain a few gross errors (typos). Which loss keeps the fit closest to the bulk of the data?",
      answer: "Mean absolute error", wrong: ["Mean squared error", "Squared error with a larger learning rate", "Cross-entropy on the raw numbers"],
      why: `MAE counts a miss by its size, MSE by its square. In the walk-through one error of ${OUTLIER[OUTLIER.length - 1]} is ${Math.round((100 * OUTLIER[OUTLIER.length - 1] ** 2) / OUTLIER.reduce((s, e) => s + e * e, 0))}% of the squared total, so MSE bends the fit toward it. Cross-entropy is for probabilities, not raw numbers.` },
    { id: "step-calc", level: "easy", kind: "numeric",
      q: `A model gives the right class probability ${PR}. What is its cross-entropy loss for this example, to 3 decimals?`,
      answer: fmt(-Math.log(PR)), wrong: [fmt(-Math.log(PWR)), fmt(1 - PR), fmt(-Math.log10(PR))],
      why: `-ln(${PR}) = ${fmt(-Math.log(PR))}. Natural log is the convention. 1 - p = ${fmt(1 - PR)} is a different quantity, and a wrong answer at p = ${PWR} would cost ${fmt(-Math.log(PWR))}.` },
    { id: "epochs", level: "medium", kind: "numeric",
      q: `${QEX.toLocaleString("en-US")} training examples, batches of ${QBATCH}, ${EPOCHS} epochs. How many gradient steps is that?`,
      answer: String((QEX / QBATCH) * EPOCHS), wrong: [String(QEX / QBATCH), String(QEX * EPOCHS), String(QEX / EPOCHS)],
      why: `One epoch is ${QEX.toLocaleString("en-US")} / ${QBATCH} = ${QEX / QBATCH} steps, one per batch. ${EPOCHS} epochs make ${(QEX / QBATCH) * EPOCHS}. The epoch count multiplies the steps; it does not multiply the examples per step.` },
    { id: "mae-calc", level: "medium", kind: "numeric",
      q: `The errors are ${OUTLIER.join(", ")}. What is the mean absolute error?`,
      answer: fmt(maeO), wrong: [fmt(mseO), fmt(mean(OUTLIER)), fmt(maeO * OUTLIER.length)],
      why: `Drop the signs and average: ${fmt(OUTLIER.reduce((s, e) => s + Math.abs(e), 0))} / ${OUTLIER.length} = ${fmt(maeO)}. Keeping the signs gives ${fmt(mean(OUTLIER))}, and squaring gives the MSE, ${fmt(mseO)}.` },
    { id: "grad-out", level: "hard", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nx = np.array([${OX.join(", ")}])\ny = np.array([${OY.join(", ")}])\nw, b = 0.0, 0.0\ne = w * x + b - y\nprint(round(2 * np.mean(e * x), 2))`,
      answer: String(Number(og.dw.toFixed(2))), wrong: [String(Number((-og.dw).toFixed(2))), String(Number(og.db.toFixed(2))), String(Number((og.dw / 2).toFixed(2)))],
      why: `The errors are ${OX.map((x, i) => -OY[i]).join(", ")}. Times x: ${OX.map((x, i) => -OY[i] * x).join(", ")}, mean ${fmt(og.dw / 2)}, doubled ${fmt(og.dw)}. Negative means increasing w lowers the loss, so the step raises w.` },
    { id: "gd-explain", level: "medium", kind: "explain",
      q: "Explain gradient descent to someone who knows no calculus.",
      answer: "- Picture the loss as hilly ground, one direction for each parameter. You are standing somewhere, blindfolded, and want the lowest point.\n- Feel the slope under your feet: that is the gradient.\n- Take a step downhill, sized by the learning rate.\n- Repeat until the ground is flat.\n\nIt needs only the local slope, which backprop computes for any network, so it scales to billions of parameters where no formula exists." },
    { id: "lr-explain", level: "hard", kind: "explain",
      q: "How would you choose a learning rate for a new model?",
      answer: "- Try a range spaced by factors of 10 (for example 1e-4 to 1e-1) on a short run and watch the training loss.\n- Too high: the loss jumps around or grows to inf. Too low: it falls smoothly but slowly.\n- Pick the largest rate that falls steadily, often a bit below where it starts to break.\n- Normalise the inputs first: features on very different scales make one direction much steeper and force a tiny rate on everything.\n\nIn stage 2 you meet schedules and Adam, which make this less fragile." },
    { id: "trap-min", level: "medium", kind: "trap",
      claim: "Minus the gradient always points straight at the minimum.",
      truth: false,
      why: "It points down the steepest slope where you stand. In a long narrow valley that is mostly across the valley, not along it, which is why plain gradient descent can zigzag. Only in a perfectly round bowl do the two agree." },
    { id: "trap-convex", level: "hard", kind: "trap",
      claim: "For a straight line fitted by mean squared error, gradient descent with a small enough learning rate reaches the same line as the least squares formula.",
      truth: true,
      why: `The MSE of a line is a single bowl with one bottom, so there is nowhere else to get stuck. Here ${run.length - 1} steps at lr ${GD.lr} give w = ${fmt(end.w)}, b = ${fmt(end.b)}, against ${fmt(BEST.w)} and ${fmt(BEST.b)}; more steps close the rest of the gap. Deep networks have no such guarantee.` },
  ],
  real: [
    { who: "Augustin-Louis Cauchy", when: "1847",
      what: "Cauchy is generally credited with first suggesting gradient descent, in 1847. Jacques Hadamard proposed a similar method on his own in 1907, and Haskell Curry first studied how well it converges on nonlinear problems in 1944.",
      takeaway: "The method that trains every LLM is a 19th century idea; what changed is computing the gradient automatically for billions of parameters.",
      url: "https://en.wikipedia.org/wiki/Gradient_descent" },
  ],
};

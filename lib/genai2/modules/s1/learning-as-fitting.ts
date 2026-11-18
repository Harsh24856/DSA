// Stage 1: what "learning" means. A model is a function with knobs, and training picks the knobs that fit the examples. Every number below is computed here or in stages/s1.calc.ts.
import type { GModule } from "../../types.ts";
import { BEST, fitLine, fmt, LINE, mean, predict } from "../../stages/s1.calc.ts";

// predict: the best line at the mean input
const atMean = predict(BEST.w, BEST.b, BEST.mx);
// numeric: a prediction from the fitted line
const XQ = 5, yq = predict(BEST.w, BEST.b, XQ);
// numeric: MSE of a tiny set
const E = [1, -2, 3], mseE = mean(E.map((e) => e * e)), maeE = mean(E.map(Math.abs));
// numeric: parameters of a linear model with d features
const D = 10;
// output: slope from cov / var on a small set
const OX = [1, 2, 3, 4], OY = [3, 5, 7, 9], ofit = fitLine(OX, OY);
// trap: errors cancel when summed without squaring
const flat = mean(LINE.ys), signed = LINE.xs.reduce((s, _, i) => s + (flat - LINE.ys[i]), 0);

export const LEARNING_AS_FITTING: GModule = {
  id: "learning-as-fitting",
  stage: 1,
  title: "Learning as fitting",
  hook: "A model is a function with knobs. Learning means turning the knobs until its outputs match the examples. An LLM does exactly this, with billions of knobs and trillions of words. Builds on [[arrays-broadcasting]].",
  blocks: [
    { kind: "figure", id: "s1-fit", caption: `Eight students: hours practised and the score they got. The line y = ${fmt(BEST.w)} x + ${fmt(BEST.b)} is the line with the smallest mean squared error on them. Training means finding that line.` },
    { kind: "play", id: "s1-line" },
    { kind: "text", md: "**Supervised learning** starts from examples: an input (hours practised) and the right answer, the **label** (the score). The **model** is a function with adjustable numbers, its **parameters**. Here the function is a line, y = w x + b, so it has two.\n\nTraining picks the parameters that make the model's outputs closest to the labels. Then you use it on inputs it has never seen." },
    {
      kind: "predict",
      q: `The best line has w = ${fmt(BEST.w)} and b = ${fmt(BEST.b)}. The students practised ${fmt(BEST.mx)} hours on average and scored ${fmt(BEST.my)} on average. What does the line predict for ${fmt(BEST.mx)} hours?`,
      answer: fmt(atMean), wrong: [fmt(BEST.w * BEST.mx), fmt(BEST.b), fmt(BEST.my + BEST.b)],
      why: `${fmt(BEST.w)} × ${fmt(BEST.mx)} + ${fmt(BEST.b)} = ${fmt(atMean)}, the mean score. A least squares line with an intercept always passes through the mean point, because b is chosen as ȳ - w x̄.`,
    },
    { kind: "flow", id: "s1-lsq" },
    { kind: "flow", id: "s1-loop" },
    {
      kind: "compare",
      head: ["Task", "Input", "Label", "Model outputs"],
      rows: [
        ["Regression", "hours practised", "a score, any number", "one number"],
        ["Classification", "an email", "spam or not", "a probability per class"],
        ["Next-token prediction (an LLM)", "the text so far", "the word that came next", "a probability for every token in the vocabulary"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# many features at once: one column per feature, plus a column of 1s for the intercept
rng = np.random.default_rng(1)
n, d = 200, 3
X = rng.normal(size=(n, d))                     # e.g. hours practised, hours slept, past score
true_w, true_b = np.array([1.5, -0.5, 2.0]), 4.0
y = X @ true_w + true_b + 0.1 * rng.normal(size=n)

A = np.column_stack([X, np.ones(n)])            # n x (d + 1) design matrix
params, *_ = np.linalg.lstsq(A, y, rcond=None)  # least squares for all d + 1 parameters
print("weights", np.round(params[:d], 2), "intercept", round(params[d], 2))

assert params.shape == (d + 1,)                 # one weight per feature, plus b
assert np.allclose(params[:d], true_w, atol=0.05) and abs(params[d] - true_b) < 0.05
assert abs(np.mean(A @ params - y)) < 1e-9      # with an intercept, the errors average to 0
`,
    },
  ],
  keyPoints: [
    "A model is a function with parameters; training chooses the parameters that make its outputs match the labels on the examples.",
    "A loss turns all the errors into one number to minimise; mean squared error is the usual one for numbers.",
    "Least squares gives the best line in closed form: slope cov(x, y) / var(x), and the line passes through the mean point.",
    "The goal is good predictions on new inputs, so a model is judged on examples it did not train on.",
    "An LLM is trained the same way: the input is the text so far and the label is the next token.",
  ],
  questions: [
    { id: "param", level: "easy", kind: "concept",
      q: "In the model y = w x + b, what are w and b called?",
      answer: "Parameters, learned from the data", wrong: ["Features, given with each example", "Labels, the right answers", "Hyperparameters, set by hand before training"],
      why: "Parameters are the numbers training adjusts. x is the feature (the input), y is the label, and hyperparameters such as the learning rate are chosen before training starts." },
    { id: "label", level: "easy", kind: "concept",
      q: "What makes learning \"supervised\"?",
      answer: "Every training example comes with the right answer (a label)", wrong: ["A person watches each training step", "The model is small enough to inspect by hand", "The data has no answers and the model finds groups"],
      why: "Supervision means labelled examples: the loss can compare each prediction with the answer. Finding groups without answers is unsupervised learning." },
    { id: "goal", level: "easy", kind: "concept",
      q: "What is the real goal of fitting a model?",
      answer: "Good predictions on new inputs it has not seen", wrong: ["Zero error on the training examples", "As many parameters as possible", "Remembering every training example exactly"],
      why: "Training error is only a means. A lookup table gets zero training error and is useless on a new input. That is why models are scored on held-out data, the topic of the overfitting module." },
    { id: "hyper", level: "medium", kind: "concept",
      q: "Which of these is a hyperparameter rather than a parameter?",
      answer: "The degree of the polynomial you choose to fit", wrong: ["The slope of a fitted line", "A weight inside a neural network", "The intercept of a fitted line"],
      why: "Hyperparameters set up the model or the training and are picked by you, usually by checking validation scores. The slope, intercept and weights are found by training itself." },
    { id: "slope-means", level: "medium", kind: "concept",
      q: `The fitted line is y = ${fmt(BEST.w)} x + ${fmt(BEST.b)}, with x in hours and y in points. What does the slope ${fmt(BEST.w)} say?`,
      answer: `On average, each extra hour goes with about ${fmt(BEST.w)} more points`, wrong: [`A student who practises 1 hour scores ${fmt(BEST.w)}`, `${fmt(BEST.w)} hours of practice are needed per point`, `The line is wrong by ${fmt(BEST.w)} points on average`],
      why: `The slope is the change in prediction per unit of input. At 1 hour the line predicts ${fmt(BEST.w + BEST.b)}, not ${fmt(BEST.w)}, because the intercept is added. It describes the data, not a cause: the line cannot tell you that practice is what raised the scores.` },
    { id: "llm-task", level: "medium", kind: "concept",
      q: "Seen as a supervised task, what is LLM pretraining?",
      answer: "Classification: for each position, pick the next token out of the whole vocabulary", wrong: ["Regression: predict one number for each sentence", "Clustering: group similar documents without labels", "Ranking: sort documents by relevance to a query"],
      why: "The label at each position is the token that actually came next, and the model outputs one probability per vocabulary entry. The labels come free from the text itself, which is why it is sometimes called self-supervised." },
    { id: "why-line", level: "hard", kind: "concept",
      q: "You fit a line to data that clearly curves upward. What happens?",
      answer: "The best line still misses in a pattern: too high in the middle, too low at both ends", wrong: ["Least squares bends the line to follow the curve", "The error becomes zero because least squares is exact", "The fit fails and returns no line"],
      why: "Least squares finds the best member of the family you chose. If the family is lines, no setting of w and b can bend. A pattern left in the errors is the sign that the model family is too simple." },
    { id: "pred-5", level: "easy", kind: "numeric",
      q: `With the fitted line y = ${fmt(BEST.w)} x + ${fmt(BEST.b)}, what score does it predict for ${XQ} hours?`,
      answer: fmt(yq), wrong: [fmt(BEST.w * XQ), fmt(BEST.w + BEST.b * XQ), fmt(yq + BEST.w)],
      why: `${fmt(BEST.w)} × ${XQ} + ${fmt(BEST.b)} = ${fmt(yq)}. Note ${XQ} hours is beyond the data, which stops at ${LINE.xs[LINE.xs.length - 1]}: an extrapolation, which a line makes confidently whether or not the pattern holds there.` },
    { id: "mse-small", level: "easy", kind: "numeric",
      q: `A model's errors on three examples are ${E.join(", ")}. What is the mean squared error?`,
      answer: fmt(mseE), wrong: [fmt(mean(E)), fmt(maeE), fmt(mseE * E.length)],
      why: `Square, then average: (${E.map((e) => e * e).join(" + ")}) / ${E.length} = ${fmt(mseE)}. The plain mean of the errors, ${fmt(mean(E))}, and the mean absolute error, ${fmt(maeE)}, are different measures.` },
    { id: "param-count", level: "medium", kind: "numeric",
      q: `A linear model predicts a price from ${D} input features: y = w1 x1 + ... + w${D} x${D} + b. How many parameters does it have?`,
      answer: String(D + 1), wrong: [String(D), String(2 * D), String(D * D)],
      why: `One weight per feature plus one intercept: ${D} + 1 = ${D + 1}. The line in this module is the same with one feature: 2 parameters.` },
    { id: "slope-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `import numpy as np\nx = np.array([${OX.join(", ")}])\ny = np.array([${OY.join(", ")}])\nw = np.mean((x - x.mean()) * (y - y.mean())) / np.mean((x - x.mean()) ** 2)\nb = y.mean() - w * x.mean()\nprint(round(w, 2), round(b, 2))`,
      answer: `${ofit.w.toFixed(1)} ${ofit.b.toFixed(1)}`, wrong: [`${ofit.b.toFixed(1)} ${ofit.w.toFixed(1)}`, `${fmt(mean(OY) / mean(OX))} 0.0`, `${ofit.w.toFixed(1)} 0.0`],
      why: `The points lie exactly on y = ${fmt(ofit.w)} x + ${fmt(ofit.b)}, so least squares recovers that line with zero error. Python prints the floats as ${ofit.w.toFixed(1)} and ${ofit.b.toFixed(1)}.` },
    { id: "learning-is", level: "medium", kind: "explain",
      q: "In one minute: what does it mean for a model to learn?",
      answer: "- Pick a family of functions with adjustable numbers, the parameters: a line, or a transformer.\n- Define a loss that scores how far the predictions are from the labels on the training examples.\n- Search for the parameters with the lowest loss: in closed form for a line, by gradient descent for a network.\n- Check on held-out examples. Learning worked only if the error stays low on data the model never saw." },
    { id: "why-square", level: "medium", kind: "explain",
      q: "Why is the error squared in mean squared error, instead of just summing the errors?",
      answer: `- Signs would cancel. A flat line at the mean score has errors that add up to ${fmt(Math.round(signed * 1e9) / 1e9)} on this data, yet it ignores the trend completely.\n- Squaring makes every miss count positively and punishes big misses more than small ones.\n- It is smooth, so its derivative is simple (2 × error), which makes it easy to minimise in closed form or by gradient descent.` },
    { id: "llm-explain", level: "hard", kind: "explain",
      q: "How is training an LLM like fitting a line, and how is it different?",
      answer: "The recipe is the same: a function with parameters, a loss, and a search for the lowest loss. What changes:\n\n- The function is a deep transformer with billions of parameters, not two.\n- The output is a probability over the whole vocabulary, so the loss is cross-entropy rather than squared error.\n- There is no closed form: parameters are found by gradient descent over many steps.\n- Every position in a document is its own example, so one page of text gives hundreds of training pairs." },
    { id: "trap-exact", level: "medium", kind: "trap",
      claim: "Least squares only works when the points lie exactly on a line.",
      truth: false,
      why: `It finds the line with the smallest squared error for any points. The practice data is noisy, and the best line still leaves an MSE of ${fmt(BEST.loss)}. Points exactly on a line are the special case where that error is 0.` },
    { id: "trap-errsum", level: "hard", kind: "trap",
      claim: "For a least squares line with an intercept, the errors on the training points always add up to zero.",
      truth: true,
      why: `Setting the derivative of the MSE with respect to b to zero says 2 × mean(error) = 0. Any line with a different mean error could lower its loss by shifting b. On the practice data the errors sum to ${fmt(Math.round(LINE.xs.reduce((a, x, i) => a + predict(BEST.w, BEST.b, x) - LINE.ys[i], 0) * 1e9) / 1e9)}.` },
  ],
  real: [
    { who: "Adrien-Marie Legendre and Carl Friedrich Gauss", when: "1805 and 1809",
      what: "Legendre published the first clear account of the method of least squares in 1805, in a work on finding the orbits of comets. Gauss published his own version in 1809 and claimed he had had the method since 1795, which started a dispute over who came first. Gauss had used least squares to predict where the lost asteroid Ceres would reappear, and it was found again using his predictions.",
      takeaway: "Fitting a model to noisy observations so it predicts something unseen is over two hundred years old.",
      url: "https://en.wikipedia.org/wiki/Least_squares" },
  ],
};

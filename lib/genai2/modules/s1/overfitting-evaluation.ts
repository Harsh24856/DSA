// Stage 1: how we know a model works. Overfitting, the three splits, and precision, recall and F1. Every number below is computed here or in stages/s1.calc.ts.
// Regularisation tools (dropout, weight decay) are stage 2; this module is about measuring.
import type { GModule } from "../../types.ts";
import { BEST_DEG, confusion, DEGREES, fmt, POLY, SPAM } from "../../stages/s1.calc.ts";

const pct = (x: number) => `${Math.round(100 * x)}%`;
// predict: a rare class and a model that always says no
const [NALL, NPOS] = [1000, 10], accNo = (NALL - NPOS) / NALL;
// numeric: metrics from counts
const [TP, FP, FN] = [30, 10, 20], P = TP / (TP + FP), R = TP / (TP + FN), F1 = (2 * P * R) / (P + R), meanPR = (P + R) / 2;
// numeric: the walk-through at its default threshold
const c50 = confusion(0.5), c90 = confusion(0.9), c30 = confusion(0.3), c80 = confusion(0.8), c85 = confusion(0.85);
if (!(c85.precision < c80.precision)) throw new Error("precision no longer falls from 0.8 to 0.85: fix the trap below");
// explain: under, good, over
const [U, G, O] = [DEGREES[1], DEGREES[BEST_DEG], DEGREES[10]];
// trap: training error never rises with degree
const trainFalls = DEGREES.every((d, i) => i === 0 || d.train <= DEGREES[i - 1].train + 1e-12);
if (!trainFalls) throw new Error("training error rose with degree: the trap below would be wrong");
// numeric: k-fold
const [NK, K] = [1200, 5];

export const OVERFITTING_EVALUATION: GModule = {
  id: "overfitting-evaluation",
  stage: 1,
  title: "Overfitting and evaluation",
  hook: "A model that aces its training data can still fail on everything new. The only honest score comes from data it never saw, and the right score depends on which mistakes hurt.",
  blocks: [
    { kind: "figure", id: "s1-curves", caption: `Polynomials of rising degree fitted to the same ${POLY.tx.length} noisy points. Training error (dashed) keeps falling. Validation error, on ${POLY.vx.length} new points, bottoms out at degree ${BEST_DEG} and then climbs.` },
    { kind: "play", id: "s1-data" },
    { kind: "text", md: "**Overfitting** is fitting the noise. A flexible model can bend through every training point, including the random wobble in each label, and then predicts new points badly. **Underfitting** is the opposite: the model is too stiff to follow the real pattern, so it is wrong on both sets.\n\nYou cannot see either from training error alone. You need data the model did not train on." },
    { kind: "flow", id: "s1-split" },
    {
      kind: "mermaid",
      src: `flowchart TB
  subgraph A["Training error high?"]
    A1["yes"] --> A2["underfit: bigger model, better features, train longer"]:::warn
  end
  subgraph B["Training low, validation much higher?"]
    B1["yes"] --> B2["overfit: more data, simpler model, regularise (stage 2)"]:::bad
  end
  subgraph C["Both low and close?"]
    C1["yes"] --> C2["score once on test"]:::ok
  end
  A --> B --> C`,
      caption: "Reading the two errors. Compare training error with validation error first; the test set waits until the end.",
    },
    {
      kind: "predict",
      q: `${NALL.toLocaleString("en-US")} emails, ${NPOS} of them spam. A filter marks every email "not spam". What are its accuracy and its recall on spam?`,
      answer: `Accuracy ${pct(accNo)}, recall 0%`, wrong: [`Accuracy ${pct(accNo)}, recall ${pct(accNo)}`, `Accuracy ${pct(NPOS / NALL)}, recall 0%`, "Accuracy 50%, recall 50%"],
      why: `It is right on all ${NALL - NPOS} good emails, so accuracy is ${NALL - NPOS} / ${NALL.toLocaleString("en-US")} = ${pct(accNo)}. It catches none of the ${NPOS} spam, so recall is 0 / ${NPOS} = 0%. On a rare class accuracy hides everything; precision and recall do not.`,
    },
    { kind: "play", id: "s1-threshold" },
    { kind: "text", md: "**Which metric?** **Precision** asks: when the model says yes, how often is it right? **Recall** asks: of all the real yeses, how many did it find? **F1** is their harmonic mean, high only when both are.\n\nPick by the cost of each mistake. A spam filter that hides a real email is worse than one that lets spam through, so favour precision. A cancer screen should favour recall." },
    {
      kind: "code",
      run: true,
      src: `import numpy as np
P = np.polynomial.polynomial

# only 30 labelled points: too few to give up a third of them to one validation split
rng = np.random.default_rng(0)
x = rng.uniform(-1, 1, 30)
y = np.sin(np.pi * x) + 0.25 * rng.standard_normal(30)

def cv_error(deg, k=5):
    folds = np.array_split(rng.permutation(30), k)     # 5 folds of 6 points
    errs = []
    for f in folds:
        train = np.setdiff1d(np.arange(30), f)          # fit on the other 24
        c = P.polyfit(x[train], y[train], deg)
        errs.append(np.mean((P.polyval(x[f], c) - y[f]) ** 2))
    return np.mean(errs)                                # every point is validated once

scores = {deg: cv_error(deg) for deg in range(1, 10)}
for deg, s in scores.items():
    print(f"degree {deg}: 5-fold error {s:.3f}")
best = min(scores, key=scores.get)
print("chosen degree:", best)

assert 3 <= best <= 6                                   # neither the straight line nor the wiggliest curve
assert scores[1] > scores[best] and scores[9] > scores[best]
`,
    },
  ],
  keyPoints: [
    "Overfitting fits the noise in the training data: training error is low and validation error is much higher. Underfitting is high error on both.",
    "Train fits the parameters, validation picks settings such as degree or checkpoint, and test is scored once at the end.",
    "Tuning on the test set, or letting test examples leak into training, makes the score optimistic.",
    "Precision is TP / (TP + FP), recall is TP / (TP + FN), and F1 is their harmonic mean; accuracy misleads on a rare class.",
    "Moving the decision threshold trades precision against recall; choose it by the cost of each kind of mistake.",
  ],
  questions: [
    { id: "overfit-sign", level: "easy", kind: "concept",
      q: "Which pattern shows overfitting?",
      answer: "Low training error, much higher validation error", wrong: ["High training error, high validation error", "Training and validation error both low and close", "Validation error lower than training error"],
      why: "The model has learned things true only of its training examples, including their noise. High error on both sets is underfitting; both low and close is what you want." },
    { id: "val-role", level: "easy", kind: "concept",
      q: "What is the validation set for?",
      answer: "Choosing settings such as model size, degree or when to stop", wrong: ["Fitting the parameters by gradient descent", "Reporting the final score in the paper", "Adding more training examples"],
      why: "Parameters are fitted on train. Every decision made by looking at validation scores shapes the model a little, which is why a separate test set gives the final, honest number." },
    { id: "precision-def", level: "easy", kind: "concept",
      q: "What does precision measure?",
      answer: "Of the items the model flagged, the fraction that are really positive", wrong: ["Of the real positives, the fraction the model flagged", "The fraction of all items classified correctly", "How close the scores are to 0 or 1"],
      why: "Precision = TP / (TP + FP). The second option is recall, TP / (TP + FN), and the third is accuracy." },
    { id: "favour-recall", level: "medium", kind: "concept",
      q: "For which system should you favour recall over precision?",
      answer: "A first screen for a serious disease, where a follow-up test checks every positive", wrong: ["A spam filter that deletes flagged mail without asking", "A search page that shows only its top 3 results", "An alert that wakes an engineer at night"],
      why: "Missing a sick patient is costly and a false alarm only costs a second test, so catch everything. The other three make false positives expensive, so they want precision." },
    { id: "leak", level: "medium", kind: "concept",
      q: "You scale features using the mean and standard deviation of the whole data set, then split into train and test. What is wrong?",
      answer: "Test information leaked into training, so the test score is optimistic", wrong: ["Nothing, scaling has no parameters", "The model will underfit", "The test set becomes larger than the training set"],
      why: "The mean and spread are parameters learned from data. Compute them on the training split only, then apply them to validation and test. Leakage like this is easy to miss and inflates scores." },
    { id: "more-data", level: "medium", kind: "concept",
      q: "A degree 9 polynomial overfits 12 points. Which change helps most without touching the model?",
      answer: "Collect many more training points", wrong: ["Train for more steps", "Score it on the training set instead", "Use a higher degree"],
      why: "With many points spread over the range, the curve cannot weave through each one's noise without paying for it elsewhere, so it is pulled toward the real pattern. More steps or more degree make the fit to the training points tighter, not better." },
    { id: "contamination", level: "hard", kind: "concept",
      q: "An LLM scores very well on a public benchmark that was posted online before its training data was collected. What is the main worry?",
      answer: "The test questions may be in its training text, so it may have memorised answers", wrong: ["The benchmark is too easy for any model", "Public benchmarks always underestimate models", "The model's tokenizer cannot read the questions"],
      why: "Web-scale training data can contain benchmark questions and answers. The score then measures recall of seen text, not skill. The same rule as for any model applies: test data must be unseen." },
    { id: "kfold", level: "hard", kind: "concept",
      q: `With only ${NK.toLocaleString("en-US")} labelled examples, what does ${K}-fold cross-validation do?`,
      answer: `Trains ${K} times, each time holding out a different ${NK / K} examples for validation, and averages the ${K} scores`, wrong: [`Trains once on ${NK / K} examples and validates on the rest`, `Splits the data into ${K} test sets that are each scored ${K} times`, `Trains ${K} models on the same split and keeps the best`],
      why: `Every example is used for validation exactly once and for training ${K - 1} times, so a small data set gives a steadier estimate than one split. The cost is ${K} training runs.` },
    { id: "metrics-counts", level: "medium", kind: "numeric",
      q: `A classifier has ${TP} true positives, ${FP} false positives and ${FN} false negatives. What is its F1?`,
      answer: fmt(F1), wrong: [fmt(meanPR), fmt(P), fmt(R)],
      why: `Precision = ${TP} / ${TP + FP} = ${fmt(P)}, recall = ${TP} / ${TP + FN} = ${fmt(R)}. F1 = 2PR / (P + R) = ${fmt(F1)}, a little below the plain average ${fmt(meanPR)}: the harmonic mean is pulled toward the weaker of the two.` },
    { id: "spam-50", level: "easy", kind: "numeric",
      q: `In the threshold walk-through at 0.5, the filter flags ${c50.tp + c50.fp} emails and ${c50.tp} of them are spam. What is the precision, to 3 decimals?`,
      answer: fmt(c50.precision), wrong: [fmt(c50.recall), fmt(c50.acc), fmt(c50.tp / SPAM.scores.length)],
      why: `${c50.tp} / ${c50.tp + c50.fp} = ${fmt(c50.precision)}. Recall at this threshold is ${fmt(c50.recall)} and accuracy ${fmt(c50.acc)}. Raise the threshold to 0.9 and precision reaches ${fmt(c90.precision)} while recall falls to ${fmt(c90.recall)}.` },
    { id: "f1-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `tp, fp, fn = ${TP}, ${FP}, ${FN}\nprecision = tp / (tp + fp)\nrecall = tp / (tp + fn)\nprint(round(2 * precision * recall / (precision + recall), 3))`,
      answer: String(Number(F1.toFixed(3))), wrong: [String(Number(meanPR.toFixed(3))), String(Number(P.toFixed(3))), String(Number(R.toFixed(3)))],
      why: `Precision ${fmt(P)}, recall ${fmt(R)}, F1 ${fmt(F1)}. The same value comes from 2TP / (2TP + FP + FN) = ${2 * TP} / ${2 * TP + FP + FN}.` },
    { id: "bias-var", level: "hard", kind: "explain",
      q: "Explain underfitting and overfitting using training and validation error.",
      answer: `- Underfitting: the model is too simple for the pattern. Training error is high and validation error is about as high. On the polynomial data, degree ${U.deg} has train ${fmt(U.train)} and validation ${fmt(U.val)}.\n- Overfitting: the model is flexible enough to fit the noise. Training error is low but validation error is much higher. Degree ${O.deg} has train ${fmt(O.train)} and validation ${fmt(O.val)}.\n- In between, degree ${G.deg} gives the lowest validation error, ${fmt(G.val)}.\n\nFixes: for underfitting a bigger model or better features; for overfitting more data, a simpler model, regularisation or early stopping.` },
    { id: "no-test-tuning", level: "medium", kind: "explain",
      q: "Why must you not choose hyperparameters by looking at the test score?",
      answer: "- Each choice that improves the test score fits the model a little to that particular test set, its quirks and noise included.\n- Try enough settings and one will score well by luck. The best of them is then an optimistic estimate.\n- The test set exists to estimate performance on truly new data. Once it has guided choices, it is a second validation set and you no longer have an honest number.\n\nSo tune on validation (or cross-validation) and score test once." },
    { id: "pick-threshold", level: "hard", kind: "explain",
      q: "Your classifier outputs a score from 0 to 1. How do you choose the threshold?",
      answer: `- Do not assume 0.5. Sweep thresholds on the validation set and compute precision and recall at each.\n- Decide what each mistake costs. If false positives are expensive, pick a high threshold; if misses are expensive, a low one.\n- Or set a target, such as "recall at least 95%", and take the highest threshold that meets it.\n- F1 is a reasonable default when both mistakes cost about the same.\n\nIn the walk-through, 0.3 gives precision ${fmt(c30.precision)} and recall ${fmt(c30.recall)}; 0.9 gives ${fmt(c90.precision)} and ${fmt(c90.recall)}.` },
    { id: "trap-train-falls", level: "medium", kind: "trap",
      claim: "On a fixed training set, raising the degree of a least squares polynomial never increases its training error.",
      truth: true,
      why: `A degree d + 1 polynomial can copy any degree d one by setting its top coefficient to 0, so its best fit is at least as good. On the module's data training error falls from ${fmt(DEGREES[0].train)} at degree 0 to ${fmt(DEGREES[10].train)} at degree 10. Validation error is another story.` },
    { id: "trap-precision-up", level: "hard", kind: "trap",
      claim: "Raising the decision threshold can never lower precision.",
      truth: false,
      why: `It usually raises it, but not always. In the walk-through, going from 0.8 to 0.85 drops one more spam email from the flagged set and keeps a good one, so precision falls from ${fmt(c80.precision)} to ${fmt(c85.precision)}. Recall, in contrast, can only fall or stay as the threshold rises.` },
  ],
  real: [
    { who: "Benjamin Recht, Rebecca Roelofs, Ludwig Schmidt and Vaishaal Shankar", when: "2019",
      what: "The authors built new test sets for CIFAR-10 and ImageNet following the original collection process, then scored many existing image classifiers on them. Accuracy dropped by 3% to 15% on CIFAR-10 and 11% to 14% on ImageNet. They concluded the drops were not caused by years of tuning on the old test sets, but by the models failing on slightly harder images.",
      takeaway: "Even a carefully made test set is one sample; a fresh sample of the same kind of data can give a noticeably lower score.",
      url: "https://arxiv.org/abs/1902.10811" },
  ],
};

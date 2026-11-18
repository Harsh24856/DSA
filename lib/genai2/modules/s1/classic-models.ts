// Stage 1: the five classic models interviews still ask about: logistic regression, k-NN, SVM, k-means and PCA, one walk-through each.
// Every number below is computed here or in stages/s1.calc.ts.
import type { GModule } from "../../types.ts";
import { accuracy, BLOBS, ELBOW, fmt, kmeans, knn, LOGIT_RUN, maxMargin, pca2d, perceptron, margin, sigmoid, SVM_PTS, trainLogit, TREE_TEST } from "../../stages/s1.calc.ts";

const pct = (x: number) => `${Math.round(100 * x)}%`;
// text: the trained logistic model's odds ratio
const lg = trainLogit(LOGIT_RUN.lr, LOGIT_RUN.show[LOGIT_RUN.show.length - 1]).at(-1)!, odds = Math.exp(lg.w);
// predict: where p = 0.5
const [PW, PB] = [2, -6], px = -PB / PW;
if (Math.abs(sigmoid(PW * px + PB) - 0.5) > 1e-12) throw new Error("predict: the boundary is not at p = 0.5");
// numeric: odds ratio of a weight
const OW = 0.7;
// numeric: SVM street width from w
const SW = [3, 4], width = 2 / Math.hypot(SW[0], SW[1]);
// numeric: variance kept by the top two of three components
const EV = [6, 3, 1], kept = (EV[0] + EV[1]) / (EV[0] + EV[1] + EV[2]);
// output: one k-means step in one dimension
const KX = [1, 2, 9, 10, 11], KC = [1, 2];
const near = KX.map((x) => (Math.abs(x - KC[0]) <= Math.abs(x - KC[1]) ? 0 : 1));
const newC = KC.map((_, j) => { const g = KX.filter((_, i) => near[i] === j); return g.reduce((s, x) => s + x, 0) / g.length; });
const pyList = (xs: number[]) => `[${xs.map((x) => (Number.isInteger(x) ? x.toFixed(1) : String(x))).join(", ")}]`;
// k-NN and SVM numbers from the walk-throughs
const knnTest = (k: number) => accuracy((p) => knn(p, k).pred, TREE_TEST);
const K1 = knnTest(1), K5 = knnTest(5), K25 = knnTest(25), mm = maxMargin(), pc = perceptron(), pm = margin(pc.w, pc.b);
// k-means: starts that land in different places
const k4 = [1, 2, 3, 4, 5].map((s) => kmeans(4, s).at(-1)!.inertia), k4lo = Math.min(...k4), k4hi = Math.max(...k4);
if (k4hi - k4lo < 1) throw new Error("every k = 4 start now reaches the same inertia: fix the k-means text and trap");
const pca = pca2d();

export const CLASSIC_MODELS: GModule = {
  id: "classic-models",
  stage: 1,
  title: "Classic models (logistic regression, k-NN, SVM, k-means, PCA)",
  hook: "Before deep learning, five models covered most of machine learning, and interviews still ask about each. Every one carries an idea LLM systems reuse: probabilities from a sigmoid, search by nearest neighbour, margins, clusters and compression. Builds on [[loss-gradient-descent]], [[overfitting-evaluation]] and [[decision-trees]].",
  blocks: [
    { kind: "flow", id: "s1-logit" },
    { kind: "text", md: `**Logistic regression** passes a linear score z = w x + b through the sigmoid, σ(z) = 1 / (1 + e^-z), to get a probability. It is trained by gradient descent on log loss, the cross-entropy of [[loss-gradient-descent]]. The boundary p = 0.5 is where z = 0: a straight line, or a plane with more features. A weight reads as odds: here one more hour multiplies the odds of passing by e^${fmt(lg.w)} = ${fmt(odds)}.` },
    {
      kind: "predict",
      q: `A logistic regression has w = ${PW} and b = ${PB}. At which x does it give p = 0.5?`,
      answer: `x = ${fmt(px)}`, wrong: [`x = ${fmt(-PB)}`, `x = ${fmt(PB / PW)}`, "x = 0.5"],
      why: `p = 0.5 exactly when σ's input is 0: ${PW}x ${PB < 0 ? "-" : "+"} ${Math.abs(PB)} = 0, so x = ${fmt(px)}. Above it the score is positive and p > 0.5. The 0.5 is the output of σ, not an input.`,
    },
    { kind: "play", id: "s1-knn" },
    { kind: "text", md: `**k-nearest neighbours** keeps the training set and predicts the majority of the k closest points (their mean, for a number). k is the knob: on this data k = 1 scores ${pct(K1)} on test, k = 5 ${pct(K5)}, k = 25 ${pct(K25)}. Scale the features first, or the widest one decides every distance. Each prediction scans the data, which is why large systems use approximate search; [[vector-search]] (later, stage 7) does that for embeddings.` },
    { kind: "flow", id: "s1-svm" },
    { kind: "text", md: `**Support vector machines** choose the separating line with the widest margin; only the support vectors fix it. Here the perceptron's line clears its nearest point by ${fmt(pm)}, the SVM's by ${fmt(mm.half)}. When classes overlap, a **soft margin** lets points inside the street at a cost C each: large C fits training tightly, small C keeps the street wide. A **kernel** such as RBF replaces the dot product with a similarity, giving curved boundaries.` },
    { kind: "play", id: "s1-kmeans" },
    { kind: "figure", id: "s1-elbow", caption: `Inertia of the best of five k-means runs for each k on the ${BLOBS.length} points. It drops fast until k = 3, the number of real blobs, then flattens: the elbow.` },
    { kind: "text", md: `**k-means** groups unlabelled points: pick k centres, assign every point to the nearest, move each centre to its points' mean, repeat until nothing changes. Inertia never rises, but it can settle in a poor local optimum: with k = 4 the five starts end between ${fmt(k4lo)} and ${fmt(k4hi)}. So run several starts, or spread them with **k-means++**, and keep the lowest. Pick k at the elbow, or by silhouette score.` },
    { kind: "play", id: "s1-pca" },
    { kind: "text", md: `**PCA** finds the directions along which the data varies most: the eigenvectors of the covariance matrix, ordered by eigenvalue. Keeping the top few stores each point in fewer numbers while losing the least variance; here one direction keeps ${pct(pca.l1 / pca.total)}. Centre the data first and standardise features in different units. PCA ignores labels, so the direction of most variance need not separate the classes.` },
    {
      kind: "compare",
      head: ["Model", "Learns", "Output", "Main knob", "Watch out"],
      rows: [
        ["Logistic regression", "Weights by gradient descent on log loss", "A probability; a straight boundary", "Regularisation strength", "Cannot bend the boundary without new features"],
        ["k-NN", "Nothing: stores the data", "Majority of the k nearest", "k", "Feature scale; slow predictions on big data"],
        ["SVM", "The widest-margin boundary", "A side of the street, no probability", "C, the kernel", "Slow on very large data sets"],
        ["k-means", "k centres, no labels", "A cluster per point", "k, the starts", "Assumes round, similar-sized clusters"],
        ["PCA", "Directions of most variance, no labels", "Fewer numbers per point", "Components kept", "Linear; sensitive to feature scale"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# PCA two ways on 200 correlated points: eigenvectors of the covariance, and the SVD of the centred data
rng = np.random.default_rng(0)
t = rng.standard_normal(200)
X = np.column_stack([3 * t + 0.5 * rng.standard_normal(200), 2 * t + 0.5 * rng.standard_normal(200)])
Xc = X - X.mean(axis=0)                                 # centre first

vals, vecs = np.linalg.eigh(np.cov(Xc, rowvar=False))   # ascending order
pc1 = vecs[:, -1]
print("variance kept by PC1:", round(vals[-1] / vals.sum(), 3))

U, S, Vt = np.linalg.svd(Xc, full_matrices=False)
assert np.allclose(abs(Vt[0] @ pc1), 1)                 # same direction, up to sign
z = Xc @ pc1                                            # one number per point instead of two
assert np.isclose(z.var(ddof=1), vals[-1])              # the kept variance is the top eigenvalue

# one k-means step: assign to the nearest centre, then move each centre to its points' mean
C = Xc[:2].copy()
assign = np.argmin(((Xc[:, None, :] - C[None]) ** 2).sum(axis=2), axis=1)
C = np.array([Xc[assign == j].mean(axis=0) for j in range(2)])
print("centres after one step:", C.round(2).tolist())
`,
    },
  ],
  keyPoints: [
    "Logistic regression is a linear score through a sigmoid, trained on log loss; its boundary is straight and each weight multiplies the odds by e^w.",
    "k-NN stores the data and votes among the k nearest; small k overfits, large k underfits, and features must share a scale.",
    "An SVM picks the widest-margin boundary, fixed only by its support vectors; C trades margin width against training errors and kernels bend the boundary.",
    "k-means alternates assigning points to the nearest centre and moving centres to the mean; it finds a local optimum, so use several starts and choose k at the elbow.",
    "PCA projects onto the top eigenvectors of the covariance matrix, keeping the most variance in the fewest numbers; centre and scale first, and remember it ignores labels.",
  ],
  questions: [
    { id: "logit-boundary", level: "easy", kind: "concept",
      q: "A logistic regression uses two features. What shape is its decision boundary at p = 0.5?",
      answer: "A straight line", wrong: ["An S-shaped curve", "A circle around one class", "A staircase of axis-parallel steps"],
      why: "p = 0.5 where w1 x1 + w2 x2 + b = 0, which is a line. The S shape is how p changes across the line, not the line itself. A staircase is what a decision tree draws." },
    { id: "knn-scale", level: "medium", kind: "concept",
      q: "k-NN on two features: height in metres (1.5 to 2) and income in rupees (up to 1,000,000), unscaled. What happens?",
      answer: "Income decides nearly every distance, so height is effectively ignored", wrong: ["Height decides every distance because its values are smaller", "Nothing: k-NN is unaffected by feature scale", "The model refuses to train"],
      why: "Euclidean distance adds squared differences, and income differences are millions of times bigger. Standardise each feature (subtract the mean, divide by the spread) before any distance-based model." },
    { id: "svm-sv", level: "easy", kind: "concept",
      q: "Which training points decide where a linear SVM's boundary lies?",
      answer: "Only the support vectors, the points on or inside the margin", wrong: ["Every training point equally", "The points farthest from the boundary", "The mean of each class"],
      why: `Move any other point without crossing the street and the solution does not change. In the walk-through ${mm.sv.length} of ${SVM_PTS.length} points are support vectors.` },
    { id: "svm-c", level: "hard", kind: "concept",
      q: "In a soft-margin SVM you raise C a lot. What happens?",
      answer: "Margin violations cost more, so the street narrows to fit the training points more tightly, risking overfitting", wrong: ["The street widens and more points may sit inside it", "Nothing changes unless the data are separable", "The kernel becomes non-linear"],
      why: "C is the price of each point inside the street or on the wrong side. Large C buys fewer training errors with a narrower margin; small C accepts errors for a wider, smoother margin. Tune it on validation data." },
    { id: "kmeans-init", level: "medium", kind: "concept",
      q: "Two k-means runs with the same k on the same data give different clusters. Why?",
      answer: "They started from different centres and each stopped in a different local optimum", wrong: ["k-means is random at every step, not only at the start", "One of the runs must have a bug, since k-means has a unique answer", "The data were shuffled, which changes the means"],
      why: `After the start every step is deterministic, and each step can only lower inertia, so a run stops at the first point where nothing changes. In the walk-through with k = 4, five starts end between ${fmt(k4lo)} and ${fmt(k4hi)}.` },
    { id: "pca-supervised", level: "hard", kind: "concept",
      q: "You run PCA and keep only the first component before training a classifier. Accuracy drops. What is the likely reason?",
      answer: "PCA ignores the labels: the direction of most variance was not the one that separates the classes", wrong: ["PCA always loses accuracy, whatever the data", "The first component is the direction of least variance", "PCA cannot be used before a classifier"],
      why: "PCA keeps spread, not usefulness. If the classes differ along a low-variance direction, dropping it throws away the signal. Check validation accuracy for several numbers of components, or use a supervised method." },
    { id: "odds", level: "medium", kind: "numeric",
      q: `A logistic regression weight for x is ${OW}. One more unit of x multiplies the odds p / (1 - p) by how much, to 3 decimals?`,
      answer: fmt(Math.exp(OW)), wrong: [fmt(OW), fmt(sigmoid(OW)), fmt(1 + OW)],
      why: `ln(p / (1 - p)) = w x + b, so raising x by 1 adds ${OW} to the log-odds and multiplies the odds by e^${OW} = ${fmt(Math.exp(OW))}. σ(${OW}) = ${fmt(sigmoid(OW))} is a probability, not a ratio.` },
    { id: "svm-width", level: "medium", kind: "numeric",
      q: `An SVM's margin lines are w · x + b = 1 and w · x + b = -1 with w = (${SW.join(", ")}). How wide is the street?`,
      answer: fmt(width), wrong: [fmt(1 / Math.hypot(SW[0], SW[1])), fmt(2 / (SW[0] + SW[1])), "2"],
      why: `The distance between two parallel lines w · x + b = ±1 is 2 / ||w|| = 2 / ${Math.hypot(SW[0], SW[1])} = ${fmt(width)}. Maximising the margin is the same as minimising ||w||, which is how the SVM is trained. ${fmt(1 / Math.hypot(SW[0], SW[1]))} is the half width.` },
    { id: "pca-kept", level: "easy", kind: "numeric",
      q: `The covariance matrix of 3 features has eigenvalues ${EV.join(", ")}. What share of the variance do the top two components keep?`,
      answer: pct(kept), wrong: [pct(EV[0] / (EV[0] + EV[1] + EV[2])), pct(2 / 3), pct(EV[1] / (EV[0] + EV[1] + EV[2]))],
      why: `Each eigenvalue is the variance along its component, and they add up to the total: ${EV.join(" + ")} = ${EV[0] + EV[1] + EV[2]}. The top two keep (${EV[0]} + ${EV[1]}) / ${EV[0] + EV[1] + EV[2]} = ${pct(kept)}; two components out of three is not two thirds of the variance.` },
    { id: "kmeans-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `xs = [${KX.join(", ")}]\ncentres = [${KC.join(", ")}]\ngroups = [[], []]\nfor x in xs:\n    j = 0 if abs(x - centres[0]) <= abs(x - centres[1]) else 1\n    groups[j].append(x)\nprint([sum(g) / len(g) for g in groups])`,
      answer: pyList(newC), wrong: [pyList([1.5, 10]), pyList([1, 2]), pyList([3, 10.5])],
      why: `Only ${KX.filter((_, i) => near[i] === 0).join(", ")} is nearest to ${KC[0]}; ${KX.filter((_, i) => near[i] === 1).join(", ")} are nearest to ${KC[1]}. The new centres are their means: ${pyList(newC)}. A bad start like this one drags the second centre between two groups; more steps or another start fix it.` },
    { id: "logit-vs-linear", level: "medium", kind: "explain",
      q: "Why use logistic regression rather than linear regression for a yes or no label?",
      answer: "- Linear regression predicts any number, so its outputs can fall below 0 or above 1 and cannot be read as probabilities.\n- Squared error on 0 and 1 labels lets far-away, easy points pull the line, moving the boundary for no good reason.\n- Logistic regression squashes the score with a sigmoid into (0, 1) and is trained on log loss, which punishes confident wrong answers hard and barely pushes on points already right.\n- Its weights stay interpretable: each one changes the log-odds linearly." },
    { id: "knn-cost", level: "hard", kind: "explain",
      q: "What does k-NN cost at training and at prediction time, and how do real systems make it fast?",
      answer: "- Training is free: it only stores the n points.\n- A prediction compares the query with all n points of d numbers each, so it costs about n × d operations, every time, and memory grows with the data.\n- Speed-ups: tree indexes (k-d trees) for few dimensions, and approximate nearest-neighbour indexes (graphs such as HNSW, or clustering the points first and searching only nearby clusters) for many. They trade a little recall for large speed-ups.\n- The same problem, finding the nearest embeddings, is the core of vector search for RAG." },
    { id: "pca-explain", level: "medium", kind: "explain",
      q: "Explain PCA to a product manager, and say when you would use it.",
      answer: `- Many measurements often move together. PCA finds the few combined directions along which the data really varies, and describes each item by its position along them.\n- You keep fewer numbers per item and lose as little of the spread as possible; on this module's points one direction keeps ${pct(pca.l1 / pca.total)}.\n- Use it to compress features before a model, to remove near-duplicate signals, or to plot high-dimensional data, such as embeddings, in 2-D.\n- Do not expect it to keep what predicts a label: it never looks at labels.` },
    { id: "kmeans-k", level: "hard", kind: "explain",
      q: "How do you choose k for k-means?",
      answer: `- Inertia always falls as k grows (k = n gives 0), so the lowest inertia cannot pick k.\n- Elbow: plot the best inertia for each k and take the bend where gains slow. Here it drops from ${fmt(ELBOW[0].inertia)} at k = 1 to ${fmt(ELBOW[2].inertia)} at k = 3, then only to ${fmt(ELBOW[3].inertia)} at k = 4.\n- Silhouette score: for each point compare its distance to its own cluster with the nearest other cluster; pick the k with the highest average.\n- Often the use decides: the number of customer segments a team can act on, or the size of an index.` },
    { id: "trap-logit-linear", level: "medium", kind: "trap",
      claim: "Logistic regression is a linear classifier, even though the sigmoid curve is not a straight line.",
      truth: true,
      why: "The class flips where w · x + b = 0, a straight line or flat plane. The sigmoid only maps distance from that line to a probability. To bend the boundary you add features such as x², or use a kernel or a tree." },
    { id: "trap-kmeans-global", level: "easy", kind: "trap",
      claim: "k-means always finds the clustering with the lowest possible inertia.",
      truth: false,
      why: `It only guarantees that inertia never rises, so it stops at a local optimum that depends on the start. With k = 4 on the walk-through's points, five starts finish between ${fmt(k4lo)} and ${fmt(k4hi)}.` },
    { id: "trap-pca-scale", level: "hard", kind: "trap",
      claim: "PCA gives the same components whether or not you standardise the features first.",
      truth: false,
      why: "PCA follows variance, and variance depends on units. Measure one feature in grams instead of kilograms and its variance grows a million times, so it takes over the first component. Standardise features in different units first; leave them alone only when they share a unit." },
  ],
};

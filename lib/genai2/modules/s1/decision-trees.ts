// Stage 1: decision trees, then the two ways to combine many of them, bagging (random forests) and boosting. Every number below is computed here or in stages/s1.calc.ts.
import type { GModule } from "../../types.ts";
import { bestSplit, BOOST, boost, DEPTHS, BEST_TREE_DEPTH, entropy, fmt, FOREST, gini, grow, TREE_TRAIN } from "../../stages/s1.calc.ts";

const pct = (x: number) => `${Math.round(100 * x)}%`;
// text: Gini and entropy disagree on this data's root cut
const gRoot = bestSplit(TREE_TRAIN, "gini")!, eRoot = bestSplit(TREE_TRAIN, "entropy")!, F = { x: "x1", y: "x2" };
if (gRoot.f === eRoot.f && gRoot.t === eRoot.t) throw new Error("Gini and entropy now agree on the root cut: fix the text and the trap below");
// predict: Gini of a 7 to 3 node
const [PA, PB] = [7, 3], pg = gini(PA, PB);
// numeric: entropy of a 6 to 2 node
const [EA, EB] = [6, 2], en = entropy(EA, EB);
// numeric: gain of a split from a 5/5 node into (4 dots, 0 rings) and (1 dot, 5 rings)
const gainL = gini(4, 0), gainR = gini(1, 5), gainW = (4 * gainL + 6 * gainR) / 10, gain = gini(5, 5) - gainW;
// numeric and text: share of points a bootstrap sample never draws
const NB = 1000, oob = (1 - 1 / NB) ** NB, drawn50 = 1 - (1 - 1 / TREE_TRAIN.length) ** TREE_TRAIN.length;
// output: Gini of a label list
const OY = [1, 1, 0, 1, 0, 1, 1, 0, 1], og = gini(OY.filter((y) => !y).length, OY.filter((y) => y).length);
// depth: a shallow and a full tree
const shallow = DEPTHS[BEST_TREE_DEPTH - 1], full = DEPTHS[DEPTHS.length - 1];
// boosting: rounds
const runs = boost(40);
// trap: XOR, where no single cut helps
const XOR = [{ x: 2, y: 2, c: 0 }, { x: 8, y: 8, c: 0 }, { x: 2, y: 8, c: 1 }, { x: 8, y: 2, c: 1 }] as const;
const xorGain = bestSplit([...XOR], "gini")!.gain, xorTree = grow([...XOR], { maxDepth: 5 });
if (xorGain > 1e-12 || xorTree.kids) throw new Error("a cut now helps on XOR: fix the greedy explain answer");

export const DECISION_TREES: GModule = {
  id: "decision-trees",
  stage: 1,
  title: "Decision trees and ensembles",
  hook: "A decision tree asks one yes or no question about the features at a time until it can name an answer. One tree is easy to read but overfits; hundreds of them, voting or correcting each other, are a strong first choice for tables of data. Builds on [[learning-as-fitting]] and [[overfitting-evaluation]].",
  blocks: [
    { kind: "flow", id: "s1-tree-grow" },
    { kind: "text", md: "**How a tree predicts.** Each inner node tests one feature against a threshold, such as x2 < 4.95, and sends the point left or right. A leaf predicts its training points' majority class, or their mean for a number.\n\n**How it grows.** Greedily: at a node, try every feature and every cut between neighbouring values, keep the cut whose two sides are purest, then repeat on each side." },
    { kind: "play", id: "s1-cut" },
    { kind: "figure", id: "s1-impurity", caption: "Two ways to score how mixed a node is. Both are 0 for a pure node and highest for a 50/50 mix; entropy peaks at 1 bit, Gini at 0.5." },
    { kind: "text", md: `**Gini or entropy.** Gini = 1 - Σ p², the chance two random points from the node disagree. Entropy = -Σ p log2 p. **Information gain** is the parent's impurity minus the size-weighted impurity of the children. They usually agree, but not always: on this data Gini's root cut is ${F[gRoot.f]} < ${gRoot.t} and entropy's is ${F[eRoot.f]} < ${eRoot.t}. Gini needs no logarithm, so it is a little cheaper.` },
    {
      kind: "predict",
      q: `A node holds ${PA + PB} points: ${PA} dots and ${PB} rings. What is its Gini impurity?`,
      answer: fmt(pg), wrong: [fmt(PB / (PA + PB)), fmt((PA / (PA + PB)) ** 2 + (PB / (PA + PB)) ** 2), fmt(entropy(PA, PB))],
      why: `Gini = 1 - ${fmt(PA / (PA + PB))}² - ${fmt(PB / (PA + PB))}² = 1 - ${fmt((PA / (PA + PB)) ** 2)} - ${fmt((PB / (PA + PB)) ** 2)} = ${fmt(pg)}. ${fmt(PB / (PA + PB))} is the minority share (the error of predicting the majority), and ${fmt(entropy(PA, PB))} is the entropy in bits.`,
    },
    { kind: "play", id: "s1-depth" },
    { kind: "text", md: `**Depth is the knob.** A deep tree can box in every training point, noise included. Here depth ${shallow.depth} scores ${pct(shallow.train)} on training and ${pct(shallow.test)} on test; fully grown it scores ${pct(full.train)} and ${pct(full.test)}. Brake it with a max depth, a minimum of points per leaf or a minimum gain, or grow it fully and **prune** the splits validation does not support. Trees need no feature scaling: a cut only compares values.` },
    { kind: "flow", id: "s1-forest" },
    { kind: "text", md: `**Random forest = bagging + random features.** **Bagging** trains each tree on a bootstrap sample: n draws with replacement, which holds about ${pct(1 - Math.exp(-1))} of the distinct points (${pct(drawn50)} for n = ${TREE_TRAIN.length}). A random forest also lets each split try only a random subset of the features, so the trees disagree more and averaging cancels more noise. The points a tree never drew, **out of bag**, give a free validation score.` },
    { kind: "flow", id: "s1-boost" },
    { kind: "text", md: "**Boosting** builds trees in sequence. Each new, shallow tree fits the **residuals**, what the ensemble so far still gets wrong; for squared error the residual is the negative gradient of the loss, hence **gradient boosting**. A learning rate shrinks each tree's say. Bagging mainly cuts variance; boosting mainly cuts bias, and it overfits if rounds are added without checking validation error." },
    {
      kind: "compare",
      head: ["", "One tree", "Random forest", "Gradient boosting"],
      rows: [
        ["Trees", "One, often deep", "Many deep trees, built independently", "Many shallow trees, built in sequence"],
        ["Each tree sees", "All the data", "A bootstrap sample, random features per split", "All the data, fitted to the current residuals"],
        ["Mainly reduces", "Nothing: it is the base model", "Variance", "Bias"],
        ["Main knobs", "Depth, points per leaf", "Number of trees, features per split", "Rounds, learning rate, tree depth"],
        ["Overfits when", "Grown too deep", "Rarely from more trees", "Too many rounds for the learning rate"],
      ],
    },
    {
      kind: "code",
      run: true,
      src: `import numpy as np

# the best first cut by Gini, the way a tree library searches for it
rng = np.random.default_rng(1)
X = rng.uniform(0, 10, size=(60, 2))
y = ((X[:, 0] > 6) & (X[:, 1] > 3)).astype(int)        # class 1 in the upper right

def gini(labels):
    if len(labels) == 0:
        return 0.0
    p = labels.mean()
    return 1 - p**2 - (1 - p)**2

def best_split(X, y):
    best = (None, None, gini(y))                         # (feature, threshold, weighted Gini)
    for f in range(X.shape[1]):
        vals = np.unique(X[:, f])
        for t in (vals[1:] + vals[:-1]) / 2:             # midpoints between neighbours
            left = X[:, f] < t
            score = (left.sum() * gini(y[left]) + (~left).sum() * gini(y[~left])) / len(y)
            if score < best[2]:
                best = (f, t, score)
    return best

f, t, score = best_split(X, y)
print(f"root: x{f + 1} < {t:.2f}, weighted Gini {score:.3f} (was {gini(y):.3f})")
assert score < gini(y)
assert abs(t - (6 if f == 0 else 3)) < 1.5               # it finds one of the two real edges
`,
    },
  ],
  keyPoints: [
    "A tree splits on one feature and threshold at a time; leaves predict the majority class or the mean.",
    "Each split is chosen greedily: the cut with the lowest size-weighted Gini or entropy of its two sides, that is the highest information gain.",
    "Deep trees overfit; limit depth or points per leaf, or prune. Trees need no feature scaling and draw axis-parallel boundaries.",
    "A random forest averages deep trees trained on bootstrap samples with random features per split, which cuts variance; more trees do not overfit.",
    "Gradient boosting adds shallow trees in sequence, each fitted to the residuals and shrunk by a learning rate, which cuts bias; choose the rounds by validation error.",
  ],
  questions: [
    { id: "split-choice", level: "easy", kind: "concept",
      q: "How does a decision tree choose the split at a node?",
      answer: "It tries every feature and threshold and keeps the cut with the lowest size-weighted impurity of the two sides", wrong: ["It splits the feature with the largest variance at its mean", "It picks a feature and threshold at random", "It splits wherever the two sides get the same number of points"],
      why: "That is greedy search on information gain. Splitting at the mean or into equal halves ignores the labels entirely, and random cuts are what extremely randomised trees do, not standard CART." },
    { id: "leaf-predict", level: "easy", kind: "concept",
      q: "What does a leaf of a regression tree predict?",
      answer: "The mean target of the training points that reached that leaf", wrong: ["The mean target of the whole training set", "A straight line fitted inside the leaf", "The target of the single nearest training point"],
      why: "Mean minimises squared error within the leaf, so each leaf is a flat step. That is why a regression tree's prediction is a staircase, as in the boosting walk-through." },
    { id: "no-scaling", level: "medium", kind: "concept",
      q: "Why does a decision tree not need its features standardised?",
      answer: "A split only asks whether a value is below a threshold, so any change that keeps the order of values gives the same tree", wrong: ["Trees standardise every feature internally before splitting", "Trees only work on features that are already between 0 and 1", "Large features get more splits, which balances out"],
      why: "Rescaling moves the thresholds but sends the same points left and right. Distance-based models such as k-NN, and gradient descent on linear models, are the ones that care about scale." },
    { id: "bagging-why", level: "medium", kind: "concept",
      q: "Why does averaging many deep trees trained on bootstrap samples beat one deep tree?",
      answer: "Each deep tree has high variance, and their errors are partly independent, so the average cancels much of the noise", wrong: ["Each bootstrapped tree has lower bias than a tree on all the data", "Bootstrap samples are larger than the training set", "Averaging lets each tree be shallower without losing accuracy"],
      why: `A bootstrap sample has no more points than the original and each tree is just as biased. Averaging works on variance. In the walk-through the single trees score ${FOREST.each.map(pct).join(", ")} on test and the vote of all ${FOREST.trees.length} scores ${pct(FOREST.test)}.` },
    { id: "rf-features", level: "hard", kind: "concept",
      q: "A random forest lets each split try only a random subset of the features. Why?",
      answer: "So one strong feature does not top every tree: the trees become less alike, and averaging less alike trees removes more variance", wrong: ["Only to make training faster; it does not change accuracy", "To lower the bias of each tree", "To stop each individual tree from overfitting"],
      why: "With bagging alone, a dominant feature makes most trees split the same way first, so their errors are correlated and the average gains little. The trees are still grown deep and still overfit individually; it is the ensemble that generalises." },
    { id: "boost-vs-bag", level: "hard", kind: "concept",
      q: "Which statement about gradient boosting and random forests is right?",
      answer: "Boosting builds shallow trees one after another, each fitted to the current residuals; a forest builds deep trees independently on bootstrap samples", wrong: ["Boosting builds deep trees in parallel; a forest builds stumps in sequence", "Both build trees independently and differ only in how they vote", "Boosting reweights features, a forest reweights examples"],
      why: "Order matters in boosting: tree m depends on trees 1 to m - 1. A forest's trees can be trained in parallel. That is also why a forest is hard to overfit with more trees and boosting is not." },
    { id: "entropy-calc", level: "easy", kind: "numeric",
      q: `A node has ${EA} dots and ${EB} rings. What is its entropy in bits, to 3 decimals?`,
      answer: fmt(en), wrong: [fmt(gini(EA, EB)), fmt(EB / (EA + EB)), "1"],
      why: `p = ${EA / (EA + EB)} and ${EB / (EA + EB)}. Entropy = -(${EA / (EA + EB)} log2 ${EA / (EA + EB)} + ${EB / (EA + EB)} log2 ${EB / (EA + EB)}) = ${fmt(en)} bits. ${fmt(gini(EA, EB))} is the Gini of the same node; 1 bit would need a 50/50 mix.` },
    { id: "gain-calc", level: "medium", kind: "numeric",
      q: "A node of 10 points, 5 dots and 5 rings, splits into a left side with 4 dots and a right side with 1 dot and 5 rings. What is the Gini gain, to 3 decimals?",
      answer: fmt(gain), wrong: [fmt(gainW), fmt(gini(5, 5) - (gainL + gainR) / 2), fmt(gini(5, 5))],
      why: `Parent Gini is 0.5. Left is pure, 0. Right: 1 - (1/6)² - (5/6)² = ${fmt(gainR)}. Weighted by size: 0.4 × 0 + 0.6 × ${fmt(gainR)} = ${fmt(gainW)}. Gain = 0.5 - ${fmt(gainW)} = ${fmt(gain)}. Averaging the two sides without weights gives ${fmt(gini(5, 5) - (gainL + gainR) / 2)}, which overrates a tiny pure side.` },
    { id: "oob", level: "medium", kind: "numeric",
      q: `A bootstrap sample draws ${NB.toLocaleString("en-US")} times with replacement from ${NB.toLocaleString("en-US")} points. What share of the points is never drawn, to 3 decimals?`,
      answer: fmt(oob), wrong: [fmt(1 - oob), "0.5", "0"],
      why: `Each draw misses a given point with chance 1 - 1/${NB}, so all ${NB} draws miss it with chance (1 - 1/${NB})^${NB} = ${fmt(oob)}, close to 1/e. These out-of-bag points are a free validation set for that tree; ${fmt(1 - oob)} is the share that is drawn.` },
    { id: "gini-out", level: "medium", kind: "output",
      q: "What does this print?",
      code: `def gini(ys):\n    p = sum(ys) / len(ys)\n    return 1 - p**2 - (1 - p)**2\n\nprint(round(gini([${OY.join(", ")}]), 3))`,
      answer: fmt(og), wrong: [fmt(OY.filter((y) => y).length / OY.length), fmt(1 - og), fmt(entropy(OY.filter((y) => !y).length, OY.filter((y) => y).length))],
      why: `${OY.filter((y) => y).length} of ${OY.length} labels are 1, so p = ${fmt(OY.filter((y) => y).length / OY.length)}. Gini = 1 - p² - (1 - p)² = ${fmt(og)}. ${fmt(entropy(OY.filter((y) => !y).length, OY.filter((y) => y).length))} would be the entropy of the same labels.` },
    { id: "tree-overfit", level: "medium", kind: "explain",
      q: "Why does a fully grown decision tree overfit, and how do you stop it?",
      answer: `- It keeps splitting until every leaf is pure, so it builds tiny boxes around single noisy points. On this module's data, depth ${shallow.depth} scores ${pct(shallow.train)} train and ${pct(shallow.test)} test; fully grown, ${pct(full.train)} and ${pct(full.test)}.\n- Pre-pruning: cap the depth, require a minimum number of points per leaf or per split, or a minimum gain.\n- Post-pruning: grow fully, then remove splits that do not improve validation error (cost-complexity pruning).\n- Or stop using one tree: a random forest averages many deep trees and keeps most of their accuracy without the variance.` },
    { id: "rf-vs-boost", level: "hard", kind: "explain",
      q: "Compare random forests and gradient boosting. When would you pick each?",
      answer: `- A forest trains deep trees independently on bootstrap samples and votes. It mainly cuts variance, has few sensitive knobs, trains in parallel and barely overfits as trees are added.\n- Boosting adds shallow trees in sequence, each fitted to the residuals and shrunk by a learning rate. It mainly cuts bias and is often more accurate when tuned, but it can overfit as rounds grow, so it needs early stopping on validation error.\n- Pick a forest for a quick, robust baseline; pick boosting when you can afford to tune. In the walk-through, boosting's training MSE falls from ${fmt(runs[0].mse)} to ${fmt(runs[40].mse)} in 40 rounds, already below the noise level ${fmt(BOOST.noise ** 2)}.` },
    { id: "importance", level: "hard", kind: "explain",
      q: "What is impurity-based feature importance in a tree ensemble, and what is its catch?",
      answer: "- For each feature, add up the impurity decrease of every split on it, weighted by the points reaching that split, and average over the trees.\n- Catch 1: it is measured on training data, so it credits features the trees used to fit noise.\n- Catch 2: features with many distinct values (an id, a timestamp) offer more cut points and look important by chance.\n- Safer: permutation importance on a validation set, which shuffles one feature and measures how much the score drops." },
    { id: "greedy", level: "hard", kind: "explain",
      q: "Tree growing is greedy. What does that mean and what can it miss?",
      answer: `- At each node it takes the single best cut now and never revisits it. Searching over whole trees would be far too slow.\n- It can miss patterns where no single cut helps but two together do. With four points in an XOR layout, (2, 2) and (8, 8) in one class and (2, 8) and (8, 2) in the other, every first cut leaves each side 50/50, a gain of ${fmt(Math.max(0, xorGain))}, so the tree stops at the root although two cuts would classify all four.\n- Libraries split anyway when asked to go deeper, and ensembles soften the effect, but it is why trees can need more depth than the pattern seems to require.` },
    { id: "trap-gini-entropy", level: "medium", kind: "trap",
      claim: "Gini and entropy can choose different splits on the same data.",
      truth: true,
      why: `They weigh mixed nodes a little differently. On this module's ${TREE_TRAIN.length} training points, Gini's best root cut is ${F[gRoot.f]} < ${gRoot.t} and entropy's is ${F[eRoot.f]} < ${eRoot.t}. In practice the resulting trees usually score about the same.` },
    { id: "trap-more-trees", level: "hard", kind: "trap",
      claim: "Adding more trees to a random forest makes it overfit.",
      truth: false,
      why: `Each new tree is another independent sample of the same kind of tree, so the vote only becomes a steadier estimate of the average tree; test error levels off instead of rising. The trees' depth and the features per split control fit. Boosting is different: more rounds keep fitting the training residuals.` },
    { id: "trap-axis", level: "easy", kind: "trap",
      claim: "A single decision tree on numeric features draws only boundaries parallel to the feature axes.",
      truth: true,
      why: `Each split tests one feature against a threshold, so every boundary is a vertical or horizontal segment, as in the walk-throughs. A diagonal boundary needs a staircase of many splits, one reason a linear model or rotated features can beat a tree on such data.` },
  ],
};

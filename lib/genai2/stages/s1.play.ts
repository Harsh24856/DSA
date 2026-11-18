// Stage 1 (ML basics for LLMs): slider walk-throughs, placed in modules by a `play` block. Spread by stages/play.ts into PLAY_FLOWS.
import type { Flow, Shape } from "../../other/flows.ts";
import { PlayError, type PlayFlow } from "../../other/flows-play-types.ts";
import { accuracy, BEST, BLOBS, confusion, CORPUS, cosine, cutScore, fmt, gdLine, grow, idf, kmeans, knn, leaves, LIMIT, LINE, mse, pca2d, pcaTop2, PCA_PTS, POLY, polyErrorsN, polyfit, polyval,
  predict, predictTree, SPAM, sum, trainW2V, TREE_TEST, TREE_TRAIN, truth, varAlong, type Feat } from "./s1.calc.ts";
import { axes, classDot, classTone, curve, pct, plotBox, points, regions, type Plot } from "./s1.flows.ts";

// Learning as fitting: fit the line by hand. The squares on the error sticks are the squared errors, so their total area is what least squares makes smallest.
function line(v: Record<string, number>): Flow {
  const { w, b } = v, { xs, ys } = LINE, L = mse(w, b), ratio = L / BEST.loss;
  const P = plotBox(56, 30, 400, 330, [0, 4.5, 1, 7]), unit = P.sy(1) - P.sy(2);
  const err = (W: number, B: number) => xs.map((x, i) => predict(W, B, x) - ys[i]);
  const shapes = (W: number, B: number, squares: boolean, mine: boolean): Shape[] => {
    const e = err(W, B), clampY = (y: number) => Math.min(7.6, Math.max(0.4, y));
    return [...axes("ax", P, "hours practised", "score", ["0", "4.5", "1", "7"]),
      ...(squares ? xs.map((x, i): Shape => {
        const s = Math.abs(e[i]) * unit, top = Math.min(P.sy(ys[i]), P.sy(clampY(predict(W, B, x))));
        return { t: "rect", id: `sq${i}`, x: P.sx(x), y: top, w: Math.min(s, P.X + P.w - P.sx(x)), h: Math.min(s, P.Y + P.h - top), tone: "warn", fill: 18, edge: true };
      }) : []),
      ...(mine ? [] : [{ t: "line" as const, id: "mine", x1: P.sx(0), y1: P.sy(clampY(predict(w, b, 0))), x2: P.sx(4.5), y2: P.sy(clampY(predict(w, b, 4.5))), tone: "muted" as const, w: 2, dash: true }]),
      { t: "line", id: "fit", x1: P.sx(0), y1: P.sy(clampY(predict(W, B, 0))), x2: P.sx(4.5), y2: P.sy(clampY(predict(W, B, 4.5))), tone: mine ? "hot" : "ok", w: 3 },
      ...xs.map((x, i): Shape => ({ t: "line", id: `st${i}`, x1: P.sx(x), y1: P.sy(ys[i]), x2: P.sx(x), y2: P.sy(clampY(predict(W, B, x))), tone: "bad", w: 2.5 })),
      ...xs.map((x, i): Shape => ({ t: "dot", id: `p${i}`, x: P.sx(x), y: P.sy(ys[i]), r: 6, tone: "ink" })),
      { t: "text", id: "lab", x: P.X + 10, y: P.Y + 18, text: `y = ${fmt(W)} x + ${fmt(B)}   MSE ${fmt(mse(W, B))}`, size: 18, bold: true }];
  };
  const e = err(w, b), worst = e.reduce((m, x, i) => (Math.abs(x) > Math.abs(e[m]) ? i : m), 0), high = e.filter((x) => x > 0).length;
  return { kind: "scene", title: `Your line: y = ${fmt(w)} x + ${fmt(b)}`, height: 410, steps: [
    { note: `Your two knobs make a line. Each red stick is one student's error, prediction minus real score. ${high} of ${xs.length} predictions are too high; the longest miss is ${fmt(e[worst])} at x = ${xs[worst]}. Try: drag w and b to make the squares in step 2 as small as you can.`, shapes: shapes(w, b, false, true) },
    { note: `Square each error: a stick of length e becomes a square of area e². The MSE is the mean area, ${fmt(L)}. Least squares makes the total area as small as it can be.`, tone: "hot", shapes: shapes(w, b, true, true) },
    { note: ratio < 1.05 ? `Least squares, w = ${fmt(BEST.w)} and b = ${fmt(BEST.b)}, MSE ${fmt(BEST.loss)}. Yours is within 5% of it: you found the bottom by hand.`
      : `Least squares moves the line to w = ${fmt(BEST.w)}, b = ${fmt(BEST.b)}, and the squares shrink: MSE ${fmt(BEST.loss)}, ${fmt(ratio)} times smaller than yours (dashed). Training is that search, done by an algorithm.`,
      tone: "ok", shapes: shapes(BEST.w, BEST.b, true, ratio < 1.05) },
  ] };
}

// Loss and gradient descent: the learning rate decides between crawling, converging and blowing up.
function lrRun(v: Record<string, number>): Flow {
  const { lr, steps } = v, hist = gdLine(lr, steps), { max } = LIMIT;
  const at = [0, 1, 2, 5, 10, 20, 50, 100, 200].filter((t) => t <= steps);
  if (at[at.length - 1] !== steps) at.push(steps);
  const end = hist[steps], L0 = hist[0].loss, gap = end.loss - BEST.loss;
  const verdict = lr >= max ? "bad" as const : gap < 0.01 ? "ok" as const : "warn" as const;
  const table = { head: ["step", "w", "b", "MSE"], rows: at.map((t) => [t, fmt(hist[t].w), fmt(hist[t].b), fmt(hist[t].loss)]),
    tones: Object.fromEntries(at.flatMap((t, i) => (hist[t].loss > L0 ? [[String(i), "bad" as const]] : []))) };
  return { kind: "grid", title: `lr ${lr}, ${steps} steps`, steps: [
    { note: `On this data, steps start to overshoot by more than they gain once lr passes ${fmt(max)}. Your lr, ${fmt(lr)}, is ${lr >= max ? "above" : "below"} that line. Stage 2, Optimisers, shows how the steepest direction sets it.`, tone: lr >= max ? "bad" : "ok",
      tables: [{ head: ["", "value"], rows: [["your lr", fmt(lr)], ["limit", fmt(max)]], tones: { "0:1": lr >= max ? "bad" : "ok" } }] },
    { note: lr >= max ? `Too big: every step overshoots the bottom by more than it started, so the loss grows. After ${steps} steps the MSE is ${fmt(end.loss)}.`
      : gap < 0.01 ? `Converged: after ${steps} steps the MSE is ${fmt(end.loss)}, within 0.01 of the best possible ${fmt(BEST.loss)}.`
      : `Still crawling: the MSE is ${fmt(end.loss)} after ${steps} steps, ${fmt(gap)} above the best ${fmt(BEST.loss)}. A larger lr or more steps would finish the job.`,
      tone: verdict, tables: [table] },
  ] };
}

// Overfitting and evaluation: the same flexible model on more and more data. The figure shows degree; this shows data size.
function moreData(v: Record<string, number>): Flow {
  const { d, n } = v;
  if (d + 1 > n) throw new PlayError(`A degree ${d} polynomial needs at least ${d + 1} points. Add points or lower the degree.`);
  const small = polyErrorsN(d, d + 1), mine = polyErrorsN(d, n), noise = POLY.noise ** 2;
  const z = (x: number) => fmt(x < 1e-9 ? 0 : x), gap = mine.val - mine.train;
  const tone = mine.val < 1.5 * noise ? "ok" as const : mine.val < 2.5 * noise ? "warn" as const : "bad" as const;
  const stiff = gap < 0.5 * noise && mine.val >= 2.5 * noise;
  const head = ["points", "train MSE", "val MSE"];
  return { kind: "grid", title: `Degree ${d}, ${n} training points`, steps: [
    { note: `With only ${d + 1} points, a degree ${d} polynomial (${d + 1} coefficients) passes through every one: training error ${z(small.train)}, validation error ${z(small.val)}. It has fitted the noise.`, tone: "bad",
      tables: [{ head, rows: [[d + 1, z(small.train), z(small.val)]], tones: { "0:2": "bad" } }] },
    { note: n <= d + 1 ? `${n} points is still just enough to pass through every one, so nothing changes. Slide the points up.`
      : stiff ? `On ${n} points training and validation agree (gap ${fmt(gap)}), but both are high, validation ${z(mine.val)} against the noise floor ${fmt(noise)}. A degree ${d} curve is too stiff for this pattern: underfitting, which more data cannot fix.`
      : `On ${n} points the curve can no longer weave through each point's noise without missing the others, so it is pulled toward the real pattern. Validation error ${z(mine.val)}, gap to training ${fmt(gap)}. The noise alone costs ${fmt(noise)}.`,
      tone: n <= d + 1 ? "bad" : stiff ? "warn" : tone,
      tables: [{ head, rows: [[d + 1, z(small.train), z(small.val)], [n, z(mine.train), z(mine.val)]], tones: { "0:2": "bad", "1:2": stiff ? "warn" : tone } }] },
  ] };
}

// Overfitting and evaluation: one threshold, four counts, three metrics.
function threshold(v: Record<string, number>): Flow {
  const t = Math.round(v.t * 100) / 100, c = confusion(t), pos = c.tp + c.fn;
  if (c.tp + c.fp === 0) throw new PlayError("Nothing is flagged at this threshold, so precision is undefined. Lower it.");
  const pct = (x: number) => `${Math.round(100 * x)}%`;
  return { kind: "grid", title: `Threshold ${fmt(t)}`, steps: [
    { note: `${SPAM.scores.length} emails, ${pos} really spam. Flag every email scoring ${fmt(t)} or more. The confusion matrix counts the four outcomes.`, tone: "hot",
      tables: [{ head: ["", "flagged", "not flagged"], rowHead: ["spam", "not spam"], rows: [[c.tp, c.fn], [c.fp, c.tn]], tones: { "0:0": "ok", "1:1": "ok", "0:1": "bad", "1:0": "bad" } }] },
    { note: `Precision: of ${c.tp + c.fp} flagged, ${c.tp} are spam, ${pct(c.precision)}. Recall: of ${pos} spam, ${c.tp} caught, ${pct(c.recall)}. F1, their harmonic mean, is ${fmt(c.f1)}. Accuracy is ${pct(c.acc)}.`,
      tone: c.f1 >= 0.7 ? "ok" : "warn",
      tables: [{ head: ["metric", "formula", "value"], rows: [["precision", "TP / (TP + FP)", fmt(c.precision)], ["recall", "TP / (TP + FN)", fmt(c.recall)], ["F1", "2PR / (P + R)", fmt(c.f1)], ["accuracy", "right / all", fmt(c.acc)]] }] },
    { note: t >= 0.6 ? `A high threshold flags only sure cases: few false alarms, but ${c.fn} spam slip through. Raise it further and recall keeps falling.`
      : `A low threshold catches more spam but flags ${c.fp} good emails. Lower it further and precision keeps falling.`, tone: "warn",
      tables: [{ head: ["moving the threshold", "precision", "recall"], rows: [["up", "rises (usually)", "falls or stays"], ["down", "falls (usually)", "rises or stays"]] }] },
  ] };
}

// Text as numbers: how rarity and repetition set a TF-IDF weight in a large collection.
function idfPlay(v: Record<string, number>): Flow {
  const { N, p, tf } = v, df = Math.max(1, Math.round((N * p) / 100)), w = idf(N, df);
  const rows = [["in every document", N, fmt(idf(N, N)), fmt(tf * idf(N, N))], ["your word", df, fmt(w), fmt(tf * w)], ["in one document", 1, fmt(idf(N, 1)), fmt(tf * idf(N, 1))]];
  const half = Math.round(df / 2);
  const gentle = df >= 2 ? ` The log keeps it gentle: halving the documents that contain the word (${df} to ${half}) adds only ${fmt(idf(N, half) - w)}, whatever N is.` : " One document is as rare as a word can be, so this is the largest idf here.";
  return { kind: "grid", title: `${N.toLocaleString("en-US")} documents, word in ${df}`, steps: [
    { note: `idf = ln(N / df) = ln(${N.toLocaleString("en-US")} / ${df}) = ${fmt(w)}.${gentle}`, tone: "hot",
      tables: [{ head: ["word", "df", "idf"], rows: rows.map((r) => r.slice(0, 3)), tones: { "1:2": "hot" } }] },
    { note: `The word appears ${tf} times in this document, so its weight is ${tf} × ${fmt(w)} = ${fmt(tf * w)}. A word in every document scores 0 however often it repeats; one found in a single document scores ${fmt(tf * idf(N, 1))}.`, tone: w > 0 ? "ok" : "warn",
      tables: [{ head: ["word", "df", "idf", "tf × idf"], rows, tones: { "1:3": w > 0 ? "ok" : "warn" } }] },
  ] };
}

// Loss and gradient descent: the path gradient descent takes over the loss surface of both knobs at once.
function roll(v: Record<string, number>): Flow {
  const { lr } = v, show = [0, 1, 2, 3, 5, 10, 20, 50], hist = gdLine(lr, show[show.length - 1]);
  const R = [-0.6, 2.6, -0.8, 3.6], P = plotBox(64, 24, 380, 360, R);
  // contours: the loss is a quadratic bowl, so each level set is an ellipse around the best line, drawn from the curvature matrix
  const mx2 = LINE.xs.reduce((s, x) => s + x * x, 0) / LINE.xs.length, mx = LINE.xs.reduce((s, x) => s + x, 0) / LINE.xs.length;
  const inside = (w: number, b: number) => w >= R[0] && w <= R[1] && b >= R[2] && b <= R[3];
  // the ellipse is cut into the runs that lie inside the plot, so no ring spills past the frame
  const ell = (level: number, li: number): Shape[] => {
    const pts = Array.from({ length: 145 }, (_, k) => (2 * Math.PI * k) / 144).map((a) => {
      const dw = Math.cos(a), db = Math.sin(a), q = mx2 * dw * dw + 2 * mx * dw * db + db * db, r = Math.sqrt((level - BEST.loss) / q);
      return [BEST.w + r * dw, BEST.b + r * db];
    });
    const runs: number[][][] = [[]];
    for (const p of pts) { if (inside(p[0], p[1])) runs[runs.length - 1].push(p); else if (runs[runs.length - 1].length) runs.push([]); }
    return runs.filter((r) => r.length > 1).map((r, k): Shape => ({ t: "path", id: `c${li}-${k}`, tone: "muted", w: 1.5, pts: r.flatMap(([w, b]) => [P.sx(w), P.sy(b)]) }));
  };
  const clampW = (w: number) => Math.min(R[1], Math.max(R[0], w)), clampB = (b: number) => Math.min(R[3], Math.max(R[2], b));
  const levels = [0.05, 0.2, 0.6, 1.5, 3, 6].map((d) => BEST.loss + d);
  const at = (t: number): Shape[] => [
    ...axes("ax", P, "slope w", "intercept b", ["-0.6", "2.6", "-0.8", "3.6"]), ...levels.flatMap(ell),
    { t: "dot", id: "best", x: P.sx(BEST.w), y: P.sy(BEST.b), r: 7, tone: "ok" },
    ...hist.slice(1, t + 1).map((h, k): Shape => ({ t: "line", id: `s${k}`, x1: P.sx(clampW(hist[k].w)), y1: P.sy(clampB(hist[k].b)), x2: P.sx(clampW(h.w)), y2: P.sy(clampB(h.b)), tone: "hot", w: 2.5 })),
    { t: "dot", id: "ball", x: P.sx(clampW(hist[t].w)), y: P.sy(clampB(hist[t].b)), r: 9, tone: "hot" },
    { t: "text", id: "lab", x: P.X + 10, y: P.Y + P.h - 18, text: `step ${t}: MSE ${fmt(hist[t].loss)}`, size: 18, bold: true },
  ];
  const blow = lr >= LIMIT.max;
  return { kind: "scene", title: `Gradient descent on both knobs, lr ${lr}`, height: 430, steps: show.map((t, i) => {
    const h = hist[t], off = !inside(h.w, h.b);
    return { note: i === 0 ? `Each ring is a level of the loss over (w, b): the same MSE all round. The green dot is the best line. Start at w = 0, b = 0, MSE ${fmt(h.loss)}; each step goes downhill, square to the rings. Try lr 0.14 or more.`
      : off ? `Step ${t}: the ball has left the picture, MSE ${fmt(h.loss)}. Above lr ${fmt(LIMIT.max)} every step overshoots along the steep direction by more than it gains.`
      : i === show.length - 1 ? (blow ? `Step ${t}: MSE ${fmt(h.loss)}. This lr is above ${fmt(LIMIT.max)}, so it diverges.` : `Step ${t}: w = ${fmt(h.w)}, b = ${fmt(h.b)}, MSE ${fmt(h.loss)} against the best ${fmt(BEST.loss)}. The rings are long and thin, so the path rushes across the valley, then crawls along it.`)
      : `Step ${t}: w = ${fmt(h.w)}, b = ${fmt(h.b)}, MSE ${fmt(h.loss)}.${t === 1 ? " The first step heads for the steep side of the bowl, not for the green dot." : ""}`,
      tone: off || (blow && i === show.length - 1) ? "bad" as const : i === show.length - 1 ? "ok" as const : undefined, shapes: at(t) };
  }) };
}

// Overfitting and evaluation: the curve itself, bending more as the degree rises.
function degree(v: Record<string, number>): Flow {
  const d = v.d, { tx, ty, vx, vy, noise } = POLY, c = polyfit(tx, ty, d), f = (x: number) => polyval(c, x);
  const P = plotBox(56, 30, 400, 320, [-1.05, 1.05, -2.2, 2.2]), clampY = (y: number) => Math.min(2.2, Math.max(-2.2, y));
  const tr = tx.reduce((s, x, i) => s + (f(x) - ty[i]) ** 2, 0) / tx.length, va = vx.reduce((s, x, i) => s + (f(x) - vy[i]) ** 2, 0) / vx.length;
  const base: Shape[] = [...axes("ax", P, "x", "y", ["-1", "1", "-2.2", "2.2"]), curve("truth", P, truth, [-1, 1], [-2.2, 2.2], 80, "muted", true), curve("fit", P, f, [-1.05, 1.05], [-2.2, 2.2], 160, "hot")];
  const train = tx.map((x, i): Shape => ({ t: "dot", id: `t${i}`, x: P.sx(x), y: P.sy(ty[i]), r: 6, tone: "ink" }));
  const val = vx.flatMap((x, i): Shape[] => [{ t: "line", id: `e${i}`, x1: P.sx(x), y1: P.sy(vy[i]), x2: P.sx(x), y2: P.sy(clampY(f(x))), tone: "bad", w: 2 }, { t: "dot", id: `v${i}`, x: P.sx(x), y: P.sy(vy[i]), r: 5, tone: "warn", ring: true }]);
  const z = (x: number) => fmt(x < 1e-9 ? 0 : x), floor = noise ** 2;
  const verdict = d <= 1 ? "Too stiff for the wave: underfitting. Both errors are high." : va < 2 * floor ? "Close to the true wave: both errors sit near the noise floor." : tr < 0.5 * floor ? "It threads the training points and swings between them: overfitting." : "Better than a line, but the validation error is still well above the noise.";
  return { kind: "scene", title: `Degree ${d} polynomial`, height: 400, steps: [
    { note: `${tx.length} training points (solid dots) from the dashed wave plus noise. The degree ${d} curve with the least squared error on them: train MSE ${z(tr)}. Try degree 1, 3, then 11.`, tone: "hot", shapes: [...base, ...train] },
    { note: `${vx.length} validation points it never saw (rings), with their errors in red: validation MSE ${z(va)}. The noise alone costs ${fmt(floor)}. ${verdict}`, tone: d <= 1 || tr < 0.5 * floor ? "warn" : "ok", shapes: [...base, ...val, ...train] },
  ] };
}

// Text as numbers: word2vec vectors moving during training, drawn on their top two principal directions.
const EMB = ["cat", "dog", "milk", "water", "fish", "meat", "mat", "cup"], SNAPS = [0, 5, 20, 60, 300];
const embCache = new Map<number, ReturnType<typeof trainW2V>>();
function embed(v: Record<string, number>): Flow {
  const win = v.win, e = embCache.get(win) ?? trainW2V(win, SNAPS);
  embCache.set(win, e);
  const unit = (x: number[]) => { const n = Math.hypot(...x); return x.map((y) => y / n); };
  const pc = pcaTop2(EMB.map((w) => unit(e.at(300, w)))), P = plotBox(40, 20, 400, 360, [-1.05, 1.05, -1.05, 1.05]);
  const cos = (s: number, a: string, b: string) => fmt(cosine(e.at(s, a), e.at(s, b)));
  return { kind: "scene", title: `word2vec training, window ${win}`, height: 400, steps: SNAPS.map((s, i) => ({
    note: i === 0 ? `Eight of the ${e.vocab.length} words at their random starting vectors, drawn on the two directions that spread the trained vectors most. cos(cat, dog) = ${cos(0, "cat", "dog")}. Press Play all, then try window 1.`
      : `After ${s} passes over the ${CORPUS.length} sentences: cos(cat, dog) ${cos(s, "cat", "dog")}, cos(milk, water) ${cos(s, "milk", "water")}, cos(cat, milk) ${cos(s, "cat", "milk")}. Words with the same neighbours drift together.`,
    tone: i === SNAPS.length - 1 ? "ok" as const : undefined,
    shapes: [{ t: "rect", id: "frame", x: P.X, y: P.Y, w: P.w, h: P.h, tone: "muted", fill: 0, edge: true }, { t: "text", id: "lab", x: P.X + 10, y: P.Y + 18, text: `pass ${s}`, size: 18, bold: true },
      ...EMB.flatMap((w, k): Shape[] => { const [x, y] = pc.project(unit(e.at(s, w))); return [{ t: "dot", id: `d${w}`, x: P.sx(x), y: P.sy(y), r: 7, tone: k < 2 ? "hot" : k < 4 ? "ok" : k < 6 ? "warn" : "muted" }, { t: "text", id: `w${w}`, x: P.sx(x) + 12, y: P.sy(y), text: w, size: 18, bold: true }]; })],
  })) };
}

// Decision trees: choose a cut by hand and watch the weighted Gini.
function cut(v: Record<string, number>): Flow {
  const f: Feat = v.f === 1 ? "x" : "y", t = v.t, name = f === "x" ? "x1" : "x2", s = cutScore(f, t);
  const P = plotBox(110, 24, 280, 260, [0, 10, 0, 10]), C = plotBox(70, 360, 370, 150, [0, 10, 0, 0.5]);
  const side = (lo: boolean): Shape => (f === "x" ? { t: "rect", id: lo ? "lo" : "hi", x: lo ? P.X : P.sx(t), y: P.Y, w: lo ? P.sx(t) - P.X : P.X + P.w - P.sx(t), h: P.h, tone: lo ? "muted" : "hot", fill: 10 }
    : { t: "rect", id: lo ? "lo" : "hi", x: P.X, y: lo ? P.sy(t) : P.Y, w: P.w, h: lo ? P.Y + P.h - P.sy(t) : P.sy(t) - P.Y, tone: lo ? "muted" : "hot", fill: 10 });
  const cutLine: Shape = f === "x" ? { t: "line", id: "cut", x1: P.sx(t), y1: P.Y, x2: P.sx(t), y2: P.Y + P.h, tone: "ink", w: 3 } : { t: "line", id: "cut", x1: P.X, y1: P.sy(t), x2: P.X + P.w, y2: P.sy(t), tone: "ink", w: 3 };
  const ts = Array.from({ length: 39 }, (_, i) => 0.25 * (i + 1)), sc = ts.map((u) => cutScore(f, u).score), bi = sc.reduce((m, x, i) => (x < sc[m] - 1e-12 ? i : m), 0);
  const top = [side(true), side(false), ...axes("ax", P, "x1", "x2"), cutLine, ...points("p", P, TREE_TRAIN, 5)];
  const chart: Shape[] = [...axes("ch", C, `cut on ${name}`, "weighted Gini", ["0", "10", "0", "0.5"]),
    { t: "path", id: "sc", tone: "hot", pts: ts.flatMap((u, i) => [C.sx(u), C.sy(sc[i])]) },
    { t: "dot", id: "best", x: C.sx(ts[bi]), y: C.sy(sc[bi]), r: 7, tone: "ok" },
    { t: "dot", id: "you", x: C.sx(t), y: C.sy(s.score), r: 8, tone: "ink" }];
  const n = (c: number[]) => c[0] + c[1];
  return { kind: "scene", title: `Cut at ${name} < ${t}`, height: 560, steps: [
    { note: `${f === "x" ? "Left" : "Below"}: ${s.L[0]} rings, ${s.L[1]} dots, Gini ${fmt(s.gl)}. The other side: ${s.R[0]} rings, ${s.R[1]} dots, Gini ${fmt(s.gr)}. Weighted by size: ${n(s.L)}/${TREE_TRAIN.length} × ${fmt(s.gl)} + ${n(s.R)}/${TREE_TRAIN.length} × ${fmt(s.gr)} = ${fmt(s.score)}. Try to find the lowest score on each feature.`, tone: "hot", shapes: top },
    { note: `Every cut on ${name}, scored the same way (large dot: yours). The best, ${name} < ${ts[bi]}, scores ${fmt(sc[bi])}, down from ${fmt(s.parent)} for no cut. A tree takes the lowest score over both features.`, tone: s.score - sc[bi] < 1e-9 ? "ok" : "warn", shapes: [...top, ...chart] },
  ] };
}

// Decision trees: how deep to grow. Regions, test points, then accuracy against depth.
function depth(v: Record<string, number>): Flow {
  const { d, leaf } = v, t = grow(TREE_TRAIN, { maxDepth: d, minLeaf: leaf }), P = plotBox(110, 24, 280, 260, [0, 10, 0, 10]);
  const tr = accuracy((p) => predictTree(t, p), TREE_TRAIN), te = accuracy((p) => predictTree(t, p), TREE_TEST), shown = TREE_TEST.slice(0, 150);
  const curveAt = Array.from({ length: 8 }, (_, i) => { const g = grow(TREE_TRAIN, { maxDepth: i + 1, minLeaf: leaf }); return { train: accuracy((p) => predictTree(g, p), TREE_TRAIN), test: accuracy((p) => predictTree(g, p), TREE_TEST) }; });
  const C = plotBox(70, 370, 370, 150, [1, 8, 0.5, 1]), best = curveAt.reduce((m, x, i) => (x.test > curveAt[m].test ? i : m), 0);
  const map = [...regions("g", P, t), ...axes("ax", P, "x1", "x2")];
  const chart: Shape[] = [...axes("ch", C, "max depth", "accuracy", ["1", "8", "50%", "100%"]),
    { t: "path", id: "ctr", tone: "muted", dash: true, pts: curveAt.flatMap((x, i) => [C.sx(i + 1), C.sy(x.train)]) },
    { t: "path", id: "cte", tone: "hot", pts: curveAt.flatMap((x, i) => [C.sx(i + 1), C.sy(x.test)]) },
    { t: "text", id: "ltr", x: C.X + C.w - 6, y: C.sy(curveAt[7].train) + 14, text: "train", tone: "muted", anchor: "end", size: 16 },
    { t: "text", id: "lte", x: C.X + C.w - 6, y: C.sy(curveAt[7].test) + 16, text: "test", tone: "hot", anchor: "end", size: 16 },
    ...(d <= 8 ? [{ t: "dot" as const, id: "you", x: C.sx(d), y: C.sy(te), r: 8, tone: "ink" as const }] : [])];
  return { kind: "scene", title: `Depth ${d}, at least ${leaf} per leaf`, height: 560, steps: [
    { note: `${leaves(t).length} leaves. Each shaded box predicts its majority. On its own ${TREE_TRAIN.length} training points the tree is right ${pct(tr)} of the time. Try depth 3, then depth 8 with 5 per leaf.`, tone: "hot", shapes: [...map, ...points("p", P, TREE_TRAIN, 6)] },
    { note: `Now ${shown.length} of ${TREE_TEST.length} new points from the same pattern: test accuracy ${pct(te)}. ${tr - te > 0.15 ? "A big gap to training: the small boxes chase noise." : "Train and test are close."}`, tone: tr - te > 0.15 ? "warn" : "ok", shapes: [...map, ...points("q", P, shown, 4)] },
    { note: `Accuracy against depth at ${leaf} per leaf. Training keeps rising; test peaks at depth ${best + 1}, ${pct(curveAt[best].test)}, then falls. Raising the minimum per leaf is another brake.`, tone: "ok", shapes: [...map, ...points("q", P, shown, 4), ...chart] },
  ] };
}

// Classic models: k-nearest neighbours. One vote, then the regions every vote makes.
function knnPlay(v: Record<string, number>): Flow {
  const k = v.k, Q = { x: 5.2, y: 4.6 }, P = plotBox(90, 24, 320, 320, [0, 10, 0, 10]), cells = 20, side = 320 / cells;
  const vote = knn(Q, k), grid: Shape[] = Array.from({ length: cells * cells }, (_, i) => {
    const x = (i % cells + 0.5) * (10 / cells), y = (Math.floor(i / cells) + 0.5) * (10 / cells);
    return { t: "rect", id: `g${i}`, x: P.sx(x) - side / 2, y: P.sy(y) - side / 2, w: side + 0.6, h: side + 0.6, tone: classTone(knn({ x, y }, k).pred), fill: 34 };
  });
  const tr = accuracy((p) => knn(p, k).pred, TREE_TRAIN), te = accuracy((p) => knn(p, k).pred, TREE_TEST);
  const ax = axes("ax", P, "x1", "x2"), q: Shape = { t: "dot", id: "Q", x: P.sx(Q.x), y: P.sy(Q.y), r: 8, tone: "ink" };
  const links = vote.near.map((n, i): Shape => ({ t: "line", id: `n${i}`, x1: P.sx(Q.x), y1: P.sy(Q.y), x2: P.sx(n.q.x), y2: P.sy(n.q.y), tone: classTone(n.q.c), w: 2 }));
  return { kind: "scene", title: `k-NN with k = ${k}`, height: 390, steps: [
    { note: `A new point (the large plain dot). Find the ${k} training point${k > 1 ? "s" : ""} nearest to it by straight-line distance: ${vote.ones} dot${vote.ones === 1 ? "" : "s"} and ${k - vote.ones} ring${k - vote.ones === 1 ? "" : "s"}. The majority, ${vote.pred ? "dot" : "ring"}, is the prediction. There is no training step at all. Try k = 1, then 25.`, tone: "hot", shapes: [...ax, ...links, ...points("p", P, TREE_TRAIN, 6), q] },
    { note: `Ask the same question at every spot to see the regions. Training accuracy ${pct(tr)}${k === 1 ? ": with k = 1 each point is its own nearest neighbour, so it is always right on training data" : ""}.`, shapes: [...grid, ...ax, ...points("p", P, TREE_TRAIN, 6)] },
    { note: `On ${TREE_TEST.length} new points: ${pct(te)}. Small k gives jagged islands around noisy points (overfit); large k smooths everything toward the bigger class (underfit).`, tone: "ok", shapes: [...grid, ...ax, ...points("q", P, TREE_TEST.slice(0, 150), 4)] },
  ] };
}

// Classic models: k-means, assign and move, until nothing changes.
function kmeansPlay(v: Record<string, number>): Flow {
  const { k, seed } = v, run = kmeans(k, seed), P = plotBox(70, 24, 340, 340, [0, 10, 0, 10]);
  const tones = ["hot", "ok", "warn", "bad", "ink"] as const;
  return { kind: "scene", title: `k-means, k = ${k}, start ${seed}`, height: 410, steps: run.map((it, i) => ({
    note: i === 0 ? `${BLOBS.length} unlabelled points. Pick ${k} of them as starting centres (start ${seed}), then link every point to its nearest centre. Inertia, the sum of squared links, is ${fmt(it.inertia)}. Try k = 4 with each start.`
      : i === run.length - 1 && i > 1 ? `No point changed centre, so k-means has converged after ${i} moves: inertia ${fmt(it.inertia)}. Another start can land in a different, worse or better, answer.`
      : `Move each centre to the mean of its points, then relink each point to its nearest centre: inertia ${fmt(it.inertia)}. It can only go down.`,
    tone: i === run.length - 1 ? "ok" as const : undefined,
    shapes: [...axes("ax", P, "x1", "x2"),
      ...BLOBS.map((p, j): Shape => ({ t: "line", id: `l${j}`, x1: P.sx(p.x), y1: P.sy(p.y), x2: P.sx(it.cent[it.a[j]].x), y2: P.sy(it.cent[it.a[j]].y), tone: tones[it.a[j]], w: 1.5 })),
      ...BLOBS.map((p, j): Shape => ({ t: "dot", id: `p${j}`, x: P.sx(p.x), y: P.sy(p.y), r: 5, tone: tones[it.a[j]] })),
      ...it.cent.map((c, j): Shape => ({ t: "rect", id: `c${j}`, x: P.sx(c.x) - 9, y: P.sy(c.y) - 9, w: 18, h: 18, tone: tones[j], fill: 100, edge: true })),
      { t: "text", id: "lab", x: P.X + 10, y: P.Y + 18, text: `inertia ${fmt(it.inertia)}`, size: 18, bold: true }],
  })) };
}

// Classic models: PCA. Project onto your direction, then onto the one that keeps the most variance.
function pcaPlay(v: Record<string, number>): Flow {
  const deg = v.a, c = pca2d(), P = plotBox(60, 24, 380, 380, [0, 10, 0, 10]);
  const onto = (a: number) => { const r = (a * Math.PI) / 180, u = [Math.cos(r), Math.sin(r)]; return PCA_PTS.map((p) => { const s = (p.x - c.mx) * u[0] + (p.y - c.my) * u[1]; return { x: c.mx + s * u[0], y: c.my + s * u[1] }; }); };
  // the line through the mean at angle a, cut where it leaves the 0 to 10 square
  const axis = (id: string, a: number, tone: "ink" | "ok"): Shape => {
    const r = (a * Math.PI) / 180, u = [Math.cos(r), Math.sin(r)], m = [c.mx, c.my];
    const span = [0, 1].map((k) => (Math.abs(u[k]) < 1e-9 ? [-Infinity, Infinity] : [(0 - m[k]) / u[k], (10 - m[k]) / u[k]].sort((x, y) => x - y)));
    const lo = Math.max(span[0][0], span[1][0]), hi = Math.min(span[0][1], span[1][1]);
    return { t: "line", id, x1: P.sx(m[0] + lo * u[0]), y1: P.sy(m[1] + lo * u[1]), x2: P.sx(m[0] + hi * u[0]), y2: P.sy(m[1] + hi * u[1]), tone, w: 3 };
  };
  const dots = (pts: { x: number; y: number }[]) => pts.map((p, i): Shape => ({ t: "dot", id: `p${i}`, x: P.sx(p.x), y: P.sy(p.y), r: 6, tone: "hot" }));
  const ghosts = PCA_PTS.map((p, i): Shape => ({ t: "dot", id: `o${i}`, x: P.sx(p.x), y: P.sy(p.y), r: 5, tone: "muted", ring: true }));
  const sticks = (pts: { x: number; y: number }[]) => pts.map((p, i): Shape => ({ t: "line", id: `k${i}`, x1: P.sx(PCA_PTS[i].x), y1: P.sy(PCA_PTS[i].y), x2: P.sx(p.x), y2: P.sy(p.y), tone: "muted", w: 1.5 }));
  const mine = varAlong(deg, c), share = (x: number) => pct(x / c.total), ax = [{ t: "rect" as const, id: "frame", x: P.X, y: P.Y, w: P.w, h: P.h, tone: "muted" as const, fill: 0, edge: true }];
  return { kind: "scene", title: `Project onto ${deg}°`, height: 430, steps: [
    { note: `${PCA_PTS.length} points in 2 numbers each. Total variance ${fmt(c.total)}. To keep one number per point, pick a direction through their mean: yours is ${deg}°. Try to find the angle that keeps the most.`, shapes: [...ax, axis("dir", deg, "ink"), ...dots(PCA_PTS)] },
    { note: `Slide each point onto the line. The spread that survives is the variance along it: ${fmt(mine)}, ${share(mine)} of the total. The grey sticks are what is thrown away.`, tone: mine / c.total > 0.9 ? "ok" : "warn", shapes: [...ax, axis("dir", deg, "ink"), ...ghosts, ...sticks(onto(deg)), ...dots(onto(deg))] },
    { note: `PCA picks the direction that keeps the most, the first principal component, at ${fmt(Math.round(c.ang * 10) / 10)}°: variance ${fmt(c.l1)}, ${share(c.l1)}. It is the top eigenvector of the covariance matrix; the sticks are as short as they can be.`, tone: "ok",
      shapes: [...ax, axis("dir", c.ang, "ok"), ...ghosts, ...sticks(onto(c.ang)), ...dots(onto(c.ang))] },
  ] };
}

export const PLAY_1: Record<string, PlayFlow> = {
  "s1-roll": { title: "Roll down the bowl", knobs: [{ key: "lr", label: "Learning rate", min: 0.01, max: 0.2, step: 0.01, value: 0.08 }], make: roll },
  "s1-degree": { title: "Bend the curve", knobs: [{ key: "d", label: "Polynomial degree", min: 0, max: 11, step: 1, value: 3 }], make: degree },
  "s1-embed": { title: "Watch word vectors learn", knobs: [{ key: "win", label: "Context window", min: 1, max: 3, step: 1, value: 2 }], make: embed },
  "s1-cut": {
    title: "Find the best cut",
    knobs: [{ key: "f", label: "Feature (1 = x1, 2 = x2)", min: 1, max: 2, step: 1, value: 2 }, { key: "t", label: "Cut at", min: 0.5, max: 9.5, step: 0.5, value: 6 }],
    make: cut,
  },
  "s1-depth": {
    title: "How deep should it grow?",
    knobs: [{ key: "d", label: "Max depth", min: 1, max: 8, step: 1, value: 6 }, { key: "leaf", label: "Min points per leaf", min: 1, max: 10, step: 1, value: 1 }],
    make: depth,
  },
  "s1-knn": { title: "Choose k", knobs: [{ key: "k", label: "Neighbours k", min: 1, max: 25, step: 2, value: 1 }], make: knnPlay },
  "s1-kmeans": {
    title: "Run k-means",
    knobs: [{ key: "k", label: "Clusters k", min: 2, max: 5, step: 1, value: 3 }, { key: "seed", label: "Starting centres", min: 1, max: 5, step: 1, value: 1 }],
    make: kmeansPlay,
  },
  "s1-pca": { title: "Pick a direction", knobs: [{ key: "a", label: "Direction", min: 0, max: 175, step: 5, value: 120, unit: "°" }], make: pcaPlay },
  "s1-idf": {
    title: "What makes a word count",
    knobs: [
      { key: "N", label: "Documents", min: 10, max: 10000, step: 10, value: 1000 },
      { key: "p", label: "Share containing the word", min: 1, max: 100, step: 1, value: 2, unit: "%" },
      { key: "tf", label: "Times in this document", min: 1, max: 10, step: 1, value: 3 },
    ],
    make: idfPlay,
  },
  "s1-data": {
    title: "Give the model more data",
    knobs: [
      { key: "d", label: "Polynomial degree", min: 1, max: 9, step: 1, value: 9 },
      { key: "n", label: "Training points", min: 10, max: 200, step: 10, value: 20 },
    ],
    make: moreData,
  },
  "s1-threshold": {
    title: "Move the threshold",
    knobs: [{ key: "t", label: "Spam threshold", min: 0.05, max: 0.95, step: 0.05, value: 0.5 }],
    make: threshold,
  },
  "s1-lr": {
    title: "Pick the learning rate",
    knobs: [
      { key: "lr", label: "Learning rate", min: 0.01, max: 0.2, step: 0.01, value: 0.05 },
      { key: "steps", label: "Steps", min: 10, max: 200, step: 10, value: 50 },
    ],
    make: lrRun,
  },
  "s1-line": {
    title: "Fit the line by hand",
    knobs: [
      { key: "w", label: "Slope w", min: 0, max: 2.5, step: 0.05, value: 0.5 },
      { key: "b", label: "Intercept b", min: 0, max: 5, step: 0.1, value: 3 },
    ],
    make: line,
  },
};

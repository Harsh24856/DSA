// Stage 6 (Using LLMs): the small calculations shared by the walk-throughs, the figures and the module text. Client-safe: no module text here.

export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;

// Evals: standard error of an accuracy, the 95% interval of a difference, and the items needed to see it.
export const se = (p: number, n: number) => Math.sqrt((p * (1 - p)) / n);
export const diffCI = (p1: number, p2: number, n: number) => { const s = Math.sqrt((p1 * (1 - p1)) / n + (p2 * (1 - p2)) / n), d = p2 - p1; return [d - 1.96 * s, d + 1.96 * s] as const; };
export const CI_EX = { p1: 0.78, p2: 0.82, ns: [200, 2000] };
// Pairwise judging with position bias: with chance `bias` the judge just picks whichever answer is shown first; otherwise it picks A with chance pA.
export const pickA = (pA: number, bias: number, aFirst: boolean) => (aFirst ? bias : 0) + (1 - bias) * pA;
export function pairwise(pA: number, bias: number) {
  const first = pickA(pA, bias, true), second = pickA(pA, bias, false);
  const bothA = first * second, bothB = (1 - first) * (1 - second), tie = 1 - bothA - bothB;   // each order run once, independently
  return { aFirst: first, mixed: (first + second) / 2, bothA, bothB, tie, swapWin: bothA / (bothA + bothB) };
}
export const nNeeded =(p1: number, p2: number) => Math.ceil((1.96 ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) / (p2 - p1) ** 2);
// Cohen's kappa from a 2 x 2 table: both good, judge good only, human good only, both bad.
export function kappa(both: number, jOnly: number, hOnly: number, none: number) {
  const n = both + jOnly + hOnly + none, po = (both + none) / n, pj = (both + jOnly) / n, ph = (both + hOnly) / n;
  const pe = pj * ph + (1 - pj) * (1 - ph);
  return { po, pe, k: (po - pe) / (1 - pe) };
}

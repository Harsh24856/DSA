// Stage 2 (Neural networks): shared maths for the network and convolution visualisers. Client-safe: imports nothing.

// ---- The XOR network (2 inputs, 2 ReLU hidden units, 1 linear output), weights chosen by hand ----
export const NET = { W1: [[1, 1], [1, 1]], b1: [0, -1], W2: [1, -2], b2: 0 };
const relu = (z: number) => Math.max(0, z);

/** Forward pass: pre-activations z, hidden outputs h, output y. W1[i][j] is input i to hidden j. */
export function netForward(x: number[], w2 = NET.W2) {
  const z = NET.b1.map((b, j) => b + x.reduce((s, xi, i) => s + xi * NET.W1[i][j], 0));
  const h = z.map(relu);
  const y = NET.b2 + h.reduce((s, hj, j) => s + hj * w2[j], 0);
  return { z, h, y };
}

/** Backward pass for squared loss (y - t)². Returns every gradient the picture labels. */
export function netBackward(x: number[], t: number, w2 = NET.W2) {
  const { z, h, y } = netForward(x, w2);
  const loss = (y - t) ** 2, dy = 2 * (y - t);
  const dW2 = h.map((hj) => dy * hj);
  const dh = w2.map((w) => dy * w);
  const dz = dh.map((g, j) => (z[j] > 0 ? g : 0));
  const dW1 = x.map((xi) => dz.map((g) => g * xi));
  return { z, h, y, loss, dy, dW2, dh, dz, dW1 };
}

// ---- Convolution ----
export type Img = number[][];
/** A 7 by 7 picture: a vertical bar on the left and a horizontal bar along the bottom (an "L"). */
export const IMG: Img = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => (c === 1 || r === 5) && r >= 1 && r <= 5 && c >= 1 && c <= 5 ? 1 : 0));
export const KERNELS: { name: string; k: Img }[] = [
  { name: "vertical edge", k: [[1, 0, -1], [1, 0, -1], [1, 0, -1]] },
  { name: "horizontal edge", k: [[1, 1, 1], [0, 0, 0], [-1, -1, -1]] },
  { name: "blur (average)", k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)) },
];

export const outSize = (n: number, k: number, s: number, p: number) => Math.floor((n + 2 * p - k) / s) + 1;
export const pad = (img: Img, p: number): Img => {
  const n = img.length + 2 * p;
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => img[r - p]?.[c - p] ?? 0));
};

/** Cross-correlation (what deep learning calls convolution): no kernel flip. Returns the map and every window sum's terms. */
export function conv2d(img: Img, k: Img, s = 1, p = 0) {
  const a = pad(img, p), m = outSize(img.length, k.length, s, p);
  const out = Array.from({ length: m }, (_, r) => Array.from({ length: m }, (_, c) => {
    let sum = 0;
    for (let i = 0; i < k.length; i++) for (let j = 0; j < k.length; j++) sum += a[r * s + i][c * s + j] * k[i][j];
    return Math.round(sum * 1e6) / 1e6;
  }));
  return { padded: a, out };
}

/** 2 by 2 max pooling with stride 2 (a trailing odd row or column is dropped). */
export function maxPool(a: Img) {
  const m = Math.floor(a.length / 2);
  return Array.from({ length: m }, (_, r) => Array.from({ length: m }, (_, c) => Math.max(a[2 * r][2 * c], a[2 * r][2 * c + 1], a[2 * r + 1][2 * c], a[2 * r + 1][2 * c + 1])));
}

/** Shapes through a small digit classifier: [label, h, w, channels, params]. */
export function cnnStack() {
  const rows: [string, number, number, number, number][] = [["input", 28, 28, 1, 0]];
  const conv = (c: number, k: number) => { const [, h, w, ci] = rows[rows.length - 1]; rows.push([`conv ${k}×${k}, ${c} filters`, outSize(h, k, 1, 0), outSize(w, k, 1, 0), c, (k * k * ci + 1) * c]); };
  const pool = () => { const [, h, w, c] = rows[rows.length - 1]; rows.push(["max pool 2×2", Math.floor(h / 2), Math.floor(w / 2), c, 0]); };
  conv(8, 3); pool(); conv(16, 3); pool();
  const [, h, w, c] = rows[rows.length - 1], flat = h * w * c;
  rows.push(["flatten", 1, 1, flat, 0], ["dense to 10 classes", 1, 1, 10, flat * 10 + 10]);
  return rows;
}

/** Parameters of one layer that maps a 28×28 image to 8 maps of 26×26: dense against convolution. */
export function denseVsConv() {
  const inN = 28 * 28, outN = 26 * 26 * 8;
  return { dense: inN * outN + outN, conv: (3 * 3 * 1 + 1) * 8 };
}

/** Receptive field of a stack of k×k stride-1 convolutions. */
export const receptive = (layers: number, k = 3) => 1 + layers * (k - 1);

// checks at import: the hand weights solve XOR and the vertical-edge kernel lights the bar's edges
for (const [x, t] of [[[0, 0], 0], [[0, 1], 1], [[1, 0], 1], [[1, 1], 0]] as [number[], number][]) if (netForward(x).y !== t) throw new Error("NET no longer solves XOR");
if (conv2d(IMG, KERNELS[0].k).out.length !== 5) throw new Error("7×7 with a 3×3 kernel must give 5×5");

// Stage 0 (Python for AI): the array and table maths shared by the flows, walk-throughs, figures and module text.
// Client-safe: no module text here. Every number shown in stage 0 comes from these functions.

export const n0 = (x: number) => x.toLocaleString("en-US");
/** Short number: up to 3 decimals, trailing zeros dropped. */
export const fmt = (x: number) => String(Number(x.toFixed(3)));
/** A shape the way NumPy prints it: (3,) for one axis, (2, 3) for two. */
export const shapeStr = (s: number[]) => (s.length === 1 ? `(${s[0]},)` : `(${s.join(", ")})`);
/** A Python list the way print(x.tolist()) shows it: whole floats keep their ".0". */
export const pyList = (xs: number[], float = false) => `[${xs.map((x) => (float && Number.isInteger(x) ? `${x}.0` : String(x))).join(", ")}]`;

// ---------- broadcasting ----------
/** NumPy's rule: line the shapes up from the right; on each axis the sizes must be equal or one of them must be 1. A missing axis counts as 1. */
export function broadcastAxes(a: number[], b: number[]) {
  const n = Math.max(a.length, b.length);
  return Array.from({ length: n }, (_, i) => {
    const x = a[a.length - n + i], y = b[b.length - n + i];   // undefined when that array has no such axis
    const xa = x ?? 1, ya = y ?? 1;
    return { a: x, b: y, out: xa === ya || xa === 1 || ya === 1 ? Math.max(xa, ya) : null };
  });
}
export const broadcastShape = (a: number[], b: number[]) => {
  const ax = broadcastAxes(a, b);
  return ax.every((x) => x.out !== null) ? ax.map((x) => x.out as number) : null;
};
export const size = (s: number[]) => s.reduce((p, x) => p * x, 1);

/** Element-wise op on 2D arrays (a 1D array is one row), with broadcasting. Returns null when the shapes do not broadcast. */
export function bcast2(A: number[][], B: number[][], op: (x: number, y: number) => number): number[][] | null {
  const s = broadcastShape([A.length, A[0].length], [B.length, B[0].length]);
  if (!s) return null;
  const at = (M: number[][], i: number, j: number) => M[M.length === 1 ? 0 : i][M[0].length === 1 ? 0 : j];
  return Array.from({ length: s[0] }, (_, i) => Array.from({ length: s[1] }, (_, j) => op(at(A, i, j), at(B, i, j))));
}
export const add = (x: number, y: number) => x + y;

/** Shape after reducing one axis, as x.sum(axis=k, keepdims=...) gives it. */
export const reduceShape = (s: number[], axis: number, keepdims = false) => s.flatMap((d, i) => (i === axis ? (keepdims ? [1] : []) : [d]));
/** Sums of a 2D array along axis 0 (one per column) or axis 1 (one per row). */
export const sumAxis = (M: number[][], axis: 0 | 1) => (axis === 0 ? M[0].map((_, j) => M.reduce((t, r) => t + r[j], 0)) : M.map((r) => r.reduce((t, v) => t + v, 0)));
/** Shape of A @ B for 1D to 3D arrays: the last axis of A meets the second to last of B; leading batch axes broadcast. */
export function matmulShape(a: number[], b: number[]): number[] | null {
  if (a[a.length - 1] !== b[Math.max(0, b.length - 2)]) return null;
  if (b.length === 1) return a.slice(0, -1);
  const batch = broadcastShape(a.slice(0, -2).length ? a.slice(0, -2) : [1], b.slice(0, -2).length ? b.slice(0, -2) : [1]);
  if (!batch) return null;
  const lead = a.length > 2 || b.length > 2 ? batch : [];
  return [...lead, ...(a.length > 1 ? [a[a.length - 2]] : []), b[b.length - 1]];
}

/** The 2 by 3 matrix used by the axis figure and questions. */
export const M23 = [[1, 2, 3], [4, 5, 6]];
/** The (3, 1) column and (1, 4) row used by the stretch figure. */
export const COL = [[0], [10], [20]], ROW = [[1, 2, 3, 4]];

// ---------- pandas ----------
export type Req = { id: number; model: string; tok: number; ms: number | null; ok: boolean };
/** A small request log: one row per call to a model. ms is null where the latency was not recorded (NaN in pandas). */
export const LOG: Req[] = [
  { id: 1, model: "small", tok: 120, ms: 210, ok: true },
  { id: 2, model: "large", tok: 480, ms: 1350, ok: true },
  { id: 3, model: "small", tok: 90, ms: null, ok: true },
  { id: 4, model: "large", tok: 610, ms: 1720, ok: false },
  { id: 5, model: "small", tok: 150, ms: 260, ok: false },
  { id: 6, model: "tiny", tok: 40, ms: 95, ok: true },
  { id: 7, model: "large", tok: 520, ms: 1480, ok: true },
  { id: 8, model: "small", tok: 110, ms: 230, ok: true },
];
/** Price list in credits per 1,000 tokens. "tiny" is missing on purpose, so a left merge leaves a gap. */
export const PRICES: { model: string; per1k: number }[] = [{ model: "small", per1k: 0.5 }, { model: "large", per1k: 3 }];

/** A missing value as Python prints a float nan (flows avoid the capitalised form, which their checks treat as a broken number). */
export const cell = (x: number | null, f: (v: number) => string = String) => (x === null ? "nan" : f(x));
/** pandas mean: missing values are skipped; no values left gives NaN, returned here as null. */
export const nanMean = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
/** Groups in order of first appearance (groupby(sort=False)); sort the keys yourself for pandas' default order. */
export function groupBy<T>(rows: T[], key: (r: T) => string) {
  const g = new Map<string, T[]>();
  for (const r of rows) g.set(key(r), [...(g.get(key(r)) ?? []), r]);
  return g;
}
export const sorted = <T,>(g: Map<string, T[]>) => [...g.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
/** Python dict repr of string keys and numbers, as print(series.to_dict()) shows it. */
export const pyDict = (e: [string, number][], float = false) => `{${e.map(([k, v]) => `'${k}': ${float && Number.isInteger(v) ? `${v}.0` : v}`).join(", ")}}`;
/** Credits for one request: tokens / 1000 times its model's price; null when the model has no price (NaN after a left merge). */
export const credits = (r: Req, prices = PRICES) => { const p = prices.find((x) => x.model === r.model); return p ? (r.tok / 1000) * p.per1k : null; };
/** Row count of df.merge(right, on=key, how): each left row meets every matching right row; left keeps unmatched rows once. */
export const mergeRows = (left: string[], right: string[], how: "left" | "inner") =>
  left.reduce((t, k) => { const m = right.filter((x) => x === k).length; return t + (m ? m : how === "left" ? 1 : 0); }, 0);

// ---------- vectorising ----------
/** Squared distance from every row of A to every row of B, by three nested loops. */
export const sqdistLoop = (A: number[][], B: number[][]) => A.map((a) => B.map((b) => a.reduce((t, v, k) => t + (v - b[k]) ** 2, 0)));
/** The same through ||a||^2 + ||b||^2 - 2 a.b, which needs only one matrix multiply. */
export function sqdistTrick(A: number[][], B: number[][]) {
  const sq = (v: number[]) => v.reduce((t, x) => t + x * x, 0), dot = (u: number[], v: number[]) => u.reduce((t, x, k) => t + x * v[k], 0);
  return A.map((a) => B.map((b) => sq(a) + sq(b) - 2 * dot(a, b)));
}
export const PA = [[1, 2], [3, 0], [0, 4]], PB = [[0, 0], [2, 2]];
/** Bytes for the pairwise distance of n by d against m by d float32 arrays: the broadcast (n, m, d) difference against the matmul trick (inputs, the (n, m) products, norms). */
export const pairBytes = (n: number, m: number, d: number, bytes = 4) => ({ cube: n * m * d * bytes, trick: (n * m + n + m) * bytes, out: n * m * bytes });
export const gb = (b: number) => b / 1e9, mb = (b: number) => b / 1e6;
/** A size in bytes as "x KB", "x MB" or "x GB" (decimal units). */
export const bytesStr = (b: number) => (b >= 1e9 ? `${fmt(gb(b))} GB` : b >= 1e6 ? `${fmt(mb(b))} MB` : b >= 1e3 ? `${fmt(b / 1e3)} KB` : `${b} B`);

/** Two padded sequences of token values, with a mask that is 1 on real tokens and 0 on padding. */
export const MX = [[2, 4, 9, 9], [6, 9, 9, 9]], MASK = [[1, 1, 0, 0], [1, 0, 0, 0]];
export const maskedMean = (X: number[][], M: number[][]) => X.map((r, i) => r.reduce((t, v, j) => t + v * M[i][j], 0) / M[i].reduce((a, b) => a + b, 0));
export const plainMean = (X: number[][]) => X.map((r) => r.reduce((a, b) => a + b, 0) / r.length);

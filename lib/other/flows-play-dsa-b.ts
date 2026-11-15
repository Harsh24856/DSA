// Interactive walk-throughs for /patterns (see flows-play.ts): each runs the real algorithm on the learner's values.
// Data is a fixed, readable example cut or changed by the sliders, so the same settings always give the same walk-through.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { ChainStep, Flow, FlowTone, GridStep, GridTable } from "./flows.ts";

type Tones = Record<string, FlowTone>;
const list = (xs: (string | number)[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const pad = (xs: (string | number)[], n: number) => [...xs, ...Array(Math.max(0, n - xs.length)).fill("")];
const idx = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const plural = (k: number, w: string) => `${k} ${w}${k === 1 ? "" : "s"}`;
const ord = (k: number) => `${k}${k % 10 === 1 && k !== 11 ? "st" : k % 10 === 2 && k !== 12 ? "nd" : k % 10 === 3 && k !== 13 ? "rd" : "th"}`;
const ARR = [3, 8, 1, 6, 4, 9, 2, 7, 5];
const LET = "ABCDEFGHI";

/* ---------- binary tree ---------- */
type TNode = { v: number; l?: TNode; r?: TNode };
const insert = (t: TNode | undefined, v: number): TNode => (!t ? { v } : (v < t.v ? (t.l = insert(t.l, v)) : (t.r = insert(t.r, v)), t));
const build = (keys: number[]) => keys.reduce<TNode | undefined>((t, k) => insert(t, k), undefined)!;
const height = (t?: TNode): number => (t ? 1 + Math.max(height(t.l), height(t.r)) : 0);
function levelNodes(t: TNode) { const q = [t], out: TNode[] = []; while (q.length) { const n = q.shift()!; out.push(n); if (n.l) q.push(n.l); if (n.r) q.push(n.r); } return out; }
/** node, left child, right child for every node that has a child, top to bottom */
const kidsTable = (t: TNode): GridTable => ({ label: "the tree", head: ["node", "left", "right"], rows: levelNodes(t).filter((n) => n.l || n.r).map((n) => [n.v, n.l?.v ?? "-", n.r?.v ?? "-"]) });

const SEARCH_KEYS = [50, 30, 70, 20, 40, 60, 80];
function bstSearch(v: Record<string, number>): Flow {
  const x = v.x, root = build(SEARCH_KEYS), steps: ChainStep[] = [
    { node: `BST of ${SEARCH_KEYS.join(", ")}`, note: `These keys were inserted in this order. Every key left of a node is smaller and every key right of it is larger. Look for ${x}.` },
  ];
  let cur: TNode | undefined = root, parent: TNode = root, side = "left", found = false;
  while (cur) {
    if (x === cur.v) { steps.push({ node: `${cur.v}: equal`, tone: "hot", note: `${x} equals ${cur.v}, so the search stops here.` }); found = true; break; }
    const dir: "left" | "right" = x < cur.v ? "left" : "right";
    steps.push({ node: `${cur.v}: ${x} ${dir === "left" ? "<" : ">"} ${cur.v}, go ${dir}`, tone: "hot",
      note: `${x} is ${dir === "left" ? "smaller" : "larger"} than ${cur.v}, so it can only be in the ${dir} subtree. The whole other side is skipped.` });
    parent = cur; side = dir; cur = dir === "left" ? cur.l : cur.r;
  }
  const looked = steps.length - 1;
  steps.push(found
    ? { node: `found ${x} after ${plural(looked, "comparison")}`, tone: "ok", note: `${x} is in the tree. Searching it took one comparison per level it went down.` }
    : { node: `${parent.v} has no ${side} child`, tone: "bad", note: `The path ends, so ${x} is not in the tree. An insert of ${x} would put it exactly here, as the ${side} child of ${parent.v}.` });
  steps.push({ node: `${looked} of ${SEARCH_KEYS.length} keys looked at`, tone: "warn",
    note: `A search costs at most the height, here ${height(root)}, so O(log n) when the tree is balanced. A plain list could need all ${SEARCH_KEYS.length} comparisons.` });
  return { title: `Searching a BST for ${x}`, steps };
}

const TREE_KEYS = [50, 30, 70, 20, 40, 60, 80, 35];
const ORDERS = ["preorder", "inorder", "postorder", "level order"];
function traversal(v: Record<string, number>): Flow {
  const n = v.n, o = v.order - 1, root = build(TREE_KEYS.slice(0, n)), kids = kidsTable(root);
  const visits: { t: TNode; held: number[] }[] = [];
  if (o < 3) {
    const go = (t: TNode | undefined, path: number[]) => {
      if (!t) return;
      const p = [...path, t.v];
      if (o === 0) visits.push({ t, held: p });
      go(t.l, p);
      if (o === 1) visits.push({ t, held: p });
      go(t.r, p);
      if (o === 2) visits.push({ t, held: p });
    };
    go(root, []);
  } else {
    const q = [root];
    while (q.length) { const t = q.shift()!; if (t.l) q.push(t.l); if (t.r) q.push(t.r); visits.push({ t, held: q.map((x) => x.v) }); }
  }
  const wide = Math.max(1, ...visits.map((s) => s.held.length)), what = o < 3 ? "open calls, root first" : "queue, front first";
  const done = (k: number) => pad(visits.slice(0, k).map((s) => s.t.v), n);
  const why = ({ t }: { t: TNode }) => {
    const leaf = !t.l && !t.r, ch = [t.l?.v, t.r?.v].filter((c): c is number => c !== undefined);
    if (o === 0) return `Visit ${t.v} as soon as its call starts, before either subtree.${leaf ? " It is a leaf, so its call ends at once." : ` Then go into ${list(ch)}.`}`;
    if (o === 1) return `${t.v}'s left subtree is ${t.l ? "finished" : "empty"}, so visit ${t.v} now, then ${t.r ? `go right to ${t.r.v}` : "return, as it has no right child"}.`;
    if (o === 2) return `Both subtrees of ${t.v} are ${leaf ? "empty" : "finished"}, so ${t.v} is visited last, as its call returns.`;
    return `Take ${t.v} from the front of the queue and visit it. ${ch.length ? `Its children ${list(ch)} join the back.` : "It has no children to add."}`;
  };
  const steps: GridStep[] = [{ note: `A BST of the first ${n} keys of ${TREE_KEYS.join(", ")}. Walk it in ${ORDERS[o]}${o < 3 ? ", a recursive DFS" : ", a BFS with a queue"}.`,
    tables: [kids, { label: "visit order", head: idx(n).map((i) => String(+i + 1)), rows: [done(0)] }, { label: what, rows: [pad(o < 3 ? [] : [root.v], wide)] }] }];
  visits.forEach((s, k) => steps.push({ note: why(s), tables: [kids, { label: "visit order", head: idx(n).map((i) => String(+i + 1)), rows: [done(k + 1)], tones: { [`0:${k}`]: "hot" } }, { label: what, rows: [pad(s.held, wide)], tones: o < 3 ? { [`0:${s.held.length - 1}`]: "hot" } : {} }] }));
  steps.push({ note: `${ORDERS[o][0].toUpperCase()}${ORDERS[o].slice(1)} gives ${visits.map((s) => s.t.v).join(", ")}.${o === 1 ? " On a BST that is sorted order." : ""} Every node is visited once, O(n), and the ${o < 3 ? "call stack" : "queue"} never held more than ${wide}.`, tone: "ok",
    tables: [kids, { label: "visit order", head: idx(n).map((i) => String(+i + 1)), rows: [done(n)], tones: { "0": "ok" } }] });
  return { kind: "grid", title: `${ORDERS[o][0].toUpperCase()}${ORDERS[o].slice(1)} of a ${n}-node tree`, steps };
}

function kthSmallest(v: Record<string, number>): Flow {
  const k = v.k, root = build(TREE_KEYS), kids = kidsTable(root), stack: TNode[] = [], out: number[] = [];
  const spine = (t?: TNode) => { const got: number[] = []; for (; t; t = t.l) { stack.push(t); got.push(t.v); } return got; };
  const snaps: { st: number[]; out: number[]; note: string; tone?: FlowTone }[] = [];
  const first = spine(root);
  snaps.push({ st: stack.map((t) => t.v), out: [], note: `Push the left spine ${list(first)}. The bottom-left node, ${first.at(-1)}, is the smallest key, and it is on top.` });
  while (stack.length) {
    const t = stack.pop()!;
    out.push(t.v);
    if (out.length === k) { snaps.push({ st: stack.map((x) => x.v), out: [...out], note: `Pop ${t.v}: it is number ${k} in sorted order, so it is the answer. Stop here; the rest of the tree is never visited.`, tone: "ok" }); break; }
    const more = spine(t.r);
    snaps.push({ st: stack.map((x) => x.v), out: [...out], note: `Pop ${t.v}, number ${out.length} in sorted order. ${more.length ? `It has a right subtree, so push its left spine ${list(more)}.` : "It has no right subtree, so the next smallest is already on top."}` });
  }
  const wide = Math.max(...snaps.map((s) => s.st.length), 1);
  const tables = (s: (typeof snaps)[number], last = false): GridTable[] => [kids,
    { label: "stack, bottom first", rows: [pad(s.st, wide)], tones: s.st.length ? { [`0:${s.st.length - 1}`]: "hot" } : {} },
    { label: "popped, smallest first", head: idx(k).map((i) => String(+i + 1)), rows: [pad(s.out, k)], tones: s.out.length ? { [`0:${s.out.length - 1}`]: last ? "ok" : "hot" } : {} }];
  return { kind: "grid", title: `The ${ord(k)} smallest key in a BST`, steps: [
    { note: `Inorder on a BST gives the keys in sorted order, so the k-th key visited is the k-th smallest. Use an explicit stack so the walk can stop early.`, tables: tables({ st: [], out: [], note: "" }) },
    ...snaps.map((s, i): GridStep => ({ note: s.note, tone: s.tone, tables: tables(s, i === snaps.length - 1) })),
    { note: `The answer is ${out[k - 1]}. The walk cost O(h + k): one left spine down, then ${k} pops, not all ${TREE_KEYS.length} keys.`, tone: "ok", tables: tables(snaps.at(-1)!, true) },
  ] };
}

/* ---------- heap ---------- */
type Less = (a: number, b: number) => boolean;
const minLess: Less = (a, b) => a < b, maxLess: Less = (a, b) => a > b;
function hpush(h: number[], x: number, less: Less) { h.push(x); for (let i = h.length - 1; i > 0;) { const p = (i - 1) >> 1; if (!less(h[i], h[p])) break; [h[i], h[p]] = [h[p], h[i]]; i = p; } }
function hpop(h: number[], less: Less) {
  const top = h[0], last = h.pop()!;
  if (h.length) { h[0] = last; for (let i = 0; ;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < h.length && less(h[l], h[m])) m = l; if (r < h.length && less(h[r], h[m])) m = r; if (m === i) break; [h[i], h[m]] = [h[m], h[i]]; i = m; } }
  return top;
}

const HEAP_BASE = [3, 8, 1, 6, 4, 9, 2, 7];
function heapPush(v: Record<string, number>): Flow {
  const { size, x } = v, base = HEAP_BASE.slice(0, size), a: number[] = [];
  base.forEach((y) => hpush(a, y, minLess));
  const head = idx(size + 1), tbl = (row: (string | number)[], tones: Tones = {}): GridTable[] => [{ label: "heap array", head, rows: [pad(row, size + 1)], tones }];
  const steps: GridStep[] = [{ note: `A min-heap of ${list(base)}, pushed one by one. The children of index i sit at 2i + 1 and 2i + 2, and every parent is at most its children.`, tables: tbl(a, { "0:0": "ok" }) }];
  a.push(x);
  let i = a.length - 1, swaps = 0;
  steps.push({ note: `Append ${x} at the end, index ${i}. The tree shape stays complete, but ${x} may be smaller than its parent.`, tone: "hot", tables: tbl(a, { [`0:${i}`]: "hot" }) });
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (a[p] <= a[i]) { steps.push({ note: `The parent at (${i} - 1) / 2 = ${p} holds ${a[p]}, which is not larger than ${x}. Sifting stops here.`, tone: "ok", tables: tbl(a, { [`0:${i}`]: "ok", [`0:${p}`]: "ok" }) }); break; }
    [a[p], a[i]] = [a[i], a[p]]; swaps++;
    steps.push({ note: `The parent at (${i} - 1) / 2 = ${p} holds ${a[i]}, which is larger than ${x}. Swap them: ${x} moves up one level.`, tone: "hot", tables: tbl(a, { [`0:${p}`]: "hot", [`0:${i}`]: "warn" }) });
    i = p;
  }
  steps.push({ note: `${i === 0 ? `${x} is now the root, the new minimum` : `${x} rests at index ${i}`} after ${plural(swaps, "swap")}. A push climbs at most the height, about log2 of ${size + 1}, so it is O(log n).`, tone: "ok", tables: tbl(a, { [`0:${i}`]: "ok" }) });
  return { kind: "grid", title: `Pushing ${x} into a min-heap of ${size}`, steps };
}

function topK(v: Record<string, number>): Flow {
  const { n, k } = v;
  if (n - k < 2) throw new PlayError(`Make the stream at least 2 longer than k, so some numbers have to compete for the ${k} places.`);
  const s = ARR.slice(0, n), h: number[] = [], out = new Set<number>();
  s.slice(0, k).forEach((x) => hpush(h, x, minLess));
  const tables = (cur: number): GridTable[] => [
    { label: "stream", head: idx(n), rows: [s], tones: Object.fromEntries(s.map((x, j) => [`0:${j}`, j === cur ? "hot" : h.includes(x) ? "ok" : out.has(x) ? "bad" : undefined]).filter((e) => e[1])) },
    { label: `min-heap of size ${k}, top first`, head: idx(k), rows: [[...h]], tones: { "0:0": "warn" } },
  ];
  const steps: GridStep[] = [{ note: `Keep the ${k} largest of ${n} numbers. Push the first ${k}: ${list(s.slice(0, k))}. The top, ${h[0]}, is the weakest of the current winners.`, tables: tables(-1) }];
  for (let i = k; i < n; i++) {
    const x = s[i], top = h[0];
    if (x > top) { out.add(hpop(h, minLess)); hpush(h, x, minLess); steps.push({ note: `${x} beats the top ${top}: pop ${top}, push ${x}. The new top is ${h[0]}.`, tone: "hot", tables: tables(i) }); }
    else { out.add(x); steps.push({ note: `${x} is not larger than the top ${top}, so it cannot be among the ${k} largest. Reject it without touching the heap.`, tables: tables(i) }); }
  }
  const best = [...h].sort((a, b) => b - a);
  steps.push({ note: `The ${k} largest are ${list(best)}, and the ${ord(k)} largest is the top, ${h[0]}. Each number costs O(log k), so O(n log k) with only k in memory.`, tone: "ok", tables: tables(-1) });
  return { kind: "grid", title: `Top ${k} of ${n} numbers with a min-heap`, steps };
}

function median(v: Record<string, number>): Flow {
  const n = v.n, s = ARR.slice(0, n), low: number[] = [], high: number[] = [], meds: string[] = [];
  const show = (a: number[]) => pad(a, 5);
  const tables = (i: number, moved: string): GridTable[] => [
    { label: "arrived", head: idx(n), rowHead: ["value", "median"], rows: [pad(s.slice(0, i + 1), n), pad(meds, n)], tones: i >= 0 ? { [`0:${i}`]: "hot", [`1:${i}`]: "ok" } : {} },
    { label: "two heaps, top first", rowHead: ["low (max)", "high (min)"], rows: [show(low), show(high)], tones: { ...(low.length ? { "0:0": "ok" } : {}), ...(high.length ? { "1:0": "ok" } : {}), ...(moved ? { [`${moved === "low" ? 0 : 1}:0`]: "warn" } : {}) } },
  ];
  const steps: GridStep[] = [];
  s.forEach((x, i) => {
    const lt = low[0], side = !low.length || x <= lt ? "low" : "high";
    hpush(side === "low" ? low : high, x, side === "low" ? maxLess : minLess);
    let moved = "";
    if (low.length > high.length + 1) { hpush(high, hpop(low, maxLess), minLess); moved = "high"; }
    else if (high.length > low.length) { hpush(low, hpop(high, minLess), maxLess); moved = "low"; }
    const m = low.length > high.length ? low[0] : (low[0] + high[0]) / 2;
    meds.push(String(m));
    const where = !low.length || lt === undefined ? `${x} is the first number, so it goes into the low half.` : `${x} ${side === "low" ? `is at most ${lt}, the top of the low half` : `is above ${lt}, the top of the low half`}, so it goes into the ${side} heap.`;
    const fix = moved ? ` That makes the halves uneven, so the top of one moves across to the ${moved} heap.` : "";
    steps.push({ note: `${where}${fix} Median: ${low.length > high.length ? `the low top, ${m}` : `(${low[0]} + ${high[0]}) / 2 = ${m}`}.`, tone: moved ? "warn" : undefined, tables: tables(i, moved) });
  });
  steps.push({ note: `After ${n} numbers the median is ${meds.at(-1)}, read from the two tops in O(1). Each insert costs O(log n), and the low half never has more than one extra.`, tone: "ok", tables: tables(n - 1, "") });
  return { kind: "grid", title: `Running median of ${n} numbers`, steps };
}

/* ---------- intervals ---------- */
function overlap(v: Record<string, number>): Flow {
  const as = v.as, ae = v.as + v.al, bs = v.bs, be = v.bs + v.bl, T = 9;
  const row = (s: number, e: number, c: string) => Array.from({ length: T }, (_, t) => (t >= s && t < e ? c : ""));
  const lo = Math.max(as, bs), hi = Math.min(ae, be), t1 = as < be, t2 = bs < ae, hit = lo < hi;
  const tbl = (both: boolean, tones: Tones): GridTable[] => [{ label: "time, one cell per unit", head: idx(T), rowHead: ["A", "B", "both"], rows: [row(as, ae, "A"), row(bs, be, "B"), both ? row(lo, hi, "AB") : row(0, 0, "")], tones }];
  const cols = (r: number, s: number, e: number, tone: FlowTone) => Object.fromEntries(Array.from({ length: Math.max(0, e - s) }, (_, j) => [`${r}:${s + j}`, tone]));
  return { kind: "grid", title: `Do [${as}, ${ae}) and [${bs}, ${be}) overlap?`, steps: [
    { note: `A runs from ${as} to ${ae} and B from ${bs} to ${be}. Each runs up to its end but not including it, like a meeting that frees its room at the end time.`, tables: tbl(false, { ...cols(0, as, ae, "hot"), ...cols(1, bs, be, "hot") }) },
    { note: `First test: does A start before B ends? ${as} < ${be} is ${t1 ? "true" : "false"}.${t1 ? "" : " A starts after B is over, so they cannot overlap."}`, tone: t1 ? "ok" : "bad", tables: tbl(false, { [`0:${Math.min(as, T - 1)}`]: t1 ? "ok" : "bad", ...(be - 1 >= 0 && be - 1 < T ? { [`1:${be - 1}`]: t1 ? "ok" : "bad" } : {}) }) },
    { note: `Second test: does B start before A ends? ${bs} < ${ae} is ${t2 ? "true" : "false"}.${t2 ? "" : " B starts after A is over, so they cannot overlap."}`, tone: t2 ? "ok" : "bad", tables: tbl(false, { [`1:${Math.min(bs, T - 1)}`]: t2 ? "ok" : "bad", [`0:${ae - 1}`]: t2 ? "ok" : "bad" }) },
    hit
      ? { note: `Both tests pass, so they overlap on [max(${as}, ${bs}), min(${ae}, ${be})) = [${lo}, ${hi}), ${plural(hi - lo, "unit")} long.`, tone: "ok", tables: tbl(true, cols(2, lo, hi, "ok")) }
      : { note: lo === hi ? `They only touch at ${lo}. With ends excluded that is no clash, so one room is enough. Merge intervals usually counts touching as overlapping: check which the problem means.` : `A test failed, so there is no overlap: a gap of ${plural(lo - hi, "unit")} lies between them.`, tone: lo === hi ? "warn" : "bad", tables: tbl(false, {}) },
    { note: `Both tests in one line: they overlap exactly when max(start) < min(end), here ${lo} < ${hi} is ${hit}. After sorting by start, a sweep only needs this test between neighbours.`, tone: "ok", tables: tbl(hit, hit ? cols(2, lo, hi, "ok") : {}) },
  ] };
}

const MERGE_BASE: [number, number][] = [[6, 8], [1, 3], [11, 13], [2, 5], [9, 10], [4, 6], [14, 16]];
function merge(v: Record<string, number>): Flow {
  const { n, e } = v, given = MERGE_BASE.slice(0, n).map(([s, t]) => [s, t + e] as [number, number]);
  const sorted = [...given].sort((x, y) => x[0] - y[0]), out: [number, number][] = [];
  const t = (ivs: [number, number][], label: string, tones: Tones = {}): GridTable => ({ label, rowHead: ["start", "end"], rows: [pad(ivs.map((x) => x[0]), n), pad(ivs.map((x) => x[1]), n)], tones });
  const steps: GridStep[] = [
    { note: `${n} intervals${e ? `, each ${plural(e, "unit")} longer than the base example` : ""}. In this order an overlap could be anywhere in the list.`, tables: [t(given, "given"), t([], "merged")] },
    { note: "Sort by start. Now anything that overlaps the current group must come right after it, so one pass is enough.", tone: "hot", tables: [t(sorted, "sorted by start", { "0": "hot" }), t([], "merged")] },
  ];
  sorted.forEach(([a, b], i) => {
    const top = out.at(-1);
    let note: string, tone: FlowTone;
    if (top && a <= top[1]) { const old = top[1]; top[1] = Math.max(old, b); tone = "warn"; note = `${a} is at most ${old}, the end of the last merged interval, so they overlap. ${b > old ? `Extend its end to ${b}.` : `${b} is inside it already, so nothing changes.`}`; }
    else { out.push([a, b]); tone = "hot"; note = top ? `${a} is past ${top[1]}, the last end, so nothing overlaps. Start a new interval.` : `The first interval [${a}, ${b}] starts the result.`; }
    steps.push({ note, tables: [t(sorted, "sorted by start", { [`:${i}`]: "hot" }), t(out.map((x) => [...x] as [number, number]), "merged", { [`:${out.length - 1}`]: tone })] });
  });
  const last = steps.at(-1)!;
  last.note += ` Done: ${plural(out.length, "interval")} from ${n}. The sort costs O(n log n) and the pass O(n).`;
  last.tone = "ok";
  return { kind: "grid", title: `Merging ${n} intervals`, steps };
}

const MEETS: [string, number, number][] = [["A", 1, 4], ["B", 2, 5], ["C", 4, 7], ["D", 5, 8], ["E", 2, 4], ["F", 7, 9]];
function sweep(v: Record<string, number>): Flow {
  const ms = MEETS.slice(0, v.n), times = [...new Set(ms.flatMap(([, s, e]) => [s, e]))].sort((a, b) => a - b);
  const starts = times.map((t) => ms.filter((m) => m[1] === t).map((m) => m[0]).join("")), ends = times.map((t) => ms.filter((m) => m[2] === t).map((m) => m[0]).join(""));
  const used: number[] = [];
  let cur = 0;
  // at one time, ends are counted before starts, so a room freed at 4 can take a meeting starting at 4
  times.forEach((_, i) => { cur += starts[i].length - ends[i].length; used.push(cur); });
  const best = Math.max(...used), peak = used.indexOf(best);
  const tbl = (k: number, tones: Tones): GridTable[] => [{ label: "events by time", head: times.map(String), rowHead: ["starts", "ends", "in use"], rows: [starts, ends, pad(used.slice(0, k + 1), times.length)], tones }];
  return { kind: "grid", title: `Fewest rooms for ${v.n} meetings`, steps: [
    { note: `Meetings ${ms.map(([m, s, e]) => `${m} ${s} to ${e}`).join(", ")}. Each start is +1 room and each end is -1. Sort the events by time.`, tables: tbl(-1, {}) },
    ...times.map((t, i): GridStep => {
      const e = ends[i], s = starts[i], both = e && s;
      return { note: `At ${t}: ${e ? `${list([...e])} end${e.length > 1 ? "" : "s"}` : ""}${both ? " first, then " : ""}${s ? `${list([...s])} start${s.length > 1 ? "" : "s"}` : ""}.${both ? " Ending first lets a freed room be reused at once." : ""} ${used[i]} in use${i === peak ? ", the most so far" : ""}.`,
        tone: s ? "hot" : "ok", tables: tbl(i, { [`:${i}`]: s ? "hot" : "ok" }) };
    }),
    { note: `The answer is the peak of the running count: ${plural(best, "room")}, first reached at ${times[peak]}. Sorting is O(n log n) and the sweep O(n).`, tone: "ok", tables: tbl(times.length, { [`2:${peak}`]: "ok" }) },
  ] };
}

/* ---------- greedy ---------- */
const COIN_SETS = [[25, 10, 5, 1], [4, 3, 1], [10, 6, 1]];
function coins(v: Record<string, number>): Flow {
  const amt = v.amt, set = COIN_SETS[v.set - 1];
  let left = amt;
  const g = set.map((c) => { const k = Math.floor(left / c); left -= k * c; return [c, k, left]; });
  const gTotal = g.reduce((s, r) => s + r[1], 0);
  // exact answer by DP over amounts, remembering the last coin of each best answer
  const dp = [0], last = [0];
  for (let i = 1; i <= amt; i++) { dp[i] = Number.MAX_SAFE_INTEGER; for (const c of set) if (c <= i && dp[i - c] + 1 < dp[i]) { dp[i] = dp[i - c] + 1; last[i] = c; } }
  const best: number[] = [];
  for (let i = amt; i > 0; i -= last[i]) best.push(last[i]);
  const tbl = (k: number, tones: Tones): GridTable[] => [{ label: `pay ${amt}, greedy`, head: ["coin", "taken", "left"], rows: g.map((r, i) => (i <= k ? r : [r[0], "", ""])), tones }];
  const steps: GridStep[] = [{ note: `Pay ${amt} with as few coins as possible from ${list(set)}. The greedy rule: always take the largest coin that still fits.`, tables: tbl(-1, {}) }];
  g.forEach((r, k) => steps.push({ note: r[1] ? `Take ${plural(r[1], `coin`)} of ${r[0]}: ${k ? g[k - 1][2] : amt} - ${r[0] * r[1]} leaves ${r[2]}.` : `${r[0]} does not fit into ${k ? g[k - 1][2] : amt}, so take none and move on.`, tone: r[1] ? "hot" : undefined, tables: tbl(k, { [`${k}`]: "hot" }) }));
  const same = gTotal === dp[amt];
  steps.push({ note: same ? `Greedy used ${plural(gTotal, "coin")}, and the exact DP answer is also ${dp[amt]}. Here the largest coin was a safe choice.` : `Greedy used ${gTotal} coins, but ${best.join(" + ")} needs only ${dp[amt]}. Taking the largest coin first locked the better answer out.`,
    tone: same ? "ok" : "bad", tables: [...tbl(g.length, { ":1": same ? "ok" : "bad" }), { label: "compare", head: ["method", "coins"], rows: [["greedy", gTotal], ["DP", dp[amt]]], tones: { "1": "ok", ...(same ? {} : { "0": "bad" }) } }] });
  return { kind: "grid", title: `Pay ${amt} with coins ${set.join(", ")}`, steps };
}

const JUMPS = [2, 3, 1, 1, 4, 2, 1, 3, 1];
function jump(v: Record<string, number>): Flow {
  const { n, z } = v;
  if (z > n - 1) throw new PlayError(`Index ${z} is past the end of an array of length ${n}. Pick a smaller index, or 0 for no zero.`);
  const a = JUMPS.slice(0, n);
  if (z) a[z] = 0;
  const reach: (number | string)[] = Array(n).fill("");
  const tbl = (far: number, tones: Tones): GridTable[] => [{ label: `farthest reachable: ${far}`, head: idx(n), rowHead: ["jump", "i + jump"], rows: [a, reach], tones: { ...Object.fromEntries(a.map((_, j) => [`0:${j}`, j <= far ? "ok" : undefined]).filter((e) => e[1])), ...tones } }];
  const steps: GridStep[] = [{ note: `Each value is the longest jump from that index. Can you get from index 0 to index ${n - 1}? Track the farthest index reachable so far.`, tables: tbl(0, {}) }];
  let far = 0, ok = false;
  for (let i = 0; i < n; i++) {
    if (i > far) { steps.push({ note: `Index ${i} is past ${far}, the farthest reachable index. You can never stand here, so index ${n - 1} cannot be reached.`, tone: "bad", tables: tbl(far, { [`0:${i}`]: "bad" }) }); break; }
    const was = far;
    reach[i] = i + a[i]; far = Math.max(far, i + a[i]);
    ok = far >= n - 1;
    steps.push({ note: `${a[i] ? `From ${i} a jump of up to ${a[i]} reaches ${i + a[i]}.` : `A 0 at index ${i} adds nothing.`} ${far > was ? `The farthest grows to ${far}.` : `The farthest stays ${far}.`}${ok ? ` That covers the last index, ${n - 1}, so stop early: it is reachable.` : ""}`, tone: ok ? "ok" : "hot", tables: tbl(far, { [`1:${i}`]: "hot" }) });
    if (ok) break;
  }
  steps.push({ note: ok ? `Reachable. One pass that only remembers the farthest index: O(n) time, O(1) space, no need to try every jump.` : `Not reachable. The zero traps every path before index ${far + 1}, and one pass proved it in O(n).`, tone: ok ? "ok" : "bad", tables: tbl(far, {}) });
  return { kind: "grid", title: `Jump game on ${n} cells${z ? `, a 0 at index ${z}` : ""}`, steps };
}

const ACTS: [string, number, number][] = [["A", 1, 4], ["B", 3, 5], ["C", 0, 6], ["D", 5, 7], ["E", 3, 9], ["F", 5, 9], ["G", 6, 10], ["H", 8, 11]];
const RULES = ["earliest end", "earliest start", "shortest first"];
const keyOf = (r: number) => (x: [string, number, number]) => (r === 0 ? x[2] : r === 1 ? x[1] : x[2] - x[1]);
function pick(acts: [string, number, number][], r: number) {
  const s = [...acts].sort((x, y) => keyOf(r)(x) - keyOf(r)(y) || x[0].localeCompare(y[0])), take: boolean[] = [], kept: [string, number, number][] = [];
  // a task fits when it overlaps none of the kept ones (for earliest end, checking the last kept end is enough)
  for (const x of s) { const ok = kept.every(([, a, b]) => x[2] <= a || x[1] >= b); take.push(ok); if (ok) kept.push(x); }
  return { s, take, kept };
}
function schedule(v: Record<string, number>): Flow {
  const n = v.n, r = v.rule - 1, acts = ACTS.slice(0, n), { s, take, kept } = pick(acts, r), best = pick(acts, 0).kept.length;
  const tbl = (k: number, tones: Tones): GridTable[] => [{ label: `sorted by ${RULES[r]}`, head: s.map((x) => x[0]), rowHead: ["start", "end", "take"], rows: [s.map((x) => x[1]), s.map((x) => x[2]), s.map((_, i) => (i <= k ? (take[i] ? "yes" : "no") : ""))], tones }];
  const steps: GridStep[] = [{ note: `Fit as many of ${plural(n, "task")} into one room as possible. Rule: ${RULES[r]}. Sort by it, then keep each task that clashes with nothing kept.`, tables: tbl(-1, r === 0 ? { "1": "hot" } : r === 1 ? { "0": "hot" } : {}) }];
  const sofar: string[] = [];
  s.forEach(([m, a, b], i) => {
    if (take[i]) sofar.push(m);
    const clash = kept.find(([km, ka, kb]) => sofar.includes(km) && km !== m && !(b <= ka || a >= kb));
    steps.push({ note: take[i] ? `${m} runs ${a} to ${b} and clashes with nothing kept, so take it. Kept: ${list(sofar)}.` : `${m} runs ${a} to ${b} and clashes with ${clash ? clash[0] : "a kept task"}, so skip it.`, tone: take[i] ? "ok" : "bad", tables: tbl(i, { [`:${i}`]: take[i] ? "ok" : "bad" }) });
  });
  steps.push({ note: `${RULES[r][0].toUpperCase()}${RULES[r].slice(1)} kept ${kept.length}: ${list(kept.map((x) => x[0]))}.${r ? ` Earliest end keeps ${best}${best > kept.length ? ", more" : ", the same here, but this rule has inputs where it loses"}.` : " Finishing first always leaves the most room for the rest, so this is optimal. O(n log n) for the sort."}`,
    tone: kept.length === best ? "ok" : "warn", tables: tbl(n, { "2": "ok" }) });
  return { kind: "grid", title: `${plural(n, "task")}, ${RULES[r]}`, steps };
}

/* ---------- trie ---------- */
type Trie = { kids: Map<string, Trie>; end: number; pass: number };
const node = (): Trie => ({ kids: new Map(), end: 0, pass: 0 });
function tinsert(root: Trie, w: string) {
  const fresh: boolean[] = [];
  let n = root;
  for (const ch of w) { if (!n.kids.has(ch)) { n.kids.set(ch, node()); fresh.push(true); } else fresh.push(false); n = n.kids.get(ch)!; n.pass++; }
  n.end++;
  return fresh;
}
const below = (n: Trie, pre: string): string[] => [...(n.end ? [pre] : []), ...[...n.kids].flatMap(([c, k]) => below(k, pre + c))];
const WORDS = ["tea", "ten", "to", "team", "in", "inn", "ted"];

function trieBuild(v: Record<string, number>): Flow {
  const n = v.n, root = node(), levels: string[][] = [[], [], [], []];
  const tables = (path: string[], fresh: boolean[]): GridTable[] => [{ label: "nodes by depth, as prefixes", rowHead: ["depth 1", "depth 2", "depth 3", "depth 4"], rows: levels.map((l) => pad(l, 4)),
    tones: Object.fromEntries(path.map((p, i) => [`${i}:${levels[i].indexOf(p)}`, fresh[i] ? "hot" : "ok"])) }];
  const steps: GridStep[] = [{ note: "A trie starts as an empty root. A node at depth d stands for a prefix of d letters, shown here by the prefix it spells.", tables: tables([], []) }];
  let nodes = 0;
  for (const w of WORDS.slice(0, n)) {
    const fresh = tinsert(root, w), path = [...w].map((_, i) => w.slice(0, i + 1)), made = fresh.filter(Boolean).length, shared = fresh.indexOf(true) < 0 ? w.length : fresh.indexOf(true);
    path.forEach((p, i) => { if (fresh[i]) levels[i].push(p); });
    nodes += made;
    steps.push({ note: `Insert "${w}": ${shared ? `walk the existing ${w.slice(0, shared)}${made ? `, then create ${plural(made, "new node")}` : ", and create nothing"}` : `no node matches its first letter, so create ${plural(made, "new node")}`}. Mark its last node as a word end. Nodes: ${nodes}.`, tone: made ? "hot" : "ok", tables: tables(path, fresh) });
  }
  const letters = WORDS.slice(0, n).join("").length;
  steps.push({ note: `${plural(n, "word")} with ${letters} letters need only ${nodes} nodes besides the root, because shared prefixes are stored once. Each insert is O(length of the word).`, tone: "ok", tables: tables([], []) });
  return { kind: "grid", title: `A trie of ${plural(n, "word")}`, steps };
}

const QUERIES = ["team", "tent", "inks", "ants"];
function trieSearch(v: Record<string, number>): Flow {
  const q = QUERIES[v.word - 1].slice(0, v.len), root = node();
  WORDS.forEach((w) => tinsert(root, w));
  const child: string[] = [], end: string[] = [];
  const tbl = (k: number, tones: Tones, under?: string[]): GridTable[] => [
    { label: `walk "${q}" from the root`, head: [...q], rowHead: ["child", "word end"], rows: [pad(child, q.length), pad(end, q.length)], tones: k >= 0 ? { [`:${k}`]: tones.k ?? "hot" } : {} },
    ...(under ? [{ label: `words below "${q}"`, head: under.map((_, i) => String(i + 1)), rows: [under], tones: { "0": "ok" as FlowTone } }] : []),
  ];
  const steps: GridStep[] = [{ note: `The trie holds ${list(WORDS)}. Look up "${q}": follow one child per letter, starting at the root.`, tables: tbl(-1, {}) }];
  let n: Trie | undefined = root, at = -1;
  for (let i = 0; i < q.length && n; i++) {
    n = n.kids.get(q[i]);
    child.push(n ? "yes" : "no"); end.push(n ? (n.end ? "yes" : "no") : "");
    at = i;
    const at0 = i ? `"${q.slice(0, i)}"` : "The root";
    steps.push({ note: n ? `${at0} has a child ${q[i]}: follow it.${n.end ? ` A word ends here, "${q.slice(0, i + 1)}".` : ""}` : `${at0} has no child ${q[i]}. No stored word starts with "${q.slice(0, i + 1)}", so stop now.`, tone: n ? "hot" : "bad", tables: tbl(i, { k: n ? "hot" : "bad" }) });
  }
  const found = !!n;
  steps.push({ note: found ? `search("${q}") is ${n!.end ? "true" : "false"}: ${n!.end ? "the last node is marked as a word end" : "the path exists but no word ends there"}. startsWith("${q}") is true.` : `Both search("${q}") and startsWith("${q}") are false: the path broke off.`, tone: found ? "ok" : "bad", tables: tbl(at, { k: found ? "ok" : "bad" }) });
  if (found) { const u = below(n!, q); steps.push({ note: `To list every word with the prefix, walk the subtree below: ${list(u)}.`, tone: "ok", tables: tbl(at, { k: "ok" }, u) }); }
  steps.push({ note: `The lookup took ${plural(at + 1, "step")}, one per letter: O(L), however many words are stored.`, tone: "ok", tables: tbl(-1, {}) });
  return { kind: "grid", title: `Looking up "${q}" in a trie`, steps };
}

const COUNT_PREFIXES = ["t", "te", "tea", "in"];
function trieCount(v: Record<string, number>): Flow {
  const n = v.n, p = COUNT_PREFIXES[v.p - 1], root = node(), path = [...p].map((_, i) => p.slice(0, i + 1)), ws = WORDS.slice(0, n);
  const counts = () => { const pass: number[] = [], end: number[] = []; let t: Trie | undefined = root; for (const ch of p) { t = t?.kids.get(ch); pass.push(t?.pass ?? 0); end.push(t?.end ?? 0); } return [pass, end]; };
  const tables = (k: number, tones: Tones): GridTable[] => [
    { label: "words inserted", head: idx(n).map((i) => String(+i + 1)), rows: [pad(ws.slice(0, k), n)], tones: k ? { [`0:${k - 1}`]: "hot" } : {} },
    { label: `counts on the path of "${p}"`, head: path, rowHead: ["pass", "end"], rows: counts(), tones },
  ];
  const steps: GridStep[] = [{ note: `Every node stores pass, how many words go through it, and end, how many words stop there. Watch the nodes on the path of "${p}".`, tables: tables(0, {}) }];
  ws.forEach((w, i) => {
    tinsert(root, w);
    const hit = path.filter((x) => w.startsWith(x));
    steps.push({ note: `Insert "${w}": every node it walks gets pass + 1, and its last node gets end + 1. ${hit.length ? `On this path that is ${list(hit.map((x) => `"${x}"`))}.` : `It never enters "${p[0]}", so these counts stay.`}`, tone: hit.length ? "hot" : undefined,
      tables: tables(i + 1, Object.fromEntries(hit.map((x) => [`0:${x.length - 1}`, "hot"]).concat(w === p ? [[`1:${p.length - 1}`, "hot"]] : []))) });
  });
  const [pass, end] = counts();
  steps.push({ note: `countPrefix("${p}") reads pass at its node: ${plural(pass[p.length - 1], "word")}, in ${plural(p.length, "step")}, never scanning the list. countWord("${p}") reads end: ${end[p.length - 1]}.`, tone: "ok", tables: tables(n, { [`:${p.length - 1}`]: "ok" }) });
  return { kind: "grid", title: `Counting words that start with "${p}"`, steps };
}

/* ---------- graph ---------- */
const UND: [string, string][] = [["A", "B"], ["A", "D"], ["B", "C"], ["B", "E"], ["D", "E"], ["E", "F"], ["C", "F"], ["F", "G"]];
function bfs(v: Record<string, number>): Flow {
  const names = [..."ABCDEFG"], s = names[v.start - 1];
  const adj = (u: string) => UND.flatMap(([a, b]) => (a === u ? [b] : b === u ? [a] : [])).sort();
  const dist: Record<string, number> = { [s]: 0 };
  let layer = [s];
  const snaps: { layer: string[]; fresh: string[] }[] = [];
  while (layer.length) {
    const fresh: string[] = [];
    for (const u of layer) for (const w of adj(u)) if (!(w in dist)) { dist[w] = dist[u] + 1; fresh.push(w); }
    snaps.push({ layer, fresh });
    layer = fresh;
  }
  const wide = Math.max(...snaps.map((x) => x.fresh.length), 1);
  const tables = (d: Record<string, number>, hot: string[], ok: string[], q: string[]): GridTable[] => [
    { label: `distance from ${s}`, head: names, rows: [names.map((x) => d[x] ?? "")], tones: Object.fromEntries([...hot.map((x) => [`0:${names.indexOf(x)}`, "hot"]), ...ok.map((x) => [`0:${names.indexOf(x)}`, "ok"])]) },
    { label: "queue, front first", rows: [pad(q, wide)], tones: Object.fromEntries(q.map((_, i) => [`0:${i}`, "ok"])) },
  ];
  const shown: Record<string, number> = { [s]: 0 };
  const steps: GridStep[] = [{ note: `Edges ${UND.map(([a, b]) => a + b).join(" ")}. Start at ${s}: it is at distance 0 and is the only node in the queue.`, tables: tables(shown, [s], [], [s]) }];
  snaps.forEach(({ layer: l, fresh }, d) => {
    fresh.forEach((x) => (shown[x] = dist[x]));
    steps.push({ note: `Take layer ${d}, ${list(l)}, from the queue.${fresh.length ? ` Unseen neighbour${fresh.length > 1 ? "s" : ""} ${list(fresh)} get${fresh.length > 1 ? "" : "s"} distance ${d + 1} and join${fresh.length > 1 ? "" : "s"} the back.` : " No unseen neighbours are left, so the queue empties."}`, tone: fresh.length ? "hot" : "ok", tables: tables({ ...shown }, l, fresh, fresh) });
  });
  steps.push({ note: `Every node got the fewest edges from ${s}, the farthest being ${snaps.length - 1} away. Each node and edge is handled once: O(V + E).`, tone: "ok", tables: tables(shown, [], names, []) });
  return { kind: "grid", title: `BFS from ${s}, layer by layer`, steps };
}

function dijkstra(v: Record<string, number>): Flow {
  const names = [..."ABCDE"], src = names[v.src - 1];
  const edges: [string, string, number][] = [["A", "B", v.w], ["A", "C", 2], ["C", "B", 1], ["B", "D", 2], ["C", "D", 6], ["C", "E", 7], ["D", "E", 1]];
  const nb = (u: string) => edges.flatMap(([a, b, w]) => (a === u ? [[b, w]] : b === u ? [[a, w]] : []) as [string, number][]);
  const dist: Record<string, number> = { [src]: 0 }, from: Record<string, string> = {}, done: string[] = [];
  // heap entries are numbers dist * 10 + node index, so the heap compares distances first
  const heap = [names.indexOf(src)], cell = (e: number) => `${names[e % 10]}:${Math.floor(e / 10)}`;
  type Snap = { at: string; better: string[]; stale: number; d: Record<string, number>; f: Record<string, string>; heap: string[] };
  const snaps: Snap[] = [];
  while (heap.length) {
    let stale = 0, e = hpop(heap, minLess);
    while (done.includes(names[e % 10]) && heap.length) { stale++; e = hpop(heap, minLess); }
    const u = names[e % 10];
    if (done.includes(u)) break;
    done.push(u);
    const better: string[] = [];
    for (const [x, w] of nb(u)) if (!done.includes(x) && (dist[x] === undefined || dist[u] + w < dist[x])) { dist[x] = dist[u] + w; from[x] = u; better.push(x); hpush(heap, dist[x] * 10 + names.indexOf(x), minLess); }
    snaps.push({ at: u, better, stale, d: { ...dist }, f: { ...from }, heap: heap.map(cell) });
  }
  const wide = Math.max(...snaps.map((s) => s.heap.length), 1);
  const tables = (s: Snap | undefined, k: number): GridTable[] => {
    const d = s?.d ?? { [src]: 0 }, f = s?.f ?? {}, fin = done.slice(0, k + 1);
    return [{ head: names, rowHead: ["dist", "from"], rows: [names.map((x) => d[x] ?? "∞"), names.map((x) => f[x] ?? "-")],
      tones: Object.fromEntries([...fin.map((x) => [`:${names.indexOf(x)}`, "ok"]), ...(s?.better ?? []).map((x) => [`0:${names.indexOf(x)}`, "warn"]), [`:${names.indexOf(s?.at ?? src)}`, s && k === snaps.length ? "ok" : "hot"]]) },
    { label: "min-heap, node:dist", rows: [pad(s ? s.heap : [`${src}:0`], wide)] }];
  };
  const steps: GridStep[] = [{ note: `Edges ${edges.map(([a, b, w]) => `${a}${b}=${w}`).join(", ")}. Put ${src} in the heap at 0; every other distance is unknown.`, tables: tables(undefined, -1) }];
  snaps.forEach((s, k) => steps.push({ note: `${s.stale ? `Skip ${s.stale} stale ${s.stale > 1 ? "entries" : "entry"} for a node already settled. ` : ""}Pop ${s.at}:${s.d[s.at]}, the smallest, and settle ${s.at}.${s.better.length ? ` Through ${s.at}: ${s.better.map((x) => `${x} becomes ${s.d[x]}`).join(", ")}, pushed to the heap.` : " No neighbour gets shorter."}`,
    tone: "hot", tables: tables(s, k) }));
  const far = names.reduce((a, b) => (dist[b] > dist[a] ? b : a)), route = [far];
  while (route[0] !== src) route.unshift(from[route[0]]);
  const left = snaps.at(-1)!.heap.length;
  steps.push({ note: `All settled. Follow the from row back: the farthest node, ${far}, is reached by ${route.join(" to ")} at cost ${dist[far]}.${left ? ` The ${left} ${left > 1 ? "entries" : "entry"} left in the heap ${left > 1 ? "are" : "is"} stale and never used.` : ""} O((V + E) log V).`, tone: "ok", tables: tables(snaps.at(-1), snaps.length) });
  return { kind: "grid", title: `Dijkstra from ${src}, edge AB = ${v.w}`, steps };
}

const DAG: [string, string][] = [["A", "C"], ["B", "C"], ["B", "D"], ["C", "E"], ["D", "E"], ["E", "F"]];
const EXTRA: [string, string][] = [["A", "F"], ["F", "B"], ["D", "A"], ["E", "C"]];
function topo(v: Record<string, number>): Flow {
  const names = [..."ABCDEF"], extra = v.extra ? EXTRA[v.extra - 1] : undefined, edges = extra ? [...DAG, extra] : DAG;
  const indeg: Record<string, number> = Object.fromEntries(names.map((x) => [x, edges.filter((e) => e[1] === x).length]));
  const q = names.filter((x) => !indeg[x]), order: string[] = [];
  const tables = (hot: string, fresh: string[], bad: string[] = []): GridTable[] => [
    { label: "remaining in-degree", head: names, rows: [names.map((x) => (order.includes(x) ? "done" : indeg[x]))], tones: Object.fromEntries([...order.map((x) => [`0:${names.indexOf(x)}`, "ok"]), ...fresh.map((x) => [`0:${names.indexOf(x)}`, "warn"]), ...bad.map((x) => [`0:${names.indexOf(x)}`, "bad"]), ...(hot ? [[`0:${names.indexOf(hot)}`, "hot"]] : [])]) },
    { label: "queue, front first", rows: [pad(q, 3)] },
    { label: "order", head: idx(6).map((i) => String(+i + 1)), rows: [pad(order, 6)] },
  ];
  const steps: GridStep[] = [
    { note: `Edges ${edges.map(([a, b]) => `${a}>${b}`).join(", ")}${extra ? `, with the extra ${extra[0]}>${extra[1]}` : ""}. Count each node's in-degree: how many arrows point at it.`, tables: tables("", []) },
    { note: `${list(q)} ${q.length > 1 ? "have" : "has"} in-degree 0: no prerequisites, so ${q.length > 1 ? "they go" : "it goes"} into the queue.`, tone: "hot", tables: tables("", q) },
  ];
  while (q.length) {
    const u = q.shift()!, freed: string[] = [], dropped: string[] = [];
    order.push(u);
    for (const [a, b] of edges) if (a === u) { indeg[b]--; dropped.push(b); if (!indeg[b]) { freed.push(b); q.push(b); } }
    steps.push({ note: `Take ${u} and add it to the order.${dropped.length ? ` Its arrows to ${list(dropped)} are removed.` : " It has no outgoing arrows."}${freed.length ? ` ${list(freed)} now ${freed.length > 1 ? "have" : "has"} in-degree 0 and join${freed.length > 1 ? "" : "s"} the queue.` : ""}`, tables: tables(u, freed) });
  }
  const left = names.filter((x) => !order.includes(x));
  steps.push(left.length
    ? { note: `The queue is empty but ${list(left)} never reached in-degree 0: they wait on each other in a cycle, so no order exists. Kahn's algorithm detects this by count.`, tone: "bad", tables: tables("", [], left) }
    : { note: `All 6 nodes placed: ${order.join(", ")}. Every arrow points forward in this order. O(V + E).`, tone: "ok", tables: tables("", []) });
  return { kind: "grid", title: extra ? `Topological sort, plus ${extra[0]}>${extra[1]}` : "Topological sort of a DAG", steps };
}

/* ---------- dp ---------- */
function stairs(v: Record<string, number>): Flow {
  const { n, k } = v, dp = [1], head = idx(n + 1), row = (i: number) => dp.concat(Array(n - i).fill("?")).slice(0, n + 1);
  for (let i = 1; i <= n; i++) dp[i] = Array.from({ length: k }, (_, j) => dp[i - 1 - j] ?? 0).reduce((s, x) => s + x, 0);
  const steps: GridStep[] = [{ note: `dp[i] = the number of ways to climb i stairs taking 1${k === 3 ? ", 2 or 3" : " or 2"} at a time. dp[0] = 1: one way to climb nothing, stand still.`, tables: [{ label: "dp", head, rows: [row(0)], tones: { "0:0": "ok" } }] }];
  for (let i = 1; i <= n; i++) {
    const from = Array.from({ length: k }, (_, j) => i - 1 - j).filter((x) => x >= 0);
    steps.push({ note: `dp[${i}] = ${from.map((x) => `dp[${x}]`).join(" + ")}${from.length > 1 ? ` = ${from.map((x) => dp[x]).join(" + ")}` : ""} = ${dp[i]}. The last move onto stair ${i} was ${from.length > 1 ? `${from.map((x) => i - x).join(" or ")} stairs, one term each` : "a single stair"}.`,
      tables: [{ label: "dp", head, rows: [row(i)], tones: { [`0:${i}`]: "hot", ...Object.fromEntries(from.map((x) => [`0:${x}`, "warn"])) } }] });
  }
  steps.push({ note: `${dp[n]} ways to climb ${n} stairs. One pass is O(n), and only the last ${k} cells are ever read, so ${k} variables would do instead of a table.`, tone: "ok", tables: [{ label: "dp", head, rows: [row(n)], tones: { [`0:${n}`]: "ok" } }] });
  return { kind: "grid", title: `Climbing ${n} stairs, up to ${k} at a time`, steps };
}

function robber(v: Record<string, number>): Flow {
  const n = v.n, a = ARR.slice(0, n), dp: number[] = [];
  const tbl = (k: number, tones: Tones): GridTable[] => [{ label: "houses in a row", head: idx(n), rowHead: ["money", "best"], rows: [a, pad(dp.slice(0, k + 1), n)], tones }];
  const steps: GridStep[] = [{ note: `Rob houses with ${list(a)}, never two neighbours. best[i] = the most from houses 0 to i: skip house i and keep best[i - 1], or rob it and add best[i - 2].`, tables: tbl(-1, {}) }];
  for (let i = 0; i < n; i++) {
    const skip = dp[i - 1] ?? 0, rob = (dp[i - 2] ?? 0) + a[i];
    dp[i] = Math.max(skip, rob);
    steps.push({ note: `House ${i}: skip it and keep ${skip}, or rob it for ${dp[i - 2] ?? 0} + ${a[i]} = ${rob}. Take ${dp[i]}${rob > skip ? ", robbing it" : ", skipping it"}.`, tone: rob > skip ? "hot" : undefined,
      tables: tbl(i, { [`1:${i}`]: "hot", ...(i > 0 ? { [`1:${i - 1}`]: "warn" } : {}), ...(i > 1 ? { [`1:${i - 2}`]: "warn" } : {}) }) });
  }
  const robbed: number[] = [];
  for (let i = n - 1; i >= 0;) if (i === 0 || dp[i] !== dp[i - 1]) { robbed.unshift(i); i -= 2; } else i--;
  steps.push({ note: `The answer is ${dp[n - 1]}: rob houses ${list(robbed)}, worth ${list(robbed.map((i) => a[i]))}. One pass, O(n), and two numbers would do instead of the table.`, tone: "ok",
    tables: tbl(n, { [`1:${n - 1}`]: "ok", ...Object.fromEntries(robbed.map((i) => [`0:${i}`, "ok"])) }) });
  return { kind: "grid", title: `House robber on ${plural(n, "house")}`, steps };
}

const ITEMS: [number, number][] = [[1, 1], [3, 4], [4, 5], [5, 7]];
function knapsack(v: Record<string, number>): Flow {
  const C = v.cap, head = idx(C + 1), dp = Array(C + 1).fill(0), rows: number[][] = [[...dp]], rowHead = ["none", ...ITEMS.map(([w, val]) => `w${w} v${val}`)];
  const tbl = (k: number, tones: Tones): GridTable[] => [{ label: "best value at each capacity", head, rowHead: rowHead.slice(0, k + 1), rows: rows.slice(0, k + 1), tones }];
  const steps: GridStep[] = [{ note: `Items as weight and value: ${ITEMS.map(([w, val]) => `${w} and ${val}`).join("; ")}. Capacity ${C}. dp[c] = the best value within weight c, all 0 with no items.`, tables: tbl(0, {}) }];
  ITEMS.forEach(([w, val], i) => {
    const changed: number[] = [];
    for (let c = C; c >= w; c--) if (dp[c - w] + val > dp[c]) { dp[c] = dp[c - w] + val; changed.push(c); }
    rows.push([...dp]);
    steps.push({ note: w > C ? `Weight ${w} is over the capacity ${C}, so this item changes nothing.` : `Item ${i + 1}: for c from ${C} down to ${w}, dp[c] = max(dp[c], dp[c - ${w}] + ${val}). Going down means each cell reads the row before this item, so it is used once.${changed.length ? ` ${plural(changed.length, "cell")} improved.` : " Nothing improved."}`,
      tone: changed.length ? "hot" : undefined, tables: tbl(i + 1, Object.fromEntries(changed.map((c) => [`${i + 1}:${c}`, "hot"]))) });
  });
  const took: number[] = [];
  for (let i = ITEMS.length, c = C; i > 0; i--) if (rows[i][c] !== rows[i - 1][c]) { took.unshift(i); c -= ITEMS[i - 1][0]; }
  steps.push({ note: `The answer is dp[${C}] = ${dp[C]}${took.length ? `, from item${took.length > 1 ? "s" : ""} ${list(took)}: where a cell changed between rows, that item was taken` : ": nothing fits"}. O(n x C) time and one row of memory.`, tone: "ok",
    tables: tbl(ITEMS.length, { [`${ITEMS.length}:${C}`]: "ok" }) });
  return { kind: "grid", title: `0/1 knapsack, capacity ${C}`, steps };
}

export const PLAY: Record<string, PlayFlow> = {
  "pp-binary-tree-search": { title: "Search a binary search tree", knobs: [{ key: "x", label: "value to find", min: 5, max: 95, step: 5, value: 45 }], make: bstSearch },
  "pp-binary-tree-traversal": { title: "Tree traversals", knobs: [{ key: "n", label: "nodes in the tree", min: 3, max: 8, value: 7 }, { key: "order", label: "order: 1 pre, 2 in, 3 post, 4 level", min: 1, max: 4, value: 2 }], make: traversal },
  "pp-binary-tree-kth": { title: "K-th smallest in a BST", knobs: [{ key: "k", label: "k", min: 1, max: 7, value: 3 }], make: kthSmallest },
  "pp-heap-push": { title: "Push into a min-heap", knobs: [{ key: "x", label: "value to push", min: 0, max: 20, value: 2 }, { key: "size", label: "heap size before", min: 1, max: 8, value: 7 }], make: heapPush },
  "pp-heap-topk": { title: "Top K with a min-heap", knobs: [{ key: "k", label: "k", min: 1, max: 5, value: 3 }, { key: "n", label: "numbers in the stream", min: 4, max: 9, value: 9 }], make: topK },
  "pp-heap-median": { title: "Running median with two heaps", knobs: [{ key: "n", label: "numbers arrived", min: 3, max: 9, value: 6 }], make: median },
  "pp-intervals-overlap": { title: "Do two intervals overlap?", knobs: [{ key: "as", label: "A starts at", min: 0, max: 5, value: 1 }, { key: "al", label: "A lasts", min: 1, max: 4, value: 3 }, { key: "bs", label: "B starts at", min: 0, max: 5, value: 3 }, { key: "bl", label: "B lasts", min: 1, max: 4, value: 4 }], make: overlap },
  "pp-intervals-merge": { title: "Merge intervals", knobs: [{ key: "n", label: "intervals", min: 3, max: 7, value: 6 }, { key: "e", label: "extra length on each", min: 0, max: 3, value: 0 }], make: merge },
  "pp-intervals-sweep": { title: "Fewest rooms with a sweep line", knobs: [{ key: "n", label: "meetings", min: 2, max: 6, value: 5 }], make: sweep },
  "pp-greedy-coins": { title: "Largest coin first", knobs: [{ key: "amt", label: "amount to pay", min: 1, max: 30, value: 12 }, { key: "set", label: "coin set (named in the title)", min: 1, max: 3, value: 3 }], make: coins },
  "pp-greedy-jump": { title: "Jump game", knobs: [{ key: "n", label: "array length", min: 4, max: 9, value: 7 }, { key: "z", label: "put a 0 at index (0 = none)", min: 0, max: 8, value: 4 }], make: jump },
  "pp-greedy-schedule": { title: "Interval scheduling", knobs: [{ key: "n", label: "tasks", min: 3, max: 8, value: 8 }, { key: "rule", label: "sort by: 1 end, 2 start, 3 length", min: 1, max: 3, value: 1 }], make: schedule },
  "pp-trie-build": { title: "Build a trie", knobs: [{ key: "n", label: "words inserted", min: 2, max: 7, value: 5 }], make: trieBuild },
  "pp-trie-search": { title: "Search a trie", knobs: [{ key: "word", label: "query word (in the title)", min: 1, max: 4, value: 1 }, { key: "len", label: "letters of it to search", min: 1, max: 4, value: 3 }], make: trieSearch },
  "pp-trie-count": { title: "Prefix counts in a trie", knobs: [{ key: "n", label: "words inserted", min: 2, max: 7, value: 7 }, { key: "p", label: "prefix: 1 t, 2 te, 3 tea, 4 in", min: 1, max: 4, value: 2 }], make: trieCount },
  "pp-graph-bfs": { title: "BFS layer by layer", knobs: [{ key: "start", label: "start node (1 = A)", min: 1, max: 7, value: 1 }], make: bfs },
  "pp-graph-dijkstra": { title: "Dijkstra with a heap", knobs: [{ key: "src", label: "source node (1 = A)", min: 1, max: 5, value: 1 }, { key: "w", label: "weight of edge AB", min: 1, max: 9, value: 5 }], make: dijkstra },
  "pp-graph-topo": { title: "Topological sort", knobs: [{ key: "extra", label: "extra edge (0 = none)", min: 0, max: 4, value: 0 }], make: topo },
  "pp-dp-stairs": { title: "Climbing stairs", knobs: [{ key: "n", label: "stairs", min: 3, max: 8, value: 6 }, { key: "k", label: "longest step", min: 2, max: 3, value: 2 }], make: stairs },
  "pp-dp-robber": { title: "House robber", knobs: [{ key: "n", label: "houses", min: 3, max: 8, value: 6 }], make: robber },
  "pp-dp-knapsack": { title: "0/1 knapsack", knobs: [{ key: "cap", label: "capacity", min: 1, max: 8, value: 7 }], make: knapsack },
};
/** "<topic>:0" (the topic's Overview) or "<topic>:<pattern n>" -> the interactive flow id shown there. */
export const PLACES: Record<string, string> = {
  "binary-tree:0": "pp-binary-tree-search", "binary-tree:1": "pp-binary-tree-traversal", "binary-tree:6": "pp-binary-tree-kth",
  "heap:0": "pp-heap-push", "heap:1": "pp-heap-topk", "heap:4": "pp-heap-median",
  "intervals:0": "pp-intervals-overlap", "intervals:1": "pp-intervals-merge", "intervals:2": "pp-intervals-sweep",
  "greedy:0": "pp-greedy-coins", "greedy:2": "pp-greedy-jump", "greedy:1": "pp-greedy-schedule",
  "trie:0": "pp-trie-build", "trie:1": "pp-trie-search", "trie:5": "pp-trie-count",
  "graph:0": "pp-graph-bfs", "graph:5": "pp-graph-dijkstra", "graph:3": "pp-graph-topo",
  "dp:0": "pp-dp-stairs", "dp:1": "pp-dp-robber", "dp:2": "pp-dp-knapsack",
};

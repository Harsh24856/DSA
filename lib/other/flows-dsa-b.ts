// Animated walk-throughs for the topic Overviews on /patterns (see flows-dsa.ts). Numbers come from real code below:
// each flow runs a small, plain implementation of the algorithm and records what it did.
import type { ChainStep, Flow, FlowTone, GridStep, GridTable } from "./flows.ts";

const list = (xs: (string | number)[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

/* ---------- binary tree ---------- */
type TNode = { v: number; l?: TNode; r?: TNode };
/** Inserts v into the BST and returns the nodes it compared against, with the way it went at each. */
function bstInsert(root: TNode | undefined, v: number): { root: TNode; path: [number, "left" | "right"][] } {
  const path: [number, "left" | "right"][] = [];
  if (!root) return { root: { v }, path };
  for (let cur = root; ;) {
    const dir = v < cur.v ? "left" : "right";
    path.push([cur.v, dir]);
    const next = dir === "left" ? cur.l : cur.r;
    if (!next) { if (dir === "left") cur.l = { v }; else cur.r = { v }; return { root, path }; }
    cur = next;
  }
}
const build = (keys: number[]) => keys.reduce<TNode | undefined>((t, k) => bstInsert(t, k).root, undefined)!;
const height = (t?: TNode): number => (t ? 1 + Math.max(height(t.l), height(t.r)) : 0);
const pre = (t?: TNode): number[] => (t ? [t.v, ...pre(t.l), ...pre(t.r)] : []);
const ino = (t?: TNode): number[] => (t ? [...ino(t.l), t.v, ...ino(t.r)] : []);
const post = (t?: TNode): number[] => (t ? [...post(t.l), ...post(t.r), t.v] : []);
function level(t: TNode): number[] {
  const q = [t], out: number[] = [];
  while (q.length) { const n = q.shift()!; out.push(n.v); if (n.l) q.push(n.l); if (n.r) q.push(n.r); }
  return out;
}

const KEYS = [50, 30, 70, 20, 40, 60, 80], NEW = 35;
const bstFlow = (): Flow => {
  const { path } = bstInsert(build(KEYS), NEW);
  const [parent, side] = path.at(-1)!;
  const sorted = [...KEYS].sort((a, b) => a - b);
  return { title: `Inserting ${NEW} into a binary search tree`, steps: [
    { node: `tree from ${KEYS.join(", ")}`, note: `Every key in a left subtree is smaller than its node and every key on the right is larger. Insert ${NEW}.` },
    ...path.map(([at, dir]): ChainStep => ({ node: `${at}: ${NEW} ${dir === "left" ? "<" : ">"} ${at}, go ${dir}`, tone: "hot",
      note: `${NEW} is ${dir === "left" ? "smaller" : "larger"} than ${at}, so it can only belong in the ${dir} subtree. The other side is never looked at.` })),
    { node: `${NEW} becomes the ${side} child of ${parent}`, tone: "ok", note: `${parent} has no ${side} child, so ${NEW} goes there as a new leaf. No other node moves.` },
    { node: `${path.length} comparisons, one per level`, tone: "warn",
      note: `Cost is the height: O(log n) when balanced. The same keys inserted in sorted order make a chain of height ${height(build(sorted))}, not ${height(build(KEYS))}.` },
  ] };
};

const traversalFlow = (): Flow => {
  const t = build(KEYS);
  const kids: GridTable = { label: "the tree", head: ["node", "left", "right"], rows: [] };
  for (const n of level(t)) { const x = (function find(m?: TNode): TNode | undefined { return !m ? m : m.v === n ? m : find(n < m.v ? m.l : m.r); })(t)!; if (x.l || x.r) kids.rows.push([n, x.l?.v ?? "-", x.r?.v ?? "-"]); }
  const orders: [string, number[], string][] = [
    ["pre", pre(t), "Preorder: the node, then its left subtree, then its right. The root comes first, so this order can rebuild or copy a tree."],
    ["in", ino(t), "Inorder: left subtree, node, right subtree. On a BST this gives the keys in sorted order."],
    ["post", post(t), "Postorder: both subtrees before the node. Children are finished first, which is what deleting a tree or computing heights needs."],
    ["level", level(t), "Level order: a queue visits the tree row by row from the top. This is BFS, and the only order here that is not recursive."],
  ];
  const step = (k: number): GridStep => ({ note: orders[k][2], tone: k === 1 ? "ok" : undefined,
    tables: [kids, { label: "visit order", rowHead: orders.slice(0, k + 1).map((o) => o[0]), rows: orders.slice(0, k + 1).map((o) => o[1]), tones: { [`${k}`]: "hot" } }] });
  return { kind: "grid", title: "Four ways to walk one tree", steps: [
    { note: `The same ${KEYS.length}-node tree. Leaves ${list(KEYS.filter((k) => !kids.rows.some((r) => r[0] === k)))} have no children. Each order visits every node once: O(n).`, tables: [kids] },
    ...orders.map((_, k) => step(k)),
  ] };
};

/* ---------- heap (min-heap in an array) ---------- */
type HeapSnap = { a: number[]; tones: Record<string, FlowTone>; note: string; tone?: FlowTone };
function heapPush(heap: number[], v: number, snaps?: HeapSnap[]) {
  const a = [...heap, v];
  let i = a.length - 1;
  snaps?.push({ a: [...a], tones: { [`0:${i}`]: "hot" }, note: `Append ${v} at the end, index ${i}. The shape stays a complete tree, but the order may now be broken.` });
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (a[p] <= a[i]) { snaps?.push({ a: [...a], tones: { [`0:${i}`]: "ok", [`0:${p}`]: "ok" }, note: `${a[p]} at index ${p} is not larger than ${a[i]}, so sifting stops.`, tone: "ok" }); return a; }
    [a[p], a[i]] = [a[i], a[p]];
    snaps?.push({ a: [...a], tones: { [`0:${p}`]: "hot", [`0:${i}`]: "warn" }, note: `Its parent is at (${i} - 1) / 2 = ${p} and holds ${a[i]}, which is larger. Swap them: ${v} moves up one level.` });
    i = p;
  }
  return a;
}
const PUSHED = [5, 9, 3, 6, 8, 12, 10], ADD = 2;
const pushFlow = (): Flow => {
  const heap = PUSHED.reduce<number[]>((h, v) => heapPush(h, v), []);
  const snaps: HeapSnap[] = [];
  const out = heapPush(heap, ADD, snaps);
  const swaps = snaps.filter((s) => s.note.includes("Swap")).length, head = out.map((_, i) => String(i));
  const pad = (a: number[]) => [...a, ...Array(out.length - a.length).fill("")];
  return { kind: "grid", title: `Pushing ${ADD} into a min-heap`, steps: [
    { note: "A min-heap stored as an array. The children of index i sit at 2i + 1 and 2i + 2, so no pointers are needed. Every parent is at most its children.", tables: [{ label: "heap array", head, rows: [pad(heap)] }] },
    ...snaps.map((s): GridStep => ({ note: s.note, tone: s.tone, tables: [{ label: "heap array", head, rows: [s.a], tones: s.tones }] })),
    { note: `${ADD} reached the root after ${swaps} swaps. A push climbs at most the height of the tree, log2 of n, so it is O(log n).`, tone: "ok", tables: [{ label: "heap array", head, rows: [out], tones: { "0:0": "ok" } }] },
  ] };
};

function siftDown(a: number[], i: number) {
  const moved = [i];
  for (;;) {
    const l = 2 * i + 1, r = l + 1;
    let m = i;
    if (l < a.length && a[l] < a[m]) m = l;
    if (r < a.length && a[r] < a[m]) m = r;
    if (m === i) return moved;
    [a[i], a[m]] = [a[m], a[i]];
    i = m; moved.push(i);
  }
}
const RAW = [9, 4, 7, 1, 8, 2, 3, 6, 5];
const heapifyFlow = (): Flow => {
  const a = [...RAW], head = a.map((_, i) => String(i)), last = (a.length >> 1) - 1;
  const steps: GridStep[] = [{ note: `Turn this array into a min-heap in place. Indices ${last + 1} to ${a.length - 1} are leaves, already heaps of one, so start at the last parent, index ${last}.`, tables: [{ label: "array", head, rows: [[...a]] }] }];
  for (let i = last; i >= 0; i--) {
    const v = a[i], path = siftDown(a, i);
    steps.push({ note: path.length > 1 ? `Sift ${v} down from index ${i}: it swaps with its smaller child ${path.length === 2 ? "once" : `${path.length - 1} times`}, ending at index ${path.at(-1)}.` : `${v} at index ${i} is already smaller than its children ${list([2 * i + 1, 2 * i + 2].filter((c) => c < a.length).map((c) => a[c]))}. Nothing moves.`,
      tone: i === 0 ? "ok" : undefined, tables: [{ label: "array", head, rows: [[...a]], tones: Object.fromEntries(path.map((p, k) => [`0:${p}`, k === 0 ? "hot" : "warn"])) }] });
  }
  // Why bottom-up is O(n): in a perfect heap of 31, a node of height h sifts down at most h times.
  const H = 5, rows = Array.from({ length: H }, (_, h) => [h, 2 ** (H - 1 - h), 2 ** (H - 1 - h) * h]);
  const n = 2 ** H - 1, work = rows.reduce((s, r) => s + r[2], 0), pushWork = Array.from({ length: H }, (_, d) => 2 ** d * d).reduce((s, x) => s + x, 0);
  steps.push({ note: `Why O(n): for ${n} items, most nodes sit near the bottom and barely move. Total swaps are at most ${work}, under n. Pushing them one by one could take ${pushWork}.`, tone: "ok",
    tables: [{ label: `perfect heap of ${n}: worst-case swaps`, head: ["height", "nodes", "swaps"], rows, tones: { ":2": "ok" } }] });
  return { kind: "grid", title: "Heapify bottom-up in O(n)", steps };
};

/* ---------- intervals ---------- */
type Iv = [number, number];
const IVS: Iv[] = [[8, 10], [1, 3], [15, 18], [2, 6], [9, 12]];
const mergeFlow = (): Flow => {
  const s = [...IVS].sort((a, b) => a[0] - b[0]), out: Iv[] = [];
  const tbl = (rows: Iv[], label: string, tones?: GridTable["tones"]): GridTable => ({ label, head: ["start", "end"], rows, tones });
  const steps: GridStep[] = [
    { note: "Merge the overlapping intervals. In the order given, an overlap could be anywhere in the list.", tables: [tbl(IVS, "input"), tbl([], "merged")] },
    { note: "Sort by start. Now any interval that overlaps the current group must come right after it, so one pass is enough.", tone: "hot", tables: [tbl(s, "sorted by start", { ":0": "hot" }), tbl([], "merged")] },
  ];
  s.forEach(([a, b], i) => {
    const top = out.at(-1);
    let note: string, tone: FlowTone;
    if (top && a <= top[1]) { const old = top[1]; top[1] = Math.max(top[1], b); note = `${a} is at most ${old}, the end of the last merged interval, so they overlap. Extend its end to ${top[1]}.`; tone = "warn"; }
    else { out.push([a, b]); note = top ? `${a} is past ${top[1]}, the last end, so nothing overlaps. Start a new interval.` : "The first interval simply starts the result."; tone = "hot"; }
    steps.push({ note, tables: [tbl(s, "sorted by start", { [`${i}`]: "hot" }), tbl(out.map((x) => [...x] as Iv), "merged", { [`${out.length - 1}`]: tone })] });
  });
  steps.at(-1)!.note += ` Done: ${out.length} intervals, O(n log n) for the sort.`;
  steps.at(-1)!.tone = "ok";
  return { kind: "grid", title: "Merging overlapping intervals", steps };
};

const MEETINGS: [string, number, number][] = [["A", 1, 4], ["B", 2, 6], ["C", 3, 5], ["D", 4, 7]];
const roomsFlow = (): Flow => {
  // ends sort before starts at the same time, so a room freed at 4 can be reused at 4
  const ev = MEETINGS.flatMap(([m, s, e]) => [[s, 1, m], [e, -1, m]] as [number, number, string][]).sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const rooms: number[] = [];
  let cur = 0, best = 0;
  for (const [, d] of ev) { cur += d; best = Math.max(best, cur); rooms.push(cur); }
  const tbl = (k: number, tones: GridTable["tones"]): GridTable => ({ label: "events by time", head: ["time", "event", "rooms in use"], rows: ev.map(([t, d, m], i) => [t, `${m} ${d > 0 ? "starts" : "ends"}`, i <= k ? rooms[i] : ""]), tones });
  const peak = rooms.indexOf(best);
  return { kind: "grid", title: "Counting rooms with a sweep", steps: [
    { note: `Meetings ${MEETINGS.map(([m, s, e]) => `${m} ${s}-${e}`).join(", ")}. Split each into a start (+1) and an end (-1) and sort by time. On a tie the end goes first.`, tables: [tbl(-1, {})] },
    ...ev.map(([t, d, m], i): GridStep => ({
      note: d > 0 ? `${m} starts at ${t}: one more room is busy, ${rooms[i]} now.${rooms[i] === best && i === peak ? " That is the most at once." : ""}` : `${m} ends at ${t}: its room is free again, ${rooms[i]} in use.${ev[i + 1]?.[0] === t ? " It frees before the next start at the same time, so that room is reused." : ""}`,
      tone: d > 0 ? "hot" : "ok", tables: [tbl(i, { [`${i}`]: d > 0 ? "hot" : "ok" })] })),
    { note: `The answer is the peak of the running count: ${best} rooms. Sorting costs O(n log n) and the sweep is O(n).`, tone: "ok", tables: [tbl(ev.length, { [`${peak}:2`]: "ok" })] },
  ] };
};

/* ---------- greedy ---------- */
const greedyCoins = (coins: number[], amt: number) => [...coins].sort((a, b) => b - a).map((c) => { const k = Math.floor(amt / c); amt -= k * c; return [c, k, amt]; });
/** Fewest coins by DP, with how many of each coin the best answer uses. */
function bestCoins(coins: number[], amt: number) {
  const dp = [0], from = [0];
  for (let i = 1; i <= amt; i++) { dp[i] = Number.MAX_SAFE_INTEGER; for (const c of coins) if (c <= i && dp[i - c] + 1 < dp[i]) { dp[i] = dp[i - c] + 1; from[i] = c; } }
  const used = new Map(coins.map((c) => [c, 0]));
  for (let i = amt; i > 0; i -= from[i]) used.set(from[i], used.get(from[i])! + 1);
  return { n: dp[amt], used, dp };
}
const US = [25, 10, 5, 1], PAY = 63, ODD = [4, 3, 1], PAY2 = 6;
const coinsFlow = (): Flow => {
  const g = greedyCoins(US, PAY), g2 = greedyCoins(ODD, PAY2), b2 = bestCoins(ODD, PAY2);
  const total = (rows: number[][]) => rows.reduce((s, r) => s + r[1], 0);
  const head = ["coin", "taken", "left"];
  const tbl = (rows: number[][], k: number): GridTable => ({ label: `pay ${PAY}`, head, rows: rows.map((r, i) => (i <= k ? r : [r[0], "", ""])), tones: k >= 0 ? { [`${k}`]: "hot" } : {} });
  return { kind: "grid", title: "Largest coin first: when greedy works", steps: [
    { note: `Pay ${PAY} with as few coins as possible from ${US.join(", ")}. The greedy rule: always take the largest coin that still fits.`, tables: [tbl(g, -1)] },
    ...g.map((r, k): GridStep => ({ note: r[1] ? `Take ${r[1]} coin${r[1] > 1 ? "s" : ""} of ${r[0]}: ${k ? g[k - 1][2] : PAY} - ${r[0] * r[1]} leaves ${r[2]}.` : `${r[0]} does not fit into ${k ? g[k - 1][2] : PAY}, so take none and move on.`, tables: [tbl(g, k)] })),
    { note: `Greedy used ${total(g)} coins and the exact DP answer is also ${bestCoins(US, PAY).n}. For coin sets like this one, the biggest coin is always safe.`, tone: "ok", tables: [{ ...tbl(g, g.length - 1), tones: { ":1": "ok" } }] },
    { note: `Now coins ${ODD.join(", ")} and amount ${PAY2}. Greedy grabs ${list(g2.flatMap((r) => Array(r[1]).fill(r[0])))}: ${total(g2)} coins.`, tone: "warn", tables: [{ label: `pay ${PAY2}, greedy`, head, rows: g2, tones: { ":1": "warn" } }] },
    { note: `The best is ${[...b2.used].filter(([, k]) => k).map(([c, k]) => Array(k).fill(c).join(" + ")).join(" + ")}: only ${b2.n} coins. Taking ${ODD[0]} first locked the better answer out.`, tone: "bad", tables: [{ label: `pay ${PAY2}, best`, head: ["coin", "taken"], rows: ODD.map((c) => [c, b2.used.get(c)!]), tones: { ":1": "ok" } }] },
    { note: "Greedy is only right when you can prove the local choice never hurts. Without that proof, try a counterexample, then reach for DP.", tables: [{ label: `pay ${PAY2}`, head: ["method", "coins"], rows: [["greedy", total(g2)], ["DP", b2.n]], tones: { "0": "bad", "1": "ok" } }] },
  ] };
};

const ACTS: [string, number, number][] = [["A", 1, 3], ["B", 2, 5], ["C", 0, 6], ["D", 4, 7], ["E", 6, 8], ["F", 7, 9]];
const pickMost = (acts: [string, number, number][], key: (a: [string, number, number]) => number) => {
  let end = -Infinity;
  return [...acts].sort((x, y) => key(x) - key(y)).filter(([, s, e]) => (s >= end ? ((end = e), true) : false)).map((a) => a[0]);
};
const activityFlow = (): Flow => {
  const s = [...ACTS].sort((a, b) => a[2] - b[2]), pick: string[] = [];
  let end = -1;
  const tbl = (k: number, tones: GridTable["tones"]): GridTable => ({ label: "sorted by end", head: ["task", "start", "end", "pick"], rows: s.map(([n, a, b], i) => [n, a, b, i <= k ? (pick.includes(n) ? "yes" : "no") : ""]), tones });
  const steps: GridStep[] = [{ note: "Fit as many tasks as possible into one room. Sort them by end time: the task that ends first leaves the most time for the rest.", tables: [tbl(-1, { ":2": "hot" })] }];
  s.forEach(([n, a, b], i) => {
    const ok = a >= end, last = end;
    if (ok) { pick.push(n); end = b; }
    steps.push({ note: ok ? `${last < 0 ? `${n} ends first, so take it.` : `${n} starts at ${a}, not before ${last}, when the last pick ends. Take it.`} The room is now busy until ${b}.` : `${n} starts at ${a}, before ${last}, so it clashes with the last pick. Skip it.`,
      tables: [tbl(i, { [`${i}`]: ok ? "ok" : "bad" })] });
  });
  const early = pickMost(ACTS, (x) => x[1]);
  steps.push({ note: `${pick.length} tasks: ${list(pick)}. Picking by earliest start instead takes ${early[0]} first and fits only ${early.length}.`, tone: "ok", tables: [tbl(s.length, { ":3": "ok" })] });
  return { kind: "grid", title: "Activity selection: earliest end first", steps };
};

/* ---------- trie ---------- */
type Trie = { kids: Map<string, Trie>; end: boolean };
const trie = (): Trie => ({ kids: new Map(), end: false });
function trieInsert(root: Trie, w: string) {
  const how: ("reuse" | "new")[] = [];
  let n = root;
  for (const ch of w) { if (!n.kids.has(ch)) { n.kids.set(ch, trie()); how.push("new"); } else how.push("reuse"); n = n.kids.get(ch)!; }
  n.end = true;
  return how;
}
const words = (n: Trie, pre: string): string[] => [...(n.end ? [pre] : []), ...[...n.kids].flatMap(([c, k]) => words(k, pre + c))];
const WORDS = ["car", "card", "care", "cat", "dog"];
const trieInsertFlow = (): Flow => {
  const root = trie(), done: (string | number)[][] = [];
  let nodes = 0;
  const steps: GridStep[] = [{ note: "A trie starts as one empty root. Each node is one letter, and the path from the root spells a prefix.", tables: [{ label: "words inserted", head: ["word", "reused", "new", "nodes"], rows: [] }] }];
  for (const w of WORDS) {
    const how = trieInsert(root, w), fresh = how.filter((h) => h === "new").length;
    nodes += fresh; done.push([w, how.length - fresh, fresh, nodes]);
    const shared = how.indexOf("new") < 0 ? w.length : how.indexOf("new");
    steps.push({ note: !shared ? `${w} shares no first letter with anything, so all ${fresh} nodes are new from the root.` : fresh ? `${w} walks the existing path ${w.slice(0, shared)} and creates only ${fresh} new node${fresh > 1 ? "s" : ""}. Its last node is marked as a word end.` : `${w} is already a path, so nothing is created. Only the word-end mark is set.`,
      tone: fresh ? "hot" : "ok",
      tables: [{ label: `insert ${w}`, head: [...w], rows: [how], tones: Object.fromEntries(how.map((h, i) => [`0:${i}`, h === "new" ? "hot" : "ok"])) }, { label: "words inserted", head: ["word", "reused", "new", "nodes"], rows: [...done], tones: { [`${done.length - 1}`]: "hot" } }] });
  }
  const letters = WORDS.join("").length;
  steps.push({ note: `${WORDS.length} words with ${letters} letters need only ${nodes} nodes, because shared prefixes are stored once. Insert costs O(length of the word).`, tone: "ok", tables: [{ label: "words inserted", head: ["word", "reused", "new", "nodes"], rows: done, tones: { ":3": "ok" } }] });
  return { kind: "grid", title: "Building a trie: shared prefixes", steps };
};

const triePrefixFlow = (): Flow => {
  const root = trie();
  WORDS.forEach((w) => trieInsert(root, w));
  const walk = (p: string) => { const seen: [string, boolean, boolean][] = []; let n: Trie | undefined = root; for (const ch of p) { n = n?.kids.get(ch); seen.push([ch, !!n, !!n?.end]); if (!n) break; } return { seen, node: n }; };
  const P = "car", MISS = "cow", hit = walk(P), miss = walk(MISS), under = words(hit.node!, P);
  const failAt = miss.seen.findIndex((s) => !s[1]);
  return { title: `Prefix search for "${P}"`, steps: [
    { node: `trie of ${WORDS.join(", ")}`, note: `Find every word that starts with ${P}. A list would check all ${WORDS.length} words; the trie follows ${P.length} links.` },
    ...hit.seen.map(([ch, , end], i): ChainStep => ({ node: `${P.slice(0, i + 1)}: child ${ch} found${end ? ", a word ends here" : ""}`, tone: "hot",
      note: i === 0 ? `From the root, take the child ${ch}. Words starting with any other letter, like ${WORDS.find((w) => w[0] !== ch)}, are never touched.` : `Follow the child ${ch}. Each step costs O(1), however many words are stored.` })),
    { node: `collect below: ${list(under)}`, tone: "ok", note: `Every word under this node shares the prefix. A depth-first walk of the subtree lists all ${under.length}.` },
    { node: `"${MISS}": no child ${miss.seen[failAt][0]} after ${MISS.slice(0, failAt)}`, tone: "bad", note: `A missing link means no stored word starts with ${MISS}. The search stops after ${failAt + 1} steps, without scanning the list.` },
  ] };
};

/* ---------- graph ---------- */
const ADJ: Record<string, string[]> = { A: ["B", "C"], B: ["A", "D"], C: ["A", "D", "E"], D: ["B", "C", "F"], E: ["C", "F"], F: ["D", "E", "G"], G: ["F"] };
const bfsFlow = (): Flow => {
  const names = Object.keys(ADJ), dist: Record<string, number> = { A: 0 }, q = ["A"];
  const snaps: { q: string[]; d: Record<string, number>; at: string; fresh: string[] }[] = [{ q: [...q], d: { ...dist }, at: "", fresh: ["A"] }];
  while (q.length) {
    const u = q.shift()!, fresh: string[] = [];
    for (const v of ADJ[u]) if (!(v in dist)) { dist[v] = dist[u] + 1; q.push(v); fresh.push(v); }
    snaps.push({ q: [...q], d: { ...dist }, at: u, fresh });
  }
  const wide = Math.max(...snaps.map((s) => s.q.length));
  const tables = (s: (typeof snaps)[number]): GridTable[] => [
    { label: "queue, front first", rows: [[...s.q, ...Array(wide - s.q.length).fill("")]], tones: Object.fromEntries(s.q.flatMap((v, i) => (s.fresh.includes(v) ? [[`0:${i}`, "ok"]] : []))) },
    { label: "distance from A", head: names, rows: [names.map((v) => s.d[v] ?? "")], tones: { ...(s.at ? { [`0:${names.indexOf(s.at)}`]: "hot" } : {}), ...Object.fromEntries(s.fresh.map((v) => [`0:${names.indexOf(v)}`, "ok"])) } },
  ];
  const edges = Object.entries(ADJ).flatMap(([u, vs]) => vs.filter((v) => u < v).map((v) => u + v));
  return { kind: "grid", title: "BFS, one layer at a time", steps: [
    { note: `Edges ${edges.join(" ")}. Start at A: mark it seen at distance 0 and put it in the queue.`, tables: tables(snaps[0]) },
    ...snaps.slice(1).map((s, i): GridStep => {
      const old = ADJ[s.at].filter((v) => !s.fresh.includes(v));
      return { note: `Take ${s.at} (distance ${s.d[s.at]}) from the front.${s.fresh.length ? ` New: ${list(s.fresh)} at distance ${s.d[s.at] + 1}, added to the back.` : ""}${old.length ? ` ${list(old)} already seen, skipped.` : ""}${i === snaps.length - 2 ? " The queue is empty. Each node entered it once: O(V + E)." : ""}`,
        tone: i === snaps.length - 2 ? "ok" : undefined, tables: tables(s) };
    }),
  ] };
};

const WEDGES: [string, string, number][] = [["A", "B", 4], ["A", "C", 1], ["C", "B", 2], ["B", "D", 1], ["C", "D", 5], ["B", "E", 6], ["D", "E", 3]];
const dijkstraFlow = (): Flow => {
  const names = [...new Set(WEDGES.flatMap(([u, v]) => [u, v]))].sort(), INF = Number.MAX_SAFE_INTEGER;
  const dist: Record<string, number> = Object.fromEntries(names.map((v) => [v, v === "A" ? 0 : INF])), from: Record<string, string> = {}, done = new Set<string>();
  const nb = (u: string) => WEDGES.flatMap(([a, b, w]) => (a === u ? [[b, w]] : b === u ? [[a, w]] : []) as [string, number][]);
  const table = (at: string, changed: string[]): GridTable => ({ rowHead: ["dist", "from"], head: names,
    rows: [names.map((v) => (dist[v] === INF ? "∞" : dist[v])), names.map((v) => from[v] ?? "-")],
    tones: Object.fromEntries([...[...done].map((v) => [`:${names.indexOf(v)}`, "ok"]), ...changed.map((v) => [`0:${names.indexOf(v)}`, "warn"]), ...(at ? [[`:${names.indexOf(at)}`, "hot"]] : [])]) });
  const steps: GridStep[] = [{ note: `Edges ${WEDGES.map(([u, v, w]) => `${u}${v}=${w}`).join(", ")}. Start A at 0, everything else unknown.`, tables: [table("", [])] }];
  while (done.size < names.length) {
    const u = names.filter((v) => !done.has(v)).reduce((a, b) => (dist[b] < dist[a] ? b : a));
    done.add(u);
    const better: string[] = [];
    for (const [v, w] of nb(u)) if (!done.has(v) && dist[u] + w < dist[v]) { dist[v] = dist[u] + w; from[v] = u; better.push(v); }
    const last = done.size === names.length;
    steps.push({ note: `Settle ${u} at ${dist[u]}, the smallest unsettled distance.${done.size === 2 ? " With no negative edges, no other path can reach it cheaper later." : ""}${better.length ? ` Through ${u}: ${better.map((v) => `${v} drops to ${dist[v]}`).join(", ")}.` : " No neighbour improves."}${last ? " All settled; the from row traces each shortest path." : ""}`,
      tone: last ? "ok" : "hot", tables: [table(u, better)] });
  }
  return { kind: "grid", title: "Dijkstra's distance table", steps };
};

/* ---------- dp ---------- */
const coinDpFlow = (): Flow => {
  const { dp } = bestCoins(ODD, PAY2), head = dp.map((_, i) => String(i));
  const row = (k: number) => dp.map((v, i) => (i <= k ? v : "?"));
  const steps: GridStep[] = [{ note: `dp[i] = fewest coins that make i, with coins ${ODD.join(", ")}. dp[0] = 0: no coins make 0.`, tables: [{ label: "dp", head, rows: [row(0)], tones: { "0:0": "ok" } }] }];
  for (let i = 1; i < dp.length; i++) {
    const opts = ODD.filter((c) => c <= i).sort((a, b) => a - b), src = i - opts.find((c) => dp[i - c] + 1 === dp[i])!;
    steps.push({ note: `dp[${i}] = 1 + min(${opts.map((c) => `dp[${i - c}]`).join(", ")}) = 1 + ${dp[src]} = ${dp[i]}. Try each last coin and reuse the answer already in the table.`,
      tables: [{ label: "dp", head, rows: [row(i)], tones: { [`0:${i}`]: "hot", ...Object.fromEntries(opts.map((c) => [`0:${i - c}`, i - c === src ? "ok" : "warn"])) } }] });
  }
  steps.push({ note: `dp[${PAY2}] = ${dp[PAY2]}, the answer greedy missed. Each cell checks every coin once, so the work is O(amount x coins).`, tone: "ok", tables: [{ label: "dp", head, rows: [row(PAY2)], tones: { [`0:${PAY2}`]: "ok" } }] });
  return { kind: "grid", title: "A 1D table: fewest coins", steps };
};

const X = "ABCB", Y = "BDCAB";
const lcsFlow = (): Flow => {
  const L = Array.from({ length: X.length + 1 }, () => Array<number>(Y.length + 1).fill(0));
  for (let i = 1; i <= X.length; i++) for (let j = 1; j <= Y.length; j++) L[i][j] = X[i - 1] === Y[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
  const head = ["", ...Y], rowHead = ["", ...X];
  const show = (k: number) => L.map((r, i) => (i <= k ? r : r.map(() => "")));
  const steps: GridStep[] = [{ note: `L[i][j] = longest common subsequence of the first i letters of ${X} and the first j of ${Y}. Row 0 and column 0 are 0: an empty string shares nothing.`, tables: [{ head, rowHead, rows: show(0), tones: { "0": "ok", ":0": "ok" } }] }];
  for (let i = 1; i <= X.length; i++) {
    const m = [...Y].map((c, j) => (c === X[i - 1] ? j + 1 : 0)).filter(Boolean);
    steps.push({ note: `Row ${X[i - 1]}: ${m.length ? `it matches column${m.length > 1 ? "s" : ""} ${list(m)}, so ${m.length > 1 ? "those cells take" : "that cell takes"} the diagonal + 1.` : `it matches no letter of ${Y}.`} Every other cell copies the larger of the cell above and the cell to the left.`,
      tables: [{ head, rowHead, rows: show(i), tones: { [`${i}`]: "hot", ...Object.fromEntries(m.map((j) => [`${i}:${j}`, "ok"])) } }] });
  }
  const path: string[] = [];
  let lcs = "";
  for (let i = X.length, j = Y.length; i && j;) {
    path.push(`${i}:${j}`);
    if (X[i - 1] === Y[j - 1]) { lcs = X[i - 1] + lcs; i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--;
  }
  steps.push({ note: `The answer is the corner, ${L[X.length][Y.length]}. Walk back: a match steps diagonally and keeps its letter, otherwise follow the larger neighbour. That spells ${lcs}. O(n x m) cells.`, tone: "ok",
    tables: [{ head, rowHead, rows: L, tones: Object.fromEntries(path.map((p) => [p, "ok"])) }] });
  return { kind: "grid", title: "A 2D table: longest common subsequence", steps };
};

export const FLOWS: Record<string, Flow> = {
  "dsa-binary-tree-bst-insert": bstFlow(),
  "dsa-binary-tree-traversals": traversalFlow(),
  "dsa-heap-push": pushFlow(),
  "dsa-heap-heapify": heapifyFlow(),
  "dsa-intervals-merge": mergeFlow(),
  "dsa-intervals-rooms": roomsFlow(),
  "dsa-greedy-coins": coinsFlow(),
  "dsa-greedy-activities": activityFlow(),
  "dsa-trie-insert": trieInsertFlow(),
  "dsa-trie-prefix": triePrefixFlow(),
  "dsa-graph-bfs": bfsFlow(),
  "dsa-graph-dijkstra": dijkstraFlow(),
  "dsa-dp-coins-1d": coinDpFlow(),
  "dsa-dp-lcs-2d": lcsFlow(),
};
/** topic id -> flow ids shown under "See it move" on that topic's Overview, in order. */
export const PLACES: Record<string, string[]> = {
  "binary-tree": ["dsa-binary-tree-bst-insert", "dsa-binary-tree-traversals"],
  heap: ["dsa-heap-push", "dsa-heap-heapify"],
  intervals: ["dsa-intervals-merge", "dsa-intervals-rooms"],
  greedy: ["dsa-greedy-coins", "dsa-greedy-activities"],
  trie: ["dsa-trie-insert", "dsa-trie-prefix"],
  graph: ["dsa-graph-bfs", "dsa-graph-dijkstra"],
  dp: ["dsa-dp-coins-1d", "dsa-dp-lcs-2d"],
};

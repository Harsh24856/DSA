// Codeforces rows in the plan are filtered lists (tag + rating), not fixed problems, so there is no one problem to solve.
// Each tag gets a worked example written for this site, keyed "cf:<tag>", at the level those lists start from.
import type { CellsFrame, Diagram, GraphFrame, TableFrame, Tone } from "../diagram";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
const tones = (keys: (string | number)[], tone: Tone, row = 0) => Object.fromEntries(keys.map((k) => [`${row}:${k}`, tone])) as Record<string, Tone>;
const io = (lines: string) => `def main():\n${lines}\n# call main() when you submit: Codeforces gives input on stdin`;

function greedy(): Diagram {
  const a = [1, 2, 5, 4, 3], b = [5, 5, 6, 6, 5], k = 3;
  const A = [...a].sort((x, y) => x - y), B = [...b].sort((x, y) => y - x), frames: CellsFrame[] = [{ note: `Goal: swap at most ${k} pairs to maximise the sum of a. Sort a up and b down, so the best swap is always first.`, rows: [A, B] }];
  const cur = [...A], nxt = [...B]; let used = 0, i = 0;
  for (; i < cur.length && used < k; i++) {
    if (nxt[i] <= cur[i]) { frames.push({ note: `b gives ${nxt[i]}, a already has ${cur[i]}: the swap gains nothing, and later pairs are worse, so stop`, rows: [[...cur], [...nxt]], tones: { [`0:${i}`]: "bad", [`1:${i}`]: "bad" } }); break; }
    frames.push({ note: `Swap ${cur[i]} for ${nxt[i]}: it gains ${nxt[i] - cur[i]}, the most any remaining pair can`, rows: [[...cur], [...nxt]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "active" } });
    [cur[i], nxt[i]] = [nxt[i], cur[i]]; used++;
    frames.push({ note: `${used} of ${k} swaps used, a now sums to ${cur.reduce((x, y) => x + y, 0)}`, rows: [[...cur], [...nxt]], tones: { [`0:${i}`]: "done" } });
  }
  frames.push({ note: `Answer: the largest sum of a is ${cur.reduce((x, y) => x + y, 0)}`, rows: [[...cur], [...nxt]], tones: tones(range(0, cur.length - 1), "found") });
  return cells("Swap the smallest of a with the largest of b", [A, B], frames, ["a", "b"]);
}

function constructive(): Diagram {
  const n = 6, out: (string | number)[] = Array(n).fill(""), order = [...range(1, n).filter((x) => x % 2 === 0), ...range(1, n).filter((x) => x % 2)];
  const frames: CellsFrame[] = [{ note: `Goal: arrange 1 to ${n} so neighbours never differ by exactly 1. Numbers of the same parity differ by at least 2, so group them.`, rows: [[...out]] }];
  order.forEach((x, i) => {
    out[i] = x;
    const gap = i ? Math.abs(x - +out[i - 1]) : 0;
    frames.push({ note: i === 0 ? `Start with the evens: place ${x}` : `Place ${x}: its gap to ${out[i - 1]} is ${gap}, which is safe${x % 2 && +out[i - 1] % 2 === 0 ? ". This is the one place evens meet odds, so check it" : ""}`, rows: [[...out]], tones: { ...tones(range(0, i - 1), "done"), [`0:${i}`]: "active" } });
  });
  frames.push({ note: `Answer: ${out.join(" ")}. For n of 2 or 3 no arrangement exists, so print -1 there.`, rows: [[...out]], tones: tones(range(0, n - 1), "found") });
  return cells(`A permutation of 1 to ${n} with no neighbours 1 apart`, [out.map(() => "")], frames, ["p"]);
}

function math(): Diagram {
  const n = 30, a = 4, b = 6, heads = ["multiples of 4", "multiples of 6", "gcd", "lcm", "multiples of lcm", "answer"], vals: (string | number)[] = heads.map(() => "");
  const row = () => [...vals], frames: CellsFrame[] = [{ note: `Goal: count numbers from 1 to ${n} divisible by ${a} or ${b}, with n too big to loop over.`, rows: [row()] }];
  const put = (i: number, v: number, note: string) => { vals[i] = v; frames.push({ note, rows: [row()], tones: { [`0:${i}`]: "active" } }); };
  put(0, Math.floor(n / a), `${n} // ${a} = ${Math.floor(n / a)} numbers are divisible by ${a}`);
  put(1, Math.floor(n / b), `${n} // ${b} = ${Math.floor(n / b)} numbers are divisible by ${b}`);
  let x = a, y = b; while (y) [x, y] = [y, x % y];
  put(2, x, `Numbers divisible by both were counted twice. Euclid gives gcd(${a}, ${b}) = ${x}`);
  const l = a * b / x; put(3, l, `lcm = ${a} * ${b} / ${x} = ${l}: a number divisible by both is a multiple of ${l}`);
  put(4, Math.floor(n / l), `${n} // ${l} = ${Math.floor(n / l)} numbers were counted twice`);
  const ans = Math.floor(n / a) + Math.floor(n / b) - Math.floor(n / l); vals[5] = ans;
  frames.push({ note: `Answer: ${Math.floor(n / a)} + ${Math.floor(n / b)} - ${Math.floor(n / l)} = ${ans}, by inclusion and exclusion`, rows: [row()], tones: { "0:5": "found" } });
  return cells("Inclusion and exclusion with // and lcm", [vals.map(() => "")], frames, ["value"]);
}

function implementation(): Diagram {
  const s = "RUULDR", D: Record<string, [number, number]> = { U: [0, 1], D: [0, -1], L: [-1, 0], R: [1, 0] };
  let x = 0, y = 0, hit = -1; const seen = new Set(["0,0"]), frames: CellsFrame[] = [{ note: `Goal: follow the moves ${s} from (0, 0) and report the first step that lands on a visited cell.`, rows: [s.split("")], marks: [] }];
  for (let i = 0; i < s.length; i++) {
    x += D[s[i]][0]; y += D[s[i]][1];
    const key = `${x},${y}`;
    if (seen.has(key)) { hit = i + 1; frames.push({ note: `Move ${s[i]} lands on (${x}, ${y}), which is already in the visited set`, rows: [s.split("")], tones: { ...tones(range(0, i - 1), "done"), [`0:${i}`]: "bad" }, marks: [{ i, label: "hit" }] }); break; }
    seen.add(key);
    frames.push({ note: `Move ${s[i]} to (${x}, ${y}): a new cell, so add it. ${seen.size} cells visited.`, rows: [s.split("")], tones: { ...tones(range(0, i - 1), "done"), [`0:${i}`]: "active" }, marks: [{ i, label: "now" }] });
  }
  frames.push({ note: `Answer: step ${hit} is the first repeat. Write the statement down exactly, then copy it into code.`, rows: [s.split("")], tones: { [`0:${hit - 1}`]: "found" } });
  return cells("Simulate the moves with a visited set", [s.split("")], frames, ["move"]);
}

function binarySearch(): Diagram {
  const m = [2, 3, 7], k = 5, made = (t: number) => m.reduce((n, a) => n + Math.floor(t / a), 0);
  let lo = 1, hi = Math.min(...m) * k;
  const ts = range(lo, hi), frames: CellsFrame[] = [{ note: `Goal: least time for machines taking ${m.join(", ")} seconds per item to make ${k} items. More time never makes fewer, so binary search the time.`, rows: [ts], marks: [{ i: 0, label: "lo" }, { i: ts.length - 1, label: "hi" }] }];
  const window = (l: number, h: number) => Object.fromEntries(ts.flatMap((t, i) => (t < l || t > h ? [[`0:${i}`, "muted" as Tone]] : []))) as Record<string, Tone>;
  while (lo < hi) {
    const mid = (lo + hi) >> 1, n = made(mid), tone = { ...window(lo, hi), [`0:${mid - 1}`]: "active" as Tone };
    if (n >= k) { frames.push({ note: `t = ${mid} makes ${m.map((a) => Math.floor(mid / a)).join(" + ")} = ${n}, enough, so the answer is ${mid} or less`, rows: [ts], tones: tone, marks: [{ i: lo - 1, label: "lo" }, { i: mid - 1, label: "mid" }, { i: hi - 1, label: "hi" }] }); hi = mid; }
    else { frames.push({ note: `t = ${mid} makes ${m.map((a) => Math.floor(mid / a)).join(" + ")} = ${n}, too few, so the answer is above ${mid}`, rows: [ts], tones: tone, marks: [{ i: lo - 1, label: "lo" }, { i: mid - 1, label: "mid" }, { i: hi - 1, label: "hi" }] }); lo = mid + 1; }
  }
  frames.push({ note: `Answer: ${lo} seconds, the first time that makes at least ${k} (${made(lo)} items)`, rows: [ts], tones: { ...window(lo, lo), [`0:${lo - 1}`]: "found" } });
  return cells("Binary search on the answer", [ts], frames, ["t"]);
}

function twoPointers(): Diagram {
  const a = [3, 1, 2, 1, 4, 1], s = 5; let l = 0, sum = 0, best = 0, from = 0;
  const frames: CellsFrame[] = [{ note: `Goal: the longest subarray with sum at most ${s}. All values are positive, so growing raises the sum and shrinking lowers it.`, rows: [a] }];
  const win = (x: number, y: number) => Object.fromEntries(range(x, y).map((i) => [`0:${i}`, "window" as Tone])) as Record<string, Tone>;
  for (let r = 0; r < a.length; r++) {
    sum += a[r];
    frames.push({ note: `Add ${a[r]}: window sum is ${sum}`, rows: [a], tones: { ...win(l, r), [`0:${r}`]: "active" }, marks: [{ i: l, label: "l" }, { i: r, label: "r" }] });
    if (sum > s) { const before = l; while (sum > s) sum -= a[l++]; frames.push({ note: `Over ${s}, so drop from the left through index ${l - 1}${l - before > 1 ? ` (${l - before} items)` : ""}: sum is ${sum}`, rows: [a], tones: win(l, r), marks: [{ i: l, label: "l" }, { i: r, label: "r" }] }); }
    if (r - l + 1 > best) { best = r - l + 1; from = l; }
  }
  frames.push({ note: `Answer: length ${best}, from index ${from}. Each pointer only moves right, so the whole run is O(n).`, rows: [a], tones: Object.fromEntries(range(from, from + best - 1).map((i) => [`0:${i}`, "found" as Tone])) });
  return cells("Grow on the right, shrink on the left", [a], frames, ["a"]);
}

function sortings(): Diagram {
  const raw = [10, 1, 7, 4, 15, 8], k = 3, a = [...raw].sort((x, y) => x - y), frames: CellsFrame[] = [{ note: `Goal: pick ${k} numbers with the smallest gap between the largest and smallest.`, rows: [raw] }, { note: `Sort first. The best ${k} now sit next to each other, because skipping a number only widens the gap.`, rows: [a] }];
  let best = Infinity, at = 0;
  for (let i = 0; i + k <= a.length; i++) {
    const gap = a[i + k - 1] - a[i], better = gap < best;
    if (better) { best = gap; at = i; }
    frames.push({ note: `${a[i]} to ${a[i + k - 1]}: gap ${gap}${better ? ", the best so far" : `, no better than ${best}`}`, rows: [a], tones: Object.fromEntries(range(i, i + k - 1).map((x) => [`0:${x}`, (better ? "active" : "window") as Tone])) });
  }
  frames.push({ note: `Answer: ${best}, using ${a.slice(at, at + k).join(", ")}`, rows: [a], tones: Object.fromEntries(range(at, at + k - 1).map((x) => [`0:${x}`, "found" as Tone])) });
  return cells("Sort, then slide a window of k", [raw], frames, ["a"]);
}

function strings(): Diagram {
  const s = "abacaba", pi = s.split("").map(() => 0 as string | number), chars = s.split("");
  const frames: CellsFrame[] = [{ note: `Goal: the longest proper prefix of "${s}" that is also a suffix. pi[i] is that length for the part ending at i.`, rows: [chars, s.split("").map((_, i) => (i ? "" : 0))] }];
  const shown = (i: number) => pi.map((v, k) => (k <= i ? v : ""));
  for (let i = 1; i < s.length; i++) {
    let j = +pi[i - 1];
    const start = j;
    while (j && s[i] !== s[j]) j = +pi[j - 1];
    const match = s[i] === s[j];
    if (match) j++;
    pi[i] = j;
    frames.push({ note: `${s[i]} at ${i}: ${match ? `it extends a match of ${j - 1}, so pi = ${j}` : start ? `no prefix continues with it, so pi = 0` : `it differs from "${s[0]}", so pi = 0`}`, rows: [chars, shown(i)], tones: { [`0:${i}`]: "active", ...(match ? { [`0:${j - 1}`]: "window" as Tone } : {}), [`1:${i}`]: match ? "found" : "done" } });
  }
  const ans = +pi[s.length - 1];
  frames.push({ note: `Answer: ${ans}, the border "${s.slice(0, ans)}". Each step reuses earlier results, so the whole run is O(n).`, rows: [chars, shown(s.length - 1)], tones: { ...tones(range(0, ans - 1), "found"), ...tones(range(s.length - ans, s.length - 1), "found") } });
  return cells("Prefix function (KMP)", [chars, chars.map(() => "")], frames, ["s", "pi"]);
}

function dp(): Diagram {
  const h = [10, 30, 40, 20, 50], n = h.length, d: (number | null)[] = h.map(() => null);
  const frame = (note: string, active?: [number, number], deps?: [number, number][], tone?: Record<string, Tone>): TableFrame => ({ note, cells: [h, [...d]], active, deps, tones: tone });
  const frames: TableFrame[] = [frame(`Goal: cheapest way from stone 0 to stone ${n - 1}, jumping 1 or 2 stones, paying the height difference.`)];
  d[0] = 0; frames.push(frame("Start on stone 0: cost 0", [1, 0]));
  for (let i = 1; i < n; i++) {
    const one = d[i - 1]! + Math.abs(h[i] - h[i - 1]), two = i > 1 ? d[i - 2]! + Math.abs(h[i] - h[i - 2]) : Infinity;
    d[i] = Math.min(one, two);
    frames.push(frame(i > 1 ? `Stone ${i}: from ${i - 1} costs ${one}, from ${i - 2} costs ${two}, so take ${d[i]}` : `Stone 1 can only come from stone 0: cost ${one}`, [1, i], i > 1 ? [[1, i - 1], [1, i - 2]] : [[1, 0]]));
  }
  frames.push(frame(`Answer: ${d[n - 1]}. Each stone needs only the two before it, so this is O(n).`, [1, n - 1], undefined, { [`1:${n - 1}`]: "found" }));
  return { kind: "table", title: "Frog jumps: best cost per stone", rowHead: ["height", "best"], colHead: h.map((_, i) => String(i)), frames };
}

function graphs(): Diagram {
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 5], [2, 4], [4, 5]], n = 6, adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  const pos = [[6, 50], [32, 10], [32, 90], [62, 10], [62, 90], [92, 50]], dist = Array(n).fill(-1), t: Record<number, Tone> = {}, badges = () => Object.fromEntries(dist.flatMap((d, i) => (d >= 0 ? [[i, String(d)]] : [])));
  dist[0] = 0; t[0] = "active";
  const q = [0], frames: GraphFrame[] = [{ note: "Goal: fewest edges from node 0 to node 5. Every edge costs 1, so BFS reaches each node first by a shortest route.", tones: { ...t }, badges: badges() }];
  while (q.length) {
    const u = q.shift()!, fresh = adj[u].filter((v) => dist[v] < 0);
    t[u] = "active";
    for (const v of fresh) { dist[v] = dist[u] + 1; t[v] = "window"; q.push(v); }
    frames.push({ note: fresh.length ? `Pop ${u}: distance ${dist[u]}. Reach ${fresh.join(" and ")} at distance ${dist[u] + 1}.` : `Pop ${u}: distance ${dist[u]}, and every neighbour is already reached`, tones: { ...t }, badges: badges(), edgeTones: Object.fromEntries(fresh.map((v) => [`${Math.min(u, v)}-${Math.max(u, v)}`, "active" as Tone])) });
    t[u] = "done";
  }
  frames.push({ note: `Answer: ${dist[5]} edges to node 5. A node with no badge would mean print -1.`, tones: { ...t, 5: "found" }, badges: badges() });
  return { kind: "graph", title: "BFS on an unweighted graph", nodes: pos.map(([x, y], id) => ({ id, label: String(id), x, y })), edges: edges.map(([a, b]) => ({ a, b })), frames };
}

function numberTheory(): Diagram {
  const start = 2520; let n = start, d = 2, ways = 1; const seen: (string | number)[] = ["", "", "", ""], primes = [2, 3, 5, 7];
  const frames: CellsFrame[] = [{ note: `Goal: how many divisors does ${start} have? A divisor picks each prime's power on its own, so factor first.`, rows: [primes, [...seen]] }];
  while (d * d <= n) {
    if (n % d) { frames.push({ note: `${d} does not divide ${n}, so try ${d + 1}`, rows: [primes, [...seen]] }); d++; continue; }
    let e = 0; while (n % d === 0) { n /= d; e++; }
    ways *= e + 1; seen[primes.indexOf(d)] = e;
    frames.push({ note: `${d} divides ${e} times, leaving ${n}. It can appear 0 to ${e} times, so multiply by ${e + 1}: ${ways} so far.`, rows: [primes, [...seen]], tones: { [`1:${primes.indexOf(d)}`]: "active" } });
    d++;
  }
  if (n > 1) { ways *= 2; seen[primes.indexOf(n)] = 1; frames.push({ note: `${d}² is above ${n}, so the leftover ${n} is prime. Multiply by 2: ${ways}.`, rows: [primes, [...seen]], tones: { [`1:${primes.indexOf(n)}`]: "active" } }); }
  frames.push({ note: `Answer: ${ways} divisors. Stopping at the square root keeps this at O(sqrt n).`, rows: [primes, [...seen]], tones: tones(range(0, 3), "found", 1) });
  return cells(`Divisors of ${start} by factoring`, [primes, ["", "", "", ""]], frames, ["prime", "power"]);
}

function bitmasks(): Diagram {
  const a = [3, 5, 2, 4], target = 9, n = a.length, frames: CellsFrame[] = [{ note: `Goal: does a subset of ${a.join(", ")} sum to exactly ${target}? Each number from 0 to ${2 ** n - 1} is one subset: bit i means take a[i].`, rows: [a, a.map(() => 0)] }];
  const used = (m: number) => a.map((_, i) => (m >> i) & 1);
  let found = -1;
  for (let m = 1; m < 2 ** n; m++) {
    const sum = a.reduce((s, x, i) => ((m >> i) & 1 ? s + x : s), 0), bits = used(m), ok = sum === target;
    if (ok) found = m;
    frames.push({ note: `mask ${m.toString(2).padStart(n, "0")}: ${a.filter((_, i) => (m >> i) & 1).join(" + ")} = ${sum}${ok ? `, exactly ${target}` : `, not ${target}`}`, rows: [a, bits], tones: Object.fromEntries(a.flatMap((_, i) => ((m >> i) & 1 ? [[`0:${i}`, (ok ? "found" : "active") as Tone], [`1:${i}`, (ok ? "found" : "window") as Tone]] : []))) });
    if (ok) break;
  }
  frames.push({ note: `Answer: yes, mask ${found} takes ${a.filter((_, i) => (found >> i) & 1).join(" and ")}. The full loop is O(2^n * n), so n stays near 20.`, rows: [a, used(found)], tones: Object.fromEntries(a.flatMap((_, i) => ((found >> i) & 1 ? [[`0:${i}`, "found" as Tone]] : []))) });
  return cells("Every subset is a number", [a, a.map(() => 0)], frames, ["a", "bit"]);
}

function bruteForce(): Diagram {
  const a = [1, 5, 3, 7, 2], k = 4; let count = 0; const frames: CellsFrame[] = [{ note: `Goal: count pairs whose sum is divisible by ${k}. With n up to 2000, about 2 million pairs fit in the time limit, so try them all.`, rows: [a] }];
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
    const s = a[i] + a[j], ok = s % k === 0;
    if (ok) count++;
    frames.push({ note: `${a[i]} + ${a[j]} = ${s}${ok ? `, divisible by ${k}: count is ${count}` : `, remainder ${s % k}: skip`}`, rows: [a], tones: { [`0:${i}`]: ok ? "found" : "active", [`0:${j}`]: ok ? "found" : "window" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
  }
  frames.push({ note: `Answer: ${count} pairs. Check the limits first: this works because n is small, and it needs n(n-1)/2 checks.`, rows: [a], tones: tones(range(0, a.length - 1), "done") });
  return cells("Check the limits, then try every pair", [a], frames, ["a"]);
}

function dataStructures(): Diagram {
  const n = 6, unions: [number, number][] = [[0, 1], [2, 3], [1, 2], [4, 5], [0, 3]], p = range(0, n - 1), find = (x: number): number => (p[x] === x ? x : (p[x] = find(p[x])));
  const pos = [[8, 15], [36, 15], [64, 15], [92, 15], [25, 85], [75, 85]];
  let comps = n; const on: [number, number][] = [], frames: GraphFrame[] = [{ note: `Goal: after each link, how many groups are there? ${n} separate nodes to start. Rerunning a DFS each time would be too slow.` }];
  const paint = () => Object.fromEntries(range(0, n - 1).flatMap((i) => (find(i) === find(0) ? [[i, "window" as Tone]] : find(i) === find(4) ? [[i, "done" as Tone]] : []))) as Record<number, Tone>;
  for (const [a, b] of unions) {
    const ra = find(a), rb = find(b), merge = ra !== rb;
    if (merge) { p[ra] = rb; comps--; on.push([a, b]); }
    frames.push({ note: merge ? `Link ${a} and ${b}: different roots, so join them. ${comps} groups now.` : `Link ${a} and ${b}: both already have root ${ra}, so the count stays ${comps}`, tones: { ...paint(), [a]: merge ? "active" : "bad", [b]: merge ? "active" : "bad" }, edgeTones: Object.fromEntries(on.map(([x, y]) => [`${x}-${y}`, "done" as Tone])) });
  }
  frames.push({ note: `Answer: ${comps} groups. Union find with path compression answers each link almost instantly.`, tones: Object.fromEntries(range(0, n - 1).map((i) => [i, "found" as Tone])), edgeTones: Object.fromEntries(on.map(([x, y]) => [`${x}-${y}`, "found" as Tone])) });
  return { kind: "graph", title: "Union find counts groups as links arrive", nodes: pos.map(([x, y], id) => ({ id, label: String(id), x, y })), edges: unions.map(([a, b]) => ({ a, b })), frames };
}

const py = { lang: "python" as const };

/** The closest pattern to study for each tag; constructive and brute force have none. */
export const CF_PATTERN: Record<string, string> = { "cf:greedy": "greedy:7", "cf:math": "bit-and-math:6", "cf:implementation": "logic-to-code:1", "cf:binary search": "array:7", "cf:two pointers": "array:3", "cf:sortings": "array:8", "cf:strings": "string:5", "cf:dp": "dp:1", "cf:graphs": "graph:2", "cf:number theory": "bit-and-math:7", "cf:bitmasks": "bit-and-math:3", "cf:data structures": "graph:4" };

export const CODEFORCES: Record<string, Solution> = {
  "cf:greedy": { ...py, example: "Arrays a and b have n numbers each. Swap up to k pairs (a[i], b[j]). Print the largest possible sum of a.",
    approach: "Prove one local choice is always safe, then repeat it: swap the smallest of a with the largest of b while that gains something.",
    idea: ["Greedy tags are about the proof. Ask: why can the best answer always include this choice?", "Here an exchange argument works: any swap you make could be replaced by this bigger one.", "Sort first, then stop as soon as a swap stops helping, since later ones are worse."],
    code: `def solve(a, b, k):
    a, b = sorted(a), sorted(b, reverse=True)
    for i in range(min(k, len(a))):
        if b[i] <= a[i]:
            break
        a[i] = b[i]
    return sum(a)

${io(`    for _ in range(int(input())):
        n, k = map(int, input().split())
        a = list(map(int, input().split()))
        b = list(map(int, input().split()))
        print(solve(a, b, k))`)}`, time: "O(n log n)", space: "O(n)", viz: greedy },
  "cf:constructive algorithms": { ...py, example: "Given n, print a permutation of 1 to n where neighbours never differ by exactly 1, or -1 if there is none.",
    approach: "Find a simple shape that always works, then handle the small cases that break it. Here: all evens, then all odds.",
    idea: ["Try n = 1 to 6 by hand first; the shape and the impossible cases usually appear.", "Same parity means a gap of at least 2, so only the join between the two groups needs a check.", "Any valid answer is accepted, so aim for the easiest pattern, not a clever one."],
    code: `def solve(n):
    if n == 1:
        return [1]
    if n < 4:
        return [-1]
    return list(range(2, n + 1, 2)) + list(range(1, n + 1, 2))

${io(`    for _ in range(int(input())):
        print(*solve(int(input())))`)}`, time: "O(n)", space: "O(n)", viz: constructive },
  "cf:math": { ...py, example: "Given n, a and b, print how many numbers from 1 to n are divisible by a or by b. n can be 10^18.",
    approach: "When n is huge the answer must be a formula. Count each group with floor division and subtract the overlap.",
    idea: ["A limit like 10^18 rules out any loop, so look for a formula.", "n // a counts multiples of a, and numbers divisible by both are the multiples of the lcm.", "Python handles big numbers for you; in C++ divide before multiplying when computing the lcm."],
    code: `from math import gcd

def solve(n, a, b):
    lcm = a // gcd(a, b) * b
    return n // a + n // b - n // lcm

${io(`    for _ in range(int(input())):
        print(solve(*map(int, input().split())))`)}`, time: "O(log min(a, b))", space: "O(1)", viz: math },
  "cf:implementation": { ...py, example: "A robot starts at (0, 0) and follows a string of U, D, L, R moves. Print the first step that lands on a visited cell, or -1.",
    approach: "No trick: do exactly what the statement says, with the plainest data structure that is fast enough.",
    idea: ["Read the statement twice and list the rules before coding.", "A set of visited coordinates makes each check O(1).", "Most wrong answers here come from edge cases, so test the shortest inputs by hand."],
    code: `def solve(s):
    moves = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}
    x = y = 0
    seen = {(0, 0)}
    for step, c in enumerate(s, 1):
        x += moves[c][0]
        y += moves[c][1]
        if (x, y) in seen:
            return step
        seen.add((x, y))
    return -1

${io(`    print(solve(input().strip()))`)}`, time: "O(n)", space: "O(n)", viz: implementation },
  "cf:binary search": { ...py, example: "Machines take a[i] seconds per item and run at the same time. Print the least time to make k items.",
    approach: "If checking one answer is easy and more time only helps, binary search the answer instead of computing it.",
    idea: ["The clue is a monotonic yes or no: if t is enough, so is t + 1.", "Write the check first: in t seconds a machine makes t // a[i] items.", "Set hi to something surely enough, here the fastest machine doing everything alone."],
    code: `def solve(a, k):
    lo, hi = 1, min(a) * k
    while lo < hi:
        mid = (lo + hi) // 2
        if sum(mid // x for x in a) >= k:
            hi = mid
        else:
            lo = mid + 1
    return lo

${io(`    n, k = map(int, input().split())
    print(solve(list(map(int, input().split())), k))`)}`, time: "O(n log(max * k))", space: "O(1)", viz: binarySearch },
  "cf:two pointers": { ...py, example: "Given n positive numbers and s, print the length of the longest subarray with sum at most s.",
    approach: "When growing a window only makes it worse, keep two pointers that never move back.",
    idea: ["Positive numbers are what make this work: adding raises the sum, removing lowers it.", "For each right end, move left only as far as needed.", "Each pointer moves at most n times, so nested-looking loops are still O(n)."],
    code: `def solve(a, s):
    best = l = total = 0
    for r, x in enumerate(a):
        total += x
        while total > s:
            total -= a[l]
            l += 1
        best = max(best, r - l + 1)
    return best

${io(`    n, s = map(int, input().split())
    print(solve(list(map(int, input().split())), s))`)}`, time: "O(n)", space: "O(1)", viz: twoPointers },
  "cf:sortings": { ...py, example: "Pick k of n numbers so the difference between the largest and smallest picked is as small as possible.",
    approach: "Sorting often turns a choice among subsets into a scan: here the best k are always adjacent.",
    idea: ["Ask what order would make the answer obvious.", "If a picked set skips a number, swapping that number in cannot widen the gap.", "So only n - k + 1 windows are left to check."],
    code: `def solve(a, k):
    a = sorted(a)
    return min(a[i + k - 1] - a[i] for i in range(len(a) - k + 1))

${io(`    n, k = map(int, input().split())
    print(solve(list(map(int, input().split())), k))`)}`, time: "O(n log n)", space: "O(n)", viz: sortings },
  "cf:strings": { ...py, example: "Print the length of the longest proper prefix of s that is also its suffix.",
    approach: "The prefix function records, at every position, the longest border so far, so a mismatch can reuse earlier work.",
    idea: ["pi[i] is the longest proper prefix of s[0..i] that also ends at i.", "To extend, compare s[i] with s[pi[i - 1]]; on a mismatch fall back to the next shorter border.", "The same array answers pattern search, periods and border questions."],
    code: `def solve(s):
    pi = [0] * len(s)
    for i in range(1, len(s)):
        j = pi[i - 1]
        while j and s[i] != s[j]:
            j = pi[j - 1]
        if s[i] == s[j]:
            j += 1
        pi[i] = j
    return pi[-1]

${io(`    print(solve(input().strip()))`)}`, time: "O(n)", space: "O(n)", viz: strings },
  "cf:dp": { ...py, example: "A frog on stone 0 can jump 1 or 2 stones ahead, paying the height difference. Print the least cost to reach the last stone.",
    approach: "Define what one state means, write how it comes from smaller states, and fill the table in order.",
    idea: ["State: best[i] is the least cost to stand on stone i.", "The last jump came from i - 1 or i - 2, so take the cheaper.", "Write the base case first, then check the answer on the sample by hand."],
    code: `def solve(h):
    best = [0] * len(h)
    for i in range(1, len(h)):
        best[i] = best[i - 1] + abs(h[i] - h[i - 1])
        if i > 1:
            best[i] = min(best[i], best[i - 2] + abs(h[i] - h[i - 2]))
    return best[-1]

${io(`    input()
    print(solve(list(map(int, input().split()))))`)}`, time: "O(n)", space: "O(n)", viz: dp },
  "cf:graphs": { ...py, example: "Given an undirected graph, print the fewest edges from node 0 to node n - 1, or -1 if it cannot be reached.",
    approach: "Unit-cost edges mean BFS: nodes come out of the queue in order of distance.",
    idea: ["Many CF statements hide the graph: cells, numbers or strings can be the nodes.", "Mark a node when you push it, not when you pop it, or the queue can blow up.", "Use a list of neighbours and read input fast, as n is often 2 * 10^5."],
    code: `from collections import deque

def solve(n, edges):
    adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    dist = [-1] * n
    dist[0] = 0
    q = deque([0])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] < 0:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist[n - 1]

${io(`    n, m = map(int, input().split())
    print(solve(n, [tuple(map(int, input().split())) for _ in range(m)]))`)}`, time: "O(n + m)", space: "O(n + m)", viz: graphs },
  "cf:number theory": { ...py, example: "Given n up to 10^12, print how many divisors it has.",
    approach: "Factor by trial division up to the square root, then combine: the divisor count is the product of (power + 1).",
    idea: ["Whatever is left after dividing up to the square root is 1 or a single prime.", "Each prime's power is picked on its own, which is why the counts multiply.", "For many queries, precompute smallest prime factors with a sieve instead."],
    code: `def solve(n):
    ways, d = 1, 2
    while d * d <= n:
        e = 0
        while n % d == 0:
            n //= d
            e += 1
        ways *= e + 1
        d += 1
    return ways * 2 if n > 1 else ways

${io(`    for _ in range(int(input())):
        print(solve(int(input())))`)}`, time: "O(sqrt n)", space: "O(1)", viz: numberTheory },
  "cf:bitmasks": { ...py, example: "Given n up to 20 numbers and a target, print YES if some non-empty subset sums to the target, else NO.",
    approach: "A small n (about 20) is the clue: each integer from 1 to 2^n - 1 stands for one subset, so loop over them.",
    idea: ["Bit i of the mask says whether to take a[i]; test it with (mask >> i) & 1.", "2^20 is about a million, which fits; 2^30 does not.", "The same bit tricks solve XOR questions by looking at each bit on its own."],
    code: `def solve(a, target):
    n = len(a)
    for mask in range(1, 1 << n):
        total = sum(a[i] for i in range(n) if mask >> i & 1)
        if total == target:
            return "YES"
    return "NO"

${io(`    n, target = map(int, input().split())
    print(solve(list(map(int, input().split())), target))`)}`, time: "O(2^n * n)", space: "O(1)", viz: bitmasks },
  "cf:brute force": { ...py, example: "Given n up to 2000 numbers and k, print how many pairs i < j have a sum divisible by k.",
    approach: "Read the limits first. If trying everything fits, the simplest loop is the right answer.",
    idea: ["Roughly 10^8 simple steps fit per second in C++, and far fewer in Python, so count your steps.", "n of 2000 allows O(n²); n of 2 * 10^5 does not.", "Check the small search space too: often only a few candidates are worth trying."],
    code: `def solve(a, k):
    count = 0
    for i in range(len(a)):
        for j in range(i + 1, len(a)):
            if (a[i] + a[j]) % k == 0:
                count += 1
    return count

${io(`    n, k = map(int, input().split())
    print(solve(list(map(int, input().split())), k))`)}`, time: "O(n²)", space: "O(1)", viz: bruteForce },
  "cf:data structures": { ...py, example: "n nodes start apart. After each of q links (a, b), print how many groups there are.",
    approach: "Pick the structure that makes the repeated operation cheap. For merging groups that is union find.",
    idea: ["Ask which operation repeats, then what structure makes it fast: heap, stack, prefix sums, union find.", "find follows parents to a root, and path compression shortens the route.", "A link only lowers the count if its two ends have different roots."],
    code: `def solve(n, links):
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    groups, out = n, []
    for a, b in links:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            groups -= 1
        out.append(groups)
    return out

${io(`    n, q = map(int, input().split())
    links = [tuple(map(int, input().split())) for _ in range(q)]
    print(*solve(n, links), sep="\\n")`)}`, time: "O(q α(n))", space: "O(n)", viz: dataStructures },
};

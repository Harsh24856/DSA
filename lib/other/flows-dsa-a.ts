// Animated walk-throughs for the topic Overviews on /patterns (see flows-dsa.ts). Numbers come from real code below:
// each flow runs a small version of the structure or algorithm and records what it did, a step at a time.
import type { Bar, Flow, FlowTone, GridStep, GridTable } from "./flows.ts";

type Tones = Record<string, FlowTone>;
type Cell = string | number;
const padTo = (row: Cell[], n: number): Cell[] => [...row, ...Array(n - row.length).fill("")];
const cap1 = (s: string) => s[0].toUpperCase() + s.slice(1);

/* ---------- array: a dynamic array growing by doubling ---------- */
function growFlow(): Flow {
  let cap = 1, size = 0, copies = 0, mem: Cell[] = [""];
  const steps: GridStep[] = [], N = 8;
  for (let k = 1; k <= N; k++) {
    const v = k * 10;
    let moved = 0;
    if (size === cap) {                         // full: allocate twice the room and copy everything across
      const bigger: Cell[] = Array(cap * 2).fill("");
      for (let i = 0; i < size; i++) { bigger[i] = mem[i]; moved++; }
      mem = bigger; cap *= 2; copies += moved;
    }
    mem[size++] = v;
    const tones: Tones = { [`0:${size - 1}`]: "ok" };
    for (let i = 0; i < moved; i++) tones[`0:${i}`] = "warn";
    let note = moved
      ? `append(${v}): no free slot, so allocate ${cap} slots, copy ${moved} item${moved > 1 ? "s" : ""} across, then write.`
      : `append(${v}): a free slot is waiting, so this is one write and no copying.`;
    if (k === 1) note = `Size counts items, capacity counts slots. Start with capacity 1. ${note}`;
    if (k === N) note += ` ${N} appends cost ${copies} copies in all, under one per append, so append is amortised O(1).`;
    steps.push({ note, tone: moved ? "warn" : k === N ? "ok" : undefined, tables: [
      { label: "memory", rows: [mem.slice()], tones },
      { label: "counters", head: ["size", "capacity", "copies so far"], rows: [[size, cap, copies]] },
    ] });
  }
  return { kind: "grid", title: "A dynamic array grows by doubling", steps };
}

/* ---------- array: inserting in the middle shifts the tail ---------- */
function insertFlow(): Flow {
  const a: Cell[] = [3, 8, 1, 9, 4, ""], n = 5, at = 2, x = 7, steps: GridStep[] = [];
  const head = a.map((_, i) => String(i));
  const snap = (note: string, tones: Tones, tone?: FlowTone, extra: GridTable[] = []) =>
    steps.push({ note, tone, tables: [{ label: `array, capacity ${a.length}`, head, rows: [a.slice()], tones }, ...extra] });
  snap(`Insert ${x} at index ${at}. That slot is taken, so every item from index ${at} on must first move one place right.`, { [`0:${at}`]: "hot" });
  let moves = 0;
  for (let i = n; i > at; i--) {
    a[i] = a[i - 1]; moves++;
    snap(moves === 1
      ? `Move ${a[i]} from index ${i - 1} to ${i}. Start at the right end, so nothing is overwritten before it has moved.`
      : `Move ${a[i]} from index ${i - 1} to ${i}. Index ${i - 1} still holds an old copy until it is overwritten.`, { [`0:${i}`]: "warn" });
  }
  a[at] = x;
  snap(`Index ${at} is free now, so write ${x}. That took ${moves} moves for ${n} items.`, { [`0:${at}`]: "ok" }, "ok");
  const cost = [[`end (${n})`, n - n], [`middle (${at})`, n - at], ["front (0)", n - 0]];
  snap(`Moves = n minus the index. At the end it is free, at the front all ${n} items move. So insert and delete inside an array are O(n).`, {}, "warn",
    [{ label: "moves to insert at", head: ["index", "moves"], rows: cost, tones: { "2:1": "bad", "0:1": "ok" } }]);
  return { kind: "grid", title: "Inserting into the middle of an array", steps };
}

/* ---------- string: += in a loop against a builder ---------- */
function concatFlow(): Flow {
  const plus = (n: number) => { let s = "", copied = 0; for (let i = 0; i < n; i++) { copied += s.length + 1; s = s + "a"; } return copied; };   // a new string each time: old chars + 1
  const builder = (n: number) => { const parts: string[] = []; let copied = 0; for (let i = 0; i < n; i++) { parts.push("a"); copied++; } copied += parts.join("").length; return copied; };   // each char written once, copied once by join
  const sizes = [2, 4, 8, 16, 32, 64];
  const steps = sizes.map((n, i) => {
    const p = plus(n), b = builder(n);
    const bars: Bar[] = [{ label: "s += c", value: p, tone: i > 1 ? "bad" : undefined }, { label: "builder", value: b, tone: "ok" }];
    const note = i === 0 ? `Build a string of ${n} characters. A Java String never changes, so s += c makes a new string and copies the old one into it. At n = ${n}: ${p} copies against ${b}, no gap yet.`
      : i === sizes.length - 1 ? `n = ${n}: ${p} against ${b}, ${Math.round(p / b)} times more. += in a loop is O(n²); appending to a StringBuilder (or a list, then join) is O(n).`
      : `n = ${n}: += copies ${p} characters, the builder ${b}. Doubling n roughly quadruples the += cost, but only doubles the builder's.`;
    return { note, tone: i === sizes.length - 1 ? ("ok" as const) : undefined, bars };
  });
  return { kind: "bars", title: "Characters copied while building a string", steps };
}

/* ---------- string: counting letters in a 26-slot array ---------- */
function countFlow(): Flow {
  const A = "listen", B = "silent", L = "abcdefghijklmnopqrstuvwxyz", cnt: number[] = Array(26).fill(0), steps: GridStep[] = [];
  const snap = (note: string, word: string, at: number[], changed: number[], tone?: FlowTone) => {
    const t1: Tones = {}, t2: Tones = {};
    for (const i of changed) (i < 13 ? t1 : t2)[`0:${i % 13}`] = tone === "ok" ? "ok" : "hot";
    steps.push({ note, tone, tables: [
      { label: `word: ${word}`, rows: [[...word]], tones: Object.fromEntries(at.map((i) => [`0:${i}`, tone === "ok" ? "ok" : "hot"])) },
      { label: "count[0..12]", head: [...L.slice(0, 13)], rows: [cnt.slice(0, 13)], tones: t1 },
      { label: "count[13..25]", head: [...L.slice(13)], rows: [cnt.slice(13)], tones: t2 },
    ] });
  };
  snap(`One slot per letter, at index c - 'a'. That is 26 ints however long the word is: O(1) extra space.`, A, [], []);
  [...A].forEach((c, i) => {
    const k = c.charCodeAt(0) - 97;
    cnt[k]++;
    snap(`'${c}' - 'a' = ${k}, so count[${k}] goes up to ${cnt[k]}.`, A, [i], [k]);
  });
  const touched = [...B].map((c) => c.charCodeAt(0) - 97);
  for (const k of touched) cnt[k]--;
  const zero = cnt.every((v) => v === 0);
  snap(`Now walk "${B}" and subtract 1 per letter. ${zero ? `Every slot is back to 0, so "${A}" and "${B}" are anagrams.` : "Some slot is not 0, so they are not anagrams."} O(n) time.`, B, [...B].map((_, i) => i), touched, "ok");
  return { kind: "grid", title: "Counting letters with a 26-slot array", steps };
}

/* ---------- logic to code: a spiral walk with direction arrays ---------- */
function spiralFlow(): Flow {
  const R = 4, C = 4, M = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => r * C + c + 1));
  const dr = [0, 1, 0, -1], dc = [1, 0, -1, 0], names = ["right", "down", "left", "up"];
  const seen = M.map((row) => row.map(() => false)), segs: { d: number; cells: [number, number][]; why: string }[] = [];
  let r = 0, c = 0, d = 0, cur: (typeof segs)[number] = { d: 0, cells: [], why: "" };
  for (let k = 0; k < R * C; k++) {
    seen[r][c] = true; cur.cells.push([r, c]);
    const nr = r + dr[d], nc = c + dc[d], out = nr < 0 || nr >= R || nc < 0 || nc >= C;
    if (k < R * C - 1 && (out || seen[nr][nc])) { cur.why = out ? "outside the matrix" : "already read"; segs.push(cur); d = (d + 1) % 4; cur = { d, cells: [], why: "" }; }
    r += dr[d]; c += dc[d];
  }
  segs.push(cur);
  const dirs = (d: number | null): GridTable => ({ label: "direction arrays", head: names, rowHead: ["dr", "dc"], rows: [dr, dc], tones: d === null ? {} : { [`:${d}`]: "hot" } });
  const done: [number, number][] = [];
  const steps: GridStep[] = [{ note: "Keep a direction index d into two small arrays. A move is r += dr[d], c += dc[d]; a right turn is d = (d + 1) % 4.", tables: [{ label: "matrix", rows: M }, dirs(null)] }];
  segs.forEach((s, i) => {
    const tones: Tones = {};
    for (const [a, b] of done) tones[`${a}:${b}`] = "ok";
    for (const [a, b] of s.cells) tones[`${a}:${b}`] = "hot";
    done.push(...s.cells);
    const read = s.cells.map(([a, b]) => M[a][b]).join(" ");
    const note = i === segs.length - 1
      ? `Go ${names[s.d]}: read ${read}. All ${R * C} cells read once, O(rows × cols). The one turn rule handled every corner.`
      : `Go ${names[s.d]} and read ${read}. The next cell is ${s.why}, so turn: d = (d + 1) % 4.`;
    steps.push({ note, tone: i === segs.length - 1 ? "ok" : undefined, tables: [{ label: "matrix", rows: M, tones }, dirs(s.d)] });
  });
  return { kind: "grid", title: "A spiral walk with direction arrays", steps };
}

/* ---------- logic to code: simulating a process (Game of Life) ---------- */
function lifeFlow(): Flow {
  const R = 4, C = 5;
  const g0 = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => (r === 1 && c >= 1 && c <= 3 ? 1 : 0)));
  const around = (g: number[][], r: number, c: number) => {
    let n = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if ((a || b) && g[r + a]?.[c + b]) n++;
    return n;
  };
  const rule = (live: number, n: number) => ((live && (n === 2 || n === 3)) || (!live && n === 3) ? 1 : 0);
  const next = (g: number[][]) => g.map((row, r) => row.map((v, c) => rule(v, around(g, r, c))));   // reads old, writes new
  const inPlace = (g: number[][]) => { const h = g.map((row) => row.slice()); for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) h[r][c] = rule(h[r][c], around(h, r, c)); return h; };
  const live = (g: number[][]) => g.flat().filter(Boolean).length;
  const show = (label: string, g: number[][], before?: number[][]): GridTable => {
    const tones: Tones = {};
    g.forEach((row, r) => row.forEach((v, c) => { if (v) tones[`${r}:${c}`] = "ok"; else if (before?.[r][c]) tones[`${r}:${c}`] = "bad"; }));
    return { label, rows: g, tones };
  };
  const counts = g0.map((row, r) => row.map((_, c) => around(g0, r, c)));
  const g1 = next(g0), g2 = next(g1), bad = inPlace(g0);
  const births = g0.flat().filter((v, i) => !v && g1.flat()[i]).length, deaths = g0.flat().filter((v, i) => v && !g1.flat()[i]).length;
  const ctones: Tones = {};
  counts.forEach((row, r) => row.forEach((_, c) => { if (rule(g0[r][c], counts[r][c]) !== g0[r][c]) ctones[`${r}:${c}`] = g0[r][c] ? "bad" : "ok"; }));
  const same = (a: number[][], b: number[][]) => JSON.stringify(a) === JSON.stringify(b);
  return { kind: "grid", title: "Simulating a process one tick at a time", steps: [
    { note: `State is a grid of cells, 1 alive and 0 dead. One tick: a live cell with 2 or 3 live neighbours stays, a dead cell with exactly 3 is born, all else is dead.`, tables: [show("generation 0", g0)] },
    { note: `First count the live neighbours of every cell, using only generation 0. ${births} dead cells have exactly 3 and will be born; ${deaths} live cells have too few and will die.`, tone: "hot", tables: [show("generation 0", g0), { label: "live neighbours", rows: counts, tones: ctones }] },
    { note: `Write the answers into a new grid. The row became a column: ${live(g1)} live cells, as the rule says.`, tone: "ok", tables: [show("generation 0", g0), show("generation 1", g1, g0)] },
    { note: `The trap: update the same grid while scanning it, and later cells count neighbours that already changed. You get ${live(bad)} live cells${same(bad, g1) ? "" : " in the wrong places"}. Keep a copy, or encode old and new in one cell.`, tone: "bad", tables: [show("generation 0", g0), show("updated in place", bad, g0)] },
    { note: `Tick again from generation 1. ${same(g2, g0) ? "It is back to generation 0, so this shape repeats every 2 ticks." : "It keeps changing."} A simulation is just this loop: read the state, build the next one, repeat.`, tone: "ok", tables: [show("generation 1", g1), show("generation 2", g2, g1)] },
  ] };
}

/* ---------- bits: two's complement ---------- */
function twosFlow(): Flow {
  const x = 6, neg = -x & 255, flip = ~x & 255;
  const bits = (v: number) => Array.from({ length: 8 }, (_, i) => (v >> (7 - i)) & 1);
  const W = ["128", "64", "32", "16", "8", "4", "2", "1"], S = ["-128", ...W.slice(1)];
  const diff = (a: number, b: number): Tones => Object.fromEntries(bits(a).map((v, i) => [i, v !== bits(b)[i]] as const).filter(([, d]) => d).map(([i]) => [`0:${i}`, "hot"]));
  const terms = bits(neg).map((v, i) => (v ? Number(S[i]) : 0)).filter(Boolean), sum = terms.reduce((s, t) => s + t, 0);
  const total = x + neg;
  return { kind: "grid", title: `Two's complement of -${x} in 8 bits`, steps: [
    { note: `Start from ${x} in 8 bits: ${bits(x).map((v, i) => (v ? W[i] : "")).filter(Boolean).join(" + ")}.`, tables: [{ label: `${x}`, head: W, rows: [bits(x)] }] },
    { note: `Flip every bit with ~. That gives ${~x}, one short of -${x}.`, tone: "warn", tables: [{ label: `~${x}`, head: W, rows: [bits(flip)], tones: diff(flip, x) }] },
    { note: `Add 1. The carry turns trailing 1s into 0s and stops at the first 0. These bits are -${x}.`, tone: "hot", tables: [{ label: `~${x} + 1`, head: W, rows: [bits(neg)], tones: diff(neg, flip) }] },
    { note: `Read it with the top bit worth -128 instead of +128: ${terms.join(" + ")} = ${sum}.`, tone: "ok", tables: [{ label: `-${x}, signed weights`, head: S, rows: [bits(neg)], tones: { "0:0": "hot" } }] },
    { note: `Add ${x} and -${x} as plain bits: ${x} + ${neg} = ${total}. The 9th bit falls off, leaving ${total & 255}, so one adder works for both signs.`, tone: "ok", tables: [{ head: W, rowHead: [`${x}`, `-${x}`, "sum"], rows: [bits(x), bits(neg), bits(total & 255)], tones: { "2": "ok" } }] },
    { note: `A shortcut: -x keeps the lowest 1 bit of x and flips everything above it. So x & -x isolates that bit: ${x & -x} here, the step a Fenwick tree uses.`, tables: [{ head: W, rowHead: ["x", "-x", "x & -x"], rows: [bits(x), bits(neg), bits(x & -x & 255)], tones: { "2": "hot" } }] },
  ] };
}

/* ---------- math: fast power by squaring ---------- */
function powFlow(): Flow {
  const B = 3, E = 13, bin = (v: number) => v.toString(2);
  let base = B, e = E, res = 1, mults = 0;
  const rows: Cell[][] = [[bin(E), "", B, 1]], steps: GridStep[] = [];
  const parts = bin(E).split("").reverse().map((b, i) => (b === "1" ? `${B}^${1 << i}` : "")).filter(Boolean).reverse();
  const table = (hot?: number): GridStep["tables"] => [{ label: `${B}^${E}`, head: ["e", "low bit", "base", "result"], rows: rows.map((r) => r.slice()), tones: hot === undefined ? {} : { [String(hot)]: rows[hot][1] === 1 ? "ok" : "warn" } }];
  steps.push({ note: `Compute ${B}^${E}. ${E} is ${bin(E)} in binary, so ${B}^${E} = ${parts.join(" × ")}. Start with result 1 and base ${B}.`, tables: table() });
  while (e > 0) {
    const bit = e & 1, before = bin(e), used = base;
    if (bit) { res *= base; mults++; }
    base *= base; mults++; e >>= 1;
    rows.push([before, bit, used, res]);
    steps.push({ note: bit ? `Low bit of ${before} is 1: result × ${used} = ${res}. Then square the base and shift e right.` : `Low bit of ${before} is 0: skip the multiply. Just square the base and shift e right.`, tables: table(rows.length - 1) });
  }
  if (res !== B ** E) throw new Error("fast power is wrong");
  steps.push({ note: `${B}^${E} = ${res} with ${mults} multiplications instead of ${E - 1}. The loop runs once per bit: O(log n). With a modulus, take % m after every multiply.`, tone: "ok", tables: table(rows.length - 1) });
  return { kind: "grid", title: "Fast power by squaring", steps };
}

/* ---------- linked list: dummy node, insert and delete by rewiring ---------- */
type Mem = Record<string, { val: Cell; next: string }>;
const walk = (mem: Mem, from: string) => { const out: Cell[] = []; for (let p = from; p !== "null"; p = mem[p].next) out.push(mem[p].val); return out; };
const nodeTable = (mem: Mem, tones: Tones): GridTable => ({ label: "nodes in memory", head: ["node", "value", "next"], rows: Object.keys(mem).map((k) => [k, mem[k].val, mem[k].next]), tones });

function dummyFlow(): Flow {
  const mem: Mem = { dummy: { val: "-", next: "A" }, A: { val: 4, next: "B" }, B: { val: 7, next: "C" }, C: { val: 9, next: "null" } };
  const steps: GridStep[] = [];
  const row = (k: string) => Object.keys(mem).indexOf(k);
  const snap = (note: string, tones: Tones, tone?: FlowTone) => steps.push({ note, tone, tables: [nodeTable(mem, tones), { label: "list from dummy.next", rows: [walk(mem, mem.dummy.next)] }] });
  snap("A dummy node sits before the head. Now every real node has a node before it, so the head needs no special case.", { [String(row("dummy"))]: "hot" });
  // insert 5 after A
  mem.E = { val: 5, next: mem.A.next };
  snap(`Insert 5 after 4. New node E points at ${mem.E.next} first, so the rest of the list stays reachable.`, { [`${row("E")}:2`]: "hot" }, "hot");
  mem.A.next = "E";
  snap(`Then A.next = E. Two pointer writes, O(1), and nothing else moves.`, { [`${row("A")}:2`]: "ok" }, "ok");
  // delete the first real node: its previous node is the dummy
  const prev = "dummy", gone = mem[prev].next;
  snap(`Delete the head, ${mem[gone].val}. The node before it is the dummy, so this is the same code as deleting any other node.`, { [String(row(prev))]: "warn", [String(row(gone))]: "bad" }, "warn");
  mem[prev].next = mem[gone].next;
  snap(`prev.next = prev.next.next: dummy.next now skips ${gone} and points at ${mem[prev].next}. Node ${gone} is unreachable.`, { [`${row(prev)}:2`]: "ok", [String(row(gone))]: "bad" });
  snap(`Return dummy.next as the head: ${walk(mem, mem.dummy.next).join(" → ")}. Without the dummy, deleting the head would need its own if.`, { [String(row(mem.dummy.next))]: "ok" }, "ok");
  return { kind: "grid", title: "Insert and delete with a dummy node", steps };
}

function reverseFlow(): Flow {
  const mem: Mem = { A: { val: 1, next: "B" }, B: { val: 2, next: "C" }, C: { val: 3, next: "D" }, D: { val: 4, next: "null" } };
  const keys = Object.keys(mem), steps: GridStep[] = [];
  let prev = "null", cur = "A", nxt = "-";
  const ptrs = (): GridTable => ({ label: "pointers", head: ["prev", "cur", "nxt"], rows: [[prev, cur, nxt]] });
  steps.push({ note: "Reverse 1 → 2 → 3 → 4 in place with three pointers. prev starts at null and cur at the head.", tables: [nodeTable(mem, {}), ptrs(), { label: "list from head", rows: [walk(mem, "A")] }] });
  while (cur !== "null") {
    const was = cur;
    nxt = mem[cur].next;
    mem[cur].next = prev;
    const pointed = prev;
    prev = cur; cur = nxt;
    steps.push({ note: `Save nxt = ${nxt}, point ${was}.next back at ${pointed}${pointed === "null" ? ", so it becomes the tail" : ""}. Then prev = ${was} and cur = ${nxt}.`, tone: "hot",
      tables: [nodeTable(mem, { [`${keys.indexOf(was)}:2`]: "hot" }), ptrs(), { label: "reversed part, from prev", rows: [walk(mem, prev)] }] });
  }
  steps.push({ note: `cur is null, so stop. prev is the new head: ${walk(mem, prev).join(" → ")}. Each node was touched once: O(n) time, O(1) space.`, tone: "ok",
    tables: [nodeTable(mem, {}), ptrs(), { label: "list from prev", rows: [walk(mem, prev)], tones: { "0": "ok" } }] });
  return { kind: "grid", title: "Reversing a list pointer by pointer", steps };
}

/* ---------- stack: LIFO against FIFO ---------- */
function stackQueueFlow(): Flow {
  const stack: number[] = [], queue: number[] = [], outS: number[] = [], outQ: number[] = [], steps: GridStep[] = [];
  const snap = (note: string, tone?: FlowTone, popped = false) => steps.push({ note, tone, tables: [
    { label: "stack, top on the right", rows: [stack.slice()], tones: { [`0:${stack.length - 1}`]: "hot" } },
    { label: "queue, front on the left", rows: [queue.slice()], tones: { "0:0": "hot" } },
    ...(popped ? [{ label: "taken out, in order", rowHead: ["stack", "queue"], rows: [outS.slice(), outQ.slice()], tones: { [`0:${outS.length - 1}`]: "ok", [`1:${outQ.length - 1}`]: "ok" } as Tones }] : []),
  ] });
  [10, 20, 30, 40].forEach((v, i) => {
    stack.push(v); queue.push(v);
    snap(i === 0 ? `Push ${v} into a stack and into a queue. The highlighted cell is the one each would give back next.`
      : i === 3 ? `Push ${v}. Both hold ${stack.join(" ")} in the same order, but they will give items back from opposite ends.`
      : `Push ${v}. The stack adds on top, the queue at the back. The pictures still match.`);
  });
  const s1 = stack.pop()!, q1 = queue.shift()!; outS.push(s1); outQ.push(q1);
  snap(`Pop once. The stack gives ${s1}, the newest item: last in, first out. The queue gives ${q1}, the oldest: first in, first out.`, "hot", true);
  const s2 = stack.pop()!, q2 = queue.shift()!; outS.push(s2); outQ.push(q2);
  snap(`Pop again: ${s2} from the stack, ${q2} from the queue. Stacks suit undo and bracket matching; queues suit BFS and serving in arrival order. Both are O(1) with a deque.`, "ok", true);
  return { kind: "grid", title: "Stack against queue, same pushes", steps };
}

/* ---------- stack: the call stack of a recursive function ---------- */
function callStackFlow(): Flow {
  const N = 3, frames: { n: number; got: number[] }[] = [], steps: GridStep[] = [];
  let depth = 0;
  const snap = (note: string, ret?: number) => {
    const top = [...frames].reverse();
    steps.push({ note, tone: ret === undefined ? "hot" : "ok", tables: [{ label: "call stack, top first", head: ["frame", "state"],
      rows: top.map((f, i) => [`fib(${f.n})`, i === 0 ? (ret === undefined ? "running" : `returns ${ret}`) : f.got.length ? `has ${f.got[0]}, needs fib(${f.n - 2})` : `needs fib(${f.n - 1})`]),
      tones: { "0": ret === undefined ? "hot" : "ok" } }] });
  };
  const fib = (n: number): number => {
    frames.push({ n, got: [] }); depth = Math.max(depth, frames.length);
    let r: number;
    if (n < 2) { r = n; snap(`fib(${n}) is a base case: it returns ${n} at once, and its frame is popped.`, r); }
    else {
      snap(frames.length === 1 ? `Call fib(${n}). A frame for it goes on the stack, holding n and where to resume. It needs fib(${n - 1}) first.` : `fib(${n}) is called: a new frame on top. The frames below wait, paused mid-line.`);
      const a = fib(n - 1); frames.at(-1)!.got.push(a);
      const b = fib(n - 2); frames.at(-1)!.got.push(b);
      r = a + b;
      snap(`fib(${n}) now has ${a} and ${b}, so it returns ${r} to the frame below and is popped.`, r);
    }
    frames.pop();
    return r;
  };
  const out = fib(N);
  steps[steps.length - 1].note += ` Answer ${out}. The stack never held more than ${depth} frames: recursion costs O(depth) memory.`;
  return { kind: "grid", title: "The call stack of a recursive function", steps };
}

/* ---------- recursion: the call tree, with and without a memo ---------- */
function memoFlow(): Flow {
  const N = 5, label = (k: number) => `f(${k})`;
  const levels: number[][] = [];
  for (let cur = [N]; cur.length; cur = cur.flatMap((k) => (k < 2 ? [] : [k - 1, k - 2]))) levels.push(cur);
  const width = Math.max(...levels.map((l) => l.length));
  const tree = (upTo: number): GridTable => {
    const shown = levels.slice(0, upTo), seen = new Map<number, number>();
    for (const k of shown.flat()) seen.set(k, (seen.get(k) ?? 0) + 1);
    const tones: Tones = {};
    shown.forEach((l, r) => l.forEach((k, c) => { if (k >= 2 && seen.get(k)! > 1) tones[`${r}:${c}`] = "warn"; }));
    return { label: "calls, level by level", rows: shown.map((l) => padTo(l.map(label), width)), tones };
  };
  const plainCalls = (n: number) => { let c = 0; const f = (k: number): number => (c++, k < 2 ? k : f(k - 1) + f(k - 2)); f(n); return c; };
  const memoTrace = (n: number) => {
    const memo = new Map<number, number>(), calls: { k: number; d: number; hit: boolean }[] = [];
    const f = (k: number, d: number): number => {
      const hit = memo.has(k); calls.push({ k, d, hit });
      if (hit) return memo.get(k)!;
      const v = k < 2 ? k : f(k - 1, d + 1) + f(k - 2, d + 1);
      memo.set(k, v); return v;
    };
    f(n, 0); return calls;
  };
  const trace = memoTrace(N), mLevels: { k: number; hit: boolean }[][] = [];
  for (const c of trace) (mLevels[c.d] ??= []).push(c);
  const mWidth = Math.max(...mLevels.map((l) => l.length)), mTones: Tones = {};
  mLevels.forEach((l, r) => l.forEach((c, i) => { if (c.hit) mTones[`${r}:${i}`] = "ok"; }));
  const repeats = (upTo: number) => { const m = new Map<number, number>(); for (const k of levels.slice(0, upTo).flat()) m.set(k, (m.get(k) ?? 0) + 1); return [...m].filter(([k, v]) => k >= 2 && v > 1).map(([k, v]) => `${label(k)} ${v} times`); };
  const total = plainCalls(N), ns = [10, 15, 20, 25];
  return { kind: "grid", title: "A recursion tree, with and without a memo", steps: [
    { note: `fib(${N}) calls fib(${N - 1}) and fib(${N - 2}). Every call that is not a base case splits into two more.`, tables: [tree(2)] },
    { note: `One level down, work repeats already: ${repeats(3).join(", ")}. Each repeat recomputes its whole subtree.`, tone: "warn", tables: [tree(3)] },
    { note: `The whole tree: ${total} calls for fib(${N}), and ${repeats(levels.length).join(", ")}. It grows exponentially with n.`, tone: "bad", tables: [tree(levels.length)] },
    { note: `With a memo, each answer is stored the first time. A repeat call is a lookup, marked hit, and goes no deeper: ${trace.length} calls in all.`, tone: "ok",
      tables: [{ label: "calls with a memo", rows: mLevels.map((l) => padTo(l.map((c) => (c.hit ? `${label(c.k)} hit` : label(c.k))), mWidth)), tones: mTones }] },
    { note: `Real call counts from running both versions. Without the memo they explode; with it they grow by 2 per step of n. Exponential becomes O(n).`, tone: "ok",
      tables: [{ label: "calls made", head: ["n", "no memo", "memo"], rows: ns.map((n) => [n, plainCalls(n).toLocaleString("en-US"), memoTrace(n).length]), tones: { ":1": "bad", ":2": "ok" } }] },
  ] };
}

/* ---------- backtracking: choose, explore, un-choose on subsets ---------- */
function subsetsFlow(): Flow {
  const nums = [1, 2, 3], path: number[] = [], found: string[] = [], steps: GridStep[] = [];
  let log: string[] = [];
  const show = (p: number[]) => `[${p.join(",")}]`;
  const snap = (note: string, tone?: FlowTone) => {
    const cells = padTo(found, 8), rows = [cells.slice(0, 4), cells.slice(4)], last = found.length - 1;
    steps.push({ note, tone, tables: [
      { label: "path", head: nums.map((_, i) => `depth ${i + 1}`), rows: [padTo(path, nums.length)], tones: path.length ? { [`0:${path.length - 1}`]: "hot" } : {} },
      { label: "subsets recorded", rows, tones: last >= 0 ? { [`${Math.floor(last / 4)}:${last % 4}`]: "ok" } : {} },
    ] });
  };
  const bt = (start: number) => {
    found.push(show(path));
    snap(log.length ? `${cap1(log.join(", "))}. The path is ${show(path)}: record it, then explore from there.` : `Start with an empty path. Every node of the search is a subset, so record ${show(path)} first.`);
    log = [];
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]); log.push(`choose ${nums[i]}`);
      bt(i + 1);
      path.pop(); log.push(`un-choose ${nums[i]}`);
    }
  };
  bt(0);
  snap(`${cap1(log.join(", "))}: back to an empty path. ${found.length} subsets, 2^${nums.length}. Every choose had its un-choose, so the shared path was always correct.`, "ok");
  return { kind: "grid", title: "Backtracking: choose, explore, un-choose", steps };
}

export const FLOWS: Record<string, Flow> = {
  "dsa-array-grow": growFlow(),
  "dsa-array-insert": insertFlow(),
  "dsa-string-concat": concatFlow(),
  "dsa-string-count": countFlow(),
  "dsa-logic-spiral": spiralFlow(),
  "dsa-logic-simulate": lifeFlow(),
  "dsa-bit-twos": twosFlow(),
  "dsa-bit-fastpow": powFlow(),
  "dsa-linkedlist-dummy": dummyFlow(),
  "dsa-linkedlist-reverse": reverseFlow(),
  "dsa-stack-vs-queue": stackQueueFlow(),
  "dsa-stack-callstack": callStackFlow(),
  "dsa-recursion-memo": memoFlow(),
  "dsa-recursion-subsets": subsetsFlow(),
};
/** topic id -> flow ids shown under "See it move" on that topic's Overview, in order. */
export const PLACES: Record<string, string[]> = {
  array: ["dsa-array-grow", "dsa-array-insert"],
  string: ["dsa-string-concat", "dsa-string-count"],
  "logic-to-code": ["dsa-logic-spiral", "dsa-logic-simulate"],
  "bit-and-math": ["dsa-bit-twos", "dsa-bit-fastpow"],
  linkedlist: ["dsa-linkedlist-dummy", "dsa-linkedlist-reverse"],
  stack: ["dsa-stack-vs-queue", "dsa-stack-callstack"],
  "recursion-backtracking": ["dsa-recursion-memo", "dsa-recursion-subsets"],
};

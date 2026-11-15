// Interactive walk-throughs for /patterns (see flows-play.ts): each runs the real algorithm on the learner's values.
import { PlayError, type PlayFlow } from "./flows-play-types.ts";
import type { Flow, FlowTone, GridStep, GridTable } from "./flows.ts";

type Tones = Record<string, FlowTone>;
type Cell = string | number;
type V = Record<string, number>;
/** One fixed, readable example: every array flow cuts it to the chosen length, so the same settings give the same run. */
const BASE = [3, 8, 1, 6, 4, 9, 2, 7, 5];
const idx = (n: number) => Array.from({ length: n }, (_, i) => String(i));
const padTo = (row: Cell[], n: number): Cell[] => [...row, ...Array(Math.max(0, n - row.length)).fill("")];
const span = (a: number, b: number, tone: FlowTone, row = 0): Tones => Object.fromEntries(Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => [`${row}:${a + i}`, tone]));
/** At most `max` steps: keeps the opening and closing ones and says how many were skipped in between. */
function fit(steps: GridStep[], max = 10, head = 3): GridStep[] {
  if (steps.length <= max) return steps;
  const gone = steps.length - max + 1, tail = steps.slice(steps.length - (max - head - 1));
  const gap = steps[head + gone - 1];
  return [...steps.slice(0, head), { ...gap, note: `${gone - 1} similar step${gone > 2 ? "s" : ""} skipped. ${gap.note}` }, ...tail];
}

/* ---------- array Overview: deleting at an index shifts the tail left ---------- */
function arrayDelete({ n, i }: V): Flow {
  if (i >= n) throw new PlayError(`Index ${i} is past the end: ${n} items use indices 0 to ${n - 1}. Pick a smaller index or a longer array.`);
  const a: Cell[] = BASE.slice(0, n), x = a[i], steps: GridStep[] = [];
  let size = n, moves = 0;
  const snap = (note: string, tones: Tones, tone?: FlowTone, extra: GridTable[] = []) =>
    steps.push({ note, tone, tables: [{ label: `array, size ${size}`, head: idx(n), rows: [a.slice()], tones }, ...extra] });
  snap(`Delete index ${i}, which holds ${x}. An array has no gaps, so every item after it must move one place left.`, { [`0:${i}`]: "bad" }, "warn");
  for (let j = i; j < n - 1; j++) {
    a[j] = a[j + 1]; moves++;
    snap(moves === 1 ? `Move ${a[j]} from index ${j + 1} to ${j}, overwriting ${x}. Go left to right, so each item is copied before its old slot is reused.` : `Move ${a[j]} from index ${j + 1} to ${j}.`, { [`0:${j}`]: "warn" });
  }
  a[n - 1] = ""; size--;
  snap(`The last slot is spare now, so the size drops to ${size}. That took ${moves} move${moves === 1 ? "" : "s"}: n - 1 - i = ${n} - 1 - ${i}.`, {}, "ok");
  snap(`Moves = n - 1 - i. Deleting the last item is free; deleting the first moves all ${n - 1} others. So delete inside an array is O(n).`, {}, "ok",
    [{ label: "moves to delete at", head: ["index", "moves"], rows: [[`last (${n - 1})`, 0], [`yours (${i})`, n - 1 - i], ["first (0)", n - 1]], tones: { "0:1": "ok", "2:1": "bad", "1": "hot" } }]);
  return { kind: "grid", title: `Deleting index ${i} from ${n} items`, steps: fit(steps) };
}

/* ---------- array pattern 3: fixed-size sliding window ---------- */
function slidingWindow({ n, k }: V): Flow {
  if (k > n) throw new PlayError(`A window of ${k} does not fit in ${n} items. Make k at most the length.`);
  const a = BASE.slice(0, n), steps: GridStep[] = [];
  let sum = a.slice(0, k).reduce((s, v) => s + v, 0), best = sum, at = 0;
  const snap = (note: string, tones: Tones, tone?: FlowTone) => steps.push({ note, tone, tables: [
    { label: `window of ${k}`, head: idx(n), rows: [a], tones }, { head: ["window sum", "best"], rows: [[sum, best]] }] });
  snap(`Add up the first window, indices 0 to ${k - 1}: ${a.slice(0, k).join(" + ")} = ${sum}. That is the best so far.`, span(0, k - 1, "hot"));
  for (let r = k; r < n; r++) {
    const before = sum;
    sum += a[r] - a[r - k];
    const better = sum > best;
    if (better) { best = sum; at = r - k + 1; }
    snap(`Slide right: add ${a[r]}, drop ${a[r - k]}. ${before} + ${a[r]} - ${a[r - k]} = ${sum}. ${better ? "A new best." : `The best stays ${best}.`}`,
      { ...span(r - k + 1, r, "hot"), [`0:${r - k}`]: "bad" }, better ? "hot" : undefined);
  }
  snap(`Best window: indices ${at} to ${at + k - 1}, sum ${best}. Each slide was one add and one subtract, so O(n) instead of O(n × k).`, span(at, at + k - 1, "ok"), "ok");
  return { kind: "grid", title: `Largest sum of ${k} in a row`, steps };
}

/* ---------- array pattern 7: binary search ---------- */
const SORTED = [2, 5, 8, 12, 16, 23, 38, 56, 72];
function binarySearch({ n, t }: V): Flow {
  const a = SORTED.slice(0, n), steps: GridStep[] = [];
  let lo = 0, hi = n - 1, checks = 0;
  const snap = (note: string, tones: Tones, mid: Cell, tone?: FlowTone) => steps.push({ note, tone, tables: [
    { label: "sorted array", head: idx(n), rows: [a], tones }, { head: ["lo", "mid", "hi"], rows: [[lo, mid, hi]] }] });
  const out = (): Tones => Object.fromEntries(a.map((_, j) => [`0:${j}`, "bad" as FlowTone]).filter(([j]) => +j.slice(2) < lo || +j.slice(2) > hi));
  snap(`Look for ${t}. Start with lo = 0 and hi = ${n - 1}: the whole array. Each check halves what is left.`, span(0, n - 1, "hot"), "-");
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    checks++;
    if (a[mid] === t) { snap(`a[${mid}] = ${t}: found it after ${checks} check${checks > 1 ? "s" : ""}. A linear scan could take up to ${n}; binary search takes at most ${Math.floor(Math.log2(n)) + 1}.`, { ...out(), [`0:${mid}`]: "ok" }, mid, "ok"); break; }
    const less = a[mid] < t;
    snap(less ? `mid = (${lo} + ${hi}) / 2 = ${mid}. a[${mid}] = ${a[mid]} is less than ${t}, so ${t} can only be to the right: lo = ${mid + 1}.`
      : `mid = (${lo} + ${hi}) / 2 = ${mid}. a[${mid}] = ${a[mid]} is more than ${t}, so ${t} can only be to the left: hi = ${mid - 1}.`, { ...out(), [`0:${mid}`]: "hot" }, mid);
    if (less) lo = mid + 1; else hi = mid - 1;
  }
  if (lo > hi) snap(`lo = ${lo} passed hi = ${hi}, so the range is empty: ${t} is not in the array. lo is where it would be inserted. ${checks} checks, O(log n).`, out(), "-", "warn");
  return { kind: "grid", title: `Binary search for ${t}`, steps };
}

/* ---------- string Overview: comparing two strings character by character ---------- */
const FIRST = "planet", SECOND = ["plane", "planet", "planetary", "plank", "place", "plate", "plan"];
function strCompare({ w }: V): Flow {
  const s = FIRST, t = SECOND[w - 1], L = Math.max(s.length, t.length), steps: GridStep[] = [];
  const rows = [padTo([...s], L), padTo([...t], L)];
  const snap = (note: string, tones: Tones, tone?: FlowTone) => steps.push({ note, tone, tables: [{ head: idx(L), rowHead: [s, t], rows, tones }] });
  snap(`Compare "${s}" with "${t}" the way compareTo and < do: walk both from index 0 until two characters differ or a word ends.`, {});
  const ok = (i: number): Tones => ({ ...span(0, i - 1, "ok", 0), ...span(0, i - 1, "ok", 1) });
  let i = 0;
  for (; i < Math.min(s.length, t.length) && s[i] === t[i]; i++)
    snap(`Index ${i}: '${s[i]}' and '${t[i]}' match, so nothing is decided yet. Move on.`, { ...ok(i), [`:${i}`]: "hot" });
  let verdict: string, diff: number;
  if (i < Math.min(s.length, t.length)) {
    diff = s.charCodeAt(i) - t.charCodeAt(i);
    verdict = `Index ${i}: '${s[i]}' (${s.charCodeAt(i)}) against '${t[i]}' (${t.charCodeAt(i)}). The first difference decides: "${diff < 0 ? s : t}" comes first. Java's compareTo returns ${s.charCodeAt(i)} - ${t.charCodeAt(i)} = ${diff}.`;
    snap(verdict, { ...ok(i), [`:${i}`]: "bad" }, "warn");
  } else {
    diff = s.length - t.length;
    verdict = diff === 0 ? `Both words end together and every character matched, so they are equal: compareTo returns 0 and equals is true.`
      : `"${diff < 0 ? s : t}" ran out first with every character matching, so the shorter word comes first. compareTo returns the length difference ${s.length} - ${t.length} = ${diff}.`;
    snap(verdict, ok(i), diff === 0 ? "ok" : "warn");
  }
  snap(`${diff === 0 ? `"${s}" equals "${t}"` : diff < 0 ? `"${s}" < "${t}"` : `"${s}" > "${t}"`} after ${Math.min(i + 1, L)} position${i ? "s" : ""}. A comparison costs O(min(m, n)), so sorting strings costs more than sorting numbers.`, ok(i), "ok");
  return { kind: "grid", title: `"${s}" against "${t}"`, steps: fit(steps) };
}

/* ---------- string pattern 4: expand around a centre ---------- */
const PAL = "xabbacabb";
function palindrome({ c }: V): Flow {
  const s = PAL, n = s.length, odd = Number.isInteger(c), steps: GridStep[] = [];
  let l = odd ? c - 1 : c - 0.5, r = odd ? c + 1 : c + 0.5;
  const grid = (tones: Tones): GridTable[] => [{ head: idx(n), rows: [[...s]], tones }];
  const inside = (): Tones => (r - l > 1 ? span(l + 1, r - 1, "ok") : {});
  steps.push({ note: odd ? `Centre on '${s[c]}' at index ${c}. One letter is a palindrome, so compare its neighbours next: l = ${l}, r = ${r}.`
    : `Centre between indices ${l} and ${r}. An even palindrome has no middle letter, so its first pair is s[${l}] and s[${r}].`, tables: grid(odd ? { [`0:${c}`]: "ok" } : {}) });
  for (;;) {
    if (l < 0 || r >= n) { steps.push({ note: `${l < 0 ? "l" : "r"} would step off the string, so stop growing here.`, tone: "warn", tables: grid(inside()) }); break; }
    if (s[l] !== s[r]) { steps.push({ note: `s[${l}] = '${s[l]}' but s[${r}] = '${s[r]}': they differ, so the palindrome cannot grow past them.`, tone: "bad", tables: grid({ ...inside(), [`0:${l}`]: "bad", [`0:${r}`]: "bad" }) }); break; }
    steps.push({ note: `s[${l}] = s[${r}] = '${s[l]}', so "${s.slice(l, r + 1)}" is a palindrome. Grow one more on each side.`, tone: "hot", tables: grid({ ...span(l + 1, r - 1, "ok"), [`0:${l}`]: "hot", [`0:${r}`]: "hot" }) });
    l--; r++;
  }
  const got = s.slice(l + 1, r);
  const expand = (a: number, b: number) => { while (a >= 0 && b < n && s[a] === s[b]) { a--; b++; } return s.slice(a + 1, b); };
  const best = Array.from({ length: n }, (_, i) => [expand(i, i), expand(i, i + 1)]).flat().reduce((x, y) => (y.length > x.length ? y : x));
  steps.push({ note: `${got ? `The longest palindrome at this centre is "${got}", length ${got.length}.` : "No palindrome sits on this centre."} Trying all ${2 * n - 1} centres this way is O(n²) and finds "${best}" as the longest.`, tone: "ok", tables: grid(got ? span(l + 1, r - 1, "ok") : {}) });
  return { kind: "grid", title: `Expanding around ${odd ? `index ${c}` : `the gap after index ${c - 0.5}`}`, steps };
}

/* ---------- string pattern 3: anagrams of a pattern with a sliding count window ---------- */
const HAY = "cbaebabac", PATS = ["ab", "abc", "bae", "aab"];
function anagrams({ p: pick }: V): Flow {
  const s = HAY, p = PATS[pick - 1], m = p.length, letters = [...new Set(s + p)].sort(), steps: GridStep[] = [];
  const need = new Map(letters.map((ch) => [ch, 0])), win = new Map(letters.map((ch) => [ch, 0])), found: number[] = [];
  for (const ch of p) need.set(ch, need.get(ch)! + 1);
  const same = () => letters.every((ch) => need.get(ch) === win.get(ch));
  const snap = (note: string, at: number, tone?: FlowTone) => {
    const tones: Tones = at < 0 ? {} : span(at, at + m - 1, same() ? "ok" : "hot");
    for (const f of found) if (f !== at) tones[`0:${f}`] = "ok";
    const ct: Tones = {};
    letters.forEach((ch, j) => { ct[`1:${j}`] = need.get(ch) === win.get(ch) ? "ok" : "warn"; });
    steps.push({ note, tone, tables: [{ head: idx(s.length), rows: [[...s]], tones },
      { label: "letter counts", head: letters, rowHead: ["need", "window"], rows: [letters.map((ch) => need.get(ch)!), letters.map((ch) => win.get(ch)!)], tones: at < 0 ? {} : ct }] });
  };
  snap(`Count the letters of "${p}". A window of ${m} letters is an anagram exactly when its counts match these.`, -1);
  for (let i = 0; i < s.length; i++) {
    win.set(s[i], win.get(s[i])! + 1);
    if (i >= m) win.set(s[i - m], win.get(s[i - m])! - 1);
    if (i < m - 1) continue;
    const st = i - m + 1, hit = same();
    if (hit) found.push(st);
    const why = hit ? `Counts match, so index ${st} starts an anagram.` : `Counts differ at ${letters.filter((ch) => need.get(ch) !== win.get(ch)).map((ch) => `'${ch}'`).join(" and ")}.`;
    snap(st === 0 ? `First window "${s.slice(0, m)}". ${why}` : `Slide: add '${s[i]}', drop '${s[st - 1]}'. Window "${s.slice(st, i + 1)}". ${why}`, st, hit ? "ok" : undefined);
  }
  snap(`${found.length ? `Anagrams of "${p}" start at ${found.join(", ")}.` : `No window is an anagram of "${p}".`} Each slide changes two counts, so O(n) time and 26 slots of space.`, -1, "ok");
  return { kind: "grid", title: `Anagrams of "${p}" in "${s}"`, steps };
}

/* ---------- logic to code Overview: a matrix stored row by row ---------- */
function rowMajor({ r, c }: V): Flow {
  const N = r * c, M = Array.from({ length: r }, (_, i) => Array.from({ length: c }, (_, j) => String.fromCharCode(97 + i * c + j)));
  const flat: Cell[] = Array(N).fill(""), steps: GridStep[] = [];
  const chunks = (tones: Tones): GridTable[] => Array.from({ length: Math.ceil(N / 8) }, (_, q) => {
    const a = q * 8, b = Math.min(N, a + 8), t: Tones = {};
    for (let k = a; k < b; k++) if (tones[k]) t[`0:${k - a}`] = tones[k];
    return { label: `memory, slots ${a} to ${b - 1}`, head: idx(b).slice(a), rows: [flat.slice(a, b)], tones: t };
  });
  const snap = (note: string, mt: Tones, ft: Tones, tone?: FlowTone) => steps.push({ note, tone, tables: [{ label: "matrix", head: idx(c), rowHead: idx(r).map((x) => `row ${x}`), rows: M, tones: mt }, ...chunks(ft)] });
  snap(`A ${r} × ${c} matrix is one block of ${N} slots in memory. Row-major order lays it out a whole row at a time.`, {}, {});
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) flat[i * c + j] = M[i][j];
    const ft: Record<number, FlowTone> = {};
    for (let k = 0; k < (i + 1) * c; k++) ft[k] = k >= i * c ? "hot" : "ok";
    snap(`Row ${i} goes into slots ${i * c} to ${i * c + c - 1}: slot = row × ${c} + col, so (${i}, 0) lands at ${i} × ${c} + 0 = ${i * c}.`, { ...span(0, c - 1, "hot", i), ...Object.fromEntries(Array.from({ length: i }, (_, q) => [String(q), "ok" as FlowTone])) }, ft as Tones, "hot");
  }
  const pr = r - 1, pc = Math.min(1, c - 1), k = pr * c + pc;
  snap(`Look up (${pr}, ${pc}): slot ${pr} × ${c} + ${pc} = ${k}. Back again: row = ${k} / ${c} = ${pr}, col = ${k} % ${c} = ${pc}. Walking row by row reads memory in order, the fast way.`, { [`${pr}:${pc}`]: "ok" }, { [k]: "ok" } as Tones, "ok");
  return { kind: "grid", title: `A ${r} × ${c} matrix in row-major order`, steps };
}

/* ---------- logic to code pattern 1: spiral order with four boundaries ---------- */
function spiral({ r: R, c: C }: V): Flow {
  const M = Array.from({ length: R }, (_, i) => Array.from({ length: C }, (_, j) => i * C + j + 1)), steps: GridStep[] = [];
  let top = 0, bottom = R - 1, left = 0, right = C - 1;
  const seen: [number, number][] = [], order: number[] = [];
  const snap = (note: string, cur: [number, number][], moved: string, tone?: FlowTone) => {
    const tones: Tones = {};
    for (const [a, b] of seen) tones[`${a}:${b}`] = "ok";
    for (const [a, b] of cur) tones[`${a}:${b}`] = "hot";
    steps.push({ note, tone, tables: [{ label: "matrix", rows: M, tones },
      { label: "boundaries", head: ["top", "bottom", "left", "right"], rows: [[top, bottom, left, right]], tones: moved ? { [`0:${["top", "bottom", "left", "right"].indexOf(moved)}`]: "hot" } : {} }] });
    seen.push(...cur); order.push(...cur.map(([a, b]) => M[a][b]));
  };
  snap(`Four boundaries fence off what is still unread: top = 0, bottom = ${R - 1}, left = 0, right = ${C - 1}. Walk round the fence, then pull in the side you finished.`, [], "");
  const side = (cells: [number, number][], what: string, moved: string, after: () => void) => {
    if (!cells.length) return;
    after();
    snap(`${what}: ${cells.map(([a, b]) => M[a][b]).join(" ")}. That side is done, so ${moved} moves in.`, cells, moved);
  };
  const run = (a: number, b: number) => (a <= b ? Array.from({ length: b - a + 1 }, (_, q) => a + q) : Array.from({ length: a - b + 1 }, (_, q) => a - q));
  while (top <= bottom && left <= right) {
    side(run(left, right).map((j) => [top, j]), "Top row, left to right", "top", () => top++);
    side(top <= bottom ? run(top, bottom).map((i) => [i, right]) : [], "Right column, downwards", "right", () => right--);
    side(top <= bottom && left <= right ? run(right, left).map((j) => [bottom, j]) : [], "Bottom row, right to left", "bottom", () => bottom--);
    side(left <= right && top <= bottom ? run(bottom, top).map((i) => [i, left]) : [], "Left column, upwards", "left", () => left++);
  }
  steps.push({ note: `The fences crossed, so stop. All ${R * C} cells read once, in spiral order: O(rows × cols) time and no visited array.`, tone: "ok", tables: [{ label: "matrix", rows: M, tones: Object.fromEntries(M.flatMap((row, i) => row.map((_, j) => [`${i}:${j}`, "ok" as FlowTone]))) }] });
  return { kind: "grid", title: `Spiral order of a ${R} × ${C} matrix`, steps: fit(steps) };
}

/* ---------- logic to code pattern 2: rotate by transpose, then reverse each row ---------- */
function rotate({ n }: V): Flow {
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i * n + j + 1)), orig = M.map((row) => row.slice()), steps: GridStep[] = [];
  const snap = (note: string, tones: Tones, tone?: FlowTone) => steps.push({ note, tone, tables: [{ label: "matrix", rows: M.map((row) => row.slice()), tones }] });
  snap(`Turn this ${n} × ${n} matrix 90° clockwise in place, with no second matrix: first transpose, then reverse every row.`, Object.fromEntries(Array.from({ length: n }, (_, i) => [`${i}:${i}`, "hot" as FlowTone])));
  for (let i = 0; i < n - 1; i++) {
    const tones: Tones = {};
    for (let j = i + 1; j < n; j++) { [M[i][j], M[j][i]] = [M[j][i], M[i][j]]; tones[`${i}:${j}`] = "hot"; tones[`${j}:${i}`] = "hot"; }
    snap(`Transpose: swap (${i}, j) with (j, ${i}) for j = ${i + 1} to ${n - 1}. Only cells right of the diagonal start a swap, or each pair would swap back.`, tones, "hot");
  }
  for (const row of M) row.reverse();
  snap(`Now reverse each row: column 0 trades with column ${n - 1}${n > 3 ? ", column 1 with column " + (n - 2) : ""}, and so on.`, { ":0": "warn", [`:${n - 1}`]: "warn" }, "warn");
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (M[j][n - 1 - i] !== orig[i][j]) throw new Error("rotation is wrong");
  snap(`Done: the value at (r, c) moved to (c, ${n - 1} - r), a 90° clockwise turn. O(n²) time, O(1) extra space. Anticlockwise is reverse the rows first, then transpose.`, Object.fromEntries(Array.from({ length: n }, (_, j) => [`0:${j}`, "ok" as FlowTone])), "ok");
  return { kind: "grid", title: `Rotating a ${n} × ${n} matrix`, steps };
}

/* ---------- bits Overview: test, set, clear and toggle bit i ---------- */
function bitOps({ x, i }: V): Flow {
  const bits = (v: number) => Array.from({ length: 8 }, (_, q) => (v >> (7 - q)) & 1), head = idx(8).reverse(), col = 7 - i, m = 1 << i;
  const t = (rows: [string, number][], hot: Record<number, FlowTone> = {}): GridTable[] => [{ head, rowHead: rows.map(([h]) => h), rows: rows.map(([, v]) => bits(v)),
    tones: { [`:${col}`]: "hot", ...Object.fromEntries(Object.entries(hot).map(([r, tn]) => [r, tn])) } }];
  const has = (x & m) !== 0, notM = ~m & 255;
  return { kind: "grid", title: `Bit ${i} of ${x}`, steps: [
    { note: `${x} in 8 bits. Bit i is worth 2^i and is counted from 0 on the right, so bit ${i} is worth ${m}.`, tables: t([[`${x}`, x]]) },
    { note: `The mask 1 << ${i} = ${m} has a single 1, at bit ${i}. Every operation below combines x with it, and the out row shows the result.`, tables: t([["x", x], ["mask", m]], { 1: "hot" }) },
    { note: `Test: x & mask = ${x & m}, ${has ? "not 0, so bit " + i + " is set" : "so bit " + i + " is clear"}. AND keeps only the bits both have.`, tone: "hot", tables: t([["x", x], ["mask", m], ["out", x & m]], { 2: has ? "ok" : "warn" }) },
    { note: `Set: x | mask = ${x | m}. ${has ? "Bit " + i + " was already 1, so nothing changes." : "Bit " + i + " becomes 1 and the rest stay."}`, tables: t([["x", x], ["mask", m], ["out", x | m]], { 2: "ok" }) },
    { note: `Clear: x & ~mask = ${x & notM}. ~mask is all ones except bit ${i}, so only that bit is forced to 0.`, tables: t([["x", x], ["~mask", notM], ["out", x & notM]], { 2: "ok" }) },
    { note: `Toggle: x ^ mask = ${x ^ m}. XOR flips bit ${i} and leaves the others. Each of these is one O(1) instruction.`, tone: "ok", tables: t([["x", x], ["mask", m], ["out", x ^ m]], { 2: "ok" }) },
  ] };
}

/* ---------- bits pattern 8: fast exponentiation modulo m ---------- */
function modPow({ a, e, m }: V): Flow {
  const bin = e.toString(2), B = bin.length, steps: GridStep[] = [];
  const bitRow: Cell[] = [...bin].reverse().map(Number), pow: Cell[] = Array(B).fill(""), res: Cell[] = Array(B).fill("");
  let base = a % m, r = 1 % m, mults = 0;
  const snap = (note: string, k: number, tone?: FlowTone) => steps.push({ note, tone, tables: [{ label: "bits of the exponent, lowest first", head: Array.from({ length: B }, (_, q) => `2^${q}`),
    rowHead: ["bit", "base", "result"], rows: [bitRow, pow.slice(), res.slice()], tones: k < 0 ? {} : { [`:${k}`]: bitRow[k] ? "ok" : "warn" } }] });
  snap(`${e} is ${bin} in binary, so ${a}^${e} multiplies ${a}^(2^k) for each 1 bit. Start with result = 1 and base = ${a} mod ${m} = ${base}.`, -1);
  for (let k = 0, x = e; x > 0; k++, x >>= 1) {
    pow[k] = base;
    const was = r;
    if (x & 1) { r = (r * base) % m; mults++; }
    res[k] = r;
    const nb = (base * base) % m;
    snap(x & 1 ? `Bit ${k} is 1: result = ${was} × ${base} mod ${m} = ${r}. Then square the base: ${base}² mod ${m} = ${nb}.`
      : `Bit ${k} is 0: skip the multiply. Square the base: ${base}² mod ${m} = ${nb}.`, k, x & 1 ? "hot" : undefined);
    base = nb; mults++;
  }
  let check = 1 % m;
  for (let q = 0; q < e; q++) check = (check * a) % m;
  if (check !== r) throw new Error("fast power is wrong");
  snap(`${a}^${e} mod ${m} = ${r}, using ${mults} multiplications instead of ${e - 1}. Taking mod after each one keeps numbers small. O(log e).`, B - 1, "ok");
  return { kind: "grid", title: `${a}^${e} mod ${m} by squaring`, steps };
}

/* ---------- bits pattern 7: the sieve of Eratosthenes ---------- */
function sieve({ n }: V): Flow {
  const W = 8, prime = Array(n + 1).fill(true), steps: GridStep[] = [];
  prime[0] = prime[1] = false;
  const nums = Array.from({ length: n }, (_, q) => q + 1);
  const rows = Array.from({ length: Math.ceil(n / W) }, (_, q) => padTo(nums.slice(q * W, q * W + W), W));
  const at = (v: number) => `${Math.floor((v - 1) / W)}:${(v - 1) % W}`;
  const crossed = new Set<number>([1]), known: number[] = [];
  const snap = (note: string, fresh: number[], p: number, tone?: FlowTone) => {
    const tones: Tones = {};
    for (const v of crossed) tones[at(v)] = "bad";
    for (const v of fresh) tones[at(v)] = "warn";
    for (const v of known) tones[at(v)] = "ok";
    if (p) tones[at(p)] = "hot";
    steps.push({ note, tone, tables: [{ label: `1 to ${n}`, rows, tones }] });
  };
  snap(`Start with every number from 2 to ${n} marked prime. 1 is not prime. Only primes up to √${n} ≈ ${Math.sqrt(n).toFixed(1)} need to cross anything out.`, [], 0);
  for (let p = 2; p * p <= n; p++) {
    if (!prime[p]) continue;
    const fresh: number[] = [];
    for (let q = p * p; q <= n; q += p) { if (prime[q]) fresh.push(q); prime[q] = false; }
    snap(`${p} is still marked, so it is prime. Cross out its multiples from ${p}² = ${p * p}, since smaller ones were crossed by smaller primes: ${fresh.length} new.`, fresh, p, "hot");
    fresh.forEach((v) => crossed.add(v)); known.push(p);
  }
  for (let v = 2; v <= n; v++) if (prime[v]) known.push(v);
  const all = [...new Set(known)];
  snap(`The next prime squared is past ${n}, so stop. Everything still marked is prime: ${all.length} primes up to ${n}. The sieve runs in O(n log log n).`, [], 0, "ok");
  return { kind: "grid", title: `Primes up to ${n}`, steps };
}

/* ---------- linked list Overview: walk to a position, then insert ---------- */
type Node = { val: Cell; next: Node | null };
const build = (vals: Cell[]): Node | null => vals.reduceRight<Node | null>((next, val) => ({ val, next }), null);
const list = (h: Node | null, cap = 12) => { const out: Node[] = []; for (let p = h; p && out.length < cap; p = p.next) out.push(p); return out; };
function llInsert({ len, pos }: V): Flow {
  if (pos > len) throw new PlayError(`A list of ${len} nodes takes positions 0 to ${len}. Pick a smaller position or a longer list.`);
  const X = 10, dummy: Node = { val: "D", next: build(BASE.slice(0, len)) }, steps: GridStep[] = [];
  const snap = (note: string, at: Node | null, tone?: FlowTone, extra: GridTable[] = [], hot?: Node) => {
    const nodes = list(dummy), tones: Tones = {};
    nodes.forEach((nd, q) => { if (nd === at) tones[`0:${q}`] = "hot"; if (nd === hot) tones[`0:${q}`] = "ok"; });
    steps.push({ note, tone, tables: [{ label: "list from the dummy node D", head: ["", ...idx(nodes.length - 1)], rows: [nodes.map((nd) => nd.val)], tones }, ...extra] });
  };
  let prev = dummy;
  snap(`Insert ${X} at position ${pos}. A list has no index, so walk a pointer prev from the dummy node D to the node before position ${pos}.`, prev);
  for (let k = 0; k < pos; k++) {
    prev = prev.next!;
    snap(`prev = prev.next: now on ${prev.val}, at position ${k}. ${pos - k - 1 ? `${pos - k - 1} more to go.` : "This is the node before the spot."}`, prev);
  }
  const node: Node = { val: X, next: prev.next };
  snap(`Make the new node and point it at prev.next (${node.next ? node.next.val : "null"}) first, so the rest of the list stays reachable.`, prev, "hot", [{ label: "new node", head: ["value", "next"], rows: [[X, node.next ? String(node.next.val) : "null"]], tones: { "0:1": "hot" } }]);
  prev.next = node;
  snap(`Then prev.next = the new node. Two pointer writes, O(1), and nothing shifts; the walk of ${pos} step${pos === 1 ? "" : "s"} is the O(n) part.`, null, "ok", [], node);
  return { kind: "grid", title: `Inserting ${X} at position ${pos}`, steps };
}

/* ---------- linked list pattern 1: Floyd's fast and slow pointers ---------- */
function floyd({ n, j }: V): Flow {
  if (j >= n) throw new PlayError(`The list has ${n} nodes, indices 0 to ${n - 1}. Make the cycle join earlier, or -1 for no cycle.`);
  const nodes: Node[] = BASE.slice(0, n).map((val) => ({ val, next: null }));
  nodes.forEach((nd, q) => { nd.next = nodes[q + 1] ?? (j >= 0 ? nodes[j] : null); });
  const at = (p: Node | null) => (p ? nodes.indexOf(p) : -1), steps: GridStep[] = [];
  const snap = (note: string, s: Node | null, f: Node | null, tone?: FlowTone, labels: [string, string] = ["S", "F"]) => {
    const marks = nodes.map((nd) => [nd === s ? labels[0] : "", nd === f ? labels[1] : ""].filter(Boolean).join(" "));
    const tones: Tones = {};
    if (j >= 0) tones[`0:${j}`] = "warn";
    if (s) tones[`1:${at(s)}`] = "hot";
    if (f) tones[`1:${at(f)}`] = s === f ? "ok" : "hot";
    steps.push({ note, tone, tables: [{ label: j < 0 ? "last node points to null" : `last node points back to index ${j}`, head: idx(n), rowHead: ["value", "ptr"], rows: [nodes.map((nd) => nd.val), marks], tones }] });
  };
  let slow: Node | null = nodes[0], fast: Node | null = nodes[0], round = 0, met = false;
  snap(`slow (S) and fast (F) start at the head. Each round slow moves 1 node and fast moves 2. ${j < 0 ? "Will fast fall off the end?" : "If there is a loop, fast must lap slow."}`, slow, fast);
  while (fast && fast.next) {
    slow = slow!.next; fast = fast.next.next; round++;
    met = slow === fast;
    snap(met ? `Round ${round}: they meet at index ${at(slow)}, so the list has a cycle.` : `Round ${round}: slow is at index ${at(slow)}, fast at ${fast ? `index ${at(fast)}` : "null"}.`, slow, fast, met ? "ok" : undefined);
    if (met) break;
  }
  if (!met) {
    steps.push({ note: `fast reached the end, so there is no cycle. slow stopped at index ${at(slow)}, the middle: the same loop finds the middle of a list. O(n) time, O(1) space.`, tone: "ok", tables: steps.at(-1)!.tables });
    return { kind: "grid", title: `Fast and slow on ${n} nodes, no cycle`, steps: fit(steps) };
  }
  let p: Node = nodes[0], q: Node = slow!;
  snap(`To find where the loop starts, put P at the head and keep Q at the meeting point. Move both one step at a time.`, p, q, "hot", ["P", "Q"]);
  while (p !== q) { p = p.next!; q = q.next!; snap(p === q ? `P and Q meet at index ${at(p)}: the cycle starts there, value ${p.val}.` : `P moves to index ${at(p)}, Q to index ${at(q)}.`, p, q, p === q ? "ok" : undefined, ["P", "Q"]); }
  if (at(p) !== j) throw new Error("cycle start is wrong");
  steps.push({ note: `The cycle starts at index ${at(p)}. The head-to-start distance equals the meeting-point-to-start distance, which is why this works. O(n) time, O(1) space.`, tone: "ok", tables: steps.at(-1)!.tables });
  return { kind: "grid", title: `Fast and slow on ${n} nodes, loop at ${j}`, steps: fit(steps) };
}

/* ---------- linked list pattern 2: reverse in groups of k ---------- */
function reverseK({ n, k }: V): Flow {
  if (k > n) throw new PlayError(`Groups of ${k} need at least ${k} nodes. Make k at most the length.`);
  const dummy: Node = { val: 0, next: build(BASE.slice(0, n)) }, steps: GridStep[] = [];
  const snap = (note: string, done: number, hot: number, tone?: FlowTone) => {
    const vals = list(dummy.next).map((nd) => nd.val);
    steps.push({ note, tone, tables: [{ label: "list from head", head: idx(n), rows: [vals], tones: { ...span(0, done - 1, "ok"), ...span(done, done + hot - 1, "hot") } }] });
  };
  snap(`Reverse every group of ${k} nodes. Check that ${k} nodes are left, reverse them with prev, cur and nxt, then link the group back in.`, 0, Math.min(k, n));
  let groupPrev = dummy, done = 0, g = 0;
  for (;;) {
    let kth: Node | null = groupPrev;
    for (let q = 0; q < k && kth; q++) kth = kth.next;
    if (!kth) break;
    const groupNext = kth.next, first = groupPrev.next!;
    let prev: Node | null = groupNext, cur: Node | null = first;
    while (cur !== groupNext) { const nx: Node | null = cur!.next; cur!.next = prev; prev = cur; cur = nx; }
    groupPrev.next = kth; groupPrev = first; g++;
    snap(`Group ${g}: reversed, so ${kth.val} now leads it and ${first.val} ends it. ${first.val}.next points at ${groupNext ? groupNext.val : "null"}, the next group.`, done, k, "hot");
    done += k;
  }
  const left = n - done;
  snap(left ? `Only ${left} node${left > 1 ? "s are" : " is"} left, fewer than ${k}, so ${left > 1 ? "they stay" : "it stays"} in order. Each node was moved once: O(n) time, O(1) space.`
    : `Every node was in a full group. Each node was moved once: O(n) time, O(1) space.`, done, 0, "ok");
  return { kind: "grid", title: `Reversing ${n} nodes in groups of ${k}`, steps };
}

/* ---------- stack Overview: push, pop and underflow ---------- */
function stackOps({ pu, po }: V): Flow {
  const st: number[] = [], out: number[] = [], steps: GridStep[] = [];
  const snap = (note: string, tone?: FlowTone, bad = false) => steps.push({ note, tone, tables: [
    { label: "stack, top on the right", head: idx(8), rows: [padTo(st, 8)], tones: st.length ? { [`0:${st.length - 1}`]: bad ? "bad" : "hot" } : {} },
    { label: "popped, in order", rows: [padTo(out, 8)], tones: out.length ? { [`0:${out.length - 1}`]: "ok" } : {} }] });
  for (let q = 0; q < pu; q++) { st.push(BASE[q]); snap(q === 0 ? `push(${BASE[q]}): the item goes on top. Size 1.` : `push(${BASE[q]}) lands on top of ${BASE[q - 1]}. Size ${st.length}.`); }
  let under = false;
  for (let q = 0; q < po; q++) {
    if (!st.length) { under = true; snap(`pop() on an empty stack: underflow. Real code checks isEmpty() first, or the call throws.`, "bad", true); break; }
    out.push(st.pop()!);
    snap(`pop() returns ${out.at(-1)}, the newest item: last in, first out. Size ${st.length}.`, "hot");
  }
  if (!under) snap(st.length ? `${pu} pushes and ${po} pops leave ${st.length} item${st.length > 1 ? "s" : ""}; peek() would return ${st.at(-1)}. Push, pop and peek are all O(1).`
    : `The stack is empty again: every push had its pop. Push, pop and peek are all O(1).`, "ok");
  return { kind: "grid", title: `${pu} pushes, then ${po} pops`, steps: fit(steps) };
}

/* ---------- stack pattern 1: next greater element with a decreasing stack ---------- */
function nextGreater({ n }: V): Flow {
  const a = BASE.slice(0, n), ans: Cell[] = Array(n).fill(""), st: number[] = [], steps: GridStep[] = [];
  const snap = (note: string, cur: number, got: number[], tone?: FlowTone) => {
    const tones: Tones = {};
    for (const g of got) tones[`1:${g}`] = "ok";
    if (cur >= 0) tones[`0:${cur}`] = "hot";
    steps.push({ note, tone, tables: [{ head: idx(n), rowHead: ["value", "answer"], rows: [a, ans.slice()], tones },
      { label: "stack of waiting values, top on the right", rows: [padTo(st.map((q) => a[q]), n)] }] });
  };
  for (let i = 0; i < n; i++) {
    const got: number[] = [];
    while (st.length && a[st.at(-1)!] < a[i]) { const q = st.pop()!; ans[q] = a[i]; got.push(q); }
    st.push(i);
    const lead = i === 0 ? `Keep a stack of values still waiting for something bigger; the answer row fills as they find it. ${a[0]} waits first.` : "";
    snap(lead || (got.length ? `${a[i]} is bigger than ${got.map((q) => a[q]).join(" and ")}, so it is ${got.length > 1 ? "their" : "its"} next greater: pop ${got.length > 1 ? "them" : "it"}. Push ${a[i]}.`
      : `${a[i]} is not bigger than the top, ${a[st.at(-2)!]}, so it just waits on the stack too.`), i, got, got.length ? "hot" : undefined);
  }
  const left = st.map((q) => a[q]);
  for (const q of st) ans[q] = -1;
  snap(`The end: ${left.join(", ")} never met anything bigger, so they get -1. Each index was pushed and popped at most once: O(n), not O(n²).`, -1, st, "ok");
  return { kind: "grid", title: `Next greater element in ${n} values`, steps };
}

/* ---------- stack pattern 4: largest rectangle in a histogram ---------- */
const HIST = [2, 1, 5, 6, 2, 3, 4, 1, 3];
function histogram({ n }: V): Flow {
  const h = HIST.slice(0, n), st: number[] = [], steps: GridStep[] = [];
  let best = 0, bl = 0, br = 0;
  const snap = (note: string, cur: number, tone?: FlowTone) => {
    const tones: Tones = { ...span(bl, br, "ok"), ...(cur < n ? { [`0:${cur}`]: "hot" } : {}) };
    steps.push({ note, tone, tables: [{ head: idx(n), rowHead: ["height", "stack"], rows: [h, h.map((_, q) => (st.includes(q) ? "in" : ""))], tones },
      { head: ["best area", "bars"], rows: [[best, best ? `${bl} to ${br}` : "-"]] }] });
  };
  for (let i = 0; i <= n; i++) {
    const cur = i < n ? h[i] : 0, pops: string[] = [];
    while (st.length && h[st.at(-1)!] >= cur) {
      const top = st.pop()!, l = st.length ? st.at(-1)! + 1 : 0, w = i - l, area = h[top] * w;
      pops.push(`${h[top]} × ${w} = ${area}`);
      if (area > best) { best = area; bl = l; br = i - 1; }
    }
    st.push(i);
    if (i === n) st.pop();
    const popped = pops.length ? `pop and measure ${pops.join(", ")}.` : "";
    snap(i === n ? `At the end a height of 0 empties the stack: ${popped || "nothing left."}`
      : pops.length ? `${cur} is lower than the top bar, so bars that cannot stretch further right end here: ${popped} Push index ${i}.`
      : `${cur} is at least the top bar, so push index ${i}. The stack stays increasing.`, i, pops.length ? "hot" : undefined);
  }
  snap(`Largest rectangle: area ${best}, over bars ${bl} to ${br}. Each bar is pushed and popped once, so O(n) instead of trying every pair.`, n, "ok");
  return { kind: "grid", title: `Largest rectangle in ${n} bars`, steps: fit(steps) };
}

/* ---------- recursion Overview: the call stack of fact(n) ---------- */
function factStack({ n }: V): Flow {
  const frames: number[] = [], steps: GridStep[] = [];
  const snap = (note: string, ret?: number) => steps.push({ note, tone: ret === undefined ? "hot" : "ok", tables: [{ label: "call stack, top first", head: ["frame", "state"],
    rows: [...frames].reverse().map((k, q) => [`fact(${k})`, q === 0 ? (ret === undefined ? "running" : `returns ${ret}`) : `waits for fact(${k - 1})`]), tones: { "0": ret === undefined ? "hot" : "ok" } }] });
  const fact = (k: number): number => {
    frames.push(k);
    let r: number;
    if (k <= 1) { r = 1; snap(`fact(${k}) is the base case: it returns 1 without calling anything. Now the stack unwinds.`, r); }
    else {
      snap(k === n ? `Call fact(${n}). Its frame holds k = ${n} and where to resume. It needs fact(${n - 1}) first.` : `fact(${k}) is pushed on top. Every frame below is paused, waiting for the one above it.`);
      const sub = fact(k - 1);
      r = k * sub;
      snap(`fact(${k}) gets ${sub} back and returns ${k} × ${sub} = ${r}. Its frame is popped.`, r);
    }
    frames.pop();
    return r;
  };
  const out = fact(n);
  steps[steps.length - 1].note += ` Answer ${out}, with at most ${n} frames: O(n) stack memory, so a huge n overflows the stack.`;
  return { kind: "grid", title: `The call stack of fact(${n})`, steps: fit(steps) };
}

/* ---------- recursion pattern 5: combinations with choose, explore, un-choose and pruning ---------- */
function combos({ n, k }: V): Flow {
  if (k > n) throw new PlayError(`You cannot choose ${k} of ${n} items. Make k at most n.`);
  const path: number[] = [], found: string[] = [], steps: GridStep[] = [], W = 4;
  let log: string[] = [], calls = 0;
  const snap = (note: string, tone?: FlowTone) => {
    const cells = padTo(found, Math.max(W, Math.ceil(found.length / W) * W)), last = found.length - 1;
    steps.push({ note, tone, tables: [
      { label: "path", head: Array.from({ length: k }, (_, q) => `pick ${q + 1}`), rows: [padTo(path, k)], tones: path.length ? { [`0:${path.length - 1}`]: "hot" } : {} },
      { label: "combinations found", rows: Array.from({ length: cells.length / W }, (_, q) => cells.slice(q * W, q * W + W)), tones: last >= 0 ? { [`${Math.floor(last / W)}:${last % W}`]: "ok" } : {} }] });
  };
  const bt = (start: number) => {
    calls++;
    if (path.length === k) { found.push(path.join(",")); snap(`${log.join(", ")}. The path has ${k} items: record ${path.join(",")} and go back.`, "hot"); log = []; return; }
    for (let i = start; i <= n - (k - path.length); i++) { path.push(i); log.push(`choose ${i}`); bt(i + 1); path.pop(); log.push(`un-choose ${i}`); }
  };
  snap(`Pick ${k} of 1 to ${n}. Choose a number, explore with larger ones only, then un-choose it. The loop stops early when too few numbers are left to fill the path.`);
  bt(1);
  let plain = 0;
  const all = (start: number, len: number) => { plain++; if (len === k) return; for (let i = start; i <= n; i++) all(i + 1, len + 1); };
  all(1, 0);
  snap(`${log.length ? `${log.join(", ")}. ` : ""}Done: ${found.length} combinations, C(${n}, ${k}). Pruning made ${calls} calls; without it the search makes ${plain}.`, "ok");
  steps.forEach((s) => { s.note = s.note[0].toUpperCase() + s.note.slice(1); });
  return { kind: "grid", title: `Choosing ${k} of ${n}`, steps: fit(steps) };
}

/* ---------- recursion pattern 4: unique grid paths with a memo ---------- */
function pathsMemo({ r: R, c: C }: V): Flow {
  const memo: Cell[][] = Array.from({ length: R }, () => Array(C).fill("")), fills: { r: number; c: number; v: number; hits: number }[] = [];
  let calls = 0, hits = 0;
  const f = (r: number, c: number): number => {
    calls++;
    if (memo[r][c] !== "") { hits++; return memo[r][c] as number; }
    const v = r === 0 || c === 0 ? 1 : f(r - 1, c) + f(r, c - 1);
    memo[r][c] = v; fills.push({ r, c, v, hits });
    return v;
  };
  const ans = f(R - 1, C - 1);
  let plain = 0;
  const g = (r: number, c: number): number => (plain++, r === 0 || c === 0 ? 1 : g(r - 1, c) + g(r, c - 1));
  if (g(R - 1, C - 1) !== ans) throw new Error("memo is wrong");
  const table = (upTo: number, from: number): GridTable => {
    const shown: Cell[][] = Array.from({ length: R }, () => Array(C).fill("")), tones: Tones = {};
    fills.slice(0, upTo).forEach((x, q) => { shown[x.r][x.c] = x.v; tones[`${x.r}:${x.c}`] = q >= from ? "hot" : "ok"; });
    return { label: "memo[r][c] = paths to (r, c)", head: idx(C), rowHead: idx(R).map((x) => `row ${x}`), rows: shown, tones };
  };
  const steps: GridStep[] = [{ note: `paths(r, c) = paths(r - 1, c) + paths(r, c - 1), and any cell in row 0 or column 0 has 1 path. Start at the corner (${R - 1}, ${C - 1}) with an empty memo.`, tables: [table(0, 0)] }];
  const parts = Math.min(5, fills.length), size = Math.ceil(fills.length / parts);
  for (let a = 0; a < fills.length; a += size) {
    const b = Math.min(fills.length, a + size), last = fills[b - 1];
    const how = last.r === 0 || last.c === 0 ? "an edge cell, so 1" : `${memo[last.r - 1][last.c]} from above + ${memo[last.r][last.c - 1]} from the left = ${last.v}`;
    steps.push({ note: `${a === 0 ? "The calls run down to the edges before anything returns. " : ""}${b - a} more cell${b - a > 1 ? "s" : ""} stored; the last is (${last.r}, ${last.c}): ${how}. Memo hits so far: ${last.hits}.`, tone: "hot", tables: [table(b, a)] });
  }
  steps.push({ note: `paths(${R - 1}, ${C - 1}) = ${ans}. With the memo: ${calls} calls, ${hits} of them hits. Without it: ${plain} calls. Each cell is computed once, O(rows × cols); (0, 0) is never asked for.`, tone: "ok", tables: [table(fills.length, fills.length)] });
  return { kind: "grid", title: `Paths across a ${R} × ${C} grid, memoised`, steps };
}

export const PLAY: Record<string, PlayFlow> = {
  "pp-array-delete": { title: "Deleting from an array", knobs: [
    { key: "n", label: "array length", min: 3, max: 9, value: 7 }, { key: "i", label: "index to delete", min: 0, max: 8, value: 2 }], make: arrayDelete },
  "pp-array-window": { title: "Sliding a fixed window", knobs: [
    { key: "n", label: "array length", min: 4, max: 9, value: 9 }, { key: "k", label: "window size k", min: 2, max: 6, value: 3 }], make: slidingWindow },
  "pp-array-bsearch": { title: "Binary search", knobs: [
    { key: "n", label: "array length", min: 5, max: 9, value: 9 }, { key: "t", label: "target", min: 1, max: 75, value: 23 }], make: binarySearch },
  "pp-string-compare": { title: "Comparing two strings", knobs: [
    { key: "w", label: `second word (1 to ${SECOND.length})`, min: 1, max: SECOND.length, value: 4 }], make: strCompare },
  "pp-string-palindrome": { title: "Expand around a centre", knobs: [
    { key: "c", label: "centre (.5 is between letters)", min: 0, max: PAL.length - 1, step: 0.5, value: 5 }], make: palindrome },
  "pp-string-anagrams": { title: "Anagrams with a count window", knobs: [
    { key: "p", label: `pattern (1 to ${PATS.length})`, min: 1, max: PATS.length, value: 2 }], make: anagrams },
  "pp-logic-rowmajor": { title: "A matrix in row-major order", knobs: [
    { key: "r", label: "rows", min: 2, max: 4, value: 3 }, { key: "c", label: "columns", min: 2, max: 5, value: 4 }], make: rowMajor },
  "pp-logic-spiral": { title: "Spiral order with boundaries", knobs: [
    { key: "r", label: "rows", min: 1, max: 4, value: 3 }, { key: "c", label: "columns", min: 1, max: 6, value: 4 }], make: spiral },
  "pp-logic-rotate": { title: "Rotate by transpose and reverse", knobs: [
    { key: "n", label: "matrix size n", min: 2, max: 5, value: 3 }], make: rotate },
  "pp-bit-ops": { title: "Test, set, clear and toggle a bit", knobs: [
    { key: "x", label: "number x", min: 0, max: 255, value: 44 }, { key: "i", label: "bit i", min: 0, max: 7, value: 3 }], make: bitOps },
  "pp-bit-modpow": { title: "Fast power modulo m", knobs: [
    { key: "a", label: "base a", min: 2, max: 9, value: 3 }, { key: "e", label: "exponent e", min: 1, max: 60, value: 13 }, { key: "m", label: "modulus m", min: 5, max: 50, value: 11 }], make: modPow },
  "pp-bit-sieve": { title: "Sieve of Eratosthenes", knobs: [
    { key: "n", label: "primes up to n", min: 10, max: 64, value: 30 }], make: sieve },
  "pp-linkedlist-insert": { title: "Inserting into a linked list", knobs: [
    { key: "len", label: "list length", min: 3, max: 7, value: 5 }, { key: "pos", label: "position", min: 0, max: 7, value: 2 }], make: llInsert },
  "pp-linkedlist-floyd": { title: "Fast and slow pointers", knobs: [
    { key: "n", label: "list length", min: 3, max: 9, value: 7 }, { key: "j", label: "cycle joins at index (-1: none)", min: -1, max: 8, value: 2 }], make: floyd },
  "pp-linkedlist-kgroup": { title: "Reversing in groups of k", knobs: [
    { key: "n", label: "list length", min: 2, max: 9, value: 8 }, { key: "k", label: "group size k", min: 2, max: 5, value: 3 }], make: reverseK },
  "pp-stack-ops": { title: "Push and pop", knobs: [
    { key: "pu", label: "pushes", min: 1, max: 8, value: 4 }, { key: "po", label: "pops", min: 0, max: 9, value: 2 }], make: stackOps },
  "pp-stack-nextgreater": { title: "Next greater element", knobs: [
    { key: "n", label: "array length", min: 3, max: 9, value: 7 }], make: nextGreater },
  "pp-stack-histogram": { title: "Largest rectangle in a histogram", knobs: [
    { key: "n", label: "number of bars", min: 3, max: 9, value: 6 }], make: histogram },
  "pp-recursion-fact": { title: "The call stack of fact(n)", knobs: [
    { key: "n", label: "n", min: 2, max: 6, value: 4 }], make: factStack },
  "pp-recursion-combos": { title: "Backtracking: choose k of n", knobs: [
    { key: "n", label: "items n", min: 3, max: 5, value: 4 }, { key: "k", label: "choose k", min: 1, max: 4, value: 2 }], make: combos },
  "pp-recursion-memo": { title: "Memoised grid paths", knobs: [
    { key: "r", label: "rows", min: 2, max: 4, value: 3 }, { key: "c", label: "columns", min: 2, max: 6, value: 4 }], make: pathsMemo },
};
/** "<topic>:0" (the topic's Overview) or "<topic>:<pattern n>" -> the interactive flow id shown there. */
export const PLACES: Record<string, string> = {
  "array:0": "pp-array-delete", "array:3": "pp-array-window", "array:7": "pp-array-bsearch",
  "string:0": "pp-string-compare", "string:4": "pp-string-palindrome", "string:3": "pp-string-anagrams",
  "logic-to-code:0": "pp-logic-rowmajor", "logic-to-code:1": "pp-logic-spiral", "logic-to-code:2": "pp-logic-rotate",
  "bit-and-math:0": "pp-bit-ops", "bit-and-math:8": "pp-bit-modpow", "bit-and-math:7": "pp-bit-sieve",
  "linkedlist:0": "pp-linkedlist-insert", "linkedlist:1": "pp-linkedlist-floyd", "linkedlist:2": "pp-linkedlist-kgroup",
  "stack:0": "pp-stack-ops", "stack:1": "pp-stack-nextgreater", "stack:4": "pp-stack-histogram",
  "recursion-backtracking:0": "pp-recursion-fact", "recursion-backtracking:5": "pp-recursion-combos", "recursion-backtracking:4": "pp-recursion-memo",
};

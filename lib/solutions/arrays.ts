// Hand-written solutions (arrays, strings, maths) for the first four weeks of the daily plan.
import type { CellsFrame, Diagram, TableFrame, Tone } from "../diagram";
import { range } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const blank = (n: number) => Array<string | number>(n).fill("");

export const ARRAY_SOLUTIONS: Record<string, Solution> = {
  "count-triplets-that-can-form-two-arrays-of-equal-xor": {
    approach: "a == b means the XOR of arr[i..k] is 0, which happens exactly when prefix X[i] == X[k+1]; each such pair gives k - i triplets.",
    idea: ["a ^ b = 0 iff a == b, so you need subarrays [i..k] (length ≥ 2) whose XOR is 0.", "With prefix XOR X, xor(i..k) = X[k+1] ^ X[i], so it is 0 exactly when X[i] == X[k+1].", "Any j in (i, k] splits it into equal halves: that is k - i choices."],
    code: `def countTriplets(arr):
    X = [0]
    for x in arr: X.append(X[-1] ^ x)
    ans = 0
    for i in range(len(arr)):
        for k in range(i + 1, len(arr)):
            if X[i] == X[k + 1]:
                ans += k - i
    return ans`,
    lang: "python", time: "O(n²)", space: "O(n)",
    viz: () => {
      const a = [2, 3, 1, 6, 7], X = [0]; a.forEach((x) => X.push(X[X.length - 1] ^ x));
      const frames: CellsFrame[] = [{ note: `Prefix XOR: X = [${X.join(", ")}]`, rows: [a, X.slice(0, 5)] }]; let ans = 0;
      for (let i = 0; i < a.length; i++) for (let k = i + 1; k < a.length; k++) if (X[i] === X[k + 1]) { ans += k - i; frames.push({ note: `X[${i}] = X[${k + 1}] = ${X[i]} → arr[${i}..${k}] XORs to 0 → +${k - i} triplets (total ${ans})`, rows: [a, X.slice(0, 5)], tones: { ...range(i, k), [`1:${i}`]: "found" } }); }
      return cells("Equal XOR triplets via prefix XOR", [a, X.slice(0, 5)], frames, ["arr", "X[i]"]);
    },
  },

  "longest-well-performing-interval": {
    approach: "Score +1 for a tiring day and -1 otherwise; find the longest subarray with positive sum using the first index of each prefix value.",
    idea: ["A well-performing interval has more +1s than -1s, so its score sum is > 0.", "If the running sum s > 0, the whole prefix works. Otherwise the best start is right after the first time the prefix was s - 1.", "Store only the first index where each prefix value appears."],
    code: `def longestWPI(hours):
    first, s, best = {}, 0, 0
    for i, h in enumerate(hours):
        s += 1 if h > 8 else -1
        if s > 0:
            best = i + 1
        elif s - 1 in first:
            best = max(best, i - first[s - 1])
        first.setdefault(s, i)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const h = [9, 9, 6, 0, 6, 6, 9], sc = h.map((x) => (x > 8 ? 1 : -1)), pre: (string | number)[] = blank(h.length);
      const first = new Map<number, number>(); let s = 0, best = 0; const frames: CellsFrame[] = [];
      h.forEach((_, i) => {
        s += sc[i]; pre[i] = s; let note = `prefix = ${s}`;
        let tones: Record<string, Tone> = { [`2:${i}`]: "active" };
        if (s > 0) { best = i + 1; note += ` > 0 → whole prefix [0..${i}] works, best = ${best}`; tones = { ...tones, ...range(0, i) }; }
        else if (first.has(s - 1)) { const j = first.get(s - 1)!; if (i - j > best) best = i - j; note += `; prefix ${s - 1} first seen at ${j} → interval [${j + 1}..${i}] length ${i - j}, best = ${best}`; tones = { ...tones, ...range(j + 1, i) }; }
        else note += ", no earlier prefix " + (s - 1);
        if (!first.has(s)) first.set(s, i);
        frames.push({ note, rows: [h, sc, [...pre]], tones });
      });
      return cells("Longest well-performing interval", [h, sc, blank(h.length)], frames, ["hours", "score", "prefix"]);
    },
  },

  "grumpy-bookstore-owner": {
    approach: "Count customers already happy, then slide a window of length minutes to find where the technique wins back the most.",
    idea: ["Customers on non-grumpy minutes are happy regardless.", "Inside the technique window, grumpy minutes also become happy; that extra gain is a fixed-size window sum over customers[i] * grumpy[i].", "Answer = always-happy + best window gain."],
    code: `def maxSatisfied(customers, grumpy, minutes):
    base = sum(c for c, g in zip(customers, grumpy) if not g)
    gain = best = 0
    for i, (c, g) in enumerate(zip(customers, grumpy)):
        gain += c * g
        if i >= minutes:
            gain -= customers[i - minutes] * grumpy[i - minutes]
        best = max(best, gain)
    return base + best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const c = [1, 0, 1, 2, 1, 1, 7, 5], g = [0, 1, 0, 1, 0, 1, 0, 1], m = 3;
      const base = c.reduce((a, x, i) => a + (g[i] ? 0 : x), 0); let gain = 0, best = 0, at = 0; const frames: CellsFrame[] = [{ note: `Already happy (owner calm): ${base}`, tones: Object.fromEntries(g.map((x, i) => [`0:${i}`, x ? "muted" : "found"])) as Record<string, Tone> }];
      c.forEach((x, i) => { gain += x * g[i]; if (i >= m) gain -= c[i - m] * g[i - m]; if (gain > best) { best = gain; at = i; } if (i >= m - 1) frames.push({ note: `Window [${i - m + 1}..${i}] wins back ${gain} grumpy customers (best ${best})`, tones: { ...range(i - m + 1, i), ...range(i - m + 1, i, 1) } }); });
      frames.push({ note: `Answer = ${base} + ${best} = ${base + best}`, tones: range(at - m + 1, at, 0, "found") });
      return cells("Grumpy bookstore owner (fixed window)", [c, g], frames, ["customers", "grumpy"]);
    },
  },

  "valid-triangle-number": {
    approach: "Sort; fix the largest side k and count pairs (i, j) with a[i] + a[j] > a[k] using two pointers.",
    idea: ["After sorting, a triple works iff the two smaller sides sum to more than the largest.", "For fixed k, with L = 0 and R = k - 1: if a[L] + a[R] > a[k], every L' in [L, R) also works with R, so add R - L and move R left. Otherwise move L right."],
    code: `def triangleNumber(a):
    a.sort()
    ans = 0
    for k in range(len(a) - 1, 1, -1):
        L, R = 0, k - 1
        while L < R:
            if a[L] + a[R] > a[k]:
                ans += R - L
                R -= 1
            else:
                L += 1
    return ans`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const a = [2, 2, 3, 4, 5], frames: CellsFrame[] = []; let ans = 0;
      for (let k = a.length - 1; k > 1; k--) { let L = 0, R = k - 1; while (L < R) { const ok = a[L] + a[R] > a[k]; if (ok) ans += R - L; frames.push({ note: `k=${k} (${a[k]}): ${a[L]} + ${a[R]} ${ok ? `> ${a[k]} → all ${R - L} left ends work, total ${ans}; R--` : `≤ ${a[k]} → L++`}`, tones: { [`0:${k}`]: "found", [`0:${L}`]: "active", [`0:${R}`]: "active", ...(ok ? range(L, R - 1, 0, "window") : {}) }, marks: [{ i: L, label: "L" }, { i: R, label: "R" }, { i: k, label: "k" }] }); if (ok) R--; else L++; } }
      return cells(`Valid triangles in [2, 2, 3, 4, 5]: ${ans}`, [a], frames);
    },
  },

  "minimum-number-of-steps-to-make-two-strings-anagram": {
    approach: "Count letters of s minus letters of t; the positive leftovers are the letters t must change into.",
    idea: ["Each step replaces one character of t. Letters t already shares with s can stay.", "For each letter, if s has more of it than t, t needs that many replacements. Summing the positive differences gives the answer."],
    code: `from collections import Counter
def minSteps(s, t):
    need = Counter(s) - Counter(t)   # keeps only positive counts
    return sum(need.values())`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "leetcode", t = "practice", letters = [...new Set(s + t)].sort();
      const cs = letters.map((c) => [...s].filter((x) => x === c).length), ct = letters.map((c) => [...t].filter((x) => x === c).length);
      const frames: TableFrame[] = []; let total = 0; const rows = (k: number) => [cs, ct, letters.map((_, i) => (i <= k ? Math.max(0, cs[i] - ct[i]) : null))];
      letters.forEach((c, i) => { const d = Math.max(0, cs[i] - ct[i]); total += d; frames.push({ note: `'${c}': s has ${cs[i]}, t has ${ct[i]} → t must create ${d} more (total ${total})`, cells: rows(i), active: [2, i] }); });
      return { kind: "table", title: `"${s}" vs "${t}": ${total} steps`, rowHead: ["in s", "in t", "s - t > 0"], colHead: letters, frames };
    },
  },

  "k-th-symbol-in-grammar": {
    approach: "Row n is row n-1 followed by its complement, so the kth symbol is the parent's symbol, flipped if k is in the right half.",
    idea: ["Each symbol in row n-1 produces two children: 0 → 01, 1 → 10. So child k comes from parent (k + 1) // 2.", "The left child equals the parent; the right child is the flip. Recurse up to row 1 (symbol 0).", "Equivalent closed form: count the set bits of k - 1; odd → 1."],
    code: `def kthGrammar(n, k):
    if n == 1:
        return 0
    parent = kthGrammar(n - 1, (k + 1) // 2)
    return parent if k % 2 == 1 else 1 - parent`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const rows: string[] = ["0"]; for (let i = 1; i < 4; i++) rows.push([...rows[i - 1]].map((c) => (c === "0" ? "01" : "10")).join(""));
      const n = 4, k = 6, path: number[] = []; let kk = k; for (let r = n; r >= 1; r--) { path.unshift(kk); kk = Math.ceil(kk / 2); }
      const frames: TableFrame[] = path.map((pk, r) => ({ note: r === 0 ? "Row 1 is 0" : `row ${r + 1}, position ${pk}: parent is position ${path[r - 1]} in row ${r}; ${pk % 2 ? "left child → same" : "right child → flipped"} → ${rows[r][pk - 1]}`, cells: rows.map((row) => [...row].concat(Array(8 - row.length).fill(null))), active: [r, pk - 1], deps: path.slice(0, r).map((p2, j) => [j, p2 - 1] as [number, number]) }));
      return { kind: "table", title: `kthGrammar(4, 6) = ${rows[3][5]}`, rowHead: ["row 1", "row 2", "row 3", "row 4"], colHead: Array.from({ length: 8 }, (_, i) => String(i + 1)), frames };
    },
  },

  "make-sum-divisible-by-p": {
    approach: "Need to remove a subarray whose sum ≡ total (mod p); with prefix mods, look up the latest index of (cur - total) mod p.",
    idea: ["Let r = total % p. If r == 0 nothing to remove.", "A subarray (j, i] has sum ≡ r iff (pre[i] - pre[j]) % p == r, i.e. pre[j] ≡ pre[i] - r.", "Keep the latest index of each prefix mod so the removed piece is as short as possible. Removing everything is not allowed."],
    code: `def minSubarray(nums, p):
    r = sum(nums) % p
    if r == 0: return 0
    last, cur, best = {0: -1}, 0, len(nums)
    for i, x in enumerate(nums):
        cur = (cur + x) % p
        j = last.get((cur - r) % p)
        if j is not None:
            best = min(best, i - j)
        last[cur] = i
    return best if best < len(nums) else -1`,
    lang: "python", time: "O(n)", space: "O(min(n, p))",
    viz: () => {
      const a = [3, 1, 4, 2], p = 6, r = a.reduce((x, y) => x + y, 0) % p, mods: (string | number)[] = blank(a.length);
      const last = new Map<number, number>([[0, -1]]); let cur = 0, best = a.length; const frames: CellsFrame[] = [{ note: `total = ${a.reduce((x, y) => x + y, 0)}, remainder r = ${r}: remove a subarray whose sum ≡ ${r} (mod ${p})` }];
      a.forEach((x, i) => { cur = (cur + x) % p; mods[i] = cur; const want = (((cur - r) % p) + p) % p, j = last.get(want); let tones: Record<string, Tone> = { [`1:${i}`]: "active" }; let note = `prefix mod = ${cur}; need an earlier prefix mod ${want}`; if (j !== undefined) { if (i - j < best) best = i - j; note += ` → found at ${j}: remove [${j + 1}..${i}] (length ${i - j}), best ${best}`; tones = { ...tones, ...range(j + 1, i, 0, "bad") }; } else note += ": none"; last.set(cur, i); frames.push({ note, rows: [a, [...mods]], tones }); });
      return cells(`Make sum divisible by ${p}`, [a, blank(a.length)], frames, ["nums", "prefix % p"]);
    },
  },

  "maximum-value-at-a-given-index-in-a-bounded-array": {
    approach: "Binary search the peak value v; the cheapest array with nums[index] = v slopes down by 1 on each side, floored at 1.",
    idea: ["If peak v fits within maxSum, any smaller peak fits too: the predicate is monotonic.", "The minimum total for peak v is two arithmetic slopes (v, v-1, …) clipped at 1. Compute each side in O(1).", "Binary search for the largest v that fits."],
    code: `def maxValue(n, index, maxSum):
    def side(v, length):          # v-1, v-2, ... over length cells, min 1
        if v - 1 >= length:
            return (2 * v - 1 - length) * length // 2
        return v * (v - 1) // 2 + (length - (v - 1))
    def cost(v):
        return v + side(v, index) + side(v, n - index - 1)
    lo, hi = 1, maxSum
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if cost(mid) <= maxSum: lo = mid
        else: hi = mid - 1
    return lo`,
    lang: "python", time: "O(log maxSum)", space: "O(1)",
    viz: () => {
      const n = 6, idx = 1, maxSum = 10;
      const side = (v: number, len: number) => (v - 1 >= len ? ((2 * v - 1 - len) * len) / 2 : (v * (v - 1)) / 2 + (len - (v - 1)));
      const shape = (v: number) => Array.from({ length: n }, (_, i) => Math.max(1, v - Math.abs(i - idx)));
      const cost = (v: number) => v + side(v, idx) + side(v, n - idx - 1);
      let lo = 1, hi = maxSum; const frames: CellsFrame[] = [];
      while (lo < hi) { const mid = Math.floor((lo + hi + 1) / 2), c = cost(mid), ok = c <= maxSum; frames.push({ note: `try peak ${mid}: cheapest array costs ${c} ${ok ? `≤ ${maxSum} → fits, go higher` : `> ${maxSum} → too big, go lower`}`, rows: [shape(mid)], tones: { [`0:${idx}`]: ok ? "found" : "bad" } }); if (ok) lo = mid; else hi = mid - 1; }
      frames.push({ note: `Largest peak that fits: ${lo}`, rows: [shape(lo)], tones: { [`0:${idx}`]: "found" } });
      return cells(`n=${n}, index=${idx}, maxSum=${maxSum}`, [shape(1)], frames, ["nums"]);
    },
  },

  "number-of-substrings-with-only-1s": {
    approach: "Each run of k consecutive 1s contributes k(k+1)/2 substrings; add the current run length at every '1'.",
    idea: ["Ending at a '1' that closes a run of length k, there are exactly k all-ones substrings.", "So keep the current run length and add it each step. Take the result modulo 10⁹ + 7."],
    code: `def numSub(s):
    run = total = 0
    for ch in s:
        run = run + 1 if ch == "1" else 0
        total += run
    return total % (10**9 + 7)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "0110111".split(""); let run = 0, total = 0; const frames: CellsFrame[] = [];
      s.forEach((c, i) => { run = c === "1" ? run + 1 : 0; total += run; frames.push({ note: c === "1" ? `'1' extends the run to ${run} → ${run} new substrings end here (total ${total})` : "'0' resets the run", tones: c === "1" ? range(i - run + 1, i) : { [`0:${i}`]: "muted" } }); });
      return cells(`"0110111" has ${total} all-ones substrings`, [s], frames);
    },
  },

  "minimum-deletions-to-make-array-beautiful": {
    approach: "Walk left to right building pairs; if the current element equals the one waiting for a partner, delete it.",
    idea: ["Positions after deletions matter, so track the length of the kept array.", "When the kept length is odd, the next kept element must differ from the last kept one; an equal element is deleted.", "At the end, an odd kept length needs one more deletion."],
    code: `def minDeletion(nums):
    deleted = kept = 0
    for i, x in enumerate(nums):
        if kept % 2 == 1 and x == nums[i - 1]:
            deleted += 1          # would break the pair
        else:
            kept += 1
    return deleted + kept % 2`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 1, 2, 3, 5]; let del = 0, kept = 0; const frames: CellsFrame[] = []; const tones: Record<string, Tone> = {};
      a.forEach((x, i) => { if (kept % 2 === 1 && x === a[i - 1]) { del++; tones[`0:${i}`] = "bad"; frames.push({ note: `${x} would sit next to an equal partner → delete (${del})`, tones: { ...tones } }); } else { kept++; tones[`0:${i}`] = kept % 2 ? "active" : "found"; frames.push({ note: `keep ${x} (kept length ${kept}${kept % 2 ? ", waiting for a partner" : ", pair complete"})`, tones: { ...tones } }); } });
      frames.push({ note: `kept length ${kept} is ${kept % 2 ? "odd → delete one more" : "even"}. Answer ${del + (kept % 2)}`, tones: { ...tones } });
      return cells("Minimum deletions for a beautiful array", [a], frames);
    },
  },

  "angle-between-hands-of-a-clock": {
    approach: "Minute hand at 6° per minute, hour hand at 30° per hour plus 0.5° per minute; take the smaller of the gap and 360 minus it.",
    idea: ["Minute hand: 360 / 60 = 6° per minute.", "Hour hand: 30° per hour and it also creeps 0.5° per minute.", "The answer is min(d, 360 - d) where d is the absolute difference."],
    code: `def angleClock(hour, minutes):
    m = 6 * minutes
    h = 30 * (hour % 12) + 0.5 * minutes
    d = abs(h - m)
    return min(d, 360 - d)`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const h = 3, m = 30, mm = 6 * m, hh = 30 * (h % 12) + 0.5 * m, d = Math.abs(hh - mm);
      const rows = [[`${m} × 6`, mm], [`${h % 12} × 30 + ${m} × 0.5`, hh], [`|${hh} - ${mm}|`, d], [`min(${d}, ${360 - d})`, Math.min(d, 360 - d)]];
      const frames: TableFrame[] = rows.map((_, k) => ({ note: ["Minute hand angle", "Hour hand angle (it moves with the minutes too)", "Gap between them", "Take the smaller side of the circle"][k], cells: rows.map((r, j) => (j <= k ? r : [null, null])), active: [k, 1] }));
      return { kind: "table", title: `Angle at ${h}:${m}`, rowHead: ["minute", "hour", "gap", "answer"], colHead: ["formula", "degrees"], frames };
    },
  },

  "rearrange-array-elements-by-sign": {
    approach: "Write positives to even indices and negatives to odd indices with two write pointers, keeping relative order.",
    idea: ["The result alternates +, -, +, -, starting with a positive.", "Scan once: the next positive goes to index pos (then pos += 2), the next negative to neg (then neg += 2)."],
    code: `def rearrangeArray(nums):
    out = [0] * len(nums)
    pos, neg = 0, 1
    for x in nums:
        if x > 0:
            out[pos] = x; pos += 2
        else:
            out[neg] = x; neg += 2
    return out`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 1, -2, -5, 2, -4], out: (string | number)[] = blank(a.length); let p = 0, q = 1; const frames: CellsFrame[] = [];
      a.forEach((x, i) => { const at = x > 0 ? p : q; out[at] = x; if (x > 0) p += 2; else q += 2; frames.push({ note: `${x} is ${x > 0 ? "positive → next even slot" : "negative → next odd slot"} ${at}`, rows: [a, [...out]], tones: { [`0:${i}`]: "active", [`1:${at}`]: "found" } }); });
      return cells("Rearrange by sign", [a, blank(a.length)], frames, ["nums", "out"]);
    },
  },

  "minimum-time-difference": {
    approach: "Convert to minutes, sort, check adjacent gaps plus the wrap-around gap from the last time to the first + 1440.",
    idea: ["After sorting, the closest pair is adjacent, except that midnight wraps around.", "So also compare first + 1440 - last. With more than 1440 times, two must be equal (answer 0)."],
    code: `def findMinDifference(timePoints):
    m = sorted(int(t[:2]) * 60 + int(t[3:]) for t in timePoints)
    best = m[0] + 1440 - m[-1]          # wrap past midnight
    for a, b in zip(m, m[1:]):
        best = min(best, b - a)
    return best`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const t = ["23:59", "00:30", "12:00", "00:10"], m = t.map((x) => +x.slice(0, 2) * 60 + +x.slice(3)).sort((a, b) => a - b);
      let best = m[0] + 1440 - m[m.length - 1]; const frames: CellsFrame[] = [{ note: `Sorted minutes. Wrap gap: ${m[0]} + 1440 - ${m[m.length - 1]} = ${best}`, tones: { [`0:0`]: "active", [`0:${m.length - 1}`]: "active" } }];
      for (let i = 1; i < m.length; i++) { const g = m[i] - m[i - 1]; if (g < best) best = g; frames.push({ note: `${m[i]} - ${m[i - 1]} = ${g} (best ${best})`, tones: { [`0:${i - 1}`]: "active", [`0:${i}`]: "active" } }); }
      return cells(`Minimum gap: ${best} minutes`, [m], frames, ["minutes"]);
    },
  },

  "increasing-triplet-subsequence": {
    approach: "Keep the smallest value seen (first) and the smallest value that has something smaller before it (second); anything bigger than second finishes a triplet.",
    idea: ["first = smallest so far, second = smallest number that is bigger than some earlier number.", "If x > second, then some first < second < x exists in order.", "Updating first to a later smaller value is safe: second still has its own smaller predecessor."],
    code: `def increasingTriplet(nums):
    first = second = float("inf")
    for x in nums:
        if x <= first:
            first = x
        elif x <= second:
            second = x
        else:
            return True
    return False`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 1, 5, 0, 4, 6]; let f = Infinity, s = Infinity; const frames: CellsFrame[] = [];
      const fmt = (x: number) => (Number.isFinite(x) ? x : "∞");
      for (let i = 0; i < a.length; i++) { const x = a[i]; if (x <= f) { f = x; frames.push({ note: `${x} ≤ first → first = ${x} (second ${fmt(s)})`, tones: { [`0:${i}`]: "active" } }); } else if (x <= s) { s = x; frames.push({ note: `${x} beats first but ≤ second → second = ${x}`, tones: { [`0:${i}`]: "window" } }); } else { frames.push({ note: `${x} > second (${s}) → increasing triplet exists`, tones: { [`0:${i}`]: "found" } }); break; } }
      return cells("Increasing triplet with two variables", [a], frames);
    },
  },

  "number-of-ways-to-split-array": {
    approach: "One pass with a running left sum: split i is valid when left ≥ total - left.",
    idea: ["The right part's sum is total minus the left sum, so no second array is needed.", "Splits can happen after index 0 .. n-2 (both parts non-empty)."],
    code: `def waysToSplitArray(nums):
    total, left, ways = sum(nums), 0, 0
    for x in nums[:-1]:
        left += x
        if left >= total - left:
            ways += 1
    return ways`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [10, 4, -8, 7], total = a.reduce((x, y) => x + y, 0); let left = 0, ways = 0; const frames: CellsFrame[] = [];
      for (let i = 0; i < a.length - 1; i++) { left += a[i]; const ok = left >= total - left; if (ok) ways++; frames.push({ note: `split after ${i}: left ${left} vs right ${total - left} → ${ok ? "valid" : "not valid"} (ways ${ways})`, tones: { ...range(0, i, 0, ok ? "found" : "window"), ...range(i + 1, a.length - 1, 0, "muted") } }); }
      return cells(`Ways to split: ${ways}`, [a], frames);
    },
  },

  "maximum-product-of-word-lengths": {
    approach: "Encode each word's letters as a 26-bit mask; two words share no letter iff mask1 & mask2 == 0.",
    idea: ["Building each mask costs O(length). Comparing two words is then one AND.", "Check all pairs and keep the best product of lengths."],
    code: `def maxProduct(words):
    masks = []
    for w in words:
        m = 0
        for c in w: m |= 1 << (ord(c) - 97)
        masks.append(m)
    best = 0
    for i in range(len(words)):
        for j in range(i + 1, len(words)):
            if masks[i] & masks[j] == 0:
                best = max(best, len(words[i]) * len(words[j]))
    return best`,
    lang: "python", time: "O(n² + total length)", space: "O(n)",
    viz: () => {
      const w = ["abcw", "baz", "foo", "xtfn"], ms = w.map((x) => [...x].reduce((m, c) => m | (1 << (c.charCodeAt(0) - 97)), 0));
      const frames: TableFrame[] = []; let best = 0; const cellsOf = () => w.map((x, i) => [x, x.length, ms[i].toString(2).padStart(24, "0").slice(-24).replace(/^0+/, "") || "0"]);
      for (let i = 0; i < w.length; i++) for (let j = i + 1; j < w.length; j++) { const ok = (ms[i] & ms[j]) === 0; if (ok) best = Math.max(best, w[i].length * w[j].length); frames.push({ note: `${w[i]} & ${w[j]}: ${ok ? `no shared letters → ${w[i].length} × ${w[j].length} = ${w[i].length * w[j].length}` : "share a letter"} (best ${best})`, cells: cellsOf(), active: [i, 0], deps: [[j, 0]] }); }
      return { kind: "table", title: `Best product: ${best}`, rowHead: w.map((_, i) => String(i)), colHead: ["word", "len", "letter mask"], frames };
    },
  },

  "continuous-subarrays": {
    approach: "Sliding window kept valid (max - min ≤ 2) with a monotonic deque for max and one for min; each right end adds R - L + 1 subarrays.",
    idea: ["If a window is valid, every subarray ending at R that starts in [L, R] is valid too, so it contributes R - L + 1.", "Shrink L while max - min > 2. Two deques give the window max and min in O(1)."],
    code: `from collections import deque
def continuousSubarrays(nums):
    mx, mn = deque(), deque()
    L = ans = 0
    for R, x in enumerate(nums):
        while mx and nums[mx[-1]] <= x: mx.pop()
        while mn and nums[mn[-1]] >= x: mn.pop()
        mx.append(R); mn.append(R)
        while nums[mx[0]] - nums[mn[0]] > 2:
            L += 1
            if mx[0] < L: mx.popleft()
            if mn[0] < L: mn.popleft()
        ans += R - L + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [5, 4, 2, 4], frames: CellsFrame[] = []; let L = 0, ans = 0;
      for (let R = 0; R < a.length; R++) { while (Math.max(...a.slice(L, R + 1)) - Math.min(...a.slice(L, R + 1)) > 2) L++; ans += R - L + 1; const w = a.slice(L, R + 1); frames.push({ note: `R=${R}: window [${L}..${R}] max ${Math.max(...w)} - min ${Math.min(...w)} ≤ 2 → +${R - L + 1} subarrays (total ${ans})`, tones: range(L, R), marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); }
      return cells(`Continuous subarrays: ${ans}`, [a], frames);
    },
  },

  "binary-subarrays-with-sum": {
    approach: "Prefix sum with a counter: subarrays ending here with sum goal = number of earlier prefixes equal to current - goal.",
    idea: ["Same as Subarray Sum Equals K, specialised to 0/1 values.", "Seed the counter with {0: 1}."],
    code: `def numSubarraysWithSum(nums, goal):
    seen, s, ans = {0: 1}, 0, 0
    for x in nums:
        s += x
        ans += seen.get(s - goal, 0)
        seen[s] = seen.get(s, 0) + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [1, 0, 1, 0, 1], goal = 2, pre: (string | number)[] = blank(a.length), seen = new Map([[0, 1]]); let s = 0, ans = 0; const frames: CellsFrame[] = [];
      a.forEach((x, i) => { s += x; pre[i] = s; const add = seen.get(s - goal) || 0; ans += add; seen.set(s, (seen.get(s) || 0) + 1); frames.push({ note: `prefix ${s}: earlier prefixes equal to ${s - goal} → +${add} (total ${ans})`, rows: [a, [...pre]], tones: { [`1:${i}`]: "active" } }); });
      return cells(`Subarrays with sum ${goal}: ${ans}`, [a, blank(a.length)], frames, ["nums", "prefix"]);
    },
  },

  "magnetic-force-between-two-balls": {
    approach: "Binary search the minimum gap d; greedily place balls left to right and check whether m fit.",
    idea: ["If gap d is achievable, every smaller gap is too: monotonic.", "Greedy check: put a ball at the first basket, then at the next basket at least d further, and so on."],
    code: `def maxDistance(position, m):
    position.sort()
    def fits(d):
        count, last = 1, position[0]
        for p in position[1:]:
            if p - last >= d:
                count += 1; last = p
        return count >= m
    lo, hi = 1, position[-1] - position[0]
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fits(mid): lo = mid
        else: hi = mid - 1
    return lo`,
    lang: "python", time: "O(n log n + n log R)", space: "O(1)",
    viz: () => {
      const pos = [1, 2, 3, 4, 7], m = 3, frames: CellsFrame[] = [];
      const place = (d: number) => { const at = [0]; let last = pos[0]; for (let i = 1; i < pos.length; i++) if (pos[i] - last >= d) { at.push(i); last = pos[i]; } return at; };
      let lo = 1, hi = pos[pos.length - 1] - pos[0];
      while (lo < hi) { const mid = Math.floor((lo + hi + 1) / 2), at = place(mid), ok = at.length >= m; frames.push({ note: `gap ≥ ${mid}: greedy fits ${at.length} balls ${ok ? `≥ ${m} → try larger` : `< ${m} → too wide`}`, tones: Object.fromEntries(at.map((i) => [`0:${i}`, ok ? "found" : "bad"])) as Record<string, Tone> }); if (ok) lo = mid; else hi = mid - 1; }
      frames.push({ note: `Largest minimum gap = ${lo}`, tones: Object.fromEntries(place(lo).map((i) => [`0:${i}`, "found"])) as Record<string, Tone> });
      return cells(`Positions [${pos.join(", ")}], m = ${m}`, [pos], frames, ["position"]);
    },
  },

  "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit": {
    approach: "Sliding window with a decreasing deque (window max) and an increasing deque (window min); shrink while max - min > limit.",
    idea: ["The window is valid while its max - min ≤ limit; growing only makes it harder, so the variable window applies.", "Monotonic deques keep the max and min of the current window available in O(1)."],
    code: `from collections import deque
def longestSubarray(nums, limit):
    mx, mn = deque(), deque()
    L = best = 0
    for R, x in enumerate(nums):
        while mx and mx[-1] < x: mx.pop()
        while mn and mn[-1] > x: mn.pop()
        mx.append(x); mn.append(x)
        if mx[0] - mn[0] > limit:
            if mx[0] == nums[L]: mx.popleft()
            if mn[0] == nums[L]: mn.popleft()
            L += 1
        best = max(best, R - L + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [8, 2, 4, 7], lim = 4, frames: CellsFrame[] = []; let L = 0, best = 0;
      for (let R = 0; R < a.length; R++) { while (Math.max(...a.slice(L, R + 1)) - Math.min(...a.slice(L, R + 1)) > lim) L++; best = Math.max(best, R - L + 1); const w = a.slice(L, R + 1); frames.push({ note: `R=${R}: shrink until max ${Math.max(...w)} - min ${Math.min(...w)} ≤ ${lim}; window [${L}..${R}], best ${best}`, tones: range(L, R), marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); }
      return cells(`Longest with |diff| ≤ ${lim}: ${best}`, [a], frames);
    },
  },

  "make-string-a-subsequence-using-cyclic-increments": {
    approach: "Two pointers: advance through str2 whenever str1[i] equals str2[j] or becomes it after one cyclic increment.",
    idea: ["Each character of str1 may be incremented once (z → a). So str1[i] can match str2[j] if they are equal or str2[j] is the next letter.", "Greedy matching from the left is optimal for subsequence checks."],
    code: `def canMakeSubsequence(str1, str2):
    j = 0
    for c in str1:
        if j < len(str2) and (c == str2[j] or chr((ord(c) - 97 + 1) % 26 + 97) == str2[j]):
            j += 1
    return j == len(str2)`,
    lang: "python", time: "O(n + m)", space: "O(1)",
    viz: () => {
      const s1 = "zbc".split(""), s2 = "ad".split(""), frames: CellsFrame[] = []; let j = 0; const tones: Record<string, Tone> = {};
      s1.forEach((c, i) => { const nxt = String.fromCharCode(((c.charCodeAt(0) - 97 + 1) % 26) + 97), ok = j < s2.length && (c === s2[j] || nxt === s2[j]); if (ok) { tones[`0:${i}`] = "found"; tones[`1:${j}`] = "found"; } frames.push({ note: ok ? `'${c}'${c === s2[j] ? "" : ` → '${nxt}'`} matches str2[${j}] → j++` : `'${c}' (or '${nxt}') does not match '${s2[j] ?? "end"}' → skip`, tones: { ...tones, [`0:${i}`]: ok ? "found" : "muted" }, marks: [{ i, label: "i" }, { i: Math.min(j, s2.length - 1), label: "j", row: 1 }] }); if (ok) j++; });
      return cells(`"zbc" → can make "ad": ${j === s2.length}`, [s1, s2], frames, ["str1", "str2"]);
    },
  },

  "word-subsets": {
    approach: "Merge words2 into one requirement: the max count of each letter over all of words2; a word in words1 is universal if it meets it.",
    idea: ["b is a subset of a if a has at least as many of each letter.", "Needing every b at once means needing the max count per letter across words2.", "Then each word in words1 is a single 26-count comparison."],
    code: `from collections import Counter
def wordSubsets(words1, words2):
    need = Counter()
    for b in words2:
        for c, k in Counter(b).items():
            need[c] = max(need[c], k)
    return [a for a in words1
            if all(Counter(a)[c] >= k for c, k in need.items())]`,
    lang: "python", time: "O(total letters)", space: "O(1)",
    viz: () => {
      const w1 = ["amazon", "apple", "facebook", "google"], need = { e: 1, o: 1 } as Record<string, number>, letters = Object.keys(need);
      const cnt = (w: string, c: string) => [...w].filter((x) => x === c).length;
      const frames: TableFrame[] = [{ note: 'words2 = ["e", "o"] → need at least 1 e and 1 o', cells: w1.map(() => [null, null, null]) }]; const rows: (string | number | null)[][] = w1.map(() => [null, null, null]);
      w1.forEach((w, i) => { const ok = letters.every((c) => cnt(w, c) >= need[c]); rows[i] = [cnt(w, "e"), cnt(w, "o"), ok ? "yes" : "no"]; frames.push({ note: `${w}: e=${cnt(w, "e")}, o=${cnt(w, "o")} → ${ok ? "universal" : "missing a letter"}`, cells: rows.map((r) => [...r]), active: [i, 2] }); });
      return { kind: "table", title: "Word subsets", rowHead: w1, colHead: ["e", "o", "universal?"], frames };
    },
  },

  "average-waiting-time": {
    approach: "Simulate one chef: each order starts at max(now, arrival), finishes after its time, and waits finish - arrival.",
    idea: ["Orders are already sorted by arrival and the chef works on one at a time.", "Track the time the chef becomes free; sum each customer's waiting time and divide."],
    code: `def averageWaitingTime(customers):
    now = total = 0
    for arrival, t in customers:
        now = max(now, arrival) + t
        total += now - arrival
    return total / len(customers)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const cs = [[1, 2], [2, 5], [4, 3]]; let now = 0, total = 0; const rows: (string | number | null)[][] = cs.map(() => [null, null, null, null]); const frames: TableFrame[] = [];
      cs.forEach(([a, t], i) => { const start = Math.max(now, a); now = start + t; total += now - a; rows[i] = [a, start, now, now - a]; frames.push({ note: `customer ${i + 1}: starts at max(${start === a ? a : now - t}, ${a}) = ${start}, done at ${now}, waited ${now - a}`, cells: rows.map((r) => [...r]), active: [i, 3] }); });
      frames.push({ note: `Average = ${total} / ${cs.length} = ${(total / cs.length).toFixed(5)}`, cells: rows.map((r) => [...r]) });
      return { kind: "table", title: "One chef, orders in arrival order", rowHead: cs.map((_, i) => `#${i + 1}`), colHead: ["arrives", "starts", "done", "waits"], frames };
    },
  },

  "majority-element-ii": {
    approach: "Boyer-Moore with two candidates (at most two values can exceed n/3), then a second pass to verify their counts.",
    idea: ["Three different values cancel each other, like removing a triple; anything with more than n/3 survives.", "Keep two candidates with counters. A new value matching neither decrements both.", "Candidates are only possible answers, so recount them."],
    code: `def majorityElement(nums):
    c1, c2, n1, n2 = None, None, 0, 0
    for x in nums:
        if x == c1: n1 += 1
        elif x == c2: n2 += 1
        elif n1 == 0: c1, n1 = x, 1
        elif n2 == 0: c2, n2 = x, 1
        else: n1 -= 1; n2 -= 1
    return [c for c in (c1, c2) if c is not None and nums.count(c) > len(nums) // 3]`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 1, 3, 1, 2, 2]; let c1: number | null = null, c2: number | null = null, n1 = 0, n2 = 0; const frames: CellsFrame[] = [];
      a.forEach((x, i) => { let what: string; if (x === c1) { n1++; what = `matches c1 → n1 = ${n1}`; } else if (x === c2) { n2++; what = `matches c2 → n2 = ${n2}`; } else if (n1 === 0) { c1 = x; n1 = 1; what = `c1 empty → c1 = ${x}`; } else if (n2 === 0) { c2 = x; n2 = 1; what = `c2 empty → c2 = ${x}`; } else { n1--; n2--; what = `matches neither → cancel: n1 = ${n1}, n2 = ${n2}`; } frames.push({ note: `${x}: ${what}`, tones: { [`0:${i}`]: "active" } }); });
      const cands = [c1, c2] as (number | null)[];
      const res = cands.filter((c): c is number => c !== null && a.filter((x) => x === c).length > Math.floor(a.length / 3));
      frames.push({ note: `Verify counts: ${cands.map((c) => `${c} appears ${a.filter((x) => x === c).length}×`).join(", ")} vs n/3 = ${(a.length / 3).toFixed(1)} → [${res.join(", ")}]`, tones: Object.fromEntries(a.map((x, i) => [`0:${i}`, res.includes(x) ? "found" : "muted"])) as Record<string, Tone> });
      return cells("Majority element II (n/3)", [a], frames);
    },
  },

  "find-all-duplicates-in-an-array": {
    approach: "Values are 1..n, so use the sign of nums[v - 1] as a 'seen v' flag; a second visit finds it already negative.",
    idea: ["Each value maps to an index: v → v - 1.", "First time you see v, negate nums[v - 1]. If it is already negative, v is a duplicate.", "No extra memory beyond the output."],
    code: `def findDuplicates(nums):
    out = []
    for x in nums:
        i = abs(x) - 1
        if nums[i] < 0:
            out.append(abs(x))
        else:
            nums[i] = -nums[i]
    return out`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [4, 3, 2, 7, 8, 2, 3, 1], frames: CellsFrame[] = [], out: number[] = [];
      for (let k = 0; k < a.length; k++) { const v = Math.abs(a[k]), i = v - 1; if (a[i] < 0) { out.push(v); frames.push({ note: `${v}: slot ${i} already negative → ${v} is a duplicate [${out.join(", ")}]`, rows: [[...a]], tones: { [`0:${k}`]: "active", [`0:${i}`]: "bad" } }); } else { a[i] = -a[i]; frames.push({ note: `${v}: mark slot ${i} as seen (negate)`, rows: [[...a]], tones: { [`0:${k}`]: "active", [`0:${i}`]: "found" } }); } }
      return cells("Sign marking for duplicates", [[4, 3, 2, 7, 8, 2, 3, 1]], frames);
    },
  },

  "remove-colored-pieces-if-both-neighbors-are-the-same-color": {
    approach: "Moves never affect the other player, so count AAA windows for Alice and BBB windows for Bob; Alice wins iff she has more.",
    idea: ["Removing a middle A only shrinks a run of As; it never creates or destroys Bob's moves.", "A run of k equal letters gives k - 2 moves. Alice moves first, so she needs strictly more moves."],
    code: `def winnerOfGame(colors):
    a = b = 0
    for i in range(1, len(colors) - 1):
        if colors[i - 1] == colors[i] == colors[i + 1]:
            if colors[i] == "A": a += 1
            else: b += 1
    return a > b`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "AAABABBB".split(""), frames: CellsFrame[] = []; let a = 0, b = 0;
      for (let i = 1; i < s.length - 1; i++) { const ok = s[i - 1] === s[i] && s[i] === s[i + 1]; if (ok) { if (s[i] === "A") a++; else b++; } frames.push({ note: ok ? `${s[i]}${s[i]}${s[i]} centred at ${i} → one move for ${s[i] === "A" ? "Alice" : "Bob"} (A ${a}, B ${b})` : `centre ${i}: no triple`, tones: { ...range(i - 1, i + 1, 0, ok ? "found" : "window"), [`0:${i}`]: ok ? "found" : "active" } }); }
      frames.push({ note: `Alice ${a} moves vs Bob ${b} → ${a > b ? "Alice wins" : "Bob wins"}`, tones: {} });
      return cells("Count each player's moves", [s], frames);
    },
  },

  "number-of-operations-to-make-network-connected": {
    approach: "Need n - 1 cables; if there are enough, the answer is the number of connected components minus one (Union-Find).",
    idea: ["Fewer than n - 1 cables can never connect n computers: return -1.", "Otherwise there are spare cables (each redundant edge inside a component), and each move joins two components.", "So the answer is components - 1."],
    code: `def makeConnected(n, connections):
    if len(connections) < n - 1:
        return -1
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    comps = n
    for a, b in connections:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb; comps -= 1
    return comps - 1`,
    lang: "python", time: "O((n + m) α(n))", space: "O(n)",
    viz: () => {
      const nodes = [{ id: 0, label: "0", x: 12, y: 30 }, { id: 1, label: "1", x: 40, y: 15 }, { id: 2, label: "2", x: 40, y: 75 }, { id: 3, label: "3", x: 68, y: 45 }, { id: 4, label: "4", x: 90, y: 20 }, { id: 5, label: "5", x: 90, y: 80 }];
      const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3]] as const, parent = nodes.map((_, i) => i), find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      let comps = 6, spare = 0; const frames: { note: string; tones?: Record<number, Tone>; edgeTones?: Record<string, Tone>; badges?: Record<number, string> }[] = [{ note: `${edges.length} cables ≥ n - 1 = 5 → enough cables exist; count components` }];
      const edgeTones: Record<string, Tone> = {};
      for (const [a, b] of edges) { const ra = find(a), rb = find(b); if (ra !== rb) { parent[ra] = rb; comps--; edgeTones[`${a}-${b}`] = "found"; } else { spare++; edgeTones[`${a}-${b}`] = "bad"; } frames.push({ note: ra !== rb ? `union(${a}, ${b}) → ${comps} components` : `${a}-${b} joins two already-connected computers → a spare cable (${spare})`, edgeTones: { ...edgeTones }, tones: Object.fromEntries(nodes.map((nd) => [nd.id, find(nd.id) === find(0) ? "found" : "muted"])) as Record<number, Tone> }); }
      frames.push({ note: `${comps} components → move ${comps - 1} spare cables to join them. Answer ${comps - 1}`, edgeTones: { ...edgeTones } });
      return { kind: "graph", title: "n = 6, 5 cables: components - 1 moves", nodes, edges: edges.map(([a, b]) => ({ a, b })), frames };
    },
  },

  "count-the-number-of-good-subarrays": {
    approach: "Sliding window counting equal pairs: for each right end, push L as far as the window stays good; every start before L gives a good subarray.",
    idea: ["Adding x to the window creates cnt[x] new equal pairs; removing it drops cnt[x] - 1.", "For each R, shrink from the left while the window still has at least k pairs. Afterwards [L - 1..R] was the last good one.", "So starts 0..L-1 all give good subarrays ending at R (a good subarray stays good when extended left): add L."],
    code: `def countGood(nums, k):
    cnt, pairs, L, ans = {}, 0, 0, 0
    for x in nums:
        pairs += cnt.get(x, 0)
        cnt[x] = cnt.get(x, 0) + 1
        while pairs >= k:
            cnt[nums[L]] -= 1
            pairs -= cnt[nums[L]]
            L += 1
        ans += L
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 1, 4, 3, 2, 2, 4], k = 2, cnt = new Map<number, number>(), frames: CellsFrame[] = []; let pairs = 0, L = 0, ans = 0;
      a.forEach((x, R) => {
        pairs += cnt.get(x) || 0; cnt.set(x, (cnt.get(x) || 0) + 1); const before = pairs;
        while (pairs >= k) { const y = a[L]; cnt.set(y, cnt.get(y)! - 1); pairs -= cnt.get(y)!; L++; }
        ans += L;
        frames.push({ note: `R=${R} adds ${x}: ${before} pair${before === 1 ? "" : "s"}. ${L ? `Shrink while good → L=${L}, so starts 0..${L - 1} each give a good subarray ending here: +${L} (total ${ans})` : `fewer than ${k} pairs, nothing good ends here yet`}`, tones: { ...range(0, L - 1, 0, "found"), ...range(L, R), [`0:${R}`]: "active" }, marks: [{ i: Math.min(L, R), label: "L" }, { i: R, label: "R" }] });
      });
      return cells(`Good subarrays (k = ${k}): ${ans}`, [a], frames);
    },
  },

  "find-the-smallest-divisor-given-a-threshold": {
    approach: "Binary search the divisor: a bigger divisor never makes the sum of ceilings bigger, so find the first one whose sum fits.",
    idea: ["sum(ceil(x / d)) only goes down (or stays) as d grows: the predicate 'sum ≤ threshold' is monotonic.", "Search d in [1, max(nums)]; at max(nums) every term is 1, which always fits.", "ceil(x / d) in integers is (x + d - 1) // d."],
    code: `def smallestDivisor(nums, threshold):
    lo, hi = 1, max(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if sum((x + mid - 1) // mid for x in nums) <= threshold:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log max)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 5, 9], th = 6, frames: CellsFrame[] = []; let lo = 1, hi = Math.max(...a);
      const q = (d: number) => a.map((x) => Math.ceil(x / d));
      while (lo < hi) { const mid = (lo + hi) >> 1, s = q(mid).reduce((x, y) => x + y, 0), ok = s <= th; frames.push({ note: `divisor ${mid}: ceilings sum to ${s} ${ok ? `≤ ${th} → fits, try smaller` : `> ${th} → too small a divisor`}`, rows: [a, q(mid)], tones: range(0, a.length - 1, 1, ok ? "found" : "bad") }); if (ok) hi = mid; else lo = mid + 1; }
      frames.push({ note: `Smallest divisor that fits: ${lo}`, rows: [a, q(lo)], tones: range(0, a.length - 1, 1, "found") });
      return cells(`threshold = ${th}`, [a, blank(a.length)], frames, ["nums", "ceil(x/d)"]);
    },
  },

  "number-of-laser-beams-in-a-bank": {
    approach: "Empty rows do not block beams, so each pair of consecutive non-empty rows adds (devices above) × (devices below).",
    idea: ["A beam joins every device in one row with every device in the next row that has devices.", "Skip rows with no devices and remember the count of the last non-empty row."],
    code: `def numberOfBeams(bank):
    prev = ans = 0
    for row in bank:
        c = row.count("1")
        if c:
            ans += prev * c
            prev = c
    return ans`,
    lang: "python", time: "O(rows · cols)", space: "O(1)",
    viz: () => {
      const bank = ["011001", "000000", "010100", "001000"], grid = bank.map((r) => [...r].map((ch) => (ch === "1" ? "●" : ""))), frames: TableFrame[] = []; let prev = 0, prevRow = -1, ans = 0;
      bank.forEach((row, i) => { const c = [...row].filter((x) => x === "1").length; let note: string; if (!c) note = `row ${i} is empty: beams pass straight through`; else { ans += prev * c; note = prev ? `${prev} devices above × ${c} here = ${prev * c} beams (total ${ans})` : `first row with devices: ${c}`; } frames.push({ note, cells: grid.map((r, j) => [...r, j <= i ? [...bank[j]].filter((x) => x === "1").length : null]), active: [i, 6], deps: c && prevRow >= 0 ? [[prevRow, 6]] : [] as [number, number][] }); if (c) { prev = c; prevRow = i; } });
      return { kind: "table", title: `Laser beams: ${ans}`, rowHead: bank.map((_, i) => String(i)), colHead: ["0", "1", "2", "3", "4", "5", "devices"], frames };
    },
  },

  "shortest-subarray-to-be-removed-to-make-array-sorted": {
    approach: "Keep a sorted prefix and a sorted suffix; for each prefix end l, move r to the first suffix value ≥ arr[l] and remove what is between.",
    idea: ["What remains must be a sorted prefix glued to a sorted suffix.", "Find where the sorted suffix starts (r). Removing everything before it is one option.", "Then grow the prefix one element at a time; r only moves right, so this is two pointers in O(n)."],
    code: `def findLengthOfShortestSubarray(arr):
    n = len(arr)
    r = n - 1
    while r > 0 and arr[r - 1] <= arr[r]:
        r -= 1
    if r == 0:
        return 0
    best = r                      # remove arr[0..r-1]
    l = 0
    while l < r and (l == 0 or arr[l - 1] <= arr[l]):
        while r < n and arr[r] < arr[l]:
            r += 1
        best = min(best, r - l - 1)
        l += 1
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 3, 10, 4, 2, 3, 5], n = a.length, frames: CellsFrame[] = []; let r = n - 1;
      while (r > 0 && a[r - 1] <= a[r]) r--;
      let best = r; frames.push({ note: `Sorted suffix starts at ${r}. Removing everything before it costs ${r}`, tones: { ...range(0, r - 1, 0, "bad"), ...range(r, n - 1, 0, "found") }, marks: [{ i: r, label: "r" }] });
      let l = 0;
      while (l < r && (l === 0 || a[l - 1] <= a[l])) { while (r < n && a[r] < a[l]) r++; best = Math.min(best, r - l - 1); frames.push({ note: `keep prefix [0..${l}] (ends ${a[l]}); first suffix value ≥ ${a[l]} is at ${r < n ? r : "the end"} → remove ${r - l - 1} (best ${best})`, tones: { ...range(0, l, 0, "found"), ...range(l + 1, r - 1, 0, "bad"), ...range(r, n - 1, 0, "found") }, marks: [{ i: l, label: "l" }, ...(r < n ? [{ i: r, label: "r" }] : [])] }); l++; }
      frames.push({ note: `${a[l]} < ${a[l - 1]}: the prefix stops being sorted. Answer ${best}` });
      return cells(`Shortest removal: ${best}`, [a], frames);
    },
  },

  "subarray-product-less-than-k": {
    approach: "Sliding window on the product: shrink while product ≥ k; every window ending at R adds R - L + 1 subarrays.",
    idea: ["All numbers are positive, so growing the window only grows the product.", "For each R, divide out nums[L] until the product is below k.", "Then every subarray ending at R that starts in [L, R] works: R - L + 1 of them. With k ≤ 1 nothing works."],
    code: `def numSubarrayProductLessThanK(nums, k):
    if k <= 1:
        return 0
    prod, L, ans = 1, 0, 0
    for R, x in enumerate(nums):
        prod *= x
        while prod >= k:
            prod //= nums[L]
            L += 1
        ans += R - L + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [10, 5, 2, 6], k = 100, frames: CellsFrame[] = []; let prod = 1, L = 0, ans = 0;
      a.forEach((x, R) => { prod *= x; const big = prod; while (prod >= k) { prod /= a[L]; L++; } ans += R - L + 1; frames.push({ note: `× ${x} → ${big}${big >= k ? ` ≥ ${k}, shrink to ${prod}` : ` < ${k}`}; window [${L}..${R}] adds ${R - L + 1} (total ${ans})`, tones: range(L, R), marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); });
      return cells(`Products below ${k}: ${ans}`, [a], frames);
    },
  },

  "reduce-array-size-to-the-half": {
    approach: "Greedy: remove the most frequent values first until at least half the array is gone.",
    idea: ["Choosing a value removes all its copies, so the best choice each time is the value with the most copies.", "Sort counts in decreasing order and add them up until the total reaches n / 2."],
    code: `from collections import Counter
def minSetSize(arr):
    removed = 0
    counts = sorted(Counter(arr).values(), reverse=True)
    for i, c in enumerate(counts, 1):
        removed += c
        if removed * 2 >= len(arr):
            return i`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const a = [3, 3, 3, 3, 5, 5, 5, 2, 2, 7], cnt = new Map<number, number>(); a.forEach((x) => cnt.set(x, (cnt.get(x) || 0) + 1));
      const sorted = [...cnt.entries()].sort((x, y) => y[1] - x[1]), rows: (string | number | null)[][] = sorted.map(([v, c]) => [v, c, null]), frames: TableFrame[] = [{ note: `n = ${a.length}: remove at least ${a.length / 2} elements. Counts sorted high to low`, cells: rows.map((r) => [...r]) }];
      let removed = 0, ans = 0;
      for (let i = 0; i < sorted.length; i++) { removed += sorted[i][1]; rows[i][2] = removed; const done = removed * 2 >= a.length; frames.push({ note: `remove every ${sorted[i][0]} → ${removed} gone${done ? ` ≥ ${a.length / 2}, answer ${i + 1}` : ""}`, cells: rows.map((r) => [...r]), active: [i, 2] }); if (done) { ans = i + 1; break; } }
      return { kind: "table", title: `Set size: ${ans}`, rowHead: sorted.map((_, i) => `#${i + 1}`), colHead: ["value", "count", "removed"], frames };
    },
  },

  "find-the-winner-of-the-circular-game": {
    approach: "Josephus recurrence: with i friends the winner (0-based) is (winner with i - 1 friends + k) mod i.",
    idea: ["After the first friend leaves, the game restarts with i - 1 friends, counting from the next friend: that is a shift by k.", "So W(1) = 0 and W(i) = (W(i - 1) + k) % i.", "Answer W(n) + 1 because friends are numbered from 1."],
    code: `def findTheWinner(n, k):
    w = 0                      # winner index with 1 friend
    for i in range(2, n + 1):
        w = (w + k) % i
    return w + 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 5, k = 2, rows: (string | number | null)[][] = Array.from({ length: n }, () => [null, null]), frames: TableFrame[] = []; let w = 0;
      rows[0] = ["base", 0]; frames.push({ note: "With 1 friend, index 0 wins", cells: rows.map((r) => [...r]), active: [0, 1] });
      for (let i = 2; i <= n; i++) { const prev = w; w = (w + k) % i; rows[i - 1] = [`(${prev} + ${k}) % ${i}`, w]; frames.push({ note: `${i} friends: shift the ${i - 1}-friend winner by k → ${w}`, cells: rows.map((r) => [...r]), active: [i - 1, 1], deps: [[i - 2, 1]] }); }
      frames.push({ note: `Winner is friend ${w} + 1 = ${w + 1}`, cells: rows.map((r) => [...r]), active: [n - 1, 1] });
      return { kind: "table", title: `n = ${n}, k = ${k}: friend ${w + 1} wins`, rowHead: Array.from({ length: n }, (_, i) => `${i + 1} friends`), colHead: ["formula", "winner (0-based)"], frames };
    },
  },

  "max-consecutive-ones-iii": {
    approach: "Longest window with at most k zeros: grow R, and shrink L whenever the window holds more than k zeros.",
    idea: ["Flipping at most k zeros means the answer is a window with ≤ k zeros.", "Count zeros inside the window. When it exceeds k, move L right until it is back to k."],
    code: `def longestOnes(nums, k):
    L = zeros = best = 0
    for R, x in enumerate(nums):
        zeros += x == 0
        while zeros > k:
            zeros -= nums[L] == 0
            L += 1
        best = max(best, R - L + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], k = 2, frames: CellsFrame[] = []; let L = 0, z = 0, best = 0;
      a.forEach((x, R) => { z += x === 0 ? 1 : 0; while (z > k) { z -= a[L] === 0 ? 1 : 0; L++; } best = Math.max(best, R - L + 1); frames.push({ note: `R=${R}: window [${L}..${R}] has ${z} zero${z === 1 ? "" : "s"} (≤ ${k}), length ${R - L + 1}, best ${best}`, tones: { ...range(L, R), ...(Object.fromEntries(a.map((v, i) => [i, v]).filter(([i, v]) => v === 0 && i >= L && i <= R).map(([i]) => [`0:${i}`, "active"])) as Record<string, Tone>) }, marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); });
      return cells(`Max ones with ${k} flips: ${best}`, [a], frames);
    },
  },

  "maximum-gap": {
    approach: "Pigeonhole buckets of width ⌊(max - min) / (n - 1)⌋: the biggest gap is never inside a bucket, so compare each bucket's min with the previous bucket's max.",
    idea: ["The largest gap is at least (max - min) / (n - 1), which is ≥ the bucket width.", "Two numbers in the same bucket differ by less than the width, so they can't make the largest gap.", "Keep only each bucket's min and max, then scan buckets in order: O(n)."],
    code: `def maximumGap(nums):
    lo, hi, n = min(nums), max(nums), len(nums)
    if n < 2 or lo == hi:
        return 0
    size = max(1, (hi - lo) // (n - 1))
    m = (hi - lo) // size + 1
    bmin, bmax = [None] * m, [None] * m
    for x in nums:
        b = (x - lo) // size
        bmin[b] = x if bmin[b] is None else min(bmin[b], x)
        bmax[b] = x if bmax[b] is None else max(bmax[b], x)
    best, prev = 0, lo
    for b in range(m):
        if bmin[b] is not None:
            best = max(best, bmin[b] - prev)
            prev = bmax[b]
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 6, 9, 1, 14], lo = Math.min(...a), hi = Math.max(...a), size = Math.max(1, Math.floor((hi - lo) / (a.length - 1))), m = Math.floor((hi - lo) / size) + 1;
      const bmin: (number | null)[] = Array(m).fill(null), bmax: (number | null)[] = Array(m).fill(null), grid = () => [bmin.map((x) => x), bmax.map((x) => x)], frames: TableFrame[] = [];
      a.forEach((x) => { const b = Math.floor((x - lo) / size); bmin[b] = bmin[b] == null ? x : Math.min(bmin[b]!, x); bmax[b] = bmax[b] == null ? x : Math.max(bmax[b]!, x); frames.push({ note: `${x} → bucket (${x} - ${lo}) // ${size} = ${b}`, cells: grid(), active: [0, b] }); });
      let best = 0, prev = lo, prevB = 0;
      for (let b = 0; b < m; b++) { if (bmin[b] == null) continue; const g = bmin[b]! - prev; best = Math.max(best, g); frames.push({ note: `bucket ${b}: min ${bmin[b]} - previous max ${prev} = ${g} (best ${best})`, cells: grid(), active: [0, b], deps: [[1, prevB]] }); prev = bmax[b]!; prevB = b; }
      return { kind: "table", title: `min ${lo}, max ${hi}, bucket width ${size}: gap ${best}`, rowHead: ["min", "max"], colHead: Array.from({ length: m }, (_, i) => `b${i}`), frames };
    },
  },

  "shortest-unsorted-continuous-subarray": {
    approach: "Scan left to right tracking the max: the last index below it is the right end. Scan right to left tracking the min: the last index above it is the left end.",
    idea: ["An element smaller than something before it must be inside the subarray; the rightmost such index is the end.", "Symmetrically, an element larger than something after it must be inside; the leftmost such index is the start.", "If nothing is out of place, the length is 0."],
    code: `def findUnsortedSubarray(nums):
    n = len(nums)
    start, end = 0, -1
    mx, mn = nums[0], nums[-1]
    for i in range(n):
        mx = max(mx, nums[i])
        if nums[i] < mx: end = i
        j = n - 1 - i
        mn = min(mn, nums[j])
        if nums[j] > mn: start = j
    return end - start + 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [2, 6, 4, 8, 10, 9, 15], n = a.length, frames: CellsFrame[] = []; let mx = a[0], mn = a[n - 1], end = -1, start = 0;
      for (let i = 0; i < n; i++) { mx = Math.max(mx, a[i]); const out = a[i] < mx; if (out) end = i; frames.push({ note: `left to right: max so far ${mx}; ${a[i]} ${out ? `< ${mx} → end = ${i}` : "is in place"}`, tones: { [`0:${i}`]: out ? "bad" : "active", ...(end >= 0 ? { [`0:${end}`]: "bad" } : {}) } }); }
      for (let j = n - 1; j >= 0; j--) { mn = Math.min(mn, a[j]); const out = a[j] > mn; if (out) start = j; frames.push({ note: `right to left: min so far ${mn}; ${a[j]} ${out ? `> ${mn} → start = ${j}` : "is in place"}`, tones: { [`0:${j}`]: out ? "bad" : "active", [`0:${end}`]: "bad" } }); }
      frames.push({ note: `Sort [${start}..${end}]: length ${end - start + 1}`, tones: range(start, end, 0, "found") });
      return cells(`Shortest unsorted subarray: ${end - start + 1}`, [a], frames);
    },
  },

  "maximum-white-tiles-covered-by-a-carpet": {
    approach: "Sort tiles; start the carpet at each tile's left edge and slide a window over fully covered tiles, adding the partly covered last one.",
    idea: ["Some best placement starts exactly at a tile's left end (shifting right until it does never loses tiles).", "For a carpet starting at tiles[i][0], tiles ending before start + len are fully covered; keep their total in a window.", "The next tile may be partly covered: add max(0, start + len - its start). Drop tile i from the window when moving on."],
    code: `def maximumWhiteTiles(tiles, carpetLen):
    tiles.sort()
    best = cover = j = 0
    for i, (s, e) in enumerate(tiles):
        end = s + carpetLen
        while j < len(tiles) and tiles[j][1] < end:
            cover += tiles[j][1] - tiles[j][0] + 1
            j += 1
        part = max(0, end - tiles[j][0]) if j < len(tiles) else 0
        best = max(best, cover + part)
        if best >= carpetLen:
            return carpetLen
        cover -= e - s + 1
    return best`,
    lang: "python", time: "O(n log n)", space: "O(1)",
    viz: () => {
      const tiles: [number, number][] = [[1, 5], [10, 11], [12, 18], [20, 25], [30, 32]], len = 10, frames: { note: string; tones?: Record<number, Tone>; result?: [number, number][] }[] = []; let best = 0, cover = 0, j = 0;
      for (let i = 0; i < tiles.length; i++) { const [s, e] = tiles[i], end = s + len; while (j < tiles.length && tiles[j][1] < end) { cover += tiles[j][1] - tiles[j][0] + 1; j++; } const part = j < tiles.length ? Math.max(0, end - tiles[j][0]) : 0; best = Math.max(best, cover + part); const tones: Record<number, Tone> = {}; for (let x = i; x < j; x++) tones[x] = "found"; if (part) tones[j] = "window"; frames.push({ note: `carpet [${s}..${end - 1}]: ${cover} fully covered${part ? ` + ${part} of tile ${tiles[j][0]}-${tiles[j][1]}` : ""} = ${cover + part} (best ${best})`, tones, result: [[s, end - 1]] }); cover -= e - s + 1; }
      return { kind: "intervals", title: `Carpet length ${len}: ${best} white tiles`, items: tiles, frames };
    },
  },

  "max-chunks-to-make-sorted": {
    approach: "A chunk can end at i exactly when the max of arr[0..i] equals i: then the prefix holds precisely the values 0..i.",
    idea: ["arr is a permutation of 0..n-1. Sorting a prefix chunk-by-chunk works only if each prefix boundary already holds the right set of values.", "Prefix [0..i] contains exactly {0..i} iff its max is i.", "Count such i."],
    code: `def maxChunksToSorted(arr):
    mx = ans = 0
    for i, x in enumerate(arr):
        mx = max(mx, x)
        if mx == i:
            ans += 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 0, 2, 3, 4], frames: CellsFrame[] = []; let mx = 0, ans = 0, start = 0; const tones: Record<string, Tone> = {};
      a.forEach((x, i) => { mx = Math.max(mx, x); const cut = mx === i; if (cut) { ans++; Object.assign(tones, range(start, i, 0, "found")); start = i + 1; } frames.push({ note: `i=${i}: prefix max ${mx} ${cut ? `= ${i} → close chunk ${ans}` : `≠ ${i} → chunk continues`}`, tones: { ...tones, ...(cut ? {} : range(start, i, 0, "window")) }, marks: [{ i, label: "i" }] }); });
      return cells(`Max chunks: ${ans}`, [a], frames);
    },
  },

  "longest-nice-subarray": {
    approach: "Sliding window with an OR of the window's bits: a new number fits only if it shares no bit with that OR; otherwise drop numbers from the left.",
    idea: ["Nice means every pair ANDs to 0, so the window's numbers use disjoint bits.", "Then the window's OR is also its XOR: removing nums[L] is used ^= nums[L].", "While used & x ≠ 0, remove from the left."],
    code: `def longestNiceSubarray(nums):
    used = L = best = 0
    for R, x in enumerate(nums):
        while used & x:
            used ^= nums[L]
            L += 1
        used |= x
        best = max(best, R - L + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 3, 8, 48, 10], bits = a.map((x) => x.toString(2)), frames: CellsFrame[] = []; let used = 0, L = 0, best = 0;
      a.forEach((x, R) => { let drop = 0; while (used & x) { used ^= a[L]; L++; drop++; } used |= x; best = Math.max(best, R - L + 1); frames.push({ note: `${x} (${x.toString(2)})${drop ? `: shared bits, drop ${drop} from the left` : ""}; window bits ${used.toString(2)}, length ${R - L + 1}, best ${best}`, rows: [a, bits], tones: { ...range(L, R), ...range(L, R, 1) }, marks: [{ i: L, label: "L" }, { i: R, label: "R" }] }); });
      return cells(`Longest nice subarray: ${best}`, [a, bits], frames, ["nums", "binary"]);
    },
  },

  "longest-subarray-with-maximum-bitwise-and": {
    approach: "AND never exceeds its smallest operand, so the maximum AND is max(nums) itself: find the longest run of that value.",
    idea: ["x & y ≤ min(x, y), so any subarray containing a smaller value has a smaller AND.", "The best AND is max(nums), reached only by subarrays made entirely of it.", "Answer: the longest run of max(nums)."],
    code: `def longestSubarray(nums):
    mx = max(nums)
    best = run = 0
    for x in nums:
        run = run + 1 if x == mx else 0
        best = max(best, run)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 2, 3, 3, 2, 2], mx = Math.max(...a), frames: CellsFrame[] = [{ note: `Max value ${mx}: only runs of ${mx} reach AND = ${mx}`, tones: Object.fromEntries(a.map((x, i) => [`0:${i}`, x === mx ? "found" : "muted"])) as Record<string, Tone> }]; let run = 0, best = 0;
      a.forEach((x, i) => { run = x === mx ? run + 1 : 0; best = Math.max(best, run); frames.push({ note: x === mx ? `${x} extends the run to ${run} (best ${best})` : `${x} < ${mx} breaks the run`, tones: x === mx ? range(i - run + 1, i, 0, "found") : { [`0:${i}`]: "muted" } }); });
      return cells(`Longest run of ${mx}: ${best}`, [a], frames);
    },
  },

  "find-valid-matrix-given-row-and-column-sums": {
    approach: "Greedy: put min(rowSum[i], colSum[j]) in each cell and subtract it from both; one of them hits 0 every time.",
    idea: ["Both sums total the same, so a fill always exists.", "Taking the min satisfies at least one of row i or column j completely, and never makes anything negative.", "Fill row by row, column by column."],
    code: `def restoreMatrix(rowSum, colSum):
    out = [[0] * len(colSum) for _ in rowSum]
    for i in range(len(rowSum)):
        for j in range(len(colSum)):
            v = min(rowSum[i], colSum[j])
            out[i][j] = v
            rowSum[i] -= v
            colSum[j] -= v
    return out`,
    lang: "python", time: "O(m · n)", space: "O(m · n)",
    viz: () => {
      const rs = [5, 7, 10], cs = [8, 6, 8], out = rs.map(() => cs.map(() => null as number | null)), frames: TableFrame[] = [];
      const grid = () => [...out.map((r, i) => [...r, rs[i]]), [...cs, null]];
      frames.push({ note: "Last column: row sums still needed. Last row: column sums still needed", cells: grid() });
      rs.forEach((_, i) => cs.forEach((__, j) => { const v = Math.min(rs[i], cs[j]); out[i][j] = v; rs[i] -= v; cs[j] -= v; frames.push({ note: `cell (${i},${j}) = min(${rs[i] + v}, ${cs[j] + v}) = ${v}`, cells: grid(), active: [i, j], deps: [[i, 3], [3, j]] }); }));
      return { kind: "table", title: "Greedy fill, row by row", rowHead: ["r0", "r1", "r2", "col left"], colHead: ["c0", "c1", "c2", "row left"], frames };
    },
  },

  "next-greater-element-iii": {
    approach: "Next permutation of the digits: find the rightmost digit smaller than its right neighbour, swap it with the smallest larger digit to its right, reverse the tail.",
    idea: ["Scanning from the right, digits rise until index i where d[i] < d[i+1]. The tail after i is non-increasing (already its largest order).", "Swap d[i] with the rightmost digit bigger than it, then reverse the tail to make it as small as possible.", "No such i means the number is already the largest arrangement. Check the 32-bit limit."],
    code: `def nextGreaterElement(n):
    d = list(str(n))
    i = len(d) - 2
    while i >= 0 and d[i] >= d[i + 1]:
        i -= 1
    if i < 0:
        return -1
    j = len(d) - 1
    while d[j] <= d[i]:
        j -= 1
    d[i], d[j] = d[j], d[i]
    d[i + 1:] = reversed(d[i + 1:])
    v = int("".join(d))
    return v if v < 2**31 else -1`,
    lang: "python", time: "O(digits)", space: "O(digits)",
    viz: () => {
      const d = [..."2431"].map(Number), frames: CellsFrame[] = []; let i = d.length - 2;
      while (i >= 0 && d[i] >= d[i + 1]) { frames.push({ note: `${d[i]} ≥ ${d[i + 1]}: still part of the falling tail`, rows: [[...d]], tones: range(i, d.length - 1, 0, "window") }); i--; }
      frames.push({ note: `${d[i]} < ${d[i + 1]}: pivot at index ${i}`, rows: [[...d]], tones: { ...range(i + 1, d.length - 1, 0, "window"), [`0:${i}`]: "active" } });
      let j = d.length - 1; while (d[j] <= d[i]) j--;
      [d[i], d[j]] = [d[j], d[i]]; frames.push({ note: `swap with ${d[i]}, the rightmost digit bigger than ${d[j]}`, rows: [[...d]], tones: { [`0:${i}`]: "found", [`0:${j}`]: "active" } });
      const tail = d.splice(i + 1).reverse(); d.push(...tail); frames.push({ note: `reverse the tail → ${d.join("")}`, rows: [[...d]], tones: { [`0:${i}`]: "found", ...range(i + 1, d.length - 1, 0, "found") } });
      return cells(`Next greater after 2431: ${d.join("")}`, [[2, 4, 3, 1]], frames);
    },
  },

  "sort-characters-by-frequency": {
    approach: "Count letters, then write each letter count times in decreasing order of count.",
    idea: ["Counter.most_common() returns letters sorted by count, highest first.", "Bucket sort by count gives O(n) if the alphabet is large; here sorting at most 62 distinct letters is constant work."],
    code: `from collections import Counter
def frequencySort(s):
    return "".join(c * k for c, k in Counter(s).most_common())`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "banana", cnt = new Map<string, number>(); [...s].forEach((c) => cnt.set(c, (cnt.get(c) || 0) + 1));
      const order = [...cnt.entries()].sort((x, y) => y[1] - x[1]), frames: TableFrame[] = [{ note: `Count letters of "${s}"`, cells: [order.map(([, k]) => k), order.map(() => null)] }]; let out = "";
      order.forEach(([c, k], i) => { out += c.repeat(k); frames.push({ note: `'${c}' × ${k} → "${out}"`, cells: [order.map(([, x]) => x), order.map(([ch, x], j) => (j <= i ? ch.repeat(x) : null))], active: [1, i] }); });
      return { kind: "table", title: `"${s}" → "${out}"`, rowHead: ["count", "written"], colHead: order.map(([c]) => c), frames };
    },
  },

  "number-of-wonderful-substrings": {
    approach: "Prefix parity mask over letters a-j: a substring is wonderful when its two end masks are equal or differ in exactly one bit.",
    idea: ["Bit c of the mask is the parity of letter c in the prefix. A substring's parity is the XOR of two prefix masks.", "At most one odd letter means that XOR is 0 or a single bit.", "Count earlier masks equal to the current one, plus each of the 10 one-bit flips."],
    code: `def wonderfulSubstrings(word):
    cnt = [0] * 1024
    cnt[0] = 1
    mask = ans = 0
    for ch in word:
        mask ^= 1 << (ord(ch) - 97)
        ans += cnt[mask]
        for b in range(10):
            ans += cnt[mask ^ (1 << b)]
        cnt[mask] += 1
    return ans`,
    lang: "python", time: "O(10 · n)", space: "O(1024)",
    viz: () => {
      const w = "aba", cnt = new Map<number, number>([[0, 1]]), odd = (m: number) => [..."ab"].filter((_, b) => m & (1 << b)).join("") || "none", frames: CellsFrame[] = [], seen: (string | number)[] = blank(w.length); let mask = 0, ans = 0;
      [...w].forEach((ch, i) => { mask ^= 1 << (ch.charCodeAt(0) - 97); const same = cnt.get(mask) || 0; let one = 0; for (let b = 0; b < 10; b++) one += cnt.get(mask ^ (1 << b)) || 0; ans += same + one; cnt.set(mask, (cnt.get(mask) || 0) + 1); seen[i] = odd(mask); frames.push({ note: `'${ch}': odd letters so far {${odd(mask)}}. ${same} earlier equal mask${same === 1 ? "" : "s"} + ${one} one-bit away → +${same + one} (total ${ans})`, rows: [[...w], [...seen]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "found" } }); });
      return cells(`"${w}" has ${ans} wonderful substrings`, [[...w], blank(w.length)], frames, ["word", "odd in prefix"]);
    },
  },

  "minimum-speed-to-arrive-on-time": {
    approach: "Binary search the speed: every train but the last waits for the next whole hour, so the time is sum(ceil(d / v)) + last / v.",
    idea: ["A faster speed never takes longer: monotonic.", "If hour ≤ n - 1 even infinite speed fails (each of the first n - 1 rides takes at least 1 hour).", "Otherwise the answer is at most 10⁷ (the bound the problem guarantees)."],
    code: `def minSpeedOnTime(dist, hour):
    if hour <= len(dist) - 1:
        return -1
    def time(v):
        return sum((d + v - 1) // v for d in dist[:-1]) + dist[-1] / v
    lo, hi = 1, 10**7
    while lo < hi:
        mid = (lo + hi) // 2
        if time(mid) <= hour:
            hi = mid
        else:
            lo = mid + 1
    return lo`,
    lang: "python", time: "O(n log 10⁷)", space: "O(1)",
    viz: () => {
      const dist = [1, 3, 2], hour = 2.7, frames: CellsFrame[] = []; let lo = 1, hi = 10;
      const legs = (v: number) => dist.map((d, i) => (i < dist.length - 1 ? Math.ceil(d / v) : +(d / v).toFixed(2)));
      while (lo < hi) { const mid = (lo + hi) >> 1, l = legs(mid), t = +l.reduce((x, y) => x + y, 0).toFixed(2), ok = t <= hour; frames.push({ note: `speed ${mid}: ${l.join(" + ")} = ${t} hours ${ok ? `≤ ${hour} → fast enough` : `> ${hour} → too slow`}`, rows: [dist, l], tones: range(0, dist.length - 1, 1, ok ? "found" : "bad") }); if (ok) hi = mid; else lo = mid + 1; }
      frames.push({ note: `Minimum speed ${lo} (search shown on [1, 10]; the code uses 10⁷)`, rows: [dist, legs(lo)], tones: range(0, dist.length - 1, 1, "found") });
      return cells(`dist [${dist.join(", ")}], hour ${hour}`, [dist, blank(dist.length)], frames, ["dist", "hours"]);
    },
  },

  "count-number-of-nice-subarrays": {
    approach: "Turn each number into 1 if odd else 0; then count subarrays with sum k using prefix counts.",
    idea: ["A nice subarray has exactly k odd numbers, which is a subarray sum of k over the 0/1 version.", "Keep how many times each prefix count has appeared; seed it with {0: 1}."],
    code: `def numberOfSubarrays(nums, k):
    seen, s, ans = {0: 1}, 0, 0
    for x in nums:
        s += x & 1
        ans += seen.get(s - k, 0)
        seen[s] = seen.get(s, 0) + 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [2, 1, 2, 1, 1, 2], k = 2, odd = a.map((x) => x & 1), pre: (string | number)[] = blank(a.length), seen = new Map([[0, 1]]), frames: CellsFrame[] = []; let s = 0, ans = 0;
      a.forEach((x, i) => { s += x & 1; pre[i] = s; const add = seen.get(s - k) || 0; ans += add; seen.set(s, (seen.get(s) || 0) + 1); frames.push({ note: `${x} → odd count ${s}; earlier prefixes with ${s - k} → +${add} (total ${ans})`, rows: [a, odd, [...pre]], tones: { [`2:${i}`]: "active" } }); });
      return cells(`Nice subarrays (k = ${k}): ${ans}`, [a, odd, blank(a.length)], frames, ["nums", "odd?", "prefix"]);
    },
  },

  "flip-columns-for-maximum-number-of-equal-rows": {
    approach: "Two rows can both become all-equal by the same flips iff they are equal or exact complements; normalise each row so it starts with 0 and count.",
    idea: ["A set of column flips makes a row uniform only if the row is that flip pattern or its complement.", "Normalise: XOR every row with its first value, so complementary rows look the same.", "The most common normalised pattern is the answer."],
    code: `from collections import Counter
def maxEqualRowsAfterFlips(matrix):
    c = Counter(tuple(x ^ row[0] for x in row) for row in matrix)
    return max(c.values())`,
    lang: "python", time: "O(m · n)", space: "O(m · n)",
    viz: () => {
      const m = [[0, 0, 0], [0, 0, 1], [1, 1, 0]], pat = m.map((r) => r.map((x) => x ^ r[0]).join("")), cnt = new Map<string, number>(), frames: TableFrame[] = [];
      m.forEach((r, i) => { cnt.set(pat[i], (cnt.get(pat[i]) || 0) + 1); frames.push({ note: `row ${i} ${r.join("")}${r[0] ? " starts with 1 → complement" : ""} → pattern ${pat[i]} (seen ${cnt.get(pat[i])}×)`, cells: m.map((row, j) => [...row, j <= i ? pat[j] : null]), active: [i, 3], deps: m.map((_, j) => [j, 3] as [number, number]).filter(([j]) => j < i && pat[j] === pat[i]) }); });
      const best = Math.max(...cnt.values());
      return { kind: "table", title: `Max equal rows: ${best}`, rowHead: ["0", "1", "2"], colHead: ["c0", "c1", "c2", "pattern"], frames };
    },
  },

  "get-equal-substrings-within-budget": {
    approach: "Cost of position i is |s[i] - t[i]|; find the longest window whose cost sum is at most maxCost.",
    idea: ["Changing a substring costs the sum of its per-position costs, all non-negative.", "Standard variable sliding window: add cost[R], shrink from L while over budget."],
    code: `def equalSubstring(s, t, maxCost):
    L = cost = best = 0
    for R in range(len(s)):
        cost += abs(ord(s[R]) - ord(t[R]))
        while cost > maxCost:
            cost -= abs(ord(s[L]) - ord(t[L]))
            L += 1
        best = max(best, R - L + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "abcd", t = "bcdf", max = 3, c = [...s].map((ch, i) => Math.abs(ch.charCodeAt(0) - t.charCodeAt(i))), frames: CellsFrame[] = []; let L = 0, cost = 0, best = 0;
      c.forEach((x, R) => { cost += x; while (cost > max) { cost -= c[L]; L++; } best = Math.max(best, R - L + 1); frames.push({ note: `R=${R}: window cost ${cost} ≤ ${max}, length ${R - L + 1} (best ${best})`, tones: { ...range(L, R, 0), ...range(L, R, 1), ...range(L, R, 2) }, marks: [{ i: L, label: "L", row: 2 }, { i: R, label: "R", row: 2 }] }); });
      return cells(`Budget ${max}: longest ${best}`, [[...s], [...t], c], frames, ["s", "t", "cost"]);
    },
  },

  "difference-between-ones-and-zeros-in-row-and-column": {
    approach: "Count ones per row and column once; then diff[i][j] = 2 · onesRow[i] + 2 · onesCol[j] - m - n.",
    idea: ["zerosRow = n - onesRow and zerosCol = m - onesCol.", "onesRow + onesCol - zerosRow - zerosCol simplifies to 2 · onesRow + 2 · onesCol - n - m.", "Two passes, no repeated counting."],
    code: `def onesMinusZeros(grid):
    m, n = len(grid), len(grid[0])
    r = [sum(row) for row in grid]
    c = [sum(col) for col in zip(*grid)]
    return [[2 * r[i] + 2 * c[j] - m - n for j in range(n)] for i in range(m)]`,
    lang: "python", time: "O(m · n)", space: "O(m + n)",
    viz: () => {
      const g = [[0, 1, 1], [1, 0, 1], [0, 0, 1]], m = 3, n = 3, r = g.map((row) => row.reduce((x, y) => x + y, 0)), c = [0, 1, 2].map((j) => g.reduce((x, row) => x + row[j], 0));
      const out = g.map((row) => row.map(() => null as number | null)), grid = () => [...out.map((row, i) => [...row, r[i]]), [...c, null]], frames: TableFrame[] = [{ note: "Ones per row (last column) and per column (last row)", cells: [...g.map((row, i) => [...row, r[i]]), [...c, null]] }];
      for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { out[i][j] = 2 * r[i] + 2 * c[j] - m - n; frames.push({ note: `(${i},${j}): 2·${r[i]} + 2·${c[j]} - ${m} - ${n} = ${out[i][j]}`, cells: grid(), active: [i, j], deps: [[i, 3], [3, j]] }); }
      return { kind: "table", title: "Ones minus zeros", rowHead: ["r0", "r1", "r2", "ones"], colHead: ["c0", "c1", "c2", "ones"], frames };
    },
  },

  "pairs-of-songs-with-total-durations-divisible-by-60": {
    approach: "Count remainders mod 60; each song pairs with every earlier song whose remainder completes it to 60.",
    idea: ["(a + b) % 60 == 0 iff a % 60 + b % 60 is 0 or 60.", "For remainder r the partner is (60 - r) % 60, so 0 pairs with 0 and 30 with 30.", "Look up the partner count before adding the current song."],
    code: `def numPairsDivisibleBy60(time):
    cnt = [0] * 60
    ans = 0
    for t in time:
        ans += cnt[(60 - t % 60) % 60]
        cnt[t % 60] += 1
    return ans`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [30, 20, 150, 100, 40], rem = a.map((x) => x % 60), cnt = new Map<number, number>(), frames: CellsFrame[] = []; let ans = 0;
      a.forEach((_, i) => { const need = (60 - rem[i]) % 60, add = cnt.get(need) || 0; ans += add; cnt.set(rem[i], (cnt.get(rem[i]) || 0) + 1); frames.push({ note: `remainder ${rem[i]} needs a partner with remainder ${need}: ${add} earlier → total ${ans}`, tones: { [`1:${i}`]: "active", ...(Object.fromEntries(rem.slice(0, i).map((r, j) => [j, r] as const).filter(([, r]) => r === need).map(([j]) => [`1:${j}`, "found"])) as Record<string, Tone>) } }); });
      return cells(`Pairs divisible by 60: ${ans}`, [a, rem], frames, ["time", "% 60"]);
    },
  },

  "search-a-2d-matrix-ii": {
    approach: "Start at the top-right corner: if the value is too big, move left; if too small, move down.",
    idea: ["At the top-right, everything left is smaller and everything below is bigger.", "So each comparison throws away a whole column or a whole row.", "At most m + n steps."],
    code: `def searchMatrix(matrix, target):
    r, c = 0, len(matrix[0]) - 1
    while r < len(matrix) and c >= 0:
        v = matrix[r][c]
        if v == target:
            return True
        if v > target:
            c -= 1
        else:
            r += 1
    return False`,
    lang: "python", time: "O(m + n)", space: "O(1)",
    viz: () => {
      const g = [[1, 4, 7, 11, 15], [2, 5, 8, 12, 19], [3, 6, 9, 16, 22], [10, 13, 14, 17, 24], [18, 21, 23, 26, 30]], target = 5, frames: TableFrame[] = [], gone: Record<string, Tone> = {}; let r = 0, c = 4, found = false;
      while (r < 5 && c >= 0) { const v = g[r][c]; if (v === target) { frames.push({ note: `${v} = ${target}: found`, cells: g, active: [r, c], tones: { ...gone } }); found = true; break; } if (v > target) { for (let i = 0; i < 5; i++) gone[`${i}:${c}`] = "muted"; frames.push({ note: `${v} > ${target}: the whole column below is bigger, move left`, cells: g, active: [r, c], tones: { ...gone } }); c--; } else { for (let j = 0; j < 5; j++) gone[`${r}:${j}`] = "muted"; frames.push({ note: `${v} < ${target}: the whole row to the left is smaller, move down`, cells: g, active: [r, c], tones: { ...gone } }); r++; } }
      return { kind: "table", title: `Staircase search for ${target}: ${found}`, rowHead: ["0", "1", "2", "3", "4"], colHead: ["0", "1", "2", "3", "4"], frames };
    },
  },

  "custom-sort-string": {
    approach: "Count the letters of s, write the letters of order first (each as many times as it appears), then whatever is left.",
    idea: ["Only letters in order have a required position; the rest can go anywhere.", "A counter makes it one pass over order plus one over the leftovers."],
    code: `from collections import Counter
def customSortString(order, s):
    cnt = Counter(s)
    out = [c * cnt.pop(c) for c in order if c in cnt]
    return "".join(out) + "".join(c * k for c, k in cnt.items())`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const order = "cba", s = "abcdc", cnt = new Map<string, number>(); [...s].forEach((c) => cnt.set(c, (cnt.get(c) || 0) + 1));
      const out: (string | number)[] = blank(s.length), frames: CellsFrame[] = [{ note: `Counts in s: ${[...cnt.entries()].map(([c, k]) => `${c}×${k}`).join(", ")}`, rows: [[...order], [...out]] }]; let w = 0;
      [...order].forEach((c, i) => { const k = cnt.get(c) || 0; cnt.delete(c); for (let x = 0; x < k; x++) out[w++] = c; frames.push({ note: `order[${i}] = '${c}': write it ${k}×`, rows: [[...order], [...out]], tones: { [`0:${i}`]: "active", ...range(w - k, w - 1, 1, "found") } }); });
      const rest = [...cnt.entries()]; rest.forEach(([c, k]) => { for (let x = 0; x < k; x++) out[w++] = c; }); frames.push({ note: `leftovers not in order: ${rest.map(([c]) => c).join(", ") || "none"} → "${out.join("")}"`, rows: [[...order], [...out]], tones: range(0, s.length - 1, 1, "found") });
      return cells(`order "${order}", s "${s}"`, [[...order], blank(s.length)], frames, ["order", "out"]);
    },
  },

  "longest-palindrome-by-concatenating-two-letter-words": {
    approach: "Pair each word with its reverse (4 letters per pair); doubled words like 'gg' pair with themselves, and one leftover can sit in the middle.",
    idea: ["A word 'ab' can only be mirrored by 'ba' on the other side: use min(count(ab), count(ba)) pairs.", "A word 'aa' mirrors itself: count // 2 pairs.", "If any 'aa' word is left unpaired, put one in the centre for 2 more letters."],
    code: `from collections import Counter
def longestPalindrome(words):
    cnt = Counter(words)
    ans, center = 0, False
    for w, k in cnt.items():
        if w[0] == w[1]:
            ans += k // 2 * 4
            if k % 2:
                center = True
        elif w < w[::-1]:
            ans += min(k, cnt[w[::-1]]) * 4
    return ans + (2 if center else 0)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const words = ["ab", "ty", "yt", "lc", "cl", "ab", "gg"], cnt = new Map<string, number>(); words.forEach((w) => cnt.set(w, (cnt.get(w) || 0) + 1));
      const keys = [...cnt.keys()], rows: (string | number | null)[][] = keys.map((w) => [cnt.get(w)!, null]), frames: TableFrame[] = []; let ans = 0, center = false;
      keys.forEach((w, i) => { const k = cnt.get(w)!, rv = [...w].reverse().join(""); let add = 0, note: string; if (w[0] === w[1]) { add = Math.floor(k / 2) * 4; if (k % 2) center = true; note = `'${w}' mirrors itself: ${Math.floor(k / 2)} pairs${k % 2 ? ", one left for the centre" : ""}`; } else if (w < rv) { add = Math.min(k, cnt.get(rv) || 0) * 4; note = `'${w}' with '${rv}': ${add / 4} pair${add === 4 ? "" : "s"}`; } else note = `'${w}' was counted with '${rv}'`; ans += add; rows[i][1] = add; frames.push({ note: `${note} → +${add} (total ${ans})`, cells: rows.map((r) => [...r]), active: [i, 1] }); });
      frames.push({ note: `${center ? "Centre word adds 2" : "No centre word"}: answer ${ans + (center ? 2 : 0)}`, cells: rows.map((r) => [...r]) });
      return { kind: "table", title: `Longest palindrome: ${ans + (center ? 2 : 0)}`, rowHead: keys, colHead: ["count", "letters added"], frames };
    },
  },
};

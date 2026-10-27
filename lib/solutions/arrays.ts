// Hand-written solutions (arrays, strings, maths) for the first two weeks of the daily plan.
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
};


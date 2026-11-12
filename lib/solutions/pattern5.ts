// Hand-written solutions for questions added to the newer pattern lists (lib/patterns/deep/*.problems.ts). See arrays.ts for the style.
import type { CellsFrame, Diagram, Mark, Tone } from "../diagram";
import { range } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const orBlank = (a: (string | number)[]) => (a.length ? a : [""]);
const perm = (m: number, r: number) => { let out = 1; for (let t = 0; t < r; t++) out *= m - t; return out; };

export const PATTERN5: Record<string, Solution> = {
  "jump-game-vi": {
    approach: "dp[i] = nums[i] + the best dp in the last k indices; a deque of indices with falling dp values hands over that best in O(1).",
    idea: ["dp[i] is the best score of a path that ends on index i, and dp[0] = nums[0].", "The best previous step is the largest dp among indices i - k to i - 1, a sliding window maximum.", "Keep a deque of indices whose dp values fall from front to back: drop the front once it is more than k behind, then read it.", "Before pushing i, pop every back index whose dp is no better than dp[i]: it is older and smaller, so it can never be the best again.", "The answer is dp[n - 1]."],
    code: `from collections import deque
def maxResult(nums, k):
    dp = [0] * len(nums)
    dp[0] = nums[0]
    dq = deque([0])
    for i in range(1, len(nums)):
        if dq[0] < i - k:
            dq.popleft()
        dp[i] = nums[i] + dp[dq[0]]
        while dq and dp[dq[-1]] <= dp[i]:
            dq.pop()
        dq.append(i)
    return dp[-1]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const nums = [1, -1, -2, 4, -7, 3], k = 2, n = nums.length, dp = Array(n).fill(0), dq = [0], frames: CellsFrame[] = [];
      const show = (upto: number) => dp.map((v, j) => (j <= upto ? v : ""));
      dp[0] = nums[0];
      frames.push({ note: `Start on index 0 with score ${nums[0]}. The deque holds indices whose dp values fall from front to back: [0]`, rows: [nums, show(0)], tones: { "1:0": "found" } });
      for (let i = 1; i < n; i++) {
        let drop = "";
        if (dq[0] < i - k) drop = `index ${dq.shift()} is more than k = ${k} behind, drop it; `;
        const best = dq[0]; dp[i] = nums[i] + dp[best];
        const popped: number[] = [];
        while (dq.length && dp[dq[dq.length - 1]] <= dp[i]) popped.push(dq.pop()!);
        dq.push(i);
        frames.push({ note: `i = ${i}: ${drop}the front is index ${best} with dp ${dp[best]}, so dp[${i}] = ${nums[i]} + ${dp[best]} = ${dp[i]}${popped.length ? `; it is at least dp of index ${popped.join(", ")}, so pop ${popped.length > 1 ? "them" : "it"}` : ""}. Deque [${dq.join(", ")}]`, rows: [nums, show(i)], tones: { ...range(Math.max(0, i - k), i - 1, 1), [`1:${best}`]: "active", [`1:${i}`]: "found" }, marks: [{ i, label: "i" }] });
      }
      frames.push({ note: `The last index holds the best score: ${dp[n - 1]}`, rows: [nums, show(n - 1)], tones: { [`1:${n - 1}`]: "found" } });
      return cells(`maxResult(k = ${k}) = ${dp[n - 1]}`, [nums, show(n - 1)], frames, ["nums", "dp"]);
    },
  },

  "minimum-index-of-a-valid-split": {
    approach: "Boyer-Moore vote finds the dominant value; then scan split points with a running count, checking both halves keep it as a strict majority.",
    idea: ["Both halves can only share a dominant value if it is the dominant value of the whole array, so find that one first.", "Boyer-Moore vote: keep a candidate and a count, add 1 for a match and subtract 1 otherwise; a new candidate takes over when the count is 0.", "Count how often the candidate appears in total.", "Scan split points i from the left with left = its count in nums[0..i]: the split works when left * 2 > i + 1 and (total - left) * 2 > n - i - 1.", "Return the first such i, or -1."],
    code: `def minimumIndex(nums):
    cand = cnt = 0
    for x in nums:
        if cnt == 0:
            cand = x
        cnt += 1 if x == cand else -1
    total, n, left = nums.count(cand), len(nums), 0
    for i, x in enumerate(nums[:-1]):
        left += x == cand
        if left * 2 > i + 1 and (total - left) * 2 > n - i - 1:
            return i
    return -1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const nums = [2, 1, 3, 1, 1, 1, 7, 1, 2, 1], n = nums.length, frames: CellsFrame[] = [];
      let cand = 0, cnt = 0;
      nums.forEach((x, i) => {
        const took = cnt === 0; if (took) cand = x; cnt += x === cand ? 1 : -1;
        frames.push({ note: `Vote, x = ${x}: ${took ? `count was 0, so ${x} becomes the candidate; ` : ""}${x === cand ? "it matches" : `it differs from ${cand}`}, count ${cnt}`, tones: { ...range(0, i - 1, 0, "muted"), [`0:${i}`]: x === cand ? "found" : "bad" }, marks: [{ i, label: `${cand}:${cnt}` }] });
      });
      const total = nums.filter((x) => x === cand).length;
      const all = Object.fromEntries(nums.map((x, j) => [`0:${j}`, (x === cand ? "window" : "muted") as Tone]));
      frames.push({ note: `The candidate ${cand} appears ${total} times out of ${n}, so it is the dominant value. Now try split points from the left`, tones: all });
      let left = 0, ans = -1;
      for (let i = 0; i < n - 1; i++) {
        left += nums[i] === cand ? 1 : 0;
        const okL = left * 2 > i + 1, okR = (total - left) * 2 > n - i - 1;
        frames.push({ note: `Split after index ${i}: left has ${left} of ${i + 1} (${okL ? "majority" : "not a majority"}), right has ${total - left} of ${n - i - 1} (${okR ? "majority" : "not a majority"})${okL && okR ? `, so the answer is ${i}` : ""}`, tones: { ...all, ...range(0, i, 0, okL ? "found" : "bad"), ...(okL && okR ? range(i + 1, n - 1, 0, "found") : {}) }, marks: [{ i, label: "split" }] });
        if (okL && okR) { ans = i; break; }
      }
      return cells(`minimumIndex = ${ans}`, [nums], frames);
    },
  },

  "number-of-digit-one": {
    approach: "Digit DP along n's digits: while matching n's prefix, every smaller digit frees the rest, and a free tail of r digits holds 10^r endings with r * 10^(r - 1) ones.",
    idea: ["Walk n's digits from the left, staying on n's own prefix (the tight path) and counting its 1s in ones.", "At a position with digit d, any x < d makes the number already smaller than n, so the r digits after it are free: 10^r endings.", "Those endings carry the fixed 1s (ones, plus one if x is 1) each, and the free digits add r * 10^(r - 1) more, since each free position is 1 in a tenth of them.", "Then follow d itself and continue; at the end add the 1s of n itself.", "This is the memoised digit DP with its free states summed by formula."],
    code: `def countDigitOne(n):
    s = str(n)
    total = ones = 0
    for i, ch in enumerate(s):
        d, r = int(ch), len(s) - i - 1
        for x in range(d):
            total += (ones + (x == 1)) * 10 ** r + r * 10 ** r // 10
        ones += d == 1
    return total + ones`,
    lang: "python", time: "O(10 log n)", space: "O(log n)",
    viz: () => {
      const n = 213, s = String(n).split("").map(Number), L = s.length, frames: CellsFrame[] = [], added: (string | number)[] = s.map(() => "");
      let total = 0, ones = 0;
      frames.push({ note: `Count the digit 1 in every number from 0 to ${n}. Walk ${n} digit by digit, keeping how many 1s its own prefix has`, rows: [s, [...added]] });
      s.forEach((d, i) => {
        const r = L - i - 1; let here = 0;
        for (let x = 0; x < d; x++) {
          const fixed = ones + (x === 1 ? 1 : 0), add = fixed * 10 ** r + (r * 10 ** r) / 10;
          total += add; here += add; added[i] = here;
          frames.push({ note: `Position ${i + 1}: put ${x} below n's ${d}, so ${r ? `the last ${r} digit${r > 1 ? "s run" : " runs"} free over ${10 ** r} endings: ${fixed} fixed one${fixed === 1 ? "" : "s"} each plus ${(r * 10 ** r) / 10} in the free digits` : `this is the last digit: ${fixed} one${fixed === 1 ? "" : "s"}`} → +${add}, total ${total}`, rows: [s, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active", [`1:${i}`]: "found" }, marks: [{ i, label: `x=${x}` }] });
        }
        if (!d) frames.push({ note: `Position ${i + 1} is 0: nothing smaller fits, so just follow n's prefix`, rows: [s, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" } });
        ones += d === 1 ? 1 : 0;
      });
      frames.push({ note: `Finally ${n} itself has ${ones} one${ones === 1 ? "" : "s"}: ${total} + ${ones} = ${total + ones}`, rows: [s, [...added]], tones: range(0, L - 1, 0, "done") });
      return cells(`countDigitOne(${n}) = ${total + ones}`, [s, added], frames, ["n", "added"]);
    },
  },

  "numbers-at-most-n-given-digit-set": {
    approach: "Digit DP with only the tight path: shorter lengths are all free (k^L each), then at each digit of n count the smaller allowed digits times k^rest, and stop once n's digit is not allowed.",
    idea: ["Every number with fewer digits than n is below n: k choices per position, so k^L numbers of each length L.", "For numbers with n's length, walk n's digits from the left while the prefix still equals n's.", "An allowed digit smaller than n's digit frees the rest: k^(digits left) numbers.", "If n's digit itself is not allowed, the tight path ends there; if every digit of n is allowed, count n too."],
    code: `def atMostNGivenDigitSet(digits, n):
    s, k = str(n), len(digits)
    total = sum(k ** L for L in range(1, len(s)))
    for i, ch in enumerate(s):
        total += sum(d < ch for d in digits) * k ** (len(s) - i - 1)
        if ch not in digits:
            return total
    return total + 1`,
    lang: "python", time: "O(log n * k)", space: "O(log n)",
    viz: () => {
      const digits = ["1", "3", "5", "7"], n = 365, s = String(n).split(""), k = digits.length, frames: CellsFrame[] = [], added: (string | number)[] = s.map(() => "");
      let total = 0, ans = -1;
      frames.push({ note: `Digits {${digits.join(", ")}}, n = ${n}. First count every shorter number, then walk ${n}'s digits`, rows: [s, [...added]] });
      for (let L = 1; L < s.length; L++) { total += k ** L; frames.push({ note: `${L}-digit numbers: ${k}^${L} = ${k ** L}, all below ${n}; total ${total}`, rows: [s, [...added]] }); }
      for (let i = 0; i < s.length; i++) {
        const below = digits.filter((d) => d < s[i]), rest = s.length - i - 1, add = below.length * k ** rest, inSet = digits.includes(s[i]);
        total += add; added[i] = add;
        frames.push({ note: `Digit ${i + 1} of n is ${s[i]}: ${below.length ? `{${below.join(", ")}} ${below.length > 1 ? "are" : "is"} smaller, each frees ${rest} digit${rest === 1 ? "" : "s"} → ${below.length} × ${k ** rest} = ${add}` : "no allowed digit is smaller"}, total ${total}. ${inSet ? `${s[i]} is allowed, so keep matching n` : `${s[i]} is not allowed, so no number can match n further: stop`}`, rows: [s, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: inSet ? "active" : "bad", [`1:${i}`]: "found" } });
        if (!inSet) { ans = total; break; }
      }
      if (ans < 0) { ans = total + 1; frames.push({ note: `Every digit of n is allowed, so n counts too: ${ans}`, rows: [s, [...added]], tones: range(0, s.length - 1, 0, "found") }); }
      else frames.push({ note: `Answer: ${ans} numbers up to ${n} use only these digits`, rows: [s, [...added]], tones: range(0, s.length - 1, 1, "done") });
      return cells(`atMostNGivenDigitSet = ${ans}`, [s, added], frames, ["n", "added"]);
    },
  },

  "count-numbers-with-unique-digits": {
    approach: "Count by length: an L-digit number with distinct digits has 9 choices for the first digit, then 9, 8, 7, ... for the rest, since every free choice must avoid the used digits.",
    idea: ["The range is 0 to 10^n - 1, and 0 counts as one number.", "For L digits the first digit has 9 choices (not 0), the second 9 (0 is back, the first is used), the third 8, and so on.", "Keep ways = the count for the current length and multiply by 10 - L to move to the next length.", "Add ways for every L from 1 to n; past 10 digits ways becomes 0."],
    code: `def countNumbersWithUniqueDigits(n):
    total, ways = 1, 9
    for L in range(1, n + 1):
        total += ways
        ways *= 10 - L
    return total`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 4, Ls = Array.from({ length: n }, (_, i) => i + 1), wayRow: (string | number)[] = Ls.map(() => ""), totRow: (string | number)[] = Ls.map(() => ""), frames: CellsFrame[] = [];
      let total = 1, ways = 9;
      frames.push({ note: `Numbers from 0 to ${10 ** n - 1}. Start with total = 1 for the number 0`, rows: [Ls, [...wayRow], [...totRow]] });
      for (let L = 1; L <= n; L++) {
        total += ways; wayRow[L - 1] = ways; totRow[L - 1] = total;
        const picks = [9, ...Array.from({ length: L - 1 }, (_, t) => 9 - t)];
        frames.push({ note: `${L}-digit numbers: ${L > 1 ? `${picks.join(" × ")} = ` : ""}${ways} have distinct digits; total ${total}`, rows: [Ls, [...wayRow], [...totRow]], tones: { [`1:${L - 1}`]: "active", [`2:${L - 1}`]: "found" } });
        ways *= 10 - L;
      }
      frames.push({ note: `countNumbersWithUniqueDigits(${n}) = ${total}`, rows: [Ls, [...wayRow], [...totRow]], tones: range(0, n - 1, 2, "done") });
      return cells(`countNumbersWithUniqueDigits(${n}) = ${total}`, [Ls, wayRow, totRow], frames, ["digits", "ways", "total"]);
    },
  },

  "count-special-integers": {
    approach: "Digit DP with a used-digit set: count all shorter numbers by permutations, then walk n's digits, freeing the rest after every smaller unused digit, and stop at a repeated digit.",
    idea: ["Shorter numbers with m digits and distinct digits: 9 × P(9, m - 1) (no leading zero, then unused digits).", "For numbers with n's length, walk n's digits while the prefix equals n's, remembering which digits it used.", "At position i any unused x below n's digit (x ≥ 1 at the front) frees the rest: P(9 - i, digits left) ways to fill them with unused digits.", "If n's digit is already used, the tight path breaks there; if the walk finishes, n itself is special, so add 1."],
    code: `from math import perm
def countSpecialNumbers(n):
    s = str(n)
    L = len(s)
    total = sum(9 * perm(9, m - 1) for m in range(1, L))
    used = set()
    for i, ch in enumerate(s):
        d = int(ch)
        for x in range(1 if i == 0 else 0, d):
            if x not in used:
                total += perm(9 - i, L - i - 1)
        if d in used:
            return total
        used.add(d)
    return total + 1`,
    lang: "python", time: "O(10 log n)", space: "O(1)",
    viz: () => {
      const n = 135, s = String(n).split("").map(Number), L = s.length, frames: CellsFrame[] = [], added: (string | number)[] = s.map(() => ""), used = new Set<number>();
      let total = 0, ans = -1;
      frames.push({ note: `Count numbers from 1 to ${n} with no repeated digit. First every shorter length, then walk ${n}'s digits`, rows: [s, [...added]] });
      for (let m = 1; m < L; m++) { const w = 9 * perm(9, m - 1); total += w; frames.push({ note: `${m}-digit numbers: 9 × P(9, ${m - 1}) = ${w}; total ${total}`, rows: [s, [...added]] }); }
      for (let i = 0; i < L; i++) {
        const d = s[i], xs: number[] = [];
        for (let x = i === 0 ? 1 : 0; x < d; x++) if (!used.has(x)) xs.push(x);
        const each = perm(9 - i, L - i - 1), add = xs.length * each, rep = used.has(d);
        total += add; added[i] = add;
        frames.push({ note: `Digit ${i + 1} of n is ${d}${used.size ? `, used {${[...used].join(", ")}}` : ""}: ${xs.length ? `unused smaller choices {${xs.join(", ")}} each leave P(${9 - i}, ${L - i - 1}) = ${each} → +${add}` : "no unused smaller choice"}, total ${total}. ${rep ? `${d} is already used, so stop` : `${d} is free, keep matching n`}`, rows: [s, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: rep ? "bad" : "active", [`1:${i}`]: "found" } });
        if (rep) { ans = total; break; }
        used.add(d);
      }
      if (ans < 0) { ans = total + 1; frames.push({ note: `${n} itself has distinct digits, so add it: ${ans}`, rows: [s, [...added]], tones: range(0, L - 1, 0, "found") }); }
      else frames.push({ note: `Answer: ${ans}`, rows: [s, [...added]], tones: range(0, L - 1, 1, "done") });
      return cells(`countSpecialNumbers(${n}) = ${ans}`, [s, added], frames, ["n", "added"]);
    },
  },

  "non-negative-integers-without-consecutive-ones": {
    approach: "Digit DP on bits: k free bits with no two adjacent 1s form fib(k) strings, so walk n's bits and add fib(rest) at every 1 (put a 0 there instead), stopping at the first pair of 1s.",
    idea: ["fib[k] = how many k-bit strings have no two adjacent 1s: fib[0] = 1, fib[1] = 2, fib[k] = fib[k - 1] + fib[k - 2] (start with 0, or with 10).", "Walk n's bits from the top, staying on n's own prefix.", "At a 1 bit, putting 0 there makes the number smaller than n and frees the remaining bits: add fib[bits left].", "If this 1 follows another 1, n's prefix itself is invalid, so stop; otherwise continue.", "If the walk finishes, n itself is valid: add 1."],
    code: `def findIntegers(n):
    fib = [1, 2]
    while len(fib) < 32:
        fib.append(fib[-1] + fib[-2])
    bits = bin(n)[2:]
    total = prev = 0
    for i, b in enumerate(bits):
        if b == "1":
            total += fib[len(bits) - i - 1]
            if prev:
                return total
        prev = b == "1"
    return total + 1`,
    lang: "python", time: "O(log n)", space: "O(1)",
    viz: () => {
      const n = 21, bits = n.toString(2).split(""), L = bits.length, fib = [1, 2], frames: CellsFrame[] = [], added: (string | number)[] = bits.map(() => "");
      while (fib.length < L) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
      let total = 0, prev = false, ans = -1;
      frames.push({ note: `n = ${n} is ${bits.join("")} in binary. fib[k] = ${fib.map((f, k) => `${k}:${f}`).join(", ")} counts k free bits with no 11`, rows: [bits, [...added]] });
      for (let i = 0; i < L; i++) {
        const rest = L - i - 1;
        if (bits[i] === "1") {
          total += fib[rest]; added[i] = fib[rest];
          frames.push({ note: `Bit ${i + 1} is 1: a 0 here frees ${rest} bit${rest === 1 ? "" : "s"} → +fib[${rest}] = ${fib[rest]}, total ${total}${prev ? ". It follows a 1, so n's prefix has 11: stop" : ""}`, rows: [bits, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: prev ? "bad" : "active", [`1:${i}`]: "found" } });
          if (prev) { ans = total; break; }
        } else frames.push({ note: `Bit ${i + 1} is 0: no smaller choice here, follow n`, rows: [bits, [...added]], tones: { ...range(0, i - 1, 0, "done"), [`0:${i}`]: "active" } });
        prev = bits[i] === "1";
      }
      if (ans < 0) { ans = total + 1; frames.push({ note: `${bits.join("")} itself has no 11, so count it: ${ans}`, rows: [bits, [...added]], tones: range(0, L - 1, 0, "found") }); }
      return cells(`findIntegers(${n}) = ${ans}`, [bits, added], frames, ["bits", "added"]);
    },
  },

  "lru-cache": {
    approach: "A hash map from key to node plus a doubly linked list in use order: every get or put moves the node to the front, and eviction removes the node just before the tail.",
    idea: ["The map finds a key's node in O(1); the list keeps nodes from most to least recently used.", "Two sentinel nodes (head and tail) mean unlinking and inserting never check for empty lists.", "get: missing → -1; otherwise unlink the node, put it right after head and return its value.", "put: drop an old node for the key if present, insert a fresh one at the front, and if the size passes capacity unlink tail.prev and delete its key."],
    code: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity):
        self.cap, self.map = capacity, {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _unlink(self, node):
        node.prev.next, node.next.prev = node.next, node.prev

    def _push_front(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._unlink(node)
        self._push_front(node)
        return node.val

    def put(self, key, value):
        if key in self.map:
            self._unlink(self.map[key])
        node = self.map[key] = Node(key, value)
        self._push_front(node)
        if len(self.map) > self.cap:
            lru = self.tail.prev
            self._unlink(lru)
            del self.map[lru.key]`,
    lang: "python", time: "O(1) per operation", space: "O(capacity)",
    viz: () => {
      const cap = 2, ops: [string, number, number?][] = [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4]];
      const lst: [number, number][] = [], frames: CellsFrame[] = []; // most recent first
      const row = () => orBlank(lst.map(([k, v]) => `${k}=${v}`));
      frames.push({ note: `Capacity ${cap}. The list runs from most recent (left) to least recent (right); the map points at each node`, rows: [row()] });
      for (const [op, k, v] of ops) {
        const at = lst.findIndex(([key]) => key === k); let note: string;
        if (op === "get") {
          if (at < 0) note = `get(${k}): not in the map → -1`;
          else { const node = lst.splice(at, 1)[0]; lst.unshift(node); note = `get(${k}) = ${node[1]}: unlink it and move it to the front`; }
        } else {
          if (at >= 0) lst.splice(at, 1);
          lst.unshift([k, v!]); note = `put(${k}, ${v}): insert at the front`;
          if (lst.length > cap) { const [ek] = lst.pop()!; note += `; size ${cap + 1} > ${cap}, so evict ${ek} from the tail`; }
        }
        frames.push({ note, rows: [row()], tones: lst.length && lst[0][0] === k ? { "0:0": op === "get" ? "found" : "active" } : {} });
      }
      return cells(`LRUCache(${cap})`, [row()], frames, ["list"]);
    },
  },

  "lfu-cache": {
    approach: "Map each key to (value, uses) and each use count to an ordered bucket of keys oldest first; evict the oldest key in the bucket of the smallest count.",
    idea: ["key maps a key to its value and how many times it was used.", "bucket[f] is an OrderedDict (a hash map over a doubly linked list) of keys used f times, oldest first, so ties go to the least recently used.", "Touching a key moves it from bucket[f] to the end of bucket[f + 1]; if bucket[f] empties and f was min_freq, min_freq becomes f + 1.", "put of a new key on a full cache pops the first key of bucket[min_freq], then inserts with count 1 and sets min_freq = 1.", "Capacity 0 stores nothing."],
    code: `from collections import defaultdict, OrderedDict
class LFUCache:
    def __init__(self, capacity):
        self.cap, self.min_freq = capacity, 0
        self.key = {}
        self.bucket = defaultdict(OrderedDict)

    def _touch(self, key):
        val, f = self.key[key]
        del self.bucket[f][key]
        if not self.bucket[f]:
            del self.bucket[f]
            if self.min_freq == f:
                self.min_freq = f + 1
        self.key[key] = (val, f + 1)
        self.bucket[f + 1][key] = None

    def get(self, key):
        if key not in self.key:
            return -1
        self._touch(key)
        return self.key[key][0]

    def put(self, key, value):
        if self.cap == 0:
            return
        if key in self.key:
            self.key[key] = (value, self.key[key][1])
            self._touch(key)
            return
        if len(self.key) == self.cap:
            old, _ = self.bucket[self.min_freq].popitem(last=False)
            if not self.bucket[self.min_freq]:
                del self.bucket[self.min_freq]
            del self.key[old]
        self.key[key] = (value, 1)
        self.bucket[1][key] = None
        self.min_freq = 1`,
    lang: "python", time: "O(1) per operation", space: "O(capacity)",
    viz: () => {
      const cap = 2, ops: [string, number, number?][] = [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["get", 3], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4]];
      const val = new Map<number, number>(), freq = new Map<number, number>(), bucket = new Map<number, number[]>(), frames: CellsFrame[] = [];
      let minF = 0;
      const touch = (k: number) => { const f = freq.get(k)!, b = bucket.get(f)!; b.splice(b.indexOf(k), 1); if (!b.length) { bucket.delete(f); if (minF === f) minF = f + 1; } freq.set(k, f + 1); bucket.set(f + 1, [...(bucket.get(f + 1) ?? []), k]); };
      const order = () => [...bucket.keys()].sort((a, b) => a - b).flatMap((f) => bucket.get(f)!);
      const snap = (note: string, k: number) => { const o = order(), at = o.indexOf(k); frames.push({ note: `${note}. min_freq ${minF || "none"}`, rows: [orBlank(o.map((x) => `${x}=${val.get(x)}`)), orBlank(o.map((x) => freq.get(x)!))], tones: at >= 0 ? { [`0:${at}`]: "active", [`1:${at}`]: "active" } : {} }); };
      frames.push({ note: `Capacity ${cap}. Keys are shown by use count, oldest first inside a count, so the leftmost key is the next to evict`, rows: [[""], [""]] });
      for (const [op, k, v] of ops) {
        if (op === "get") {
          if (!val.has(k)) { snap(`get(${k}): missing → -1`, k); continue; }
          const f = freq.get(k)!; touch(k); snap(`get(${k}) = ${val.get(k)}: its count goes ${f} → ${f + 1}`, k);
        } else {
          let note = `put(${k}, ${v})`;
          if (val.size === cap) { const ev = bucket.get(minF)!.shift()!; if (!bucket.get(minF)!.length) bucket.delete(minF); note += `: full, evict ${ev}, the oldest key used ${minF} time${minF === 1 ? "" : "s"}`; val.delete(ev); freq.delete(ev); }
          val.set(k, v!); freq.set(k, 1); bucket.set(1, [...(bucket.get(1) ?? []), k]); minF = 1;
          snap(`${note}${note.includes(":") ? ";" : ":"} insert with count 1`, k);
        }
      }
      return cells(`LFUCache(${cap})`, [[""], [""]], frames, ["key", "uses"]);
    },
  },

  "design-browser-history": {
    approach: "Keep the pages in one array with a cursor cur and the last valid index end: visit overwrites cur + 1 and cuts off the forward pages, back and forward just clamp the cursor.",
    idea: ["pages[0..end] is the history, and cur is the page on screen.", "visit(url): move cur one step, write url there (reusing the slot if the array is longer) and set end = cur, which forgets every forward page.", "back(steps): cur = max(0, cur - steps).", "forward(steps): cur = min(end, cur + steps).", "Every call is O(1); a doubly linked list of pages works too but needs a walk of steps nodes."],
    code: `class BrowserHistory:
    def __init__(self, homepage):
        self.pages, self.cur, self.end = [homepage], 0, 0

    def visit(self, url):
        self.cur += 1
        if self.cur == len(self.pages):
            self.pages.append(url)
        else:
            self.pages[self.cur] = url
        self.end = self.cur

    def back(self, steps):
        self.cur = max(0, self.cur - steps)
        return self.pages[self.cur]

    def forward(self, steps):
        self.cur = min(self.end, self.cur + steps)
        return self.pages[self.cur]`,
    lang: "python", time: "O(1) per call", space: "O(visits)",
    viz: () => {
      const ops: [string, string | number][] = [["visit", "google"], ["visit", "facebook"], ["visit", "youtube"], ["back", 1], ["back", 1], ["forward", 1], ["visit", "linkedin"], ["forward", 2], ["back", 2], ["back", 7]];
      const pages = ["leetcode"], frames: CellsFrame[] = []; let cur = 0, end = 0;
      const snap = (note: string) => { const marks: Mark[] = [{ i: cur, label: "cur" }]; if (end !== cur) marks.push({ i: end, label: "end" }); frames.push({ note, rows: [[...pages]], tones: { ...range(end + 1, pages.length - 1, 0, "muted"), [`0:${cur}`]: "found" }, marks }); };
      snap(`Start on the homepage leetcode: cur = end = 0`);
      for (const [op, a] of ops) {
        if (op === "visit") { cur++; if (cur === pages.length) pages.push(a as string); else pages[cur] = a as string; end = cur; snap(`visit(${a}): write it at index ${cur} and set end = ${cur}, dropping any forward pages`); }
        else if (op === "back") { cur = Math.max(0, cur - (a as number)); snap(`back(${a}): cur = max(0, cur - ${a}) = ${cur} → ${pages[cur]}`); }
        else { cur = Math.min(end, cur + (a as number)); snap(`forward(${a}): cur = min(end, cur + ${a}) = ${cur} → ${pages[cur]}`); }
      }
      return cells("BrowserHistory: one array, a cursor and an end", [[...pages]], frames);
    },
  },
};

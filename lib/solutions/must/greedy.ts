// Solutions for the must-do "greedy" questions that were new to the app (lib/patterns/overview/greedy.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import type { Solution } from "../types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const pad = (a: (string | number)[], n: number) => [...a, ...Array(Math.max(0, n - a.length)).fill("")];

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "valid-parenthesis-string": {
    approach: "Track the range [lo, hi] of how many '(' can be open; a '*' widens it by one each way. Fail if hi drops below 0, succeed if lo can reach 0.",
    idea: ["Every way of reading the stars gives some count of open brackets at each position. Keep only the smallest and largest possible count.", "'(' adds 1 to both ends, ')' takes 1 from both, '*' takes 1 from lo (read as ')') and adds 1 to hi (read as '(').", "If hi goes negative, even reading every star as '(' cannot cover the ')' seen so far: return False.", "lo below 0 only means some reading closed too many, so clamp lo to 0 and drop those readings.", "At the end the string is valid when 0 is in the range, that is when lo is 0."],
    code: `def checkValidString(s):
    lo = hi = 0                 # fewest and most open brackets possible
    for ch in s:
        if ch == "(":
            lo, hi = lo + 1, hi + 1
        elif ch == ")":
            lo, hi = lo - 1, hi - 1
        else:
            lo, hi = lo - 1, hi + 1
        if hi < 0:
            return False
        lo = max(lo, 0)
    return lo == 0`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "((*)*))", chars = s.split(""), frames: CellsFrame[] = [];
      let lo = 0, hi = 0; const L: (string | number)[] = chars.map(() => ""), Hh: (string | number)[] = chars.map(() => "");
      frames.push({ note: "lo = hi = 0: no bracket is open yet", rows: [chars, L, Hh] });
      let ok = true;
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === "(") { lo++; hi++; } else if (ch === ")") { lo--; hi--; } else { lo--; hi++; }
        if (hi < 0) { ok = false; frames.push({ note: `'${ch}': hi = ${hi} < 0, too many ')' even if every star opens. Invalid`, rows: [chars, L, Hh], tones: { [`0:${i}`]: "bad" } }); break; }
        const clamp = lo < 0; lo = Math.max(lo, 0); L[i] = lo; Hh[i] = hi;
        frames.push({ note: `'${ch}': ${ch === "(" ? "both ends go up" : ch === ")" ? "both ends go down" : "lo goes down, hi goes up"}${clamp ? ", lo clamped to 0" : ""}. Open count is somewhere in [${lo}, ${hi}]`, rows: [chars, [...L], [...Hh]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "window", [`2:${i}`]: "window" } });
      }
      if (ok) { ok = lo === 0; frames.push({ note: ok ? "lo is 0 at the end: some reading of the stars closes every bracket. Valid" : `lo is ${lo}: at least ${lo} brackets stay open. Invalid`, rows: [chars, L, Hh], tones: { [`1:${chars.length - 1}`]: ok ? "found" : "bad" } }); }
      return cells(`checkValidString("${s}") = ${ok}`, [chars, L, Hh], frames, ["s", "lo", "hi"]);
    },
  },

  "merge-triplets-to-form-target-triplet": {
    approach: "Throw away every triplet with any value above the target; the rest can all be merged safely, so check that together they hit each target value.",
    idea: ["Merging takes the maximum in each slot, so a value can only grow.", "A triplet with any slot above the target would push that slot past it for good: never use it.", "Every other triplet is harmless, because merging it cannot exceed the target in any slot.", "So merge all of them: the result equals the target exactly when each slot's target value appears in at least one kept triplet.", "Track three booleans, one per slot."],
    code: `def mergeTriplets(triplets, target):
    got = [False] * 3
    for t in triplets:
        if all(t[i] <= target[i] for i in range(3)):    # safe to merge
            for i in range(3):
                if t[i] == target[i]:
                    got[i] = True
    return all(got)`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const T = [[2, 5, 3], [2, 3, 4], [1, 2, 5], [5, 2, 3]], target = [5, 5, 5], got = [false, false, false], frames: CellsFrame[] = [];
      const rows = () => [...T, target, got.map((g) => (g ? "yes" : "no"))];
      frames.push({ note: `Target ${target.join(", ")}. A triplet is safe if no slot is above the target`, rows: rows() });
      T.forEach((t, r) => {
        const safe = t.every((v, i) => v <= target[i]), hit: number[] = [];
        if (safe) t.forEach((v, i) => { if (v === target[i] && !got[i]) { got[i] = true; hit.push(i); } });
        const tones: Record<string, Tone> = Object.fromEntries(t.map((v, i) => [`${r}:${i}`, (!safe ? (v > target[i] ? "bad" : "muted") : v === target[i] ? "found" : "window") as Tone]));
        hit.forEach((i) => { tones[`5:${i}`] = "found"; });
        frames.push({ note: safe ? `[${t.join(", ")}] is safe${hit.length ? `; it supplies slot ${hit.join(" and ")}` : ", but supplies no new target value"}` : `[${t.join(", ")}] goes above the target, skip it`, rows: rows(), tones });
      });
      const ok = got.every(Boolean);
      frames.push({ note: ok ? "Every slot of the target is supplied by a safe triplet: True" : "Some slot is never supplied: False", rows: rows(), tones: Object.fromEntries([0, 1, 2].map((i) => [`5:${i}`, got[i] ? "found" : "bad"])) as Record<string, Tone> });
      return cells(`mergeTriplets = ${ok}`, rows(), frames, ["t0", "t1", "t2", "t3", "target", "have"]);
    },
  },

  "monotone-increasing-digits": {
    approach: "Scan the digits right to left; wherever a digit is bigger than the next, lower it by one and remember the spot. Every digit after the leftmost such spot becomes 9.",
    idea: ["If the digits already never fall, n is the answer.", "At a fall d[i - 1] > d[i], the prefix up to i - 1 must shrink, and the smallest change is d[i - 1] - 1.", "Lowering d[i - 1] can create a new fall further left, so scan right to left and keep fixing.", "Remember the leftmost index where a fall was fixed; everything from there on can be 9, the largest digit, and the result is still at most n.", "Going right to left touches each digit once."],
    code: `def monotoneIncreasingDigits(n):
    d = list(str(n))
    mark = len(d)
    for i in range(len(d) - 1, 0, -1):
        if d[i - 1] > d[i]:
            d[i - 1] = str(int(d[i - 1]) - 1)
            mark = i
    for i in range(mark, len(d)):
        d[i] = "9"
    return int("".join(d))`,
    lang: "python", time: "O(digits)", space: "O(digits)",
    viz: () => {
      const n = 43221, d = String(n).split("").map(Number), frames: CellsFrame[] = [];
      let mark = d.length;
      frames.push({ note: `n = ${n}. Scan pairs from the right; a pair that falls must be fixed`, rows: [[...d]] });
      for (let i = d.length - 1; i > 0; i--) {
        if (d[i - 1] > d[i]) { d[i - 1]--; mark = i; frames.push({ note: `${d[i - 1] + 1} > ${d[i]}: lower it to ${d[i - 1]} and remember index ${i}`, rows: [[...d]], tones: { [`0:${i - 1}`]: "bad", [`0:${i}`]: "active" } }); }
        else frames.push({ note: `${d[i - 1]} <= ${d[i]}: already rising, nothing to do`, rows: [[...d]], tones: { [`0:${i - 1}`]: "window", [`0:${i}`]: "window" } });
      }
      for (let i = mark; i < d.length; i++) d[i] = 9;
      const tones = Object.fromEntries(d.map((_, i) => [`0:${i}`, (i >= mark ? "found" : "done") as Tone]));
      frames.push({ note: `Everything from index ${mark} becomes 9, the largest digit that keeps it rising`, rows: [[...d]], tones });
      const ans = +d.join("");
      frames.push({ note: `Answer ${ans}: the largest number at most ${n} whose digits never fall`, rows: [[...d]], tones });
      return cells(`monotoneIncreasingDigits(${n}) = ${ans}`, [d], frames, ["digits"]);
    },
  },

  "dota2-senate": {
    approach: "Keep a queue of indices per party. The earlier senator bans the other party's front senator and goes back in line with index + n for the next round.",
    idea: ["The best move for any senator is to ban the next opposing senator who would act, because that one is the nearest threat.", "So compare the two queue fronts: the smaller index acts first and bans the other.", "The winner acts again next round; giving it index + n puts it after everyone left in this round.", "The loser is gone for good.", "When one queue is empty, the other party wins."],
    code: `from collections import deque
def predictPartyVictory(senate):
    n = len(senate)
    r = deque(i for i, c in enumerate(senate) if c == "R")
    d = deque(i for i, c in enumerate(senate) if c == "D")
    while r and d:
        a, b = r.popleft(), d.popleft()
        if a < b:
            r.append(a + n)      # a bans b and waits for the next round
        else:
            d.append(b + n)
    return "Radiant" if r else "Dire"`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "RDDRRD", n = s.length, frames: CellsFrame[] = [];
      const r: number[] = [], d: number[] = [];
      s.split("").forEach((c, i) => (c === "R" ? r : d).push(i));
      const w = () => Math.max(r.length, d.length, 1);
      frames.push({ note: `Queues of indices. R: [${r.join(", ")}], D: [${d.join(", ")}]`, rows: [pad(r, w()), pad(d, w())] });
      while (r.length && d.length) {
        const a = r.shift()!, b = d.shift()!;
        if (a < b) r.push(a + n); else d.push(b + n);
        frames.push({ note: a < b ? `R at ${a} acts before D at ${b}: bans it, and comes back as ${a + n}` : `D at ${b} acts before R at ${a}: bans it, and comes back as ${b + n}`, rows: [pad(r, w()), pad(d, w())], tones: a < b ? { [`0:${r.length - 1}`]: "found" } : { [`1:${d.length - 1}`]: "found" } });
      }
      const win = r.length ? "Radiant" : "Dire";
      frames.push({ note: `${r.length ? "D" : "R"} queue is empty: ${win} wins`, rows: [pad(r, w()), pad(d, w())], tones: { [r.length ? "0:0" : "1:0"]: "found" } });
      return cells(`predictPartyVictory("${s}") = ${win}`, [pad(r, w()), pad(d, w())], frames, ["R", "D"]);
    },
  },
};

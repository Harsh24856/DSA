// Overview of the "greedy" topic: the data structure or technique itself. Shown on /patterns/greedy before the patterns.
import type { CellsFrame, Diagram, IntervalsFrame, Tone } from "../../diagram";
import type { TopicOverview } from "../types";

/** Activity selection: sort by end, keep each interval that starts after the last kept one ends. */
function activities(): Diagram {
  const raw: [number, number][] = [[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [6, 10], [8, 11], [2, 14], [12, 16]];
  const items = [...raw].sort((a, b) => a[1] - b[1]), frames: IntervalsFrame[] = [], tones: Record<number, Tone> = {};
  let end = -Infinity; const kept: [number, number][] = [];
  frames.push({ note: "Sorted by end time. The interval that ends first leaves the most room for the rest, so it is always a safe first pick", tones: {} });
  items.forEach(([s, e], i) => {
    const take = s >= end;
    if (take) { kept.push([s, e]); tones[i] = "found"; } else tones[i] = "bad";
    frames.push({ note: take ? `[${s}, ${e}) starts at ${s}, not before the last end ${end === -Infinity ? "(none yet)" : end}: keep it. The new end is ${e}` : `[${s}, ${e}) starts at ${s}, before the last end ${end}: it overlaps, skip it`, tones: { ...tones, [i]: take ? "active" : "bad" }, result: [...kept], line: take ? e : end });
    if (take) end = e;
  });
  frames.push({ note: `${kept.length} intervals kept. Exchange argument: any optimal answer can swap its first interval for the earliest-ending one without losing anything, and the same holds for the rest`, tones: { ...tones }, result: [...kept] });
  return { kind: "intervals", title: `Activity selection keeps ${kept.length}`, items, frames };
}

/** Largest coin first against the DP answer on coins 1, 3, 4. */
function coinsFail(): Diagram {
  const coins = [1, 3, 4], amount = 6, frames: CellsFrame[] = [];
  const best: (number | string)[] = Array(amount + 1).fill(""); const idx = Array.from({ length: amount + 1 }, (_, i) => i);
  let left = amount; const picks: number[] = [];
  frames.push({ note: `Pay ${amount} with coins ${coins.join(", ")}. Greedy takes the largest coin that fits each time`, rows: [idx, best] });
  for (const c of [...coins].sort((a, b) => b - a)) while (left >= c) {
    left -= c; picks.push(c);
    frames.push({ note: `Greedy takes ${c}, ${left} left. Coins so far: ${picks.join(" + ")}`, rows: [idx, best], tones: { [`0:${left}`]: "active" } });
  }
  frames.push({ note: `Greedy uses ${picks.length} coins (${picks.join(" + ")}). Now check it with DP: best[a] = 1 + min over coins of best[a - c]`, rows: [idx, best] });
  const dp = [0, ...Array(amount).fill(Infinity)]; best[0] = 0;
  for (let a = 1; a <= amount; a++) {
    let from = -1;
    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) { dp[a] = dp[a - c] + 1; from = c; }
    best[a] = dp[a];
    frames.push({ note: `best[${a}] = ${dp[a]}, ending with coin ${from} (from best[${a - from}] = ${dp[a - from]})`, rows: [idx, [...best]], tones: { [`1:${a}`]: "active", [`1:${a - from}`]: "window" } });
  }
  frames.push({ note: `DP needs only ${dp[amount]} coins (3 + 3), greedy needed ${picks.length}. Taking 4 first looked best but ruled out the true answer: no exchange argument holds here`, rows: [idx, best], tones: { [`1:${amount}`]: "bad" } });
  return { kind: "cells", title: "Where greedy fails: coins 1, 3, 4", rowLabels: ["amount", "best"], rows: [idx, best], frames };
}

/** Fractional knapsack: best value per weight first, split the last item. */
function knapsack(): Diagram {
  const items = [[60, 10], [100, 20], [120, 30], [30, 15]].sort((a, b) => b[0] / b[1] - a[0] / a[1]), frames: CellsFrame[] = [];
  let cap = 50, total = 0; const took: (string | number)[] = items.map(() => "");
  const rows = () => [items.map((x) => x[0]), items.map((x) => x[1]), items.map((x) => +(x[0] / x[1]).toFixed(2)), [...took]];
  frames.push({ note: `Capacity ${cap}. Sort the items by value per unit of weight, highest first`, rows: rows() });
  items.forEach(([v, w], i) => {
    if (cap === 0) { frames.push({ note: `The bag is full, so item ${i + 1} is left out`, rows: rows(), tones: { [`3:${i}`]: "muted" } }); return; }
    const take = Math.min(w, cap); total += (v * take) / w; cap -= take; took[i] = take === w ? "all" : `${take}/${w}`;
    frames.push({ note: take === w ? `Take all of item ${i + 1} (weight ${w}, ratio ${(v / w).toFixed(2)}). Value ${total}, room left ${cap}` : `Only ${take} of ${w} fits: take that fraction for ${(v * take) / w}. Value ${total}, the bag is full`, rows: rows(), tones: { [`2:${i}`]: "active", [`3:${i}`]: "found" } });
  });
  frames.push({ note: `Total ${total}. Swapping any unit of a lower ratio item for a unit of a higher one never loses value, so this order is optimal. With whole items only (0/1 knapsack) the same rule fails and DP is needed`, rows: rows() });
  return { kind: "cells", title: `Fractional knapsack = ${total}`, rowLabels: ["value", "weight", "ratio", "taken"], rows: rows(), frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **greedy algorithm** builds the answer one decision at a time, and at each step takes the choice that looks best right now, by one fixed rule, without ever undoing it. There is no search over alternatives and no table of subproblems. That is why greedy solutions are short and usually run in O(n) or O(n log n), most often a sort followed by one pass.",
    "The **greedy choice** is the rule itself: the interval that ends first, the item with the best value per weight, the two smallest piles, the farthest reachable index. A greedy algorithm is correct only when two things hold. **Greedy choice property**: some optimal answer starts with the greedy choice. **Optimal substructure**: after making it, what remains is a smaller copy of the same problem. Together they let you apply the rule again and again.",
    "Greedy is not a data structure, but it leans on a few. Most greedy algorithms start by **sorting** by a key, and choosing the key is the real decision. When the best choice changes after every move (task scheduling, merging piles, picking the next meeting room), a **heap** hands over the current best in O(log n). Some use a running maximum or minimum (jump games, stock profit), and some a monotonic stack (remove digits to make the smallest number).",
    "Greedy is the opposite bet to dynamic programming. DP tries every choice at every step and keeps the best, so it is always right but costs a table. Greedy commits to one choice, so it is fast but right only when a proof says so. Many problems come in pairs that look alike: fractional knapsack is greedy, 0/1 knapsack is DP; coins 1, 5, 10, 25 are greedy, arbitrary coins are DP; interval scheduling by count is greedy, weighted interval scheduling is DP.",
    "Interviewers use a small vocabulary: the **exchange argument** (swap one piece of an optimal answer for the greedy piece and show it is no worse), **greedy stays ahead** (after every step greedy is at least as good as any other algorithm after the same number of steps), a **counterexample** (a small input where the greedy rule loses), and **canonical** coin systems (ones where largest-coin-first is optimal).",
  ],
  build: [
    "Step one is to state the rule in one sentence and find the **sort key** that serves it. Earliest end time for 'most non-overlapping intervals'. Earliest start for 'merge' and 'how many rooms'. Value divided by weight for fractional knapsack. Deadline for 'finish the most tasks'. The difference between two options (cost A minus cost B) for 'send half the people to each city'. A custom comparator `a + b > b + a` for 'largest number from these pieces'.",
    "Step two is to try to break it before you code it. Take 3 to 5 small inputs, especially ties, equal values, one element and cases where a locally worse choice could pay off later, and compare the rule with the answer you get by hand or by brute force. Coins 1, 3, 4 with amount 6 break largest-coin-first in one line. If you find a counterexample, the problem needs DP or search.",
    "Step three is the proof, which in an interview is a few sentences. **Exchange argument**: take any optimal answer O. If its first choice differs from greedy's choice g, replace it with g; show the answer stays valid and no worse. Repeat for each position, so greedy's answer is optimal. **Stays ahead**: define a measure after k steps (for intervals, the end time of the k-th kept interval) and show by induction that greedy's measure is always at least as good, so greedy cannot finish with fewer items.",
    "Step four is the loop, which usually keeps one or two numbers of state: the end of the last kept interval, the farthest reach, the remaining capacity, the current fuel. Each element is read once and either taken or skipped for good. If the 'best now' depends on what is already taken, put the candidates in a heap and pop the best each time; if a past choice might need undoing (refuelling, ladders and bricks, course deadlines), use a heap of past choices and **regret** the worst one when the rule is broken.",
    "Finally, check the edge cases that break most greedy code: an empty input, all elements equal, ties in the sort key (does the order of ties matter?), boundaries that touch (is [1, 2] followed by [2, 3] an overlap?), and running totals that overflow 32 bits.",
  ],
  code: `import heapq

def max_activities(intervals):
    """Most non-overlapping [start, end) intervals: sort by end, keep what fits."""
    kept, end = [], float("-inf")
    for s, e in sorted(intervals, key=lambda x: x[1]):
        if s >= end:                      # starts after the last kept one ends
            kept.append((s, e))
            end = e
    return kept

def fractional_knapsack(items, cap):
    """items = [(value, weight)]; take the best value per weight first, split the last."""
    total = 0.0
    for v, w in sorted(items, key=lambda x: x[0] / x[1], reverse=True):
        take = min(w, cap)
        total += v * take / w
        cap -= take
        if cap == 0:
            break
    return total

def greedy_coins(coins, amount):
    """Largest coin first. Optimal for 1, 2, 5, 10 ... but not for every coin set."""
    count = 0
    for c in sorted(coins, reverse=True):
        count += amount // c
        amount %= c
    return count if amount == 0 else -1

def dp_coins(coins, amount):
    """The always-correct answer, to show where greedy fails."""
    best = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        best[a] = min((best[a - c] + 1 for c in coins if c <= a), default=float("inf"))
    return best[amount] if best[amount] < float("inf") else -1

def min_rooms(intervals):
    """Fewest rooms for all meetings: sort by start, a min-heap of end times."""
    ends = []
    for s, e in sorted(intervals):
        if ends and ends[0] <= s:
            heapq.heapreplace(ends, e)    # reuse the room that frees first
        else:
            heapq.heappush(ends, e)
    return len(ends)

def huffman_cost(freq):
    """Cheapest way to merge everything when a merge costs the sum: always merge the two smallest."""
    freq = list(freq)
    heapq.heapify(freq)
    cost = 0
    while len(freq) > 1:
        a, b = heapq.heappop(freq), heapq.heappop(freq)
        cost += a + b
        heapq.heappush(freq, a + b)
    return cost

def min_jumps(nums):
    """Fewest jumps to the last index: BFS by levels of reach (Jump Game II)."""
    jumps = end = far = 0
    for i in range(len(nums) - 1):
        far = max(far, i + nums[i])
        if i == end:                      # this level is used up: jump once more
            jumps, end = jumps + 1, far
    return jumps

if __name__ == "__main__":
    assert max_activities([(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]) == [(1, 4), (5, 7), (8, 11), (12, 16)]
    assert fractional_knapsack([(60, 10), (100, 20), (120, 30)], 50) == 240.0
    assert greedy_coins([1, 5, 10, 25], 63) == dp_coins([1, 5, 10, 25], 63) == 6
    assert greedy_coins([1, 3, 4], 6) == 3 and dp_coins([1, 3, 4], 6) == 2     # greedy fails: 4+1+1 vs 3+3
    assert greedy_coins([2], 3) == -1 and dp_coins([2], 3) == -1
    assert min_rooms([(0, 30), (5, 10), (15, 20)]) == 2 and min_rooms([(7, 10), (2, 4)]) == 1
    assert huffman_cost([4, 3, 2, 6]) == 29
    assert min_jumps([2, 3, 1, 1, 4]) == 2 and min_jumps([0]) == 0
    print("ok")`,
  ops: [
    {
      title: "Standard greedy tasks and their cost",
      rows: [
        ["Sort by a key (the usual first step)", "O(n log n)", "O(n log n)", "Comparison sort; counting sort makes it O(n + range) for small integer keys"],
        ["Activity selection (most non-overlapping intervals)", "O(n log n)", "O(n log n)", "Sort by end, then one pass with the last end"],
        ["Minimum arrows or removals to clear overlaps", "O(n log n)", "O(n log n)", "Same as activity selection: answer is n minus the number kept"],
        ["Minimum meeting rooms", "O(n log n)", "O(n log n)", "Sort by start, min-heap of end times; or sort starts and ends separately"],
        ["Fractional knapsack", "O(n log n)", "O(n log n)", "Sort by value per weight; O(n) with a selection algorithm instead of a sort"],
        ["Coin change, canonical coins", "O(k)", "O(k)", "k coin types, largest first with division; arbitrary coins need DP in O(k x amount)"],
        ["Jump Game (can you reach the end?)", "O(n)", "O(n)", "Keep the farthest reachable index"],
        ["Jump Game II (fewest jumps)", "O(n)", "O(n)", "BFS by levels of reach: jump when the current level ends"],
        ["Gas station", "O(n)", "O(n)", "If the tank goes negative, no start up to here works: restart after it"],
        ["Stock profit, unlimited trades", "O(n)", "O(n)", "Sum every positive day-to-day rise"],
        ["Huffman coding, cheapest merge of piles", "O(n log n)", "O(n log n)", "Min-heap, always merge the two smallest"],
        ["Task scheduler, reorganise string", "O(n log k)", "O(n log k)", "Max-heap of counts, k distinct items; a counting formula gives O(n)"],
        ["Schedule by deadline with regret (Course Schedule III)", "O(n log n)", "O(n log n)", "Sort by deadline, max-heap of durations, drop the longest when late"],
        ["Two City Scheduling, sort by delta", "O(n log n)", "O(n log n)", "Sort by cost A minus cost B, first half to A"],
        ["Largest number from pieces", "O(n log n x L)", "O(n log n x L)", "Comparator a + b > b + a on strings of length L"],
        ["Remove k digits for the smallest number", "O(n)", "O(n)", "Monotonic stack: pop a bigger digit while removals remain"],
        ["Dijkstra, Prim, Kruskal", "O(E log V)", "O(E log V)", "Graph algorithms that are greedy at heart: finalise the closest vertex, add the cheapest safe edge"],
      ],
    },
    {
      title: "Proof and checking tools",
      rows: [
        ["Brute force on small inputs", "O(2^n) or O(n!)", "O(2^n) or O(n!)", "Compare with greedy on random inputs of size 5 to 8 before trusting it"],
        ["DP fallback when greedy fails", "O(n x state)", "O(n x state)", "Tries every choice at every step; always correct, more time and memory"],
        ["Exchange argument", "proof", "proof", "Swap one choice of an optimal answer for the greedy choice: still valid, no worse"],
        ["Greedy stays ahead", "proof", "proof", "Induction: after k steps greedy's measure is at least as good as any other answer's"],
      ],
    },
  ],
  builtins: [
    ["Sort by a key", "`sort(v.begin(), v.end(), [](auto& a, auto& b) { return a[1] < b[1]; })`", "`v.sort(key=lambda x: x[1])`"],
    ["Sort by a pairwise rule", "the same lambda comparator (must be a strict weak order)", "`functools.cmp_to_key(cmp)`"],
    ["Max-heap of candidates", "`priority_queue<int>`", "`heapq` with negated values"],
    ["Min-heap", "`priority_queue<int, vector<int>, greater<>>`", "`heapq.heappush` and `heapq.heappop`"],
    ["Pop and push in one step", "`pop()` then `push()`", "`heapq.heapreplace(h, x)`"],
    ["Counts of items", "`unordered_map<int, int>` or an array", "`collections.Counter`, with `most_common()`"],
    ["Ordered multiset (take the smallest that fits)", "`multiset<int>` with `lower_bound`", "none built in: `sortedcontainers.SortedList`, or `bisect` on a list in O(n) per insert"],
  ],
  when: [
    "'Maximum number of', 'minimum number of' things to pick, with a natural order to process them in (by end, by deadline, by size).",
    "Intervals, meetings or events, and the question is about how many fit, or how many to remove.",
    "'Largest' or 'smallest' number or string you can form by choosing digits or pieces one at a time.",
    "Reachability with a running limit: jumps, fuel, gas stations, a budget of bricks and ladders.",
    "n up to 10^5 or more, which rules out O(n^2) DP and hints at sort plus one pass.",
    "The problem lets you take fractions, or every step is reversible without cost, so no early choice can trap you.",
    "A small hand example shows that the obvious local choice is never worse than any alternative.",
  ],
  avoid: [
    "Items must be taken whole and you trade value against weight (0/1 knapsack): DP over capacity.",
    "Coins or denominations are arbitrary: largest-first can be wrong, use DP (coins 1, 3, 4 and amount 6 is the counterexample).",
    "Intervals carry weights or profits: weighted interval scheduling needs DP plus binary search, not earliest end.",
    "A small counterexample exists, or choices interact far apart (longest path, partition into equal sums): use DP or backtracking.",
    "You cannot state why the rule is safe in two sentences: brute force small cases first, or fall back to DP.",
  ],
  tips: [
    "Say the greedy rule out loud, then say why it is safe (exchange argument or stays ahead) before writing code. Interviewers grade the argument as much as the code.",
    "Try to break your rule with a tiny counterexample first; finding one in the interview is a win, not a failure, because it tells you to switch to DP.",
    "The sort key decides everything: by end for selecting intervals, by start for merging or counting rooms. Mixing them up is the classic interval bug.",
    "Decide the tie rule and the boundary rule ([1, 2] then [2, 3]: overlap or not?) explicitly, and match the comparison (< or <=) to it.",
    "When a greedy choice may later look wrong, keep past choices in a heap and undo the worst one (regret greedy) instead of switching to DP.",
    "Use 64-bit totals for sums of costs, and avoid floating point comparisons in sort keys: compare a1 x b2 with a2 x b1 instead of a1 / b1 with a2 / b2.",
    "Many greedy answers are a sort plus one pass: quote O(n log n) time and O(1) extra space (or O(n) if the sort copies).",
  ],
  viz: [
    { name: "Activity selection by earliest end", make: activities, label: "Keep each interval that starts after the last kept one ends" },
    { name: "Where greedy fails: coin change", make: coinsFail, label: "Largest coin first against DP on coins 1, 3, 4" },
    { name: "Fractional knapsack by ratio", make: knapsack, label: "Best value per weight first, split the last item" },
  ],
};

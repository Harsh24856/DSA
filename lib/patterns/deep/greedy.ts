// Deeper theory for the "greedy" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram } from "../../diagram";
import { range } from "../../sim";
import { nums, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "Earliest end first is optimal, and the proof is an exchange. Let g be the interval that ends first. Take any optimal schedule and look at its first interval f. Since g ends no later than f, replacing f with g cannot create a conflict with the rest of the schedule, and the count stays the same. So some optimal schedule starts with g. Remove every interval that overlaps g and repeat the argument on what is left.",
    "Another way to say it: greedy stays ahead. After k choices, the k-th interval greedy picked ends no later than the k-th interval of any valid schedule. If an optimal schedule had more intervals, its (k + 1)-th would start after its k-th ends, hence after greedy's k-th ends, so greedy could still have taken it. Greedy therefore never falls behind.",
    "The tempting alternatives fail on small examples. Sorting by start picks one long interval that blocks many short ones. Sorting by length picks a short interval that overlaps two disjoint ones. Sorting by the number of conflicts also has counter-examples. Only the end time has the exchange property.",
    "Variants are the same loop with a different comparison. Minimum removals to make intervals disjoint is n minus the maximum kept. Minimum arrows to burst balloons counts the kept intervals, but touching balloons share an arrow, so the test becomes `start > end`. Maximum pair chain needs strictly increasing pairs. Remove covered intervals sorts by start ascending and end descending instead, then counts intervals whose end exceeds the largest end so far.",
    "Cost: O(n log n) for the sort and O(n) for the pass. Two neighbours are different problems: weighted interval scheduling (each interval has a value) is not greedy and needs DP with binary search, and the minimum number of rooms is the maximum overlap depth, found with a sweep or a heap of end times.",
  ],
  2: [
    "In jump game, the reachable indices always form a prefix [0, reach]: if you can reach j, you can reach every i < j on the way, because a jump may be any length up to a[i]. So one number describes the whole reachable set. Scanning left to right, reach = max(reach, i + a[i]) keeps it exact, and the first index with i > reach proves that everything from i on is unreachable.",
    "Minimum jumps is BFS on this structure. The indices reachable with exactly k jumps form one contiguous window, and the next window ends at the farthest point reachable from the current one. Counting windows until the end is covered gives the BFS distance, in O(n) instead of the O(n²) DP. The loop stops at n - 2 because standing on the last index needs no more jumps.",
    "Gas station has a two-part proof. First, if total gas is at least total cost, some start works; otherwise none does. Second, if starting at s the tank first goes negative after station i, then no station between s and i can be a start: each of them would arrive at i with no more fuel than the run from s had (the run from s reached each of them with a non-negative tank). So the next candidate is i + 1, and one pass finds the answer.",
    "Covering problems reduce to jump game. Video stitching and 'minimum taps to water a garden' first compute, for each start position, the farthest end any clip or tap covers from there. That array is a jump game, and minimum jumps is the minimum number of clips. Gaps where the farthest reach does not move mean the range cannot be covered.",
    "When jumps have costs, or the allowed moves depend on more than a maximum length, the prefix structure breaks and the problem becomes DP or a shortest path. Greedy here relies on 'farther is never worse', which is true only because any shorter jump is also allowed.",
  ],
  3: [
    "With unlimited transactions, the answer is the sum of all positive day-to-day changes. Upper bound: any single trade from day i to day j earns p[j] - p[i], which telescopes into the sum of the daily changes between them, and that is at most the sum of the positive ones in that range. Trades do not overlap, so the total of any strategy is at most the sum of all positive changes. Achievable: buy before every rise and sell after it.",
    "One transaction (stock I) is different: keep the lowest price seen so far and the best difference `p - low`. This is Kadane's algorithm on the array of daily changes, since the best trade is the maximum-sum run of consecutive changes.",
    "The greedy breaks as soon as trades have a cost or a limit. A transaction fee makes many small trades worse than one long trade. A cooldown forbids buying right after selling. At most k trades limits how many rises you may take. All of these are state-machine DP (pattern 7 of DP), whose states are holding and not holding.",
    "When k is at least n / 2, the limit cannot bind: there are at most n / 2 separate rises, so the problem is the unlimited one again. Checking this first avoids an O(n · k) DP on huge k.",
    "Wiggle subsequence uses a similar idea about local shape: the longest alternating subsequence keeps every turning point (each local peak and valley), so count the direction changes and ignore flat steps. Both rely on breaking a sequence into its rises and falls.",
  ],
  4: [
    "A cut after position i is valid exactly when no character appears both at or before i and after i. This is a property of i alone, not of other cuts. The greedy loop tracks end = the largest last occurrence among characters seen since the last cut, and cuts when i == end, which is exactly when i is a valid cut. It takes every valid cut, so no partition can have more parts.",
    "The last-occurrence table is the precomputation that makes the decision local. It must be built in a full first pass, since the greedy cannot know where a character appears later while scanning. With it, each step is O(1) and the whole algorithm is O(n) time and O(alphabet) space.",
    "Removing duplicate letters for the smallest result in lexicographic order adds a monotonic stack. For each character not already in the stack, pop larger characters off the top as long as each popped character appears again later; then push. Putting a smaller character earlier always helps the lexicographic order, and the last-occurrence check makes sure every letter still appears once.",
    "Maximum swap uses last occurrences of digits: scanning from the left, find the first position where a larger digit appears later, and swap it with the last occurrence of the largest such digit. Taking the last occurrence moves the smaller digit as far right as possible, which keeps the result largest.",
    "Candy is a different two-pass greedy: a left-to-right pass enforces 'more than the left neighbour if rated higher', a right-to-left pass enforces the same for the right neighbour, and taking the maximum of the two at each child satisfies both with the fewest candies. Each pass is the minimum that one constraint needs, so their maximum is the minimum for both.",
  ],
  5: [
    "Heap-driven greedy fits problems where the best next move changes after each move. The heap keeps candidates ordered by the current priority and lets you take the best one in O(log n), push back an updated value, and repeat. Most of these problems have a short exchange proof for why the top of the heap is a safe choice.",
    "Connecting sticks (the Huffman argument). Each stick's length is paid once for every merge it takes part in, so the total cost is the sum of length times depth in the merge tree. The two smallest sticks should be the deepest; swapping a smaller stick into a deeper position never increases the cost. So merging the two smallest first is safe, and repeating it on the new set of sticks is optimal.",
    "Course schedule III processes courses by deadline and keeps a max-heap of the durations taken. When the total time passes the current deadline, drop the longest course taken so far. The count of taken courses stays the same, and the time used becomes as small as possible, which can only help later courses. This 'take greedily, undo the worst choice' move appears in several heap problems (furthest building with bricks and ladders).",
    "Task scheduler and reorganize string are about the most frequent item. Reorganizing is possible exactly when the top count is at most (n + 1) / 2; placing the most frequent remaining character that differs from the previous one never paints you into a corner. The task scheduler answer is max(n, (top - 1) · (gap + 1) + number of tasks tied for top), because the most frequent task defines the frame that others fill.",
    "IPO and 'maximum number of events' combine two orders. Sort by availability (capital needed, start day), push items into a heap as they become available, and pop the best by the other key (profit, earliest end). Cost: O(n log n). Forgetting to push everything that just became available before popping is the usual bug.",
  ],
  6: [
    "Water above index i is min(max left of i, max right of i) - h[i]. Two pointers compute it without the two prefix and suffix arrays. When h[L] < h[R], some wall on the right (h[R] itself) is taller than every wall the left pointer has passed (otherwise L would not have moved while R stayed). So the right maximum for position L is at least the left maximum, the minimum is the left maximum, and L's water is known now.",
    "Container with most water uses an elimination argument. The area of the pair (L, R) is (R - L) · min(h[L], h[R]). If h[L] is the shorter line, every pair (L, R') with R' < R is no better: it is narrower and its height is still capped by h[L]. So L can never be in a better pair, and moving it discards only pairs that cannot win. Each step removes one line, so the scan is O(n).",
    "Boats to save people pairs the heaviest remaining person with the lightest. If the heaviest cannot share a boat with the lightest, they cannot share with anyone and go alone. If they can, pairing them is safe by exchange: in an optimal solution, swapping the lightest into the heaviest person's boat keeps every boat within the limit.",
    "Three standard solutions to trapping rain water show the trade-offs: prefix and suffix maximum arrays (O(n) time and space, the clearest), a monotonic stack that fills water layer by layer between walls (O(n), useful for the histogram family), and two pointers (O(n) time, O(1) space). All give the same total.",
    "The longest mountain also lives here: walk once, counting the length of the current rise and then the following fall, and reset at flat steps. Each element is looked at a constant number of times, which is the common thread of this pattern: decide something final about one end in O(1), then move.",
  ],
  7: [
    "Two city scheduling has an exact algebraic argument. Send everyone to city B first; the total is the sum of all b. Moving a person to A changes the total by a - b. Exactly n people must move, so choose the n smallest values of a - b. Sorting by a - b and sending the first half to A is therefore optimal, not just a good heuristic.",
    "Fractional knapsack (you may take part of an item) is greedy by value per weight: an exchange shows that any unit of capacity spent on a lower ratio item can be moved to a higher ratio item without loss. The 0/1 knapsack breaks this, because items cannot be split: with capacity 4, an item of weight 3 and value 5 has the best ratio, but taking it leaves room for nothing else (total 5), while two items of weight 2 and value 3 give 6.",
    "Assign cookies sorts both lists and gives each child the smallest cookie that satisfies them. The exchange: if an optimal assignment gives the least greedy child a bigger cookie, swapping it with the smallest sufficient cookie keeps everyone satisfied. Maximum units on a truck sorts box types by units per box and takes the best until the truck is full.",
    "Lemonade change is greedy about keeping flexibility: when giving 15 in change, prefer a 10 and a 5 over three 5s, because a 5 can be used in more future cases than a 10. The general lesson: when choices differ in how useful the leftovers are, keep the more flexible leftovers.",
    "The key step in all of these is finding the right sort key, and the common bug is sorting by a raw value (the cost to A, the size) instead of the relative one (the saving, the ratio). When no simple key works, the problem may need a custom comparator (the exchange argument pattern) or DP.",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

function largestNumberViz(input = [3, 30, 34, 5, 9]): Diagram {
  const a = input.map(String), frames: CellsFrame[] = [];
  const before = (x: string, y: string) => x + y > y + x;            // x should come first
  frames.push({ note: `Sort with the rule: x goes before y when x + y > y + x as strings. Start: [${a.join(", ")}]`, rows: [[...a]] });
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0) {
      const x = a[j - 1], y = a[j];
      if (before(y, x)) { a[j - 1] = y; a[j] = x; frames.push({ note: `"${y}${x}" > "${x}${y}", so ${y} must come before ${x}: swap`, rows: [[...a]], tones: { [`0:${j - 1}`]: "found", [`0:${j}`]: "active" } }); j--; }
      else { frames.push({ note: `"${x}${y}" ≥ "${y}${x}", so ${x} stays before ${y}`, rows: [[...a]], tones: { [`0:${j - 1}`]: "done", [`0:${j}`]: "active" } }); break; }
    }
  }
  const out = a.join("").replace(/^0+(?=.)/, "");
  frames.push({ note: `Concatenate: ${out}. Any adjacent pair in the wrong order could be swapped to make the number bigger, so this order is optimal`, rows: [[...a]], tones: range(0, a.length - 1, 0, "found") });
  return { kind: "cells", title: "Exchange argument: largest number by pairwise order", rows: [[...input.map(String)]], frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 8, name: "Exchange argument (custom comparator)", summary: "Decide the order of two neighbouring items by comparing both orders directly. If swapping a wrongly ordered pair never makes the answer worse, sorting with that comparison is optimal.",
    signals: ["arrange numbers to form the largest number", "order jobs to minimise total weighted waiting time", "queue reconstruction by height", "any 'best order' question where the cost of a pair depends only on the two items"],
    idea: ["Take two adjacent items x and y. Write the cost (or value) of the order x, y and of y, x, with everything else fixed. The comparison of those two expressions is the comparator.", "Largest number: x before y when the string x + y > y + x.", "Weighted completion time (Smith's rule): job x before y when t_x · w_y < t_y · w_x, the same as t / w ascending, but compared without division."],
    steps: ["Find a pairwise rule from 'x then y' versus 'y then x'", "Check it is consistent (transitive), so sorting is well defined", "Sort with the comparator (cmp_to_key in Python)", "Build the answer in the sorted order"],
    code: `from functools import cmp_to_key
def largest_number(nums):
    s = [str(x) for x in nums]
    s.sort(key=cmp_to_key(lambda a, b: (b + a > a + b) - (b + a < a + b)))
    out = "".join(s)
    return "0" if out[0] == "0" else out

def min_weighted_completion(jobs):        # jobs = [(time, weight)]
    jobs = sorted(jobs, key=cmp_to_key(lambda x, y: x[0] * y[1] - y[0] * x[1]))
    t = total = 0
    for time, w in jobs:
        t += time                           # this job finishes at t
        total += t * w
    return total`,
    complexity: { best: "O(n log n · c)", average: "O(n log n · c)", worst: "O(n log n · c)", space: "O(n)", note: "c = cost of one comparison: O(length of the strings) for largest number, O(1) for job scheduling." },
    traps: ["The comparator must be a strict weak order. 'a + b > b + a' is; 'compare first digits only' is not, and sorting with an inconsistent comparator gives garbage (or undefined behaviour in C++).", "Largest number: an input of all zeros must return \"0\", not \"000\".", "Compare ratios by cross-multiplying (t1 · w2 vs t2 · w1) in 64-bit integers instead of dividing floats."],
    viz: { make: (i) => largestNumberViz(nums(i, [3, 30, 34, 5, 9], 7).map((x) => Math.max(0, Math.min(9999, Math.round(x))))), input: "3, 30, 34, 5, 9", label: "non-negative numbers" },
    theory: [
      "The exchange argument proves that an ordering is optimal by showing that any other order can be improved, or at least not worsened, step by step until it becomes the greedy order. The standard version uses adjacent swaps. If an order has two neighbours x, y that the rule says should be y, x, swap them. When the cost of the two orders depends only on x and y (everything before and after is unchanged), the swap does not make things worse, and repeated swaps reach the sorted order, like bubble sort.",
      "Largest number, step by step. Placing x then y contributes the string x + y in that spot, and placing y then x contributes y + x, while the rest of the number is the same. Both strings have the same length, so the bigger one gives the bigger number. Hence any adjacent pair with y + x > x + y should be swapped. One also has to check the rule is transitive (if xy ≥ yx and yz ≥ zy then xz ≥ zx); it is, because xy ≥ yx is equivalent to comparing the infinite repetitions of x and y, which is a true total order.",
      "Smith's rule for weighted completion time. If job x (time t_x, weight w_x) is right before job y, swapping them changes only their two finishing times. Order x, y costs w_x · t_x + w_y · (t_x + t_y) plus a shared part; order y, x costs w_y · t_y + w_x · (t_x + t_y) plus the same part. The difference is t_x · w_y - t_y · w_x, so x should go first exactly when t_x / w_x < t_y / w_y. Sorting by that ratio is optimal.",
      "Queue reconstruction by height is an exchange-flavoured greedy with insertion: sort by height descending and k ascending, then insert each person at index k. Taller people placed first are unaffected by shorter people inserted later, so each insertion position is final. Two city scheduling and interval scheduling are also exchange arguments with a key instead of a comparator.",
      "Recognise the pattern when the answer is a permutation and the effect of two neighbours can be compared in isolation. Write the cost of 'x then y' and 'y then x' with symbols, subtract, and the sign of the difference is the comparator. If the difference depends on items other than x and y, adjacent swaps are not local and the argument fails; that is usually a sign the problem is DP (for example, scheduling with deadlines and profits that interact).",
      "In code, Python's `sorted` takes a key, so a pairwise rule needs `functools.cmp_to_key`. In C++, `sort` takes the comparator directly, and it must be a strict weak ordering: return true only when a must come strictly before b, never for equal items, or the sort may crash or loop.",
    ],
  },
];

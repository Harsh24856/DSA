// Deeper theory for the "stack" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, StackFrame } from "../../diagram";
import type { Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "The invariant: the stack holds, from bottom to top, the indices that have not found their next greater element yet, and their values are non-increasing. When x arrives, every index on top with a smaller value has its answer: x is the first larger value to its right, because everything between them was smaller (otherwise it would have popped that index already).",
    "That argument also shows why the stack stays sorted. An index is only pushed after every smaller value above it has been popped, so the new top is never larger than the one below it.",
    "Complexity is amortised. The inner while loop can pop many items at once, but each index is pushed exactly once and popped at most once over the whole run. So the total work is O(n), not O(n²). The same accounting applies to every monotonic stack and deque.",
    "Four variants come from two choices. Direction: scan left to right for the next element, right to left (or read the new top after popping) for the previous one. Comparison: a decreasing stack finds greater elements, an increasing one finds smaller elements. Strict versus non-strict (< or <=) decides what happens with equal values, which matters for counting problems so each subarray is counted once.",
    "Recognise it by 'next greater', 'previous smaller', 'how many days until warmer', 'span of days with price at most today', 'remove digits to make the smallest number' and collision problems like asteroids. For a circular array, run i over 0..2n-1 and use i % n, pushing only in the first pass. Next Greater Element I adds a hash map from value to answer.",
    "Edge cases: all increasing (every element pops the one before it), all decreasing (nothing pops, every answer is -1), duplicates, and storing values when you need indices (distances such as days to wait need indices). The usual wrong approach is a nested loop scanning right for each element, O(n²).",
  ],
  2: [
    "Brackets are matched in last-opened, first-closed order: in '([])' the '[' must close before the '('. That is exactly LIFO order, so a stack of open brackets models the nesting. A closer is valid only if it matches the most recent unclosed opener, which is the top of the stack.",
    "The full proof: a string is balanced exactly when it can be reduced to empty by repeatedly deleting an adjacent matched pair like '()'. Pushing openers and popping on a matching closer performs those deletions from the inside out. If a closer meets an empty stack or a different opener, no sequence of deletions can fix it.",
    "With one bracket type the stack collapses to a counter: the depth goes up on '(' and down on ')', and must never go below zero. Minimum Add to Make Parentheses Valid counts the closers that hit depth zero plus the openers left at the end. Minimum Remove to Make Valid marks those positions and rebuilds the string without them.",
    "Longest Valid Parentheses pushes indices instead of characters. Keep a 'base' index below the stack (start with -1): it is the last position that cannot be part of a valid run. After a matching pop, the current valid run has length i - stack[-1]. On an unmatched ')', it becomes the new base.",
    "Complexity: O(n) time, O(n) space for the stack, or O(1) with the counter for a single bracket type. A two-pass counter (left to right, then right to left) also solves Longest Valid Parentheses in O(1) space.",
    "Edge cases: an empty string (valid), a lone closer, unclosed openers at the end, and odd lengths, which can be rejected at once. The common bug is popping without checking for an empty stack first.",
  ],
  3: [
    "Postfix (RPN) needs no precedence rules: every operator applies to the two most recent values, so a value stack is the whole algorithm. Infix expressions are harder only because the operator you just read may have to wait for a higher-precedence operator that comes later.",
    "Basic Calculator II (+ - * / without parentheses) uses one value stack and remembers the previous operator. On + or - push the number (or its negative), deferring the addition. On * or / combine with the top immediately, because those bind tighter. At the end, the answer is the sum of the stack. This is correct because the stack holds exactly the terms of a sum, each fully evaluated.",
    "Parentheses add recursion. Basic Calculator (with + - and parentheses) keeps a running result and sign; at '(' it pushes them and starts fresh, and at ')' it pops and combines: result = saved_result + saved_sign x result. The general tool for all of this is the shunting-yard algorithm, which uses one stack for operators and one for values and pops operators while the top has higher or equal precedence.",
    "The same push-at-open, combine-at-close shape appears outside arithmetic. Decode String pushes (current string, repeat count) at '[' and at ']' pops and builds previous + count x current. Simplify Path pushes directory names, pops on '..' and ignores '.' and empty parts.",
    "Complexity: O(n) time and O(n) space, since each token is pushed and popped at most once. Parsing multi-digit numbers inside the same loop keeps it linear.",
    "Edge cases: operand order for - and / (the second pop is the left operand), division that truncates toward zero (int(a / b) in Python, plain / in C++ and Java), unary minus, spaces between tokens, and very large intermediate values. Most bugs come from acting on an operator before its number has been fully read.",
  ],
  4: [
    "For each bar h[i], the widest rectangle of height h[i] stretches left and right until the first bar that is shorter. So the whole problem reduces to 'previous smaller' and 'next smaller' for every bar, which an increasing monotonic stack gives in one pass.",
    "When bar j is popped because h[i] < h[j], two facts hold. i is the first bar to the right of j that is shorter, because anything shorter in between would have popped j earlier. The new top of the stack is the first shorter bar to the left of j, because the stack is increasing. So the rectangle for j spans (top, i) exclusive, width i - top - 1, or i if the stack is empty.",
    "The trailing 0-height sentinel forces every remaining bar off the stack at the end, so no special case is needed for bars that never meet a shorter one. A leading sentinel of index -1 does the same for the left side.",
    "Recognise it by 'largest rectangle', 'maximal rectangle of 1s' (build a histogram per row: height[c] = height[c] + 1 if the cell is 1, else 0, and run the histogram routine on each row, O(R x C)), and 'sum of subarray minimums', where each a[i] is the minimum of (i - left) x (right - i) subarrays.",
    "For counting problems with equal values, use < on one side and <= on the other, so a subarray whose minimum appears twice is credited to exactly one of them. Trapping Rain Water has a stack solution too: when a taller bar arrives, the popped bar is the floor of a basin bounded by the new top and the newcomer.",
    "Complexity: O(n) time and space for the histogram; O(R x C) for the matrix version. The brute force tries every pair of ends, O(n²) or worse, and the divide and conquer approach (split at the minimum) is O(n log n) on average but O(n²) on sorted input.",
  ],
  5: [
    "An augmented stack stores, with each element, a summary of everything at or below it. Because a stack only changes at the top, the summary for the element below never changes while it is buried, and popping exposes a summary that is still correct. That is why (value, min so far) gives getMin in O(1) with no recomputation.",
    "The general rule: any summary that can be computed from 'the new value' and 'the summary below' can be stored this way. Minimum, maximum, sum, count, and gcd all qualify. Something like 'the median of the stack' does not, because it depends on all values, not just the top two summaries.",
    "Queue from two stacks: push onto 'in', pop from 'out', and pour 'in' into 'out' only when 'out' is empty. Pouring reverses the order, so the oldest element ends up on top of 'out'. Each element is moved at most once from 'in' to 'out', so a sequence of n operations costs O(n) total, amortised O(1) each, even though a single pour can be O(n).",
    "Maximum Frequency Stack combines a count per value with a stack per frequency level. Pushing x increases its count to f and pushes x onto stack f; popping takes from the highest non-empty level. The most recent of the most frequent is on top, as the problem asks.",
    "Space is O(n) for the extra fields. A min stack can save memory by pushing to a second 'mins' stack only when the new value is <= the current minimum, and popping from it when the removed value equals the minimum; the <= matters for duplicates.",
    "Edge cases: getMin or top on an empty stack, duplicate minimums, and values near the integer limits. The common wrong approach is a single variable for the minimum, which cannot be restored after the minimum is popped.",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

function removeKViz(num: string, k: number): Diagram {
  const frames: StackFrame[] = [], st: string[] = [];
  let left = k;
  frames.push({ note: `Delete ${k} digit${k === 1 ? "" : "s"} from ${num} to make the smallest number. Keep the stack non-decreasing while deletions remain.`, items: [], side: `deletions left: ${left}` });
  for (const d of num) {
    const popped: string[] = [];
    while (left && st.length && st[st.length - 1] > d) { popped.push(st.pop()!); left--; }
    st.push(d);
    frames.push({ note: popped.length ? `${d} is smaller than ${popped.join(", ")} before it: deleting a bigger digit earlier in the number helps most, so pop ${popped.length === 1 ? "it" : "them"}, then push ${d}.` : `Push ${d}.${left ? "" : " No deletions left, so digits are kept as they come."}`, items: [...st], incoming: d, popped, side: `deletions left: ${left}` });
  }
  if (left) { const cut = st.splice(st.length - left, left); frames.push({ note: `Still ${left} deletion${left === 1 ? "" : "s"} to make: the stack is non-decreasing, so the largest digits are at the end. Cut ${cut.join(", ")}.`, items: [...st], popped: cut, side: "deletions left: 0" }); }
  const out = st.join("").replace(/^0+/, "") || "0";
  frames.push({ note: `Strip leading zeros: the answer is ${out}.`, items: [...st], side: `answer: ${out}` });
  return { kind: "stack", title: `Greedy stack: remove ${k} digit${k === 1 ? "" : "s"} from ${num}`, input: num.split(""), frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 6, name: "Greedy removal with a stack", summary: "Build the answer on a stack and let each new item pop earlier items it should replace: smaller digits pop larger ones, a big asteroid destroys smaller ones, a larger node removes smaller nodes before it.",
    signals: ["remove k digits to make the smallest number", "remove nodes that have a greater value to their right", "asteroid collision", "backspaces or deletions that cancel the most recent item"],
    idea: ["In a number, an earlier digit outweighs every later digit. So when a smaller digit arrives and a larger digit sits just before it, deleting that larger digit makes the number smaller than any deletion further right could.", "The stack holds the kept digits. Each new digit pops larger digits while deletions remain, then is pushed. Leftover deletions come off the end, where the stack (non-decreasing) keeps its largest digits."],
    steps: ["for d in num: while k and stack and stack[-1] > d: pop, k -= 1", "push d", "if k remains: drop the last k items", "strip leading zeros; empty means '0'"],
    code: `def remove_k_digits(num, k):
    st = []                           # non-decreasing while deletions remain
    for d in num:
        while k and st and st[-1] > d:
            st.pop()                  # a smaller digit arrived: the bigger one before it goes
            k -= 1
        st.append(d)
    if k:
        st = st[:-k]                  # still owe deletions: the tail holds the largest digits
    return "".join(st).lstrip("0") or "0"`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Each digit is pushed once and popped at most once." },
    traps: ["st[:-k] with k = 0 would delete everything in Python; guard it with if k.", "Strip leading zeros at the end, and return '0' for an empty result.", "Asteroid Collision pops only while the incoming asteroid moves left and the top moves right."],
    viz: { make: (i) => { const [a, b] = (i ?? "1432219 3").trim().split(/\s+/); const num = (a ?? "").replace(/\D/g, "").slice(0, 10) || "1432219"; const k = Math.max(1, Math.min(num.length, Math.round(Number(b)) || 3)); return removeKViz(num, k); }, input: "1432219 3", label: "number, then k, separated by a space" },
    theory: [
      "The exchange argument: compare two numbers of the same length that agree up to some position and differ there. The one with the smaller digit at that position is smaller, no matter what follows. So the first deletion should remove the first digit that is larger than the digit after it (the first 'peak'). Deleting anything to the right of it leaves the larger digit in a more significant place.",
      "Repeating that rule k times is what the stack does in one pass. The stack holds a non-decreasing prefix with no peak in it. When a smaller digit arrives, the top of the stack has just become a peak, so it is the best deletion, and the next top may become a peak too. Once there is no peak left, the number is non-decreasing and the best remaining deletions are the last digits.",
      "Complexity: every digit is pushed once and popped at most once, so O(n) time. Recomputing the best deletion from scratch k times costs O(n x k).",
      "The same 'new item cancels earlier items' shape appears in other forms. Remove Nodes From Linked List keeps a decreasing stack and drops every node that has a larger node to its right. Asteroid Collision pops right-moving asteroids that a larger left-moving one destroys, and stops when it meets a bigger one. Backspace String Compare pops on '#'. Remove Duplicate Letters adds a 'still appears later' check before popping.",
      "Recognise it by 'remove some items to make the result smallest, largest or lexicographically first', or by items that cancel the most recent survivor. If the decision for an item depends only on the last kept item and the new one, a stack is the natural structure.",
      "Edge cases: k equal to the length (answer '0'), leading zeros after deletions ('10200' with k = 1 gives '200'), rising input where no pops happen (cut from the end), and equal digits (do not pop on equality, which would waste a deletion).",
    ],
  },
];

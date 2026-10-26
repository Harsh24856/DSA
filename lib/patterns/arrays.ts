import * as S from "../sim";
import { nums, text, type Topic } from "./types";

export const ARRAY: Topic = {
  id: "array", name: "Arrays",
  blurb: "Contiguous memory with O(1) access by index. Almost every array question is a range question, a pairing question or a search question.",
  basics: ["Access a[i]: O(1). Insert/delete in the middle: O(n) because elements shift.", "Sorting first (O(n log n)) often unlocks two pointers, binary search or a sweep.", "Hash maps turn 'have I seen X?' from O(n) into O(1) at the cost of O(n) memory."],
  patterns: [
    {
      n: 1, name: "Prefix sums", summary: "Precompute running totals so any range sum is one subtraction. Add a hash map to count subarrays with a target sum.",
      signals: ["sum or product over a range [i, j]", "subarray sum equals k, or divisible by k", "many range queries on a fixed array", "product of array except self (prefix and suffix)"],
      idea: ["Let P[i] be the sum of the first i elements, with P[0] = 0. Then sum(l..r) = P[r+1] - P[l], because the shared prefix cancels.", "For 'how many subarrays sum to k', walk once and keep a count of every prefix value seen. At each position you need an earlier prefix equal to current - k, which the map answers in O(1). Seed the map with {0: 1} so subarrays starting at index 0 count."],
      steps: ["Build P with P[0] = 0", "Answer range [l, r] as P[r+1] - P[l]", "For counting: running sum s, add seen[s - k] to the answer, then seen[s] += 1"],
      code: `def subarray_sum(nums, k):
    seen = {0: 1}          # empty prefix
    s = ans = 0
    for x in nums:
        s += x
        ans += seen.get(s - k, 0)
        seen[s] = seen.get(s, 0) + 1
    return ans`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Build is one pass; each query after that is O(1). Hash map version is O(n) average (hashing)." },
      traps: ["Forgetting the {0: 1} seed misses subarrays that start at index 0.", "Sliding window does NOT work for 'sum equals k' when numbers can be negative; prefix + map does.", "For modulo problems, normalise negative remainders ((s % k) + k) % k."],
      viz: { make: (i) => S.prefixSum(nums(i, [3, 1, 4, 1, 5, 9], 9)), input: "3, 1, 4, 1, 5, 9", label: "numbers" },
    },
    {
      n: 2, name: "Two pointers", summary: "Two indices that move toward each other (or in the same direction) so every pair is considered without an O(n²) double loop.",
      signals: ["sorted array plus a pair or triplet with a target sum", "container with most water, trapping water", "remove duplicates in place", "compare from both ends"],
      idea: ["On a sorted array, if a[L] + a[R] is too small, the only way to grow it is to move L right; if too big, move R left. Each move discards a whole row of impossible pairs, so one pass covers everything.", "For 3Sum, fix one element and run the pair search on the rest; skip equal neighbours to avoid duplicate triplets."],
      steps: ["Sort if needed", "L = 0, R = n - 1", "Compare, then move the pointer that can improve the answer", "Stop when L meets R"],
      code: `def two_sum_sorted(a, target):
    L, R = 0, len(a) - 1
    while L < R:
        s = a[L] + a[R]
        if s == target: return [L, R]
        if s < target: L += 1
        else: R -= 1
    return []`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Plus O(n log n) if you have to sort first. Best case: the first pair already matches." },
      traps: ["Two pointers needs sorted (or monotonic) data; on unsorted input use a hash map instead.", "In 3Sum, skip duplicates for the fixed element AND after finding a triplet.", "Moving the wrong pointer silently skips valid answers: reason about which side can still improve."],
      viz: { make: (i) => { const v = nums(i, [1, 2, 4, 6, 8, 11, 15, 14]); const t = v.length > 1 ? v[v.length - 1] : 14; return S.twoPointerSum(v.slice(0, -1).sort((a, b) => a - b), t); }, input: "1, 2, 4, 6, 8, 11, 15, 14", label: "sorted numbers, last value = target" },
    },
    {
      n: 3, name: "Sliding window", summary: "Keep a contiguous window and update its state as one element enters and one leaves, instead of recomputing from scratch.",
      signals: ["longest or shortest subarray/substring with a property", "window of size k", "at most k distinct", "maximum of every window (monotonic deque)"],
      idea: ["Fixed size: add the new right element, drop the old left one, O(1) per step.", "Variable size: grow R every step; while the window breaks the rule, shrink from L. Every index enters and leaves at most once, so the total work is O(n) even with the inner while loop.", "Window maximum: keep a deque of indices with decreasing values. The front is the max; pop from the back anything smaller than the newcomer, pop from the front anything that slid out."],
      steps: ["for R in range(n): add a[R] to the window state", "while window invalid: remove a[L], L += 1", "update the answer with the valid window [L, R]"],
      code: `def longest_unique(s):
    last, L, best = {}, 0, 0
    for R, ch in enumerate(s):
        if ch in last and last[ch] >= L:
            L = last[ch] + 1      # jump past the repeat
        last[ch] = R
        best = max(best, R - L + 1)
    return best`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(k)", note: "k = size of the window state (distinct characters, deque length). Each element is added and removed at most once." },
      traps: ["Variable windows need a monotonic rule (adding elements only makes it 'more invalid'). With negative numbers in a sum, use prefix sums instead.", "Update the answer after shrinking, not before.", "In the deque, store indices, not values, so you can tell when the front left the window."],
      viz: { make: (i) => S.variableWindow(text(i, "abcabcbb", 14)), input: "abcabcbb", label: "string" },
    },
    {
      n: 4, name: "Kadane (max subarray)", summary: "At each index decide: extend the best subarray ending here, or start fresh. One pass gives the maximum subarray sum.",
      signals: ["maximum subarray sum", "best time to buy and sell once", "maximum product subarray (track min too)", "circular max subarray"],
      idea: ["Let run = best sum of a subarray that ends exactly at i. Then run = max(a[i], run + a[i]): a negative carry can only hurt, so drop it.", "The overall answer is the max of run over all i. For products, keep both the max and min ending here, because a negative times the min can become the new max."],
      steps: ["run = best = a[0]", "for each x: run = max(x, run + x); best = max(best, run)", "return best"],
      code: `def max_subarray(a):
    run = best = a[0]
    for x in a[1:]:
        run = max(x, run + x)
        best = max(best, run)
    return best`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Single pass, two variables." },
      traps: ["Initialise with a[0], not 0, or an all-negative array returns 0 instead of its largest element.", "Max product: swap max and min when x is negative.", "Circular version: answer = max(normal Kadane, total - min subarray), unless every number is negative."],
      viz: { make: (i) => S.kadane(nums(i, [-2, 1, -3, 4, -1, 2, 1, -5, 4])), input: "-2, 1, -3, 4, -1, 2, 1, -5, 4", label: "numbers" },
    },
    {
      n: 5, name: "In-place rearrangement", summary: "Reorder elements with a few pointers and swaps so no extra array is needed: move zeroes, sort colours, rotate, cyclic placement.",
      signals: ["do it in place / O(1) extra space", "sort an array of 0, 1, 2", "move zeroes to the end", "first missing positive, find the duplicate (values in 1..n)"],
      idea: ["Partition with pointers: everything left of lo is 'done type A', right of hi is 'done type B', and mid scans the unknown middle. Each swap fixes at least one element.", "When values are in 1..n, each value has a home index v - 1. Swapping values into their homes (cyclic sort) lets the array itself act as a hash set.", "Rotate by k: reverse the whole array, then reverse the first k and the rest."],
      steps: ["Pick the invariant (what lives left of each pointer)", "Scan with one pointer, swap into place", "Never advance past an element you have not inspected"],
      code: `def sort_colors(a):
    lo = mid = 0
    hi = len(a) - 1
    while mid <= hi:
        if a[mid] == 0:
            a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1
        elif a[mid] == 1:
            mid += 1
        else:
            a[mid], a[hi] = a[hi], a[mid]; hi -= 1`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Cyclic sort is O(n) too: every swap puts one value in its final place." },
      traps: ["After swapping with hi in Dutch flag, do not advance mid: the incoming value is unchecked.", "Cyclic sort: swap only when the target slot does not already hold the same value, or you loop forever on duplicates.", "Rotate: reduce k with k %= n first."],
      viz: { make: (i) => S.dutchFlag(nums(i, [2, 0, 2, 1, 1, 0]).map((x) => Math.max(0, Math.min(2, Math.round(x))))), input: "2, 0, 2, 1, 1, 0", label: "values 0, 1 or 2" },
    },
    {
      n: 6, name: "Intervals on arrays", summary: "Sort intervals by start, then sweep once: overlap means the next start is before the current end.",
      signals: ["merge overlapping intervals", "insert an interval", "meeting rooms", "minimum arrows / removals"],
      idea: ["After sorting by start, overlapping intervals are adjacent, so a single pass can merge them: keep extending the last interval's end while the next start is within it.", "Two intervals [a, b] and [c, d] overlap exactly when a <= d and c <= b."],
      steps: ["Sort by start", "Take the first as current", "For each next: overlap → extend end; else → output current and start a new one"],
      code: `def merge(iv):
    iv.sort()
    out = [iv[0]]
    for s, e in iv[1:]:
        if s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "Sorting dominates; the sweep itself is O(n). Already sorted input skips straight to O(n)." },
      traps: ["Use max(end, e), not e: a later interval can be fully inside the current one.", "Decide whether touching endpoints ([1,2] and [2,3]) count as overlapping; problems differ.", "Selecting the most non-overlapping intervals sorts by END, not start (see Greedy)."],
      viz: { make: () => S.mergeIntervals() },
    },
    {
      n: 7, name: "Binary search", summary: "Halve the search space every step. Works on sorted arrays and on any yes/no question that flips once over a range of answers.",
      signals: ["sorted or rotated sorted array", "first / last position of x", "minimum speed, capacity or days such that it works", "O(log n) required"],
      idea: ["Keep an interval [lo, hi] that must contain the answer. Look at mid and throw away the half that cannot contain it.", "Search on the answer: if 'speed v works' implies 'any faster speed works', the yes/no row is monotonic. Binary search for the first yes, checking each candidate with a greedy simulation."],
      steps: ["Define the predicate and the range [lo, hi]", "while lo < hi: mid = (lo + hi) // 2", "if ok(mid): hi = mid else lo = mid + 1", "lo is the first value where ok is true"],
      code: `def first_true(lo, hi, ok):
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid): hi = mid
        else: lo = mid + 1
    return lo

# Koko: first_true(1, max(piles),
#   lambda v: sum((p + v - 1) // v for p in piles) <= h)`,
      complexity: { best: "O(1)", average: "O(log n)", worst: "O(log n)", space: "O(1)", note: "On the answer: O(log R · cost of ok), where R is the size of the answer range." },
      traps: ["Mixing up lo <= hi / hi = mid - 1 styles with lo < hi / hi = mid causes infinite loops. Pick one template.", "Rotated arrays: first find which half is sorted, then check whether the target lies in it.", "Overflow in some languages: mid = lo + (hi - lo) // 2."],
      viz: { make: (i) => { const v = nums(i, [1, 3, 5, 7, 9, 11, 13, 15, 17, 15]); return S.binarySearch(v.slice(0, -1).sort((a, b) => a - b), v[v.length - 1]); }, input: "1, 3, 5, 7, 9, 11, 13, 15, 17, 15", label: "sorted numbers, last value = target" },
    },
    {
      n: 8, name: "Sorting toolkit", summary: "Know when the default sort is not enough: custom comparators, counting or bucket sort, merge sort for inversions, quickselect for the kth element.",
      signals: ["sort by a custom key or rule (largest number, log files)", "top k / kth largest in O(n) average", "values in a small range (counting sort)", "count inversions, sort a linked list"],
      idea: ["A comparator only has to say which of two items goes first; the sort handles the rest in O(n log n).", "Quickselect partitions like quicksort but recurses into only the side holding index n - k, so the average cost is n + n/2 + n/4 + ... = O(n).", "Counting/bucket sort is O(n + range) when values are bounded, beating comparison sorting's O(n log n) floor."],
      steps: ["Choose the tool by constraint: custom order, kth element, bounded values, or stable merge", "For quickselect: partition around a pivot, recurse into one side only"],
      code: `import random
def kth_largest(a, k):
    want = len(a) - k
    lo, hi = 0, len(a) - 1
    while True:
        p = random.randint(lo, hi); a[p], a[hi] = a[hi], a[p]
        i = lo
        for j in range(lo, hi):
            if a[j] < a[hi]: a[i], a[j] = a[j], a[i]; i += 1
        a[i], a[hi] = a[hi], a[i]
        if i == want: return a[i]
        if i < want: lo = i + 1
        else: hi = i - 1`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n²)", space: "O(1)", note: "That is quickselect; a random pivot makes the worst case very unlikely. Comparison sorts: O(n log n). Counting sort: O(n + range)." },
      traps: ["Largest Number: compare by a + b vs b + a as strings, not numerically.", "Quickselect with a fixed pivot hits O(n²) on sorted input; randomise.", "Python sort is stable; use that for multi-key sorts (sort by secondary key first)."],
      viz: { make: (i) => { const v = nums(i, [7, 2, 9, 4, 1, 8, 3, 3]); return S.quickselect(v.slice(0, -1), Math.max(1, Math.min(v.length - 1, v[v.length - 1]))); }, input: "7, 2, 9, 4, 1, 8, 3, 3", label: "numbers, last value = k" },
    },
    {
      n: 9, name: "Difference array", summary: "Record a range update as +v at the start and -v just after the end, then one prefix-sum pass materialises the final array.",
      signals: ["add v to every index in [l, r], many times", "car pooling, flight bookings", "is any point over capacity?", "coverage counts"],
      idea: ["A difference array stores how much each value changes from its left neighbour. Adding v to a whole range only changes two differences: +v at l and -v at r + 1.", "After all updates, running a prefix sum over the differences rebuilds every value. It is the inverse of prefix sums."],
      steps: ["diff = [0] * (n + 1)", "for each update (l, r, v): diff[l] += v; diff[r + 1] -= v", "prefix-sum diff to get the final values"],
      code: `def apply_updates(n, updates):
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        diff[r + 1] -= v
    out, run = [], 0
    for i in range(n):
        run += diff[i]
        out.append(run)
    return out`,
      complexity: { best: "O(n + q)", average: "O(n + q)", worst: "O(n + q)", space: "O(n)", note: "q updates at O(1) each, one O(n) pass at the end, instead of O(n · q)." },
      traps: ["Allocate n + 1 slots so diff[r + 1] never goes out of bounds.", "Only works when you read the array after all updates; mixed updates and queries need a Fenwick or segment tree.", "Check whether ranges are inclusive or half-open (car pooling drops passengers AT the end stop)."],
      viz: { make: () => S.diffArray() },
    },
  ],
};

export const STRING: Topic = {
  id: "string", name: "Strings",
  blurb: "Strings are arrays of characters with extra rules: immutability in many languages, a small alphabet you can count, and matching problems.",
  basics: ["Concatenating in a loop is O(n²) in languages with immutable strings; build a list and join.", "A 26-length count array is a constant-size, hashable signature of a word's letters.", "Compare substrings by hashing or KMP instead of slicing repeatedly."],
  patterns: [
    {
      n: 1, name: "Two pointers on a string", summary: "Walk inward from both ends (palindromes, reversal) or move a read and a write pointer (compression, cleanup).",
      signals: ["valid palindrome, possibly after one deletion", "reverse words or vowels", "compare with backspaces", "string compression in place"],
      idea: ["From both ends: skip characters that do not matter, compare the rest, move both inward.", "Read/write pointers: the reader scans every character, the writer only advances when it keeps one, so the cleaned string is built in place."],
      steps: ["L = 0, R = n - 1", "skip ignorable characters on each side", "compare; mismatch → answer (or try skipping one side)", "move inward"],
      code: `def is_pal(s):
    L, R = 0, len(s) - 1
    while L < R:
        while L < R and not s[L].isalnum(): L += 1
        while L < R and not s[R].isalnum(): R -= 1
        if s[L].lower() != s[R].lower(): return False
        L += 1; R -= 1
    return True`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Best case: the first pair already mismatches." },
      traps: ["Valid Palindrome II: on the first mismatch try BOTH skip-left and skip-right, but only once.", "Backspace compare is easiest from the right end with a skip counter.", "Remember the inner skip loops also need the L < R guard."],
      viz: { make: (i) => S.validPalindrome(text(i, "No lemon, no melon", 20)), input: "No lemon, no melon", label: "string" },
    },
    {
      n: 2, name: "Sliding window on a string", summary: "Longest or shortest substring with a property: grow on the right, shrink from the left while invalid, track counts in a map or a 26-array.",
      signals: ["longest substring without repeats", "minimum window containing all of t", "at most k distinct characters", "longest repeating replacement"],
      idea: ["Keep counts for the window. Adding s[R] and removing s[L] each update the counts in O(1).", "For 'minimum window', track how many required characters are currently satisfied; shrink while all are satisfied and record the smallest window."],
      steps: ["for R: add s[R] to counts", "while invalid (or while valid, for minimum problems): remove s[L], L += 1", "record the answer"],
      code: `from collections import Counter
def min_window(s, t):
    need, have = Counter(t), 0
    win, L, best = Counter(), 0, (float("inf"), 0, 0)
    for R, ch in enumerate(s):
        win[ch] += 1
        if win[ch] == need[ch]: have += 1
        while have == len(need):
            if R - L + 1 < best[0]: best = (R - L + 1, L, R)
            win[s[L]] -= 1
            if s[L] in need and win[s[L]] < need[s[L]]: have -= 1
            L += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2] + 1]`,
      complexity: { best: "O(n)", average: "O(n + m)", worst: "O(n + m)", space: "O(alphabet)", note: "n = len(s), m = len(t). Each index enters and leaves the window once." },
      traps: ["Longest Repeating Replacement: the window is valid while length - maxCount <= k; maxCount never needs to decrease.", "Compare counts with == need at the moment a character becomes satisfied, so 'have' increments once per character.", "Record minimum windows inside the shrink loop, longest windows after it."],
      viz: { make: (i) => S.variableWindow(text(i, "pwwkew", 14)), input: "pwwkew", label: "string" },
    },
    {
      n: 3, name: "Frequency counting and anagrams", summary: "Turn each string into a letter-count signature: anagrams share it, and a fixed window can update it in O(1).",
      signals: ["valid anagram, group anagrams", "find all anagrams of p in s", "first unique character", "can you build a ransom note"],
      idea: ["Two words are anagrams exactly when their 26 letter counts match. A tuple of counts (or the sorted word) works as a hash key for grouping.", "To find anagrams of p inside s, slide a window of length len(p) and compare counts; updating the window costs O(1) per step."],
      steps: ["Count p", "Slide a len(p) window over s, adding the new letter and removing the old one", "Record every start where the counts match"],
      code: `def find_anagrams(s, p):
    if len(p) > len(s): return []
    need, win = [0] * 26, [0] * 26
    for c in p: need[ord(c) - 97] += 1
    out = []
    for i, c in enumerate(s):
        win[ord(c) - 97] += 1
        if i >= len(p): win[ord(s[i - len(p)]) - 97] -= 1
        if win == need: out.append(i - len(p) + 1)
    return out`,
      complexity: { best: "O(n)", average: "O(n · 26)", worst: "O(n · 26)", space: "O(26)", note: "Comparing two 26-arrays is constant work. Group anagrams with sorted keys costs O(n · k log k)." },
      traps: ["Use a tuple, not a list, as a dict key in Python.", "Unicode input breaks the 26-array assumption; fall back to a Counter.", "Off-by-one when removing the outgoing character: it is s[i - len(p)]."],
      viz: { make: (i) => { const [a, b] = text(i, "cbaebabacd abc", 30).split(/\s+/); return S.anagramCount(a.slice(0, 14), (b || "abc").slice(0, 5)); }, input: "cbaebabacd abc", label: "text and pattern, separated by a space" },
    },
    {
      n: 4, name: "Palindromes", summary: "Expand around every centre (odd and even), or use DP when you need palindrome facts about every substring.",
      signals: ["longest palindromic substring", "count palindromic substrings", "palindrome partitioning (with DP)", "shortest palindrome by adding characters"],
      idea: ["Every palindrome has a centre: one character (odd length) or the gap between two (even length). There are 2n - 1 centres; expand each while the ends match.", "When later steps need 'is s[i..j] a palindrome?' many times, precompute a table: pal[i][j] = s[i] == s[j] and pal[i+1][j-1]."],
      steps: ["for each centre c (2n - 1 of them)", "expand L, R outward while s[L] == s[R]", "keep the longest (or count every expansion)"],
      code: `def longest_pal(s):
    best = (0, 0)
    for c in range(2 * len(s) - 1):
        L, R = c // 2, (c + 1) // 2
        while L >= 0 and R < len(s) and s[L] == s[R]:
            if R - L > best[1] - best[0]: best = (L, R)
            L -= 1; R += 1
    return s[best[0]:best[1] + 1]`,
      complexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)", space: "O(1)", note: "Best case: no two neighbours match, so every expansion stops at once. Manacher's algorithm does it in O(n)." },
      traps: ["Forgetting even-length centres misses answers like 'abba'.", "The DP table fills by increasing length (or i from the end), never row by row from the top.", "Counting palindromes: add 1 for every successful expansion step, not per centre."],
      viz: { make: (i) => S.palindromeExpand(text(i, "babad", 12)), input: "babad", label: "string" },
    },
    {
      n: 5, name: "Pattern matching (KMP, Rabin-Karp)", summary: "Find a pattern inside text in linear time by never re-checking characters you already matched.",
      signals: ["implement strStr / find the first occurrence", "repeated substring pattern", "shortest palindrome", "count occurrences"],
      idea: ["KMP precomputes lps[i]: the longest proper prefix of p[0..i] that is also a suffix. On a mismatch, jump the pattern pointer back to lps[j - 1] instead of restarting, so the text pointer never moves backward.", "Rabin-Karp keeps a rolling hash of the current window; equal hashes are confirmed with a direct compare. Average O(n + m)."],
      steps: ["Build lps for the pattern", "Scan the text with i, pattern pointer j", "match → advance both; mismatch with j > 0 → j = lps[j - 1]; mismatch with j = 0 → advance i"],
      code: `def kmp_find(text, p):
    lps, k = [0] * len(p), 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]: k = lps[k - 1]
        if p[i] == p[k]: k += 1
        lps[i] = k
    j = 0
    for i, c in enumerate(text):
        while j and c != p[j]: j = lps[j - 1]
        if c == p[j]: j += 1
        if j == len(p): return i - j + 1
    return -1`,
      complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n + m)", space: "O(m)", note: "Naive matching is O(n · m) in the worst case (text 'aaaa…ab', pattern 'aaab')." },
      traps: ["lps uses PROPER prefixes: lps[0] is always 0.", "Rabin-Karp: always verify on a hash match, collisions happen.", "Repeated substring: s is a repetition iff n % (n - lps[-1]) == 0 and lps[-1] > 0."],
      viz: { make: (i) => S.kmpTable(text(i, "aabaaab", 12)), input: "aabaaab", label: "pattern" },
    },
    {
      n: 6, name: "String parsing", summary: "Process the string one character at a time as a small state machine: skip, read a sign, read digits, stop.",
      signals: ["string to integer (atoi)", "roman numerals, compare versions", "add or multiply numbers given as strings", "text justification"],
      idea: ["Write the states down first (spaces, sign, digits, done) and handle each with its own short loop. Most bugs come from merging states.", "Big-number arithmetic works digit by digit from the right with a carry, exactly like on paper."],
      steps: ["Skip leading whitespace", "Read an optional sign", "Read digits, clamping before overflow", "Stop at the first character that does not fit"],
      code: `def my_atoi(s):
    i, n, sign, x = 0, len(s), 1, 0
    while i < n and s[i] == " ": i += 1
    if i < n and s[i] in "+-":
        sign = -1 if s[i] == "-" else 1; i += 1
    while i < n and s[i].isdigit():
        x = x * 10 + int(s[i]); i += 1
    return max(-2**31, min(2**31 - 1, sign * x))`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Multiplying two strings of lengths a and b is O(a · b)." },
      traps: ["Overflow checks must happen before x * 10 in 32-bit languages.", "Roman numerals: subtract when a smaller value precedes a larger one.", "Version compare: missing parts count as 0 ('1.0' == '1')."],
      viz: { make: (i) => S.atoi((i ?? "   -42abc").slice(0, 14)), input: "   -42abc", label: "string" },
    },
  ],
};

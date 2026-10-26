import * as S from "../sim";
import { nums, text, type Topic } from "./types";

export const LINKEDLIST: Topic = {
  id: "linkedlist", name: "Linked lists",
  blurb: "Nodes joined by next pointers. No random access, but O(1) insert and delete once you hold the right node. Bugs come from losing a pointer, not from maths.",
  basics: ["A dummy head node removes the 'what if the head changes' special case.", "Before you overwrite curr.next, save it.", "Draw three boxes and the arrows before coding any rewiring."],
  patterns: [
    {
      n: 1, name: "Fast and slow pointers", summary: "One pointer moves one step, the other two. Their meeting point finds the middle, detects cycles and locates the cycle start.",
      signals: ["middle of the list", "is there a cycle / where does it start", "nth node from the end", "happy number, find the duplicate (values as pointers)"],
      idea: ["When fast reaches the end, slow has covered half the distance: it sits at the middle.", "In a cycle, fast gains one node per step on slow, so they must meet. Restart one pointer at head and move both one step at a time: they meet again at the cycle entry (the distance maths works out to equal lengths).", "nth from the end: move fast n steps ahead first, then move both until fast hits the end."],
      steps: ["slow = fast = head", "while fast and fast.next: slow = slow.next; fast = fast.next.next", "use where slow stopped (middle) or whether they met (cycle)"],
      code: `def detect_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            p = head
            while p is not slow:
                p, slow = p.next, slow.next
            return p          # cycle entry
    return None`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Best case: an empty or one-node list. A hash set also detects cycles but costs O(n) memory." },
      traps: ["Check fast and fast.next before stepping, or you dereference null.", "For even lengths decide which middle you want; the loop condition changes it.", "Compare node identity (is), not values."],
      viz: { make: (i) => S.fastSlow(nums(i, [1, 2, 3, 4, 5, 6, 7], 9)), input: "1, 2, 3, 4, 5, 6, 7", label: "list values" },
    },
    {
      n: 2, name: "Reversal", summary: "Flip next pointers one node at a time with prev, curr and nxt. The same three-pointer dance reverses sublists and k-groups.",
      signals: ["reverse a list", "reverse between positions m and n", "reverse nodes in k-groups", "swap pairs"],
      idea: ["Hold prev (already reversed part), curr (node being flipped) and nxt (rest of the list). Save nxt, point curr back at prev, then step both forward.", "Reversing a sublist is the same loop run k times, then reconnecting the reversed piece to the node before it and the node after it."],
      steps: ["prev = None, curr = head", "while curr: nxt = curr.next; curr.next = prev; prev = curr; curr = nxt", "return prev"],
      code: `def reverse(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev, curr = curr, nxt
    return prev`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "The recursive version is also O(n) time but uses O(n) call stack." },
      traps: ["Saving nxt AFTER changing curr.next loses the rest of the list.", "k-group: count k nodes first; if fewer remain, leave them as they are.", "Use a dummy so reversing from position 1 needs no special case."],
      viz: { make: (i) => S.reverseList(nums(i, [1, 2, 3, 4, 5], 8)), input: "1, 2, 3, 4, 5", label: "list values" },
    },
    {
      n: 3, name: "Merge, split and sort", summary: "Merge sorted lists with a dummy tail, split with fast/slow, and combine both into merge sort for lists.",
      signals: ["merge two sorted lists", "merge k sorted lists (heap)", "sort a list in O(n log n)", "partition list around x"],
      idea: ["Keep a dummy node and a tail pointer. Repeatedly attach the smaller head and advance that list. When one runs out, attach the rest of the other.", "Merge sort on a list: find the middle (fast/slow), cut there, sort both halves recursively, merge. No random access needed."],
      steps: ["dummy = tail = Node()", "while a and b: attach the smaller, advance it and tail", "tail.next = a or b", "return dummy.next"],
      code: `def merge(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val: tail.next, a = a, a.next
        else: tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next`,
      complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n + m)", space: "O(1)", note: "Merge sort on a list: O(n log n) time, O(log n) recursion. Merging k lists with a heap: O(N log k)." },
      traps: ["Cut the list when splitting (mid.next = None) or the recursion never ends.", "Use <= to keep the merge stable.", "Merging k lists one by one is O(N · k); use a heap or pairwise merging."],
      viz: { make: () => S.mergeLists() },
    },
    {
      n: 4, name: "Restructure (combine patterns)", summary: "Harder list problems are two or three small patterns in a row: find the middle, reverse a half, then merge or compare.",
      signals: ["reorder list L0 → Ln → L1 → Ln-1", "palindrome linked list in O(1) space", "rotate list by k", "odd/even grouping"],
      idea: ["Decompose first. Reorder list = middle (fast/slow) + reverse the second half + weave the halves. Palindrome = middle + reverse + compare.", "Rotate by k: make the list a ring, then cut it at length - k % length."],
      steps: ["Split the problem into known moves", "Write each move as its own helper", "Reconnect the pieces and null-terminate"],
      code: `def reorder(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    second, slow.next = reverse(slow.next), None
    first = head
    while second:
        a, b = first.next, second.next
        first.next, second.next = second, a
        first, second = a, b`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Each helper is one pass." },
      traps: ["Not cutting between the halves creates a cycle.", "Restore the list after a palindrome check if the caller still uses it.", "Rotate: k can exceed the length; use k % n."],
      viz: { make: (i) => S.reorderList(nums(i, [1, 2, 3, 4, 5, 6], 8)), input: "1, 2, 3, 4, 5, 6", label: "list values" },
    },
    {
      n: 5, name: "Traverse and modify", summary: "Walk once and change nodes or values as you go: remove duplicates, add numbers digit by digit, deep-copy with random pointers, LRU cache.",
      signals: ["remove duplicates (sorted list)", "add two numbers stored as lists", "copy list with random pointer", "design LRU cache (hash map + doubly linked list)"],
      idea: ["Most of these are a single loop with one careful pointer update per step, for example curr.next = curr.next.next to skip a duplicate.", "Add two numbers: walk both lists together with a carry, exactly like column addition.", "LRU cache: a hash map gives O(1) lookup to a node, a doubly linked list gives O(1) move-to-front and evict-from-back."],
      steps: ["Decide what one step changes", "Advance only when the current node is final", "Use a dummy if the head can be removed"],
      code: `def delete_duplicates(head):
    curr = head
    while curr and curr.next:
        if curr.next.val == curr.val:
            curr.next = curr.next.next   # splice out
        else:
            curr = curr.next
    return head`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(1)", note: "Copy with random pointer: O(n) time, O(1) extra with the interleaving trick (O(n) with a hash map). LRU get/put: O(1)." },
      traps: ["When removing, do not advance curr in the same step, or you skip a run of 3+ duplicates.", "Add two numbers: keep looping while carry is non-zero.", "LRU: update the map AND the list on every get, not just on put."],
      viz: { make: (i) => S.removeDups(nums(i, [1, 1, 2, 3, 3, 3, 4], 9).sort((a, b) => a - b)), input: "1, 1, 2, 3, 3, 3, 4", label: "sorted list values" },
    },
  ],
};

export const STACK: Topic = {
  id: "stack", name: "Stacks",
  blurb: "Last in, first out. Use a stack when the most recent unresolved item is the one that matters next: an open bracket, a pending operator, a bar still waiting for a shorter one.",
  basics: ["push, pop and peek are all O(1).", "Store indices instead of values when you need distances or widths later.", "A stack is how recursion works under the hood; any recursion can be rewritten with one."],
  patterns: [
    {
      n: 1, name: "Monotonic stack", summary: "Keep the stack sorted (increasing or decreasing). Each new element pops everything it beats, and those pops are exactly the 'next greater' answers.",
      signals: ["next greater / next smaller element", "daily temperatures, stock span", "remove k digits to make the smallest number", "asteroid collision"],
      idea: ["Walk left to right with a stack of indices whose answer is still unknown. When x arrives, every index on top with a smaller value has just found its next greater: x. Pop them, then push x.", "Each index is pushed once and popped at most once, so the whole thing is O(n) even though there is a while loop inside the for loop."],
      steps: ["for i, x in enumerate(a):", "  while stack and a[stack[-1]] < x: ans[stack.pop()] = x", "  stack.append(i)", "anything left has no next greater (-1)"],
      code: `def next_greater(a):
    ans, st = [-1] * len(a), []
    for i, x in enumerate(a):
        while st and a[st[-1]] < x:
            ans[st.pop()] = x
        st.append(i)
    return ans`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Amortised O(1) per element: n pushes and at most n pops in total." },
      traps: ["< versus <= decides how equal values behave; check the problem.", "For circular arrays, loop twice (i over 0..2n-1, index i % n).", "Next smaller uses the opposite comparison and an increasing stack."],
      viz: { make: (i) => S.nextGreater(nums(i, [2, 1, 2, 4, 3], 8)), input: "2, 1, 2, 4, 3", label: "numbers" },
    },
    {
      n: 2, name: "Bracket matching", summary: "Push every opener; every closer must match the opener on top. Whatever remains or mismatches makes the string invalid.",
      signals: ["valid parentheses", "minimum additions to make valid", "longest valid parentheses", "remove invalid parentheses / redundant brackets"],
      idea: ["The most recently opened bracket must close first, which is exactly LIFO.", "For 'longest valid', push indices and keep a base index below the stack: the length of a valid run is i - stack[-1]."],
      steps: ["for ch: opener → push", "closer → stack empty or top does not match → invalid; else pop", "valid iff the stack ends empty"],
      code: `def is_valid(s):
    pair = {")": "(", "]": "[", "}": "{"}
    st = []
    for ch in s:
        if ch in pair:
            if not st or st.pop() != pair[ch]: return False
        else:
            st.append(ch)
    return not st`,
      complexity: { best: "O(1)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Best case: the first character is a closer. For one bracket type a counter replaces the stack (O(1) space)." },
      traps: ["Check for an empty stack before popping.", "An odd-length string can never be valid: quick exit.", "Longest valid: seed the stack with -1 as the base."],
      viz: { make: (i) => S.brackets(text(i, "{[()]}(", 12)), input: "{[()]}(", label: "brackets" },
    },
    {
      n: 3, name: "Expression evaluation", summary: "Numbers go on a stack, operators combine the top values. Precedence and parentheses become 'when do I collapse the stack'.",
      signals: ["evaluate reverse Polish notation", "basic calculator I/II/III", "decode string k[...]", "simplify a Unix path"],
      idea: ["Postfix (RPN) is direct: push numbers, and an operator pops two, combines them, pushes the result.", "Infix with + - * /: keep the previous operator. Push +n or -n, but apply * and / immediately to the top. The answer is the sum of the stack.", "Parentheses: push the current result and sign, start fresh, and combine when the ')' arrives."],
      steps: ["Tokenise", "Number → push (or combine immediately for * and /)", "Operator → remember it (or apply it in RPN)", "Collapse at ')' and at the end"],
      code: `def eval_rpn(tokens):
    st = []
    for t in tokens:
        if t in "+-*/":
            b, a = st.pop(), st.pop()
            st.append(a + b if t == "+" else a - b if t == "-"
                      else a * b if t == "*" else int(a / b))
        else:
            st.append(int(t))
    return st[0]`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "One pass over the tokens." },
      traps: ["Pop order matters for - and /: the second pop is the left operand.", "Integer division truncates toward zero: int(a / b), not a // b, for negatives in Python.", "Multi-digit numbers: build them up before acting on the operator."],
      viz: { make: (i) => S.rpn(text(i, "2 1 + 3 *", 30).split(/\s+/).slice(0, 9)), input: "2 1 + 3 *", label: "RPN tokens separated by spaces" },
    },
    {
      n: 4, name: "Histogram and span", summary: "An increasing stack of bar indices finds, for every bar, the first shorter bar on each side, so its widest rectangle is known in O(1).",
      signals: ["largest rectangle in a histogram", "maximal rectangle in a binary matrix", "sum of subarray minimums", "trapping rain water (stack version)"],
      idea: ["A bar can extend left and right until it meets a shorter bar. Keep bars in increasing height; when a shorter bar arrives, the popped bar's right limit is now known, and its left limit is the new stack top.", "Maximal rectangle: treat every matrix row as the ground of a histogram of consecutive 1s and run the same routine."],
      steps: ["Append a 0-height sentinel at the end", "for each bar: while it is shorter than the top, pop and compute height × width", "push its index"],
      code: `def largest_rect(h):
    st, best = [], 0
    for i, x in enumerate(h + [0]):
        while st and h[st[-1]] > x:
            top = st.pop()
            left = st[-1] + 1 if st else 0
            best = max(best, h[top] * (i - left))
        st.append(i)
    return best`,
      complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Maximal rectangle: O(rows × cols)." },
      traps: ["Without the trailing sentinel, bars left on the stack never get measured.", "Width uses the new top after popping, not the popped index.", "Sum of subarray minimums: use < on one side and <= on the other so equal values are not double counted."],
      viz: { make: (i) => S.histogram(nums(i, [2, 1, 5, 6, 2, 3], 9)), input: "2, 1, 5, 6, 2, 3", label: "bar heights" },
    },
    {
      n: 5, name: "Augmented stack", summary: "Store extra state with each element (the minimum so far, a count, a timestamp) so special queries stay O(1).",
      signals: ["min stack / max stack", "implement a queue using stacks", "stack using queues", "frequency stack"],
      idea: ["Push (value, min so far). The minimum of the whole stack is always on top, and popping restores the previous minimum automatically.", "Queue from two stacks: push into 'in'; when 'out' is empty, pour 'in' into it. Each element moves at most twice, so operations are amortised O(1)."],
      steps: ["Decide what each entry must remember", "Compute it from the entry below on push", "Read it from the top in O(1)"],
      code: `class MinStack:
    def __init__(self): self.st = []
    def push(self, x):
        m = min(x, self.st[-1][1]) if self.st else x
        self.st.append((x, m))
    def pop(self): self.st.pop()
    def top(self): return self.st[-1][0]
    def getMin(self): return self.st[-1][1]`,
      complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(n)", note: "Queue from stacks: amortised O(1), O(n) for a single pour." },
      traps: ["A single global min variable breaks after you pop the minimum.", "Queue from stacks: only pour when 'out' is empty, otherwise order breaks.", "Max stack with popMax needs a heap or a sorted structure plus lazy deletion."],
      viz: { make: () => S.minStack() },
    },
  ],
};

export const HEAP: Topic = {
  id: "heap", name: "Heaps",
  blurb: "A heap always knows its smallest (or largest) element. Use it when you repeatedly need the current best and the set keeps changing.",
  basics: ["push and pop: O(log n). peek: O(1). heapify an array: O(n).", "Python's heapq is a min-heap; push -x for a max-heap.", "A size-k heap keeps the top k of a stream in O(n log k)."],
  patterns: [
    {
      n: 1, name: "Top-K with a fixed-size heap", summary: "To keep the k largest, use a MIN-heap of size k: its top is the weakest of the winners, and anything smaller is rejected.",
      signals: ["kth largest / smallest", "top k elements", "k closest points", "kth largest in a stream"],
      idea: ["The opposite-type trick: for the k largest, keep a min-heap. When it grows past k, pop the smallest. At the end the heap holds the k largest and its top is the kth largest.", "This costs O(n log k) instead of O(n log n) for full sorting, and works on streams."],
      steps: ["for x: push x", "if size > k: pop", "top of the heap = kth largest"],
      code: `import heapq
def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k: heapq.heappop(h)
    return h[0]`,
      complexity: { best: "O(n)", average: "O(n log k)", worst: "O(n log k)", space: "O(k)", note: "Best case k = 1 or k = n. Quickselect is O(n) average if you only need one answer." },
      traps: ["Using a max-heap of everything works but costs O(n) memory and O(n log n).", "K closest points: push (-dist, point) into a max-heap of size k.", "Ties: add a second tuple field so objects are never compared directly."],
      viz: { make: (i) => { const v = nums(i, [3, 2, 1, 5, 6, 4, 2], 10); return S.topK(v.slice(0, -1), Math.max(1, Math.min(v.length - 1, v[v.length - 1]))); }, input: "3, 2, 1, 5, 6, 4, 2", label: "numbers, last value = k" },
    },
    {
      n: 2, name: "Top-K by frequency or score", summary: "Count or score first, then run the same fixed-size heap on (score, item) pairs.",
      signals: ["top k frequent elements / words", "sort characters by frequency", "reorganize by count", "k closest by a computed distance"],
      idea: ["Build a Counter in O(n). Push (count, value) into a min-heap of size k so the least frequent winner sits on top and gets evicted first.", "Bucket sort is an O(n) alternative: bucket[c] holds values that appear c times; read buckets from high to low."],
      steps: ["count = Counter(nums)", "for value, c in count: push (c, value); pop if size > k", "return the values left in the heap"],
      code: `import heapq
from collections import Counter
def top_k_frequent(nums, k):
    h = []
    for v, c in Counter(nums).items():
        heapq.heappush(h, (c, v))
        if len(h) > k: heapq.heappop(h)
    return [v for c, v in h]`,
      complexity: { best: "O(n)", average: "O(n + m log k)", worst: "O(n + m log k)", space: "O(m)", note: "m = number of distinct values. Bucket sort version: O(n)." },
      traps: ["Top k frequent WORDS breaks ties alphabetically: with a min-heap you need the reverse word order in the key.", "heapq.nlargest(k, count, key=count.get) is fine in interviews if you can explain it.", "Do not push every element, only every distinct value."],
      viz: { make: (i) => { const v = nums(i, [1, 1, 1, 2, 2, 3, 3, 3, 3, 4, 2], 14); return S.topKFreq(v.slice(0, -1), Math.max(1, v[v.length - 1])); }, input: "1, 1, 1, 2, 2, 3, 3, 3, 3, 4, 2", label: "numbers, last value = k" },
    },
    {
      n: 3, name: "K-way merge", summary: "Keep one candidate from each sorted source in a min-heap. Pop the smallest, then push the next item from the same source.",
      signals: ["merge k sorted lists", "kth smallest in a sorted matrix", "smallest range covering k lists", "find k pairs with smallest sums"],
      idea: ["Only the current head of each list can be the next smallest overall, so the heap never holds more than k items.", "For the sorted matrix, treat each row as a list: push the first column, and when you pop (r, c), push (r, c + 1)."],
      steps: ["push (head value, list id) for each list", "pop the smallest, append it to the output", "push the next element from that list", "repeat until the heap is empty"],
      code: `import heapq
def merge_k(lists):
    h = [(l.val, i, l) for i, l in enumerate(lists) if l]
    heapq.heapify(h)
    dummy = tail = ListNode()
    while h:
        _, i, node = heapq.heappop(h)
        tail.next = tail = node
        if node.next: heapq.heappush(h, (node.next.val, i, node.next))
    return dummy.next`,
      complexity: { best: "O(N log k)", average: "O(N log k)", worst: "O(N log k)", space: "O(k)", note: "N = total elements across all k lists." },
      traps: ["Include an index in the tuple so Python never compares two ListNodes.", "Kth smallest in matrix: stop after k pops; binary search on the value is another option.", "Smallest range: track the current max alongside the heap."],
      viz: { make: () => S.kWayMerge() },
    },
    {
      n: 4, name: "Two heaps (running median)", summary: "A max-heap holds the smaller half, a min-heap the larger half. Keep their sizes within one and the median is at the tops.",
      signals: ["find the median of a data stream", "sliding window median", "IPO (capital and profit)", "balance two groups"],
      idea: ["Every number in 'low' is <= every number in 'high'. After each insert, move one element across if needed so len(low) is len(high) or one more.", "Median = top of low (odd count) or the average of both tops (even count)."],
      steps: ["push into low (as -x)", "move low's top into high", "if high is bigger, move its top back to low", "read the median from the tops"],
      code: `import heapq
class MedianFinder:
    def __init__(self): self.lo, self.hi = [], []
    def addNum(self, x):
        heapq.heappush(self.lo, -x)
        heapq.heappush(self.hi, -heapq.heappop(self.lo))
        if len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))
    def findMedian(self):
        if len(self.lo) > len(self.hi): return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2`,
      complexity: { best: "O(log n)", average: "O(log n)", worst: "O(log n)", space: "O(n)", note: "Per insert; findMedian is O(1). Sliding window median adds lazy deletion." },
      traps: ["Forgetting to negate when reading the max-heap's top.", "Always pass through the other heap on insert, so the ordering invariant holds.", "Sliding window median: removing an arbitrary element needs lazy deletion with a counter."],
      viz: { make: (i) => S.twoHeaps(nums(i, [5, 15, 1, 3, 8], 8)), input: "5, 15, 1, 3, 8", label: "stream of numbers" },
    },
    {
      n: 5, name: "Greedy with a heap", summary: "When the best move is 'act on the current largest or smallest' and the set changes after every move, a heap keeps that choice O(log n).",
      signals: ["last stone weight", "task scheduler, reorganize string", "minimum cost to connect sticks / ropes", "meeting rooms II, single-threaded CPU"],
      idea: ["Each step takes the best one or two items, combines or uses them, and may push something back. A heap gives the best item in O(log n) every time.", "Reorganize string: always place the most frequent remaining letter that is not the one just placed; hold the previous letter out of the heap for one turn."],
      steps: ["Heapify the initial items", "while work remains: pop the best, act, push back what remains", "Check the termination rule (empty heap, impossible arrangement)"],
      code: `import heapq
def last_stone(stones):
    h = [-s for s in stones]
    heapq.heapify(h)
    while len(h) > 1:
        a, b = -heapq.heappop(h), -heapq.heappop(h)
        if a != b: heapq.heappush(h, -(a - b))
    return -h[0] if h else 0`,
      complexity: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "heapify is O(n); each of up to n rounds costs O(log n)." },
      traps: ["Max-heap in Python means negating on the way in AND out.", "Task scheduler also has a closed form: (maxCount - 1) × (n + 1) + numberOfMaxTasks, or len(tasks) if bigger.", "Reorganize string is impossible when the top count exceeds (n + 1) / 2."],
      viz: { make: () => S.heapGreedy() },
    },
  ],
};

export const INTERVALS: Topic = {
  id: "intervals", name: "Intervals",
  blurb: "Pairs [start, end] on a line. Nearly every interval problem starts by sorting, then makes one sweep.",
  basics: ["[a, b] and [c, d] overlap when a <= d and c <= b (or strict, if touching does not count).", "Sort by start to merge; sort by end to pick the most non-overlapping.", "Turning intervals into +1/-1 events gives the number active at any time."],
  patterns: [
    {
      n: 1, name: "Merge intervals", summary: "Sort by start; extend the last merged interval while the next one starts inside it.",
      signals: ["merge overlapping intervals", "insert a new interval", "summary ranges", "total covered length"],
      idea: ["Sorted by start, any interval that overlaps the current merged block must come right after it. So one pass with a 'last' block is enough.", "Insert interval: copy everything that ends before the new one, merge everything that overlaps it, copy the rest."],
      steps: ["sort by start", "for each: overlaps last → last.end = max(last.end, end); else append", "return the merged list"],
      code: `def merge(iv):
    iv.sort(key=lambda x: x[0])
    out = []
    for s, e in iv:
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out`,
      complexity: { best: "O(n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "Best case: input already sorted. Insert interval on sorted input is O(n)." },
      traps: ["max(end, e): a later interval can be fully contained.", "Touching endpoints: decide <= or < from the problem statement.", "Do not mutate input the caller still needs."],
      viz: { make: () => S.mergeIntervals() },
    },
    {
      n: 2, name: "Sweep line", summary: "Turn each interval into a +1 at its start and a -1 at its end, sort the events, and keep a running count.",
      signals: ["minimum meeting rooms", "car pooling / capacity checks", "maximum overlap at any point", "number of flowers in bloom"],
      idea: ["The running sum of events at time t is the number of intervals covering t. Its maximum is the number of rooms you need.", "Order ties carefully: process an end before a start at the same time if the room frees up exactly when the next meeting begins."],
      steps: ["events = [(s, +1), (e, -1)] for every interval", "sort (time, delta)", "running += delta, track the max"],
      code: `def min_rooms(iv):
    ev = []
    for s, e in iv:
        ev += [(s, 1), (e, -1)]
    ev.sort()            # ends (-1) sort before starts at equal times
    cur = best = 0
    for _, d in ev:
        cur += d
        best = max(best, cur)
    return best`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(n)", note: "With small integer times, a difference array makes it O(n + T)." },
      traps: ["Tie order changes the answer; think about whether touching intervals overlap.", "A min-heap of end times is an equivalent approach for meeting rooms.", "For point queries (flowers), binary search the sorted starts and ends separately."],
      viz: { make: () => S.sweepLine() },
    },
    {
      n: 3, name: "Non-overlapping selection", summary: "Sort by END and keep each interval that starts after the last kept end. Finishing earliest leaves the most room for the rest.",
      signals: ["non-overlapping intervals (minimum removals)", "minimum arrows to burst balloons", "maximum meetings in one room", "activity selection"],
      idea: ["Exchange argument: if an optimal answer starts with some interval, swapping it for the one that ends earliest never hurts, because everything compatible with the first is also compatible with the earlier-ending one.", "Minimum removals = n - (maximum kept)."],
      steps: ["sort by end", "end = -inf", "for each: start >= end → keep it, end = its end; else → remove it"],
      code: `def erase_overlap(iv):
    iv.sort(key=lambda x: x[1])
    end, kept = float("-inf"), 0
    for s, e in iv:
        if s >= end:
            kept += 1
            end = e
    return len(iv) - kept`,
      complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)", space: "O(1)", note: "Sorting dominates; the selection pass is O(n)." },
      traps: ["Sorting by start gives wrong answers here; it is the most common mistake.", "Balloons: arrows burst touching balloons, so the comparison is s > end for a new arrow.", "Count kept items, then subtract, rather than counting removals directly."],
      viz: { make: () => S.activitySelect() },
    },
    {
      n: 4, name: "Intersection of two lists", summary: "Two pointers over two sorted interval lists: the overlap of the current pair is [max starts, min ends]; advance the one that ends first.",
      signals: ["interval list intersections", "free time for all employees", "meeting scheduler for two people", "common free slots"],
      idea: ["The interval that ends first cannot overlap anything later in the other list, so it is safe to move past it.", "Employee free time: merge all busy intervals, then the gaps between merged blocks are the free time."],
      steps: ["i = j = 0", "lo = max(A[i].start, B[j].start), hi = min(A[i].end, B[j].end)", "lo <= hi → record [lo, hi]", "advance whichever ends first"],
      code: `def intersect(A, B):
    i = j = 0
    out = []
    while i < len(A) and j < len(B):
        lo, hi = max(A[i][0], B[j][0]), min(A[i][1], B[j][1])
        if lo <= hi: out.append([lo, hi])
        if A[i][1] < B[j][1]: i += 1
        else: j += 1
    return out`,
      complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n + m)", space: "O(1)", note: "Output not counted. Both lists must already be sorted and internally disjoint." },
      traps: ["Advance by END, not by start.", "Meeting scheduler: also require hi - lo >= duration.", "Equal ends: advancing either is fine."],
      viz: { make: () => S.intervalIntersect() },
    },
    {
      n: 5, name: "Calendar and online booking", summary: "Intervals arrive one by one. Keep the accepted ones in a sorted structure and check only the neighbours of the new one.",
      signals: ["my calendar I / II / III", "range module", "count overlapping bookings online", "data stream as disjoint intervals"],
      idea: ["In a sorted list of non-overlapping bookings, a new [s, e) can only clash with the booking just before or just after where it would be inserted. Binary search finds that spot.", "For 'at most k overlaps', keep a sorted map of time → +1/-1 and sweep it on each booking (or use a segment tree for speed)."],
      steps: ["find the insert position of s", "check the previous booking's end and the next booking's start", "accept and insert, or reject"],
      code: `import bisect
class MyCalendar:
    def __init__(self): self.starts, self.ends = [], []
    def book(self, s, e):
        i = bisect.bisect_right(self.starts, s)
        if i and self.ends[i - 1] > s: return False
        if i < len(self.starts) and self.starts[i] < e: return False
        self.starts.insert(i, s); self.ends.insert(i, e)
        return True`,
      complexity: { best: "O(log n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Search is O(log n); inserting into a Python list is O(n). A balanced tree (TreeMap) makes it O(log n)." },
      traps: ["Bookings are half-open [s, e): ending at 10 and starting at 10 do not clash.", "Calendar II: track double bookings separately and reject anything overlapping them.", "Calendar III: the answer is the max running sum over the time map."],
      viz: { make: () => S.calendar() },
    },
  ],
};

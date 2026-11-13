// Overview of the "heap" topic: the data structure or technique itself. Shown on /patterns/heap before the patterns.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

/** Tree slots 0..n-1 laid out as a binary heap: parent of i is (i - 1) >> 1. */
const slots = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i, label: "", parent: i ? (i - 1) >> 1 : null, side: (i % 2 ? "L" : "R") as "L" | "R" }));
const frame = (a: number[], cap: number, note: string, hot: [number, Tone][] = []): TreeFrame => ({
  note: `${note}. Array [${a.join(", ")}]`,
  labels: Object.fromEntries(Array.from({ length: cap }, (_, i) => [i, i < a.length ? String(a[i]) : ""])),
  tones: { ...Object.fromEntries(Array.from({ length: cap - a.length }, (_, k): [number, Tone] => [a.length + k, "muted"])), ...Object.fromEntries(hot) },
});

/** push: append at the next free slot, then swap with the parent while smaller. */
function pushUp(input?: string): Diagram {
  const xs = nums(input, [5, 3, 8, 1, 4, 2], 12), a: number[] = [], frames: TreeFrame[] = [];
  for (const x of xs) {
    a.push(x); let i = a.length - 1;
    frames.push(frame(a, xs.length, `push ${x}: write it at index ${i}, the next free slot, so the tree stays complete`, [[i, "active"]]));
    while (i > 0 && a[(i - 1) >> 1] > a[i]) {
      const p = (i - 1) >> 1; [a[p], a[i]] = [a[i], a[p]];
      frames.push(frame(a, xs.length, `${x} is smaller than its parent ${a[i]} (index ${p} = (${i} - 1) / 2): swap them`, [[p, "active"], [i, "window"]]));
      i = p;
    }
    if (a.length > 1) frames.push(frame(a, xs.length, i === 0 ? `${x} reached the root: it is the new minimum` : `${x} is not smaller than its parent ${a[(i - 1) >> 1]}: stop. At most log2(n) swaps`, [[i, "found"]]));
  }
  return { kind: "tree", title: "Min-heap push: add at the end, sift up", nodes: slots(xs.length), frames };
}

/** pop: take the root, move the last leaf to the root, then swap with the smaller child while larger. */
function popDown(input?: string): Diagram {
  const a = nums(input, [1, 3, 2, 7, 4, 8, 5], 12), cap = a.length, frames: TreeFrame[] = [];
  for (let i = (a.length >> 1) - 1; i >= 0; i--) for (let j = i; ; ) { const l = 2 * j + 1, r = l + 1; let s = j; if (l < a.length && a[l] < a[s]) s = l; if (r < a.length && a[r] < a[s]) s = r; if (s === j) break; [a[j], a[s]] = [a[s], a[j]]; j = s; }
  frames.push(frame(a, cap, "A valid min-heap: every parent is at most its children, so the minimum is the root", [[0, "found"]]));
  for (let k = 0; k < Math.min(3, cap); k++) {
    const top = a[0], last = a.pop()!;
    if (!a.length) { frames.push(frame(a, cap, `pop returns ${top}; the heap is empty now`)); break; }
    a[0] = last;
    frames.push(frame(a, cap, `pop returns ${top}. The last leaf ${last} moves into the root, so the array has no gap and the tree stays complete`, [[0, "active"]]));
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let s = i;
      if (l < a.length && a[l] < a[s]) s = l;
      if (r < a.length && a[r] < a[s]) s = r;
      if (s === i) break;
      const ks = [l, r].filter((c) => c < a.length).map((c) => a[c]), kids = ks.length > 1 ? `the smaller of its children (${ks.join(" and ")})` : `its only child (${ks[0]})`;
      [a[i], a[s]] = [a[s], a[i]];
      frames.push(frame(a, cap, `${a[s]} is larger than ${kids}: swap with ${a[i]} at index ${s}`, [[i, "window"], [s, "active"]]));
      i = s;
    }
    frames.push(frame(a, cap, `${a[i]} is at most its children: stop. The new minimum is ${a[0]}, after at most log2(n) swaps`, [[0, "found"]]));
  }
  return { kind: "tree", title: "Min-heap pop: last leaf to the root, sift down", nodes: slots(cap), frames };
}

/** heapify: sift down every parent from the last one back to the root, O(n) in total. */
function heapify(input?: string): Diagram {
  const a = nums(input, [9, 4, 7, 1, 8, 2, 6, 3], 12), n = a.length, frames: TreeFrame[] = [];
  frames.push(frame(a, n, `Any array is already a complete tree. The leaves (indexes ${n >> 1} to ${n - 1}) are heaps of one, so start at the last parent, index ${(n >> 1) - 1}`));
  let swaps = 0;
  for (let p = (n >> 1) - 1; p >= 0; p--) {
    frames.push(frame(a, n, `Sift down index ${p} (value ${a[p]}): both subtrees below it are heaps already`, [[p, "active"]]));
    let i = p;
    for (;;) {
      const l = 2 * i + 1, r = l + 1; let s = i;
      if (l < n && a[l] < a[s]) s = l;
      if (r < n && a[r] < a[s]) s = r;
      if (s === i) break;
      [a[i], a[s]] = [a[s], a[i]]; swaps++;
      frames.push(frame(a, n, `${a[s]} is larger than its smaller child ${a[i]}: swap, and keep going down from index ${s}`, [[i, "window"], [s, "active"]]));
      i = s;
    }
  }
  frames.push(frame(a, n, `Done with ${swaps} swaps. Most nodes are near the bottom and sift only a level or two, which is why heapify is O(n), not O(n log n)`, [[0, "found"]]));
  return { kind: "tree", title: "Heapify bottom-up in O(n)", nodes: slots(n), frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **binary heap** is a binary tree with two rules. The **shape rule**: the tree is complete, every level full except the last, which fills from the left. The **heap rule**: in a **min-heap** every parent is less than or equal to its children (in a **max-heap**, greater than or equal). So the root is always the minimum (or maximum), but the rest is only partly ordered: siblings and cousins can be in any order.",
    "Because the tree is complete, it needs no pointers. It lives in a plain array in level order: the root at index 0, then its two children, then the four grandchildren, and so on. For index `i`, the parent is `(i - 1) // 2` and the children are `2i + 1` and `2i + 2` (with 1-based indexing: `i // 2`, `2i` and `2i + 1`). The height is `floor(log2 n)`, so a path from the root to a leaf has at most about log2(n) steps.",
    "That layout makes three things cheap: reading the minimum (O(1), it is `a[0]`), adding a value and removing the minimum (O(log n), one path of swaps). Everything else is expensive or impossible: finding an arbitrary value is O(n) because the order does not guide the search, and the array is not sorted, so you cannot list values in order without popping them one by one.",
    "A **priority queue** is the abstract idea (insert anything, always take out the most urgent item), and a binary heap is the usual way to build one. Min-heap or max-heap is just the comparison. Libraries pick one default: C++ `priority_queue` is a max-heap, Python `heapq` is a min-heap. You get the other by flipping the comparator or negating the keys.",
    "Variants. A **d-ary heap** gives each node d children (parent `(i - 1) // d`, children `d*i + 1` to `d*i + d`): the tree is shallower, so push and decrease-key do fewer swaps (O(log_d n)), while pop compares d children per level (O(d log_d n)); 4-ary heaps are often faster in practice because of the cache. **Binomial** and **Fibonacci** heaps add O(1) merge and amortised O(1) decrease-key, which matters in theory for Dijkstra, but they are rarely written in interviews. An **indexed heap** keeps a map from item to array position so you can change one item's priority in O(log n).",
    "Vocabulary: min-heap and max-heap, root or top, sift up (bubble up, swim) and sift down (bubble down, sink), heapify (build heap), extract-min or pop, push-pop, decrease-key, complete binary tree, priority queue, top k, k-way merge, lazy deletion.",
  ],
  build: [
    "Fields: just the array `a` (and its size). The invariant is `a[parent(i)] <= a[i]` for every `i > 0`. Each operation breaks it in one place and repairs it along one path.",
    "Push: append the value at index `n`, the only slot that keeps the tree complete. It may be smaller than its parent, so **sift up**: while `i > 0` and `a[parent] > a[i]`, swap them and move `i` to the parent. Only the path to the root changes, at most log2(n) swaps.",
    "Pop: the minimum is `a[0]`. Move the last element into the root and shrink the array, which keeps the shape. The new root may be too large, so **sift down**: compare it with its smaller child and swap while the child is smaller. Swapping with the smaller child matters: that child becomes the parent of the other one, so it must be the smaller of the two.",
    "Heapify (build a heap from n values in place): call sift down on every parent, from the last one, index `n // 2 - 1`, back to the root. The leaves are already heaps. Half the nodes are leaves, a quarter sift at most one level, an eighth at most two, and the sum of n/2^(h+1) times h is under n. So building is O(n), cheaper than n pushes at O(n log n).",
    "Heap sort: heapify into a **max-heap**, then repeatedly swap the root (the largest) with the last element of the heap, shrink the heap by one and sift the new root down. The sorted part grows at the back. It is O(n log n) in every case with O(1) extra space, but it is not stable and its jumpy memory access makes it slower than quicksort or merge sort in practice.",
    "Changing a priority: if you track each item's index (a hash map updated on every swap), decreasing a key in a min-heap is a sift up and increasing it is a sift down, both O(log n). Without that map, the common interview trick is **lazy deletion**: push the new entry and, when an outdated entry reaches the top, skip it.",
  ],
  code: `class MinHeap:
    """Binary min-heap in a plain list: parent of i is (i - 1) // 2, children are 2i + 1 and 2i + 2."""
    def __init__(self, items=()):
        self.a = list(items)
        for i in range(len(self.a) // 2 - 1, -1, -1):   # heapify: sift down every parent, last first, O(n)
            self._down(i)

    def _up(self, i):                    # move a[i] up while it is smaller than its parent
        a = self.a
        while i > 0:
            p = (i - 1) // 2
            if a[p] <= a[i]:
                break
            a[p], a[i] = a[i], a[p]
            i = p

    def _down(self, i):                  # move a[i] down, swapping with the smaller child
        a, n = self.a, len(self.a)
        while True:
            small, l, r = i, 2 * i + 1, 2 * i + 2
            if l < n and a[l] < a[small]:
                small = l
            if r < n and a[r] < a[small]:
                small = r
            if small == i:
                return
            a[i], a[small] = a[small], a[i]
            i = small

    def push(self, x):                   # O(log n): add at the end, then sift up
        self.a.append(x)
        self._up(len(self.a) - 1)

    def peek(self):                      # O(1): the minimum is always at the root
        return self.a[0] if self.a else None

    def pop(self):                       # O(log n): move the last leaf to the root, then sift down
        if not self.a:
            raise IndexError("pop from empty heap")
        last = self.a.pop()
        if not self.a:
            return last
        top, self.a[0] = self.a[0], last
        self._down(0)
        return top

    def replace(self, x):                # pop then push in one sift: O(log n)
        top, self.a[0] = self.a[0], x
        self._down(0)
        return top

    def __len__(self): return len(self.a)


def heap_sort(a):
    """In place, ascending: build a MAX-heap, then swap the root to the end and shrink the heap."""
    def down(i, n):
        while True:
            big, l, r = i, 2 * i + 1, 2 * i + 2
            if l < n and a[l] > a[big]:
                big = l
            if r < n and a[r] > a[big]:
                big = r
            if big == i:
                return
            a[i], a[big] = a[big], a[i]
            i = big
    n = len(a)
    for i in range(n // 2 - 1, -1, -1):  # heapify, O(n)
        down(i, n)
    for end in range(n - 1, 0, -1):      # n - 1 extractions, O(log n) each
        a[0], a[end] = a[end], a[0]      # the largest goes to its final place
        down(0, end)
    return a`,
  ops: [
    {
      title: "Binary heap (min-heap; a max-heap is the mirror)",
      rows: [
        ["Peek the minimum", "O(1)", "O(1)", "It is always a[0]"],
        ["Push", "O(1)", "O(log n)", "Sift up along one path; on random input a new value rises only a level or two on average"],
        ["Pop the minimum", "O(log n)", "O(log n)", "Last leaf to the root, then sift down the full height"],
        ["Push-pop or replace", "O(log n)", "O(log n)", "One sift instead of two; heapq.heappushpop and heapreplace"],
        ["Heapify n values", "O(n)", "O(n)", "Sift down from the last parent up; most nodes are near the bottom"],
        ["Build by n pushes", "O(n log n)", "O(n log n)", "Each push may climb the whole height"],
        ["Search for a value", "O(n)", "O(n)", "The heap rule says nothing about left against right"],
        ["Delete at a known index", "O(log n)", "O(log n)", "Move the last element there, then sift up or down"],
        ["Delete a value", "O(n)", "O(n)", "Finding it is the cost; lazy deletion skips it later instead"],
        ["Decrease or increase a key", "O(log n)", "O(log n)", "Needs an index map; then one sift up or down"],
        ["Merge two heaps", "O(n + m)", "O(n + m)", "Concatenate the arrays and heapify"],
        ["Size, is empty", "O(1)", "O(1)", "The array length"],
        ["List all values in sorted order", "O(n log n)", "O(n log n)", "Pop n times; the array itself is not sorted"],
        ["Heap sort", "O(n log n)", "O(n log n)", "Max-heap, swap the root to the end, shrink; O(1) space, not stable"],
        ["k smallest of n (or kth smallest)", "O(n + k log n)", "O(n + k log n)", "Heapify, then pop k times"],
        ["k largest of n streaming", "O(n log k)", "O(n log k)", "A size-k MIN-heap whose root is the kth largest"],
        ["Merge k sorted lists, N items in all", "O(N log k)", "O(N log k)", "Heap of the k current heads"],
        ["Median of a stream", "O(log n) per add", "O(log n) per add", "Max-heap of the low half plus min-heap of the high half"],
        ["Dijkstra with a binary heap", "O((V + E) log V)", "O((V + E) log V)", "One push per edge relaxation, lazy deletion of stale entries"],
      ],
    },
    {
      title: "Other heaps (for the follow-up question)",
      rows: [
        ["d-ary heap: push, decrease-key", "O(log_d n)", "O(log_d n)", "Shallower tree: fewer levels to climb"],
        ["d-ary heap: pop", "O(d log_d n)", "O(d log_d n)", "d children compared at every level"],
        ["Fibonacci heap: push, merge, decrease-key", "O(1) amortised", "O(n) one operation", "Work is postponed and paid by later pops"],
        ["Fibonacci heap: pop", "O(log n) amortised", "O(n) one operation", "Consolidates the postponed trees"],
        ["Balanced BST as a priority queue", "O(log n)", "O(log n)", "Also deletes any item and finds both min and max; larger constants"],
      ],
    },
  ],
  builtins: [
    ["Min-heap", "`priority_queue<int, vector<int>, greater<int>>`", "`heapq.heappush(h, x)`, `heapq.heappop(h)`, `h[0]`"],
    ["Max-heap", "`priority_queue<int>` (the default)", "Push `-x` and negate on the way out (Python 3.14 adds `heappush_max` and friends)"],
    ["Heapify an existing array", "`make_heap(v.begin(), v.end())`, then `push_heap` / `pop_heap`", "`heapq.heapify(list)`"],
    ["Push then pop, or pop then push, in one step", "Not provided; `pop` then `push`", "`heapq.heappushpop`, `heapq.heapreplace`"],
    ["k smallest or largest", "`partial_sort`, `nth_element`", "`heapq.nsmallest(k, xs)`, `heapq.nlargest(k, xs)`"],
    ["Merge sorted sequences", "A `priority_queue` of heads", "`heapq.merge(*iterables)`"],
    ["Custom order or ties", "A comparator struct or lambda: `priority_queue<T, vector<T>, decltype(cmp)>`", "Push tuples `(priority, tiebreak, item)`"],
    ["Priority queue with delete and update", "`std::set<pair<int, int>>` (erase and insert)", "No built-in; lazy deletion with a heap"],
  ],
  when: [
    "\"k largest\", \"k smallest\", \"kth\", \"top k frequent\", \"k closest\": a size-k heap.",
    "Repeatedly take the current smallest or largest while new items keep arriving: a priority queue.",
    "Merge k sorted lists, arrays or streams: a heap of the current heads.",
    "\"Median\" of a stream, or keep two halves balanced: two heaps.",
    "Schedule by earliest end, cheapest cost, or highest profit among what is available now: a greedy with a heap.",
    "Shortest paths with weights, or always expand the cheapest frontier node: Dijkstra, Prim, A*.",
    "Simulate events in time order (servers freeing up, tasks arriving): a min-heap keyed by time.",
  ],
  avoid: [
    "You need the values fully sorted once: just sort, O(n log n) with a smaller constant.",
    "You need to search or delete arbitrary values often: a balanced BST (`std::set`, `SortedList`) or a hash map.",
    "You need both the min and the max of a changing set: a balanced BST, or two heaps with lazy deletion.",
    "The kth element of a fixed array, once: quickselect is O(n) on average.",
    "The maximum of a sliding window: a monotonic deque is O(n), better than a heap's O(n log n).",
  ],
  tips: [
    "Say which heap and why: for the k largest, a MIN-heap of size k, because its root is the weakest member and the first to go.",
    "Python's `heapq` is a min-heap only; negate keys for a max-heap, and push tuples to carry extra data.",
    "With tuples, ties compare the next field; add a counter `(priority, i, item)` when items cannot be compared.",
    "C++ `priority_queue` is a max-heap by default and its comparator reads backwards: `greater<int>` gives a min-heap.",
    "`top()` on an empty `priority_queue` is undefined behaviour; check `empty()` first. `heappop` on an empty list raises `IndexError`.",
    "Heapify is O(n). Mention it when building from a known list instead of pushing one by one.",
    "A heap cannot remove an arbitrary item cheaply. Use lazy deletion: keep a count of removed values and discard them when they surface at the top.",
    "Know the index formulas by heart: parent `(i - 1) // 2`, children `2i + 1` and `2i + 2`.",
  ],
  viz: [
    { name: "Push and sift up", make: pushUp, input: "5, 3, 8, 1, 4, 2", label: "values to push" },
    { name: "Pop and sift down", make: popDown, input: "1, 3, 2, 7, 4, 8, 5", label: "heap values" },
    { name: "Heapify in O(n)", make: heapify, input: "9, 4, 7, 1, 8, 2, 6, 3", label: "array to heapify" },
  ],
};

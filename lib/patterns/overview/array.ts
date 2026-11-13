// Overview of the "array" topic: the data structure or technique itself. Shown on /patterns/array before the patterns.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

const blank = (a: (string | number)[], cap: number) => [...a, ...Array(Math.max(0, cap - a.length)).fill("")];
const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;

/** Insert x at index i of a dynamic array: grow if full, then shift the tail right one slot at a time, from the back. */
function insertViz(input: number[], x = 9): Diagram {
  const a = [...input], frames: CellsFrame[] = [], i = Math.floor(a.length / 2);
  let cap = 1;
  while (cap < a.length) cap *= 2;
  frames.push({ note: `${a.length} items in a block of ${cap} slots. Insert ${x} at index ${i}: every item from index ${i} on must move one slot right`, rows: [blank(a, cap)], marks: [{ i, label: "i" }] });
  if (a.length === cap) {
    cap *= 2;
    frames.push({ note: `The block is full, so allocate ${cap} slots and copy all ${a.length} items across first (O(n) once, then free for a while)`, rows: [blank(a, cap)], tones: tonesOf(a.map((_, j) => [`0:${j}`, "muted"])) });
  }
  const row = blank(a, cap);
  for (let j = a.length; j > i; j--) {
    row[j] = row[j - 1];
    frames.push({ note: `Copy index ${j - 1} to index ${j}. Going from the back means nothing is overwritten before it has moved`, rows: [[...row]], tones: { [`0:${j}`]: "active", [`0:${j - 1}`]: "muted" }, marks: [{ i: j, label: "write" }] });
  }
  row[i] = x;
  frames.push({ note: `Slot ${i} is free now: write ${x} there`, rows: [[...row]], tones: { ["0:" + i]: "found" }, marks: [{ i, label: "i" }] });
  const moved = a.length - i;
  frames.push({ note: `Done. ${moved} item${moved === 1 ? "" : "s"} moved for one insert, which is why inserting near the front of an array of n items costs O(n), while an append costs O(1)`, rows: [[...row]], tones: tonesOf([...Array(moved)].map((_, k) => [`0:${i + 1 + k}`, "window"] as [string, Tone]).concat([[`0:${i}`, "found"]])) });
  return { kind: "cells", title: `insert ${x} at index ${i}`, rows: [blank(input, cap)], frames };
}

/** Append items one by one to an empty dynamic array that doubles its capacity when full; count every copy. */
function doublingViz(items: number[]): Diagram {
  const frames: CellsFrame[] = [], a: number[] = [];
  let cap = 1, copies = 0;
  frames.push({ note: "An empty dynamic array with room for 1 item. Append grows the block by doubling it when it is full", rows: [blank([], cap)] });
  for (const x of items) {
    if (a.length === cap) {
      copies += a.length; cap *= 2;
      frames.push({ note: `Full at ${a.length}. Allocate ${cap} slots and copy ${a.length} item${a.length === 1 ? "" : "s"}: ${copies} cop${copies === 1 ? "y" : "ies"} so far`, rows: [blank(a, cap)], tones: tonesOf(a.map((_, j) => [`0:${j}`, "muted"])) });
    }
    a.push(x);
    frames.push({ note: `Append ${x} into slot ${a.length - 1}: O(1). Size ${a.length}, capacity ${cap}`, rows: [blank(a, cap)], tones: { ["0:" + (a.length - 1)]: "found" }, marks: [{ i: a.length - 1, label: "end" }] });
  }
  frames.push({ note: `${a.length} appends cost ${a.length} writes plus ${copies} copies. The copies 1 + 2 + 4 + ... add up to less than 2n, so each append is O(1) amortised`, rows: [blank(a, cap)], tones: tonesOf(a.map((_, j) => [`0:${j}`, "done"])) });
  return { kind: "cells", title: `${a.length} appends, ${copies} copies`, rows: [blank([], 1)], frames };
}

/** A hash set with separate chaining: bucket = key mod m, collisions share a chain, lookups scan one chain. */
function chainingViz(keys: number[], m = 5): Diagram {
  const buckets: number[][] = Array.from({ length: m }, () => []), frames: CellsFrame[] = [];
  const rows = () => buckets.map((b) => (b.length ? [...b] : [""]));
  const labels = buckets.map((_, b) => `b${b}`);
  frames.push({ note: `An array of ${m} buckets. A key goes to bucket key mod ${m}; keys that land on the same bucket share a chain`, rows: rows() });
  for (const k of keys) {
    const b = ((k % m) + m) % m;
    if (buckets[b].includes(k)) { frames.push({ note: `${k} mod ${m} = ${b}: it is already in that chain, so a set ignores it`, rows: rows(), tones: { [`${b}:${buckets[b].indexOf(k)}`]: "active" } }); continue; }
    const hit = buckets[b].length > 0;
    buckets[b].push(k);
    const n = buckets.reduce((s, c) => s + c.length, 0);
    frames.push({ note: `${k} mod ${m} = ${b}: ${hit ? "a collision, so append it to that chain" : "an empty bucket"}. Load factor ${n}/${m} = ${(n / m).toFixed(2)}`, rows: rows(), tones: tonesOf([[`${b}:${buckets[b].length - 1}`, hit ? "bad" : "found"]]) });
  }
  const probe = (q: number) => {
    const b = ((q % m) + m) % m, at = buckets[b].indexOf(q);
    const looked = at < 0 ? buckets[b].length : at + 1;
    frames.push({ note: `Look up ${q}: go straight to bucket ${b} and compare against ${looked} key${looked === 1 ? "" : "s"} in that chain: ${at < 0 ? "not found" : "found"}. With chains kept short, this is O(1) on average`, rows: rows(), tones: tonesOf(buckets[b].map((_, j) => [`${b}:${j}`, j === at ? "found" : j < looked ? "window" : "muted"] as [string, Tone])) });
  };
  probe(keys[keys.length - 1]);
  probe(keys[0] + m * 3);
  const n = buckets.reduce((s, c) => s + c.length, 0);
  frames.push({ note: `If the load factor passes about 0.75, a real table doubles its buckets and re-inserts every key (a rehash, O(n)), so chains stay short. Here it is ${(n / m).toFixed(2)}${n / m > 0.75 ? ", so a real table would have doubled to " + 2 * m + " buckets already" : ""}`, rows: rows(), tones: tonesOf(buckets.flatMap((c, b) => c.map((_, j) => [`${b}:${j}`, "done"] as [string, Tone]))) });
  return { kind: "cells", title: `hash set, ${m} buckets`, rowLabels: labels, rows: rows(), frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "An **array** is a block of equal-sized slots stored one after another in memory. Because every slot has the same size, the address of slot `i` is `start + i * size`, so reading or writing any index takes one step. That one property, **random access in O(1)**, is what most array algorithms lean on.",
    "The same layout makes some things expensive. There is no gap between slots, so putting a new item at index `i` means moving every later item one slot right, and removing one means moving them back left. Inserting or deleting near the front is O(n). Searching for a value in an unsorted array is also O(n), since nothing tells you where it is.",
    "A **static array** has its size fixed when it is created (`int a[10]`, `std::array`). A **dynamic array** (`std::vector`, Python `list`, Java `ArrayList`) keeps a block with spare room: a **size** (slots in use) and a **capacity** (slots reserved). When an append finds the block full, it allocates a bigger block, usually twice as large, and copies everything across. Copies happen rarely enough that an append is **O(1) amortised**: the total over n appends is O(n), even though one unlucky append costs O(n).",
    "Contiguous memory is also fast in practice. The CPU loads memory in cache lines of 64 bytes, so walking an array front to back reads many items per memory access. A linked list with the same big O is often several times slower for this reason. A **2D array** `grid[r][c]` is either one flat block in **row-major** order (index `r * C + c`) or an array of row arrays; walking row by row follows memory and is the cache-friendly order.",
    "The **hash map** and **hash set** are the array's constant companion in interviews. Underneath they are an array of **buckets**. A hash function turns a key into a number, and `hash % buckets` picks the slot. Two keys can land in the same bucket, a **collision**, handled by **chaining** (each bucket holds a small list) or **open addressing** (probe the next free slot). The **load factor** is items divided by buckets; once it passes a threshold (0.75 is common) the table doubles and **rehashes**. With a decent hash, insert, lookup and delete are O(1) on average, O(n) in the worst case when everything collides.",
    "Sorting is the other tool that changes what an array can do. A sorted array allows binary search in O(log n), two pointers from both ends, grouping equal values side by side, and greedy choices in order. Comparison sorts cost O(n log n); when the values are small integers, counting sort beats that with O(n + k).",
    "Words an interviewer uses: **index**, **contiguous**, **in place** (O(1) extra memory), **subarray** (contiguous) vs **subsequence** (keeps order, may skip), **amortised**, **capacity**, **stable sort** (equal items keep their order), **load factor**, **collision**, **rehash**, **row-major**.",
  ],
  build: [
    "A dynamic array needs three fields: a pointer to a heap block, the **size** `n` and the **capacity** `cap`. The invariant is that items live in slots `0` to `n - 1`, and `n <= cap`. Reads and writes check `0 <= i < n` and then index the block directly.",
    "**Append** writes into slot `n` and increments `n`. If `n == cap` first, it allocates a block of `2 * cap`, copies the `n` items over and frees the old block. Growing by a constant factor (2, or 1.5 in some libraries) is what gives O(1) amortised; growing by a fixed +10 slots would make n appends cost O(n²).",
    "**Insert at i** grows if needed, then copies from the back: slot `n` gets slot `n - 1`, and so on down to `i + 1`, and finally slot `i` gets the new item. Copying from the back matters, because copying from the front would overwrite items before they move. **Delete at i** does the reverse: copy each later item one slot left, then decrement `n`. To give memory back, shrink to half when the array falls to a quarter full; shrinking at half full would make alternating push and pop at the boundary resize every time.",
    "A hash map with **separate chaining** is an array of buckets, each a list of `(key, value)` pairs, plus a count. `put` hashes the key, folds it into the table with `% buckets`, overwrites the value if the key is already in that chain, and otherwise appends a new pair. `get` and `remove` scan only that one chain. When `count / buckets` passes 0.75, allocate twice as many buckets and re-insert every pair, because each key's bucket depends on the table size.",
    "**Open addressing** keeps the pairs in the array itself. On a collision it probes the next slots (linear probing: `h, h + 1, h + 2, ...`) until it finds the key or an empty slot. Deleting must leave a **tombstone** marker, or later lookups would stop early at the hole. It is more cache-friendly than chaining but degrades faster as the table fills, so it rehashes at a lower load factor.",
  ],
  code: String.raw`class DynamicArray:
    """A growable array: a fixed block of slots plus a count of how many are used."""

    def __init__(self):
        self.cap = 1                 # slots reserved
        self.n = 0                   # slots in use: items live in data[0..n-1]
        self.data = [None] * self.cap

    def _resize(self, cap):
        new = [None] * cap           # allocate a bigger block and copy every item: O(n)
        for i in range(self.n):
            new[i] = self.data[i]
        self.data, self.cap = new, cap

    def get(self, i):
        if not 0 <= i < self.n:
            raise IndexError(i)
        return self.data[i]          # address = start + i * size: O(1)

    def set(self, i, x):
        if not 0 <= i < self.n:
            raise IndexError(i)
        self.data[i] = x

    def append(self, x):
        if self.n == self.cap:
            self._resize(2 * self.cap)   # doubling makes append O(1) amortised
        self.data[self.n] = x
        self.n += 1

    def insert(self, i, x):
        if not 0 <= i <= self.n:
            raise IndexError(i)
        if self.n == self.cap:
            self._resize(2 * self.cap)
        for j in range(self.n, i, -1):   # shift the tail right, from the back
            self.data[j] = self.data[j - 1]
        self.data[i] = x
        self.n += 1

    def pop(self, i=None):
        i = self.n - 1 if i is None else i
        if not 0 <= i < self.n:
            raise IndexError(i)
        x = self.data[i]
        for j in range(i, self.n - 1):   # shift the tail left to close the gap
            self.data[j] = self.data[j + 1]
        self.n -= 1
        self.data[self.n] = None
        if 0 < self.n <= self.cap // 4:  # shrink at a quarter, not a half, so we never thrash
            self._resize(self.cap // 2)
        return x

    def index(self, x):
        for i in range(self.n):          # linear search: O(n)
            if self.data[i] == x:
                return i
        return -1

    def __len__(self):
        return self.n


class HashMap:
    """Separate chaining: an array of buckets, each a list of [key, value] pairs."""

    def __init__(self, cap=8):
        self.buckets = [[] for _ in range(cap)]
        self.size = 0

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]   # hash, then fold into the table

    def put(self, key, value):
        b = self._bucket(key)
        for pair in b:
            if pair[0] == key:
                pair[1] = value          # key already there: overwrite
                return
        b.append([key, value])
        self.size += 1
        if self.size > 0.75 * len(self.buckets):   # load factor above 0.75: double and rehash
            old = self.buckets
            self.buckets = [[] for _ in range(2 * len(old))]
            for chain in old:
                for k, v in chain:
                    self._bucket(k).append([k, v])

    def get(self, key, default=None):
        for k, v in self._bucket(key):
            if k == key:
                return v
        return default

    def remove(self, key):
        b = self._bucket(key)
        for j, (k, _) in enumerate(b):
            if k == key:
                b.pop(j)
                self.size -= 1
                return True
        return False

    def __contains__(self, key):
        return any(k == key for k, _ in self._bucket(key))`,
  ops: [
    {
      title: "Static and dynamic array (n items)",
      rows: [
        ["Access a[i]", "O(1)", "O(1)", "address is start + i * size, no walking"],
        ["Update a[i] = x", "O(1)", "O(1)", "same address arithmetic"],
        ["Search unsorted (linear scan)", "O(n)", "O(n)", "nothing says where the value is, so check each slot"],
        ["Search sorted (binary search)", "O(log n)", "O(log n)", "halves the candidate range every step"],
        ["Append at the end", "O(1) amortised", "O(n)", "the rare full append copies the block into one twice as big"],
        ["Append with reserve(n) done first", "O(1)", "O(1)", "capacity is already there, no copy ever happens"],
        ["Insert at the front", "O(n)", "O(n)", "shifts every item one slot right"],
        ["Insert at index i", "O(n - i)", "O(n)", "shifts every later item one slot right"],
        ["Delete at the end (pop)", "O(1)", "O(1)", "just decrement the size; a shrink is amortised away"],
        ["Delete at the front", "O(n)", "O(n)", "shifts every item one slot left"],
        ["Delete at index i", "O(n - i)", "O(n)", "shifts every later item left over the gap"],
        ["Delete by value", "O(n)", "O(n)", "find it (scan), then shift the rest"],
        ["Delete without keeping order", "O(1)", "O(1)", "swap with the last item, then pop"],
        ["Build from n items", "O(n)", "O(n)", "one write per item"],
        ["Resize / copy the whole array", "O(n)", "O(n)", "every item is copied to the new block"],
        ["Traverse all items", "O(n)", "O(n)", "sequential, so very cache-friendly"],
        ["Reverse in place", "O(n)", "O(n)", "swap a[i] and a[n - 1 - i] up to the middle"],
        ["Slice / copy a range of k items", "O(k)", "O(k)", "a new array is made; in Python a[l:r] copies"],
        ["Concatenate two arrays", "O(n + m)", "O(n + m)", "both are copied into a new block"],
        ["Min, max or sum", "O(n)", "O(n)", "one pass; O(1) only if you keep it updated"],
        ["Range sum with prefix sums", "O(1) query", "O(1) query", "after an O(n) build of the prefix array"],
      ],
    },
    {
      title: "Sorting and order",
      rows: [
        ["Library sort (introsort, Timsort)", "O(n log n)", "O(n log n)", "Timsort is stable and O(n) on already sorted input"],
        ["Quicksort", "O(n log n)", "O(n²)", "bad pivots on sorted input; random pivots avoid it"],
        ["Merge sort", "O(n log n)", "O(n log n)", "stable, needs O(n) extra memory"],
        ["Heap sort", "O(n log n)", "O(n log n)", "in place, not stable"],
        ["Insertion sort", "O(n²)", "O(n²)", "O(n) when nearly sorted; used for tiny ranges inside library sorts"],
        ["Counting sort (values 0 to k)", "O(n + k)", "O(n + k)", "no comparisons; needs a small value range"],
        ["Radix sort (d digits, base b)", "O(d (n + b))", "O(d (n + b))", "a stable counting sort per digit"],
        ["Kth smallest (quickselect)", "O(n)", "O(n²)", "partitions and recurses into one side only"],
        ["Top k with a heap of size k", "O(n log k)", "O(n log k)", "keeps only k candidates"],
        ["Merge two sorted arrays", "O(n + m)", "O(n + m)", "two pointers, take the smaller head"],
        ["Check if sorted", "O(n)", "O(n)", "compare each neighbouring pair"],
        ["Shuffle (Fisher-Yates)", "O(n)", "O(n)", "swap a[i] with a random index from 0 to i"],
      ],
    },
    {
      title: "Hash map and hash set (n keys)",
      rows: [
        ["Insert / put", "O(1)", "O(n)", "worst case when every key lands in one bucket"],
        ["Lookup / contains", "O(1)", "O(n)", "scans one bucket's chain"],
        ["Delete", "O(1)", "O(n)", "find in the chain, unlink it"],
        ["Rehash (grow the table)", "O(n)", "O(n)", "every key moves; amortised O(1) per insert"],
        ["Build from n keys", "O(n)", "O(n²)", "n inserts"],
        ["Iterate all keys", "O(n + buckets)", "O(n + buckets)", "order is not sorted and can change on rehash"],
        ["Hash a string key of length L", "O(L)", "O(L)", "every character goes into the hash"],
        ["Count frequencies of n items", "O(n)", "O(n)", "one increment per item"],
        ["Ordered map (balanced BST) insert, find, delete", "O(log n)", "O(log n)", "std::map; keeps keys sorted"],
        ["Ordered map floor / ceiling / next key", "O(log n)", "O(log n)", "lower_bound; a hash map cannot do this"],
      ],
    },
    {
      title: "2D array (R rows, C columns)",
      rows: [
        ["Access grid[r][c]", "O(1)", "O(1)", "flat index r * C + c in row-major order"],
        ["Traverse every cell", "O(R C)", "O(R C)", "row by row follows memory; column by column jumps"],
        ["Copy or transpose", "O(R C)", "O(R C)", "each cell is written once"],
        ["Insert a row in the middle", "O(R)", "O(R C)", "O(R) for a vector of row vectors (moves row handles), O(R C) for one flat block"],
        ["Build 2D prefix sums", "O(R C)", "O(R C)", "then any rectangle sum is O(1)"],
        ["Search a row-and-column sorted matrix", "O(R + C)", "O(R + C)", "start top right, drop a row or a column each step"],
      ],
    },
  ],
  builtins: [
    ["Dynamic array", "`vector<int> v;`", "`a = []` (list)"],
    ["Fixed-size array", "`array<int, N>` or `int a[N]`", "`[0] * n`"],
    ["Append / remove last", "`v.push_back(x)` / `v.pop_back()`", "`a.append(x)` / `a.pop()`"],
    ["Insert / erase at a position", "`v.insert(v.begin() + i, x)` / `v.erase(v.begin() + i)`", "`a.insert(i, x)` / `del a[i]`"],
    ["Reserve capacity", "`v.reserve(n)`", "preallocate with `[0] * n`"],
    ["2D grid", "`vector<vector<int>> g(R, vector<int>(C))`", "`[[0] * C for _ in range(R)]`"],
    ["Sort, stable sort, custom order", "`sort`, `stable_sort`, a lambda comparator", "`a.sort()`, `sorted(a, key=...)` (always stable)"],
    ["Binary search", "`lower_bound`, `upper_bound`, `binary_search`", "`bisect.bisect_left`, `bisect.bisect_right`"],
    ["Kth element / partial sort", "`nth_element`, `partial_sort`", "`heapq.nsmallest(k, a)`"],
    ["Reverse, rotate", "`reverse`, `rotate`", "`a.reverse()`, `a[k:] + a[:k]`"],
    ["Sum, min, max, prefix sums", "`accumulate`, `min_element`, `max_element`, `partial_sum`", "`sum`, `min`, `max`, `itertools.accumulate`"],
    ["Remove duplicates", "`sort`, then `v.erase(unique(...), v.end())`", "`list(dict.fromkeys(a))` keeps order"],
    ["Hash map", "`unordered_map<K, V>`", "`dict`, `collections.defaultdict`"],
    ["Frequency count", "`unordered_map<int, int> cnt; cnt[x]++`", "`collections.Counter(a)`"],
    ["Hash set", "`unordered_set<T>`", "`set()`"],
    ["Ordered map / set / multiset", "`map`, `set`, `multiset`", "none built in: sort plus `bisect`"],
  ],
  when: [
    "You need the item at a given position, or the input is already indexed 0 to n - 1: an array gives O(1) access.",
    "\"Have we seen this before?\", \"count how many times\", \"find the pair that sums to k\": a hash set or hash map turns an O(n²) double loop into one pass.",
    "Values are bounded small integers (letters, digits, 1 to n): a plain count array of that size beats a hash map.",
    "The question says \"sorted\", or the order of items does not matter: sort first, then use binary search or two pointers.",
    "\"In place\" or \"O(1) extra space\": rearrange inside the array with swaps and a write index.",
    "Many range queries on data that does not change: build prefix sums once.",
    "The data is a grid, board or image: a 2D array indexed `grid[r][c]`.",
  ],
  avoid: [
    "Many inserts and deletes in the middle or at the front: use a deque for both ends, or a linked list when you hold the node already.",
    "You need the smallest or largest item again and again while items change: a heap gives O(log n) per update instead of re-sorting.",
    "You need keys in sorted order, or the next larger key: an ordered map (`std::map`) or a sorted list with bisect, not a hash map.",
    "Range sums while values keep changing: a Fenwick or segment tree, since prefix sums must be rebuilt after each update.",
    "Untrusted keys that an attacker can choose: a hash map can be forced into O(n) per operation; an ordered map is O(log n) no matter what.",
  ],
  tips: [
    "Say the brute force and its cost first, then name the structure that removes the inner loop (usually a hash map or a sort).",
    "Off-by-one: decide whether ranges are `[l, r]` or `[l, r)` and stick to it. Loops to `n - 1` with `a[i + 1]` must stop at `n - 2`.",
    "Removing from a list while looping over it skips items. Loop backwards, or build a new list, or use a write index.",
    "In Python, `[[0] * C] * R` makes R references to the same row; use a comprehension. Slicing `a[l:r]` copies, so slicing inside a loop is O(n) each time.",
    "In C++, `unordered_map` `operator[]` inserts a default value when the key is missing; use `find` or `count` to only check.",
    "Sum of large values or products of indices can overflow 32 bits; use `long long` in C++ before multiplying.",
    "A hash map's average O(1) assumes a good hash. Say \"O(1) on average, O(n) worst case\" when asked, and know that `std::map` is O(log n) worst case.",
    "Counting sort, a count array of 26 letters, or a bitmask often replaces a hash map and is both faster and simpler.",
  ],
  viz: [
    { name: "Insert in the middle", make: (i) => { const v = nums(i, [3, 8, 1, 6, 4, 7], 9); return insertViz(v.length >= 4 ? v : [3, 8, 1, 6, 4, 7]); }, input: "3, 8, 1, 6, 4, 7", label: "numbers (at least 4); 9 goes in the middle" },
    { name: "Dynamic array doubling", make: (i) => { const v = nums(i, [5, 2, 8, 1, 9, 4, 7, 3, 6], 12); return doublingViz(v.length >= 3 ? v : [5, 2, 8, 1, 9, 4, 7, 3, 6]); }, input: "5, 2, 8, 1, 9, 4, 7, 3, 6", label: "values to append" },
    { name: "Hash set with chaining", make: (i) => { const v = nums(i, [12, 7, 3, 17, 25, 8, 22], 9).map(Math.round); return chainingViz(v.length >= 3 ? v : [12, 7, 3, 17, 25, 8, 22]); }, input: "12, 7, 3, 17, 25, 8, 22", label: "keys to insert (5 buckets)" },
  ],
};

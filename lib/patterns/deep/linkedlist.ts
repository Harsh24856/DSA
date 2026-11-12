// Deeper theory for the "linkedlist" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import { nums, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "The middle: after t steps slow has moved t nodes and fast 2t. Fast stops when it has no two steps left, which happens when 2t is about n, so slow sits at about n / 2. The loop condition decides which middle you get on even lengths: `while fast and fast.next` stops slow on the second middle, `while fast.next and fast.next.next` on the first.",
    "Cycle detection: once both pointers are inside the cycle, the gap between them (measured along the direction of travel) shrinks by exactly one node per step, because fast moves two and slow moves one. A gap that shrinks by one must hit zero, so they meet within one lap of the cycle. Without a cycle, fast reaches the end first.",
    "Finding the entry. Let a be the distance from head to the entry, and c the cycle length. When they meet, slow has walked a + b for some b inside the cycle, and fast has walked twice that, which is a + b plus some whole number of laps k c. So a + b = k c, which means a = k c - b. Walking a more steps from the meeting point lands exactly on the entry, and so does walking a steps from head. Move one pointer to head, step both by one, and they meet at the entry.",
    "Recognise the pattern by questions about position (middle, kth from the end), cycles, or anything modelled as 'follow next pointers'. Find the Duplicate Number and Happy Number have no list at all: values are read as next pointers (i to nums[i], or n to the sum of its squared digits), and the repeat is a cycle entry.",
    "Complexity: O(n) time, O(1) space. A hash set of visited nodes is the obvious alternative with O(n) space; mention it, then improve. For kth from the end, the gap version (fast goes k ahead) is also one pass and O(1).",
    "Edge cases: empty list, one node, a node that points to itself, and even versus odd lengths. Compare node identity, not values, since lists often hold duplicates. Restarting the wrong pointer, or stepping both before the comparison, gives an entry that is off by one.",
  ],
  2: [
    "The invariant of the loop: prev is the head of the already reversed part, curr is the head of the part not yet touched, and the two parts are disconnected. Each step moves one node from the front of the untouched part to the front of the reversed part. When curr is null, everything has moved and prev is the new head.",
    "Order matters because curr.next is the only link to the rest of the list. Save it in nxt first, then overwrite curr.next, then advance. Every reversal bug is a version of losing that pointer.",
    "Reversing a sublist from position m to n uses the same loop for n - m + 1 steps, plus two saved pointers: the node before the sublist (to reattach the new front) and the first node of the sublist (which becomes its tail and must point to the node after the sublist). A dummy head node makes m = 1 behave like every other case.",
    "Reverse Nodes in k-Group repeats the sublist reversal on consecutive blocks, but first checks that k nodes remain; a short final block stays as it is. Swap Nodes in Pairs is k = 2. The recursive version (reverse the rest, then hook the current node at the end) is elegant but uses O(n) stack.",
    "Complexity: each node's next pointer is written once, so O(n) time, and O(1) extra space for the iterative version.",
    "Reversal is a building block: palindrome check (reverse the second half), reorder list (reverse and weave), adding numbers stored most significant digit first (reverse, add, reverse back), and Double a Number. When a problem gets complicated, look for a reversal that turns it into a forward walk.",
  ],
  3: [
    "Merging two sorted lists keeps one invariant: everything already attached behind the dummy is sorted and is no larger than both current heads. Attaching the smaller head keeps it true. When one list runs out, the rest of the other is already sorted and no smaller than what is attached, so one link finishes the job.",
    "The dummy node removes the special case for the first node: the tail always has a valid node to attach to. dummy.next is the answer.",
    "Merge sort on a list is natural because it needs only sequential access. Split with fast and slow pointers, cut the link at the middle, sort both halves recursively, and merge. It is O(n log n) time; the recursion depth is log n, so O(log n) stack, and a bottom-up version that merges runs of size 1, 2, 4, ... reaches O(1) extra space.",
    "Merge k sorted lists has three standard answers: merge one by one (O(N x k), too slow), pairwise merging like the levels of merge sort (O(N log k)), or a min-heap of the k heads (O(N log k)). Both fast versions are fine; the heap is the K-way merge pattern in the Heaps topic.",
    "Partition List (all values below x before the rest, keeping order) is a cousin: build two lists behind two dummies, then join them. Remember to terminate the second list, or the old next pointer of its last node creates a cycle.",
    "Edge cases: either list empty, lists of very different lengths, equal values (use <= so the merge is stable), and forgetting to cut the list at the middle before recursing, which recurses forever.",
  ],
  4: [
    "Restructuring problems are compositions. Reorder List is three moves: find the middle (fast and slow), reverse the second half, then weave the two halves. Palindrome Linked List is middle, reverse, compare. Seeing the decomposition is the whole skill; each move is a pattern you already know.",
    "The weave step is correct because after the cut there are two separate lists, the first one at least as long as the second. Each round takes one node from each and links first to second to the old first.next. It stops when the second list is exhausted, and the first list's remaining node (for odd lengths) is already in place.",
    "Rotate List by k: find the length n and the tail in one pass, connect the tail to the head to make a ring, then walk n - k % n steps and cut. k can be much larger than n, so reduce it first.",
    "Odd Even Linked List keeps two chains (odd positions, even positions) and links the end of the odd chain to the head of the even chain. The loop condition `even and even.next` covers both parities.",
    "Complexity: each sub-step is O(n), so the whole thing is O(n) time and O(1) extra space, which is the reason to restructure in place instead of copying values into an array (O(n) space, but often an acceptable first answer).",
    "Edge cases: lists of length 0, 1 and 2, and the cut between halves. A missing cut creates a cycle, which usually shows up as an infinite loop or a time limit. If the caller still needs the list after a palindrome check, reverse the second half back.",
  ],
  5: [
    "Single pass modification relies on one rule: only advance past a node once it is final. In Remove Duplicates, after splicing out curr.next, the new curr.next might also be a duplicate, so curr stays put. Moving on too early leaves the third copy of a value in place.",
    "Remove Duplicates II (delete every value that repeats) needs a dummy and a 'prev' pointer to the last node known to stay. Skip the whole run of a repeated value, then link prev to the first node after it.",
    "Add Two Numbers walks both lists in lockstep with a carry. It is correct for the same reason column addition is: each output digit depends only on the two input digits and the carry from the right, and digits are stored least significant first. Keep looping while either list or the carry remains.",
    "Copy List with Random Pointer has two answers. A hash map from old node to new node makes the second pass easy, O(n) space. The interleaving trick inserts each copy right after its original, so copy.random = original.random.next, then separates the two lists, O(1) extra space.",
    "Complexity is O(n) time for all of these. LRU Cache combines a hash map with a doubly linked list; it is its own pattern below.",
    "Edge cases: an empty list, a list where every value is the same, a final carry (99 + 1), and random pointers that point to null or to the node itself. Always ask whether the head can be removed; if yes, start with a dummy.",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

function lruViz(cap: number): Diagram {
  const ops: [string, number, number?][] = [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4]];
  const order: [number, number][] = [], frames: CellsFrame[] = [];
  const rows = () => [order.map(([k, v]) => `${k}:${v}`), order.map(([k]) => k).sort((a, b) => a - b)];
  frames.push({ note: `Capacity ${cap}. The list holds key:value from most recent (left) to least recent (right); the map points to each key's node.`, rows: rows() });
  for (const [op, k, v] of ops) {
    const at = order.findIndex(([x]) => x === k);
    if (op === "get") {
      if (at < 0) { frames.push({ note: `get(${k}): not in the map, return -1. Nothing moves.`, rows: rows() }); continue; }
      const [node] = order.splice(at, 1);
      order.unshift(node);
      frames.push({ note: `get(${k}) = ${node[1]}: the map finds the node in O(1); unlink it and move it to the front.`, rows: rows(), tones: { "0:0": "found" } });
      continue;
    }
    if (at >= 0) order.splice(at, 1);
    order.unshift([k, v!]);
    let note = `put(${k}, ${v}): ${at >= 0 ? "update the node and move it" : "new node"} to the front.`;
    if (order.length > cap) {
      const [old] = order.pop()!;
      note += ` Size ${cap + 1} > ${cap}: evict the back (key ${old}) from the list and the map.`;
    }
    frames.push({ note, rows: rows(), tones: { "0:0": "active" } });
  }
  frames.push({ note: "Every get and put touched a constant number of pointers and one map entry: O(1) each.", rows: rows(), tones: Object.fromEntries(order.map((_, i) => [`0:${i}`, "done" as Tone])) });
  return { kind: "cells", title: `LRU cache with capacity ${cap}: hash map + doubly linked list`, rowLabels: ["list", "map"], rows: [[], []], frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 6, name: "LRU cache (hash map + doubly linked list)", summary: "A hash map finds a key's node in O(1); a doubly linked list keeps nodes in recency order and can unlink any node in O(1). Together every get and put is O(1).",
    signals: ["design an LRU (least recently used) cache", "O(1) get and put with eviction by recency", "move an item to the front when touched", "design structures mixing lookup and order (LFU, max frequency stack)"],
    idea: ["Keep the list ordered from most recent (just after the head sentinel) to least recent (just before the tail sentinel). The map stores key to node.", "get moves the node to the front. put inserts or updates at the front, then evicts the node before the tail if the size went over capacity. Removing from the middle is O(1) only because the list is doubly linked: the node knows its prev."],
    steps: ["sentinels head and tail; map = {}", "get(k): missing → -1; else unlink the node, push it to the front, return its value", "put(k, v): unlink any old node, push a new node to the front, map[k] = node", "if len(map) > cap: unlink tail.prev and delete its key from the map"],
    code: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val, self.prev, self.next = key, val, None, None

class LRUCache:
    def __init__(self, capacity):
        self.cap, self.map = capacity, {}
        self.head, self.tail = Node(), Node()   # sentinels: head.next is newest, tail.prev is oldest
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
        self._unlink(node)            # every read refreshes recency
        self._push_front(node)
        return node.val
    def put(self, key, val):
        if key in self.map:
            self._unlink(self.map[key])
        node = self.map[key] = Node(key, val)
        self._push_front(node)
        if len(self.map) > self.cap:
            old = self.tail.prev      # least recently used
            self._unlink(old)
            del self.map[old.key]`,
    complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(capacity)", note: "Per get or put, with average O(1) hashing. One map entry and one list node per key." },
    traps: ["Store the key inside the node: on eviction you only have the node and must delete its key from the map.", "A get also counts as a use; forgetting to move the node on get gives the wrong eviction.", "Sentinel head and tail nodes remove every 'empty list' and 'first node' special case."],
    viz: { make: (i) => { const [c] = nums(i, [2], 1); return lruViz(Math.max(1, Math.min(4, Math.round(c)))); }, input: "2", label: "capacity (1 to 4)" },
    theory: [
      "Why two structures: a hash map alone gives O(1) lookup but no order, and a list alone gives order but O(n) lookup. Each fixes the other's weakness. The map stores pointers into the list, so a lookup lands directly on the node, and the list's prev and next pointers let that node be moved in O(1).",
      "The invariant is that the list order equals recency order, and the map and the list always hold the same set of keys. get and put each preserve it: the touched key moves to the front, every other key keeps its relative order, and eviction removes the same key from both structures.",
      "Why doubly linked: unlinking a node from a singly linked list needs its predecessor, which takes O(n) to find. With prev pointers the node can splice itself out: node.prev.next = node.next and node.next.prev = node.prev. In C++, std::list is a doubly linked list and splice moves a node to the front without invalidating iterators, so the map can store iterators.",
      "Many languages ship this structure: Python's OrderedDict (move_to_end and popitem(last=False)) and Java's LinkedHashMap with access order. Mention them, but interviewers usually want the hand-built version because it shows the pointer work.",
      "Related designs reuse the idea of 'hash map into a linked structure'. LFU cache keeps one recency list per frequency plus a pointer to the minimum frequency. Maximum Frequency Stack keeps a stack per frequency. Copy List with Random Pointer maps old nodes to new nodes. All of them trade memory for O(1) access to a position inside an ordered structure.",
      "Edge cases: capacity 1, put on an existing key (update the value and refresh recency, do not grow the size), get on a missing key, and the same key put many times. A common bug is evicting before inserting, which can evict the key that is being updated.",
    ],
  },
];

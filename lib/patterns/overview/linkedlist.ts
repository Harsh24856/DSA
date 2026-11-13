// Overview of the "linkedlist" topic: the data structure or technique itself. Shown on /patterns/linkedlist before the patterns.
import type { Diagram, ListFrame, Mark, Tone } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

/** A chain over node slots 0..n-1: order[k] points at order[k + 1]; slots not in order point nowhere. */
const chain = (n: number, order: number[]) => { const nx = Array(n).fill(-1); order.forEach((x, k) => (nx[x] = k + 1 < order.length ? order[k + 1] : -1)); return nx; };
const tonesOf = (pairs: [number, Tone][]) => Object.fromEntries(pairs) as Record<number, Tone>;

/** Access and search: the only way to node k is to follow k next pointers from the head. */
function walk(input?: string): Diagram {
  const all = nums(input, [7, 2, 9, 4, 6, 4], 9), target = all.length > 1 ? all[all.length - 1] : all[0], vals = all.length > 1 ? all.slice(0, -1) : all;
  const n = vals.length, next = chain(n, vals.map((_, i) => i)), frames: ListFrame[] = [];
  frames.push({ note: `Find ${target}. There is no address arithmetic: the head is the only node you can reach directly, so start there with i = 0`, next, ptrs: [{ i: 0, label: "head cur" }] });
  let cur = 0, i = 0;
  while (cur !== -1) {
    if (vals[cur] === target) {
      frames.push({ note: `cur.val = ${vals[cur]} matches: found at index ${i} after following ${i} pointer${i === 1 ? "" : "s"}. Access and search are O(n) in the worst case`, next, ptrs: [{ i: cur, label: "cur" }], tones: tonesOf([...vals.slice(0, cur).map((_, k): [number, Tone] => [k, "muted"]), [cur, "found"]]) });
      break;
    }
    frames.push({ note: `cur.val = ${vals[cur]} is not ${target}: follow cur = cur.next${next[cur] === -1 ? ", which is null" : ""} (i = ${i + 1})`, next, ptrs: [{ i: cur, label: "cur" }], tones: tonesOf([...vals.slice(0, cur).map((_, k): [number, Tone] => [k, "muted"]), [cur, "active"]]) });
    cur = next[cur]; i++;
  }
  if (cur === -1) frames.push({ note: `cur is null: ${target} is not in the list. All ${n} nodes were visited, O(n)`, next, ptrs: [], tones: tonesOf(vals.map((_, k): [number, Tone] => [k, "muted"])) });
  frames.push({ note: "An array would reach index k in O(1) because element k sits at base + k * size. A list pays for its cheap inserts with this walk", next, ptrs: [{ i: 0, label: "head" }] });
  return { kind: "list", title: `Walk from the head to find ${target}`, values: vals, frames };
}

/** Insert and delete on a singly list: every change is one or two pointer writes once you stand on the node before. */
function insertDelete(): Diagram {
  const vals = [1, 3, 4, 2, 0], next = chain(5, [0, 1, 2]), frames: ListFrame[] = [];
  let head = 0, tail = 2;
  const live = new Set([0, 1, 2]);
  const snap = (note: string, ptrs: Mark[], hot: [number, Tone][] = []) => frames.push({ note, next: [...next], ptrs, tones: tonesOf([...vals.map((_, k): [number, Tone] => [k, live.has(k) ? "done" : "muted"]).filter(([, t]) => t === "muted"), ...hot]) });
  snap("The list 1 → 3 → 4 with head and tail pointers. Nodes 2 and 0 are new nodes, not linked yet", [{ i: head, label: "head" }, { i: tail, label: "tail" }]);
  // insert 2 at index 1: stand on the node before it
  let prev = head;
  snap("Insert 2 at index 1: walk to the node BEFORE that position (index 0, value 1)", [{ i: prev, label: "prev" }], [[prev, "active"]]);
  next[3] = next[prev]; live.add(3);
  snap("Step 1: new.next = prev.next, so the new node already points at 3. Nothing is lost yet", [{ i: prev, label: "prev" }, { i: 3, label: "new" }], [[3, "active"]]);
  next[prev] = 3;
  snap("Step 2: prev.next = new. Two pointer writes, no shifting: 1 → 2 → 3 → 4", [{ i: head, label: "head" }, { i: tail, label: "tail" }], [[3, "found"]]);
  // push front 0
  next[4] = head; live.add(4);
  snap("Push 0 at the front: new.next = head", [{ i: 4, label: "new" }, { i: head, label: "head" }], [[4, "active"]]);
  head = 4;
  snap("Then head = new. O(1) at the front, where an array would shift every element", [{ i: head, label: "head" }, { i: tail, label: "tail" }], [[4, "found"]]);
  // delete the tail (4): needs the node before it
  prev = head; const steps: number[] = [vals[head]];
  while (next[next[prev]] !== -1) { prev = next[prev]; steps.push(vals[prev]); }
  snap(`Delete the tail 4: a singly list cannot step back, so walk ${steps.join(" → ")} to the node before it. O(n)`, [{ i: prev, label: "prev" }, { i: tail, label: "tail" }], [[prev, "active"], [tail, "bad"]]);
  const gone = next[prev]; next[prev] = next[gone]; live.delete(gone); tail = prev;
  snap("prev.next = prev.next.next unlinks it, and tail = prev. A doubly list would have had prev in O(1)", [{ i: head, label: "head" }, { i: tail, label: "tail" }], [[gone, "muted"]]);
  return { kind: "list", title: "Insert and delete by rewiring pointers", values: vals, frames };
}

/** A sentinel (dummy) node in front of the head: deleting the head is no longer a special case. */
function sentinel(input?: string): Diagram {
  const all = nums(input, [6, 1, 6, 2, 6, 6], 8), val = all.length > 1 ? all[all.length - 1] : all[0], body = all.length > 1 ? all.slice(0, -1) : all;
  const vals: (string | number)[] = ["D", ...body], n = vals.length, next = chain(n, vals.map((_, i) => i)), frames: ListFrame[] = [], gone = new Set<number>();
  const tones = (cur: number, extra: [number, Tone][] = []) => tonesOf([[0, "muted"], ...[...gone].map((g): [number, Tone] => [g, "muted"]), [cur, "active"], ...extra]);
  frames.push({ note: `Remove every ${val}. Put a dummy node D before the head, so every real node, the head included, has a node before it`, next: [...next], ptrs: [{ i: 0, label: "cur" }], tones: tones(0) });
  let cur = 0;
  while (next[cur] !== -1) {
    const nx = next[cur];
    if (vals[nx] === val) {
      next[cur] = next[nx]; next[nx] = -1; gone.add(nx);
      frames.push({ note: `cur.next is ${val}: cur.next = cur.next.next. cur stays, because the new next may also be ${val}${cur === 0 ? ". This removed the old head with no special case" : ""}`, next: [...next], ptrs: [{ i: cur, label: "cur" }], tones: tones(cur, [[nx, "bad"]]) });
    } else {
      cur = nx;
      frames.push({ note: `cur.next is ${vals[nx]}, keep it: cur = cur.next`, next: [...next], ptrs: [{ i: cur, label: "cur" }], tones: tones(cur) });
    }
  }
  const head = next[0];
  frames.push({ note: head === -1 ? "Every node was removed: dummy.next is null, the empty list" : `cur.next is null: done. Return dummy.next, the real head (${vals[head]})`, next: [...next], ptrs: head === -1 ? [{ i: 0, label: "dummy" }] : [{ i: 0, label: "dummy" }, { i: head, label: "head" }], tones: tonesOf([[0, "muted"], ...[...gone].map((g): [number, Tone] => [g, "muted"])]) });
  return { kind: "list", title: `Remove every ${val} with a dummy node`, values: vals, frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A linked list stores a sequence as separate **nodes**. Each node holds a value and a pointer to the next node, and the list itself is just a pointer to the first node, the **head**. The last node points at null, which marks the end.",
    "The nodes are allocated one by one, so they can sit anywhere in memory. That is the whole trade. Nothing has to move when you insert or delete: you rewrite one or two pointers. But nothing can be found by arithmetic either: to reach the node at index k you start at the head and follow k pointers, O(k). Scattered nodes also miss the CPU cache, so even a full scan is several times slower than scanning an array of the same length.",
    "Variants. A **singly linked** list has only `next`, so you can only walk forward, and deleting a node needs the node before it. A **doubly linked** list adds `prev`: either neighbour is one step away, so removing a node you hold is O(1), at the cost of one more pointer per node. A **circular** list links the tail back to the head, which suits round-robin turns and rotations; with a doubly circular list around one sentinel, the list never contains a null at all.",
    "A **sentinel** or **dummy** node is a node that holds no data and sits before the head (and in a doubly list, often after the tail as well). Every real node then has a predecessor, so inserting or deleting at the front is the same code as anywhere else. Interview solutions that build or edit a list almost always start with `dummy = ListNode(0, head)` and return `dummy.next`.",
    "Compared with an array: arrays win at access by index (O(1) against O(n)), at memory (no pointer per element) and at cache behaviour. Lists win when you already hold the position: insert or delete there is O(1), where an array shifts every later element. They also never resize, and they can **splice**, moving a whole run of nodes into another list in O(1).",
    "Vocabulary an interviewer uses: head, tail, node, next and prev pointers, null terminator, dummy or sentinel node, in place (rewire the existing nodes, O(1) extra space), traversal, fast and slow (runner) pointers, cycle, splice, and \"you are given only the node\" (no access to the head).",
  ],
  build: [
    "Fields: a `Node` with `val` and `next` (plus `prev` for doubly linked). The list keeps a `dummy` node, a `tail` pointer so appending is O(1), and a `size` so length is O(1). The invariants: following `next` from `dummy` visits exactly `size` nodes and ends at null, and `tail` is the last of them (or `dummy` when the list is empty).",
    "Insert at position i: walk to the node **before** i (with a dummy, that walk starts at the dummy and takes i steps). Set `new.next = prev.next` first, then `prev.next = new`. The order matters: the other way round loses the rest of the list. If `prev` was the tail, the new node becomes the tail.",
    "Delete at position i: walk to the node before it and set `prev.next = prev.next.next`. If the removed node was the tail, the tail moves back to `prev`. In C++ free the node (`delete`), in Python the garbage collector does it once nothing points at it.",
    "Reverse in place: walk once with `prev`, `cur` and a saved `nxt`, pointing each `cur.next` back at `prev`. When `cur` falls off the end, `prev` is the new head and the old head is the new tail.",
    "Doubly linked with one circular sentinel: an empty list is a sentinel whose `prev` and `next` point at itself. Inserting `new` after `node` writes four pointers (`new.prev`, `new.next`, `node.next.prev`, `node.next`); removing a node writes two (`node.prev.next` and `node.next.prev`). Front and back are `s.next` and `s.prev`, so both ends are O(1) and no line ever checks for null. This is the structure inside an LRU cache.",
  ],
  code: `class Node:
    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt

class LinkedList:
    """Singly linked list with a sentinel (dummy) head and a tail pointer."""
    def __init__(self):
        self.dummy = Node(None)   # never holds data; dummy.next is the real head
        self.tail = self.dummy    # last node, so append is O(1)
        self.size = 0

    def _before(self, i):         # node just before position i, O(i)
        cur = self.dummy
        for _ in range(i):
            cur = cur.next
        return cur

    def get(self, i):
        if not 0 <= i < self.size:
            raise IndexError(i)
        return self._before(i).next.val

    def insert(self, i, val):     # 0 <= i <= size; i = 0 is push_front, i = size is append
        if not 0 <= i <= self.size:
            raise IndexError(i)
        prev = self.tail if i == self.size else self._before(i)
        prev.next = Node(val, prev.next)   # new node points on first, then prev points at it
        if prev is self.tail:
            self.tail = prev.next
        self.size += 1

    def push_front(self, val): self.insert(0, val)
    def append(self, val): self.insert(self.size, val)

    def erase(self, i):           # remove position i and return its value
        if not 0 <= i < self.size:
            raise IndexError(i)
        prev = self._before(i)
        gone = prev.next
        prev.next = gone.next     # unlink: nothing points at gone any more
        if gone is self.tail:
            self.tail = prev
        self.size -= 1
        return gone.val

    def find(self, val):          # index of the first match, or -1
        cur, i = self.dummy.next, 0
        while cur:
            if cur.val == val:
                return i
            cur, i = cur.next, i + 1
        return -1

    def reverse(self):            # flip every next pointer in place, O(n) time, O(1) space
        prev, cur = None, self.dummy.next
        self.tail = cur or self.dummy
        while cur:
            cur.next, prev, cur = prev, cur, cur.next
        self.dummy.next = prev

    def to_list(self):
        out, cur = [], self.dummy.next
        while cur:
            out.append(cur.val)
            cur = cur.next
        return out


class DNode:
    def __init__(self, val):
        self.val, self.prev, self.next = val, None, None

class DoublyLinkedList:
    """Circular doubly linked list around one sentinel: no None checks anywhere."""
    def __init__(self):
        self.s = DNode(None)
        self.s.prev = self.s.next = self.s   # empty list: the sentinel points at itself

    def insert_after(self, node, val):       # O(1) once you hold the node
        new = DNode(val)
        new.prev, new.next = node, node.next
        node.next.prev = new
        node.next = new
        return new

    def push_front(self, val): return self.insert_after(self.s, val)
    def push_back(self, val): return self.insert_after(self.s.prev, val)

    def remove(self, node):                  # O(1): both neighbours are one step away
        node.prev.next = node.next
        node.next.prev = node.prev
        return node.val

    def pop_front(self): return self.remove(self.s.next) if self.s.next is not self.s else None
    def pop_back(self): return self.remove(self.s.prev) if self.s.prev is not self.s else None

    def to_list(self):
        out, cur = [], self.s.next
        while cur is not self.s:
            out.append(cur.val)
            cur = cur.next
        return out`,
  ops: [
    {
      title: "Singly linked list (with head, tail and size)",
      rows: [
        ["Access by index k", "O(n)", "O(n)", "Follow k next pointers from the head; there is no address arithmetic"],
        ["Search by value", "O(n)", "O(n)", "Visit nodes one by one; a sorted list does not help, binary search needs random access"],
        ["Insert at the head", "O(1)", "O(1)", "new.next = head, head = new"],
        ["Insert at the tail", "O(1)", "O(1)", "Needs the tail pointer; without it, walking to the end is O(n)"],
        ["Insert after a node you hold", "O(1)", "O(1)", "Two pointer writes, nothing shifts"],
        ["Insert at index k", "O(n)", "O(n)", "The walk to the node before k costs O(k); the rewiring is O(1)"],
        ["Delete the head", "O(1)", "O(1)", "head = head.next"],
        ["Delete the tail", "O(n)", "O(n)", "You need the node before the tail, and only a walk from the head finds it"],
        ["Delete a node you hold", "O(n)", "O(n)", "Its predecessor must be found. If it is not the tail, copy next's value into it and unlink next instead: O(1)"],
        ["Delete at index k", "O(n)", "O(n)", "Walk to the node before k, then one pointer write"],
        ["Length", "O(1)", "O(1)", "Only if you keep size; otherwise count in O(n)"],
        ["Traverse", "O(n)", "O(n)", "One pass; slower than an array in practice because nodes are scattered in memory"],
        ["Build from n values", "O(n)", "O(n)", "Append with a tail pointer, or push each value to the front in reverse order"],
        ["Concatenate two lists", "O(1)", "O(1)", "tail.next = other.head, if both tails are known"],
        ["Reverse in place", "O(n)", "O(n)", "prev, cur, nxt: one pass, O(1) extra space"],
        ["Find the middle", "O(n)", "O(n)", "Fast pointer moves 2, slow moves 1; slow is in the middle when fast ends"],
        ["Detect a cycle", "O(n)", "O(n)", "Floyd's fast and slow pointers, O(1) space; a hash set of nodes uses O(n)"],
        ["Merge two sorted lists", "O(n + m)", "O(n + m)", "Dummy tail, always link the smaller head; no new nodes"],
        ["Sort", "O(n log n)", "O(n log n)", "Merge sort: split with fast and slow, merge without extra arrays; quicksort is poor here"],
        ["Copy", "O(n)", "O(n)", "One new node per node"],
      ],
    },
    {
      title: "Doubly linked list (circular, one sentinel)",
      rows: [
        ["Insert or delete at either end", "O(1)", "O(1)", "Both ends are neighbours of the sentinel"],
        ["Delete a node you hold", "O(1)", "O(1)", "prev and next are one step away; this is why LRU caches use it"],
        ["Insert before or after a node you hold", "O(1)", "O(1)", "Four pointer writes"],
        ["Access by index k", "O(n)", "O(n)", "Walk from the nearer end if size is known: min(k, n - k) steps"],
        ["Reverse", "O(n)", "O(n)", "Swap prev and next in every node, sentinel included"],
        ["Extra memory", "O(n)", "O(n)", "Two pointers per node instead of one"],
      ],
    },
    {
      title: "Circular list",
      rows: [
        ["Go from the tail to the head", "O(1)", "O(1)", "tail.next is the head; keeping only a tail pointer gives both ends"],
        ["Rotate by k", "O(n)", "O(n)", "Close the ring, walk to the new tail at n - k % n, cut after it"],
        ["Remove every kth (Josephus)", "O(n k)", "O(n k)", "Each removal walks k steps; the closed-form recurrence is O(n)"],
        ["Detect the end", "O(1)", "O(1)", "Stop when you are back at the start node, not at null"],
      ],
    },
    {
      title: "Compared with a dynamic array",
      rows: [
        ["Access by index", "O(1) array", "O(n) list", "base + i * size against a walk of i pointers"],
        ["Insert or delete at the front", "O(n) array", "O(1) list", "The array shifts every element"],
        ["Insert or delete in the middle, position known", "O(n) array", "O(1) list", "The list still pays O(n) if it must walk to the position first"],
        ["Append", "O(1) amortised array", "O(1) list", "The array sometimes copies everything to a bigger block"],
        ["Memory and cache", "Compact array", "Pointer per node", "Arrays are contiguous, so scans are several times faster"],
      ],
    },
  ],
  builtins: [
    ["Doubly linked list", "`std::list<T>`", "No list type; `collections.deque` covers both ends"],
    ["Singly linked list", "`std::forward_list<T>`", "Write a small `Node` class"],
    ["Push and pop at both ends in O(1)", "`std::deque<T>` or `std::list<T>`", "`collections.deque` (`append`, `appendleft`, `pop`, `popleft`)"],
    ["Move a run of nodes between lists in O(1)", "`list::splice`", "No equivalent"],
    ["Sort, reverse, remove by value", "`list::sort` (stable merge sort), `list::reverse`, `list::remove_if`", "Copy values out: `sorted`, `reversed`, a list comprehension"],
    ["Merge two sorted lists", "`list::merge`", "`heapq.merge` over iterables"],
    ["LRU order (move to front, drop oldest)", "`std::list` + `unordered_map<key, list::iterator>`", "`collections.OrderedDict` (`move_to_end`, `popitem(last=False)`)"],
  ],
  when: [
    "The question hands you a `ListNode` head: it is a pointer problem, and the patterns below cover nearly all of them.",
    "You must insert or delete in the middle many times at positions you already hold (an iterator, a node from a hash map).",
    "You need O(1) removal of an arbitrary item plus an order: hash map + doubly linked list (LRU, LFU, ordered sets).",
    "A queue or deque without resizing spikes, or splicing whole runs between sequences.",
    "Round-robin turns, a ring of players, rotating a sequence: a circular list.",
    "\"In place\" or \"O(1) extra space\" on a list: rewire pointers instead of copying values into an array.",
  ],
  avoid: [
    "You need access by index or binary search: use an array.",
    "Mostly appends and scans: a dynamic array is faster and smaller, thanks to the cache.",
    "Only the two ends change: `deque` is simpler and faster than a hand-made list.",
    "Ordered data with fast search: a balanced BST (`std::map`, `SortedList`) or a skip list, not a sorted linked list.",
    "When the interviewer allows O(n) space, copying the values into an array is often the clearest answer to state first.",
  ],
  tips: [
    "Start any list edit with a dummy node and return `dummy.next`; it removes the head special case.",
    "Save `nxt = cur.next` before you overwrite `cur.next`. Losing it loses the rest of the list.",
    "Draw three boxes and the arrows, and write the pointer changes in order, before coding.",
    "Check `fast and fast.next` before `fast.next.next`; null dereference is the most common crash.",
    "Compare nodes by identity (`is`, pointer equality), not by value, when looking for cycles or intersections.",
    "Test the empty list, one node, two nodes, and an operation on the head and on the tail.",
    "When you cut a list into parts, set the last node's `next` to null, or the parts stay joined and loops appear.",
    "Say the trade-off aloud: O(1) insert at a held position against O(n) access, plus poor cache use.",
  ],
  viz: [
    { name: "Access and search", make: walk, input: "7, 2, 9, 4, 6, 4", label: "values, then the value to find" },
    { name: "Insert and delete", make: () => insertDelete() },
    { name: "Dummy node", make: sentinel, input: "6, 1, 6, 2, 6, 6", label: "values, then the value to remove" },
  ],
};

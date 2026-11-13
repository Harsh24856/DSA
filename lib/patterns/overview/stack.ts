// Overview of the "stack" topic: the data structure or technique itself. Shown on /patterns/stack before the patterns.
// The topic covers stacks, queues and deques.
import type { CellsFrame, Diagram, Mark, StackFrame, Tone } from "../../diagram";
import { nums, type TopicOverview } from "../types.ts";

const orBlank = (a: (string | number)[]) => (a.length ? a : [""]);

/** Push and pop on a stack: a positive number is pushed, 0 pops. */
function pushPop(input?: string): Diagram {
  const ops = nums(input, [3, 1, 4, 0, 5, 0, 0, 2], 10), labels = ops.map((x) => (x === 0 ? "pop" : `push ${x}`)), st: number[] = [], frames: StackFrame[] = [];
  frames.push({ note: "An empty stack. Only the top is reachable: push puts a value on it, pop takes the top value off", items: [] });
  ops.forEach((x, k) => {
    if (x !== 0) { st.push(x); frames.push({ note: `push ${x}: it goes on top, above ${st.length > 1 ? st[st.length - 2] : "nothing"}. O(1), and nothing below moves`, items: [...st], incoming: labels[k] }); }
    else if (st.length) { const v = st.pop()!; frames.push({ note: `pop returns ${v}, the LAST value pushed. ${st.length ? `${st[st.length - 1]} is the top again` : "The stack is empty now"}`, items: [...st], incoming: labels[k], popped: [v] }); }
    else frames.push({ note: "pop on an empty stack: there is nothing to return. Check isEmpty first, or the code raises an error", items: [], incoming: labels[k] });
  });
  frames.push({ note: `Last in, first out. ${st.length ? `Left on the stack, bottom to top: ${st.join(", ")}` : "Every value pushed was popped in reverse order"}`, items: [...st] });
  return { kind: "stack", title: "Stack: push and pop at the top", input: labels, frames };
}

/** A queue on a circular buffer: head and size, indexes wrap round with % capacity, and the buffer doubles when full. */
function ringQueue(): Diagram {
  let cap = 4, a: (string | number)[] = Array(cap).fill(""), head = 0, n = 0;
  const frames: CellsFrame[] = [];
  const marks = (): Mark[] => (n ? [{ i: head, label: "front" }, { i: (head + n - 1) % cap, label: "back" }] : [{ i: head, label: "front" }]);
  const tones = (hot?: number, t: Tone = "found") => Object.fromEntries([...a.map((v, i): [string, Tone] => [`0:${i}`, v === "" ? "muted" : "window"]), ...(hot !== undefined ? [[`0:${hot}`, t] as [string, Tone]] : [])]);
  const snap = (note: string, hot?: number, t?: Tone) => frames.push({ note, rows: [[...a]], tones: tones(hot, t), marks: marks() });
  snap(`A buffer of ${cap} slots, head = 0 and size = 0. The next free slot is always (head + size) % capacity`);
  const push = (x: number) => {
    if (n === cap) {
      const old = cap; a = [...Array.from({ length: n }, (_, i) => a[(head + i) % cap]), ...Array(cap).fill("")]; cap *= 2; head = 0;
      snap(`Full: copy the ${n} values in queue order into a buffer of ${cap} and reset head to 0. O(n) now, but it happens after ${old} pushes, so push is O(1) amortised`);
    }
    const i = (head + n) % cap; a[i] = x; n++;
    snap(`enqueue ${x}: write slot (${head} + ${n - 1}) % ${cap} = ${i}, size ${n}`, i);
  };
  const pop = () => { const v = a[head]; const was = head; a[head] = ""; head = (head + 1) % cap; n--; snap(`dequeue returns ${v} from slot ${was}; head moves to ${head}. Nothing shifts, unlike list.pop(0)`, was, "bad"); };
  push(1); push(2); push(3); pop(); pop(); push(4); push(5); push(6); push(7);
  return { kind: "cells", title: "Queue on a circular buffer", rows: [Array(4).fill("")], frames };
}

/** A queue built from two stacks: push onto in, pop from out, and refill out only when it is empty. */
function twoStacks(): Diagram {
  const inS: number[] = [], out: number[] = [], frames: CellsFrame[] = [];
  const snap = (note: string, hot?: [number, number], t: Tone = "found") => frames.push({ note, rows: [orBlank([...inS]), orBlank([...out])], tones: hot ? { [`${hot[0]}:${hot[1]}`]: t } : {}, marks: [...(inS.length ? [{ i: inS.length - 1, label: "top", row: 0 }] : []), ...(out.length ? [{ i: out.length - 1, label: "top", row: 1 }] : [])] });
  snap("Two stacks, tops on the right. New values go onto in; the oldest value is served from the top of out");
  const push = (x: number) => { inS.push(x); snap(`push ${x} onto in: O(1)`, [0, inS.length - 1]); };
  const pop = () => {
    if (!out.length) { const moved = [...inS].reverse(); while (inS.length) out.push(inS.pop()!); snap(`out is empty, so pop everything from in onto out (${moved.join(", ")}). The order flips: the oldest value is now on top`, [1, out.length - 1], "active"); }
    const v = out.pop()!; snap(`pop returns ${v} from the top of out, first in, first out${out.length ? "; out is not empty, so the next pop needs no move" : ""}`);
    return v;
  };
  push(1); push(2); push(3); pop(); push(4); pop(); pop(); pop();
  frames.push({ note: "Each value is pushed onto in once, moved once and popped once, so n operations cost O(n): amortised O(1) per pop", rows: [[""], [""]] });
  return { kind: "cells", title: "Queue from two stacks", rowLabels: ["in", "out"], rows: [[""], [""]], frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **stack** is a sequence where you only touch one end, the **top**. `push` adds on top, `pop` removes the top, `peek` (or `top`) reads it. The last value in is the first one out: **LIFO**. A **queue** adds at the back and removes from the front, so the first value in is the first one out: **FIFO**. A **deque** (double-ended queue, said \"deck\") allows both at both ends, so it can act as either.",
    "None of these is a new memory layout. Each is a rule about which end you may use, laid over an array or a linked list. That restriction is the point: when only the ends change, every operation is O(1), and the order of removal says something useful (most recent first, or oldest first).",
    "On an array, a stack keeps its top at the **end**, so push and pop never shift anything. A queue cannot simply use the front of an array, because removing index 0 shifts every element (that is why `list.pop(0)` is O(n)). Instead it uses a **circular buffer**: a fixed block plus a head index and a size, where indexes wrap round with `% capacity`, and the block doubles when full. On a linked list, a stack pushes and pops at the head, and a queue adds at the tail and removes at the head; both are O(1) with no resizing, at the cost of a pointer per value and poor cache use.",
    "The **call stack** is a stack your program already uses. Each function call pushes a frame (arguments, locals, the return address) and each return pops it. That is why recursion depth costs O(depth) memory, why very deep recursion overflows, and why any recursive DFS can be rewritten with an explicit stack.",
    "What the order buys you. A stack remembers the most recent unfinished thing: the innermost open bracket, the last unresolved bar in a histogram, the previous directory in a path, the caller to return to. A queue processes things in arrival order: the next level in BFS, the next task in round-robin, the oldest request in a time window.",
    "Vocabulary: LIFO and FIFO, push, pop, peek or top, enqueue and dequeue, front and back (or head and tail), overflow and underflow, bounded (fixed capacity) and unbounded, circular buffer or ring buffer, amortised O(1), monotonic stack and monotonic deque (kept sorted by popping), and stack frame.",
  ],
  build: [
    "Array stack: the array and its length are the whole state, and the invariant is that the top is element `size - 1`. Push writes at index `size` (growing the array by doubling when full, so amortised O(1)); pop reads index `size - 1` and shrinks the size. Popping an empty stack is the one error to handle.",
    "Linked stack: keep only `top`, a pointer to the head node. Push makes a node whose `next` is the old top and makes it the top; pop returns the top's value and moves `top` to `top.next`. Every operation is O(1) in the worst case, not just amortised.",
    "Circular buffer queue or deque: an array `a` of capacity `cap`, the index `head` of the front value and the count `size`. The back value lives at `(head + size - 1) % cap`, so enqueue writes `(head + size) % cap` and dequeue reads `a[head]` and sets `head = (head + 1) % cap`. Push at the front steps `head` back with `(head - 1) % cap` (in C++ add `cap` first, since `%` of a negative stays negative). When `size == cap`, copy the values in queue order into an array twice as big and set `head = 0`. Keeping `size` rather than a tail index avoids the classic full-or-empty ambiguity when head and tail meet.",
    "Queue from two stacks: push onto `in`; to pop, if `out` is empty move every value from `in` to `out` (which reverses them, putting the oldest on top), then pop `out`. Each value moves at most once, so n operations cost O(n) in total. A stack from queues is the reverse trick: after each push, rotate the queue so the new value is at the front, O(n) per push.",
  ],
  code: `class ArrayStack:
    """Stack on a dynamic array: the top is the END of the array, so push and pop never shift."""
    def __init__(self):
        self.a = []

    def push(self, x): self.a.append(x)          # amortised O(1)
    def pop(self):
        if not self.a:
            raise IndexError("pop from empty stack")
        return self.a.pop()                      # O(1): removes the last slot
    def peek(self): return self.a[-1] if self.a else None
    def __len__(self): return len(self.a)


class LinkedStack:
    """Stack on a singly linked list: the top is the HEAD, so push and pop are O(1) with no resizing."""
    class Node:
        def __init__(self, val, nxt):
            self.val, self.next = val, nxt

    def __init__(self):
        self.top, self.n = None, 0

    def push(self, x):
        self.top = self.Node(x, self.top)
        self.n += 1

    def pop(self):
        if not self.top:
            raise IndexError("pop from empty stack")
        x, self.top = self.top.val, self.top.next
        self.n -= 1
        return x

    def peek(self): return self.top.val if self.top else None
    def __len__(self): return self.n


class RingDeque:
    """Queue and deque on a circular buffer: head index + size, indexes wrap with % cap, doubles when full."""
    def __init__(self, cap=4):
        self.a = [None] * cap
        self.head = 0                            # index of the front element
        self.n = 0

    def _grow(self):                             # copy in queue order into a buffer twice as big, O(n)
        self.a = [self.a[(self.head + i) % len(self.a)] for i in range(self.n)] + [None] * len(self.a)
        self.head = 0

    def push_back(self, x):                      # enqueue
        if self.n == len(self.a):
            self._grow()
        self.a[(self.head + self.n) % len(self.a)] = x
        self.n += 1

    def push_front(self, x):
        if self.n == len(self.a):
            self._grow()
        self.head = (self.head - 1) % len(self.a)  # step back, wrapping round
        self.a[self.head] = x
        self.n += 1

    def pop_front(self):                         # dequeue
        if not self.n:
            raise IndexError("empty")
        x, self.a[self.head] = self.a[self.head], None
        self.head = (self.head + 1) % len(self.a)
        self.n -= 1
        return x

    def pop_back(self):
        if not self.n:
            raise IndexError("empty")
        i = (self.head + self.n - 1) % len(self.a)
        x, self.a[i] = self.a[i], None
        self.n -= 1
        return x

    def front(self): return self.a[self.head] if self.n else None
    def back(self): return self.a[(self.head + self.n - 1) % len(self.a)] if self.n else None
    def __getitem__(self, i): return self.a[(self.head + i) % len(self.a)]   # O(1) by index
    def __len__(self): return self.n


class TwoStackQueue:
    """Queue from two stacks: push onto inbox; pop from outbox, refilling it only when it is empty."""
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x): self.inbox.append(x)

    def _refill(self):
        if not self.outbox:
            while self.inbox:                    # reversing the inbox puts the oldest on top
                self.outbox.append(self.inbox.pop())

    def pop(self):
        self._refill()
        return self.outbox.pop()                 # amortised O(1): each item moves once

    def peek(self):
        self._refill()
        return self.outbox[-1]

    def __len__(self): return len(self.inbox) + len(self.outbox)`,
  ops: [
    {
      title: "Stack",
      rows: [
        ["push", "O(1) amortised", "O(n) array, O(1) linked", "An array occasionally doubles and copies; a linked stack never resizes"],
        ["pop", "O(1)", "O(1)", "Removes the last array slot, or moves top to top.next"],
        ["peek / top", "O(1)", "O(1)", "Reads the last slot or the head node"],
        ["isEmpty, size", "O(1)", "O(1)", "Keep the count"],
        ["Search for a value", "O(n)", "O(n)", "Not a stack operation: you would pop or scan everything"],
        ["kth from the top", "O(1) array, O(k) linked", "O(1) array, O(k) linked", "a[size - 1 - k] on an array; a walk on a list"],
        ["Build from n values", "O(n)", "O(n)", "n pushes"],
        ["Reverse a sequence", "O(n)", "O(n)", "Push everything, then pop everything"],
        ["Monotonic stack pass", "O(n)", "O(n)", "Each element is pushed once and popped at most once"],
        ["Recursion depth d (the call stack)", "O(d) space", "O(d) space", "One frame per active call"],
      ],
    },
    {
      title: "Queue",
      rows: [
        ["enqueue (push back)", "O(1) amortised", "O(n) ring, O(1) linked", "A full ring buffer doubles and copies"],
        ["dequeue (pop front)", "O(1)", "O(1)", "head = (head + 1) % cap, or head = head.next"],
        ["front, back", "O(1)", "O(1)", "a[head] and a[(head + size - 1) % cap]"],
        ["ith from the front", "O(1) ring, O(i) linked", "O(1) ring, O(i) linked", "a[(head + i) % cap]"],
        ["dequeue with list.pop(0) or vector::erase(begin)", "O(n)", "O(n)", "Shifts every remaining element: the classic slow BFS"],
        ["Queue from two stacks: push", "O(1)", "O(1)", "Push onto in"],
        ["Queue from two stacks: pop", "O(1) amortised", "O(n)", "Refill out only when empty; each value moves once"],
        ["Stack from one queue: push", "O(n)", "O(n)", "Rotate the older values behind the new one"],
        ["BFS over a graph", "O(V + E)", "O(V + E)", "Each vertex is enqueued and dequeued once"],
      ],
    },
    {
      title: "Deque (circular buffer, or std::deque)",
      rows: [
        ["Push or pop at either end", "O(1) amortised", "O(n) ring when it grows", "std::deque allocates a new block instead, so its pushes are O(1)"],
        ["Read either end", "O(1)", "O(1)", "front and back slots"],
        ["Access by index", "O(1)", "O(1)", "Ring index arithmetic; Python's deque is O(n) towards the middle, since it is a linked list of blocks"],
        ["Insert or delete in the middle", "O(n)", "O(n)", "Shifts the shorter side"],
        ["rotate(k)", "O(k)", "O(k)", "Moves k values from one end to the other"],
        ["Sliding window maximum (monotonic deque)", "O(n)", "O(n)", "Each index enters and leaves once"],
      ],
    },
  ],
  builtins: [
    ["Stack", "`std::stack<T>` (`push`, `pop`, `top`) or a `vector` with `push_back`, `pop_back`, `back`", "`list` with `append`, `pop()`, `[-1]`"],
    ["Queue", "`std::queue<T>` (`push`, `pop`, `front`, `back`)", "`collections.deque` with `append` and `popleft`"],
    ["Deque", "`std::deque<T>` (`push_front`, `push_back`, `pop_front`, `pop_back`, index access)", "`collections.deque` (`appendleft`, `append`, `popleft`, `pop`, `rotate`)"],
    ["Fixed-size window of recent items", "A `deque` you trim by hand", "`deque(maxlen=k)` drops the oldest automatically"],
    ["Queue shared between threads", "`std::queue` plus a mutex and condition variable", "`queue.Queue`, `queue.LifoQueue`"],
    ["Priority queue (smallest or largest first, not FIFO)", "`std::priority_queue<T>`", "`heapq` (see the Heaps topic)"],
  ],
  when: [
    "Matching or nesting: brackets, tags, \"innermost first\", undo, decoding `3[a2[c]]`.",
    "\"Next greater\", \"previous smaller\", spans, histograms: a monotonic stack.",
    "Evaluate or parse an expression, or simplify a path: a stack of operands or parts.",
    "Recursion that might go too deep, or an iterative DFS: an explicit stack.",
    "Level by level, nearest first, fewest steps: a queue for BFS.",
    "Process in arrival order, round-robin, the last k seconds of requests: a queue.",
    "Add and remove at both ends, or the maximum of a sliding window: a deque.",
  ],
  avoid: [
    "You need the smallest or largest item, not the newest or oldest: a heap.",
    "You need lookup by key or value: a hash map or set.",
    "You need access in the middle or sorted order: an array or a balanced tree.",
    "A Python queue built on `list.pop(0)` is O(n) per pop; use `collections.deque`.",
    "Never use a queue where weights differ (shortest path with costs): Dijkstra needs a priority queue.",
  ],
  tips: [
    "Always check for empty before `pop` or `top`; in C++ `stack::top()` on an empty stack is undefined behaviour, not an error.",
    "In C++ `pop()` returns void: read `top()` (or `front()`) first, then pop.",
    "For monotonic stacks, store indexes rather than values: you usually need both the value and the distance.",
    "Say the amortised argument out loud: every element is pushed once and popped once, so the whole pass is O(n).",
    "In a ring buffer, keep a size counter; with only head and tail, full and empty look the same.",
    "In C++ wrap a backwards step as `(head - 1 + cap) % cap`; `-1 % cap` is negative.",
    "Mark BFS nodes as visited when you enqueue them, not when you dequeue, or the same node enters the queue many times.",
    "If the interviewer asks for a queue with O(1) max, or a stack with O(1) min, the answer is an extra stack or deque that tracks it.",
  ],
  viz: [
    { name: "Stack push and pop", make: pushPop, input: "3, 1, 4, 0, 5, 0, 0, 2", label: "numbers to push, 0 = pop" },
    { name: "Circular buffer queue", make: () => ringQueue() },
    { name: "Queue from two stacks", make: () => twoStacks() },
  ],
};

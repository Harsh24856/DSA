// Solutions for the must-do "stack" questions that were new to the app (lib/patterns/overview/stack.problems.ts). See ../arrays.ts for the style.
import type { CellsFrame, Diagram, Mark, StackFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const orBlank = (a: (string | number)[]) => (a.length ? a : [""]);

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "implement-stack-using-queues": {
    approach: "One queue kept newest-first: after each push, rotate the older values from the front to the back, so pop and top read the front.",
    idea: ["A queue only gives away its oldest value, but a stack must give its newest. So keep the queue ordered newest first.", "push(x): append x at the back, then move the other len - 1 values from the front to the back, one at a time. x is now at the front.", "pop and top read the front of the queue in O(1); empty checks the length.", "Push costs O(n) and everything else O(1). The two-queue version moves the same work around without making it cheaper."],
    code: `from collections import deque
class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1):   # rotate the older values behind x
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()            # the front is always the newest value

    def top(self):
        return self.q[0]

    def empty(self):
        return not self.q`,
    lang: "python", time: "push O(n), pop and top O(1)", space: "O(n)",
    viz: () => {
      const q: number[] = [], frames: CellsFrame[] = [];
      const snap = (note: string, hot?: number, t: Tone = "found") => frames.push({ note, rows: [orBlank([...q])], tones: hot !== undefined ? { [`0:${hot}`]: t } : {}, marks: q.length ? [{ i: 0, label: "front" }] : [] });
      snap("One empty queue. Values leave from the front (left) and join at the back (right)");
      for (const x of [1, 2, 3]) {
        q.push(x); snap(`push(${x}): append ${x} at the back`, q.length - 1, "active");
        for (let r = 0; r < q.length - 1; r++) { q.push(q.shift()!); snap(`rotate ${r + 1} of ${q.length - 1}: move ${q[q.length - 1]} from the front to the back`, q.indexOf(x)); }
      }
      snap(`top() reads the front: ${q[0]}, the newest value`, 0);
      const v = q.shift()!; snap(`pop() removes the front: ${v}. Now top() is ${q[0]}, last in, first out`, 0, "window");
      return cells("MyStack on one queue", [[""]], frames, ["queue"]);
    },
  },

  "design-circular-queue": {
    approach: "A fixed array, the index of the front and a count: the rear is (head + size - 1) % k, and every index wraps with % k.",
    idea: ["Use an array of k slots, head = index of the front value, size = number of values.", "enQueue writes slot (head + size) % k when size < k; deQueue moves head to (head + 1) % k when size > 0.", "Front is a[head], Rear is a[(head + size - 1) % k], each -1 when empty.", "Counting size means full (size == k) and empty (size == 0) never look alike, the bug of storing only head and tail indexes.", "Every operation is O(1) and nothing ever shifts."],
    code: `class MyCircularQueue:
    def __init__(self, k):
        self.a = [0] * k
        self.head = 0          # index of the front value
        self.size = 0

    def enQueue(self, value):
        if self.isFull():
            return False
        self.a[(self.head + self.size) % len(self.a)] = value
        self.size += 1
        return True

    def deQueue(self):
        if self.isEmpty():
            return False
        self.head = (self.head + 1) % len(self.a)
        self.size -= 1
        return True

    def Front(self):
        return -1 if self.isEmpty() else self.a[self.head]

    def Rear(self):
        return -1 if self.isEmpty() else self.a[(self.head + self.size - 1) % len(self.a)]

    def isEmpty(self):
        return self.size == 0

    def isFull(self):
        return self.size == len(self.a)`,
    lang: "python", time: "O(1) per operation", space: "O(k)",
    viz: () => {
      const k = 3, a: (string | number)[] = Array(k).fill(""), frames: CellsFrame[] = [];
      let head = 0, size = 0;
      const marks = (): Mark[] => (size ? [{ i: head, label: "front" }, { i: (head + size - 1) % k, label: "rear" }] : [{ i: head, label: "front" }]);
      const snap = (note: string, hot?: number, t: Tone = "found") => frames.push({ note, rows: [[...a]], tones: { ...Object.fromEntries(a.map((v, i) => [`0:${i}`, v === "" ? "muted" : "window"])), ...(hot !== undefined ? { [`0:${hot}`]: t } : {}) }, marks: marks() });
      snap(`k = ${k} slots, head = 0, size = 0`);
      const enq = (x: number) => { if (size === k) { snap(`enQueue(${x}): size is ${k}, the queue is full, return False`); return; } const i = (head + size) % k; a[i] = x; size++; snap(`enQueue(${x}): write slot (${head} + ${size - 1}) % ${k} = ${i}, return True`, i); };
      enq(1); enq(2); enq(3); enq(4);
      snap(`Rear(): slot (${head} + ${size} - 1) % ${k} = ${(head + size - 1) % k} holds ${a[(head + size - 1) % k]}. isFull() is True`, (head + size - 1) % k, "active");
      const was = head; a[head] = ""; head = (head + 1) % k; size--;
      snap(`deQueue(): head moves from ${was} to ${head}, return True`, was, "bad");
      enq(4);
      snap(`Rear() is now ${a[(head + size - 1) % k]}, in slot ${(head + size - 1) % k}: the queue wrapped round`, (head + size - 1) % k, "active");
      return cells("MyCircularQueue(3)", [Array(k).fill("")], frames);
    },
  },

  "validate-stack-sequences": {
    approach: "Replay it: push the values in order and pop greedily whenever the top is the next value of popped; valid if the stack ends empty.",
    idea: ["Simulate a real stack. Walk pushed, pushing each value.", "After each push, while the top equals popped[j], pop it and move j forward.", "Popping as early as possible is always safe: values are distinct, and if the top is the next one to pop, any push before popping it would bury it.", "If the stack is empty at the end, every pop happened in the given order; otherwise some value was stuck under another.", "Each value is pushed once and popped at most once: O(n)."],
    code: `def validateStackSequences(pushed, popped):
    st, j = [], 0
    for x in pushed:
        st.append(x)
        while st and st[-1] == popped[j]:   # pop as soon as the top is the next value to pop
            st.pop()
            j += 1
    return not st`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const pushed = [1, 2, 3, 4, 5], popped = [4, 5, 3, 2, 1], st: number[] = [], frames: StackFrame[] = [];
      let j = 0;
      for (const x of pushed) {
        st.push(x);
        frames.push({ note: `push ${x}. The next value to pop is ${popped[j]}${st[st.length - 1] === popped[j] ? ", which is the top" : ", not the top, so keep pushing"}`, items: [...st], incoming: x, side: `popped so far: ${popped.slice(0, j).join(", ") || "none"}` });
        const out: number[] = [];
        while (st.length && st[st.length - 1] === popped[j]) { out.push(st.pop()!); j++; }
        if (out.length) frames.push({ note: `pop ${out.join(", ")}: ${out.length > 1 ? "each matched" : "it matches"} the next value in popped${j < popped.length ? `; next wanted is ${popped[j]}` : ""}`, items: [...st], popped: out, side: `popped so far: ${popped.slice(0, j).join(", ")}` });
      }
      frames.push({ note: st.length ? `The stack still holds ${st.join(", ")}: invalid` : "The stack is empty: every pop happened in the given order, so the answer is True", items: [...st] });
      return { kind: "stack", title: "validateStackSequences([1,2,3,4,5], [4,5,3,2,1]) = True", input: pushed, frames };
    },
  },

  "remove-all-adjacent-duplicates-in-string": {
    approach: "Use a stack of letters: a letter equal to the top cancels it, any other letter is pushed; the stack is the answer.",
    idea: ["Removing a pair can make two new letters adjacent, as in abba, so one left-to-right pass of comparisons with the previous character is not enough.", "A stack keeps exactly the letters that survived so far; its top is the letter just before the current one.", "If the current letter equals the top, both disappear: pop. Otherwise push it.", "Removals in any order give the same final string, so this greedy order is fine.", "Join the stack from bottom to top. O(n) time, each letter pushed and popped at most once."],
    code: `def removeDuplicates(s):
    st = []
    for ch in s:
        if st and st[-1] == ch:
            st.pop()          # ch cancels the equal letter before it
        else:
            st.append(ch)
    return "".join(st)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "abbaca", st: string[] = [], frames: StackFrame[] = [];
      [...s].forEach((ch, i) => {
        if (st.length && st[st.length - 1] === ch) { st.pop(); frames.push({ note: `s[${i}] = '${ch}' equals the top: the pair cancels, pop`, items: [...st], incoming: ch, popped: [ch] }); }
        else { st.push(ch); frames.push({ note: `s[${i}] = '${ch}' ${st.length > 1 ? `differs from the top '${st[st.length - 2]}'` : "meets an empty stack"}: push`, items: [...st], incoming: ch }); }
      });
      frames.push({ note: `Join the stack from the bottom: "${st.join("")}"`, items: [...st] });
      return { kind: "stack", title: `removeDuplicates("${s}") = "${st.join("")}"`, input: [...s], frames };
    },
  },

  "number-of-recent-calls": {
    approach: "A queue of ping times: append t, drop times older than t - 3000 from the front, and the queue length is the answer.",
    idea: ["Calls come with strictly increasing t, so the times in the window [t - 3000, t] are always the most recent ones.", "Keep them in a queue: the oldest is at the front.", "On ping(t), append t, then pop from the front while the front is below t - 3000.", "What is left is exactly the calls in the window; return its length.", "Every time is appended once and removed once, so the cost is O(1) amortised per ping."],
    code: `from collections import deque
class RecentCounter:
    def __init__(self):
        self.q = deque()

    def ping(self, t):
        self.q.append(t)
        while self.q[0] < t - 3000:   # times only grow, so old ones leave from the front
            self.q.popleft()
        return len(self.q)`,
    lang: "python", time: "O(1) amortised per ping", space: "O(3000) at most, the size of the window",
    viz: () => {
      const pings = [642, 1849, 4921, 5936, 5957], q: number[] = [], frames: CellsFrame[] = [];
      frames.push({ note: "An empty queue of ping times, oldest at the front (left)", rows: [[""]] });
      for (const t of pings) {
        q.push(t); const gone: number[] = [];
        while (q[0] < t - 3000) gone.push(q.shift()!);
        frames.push({ note: `ping(${t}): the window is [${t - 3000}, ${t}]. ${gone.length ? `Drop ${gone.join(", ")} from the front. ` : "Nothing is too old. "}Return ${q.length}`, rows: [[...q]], tones: { [`0:${q.length - 1}`]: "found" }, marks: [{ i: 0, label: "front" }] });
      }
      frames.push({ note: "Each time entered the queue once and left at most once, so a ping costs O(1) amortised", rows: [[...q]] });
      return cells("RecentCounter", [[""]], frames, ["queue"]);
    },
  },
};

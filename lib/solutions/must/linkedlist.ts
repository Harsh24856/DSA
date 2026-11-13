// Solutions for the must-do "linkedlist" questions that were new to the app (lib/patterns/overview/linkedlist.problems.ts). See ../arrays.ts for the style.
import type { Diagram, ListFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

const chain = (n: number, order: number[]) => { const nx = Array(n).fill(-1); order.forEach((x, k) => (nx[x] = k + 1 < order.length ? order[k + 1] : -1)); return nx; };
const T = (pairs: [number, Tone][]) => Object.fromEntries(pairs) as Record<number, Tone>;
const list = (title: string, values: (string | number)[], frames: ListFrame[]): Diagram => ({ kind: "list", title, values, frames });
/** Values in list order from a start node. */
const walkFrom = (next: number[], vals: (string | number)[], s: number) => { const out: (string | number)[] = []; for (let c = s, k = 0; c !== -1 && k < vals.length; c = next[c], k++) out.push(vals[c]); return out; };

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "design-linked-list": {
    approach: "A singly linked list with a dummy node and a size: every operation walks to the node before the index, then rewires one pointer.",
    idea: ["Keep a dummy node before the head and the current size, so index checks are O(1) and the head is never a special case.", "A helper walks index steps from the dummy and returns the node just before position index.", "get(i): check 0 <= i < size, then return before(i).next.val.", "addAtIndex(i, val): allowed for 0 <= i <= size (i = size appends). Point the new node at prev.next, then prev.next at the new node.", "addAtHead and addAtTail are addAtIndex(0) and addAtIndex(size). deleteAtIndex(i) sets prev.next = prev.next.next when 0 <= i < size."],
    code: `class MyLinkedList:
    class Node:
        def __init__(self, val, nxt=None):
            self.val, self.next = val, nxt

    def __init__(self):
        self.dummy = self.Node(0)   # sentinel before the head
        self.size = 0

    def _before(self, index):       # node just before position index
        cur = self.dummy
        for _ in range(index):
            cur = cur.next
        return cur

    def get(self, index):
        if not 0 <= index < self.size:
            return -1
        return self._before(index).next.val

    def addAtHead(self, val):
        self.addAtIndex(0, val)

    def addAtTail(self, val):
        self.addAtIndex(self.size, val)

    def addAtIndex(self, index, val):
        if not 0 <= index <= self.size:
            return
        prev = self._before(index)
        prev.next = self.Node(val, prev.next)
        self.size += 1

    def deleteAtIndex(self, index):
        if not 0 <= index < self.size:
            return
        prev = self._before(index)
        prev.next = prev.next.next
        self.size -= 1`,
    lang: "python", time: "O(i) per operation at index i", space: "O(n)",
    viz: () => {
      const vals: (string | number)[] = ["D", 1, 3, 2], next = [-1, -1, -1, -1], frames: ListFrame[] = [], live = new Set([0]);
      let size = 0;
      const before = (i: number) => { let c = 0; for (let k = 0; k < i; k++) c = next[c]; return c; };
      const muted = (): [number, Tone][] => [0, 1, 2, 3].filter((k) => !live.has(k)).map((k) => [k, "muted"]);
      const add = (i: number, node: number, what: string) => { const p = before(i); next[node] = next[p]; next[p] = node; live.add(node); size++; frames.push({ note: `${what}: walk ${i} step${i === 1 ? "" : "s"} from D to prev = ${vals[p]}, then new.next = prev.next and prev.next = new. List ${walkFrom(next, vals, next[0]).join(" → ")}, size ${size}`, next: [...next], ptrs: [{ i: p, label: "prev" }, { i: node, label: "new" }], tones: T([...muted(), [0, "muted"], [node, "found"]]) }); };
      frames.push({ note: "Start: only the dummy node D, size 0. Nodes 1, 3 and 2 have not been added yet", next: [...next], ptrs: [{ i: 0, label: "dummy" }], tones: T([...muted(), [0, "muted"]]) });
      add(0, 1, "addAtHead(1)");
      add(size, 2, "addAtTail(3)");
      add(1, 3, "addAtIndex(1, 2)");
      let p = before(1);
      frames.push({ note: `get(1): 1 is below size ${size}, walk to prev = ${vals[p]} and return prev.next.val = ${vals[next[p]]}`, next: [...next], ptrs: [{ i: p, label: "prev" }, { i: next[p], label: "get" }], tones: T([...muted(), [0, "muted"], [next[p], "found"]]) });
      const gone = next[p]; next[p] = next[gone]; next[gone] = -1; live.delete(gone); size--;
      frames.push({ note: `deleteAtIndex(1): prev = ${vals[p]}, prev.next = prev.next.next skips ${vals[gone]}. List ${walkFrom(next, vals, next[0]).join(" → ")}, size ${size}`, next: [...next], ptrs: [{ i: p, label: "prev" }], tones: T([...muted(), [0, "muted"], [gone, "bad"]]) });
      p = before(1);
      frames.push({ note: `get(1) again: now index 1 holds ${vals[next[p]]}. get(5) or deleteAtIndex(5) would fail the size check and do nothing`, next: [...next], ptrs: [{ i: p, label: "prev" }, { i: next[p], label: "get" }], tones: T([...muted(), [0, "muted"], [next[p], "found"]]) });
      return list("MyLinkedList with a dummy node", vals, frames);
    },
  },

  "remove-linked-list-elements": {
    approach: "Put a dummy node before the head and walk cur from it: when cur.next has the value, skip it and stay; otherwise step.",
    idea: ["Removing a node needs the node before it. The head has none, so a dummy node in front gives it one.", "cur starts at the dummy. While cur.next exists, look at its value.", "If it equals val, set cur.next = cur.next.next and do not move: the new cur.next may also need removing.", "Otherwise move cur forward.", "Return dummy.next, which is the new head, or null if everything was removed."],
    code: `def removeElements(head, val):
    dummy = ListNode(0, head)
    cur = dummy
    while cur.next:
        if cur.next.val == val:
            cur.next = cur.next.next   # skip it; cur stays for the new next
        else:
            cur = cur.next
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const body = [1, 2, 6, 3, 4, 5, 6], val = 6, vals: (string | number)[] = ["D", ...body], next = chain(vals.length, vals.map((_, i) => i)), frames: ListFrame[] = [], gone: number[] = [];
      const tones = (cur: number, extra: [number, Tone][] = []) => T([[0, "muted"], ...gone.map((g): [number, Tone] => [g, "muted"]), [cur, "active"], ...extra]);
      frames.push({ note: `Remove every ${val}. cur starts on the dummy D, which sits before the head`, next: [...next], ptrs: [{ i: 0, label: "cur" }], tones: tones(0) });
      let cur = 0;
      while (next[cur] !== -1) {
        const nx = next[cur];
        if (vals[nx] === val) { next[cur] = next[nx]; next[nx] = -1; gone.push(nx); frames.push({ note: `cur.next is ${val}: cur.next = cur.next.next. cur stays where it is`, next: [...next], ptrs: [{ i: cur, label: "cur" }], tones: tones(cur, [[nx, "bad"]]) }); }
        else { cur = nx; frames.push({ note: `cur.next is ${vals[nx]}: keep it and step, cur = ${vals[nx]}`, next: [...next], ptrs: [{ i: cur, label: "cur" }], tones: tones(cur) }); }
      }
      frames.push({ note: `cur.next is null. Return dummy.next: ${walkFrom(next, vals, next[0]).join(" → ")}`, next: [...next], ptrs: [{ i: next[0], label: "head" }], tones: T([[0, "muted"], ...gone.map((g): [number, Tone] => [g, "muted"])]) });
      return list(`removeElements(val = ${val})`, vals, frames);
    },
  },

  "odd-even-linked-list": {
    approach: "Grow two chains at once, odd positions and even positions, by leapfrogging; then hang the even chain after the odd one.",
    idea: ["Positions count from 1, so the head is odd and head.next is even. Remember even_head.", "While even and even.next exist: odd.next = even.next and step odd; then even.next = odd.next and step even.", "Each round moves one node into each chain, reusing the existing nodes, so the extra space is O(1).", "The loop stops when the even chain reaches the end; then odd is the last odd node.", "Finish with odd.next = even_head."],
    code: `def oddEvenList(head):
    if not head:
        return head
    odd, even = head, head.next
    even_head = even
    while even and even.next:
        odd.next = even.next        # link the next odd node
        odd = odd.next
        even.next = odd.next        # link the next even node
        even = even.next
    odd.next = even_head            # odd chain, then the even chain
    return head`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [1, 2, 3, 4, 5, 6, 7], next = chain(7, vals.map((_, i) => i)), frames: ListFrame[] = [];
      let odd = 0, even = 1; const evenHead = 1, oc = [vals[0]];
      const tones = () => T(vals.map((_, i): [number, Tone] => [i, i % 2 === 0 ? "window" : "active"]));
      frames.push({ note: "odd = head (position 1), even = head.next (position 2). Remember even_head", next: [...next], ptrs: [{ i: odd, label: "odd" }, { i: even, label: "even" }], tones: tones() });
      while (even !== -1 && next[even] !== -1) {
        next[odd] = next[even]; odd = next[odd]; oc.push(vals[odd]);
        frames.push({ note: `odd.next = even.next, odd steps to ${vals[odd]}: odd chain ${oc.join(" → ")}`, next: [...next], ptrs: [{ i: odd, label: "odd" }, { i: even, label: "even" }], tones: tones() });
        next[even] = next[odd]; even = next[even];
        frames.push({ note: even === -1 ? "even.next = odd.next is null: the even chain has ended" : `even.next = odd.next, even steps to ${vals[even]}`, next: [...next], ptrs: [{ i: odd, label: "odd" }, ...(even !== -1 ? [{ i: even, label: "even" }] : [])], tones: tones() });
      }
      next[odd] = evenHead;
      frames.push({ note: `odd.next = even_head joins the chains: ${walkFrom(next, vals, 0).join(" → ")}`, next: [...next], ptrs: [{ i: 0, label: "head" }, { i: evenHead, label: "even_head" }], tones: tones() });
      return list("oddEvenList: odd positions, then even ones", vals, frames);
    },
  },

  "rotate-list": {
    approach: "Find the length and tail, close the list into a ring, walk n - k % n - 1 steps to the new tail and cut after it.",
    idea: ["Rotating right by k moves the last k % n nodes to the front; k can be far larger than n, so reduce it first.", "Walk once to get the length n and the tail.", "If k % n is 0 the list is unchanged.", "Otherwise link tail.next = head, making a ring.", "The new tail is the node at index n - k - 1. Its next is the new head; set its next to null to open the ring."],
    code: `def rotateRight(head, k):
    if not head or not head.next:
        return head
    n, tail = 1, head
    while tail.next:                # length and the old tail
        tail = tail.next
        n += 1
    k %= n
    if k == 0:
        return head
    tail.next = head                # close the ring
    new_tail = head
    for _ in range(n - k - 1):
        new_tail = new_tail.next
    new_head = new_tail.next
    new_tail.next = None            # cut it open again
    return new_head`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [1, 2, 3, 4, 5], K = 2, n = vals.length, next = chain(n, vals.map((_, i) => i)), frames: ListFrame[] = [];
      frames.push({ note: `Rotate right by k = ${K}. tail starts at the head, n = 1`, next: [...next], ptrs: [{ i: 0, label: "head tail" }] });
      let tail = 0, len = 1;
      while (next[tail] !== -1) { tail = next[tail]; len++; frames.push({ note: `tail steps to ${vals[tail]}, n = ${len}${next[tail] === -1 ? ": that is the old tail" : ""}`, next: [...next], ptrs: [{ i: 0, label: "head" }, { i: tail, label: "tail" }], tones: { [tail]: "active" } }); }
      const k = K % len;
      next[tail] = 0;
      frames.push({ note: `k % n = ${k}. Close the ring: tail.next = head`, next: [...next], ptrs: [{ i: 0, label: "head" }, { i: tail, label: "tail" }], tones: { [tail]: "active", 0: "active" } });
      let nt = 0;
      for (let s = 0; s < len - k - 1; s++) nt = next[nt];
      frames.push({ note: `Walk n - k - 1 = ${len - k - 1} steps from the head: the new tail is ${vals[nt]}, and its next ${vals[next[nt]]} is the new head`, next: [...next], ptrs: [{ i: nt, label: "new tail" }, { i: next[nt], label: "new head" }], tones: { [nt]: "active", [next[nt]]: "found" } });
      const nh = next[nt]; next[nt] = -1;
      frames.push({ note: `Cut the ring: new_tail.next = null. Result ${walkFrom(next, vals, nh).join(" → ")}`, next: [...next], ptrs: [{ i: nh, label: "head" }], tones: T(vals.map((_, i): [number, Tone] => [i, "done"])) });
      return list(`rotateRight(k = ${K})`, vals, frames);
    },
  },

  "insertion-sort-list": {
    approach: "Build a sorted list behind a dummy: detach each node in turn and splice it in after the last sorted node smaller than it.",
    idea: ["The dummy heads the sorted part, which starts empty; cur walks the original list.", "Save nxt = cur.next before moving cur, because cur's next pointer is about to change.", "From the dummy, step prev while prev.next.val < cur.val. Then cur goes between prev and prev.next.", "Using < keeps equal values in their original order, so the sort is stable.", "Each search can scan the whole sorted part, so it is O(n²) in the worst case. It is O(n) when every node lands at the front, as with input in descending order. No new nodes are made."],
    code: `def insertionSortList(head):
    dummy = ListNode(0)             # head of the sorted part
    cur = head
    while cur:
        nxt = cur.next
        prev = dummy
        while prev.next and prev.next.val < cur.val:
            prev = prev.next        # find where cur belongs
        cur.next = prev.next
        prev.next = cur
        cur = nxt
    return dummy.next`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const body = [4, 2, 5, 1, 3], vals: (string | number)[] = ["D", ...body], n = vals.length, next = chain(n, [1, 2, 3, 4, 5]), frames: ListFrame[] = [];
      next[0] = -1;
      const sortedSet = new Set<number>();
      const tones = (extra: [number, Tone][] = []) => T([[0, "muted"], ...[...sortedSet].map((s): [number, Tone] => [s, "done"]), ...extra]);
      frames.push({ note: "The dummy D heads an empty sorted list. cur walks the original list from 4", next: [...next], ptrs: [{ i: 0, label: "dummy" }, { i: 1, label: "cur" }], tones: tones() });
      let cur = 1;
      while (cur !== -1) {
        const nx = next[cur]; let prev = 0, steps = 0;
        while (next[prev] !== -1 && (vals[next[prev]] as number) < (vals[cur] as number)) { prev = next[prev]; steps++; }
        next[cur] = next[prev]; next[prev] = cur; sortedSet.add(cur);
        frames.push({ note: `cur = ${vals[cur]}: save nxt, step prev ${steps} time${steps === 1 ? "" : "s"} past smaller values, splice it after ${prev === 0 ? "D" : vals[prev]}. Sorted: ${walkFrom(next, vals, next[0]).join(" → ")}`, next: [...next], ptrs: [{ i: prev, label: "prev" }, ...(nx !== -1 ? [{ i: nx, label: "next cur" }] : [])], tones: tones([[cur, "found"]]) });
        cur = nx;
      }
      frames.push({ note: `The original list is used up. Return dummy.next: ${walkFrom(next, vals, next[0]).join(" → ")}`, next: [...next], ptrs: [{ i: next[0], label: "head" }], tones: tones() });
      return list("insertionSortList", vals, frames);
    },
  },
};

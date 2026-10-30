// Hand-written solutions for the slugs listed under "pattern4" in batches.json (questions from the pattern practice lists). See arrays.ts for the style.
import type { CellsFrame, Diagram, IntervalsFrame, ListFrame, Mark, StackFrame, TableFrame, Tone, TreeFrame } from "../diagram";
import { anagramCount, bin, brackets, fastSlow, histogram, minStack, range, removeDups, reorderList, reverseList, reverseString, rpn, trieWildcard, wordSearchGrid, type TNode } from "../sim.ts";
import type { Solution } from "./types";

const cells = (title: string, rows: (string | number)[][], frames: CellsFrame[], rowLabels?: string[]): Diagram => ({ kind: "cells", title, rows, rowLabels, frames });
const list = (title: string, values: (string | number)[], frames: ListFrame[]): Diagram => ({ kind: "list", title, values, frames });
const chain = (n: number) => Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
const ptrs = (p: Record<string, number>): Mark[] => Object.entries(p).filter(([, i]) => i >= 0).map(([label, i]) => ({ i, label }));
const lf = (note: string, next: number[], p: Record<string, number>, tones?: Record<number, Tone>): ListFrame => ({ note, next: [...next], ptrs: ptrs(p), tones });
const all = (keys: (string | number)[], t: Tone) => Object.fromEntries(keys.map((k) => [k, t])) as Record<string, Tone>;
const iv = (a: number[]) => `[${a.join(",")}]`;
const tree = (title: string, nodes: TNode[], frames: TreeFrame[]): Diagram => ({ kind: "tree", title, nodes, frames });
// Search trees built while recursing: unvisited nodes muted, the current one toned, earlier active ones done.
type Step = { id: number; note: string; tone: Tone };
const dfsTree = (title: string, nodes: TNode[], steps: Step[]): Diagram => {
  const t: Record<number, Tone> = all(nodes.map((n) => n.id), "muted"); let last = -1;
  return tree(title, nodes, steps.map(({ id, note, tone }) => { if (last >= 0 && t[last] === "active") t[last] = "done"; t[id] = tone; last = id; return { note, tones: { ...t } }; }));
};

export const PATTERN4: Record<string, Solution> = {
  "minimum-interval-to-include-each-query": {
    approach: "Answer queries in sorted order; push every interval that has started into a min-heap keyed by size and pop the ones that already ended.",
    idea: ["Sort intervals by start and visit queries from small to large.", "Before answering q, push every interval with start <= q as (size, end).", "Pop from the heap while its smallest interval ends before q: it can never cover a later query either.", "The heap top is now the smallest interval covering q, or there is none (-1)."],
    code: `import heapq
def minInterval(intervals, queries):
    intervals.sort()
    heap, best, i = [], {}, 0
    for q in sorted(set(queries)):
        while i < len(intervals) and intervals[i][0] <= q:
            l, r = intervals[i]
            heapq.heappush(heap, (r - l + 1, r))
            i += 1
        while heap and heap[0][1] < q:
            heapq.heappop(heap)
        best[q] = heap[0][0] if heap else -1
    return [best[q] for q in queries]`,
    lang: "python", time: "O((n + q) log n)", space: "O(n + q)",
    viz: () => {
      const items: [number, number][] = [[1, 4], [2, 4], [3, 6], [4, 4]], frames: IntervalsFrame[] = [], heap: number[] = [], gone = new Set<number>(); let i = 0;
      const size = (k: number) => items[k][1] - items[k][0] + 1;
      frames.push({ note: "Intervals sorted by start; queries handled in increasing order so each interval is pushed once", tones: all(items.map((_, k) => k), "muted") });
      for (const q of [2, 3, 4, 5]) {
        const pushed: number[] = [], dropped: number[] = [];
        while (i < items.length && items[i][0] <= q) { heap.push(i); pushed.push(i); i++; }
        heap.sort((a, b) => size(a) - size(b) || items[a][1] - items[b][1]);
        while (heap.length && items[heap[0]][1] < q) { const k = heap.shift()!; gone.add(k); dropped.push(k); }
        const top = heap.length ? heap[0] : -1, tones: Record<number, Tone> = {};
        items.forEach((_, k) => (tones[k] = heap.includes(k) ? "window" : "muted"));
        dropped.forEach((k) => (tones[k] = "bad")); if (top >= 0) tones[top] = "found";
        frames.push({ note: `q = ${q}: ${pushed.length ? `push ${pushed.map((k) => iv(items[k])).join(", ")}` : "no new interval starts"}${dropped.length ? `; pop ${dropped.map((k) => iv(items[k])).join(", ")} (ended before ${q})` : ""}. Heap top size = ${top >= 0 ? size(top) : -1}`, line: q, tones });
      }
      return { kind: "intervals", title: "Queries 2, 3, 4, 5 → [3, 3, 1, 4]", items, frames };
    },
  },

  "video-stitching": {
    approach: "Jump game on time: for each second keep the furthest end reachable from a clip starting there, and take a new clip only when the current one runs out.",
    idea: ["furthest[s] = the longest clip end among clips starting at s.", "Walk t from 0 to time - 1 keeping far = the best end seen so far.", "When t reaches the end of the clips chosen so far, choose one more clip, jumping end to far.", "If far cannot pass t at that moment there is a gap, so return -1."],
    code: `def videoStitching(clips, time):
    furthest = [0] * time
    for s, e in clips:
        if s < time:
            furthest[s] = max(furthest[s], e)
    count = end = far = 0
    for t in range(time):
        far = max(far, furthest[t])
        if t == end:
            if far <= t:
                return -1
            count += 1
            end = far
    return count`,
    lang: "python", time: "O(n + time)", space: "O(time)",
    viz: () => {
      const clips = [[0, 2], [4, 6], [8, 10], [1, 9], [1, 5], [5, 9]], T = 10, fur = Array(T).fill(0), frames: CellsFrame[] = [];
      clips.forEach(([s, e]) => { if (s < T) fur[s] = Math.max(fur[s], e); });
      const idx = fur.map((_, i) => i); let count = 0, end = 0, far = 0;
      frames.push({ note: `furthest[s] from clips ${clips.map(iv).join(" ")}`, tones: {} });
      for (let t = 0; t < T; t++) {
        far = Math.max(far, fur[t]); const jump = t === end;
        if (jump) { count++; end = far; }
        frames.push({ note: jump ? `t = ${t} is the end of the clips so far → take clip #${count}, reaching ${end}` : `t = ${t}: far = max(far, ${fur[t]}) = ${far}`, tones: { [`1:${t}`]: jump ? "found" : "active", [`0:${t}`]: "active" }, marks: [{ i: t, label: "t" }, ...(end < T ? [{ i: end, label: "end", row: 1 }] : [])] });
      }
      frames.push({ note: `end = ${end} covers [0, ${T}] → ${count} clips`, tones: Object.fromEntries(idx.map((i) => [`0:${i}`, "done"])) });
      return cells(`videoStitching(time = ${T}) = ${count}`, [idx, fur], frames, ["t", "furthest"]);
    },
  },

  "range-module": {
    approach: "Keep one sorted list of boundaries [s0, e0, s1, e1, ...]; bisect finds the slice a new range replaces, and the parity of an index says whether it is inside a range.",
    idea: ["An even position starts a tracked range and an odd one ends it, so a point is tracked when bisect_right lands on an odd index.", "addRange: every boundary inside [left, right] disappears; keep left only if it falls outside a range (even index), same for right.", "removeRange is the mirror: keep left or right only where they fall inside a range (odd index).", "queryRange: left and right must land in the same odd slot, meaning one range covers both."],
    code: `import bisect
class RangeModule:
    def __init__(self):
        self.pts = []

    def addRange(self, left, right):
        i = bisect.bisect_left(self.pts, left)
        j = bisect.bisect_right(self.pts, right)
        self.pts[i:j] = [left] * (i % 2 == 0) + [right] * (j % 2 == 0)

    def queryRange(self, left, right):
        i = bisect.bisect_right(self.pts, left)
        j = bisect.bisect_left(self.pts, right)
        return i == j and i % 2 == 1

    def removeRange(self, left, right):
        i = bisect.bisect_left(self.pts, left)
        j = bisect.bisect_right(self.pts, right)
        self.pts[i:j] = [left] * (i % 2 == 1) + [right] * (j % 2 == 1)`,
    lang: "python", time: "O(n) per update, O(log n) per query", space: "O(n)",
    viz: () => {
      const ops: [string, number, number][] = [["add", 10, 20], ["remove", 14, 16], ["query", 10, 14], ["query", 13, 15], ["query", 16, 17], ["add", 20, 25]];
      const pts: number[] = [], frames: IntervalsFrame[] = [];
      const bl = (x: number) => { let k = 0; while (k < pts.length && pts[k] < x) k++; return k; }, br = (x: number) => { let k = 0; while (k < pts.length && pts[k] <= x) k++; return k; };
      const res = () => Array.from({ length: pts.length / 2 }, (_, k) => [pts[2 * k], pts[2 * k + 1]] as [number, number]);
      ops.forEach(([op, l, r], k) => {
        let note: string;
        if (op === "query") { const i = br(l), j = bl(r), ok = i === j && i % 2 === 1; note = `queryRange(${l}, ${r}): left lands in slot ${i}, right in slot ${j} → ${ok ? "same odd slot, true" : "false"}`; frames.push({ note, tones: { [k]: ok ? "found" : "bad" }, result: res() }); return; }
        const i = bl(l), j = br(r), keep = op === "add" ? 0 : 1, ins = [...(i % 2 === keep ? [l] : []), ...(j % 2 === keep ? [r] : [])];
        pts.splice(i, j - i, ...ins);
        frames.push({ note: `${op}Range(${l}, ${r}): replace pts[${i}:${j}] with [${ins.join(", ")}] → boundaries [${pts.join(", ")}]`, tones: { [k]: "active" }, result: res() });
      });
      return { kind: "intervals", title: "Range module: one sorted boundary list", items: ops.map(([, l, r]) => [l, r] as [number, number]), frames };
    },
  },

  "linked-list-cycle": {
    approach: "Floyd: slow moves one step, fast moves two; they meet only if the list loops.",
    idea: ["Without a cycle fast reaches null first.", "With a cycle both pointers end up circling it, and fast gains one node per step on slow, so it must land on slow.", "No extra memory: two pointers instead of a visited set."],
    code: `def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
        if slow is fast:
            return True
    return False`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [3, 2, 0, -4, 5, 7], next = [1, 2, 3, 4, 5, 1], frames: ListFrame[] = []; let s = 0, f = 0;
      frames.push(lf("Tail 7 links back to 2. slow and fast start at the head", next, { "slow fast": 0 }));
      do {
        s = next[s]; f = next[next[f]];
        frames.push(lf(s === f ? `Both on ${vals[s]} → cycle found` : `slow +1 → ${vals[s]}, fast +2 → ${vals[f]}`, next, s === f ? { "slow fast": s } : { slow: s, fast: f }, { [s]: s === f ? "found" : "active", [f]: s === f ? "found" : "window" }));
      } while (s !== f);
      return list("hasCycle = true", vals, frames);
    },
  },

  "middle-of-the-linked-list": {
    approach: "Fast moves two nodes per step, slow one; when fast runs off the end slow is in the middle.",
    idea: ["After k steps slow has moved k nodes and fast 2k.", "Fast stops when it or its next is null, which is when slow has covered half the list.", "With an even count this lands on the second middle, which is what the problem asks for."],
    code: `def middleNode(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    return slow`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => fastSlow([1, 2, 3, 4, 5, 6]),
  },

  "remove-nth-node-from-end-of-list": {
    approach: "Move fast n nodes ahead of slow, then move both until fast is on the last node: slow sits just before the node to delete.",
    idea: ["A dummy node before the head makes deleting the head the same as any other node.", "Keep a gap of n nodes between fast and slow.", "When fast.next is null, slow.next is the n-th node from the end: skip over it."],
    code: `def removeNthFromEnd(head, n):
    dummy = ListNode(0, head)
    fast = slow = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        fast, slow = fast.next, slow.next
    slow.next = slow.next.next
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = ["d", 1, 2, 3, 4, 5], n = 2, next = chain(6), frames: ListFrame[] = []; let f = 0, s = 0;
      frames.push(lf(`Dummy d before the head. Remove the ${n}nd node from the end`, next, { "slow fast": 0 }));
      for (let k = 1; k <= n; k++) { f = next[f]; frames.push(lf(`fast moves ahead (${k} of ${n})`, next, { slow: s, fast: f }, { [f]: "active" })); }
      while (next[f] !== -1) { f = next[f]; s = next[s]; frames.push(lf(`Both move, gap stays ${n}`, next, { slow: s, fast: f }, { [s]: "window", [f]: "active" })); }
      const gone = next[s]; next[s] = next[gone]; next[gone] = -1;
      frames.push(lf(`fast is last → slow.next (${vals[gone]}) is the target: slow.next = slow.next.next`, next, { slow: s }, { [gone]: "bad" }));
      return list("removeNthFromEnd([1,2,3,4,5], 2) = [1,2,3,5]", vals, frames);
    },
  },

  "intersection-of-two-linked-lists": {
    approach: "Walk pointer a along A then B, and b along B then A; both travel the same total length, so they meet at the shared node (or both reach null).",
    idea: ["Let A = a + c and B = b + c, where c is the shared tail.", "Pointer a walks a + c + b nodes before entering the tail a second time; pointer b walks b + c + a. Same count.", "So after the switch they line up and step onto the first shared node together. With no shared node they reach null together."],
    code: `def getIntersectionNode(headA, headB):
    a, b = headA, headB
    while a is not b:
        a = a.next if a else headB
        b = b.next if b else headA
    return a`,
    lang: "python", time: "O(m + n)", space: "O(1)",
    viz: () => {
      const vals = [4, 1, 8, 4, 5, 5, 6, 1], next = [1, 2, 3, 4, -1, 6, 7, 2], hA = 0, hB = 5, frames: ListFrame[] = [];
      const step = (p: number, other: number) => (p === -1 ? other : next[p]);
      let a = hA, b = hB;
      frames.push(lf("A = 4,1 then shared 8,4,5. B = 5,6,1 then the same shared nodes", next, { a, b }, { 2: "window", 3: "window", 4: "window" }));
      while (a !== b) {
        a = step(a, hB); b = step(b, hA);
        const say = (n: string, p: number, h: string) => (p === -1 ? `${n} hits null` : `${n} on ${vals[p]}${p === (h === "B" ? hB : hA) ? ` (switched to head${h})` : ""}`);
        frames.push(lf(a === b ? `Both on the same node ${vals[a]} → intersection` : `${say("a", a, "B")}, ${say("b", b, "A")}`, next, { a, b }, a === b ? { [a]: "found" } : { ...(a >= 0 ? { [a]: "active" } : {}), ...(b >= 0 ? { [b]: "window" } : {}) }));
      }
      return list("Intersection at 8", vals, frames);
    },
  },

  "reverse-linked-list": {
    approach: "Walk once, flipping each next pointer to the previous node.",
    idea: ["Keep prev (already reversed part) and curr (rest of the list).", "Save curr.next, point curr at prev, then move both one step.", "When curr is null, prev is the new head."],
    code: `def reverseList(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => reverseList([1, 2, 3, 4, 5]),
  },

  "reverse-linked-list-ii": {
    approach: "Stop at the node before position left, then move each following node of the section to the front of the section, one at a time.",
    idea: ["A dummy head handles left = 1.", "prev stays before the section and cur stays on the node that started it (it drifts to the end).", "right - left times: take the node after cur, unlink it, and insert it right after prev."],
    code: `def reverseBetween(head, left, right):
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next
    cur = prev.next
    for _ in range(right - left):
        nxt = cur.next
        cur.next = nxt.next
        nxt.next = prev.next
        prev.next = nxt
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = ["d", 1, 2, 3, 4, 5], next = chain(6), L = 2, R = 4, frames: ListFrame[] = []; let prev = 0;
      for (let k = 0; k < L - 1; k++) prev = next[prev];
      const cur = next[prev];
      frames.push(lf(`prev stops before position ${L}; cur = ${vals[cur]} starts the section`, next, { prev, cur }, { [cur]: "window" }));
      for (let k = 0; k < R - L; k++) {
        const nx = next[cur]; next[cur] = next[nx]; next[nx] = next[prev]; next[prev] = nx;
        const order: (string | number)[] = []; for (let p = next[0]; p !== -1; p = next[p]) order.push(vals[p]);
        frames.push(lf(`Move ${vals[nx]} to the front of the section → ${order.join(" → ")}`, next, { prev, cur, moved: nx }, { [nx]: "found", [cur]: "window" }));
      }
      frames.push(lf(`${R - L} moves reverse positions ${L}..${R}; cur (${vals[cur]}) ends up last and still links to the rest`, next, { prev, cur }, all([2, 3, 4], "done")));
      return list("reverseBetween([1,2,3,4,5], 2, 4) = [1,4,3,2,5]", vals, frames);
    },
  },

  "reverse-nodes-in-k-group": {
    approach: "Check that k nodes remain, reverse exactly those k in place, splice them back between the previous group and the next one, repeat.",
    idea: ["groupPrev is the node before the current group (a dummy at first).", "Walk k nodes to find kth; if the list ends first, leave the rest as is.", "Reverse the group with its last node pointing at the node after kth.", "groupPrev.next becomes kth, and the old first node becomes the new groupPrev."],
    code: `def reverseKGroup(head, k):
    dummy = ListNode(0, head)
    group_prev = dummy
    while True:
        kth = group_prev
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next
        group_next = kth.next
        prev, cur = group_next, group_prev.next
        while cur is not group_next:
            cur.next, prev, cur = prev, cur, cur.next
        first = group_prev.next
        group_prev.next = kth
        group_prev = first`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = ["d", 1, 2, 3, 4, 5], next = chain(6), k = 2, frames: ListFrame[] = []; let gp = 0;
      const done: number[] = [];
      for (;;) {
        let kth = gp, c = 0; while (c < k && kth !== -1) { kth = next[kth]; c++; }
        if (kth === -1) { frames.push(lf("Fewer than k nodes left → leave them as they are", next, { groupPrev: gp }, all(done, "done"))); break; }
        const gn = next[kth], first = next[gp];
        frames.push(lf(`k = ${k} nodes found: ${vals[first]} .. ${vals[kth]}`, next, { groupPrev: gp, kth }, all(Array.from({ length: k }, (_, j) => first + j), "window")));
        let prev = gn, cur = first;
        while (cur !== gn) { const nx = next[cur]; next[cur] = prev; prev = cur; cur = nx; }
        next[gp] = kth; done.push(first, kth);
        frames.push(lf(`Reversed and spliced: groupPrev → ${vals[kth]}, ${vals[first]} → ${gn === -1 ? "null" : vals[gn]}`, next, { groupPrev: gp, newPrev: first }, { ...all(done, "done"), [kth]: "found" }));
        gp = first;
      }
      return list("reverseKGroup([1,2,3,4,5], 2) = [2,1,4,3,5]", vals, frames);
    },
  },

  "palindrome-linked-list": {
    approach: "Find the middle with fast and slow, reverse the second half in place, then walk both halves comparing values.",
    idea: ["Fast moves two steps per slow step, so slow stops at the middle.", "Reverse the list from slow onward; its last node now points back toward the middle.", "Walk from the head and from the reversed tail together; any mismatch means not a palindrome.", "O(1) extra space instead of copying the values into an array."],
    code: `def isPalindrome(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    prev = None
    while slow:
        slow.next, prev, slow = prev, slow, slow.next
    while prev:
        if prev.val != head.val:
            return False
        prev, head = prev.next, head.next
    return True`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [1, 2, 3, 2, 1], next = chain(5), frames: ListFrame[] = []; let s = 0, f = 0;
      while (f !== -1 && next[f] !== -1) { s = next[s]; f = next[next[f]]; frames.push(lf(`slow +1, fast +2${f === -1 || next[f] === -1 ? ` → fast is done, middle = ${vals[s]}` : ""}`, next, { slow: s, fast: f }, { [s]: "active" })); }
      let prev = -1, cur = s;
      while (cur !== -1) { const nx = next[cur]; next[cur] = prev; prev = cur; cur = nx; frames.push(lf(`Reverse the second half: ${vals[prev]} now points back`, next, { prev, ...(cur >= 0 ? { cur } : {}) }, { [prev]: "window" })); }
      let a = 0, b = prev;
      while (b !== -1) { const same = vals[a] === vals[b]; frames.push(lf(`Compare ${vals[a]} and ${vals[b]} → ${same ? "equal" : "different, not a palindrome"}`, next, { left: a, right: b }, { [a]: same ? "found" : "bad", [b]: same ? "found" : "bad" })); a = next[a]; b = next[b]; }
      frames.push(lf("Every pair matched → true", next, {}, all([0, 1, 2, 3, 4], "done")));
      return list("isPalindrome([1,2,3,2,1]) = true", vals, frames);
    },
  },

  "reorder-list": {
    approach: "Three list moves: find the middle, reverse the second half, then weave the two halves together.",
    idea: ["Fast and slow pointers split the list at the middle.", "Reverse the second half so its last node comes first.", "Alternate one node from each half: L0, Ln, L1, Ln-1, ...", "All in place: O(1) extra space."],
    code: `def reorderList(head):
    slow = fast = head
    while fast.next and fast.next.next:
        slow, fast = slow.next, fast.next.next
    second, slow.next = slow.next, None
    prev = None
    while second:
        second.next, prev, second = prev, second, second.next
    first, second = head, prev
    while second:
        n1, n2 = first.next, second.next
        first.next, second.next = second, n1
        first, second = n1, n2`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => reorderList([1, 2, 3, 4, 5]),
  },

  "partition-list": {
    approach: "Two dummy lists: append each node to 'less than x' or 'at least x', then link the first list's tail to the second's head.",
    idea: ["Walking once and appending keeps the original order inside each group.", "Dummy heads avoid special cases for empty groups.", "Cut the tail of the big list (its last node may still point somewhere) and join small → big."],
    code: `def partition(head, x):
    small = s = ListNode()
    big = b = ListNode()
    while head:
        if head.val < x:
            s.next = head
            s = s.next
        else:
            b.next = head
            b = b.next
        head = head.next
    b.next = None
    s.next = big.next
    return small.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const a = [1, 4, 3, 2, 5, 2], x = 3, lo: number[] = [], hi: number[] = [], frames: CellsFrame[] = [];
      const pad = (r: number[]) => [...r, ...Array(a.length - r.length).fill("")];
      a.forEach((v, i) => {
        (v < x ? lo : hi).push(v);
        frames.push({ note: `${v} ${v < x ? `< ${x} → append to small` : `>= ${x} → append to big`}`, rows: [a, pad(lo), pad(hi)], tones: { [`0:${i}`]: "active", ...(v < x ? { [`1:${lo.length - 1}`]: "found" } : { [`2:${hi.length - 1}`]: "window" }) } });
      });
      const out = [...lo, ...hi];
      frames.push({ note: `Link small's tail to big's head → [${out.join(",")}]`, rows: [out, pad([]), pad([])], tones: { ...Object.fromEntries(lo.map((_, i) => [`0:${i}`, "found"])), ...Object.fromEntries(hi.map((_, i) => [`0:${lo.length + i}`, "window"])) } });
      return cells(`partition([1,4,3,2,5,2], ${x})`, [a, pad([]), pad([])], frames, ["list", "small", "big"]);
    },
  },

  "remove-duplicates-from-sorted-list": {
    approach: "Sorted means duplicates sit next to each other: while the next node has the same value, skip it.",
    idea: ["Stand on a node and compare it with its next.", "Equal values: splice the next node out and stay put (there may be more copies).", "Different value: move forward."],
    code: `def deleteDuplicates(head):
    cur = head
    while cur and cur.next:
        if cur.val == cur.next.val:
            cur.next = cur.next.next
        else:
            cur = cur.next
    return head`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => removeDups([1, 1, 2, 3, 3]),
  },

  "remove-duplicates-from-sorted-list-ii": {
    approach: "Keep prev on the last node known to be unique; when a run of equal values starts, skip the whole run and link prev past it.",
    idea: ["A dummy head lets the real head be deleted too.", "If head and head.next share a value, advance head to the end of that run and set prev.next to the node after it.", "Otherwise the node is unique, so prev moves onto it."],
    code: `def deleteDuplicates(head):
    dummy = ListNode(0, head)
    prev = dummy
    while head:
        if head.next and head.val == head.next.val:
            while head.next and head.val == head.next.val:
                head = head.next
            prev.next = head.next
        else:
            prev = prev.next
        head = head.next
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = ["d", 1, 2, 3, 3, 4, 4, 5], next = chain(8), frames: ListFrame[] = [], gone: number[] = []; let prev = 0, h = 1;
      while (h !== -1) {
        if (next[h] !== -1 && vals[h] === vals[next[h]]) {
          const start = h; while (next[h] !== -1 && vals[h] === vals[next[h]]) h = next[h];
          for (let k = start; k <= h; k++) gone.push(k);
          next[prev] = next[h];
          frames.push(lf(`Run of ${vals[start]}s → skip it all: prev.next = ${next[h] === -1 ? "null" : vals[next[h]]}`, next, { prev, head: h }, all(gone, "bad")));
        } else { prev = h; frames.push(lf(`${vals[h]} differs from its next → unique, prev moves onto it`, next, { prev, head: h }, { ...all(gone, "muted"), [h]: "found" })); }
        h = next[h];
      }
      return list("deleteDuplicates([1,2,3,3,4,4,5]) = [1,2,5]", vals, frames);
    },
  },

  "add-two-numbers": {
    approach: "Add digit by digit from the head (the ones place), carrying into the next node, exactly like column addition.",
    idea: ["The lists store digits in reverse, so the heads line up as the ones digits.", "At each step sum = carry + digit of l1 + digit of l2 (0 if a list ran out).", "Write sum % 10 and carry sum // 10; keep going while either list or the carry remains."],
    code: `def addTwoNumbers(l1, l2):
    dummy = cur = ListNode()
    carry = 0
    while l1 or l2 or carry:
        total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
        carry, digit = divmod(total, 10)
        cur.next = ListNode(digit)
        cur = cur.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next`,
    lang: "python", time: "O(max(m, n))", space: "O(max(m, n))",
    viz: () => {
      const A = [9, 9, 9, 9], B = [9, 9, 9], W = 5, frames: CellsFrame[] = [], out: (string | number)[] = Array(W).fill(""), cr: (string | number)[] = Array(W).fill("");
      const row = (x: number[]) => [...x, ...Array(W - x.length).fill("")]; let carry = 0;
      for (let i = 0; i < W && (i < A.length || i < B.length || carry); i++) {
        const t = carry + (A[i] ?? 0) + (B[i] ?? 0); cr[i] = carry; carry = Math.floor(t / 10); out[i] = t % 10;
        frames.push({ note: `${cr[i]} + ${A[i] ?? 0} + ${B[i] ?? 0} = ${t} → write ${t % 10}, carry ${carry}`, rows: [row(A), row(B), [...cr], [...out]], tones: { [`0:${i}`]: "active", [`1:${i}`]: "active", [`3:${i}`]: "found" } });
      }
      frames.push({ note: `9999 + 999 = 10998, stored reversed as [${out.join(",")}]`, rows: [row(A), row(B), [...cr], [...out]], tones: Object.fromEntries(out.map((_, i) => [`3:${i}`, "done"])) });
      return cells("addTwoNumbers([9,9,9,9], [9,9,9])", [row(A), row(B), Array(W).fill(""), Array(W).fill("")], frames, ["l1", "l2", "carry in", "result"]);
    },
  },

  "copy-list-with-random-pointer": {
    approach: "Two passes with a map from each original node to its copy: first create every copy, then wire copy.next and copy.random through the map.",
    idea: ["A random pointer can point forward to a node not copied yet, so create all copies first.", "Map old → new (and None → None so missing pointers need no special case).", "Second pass: copy.next = map[old.next], copy.random = map[old.random]."],
    code: `def copyRandomList(head):
    copy = {None: None}
    cur = head
    while cur:
        copy[cur] = Node(cur.val)
        cur = cur.next
    cur = head
    while cur:
        copy[cur].next = copy[cur.next]
        copy[cur].random = copy[cur.random]
        cur = cur.next
    return copy[head]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const vals = [7, 13, 11, 10, 1], rnd = [-1, 0, 4, 2, 0], n = 5, frames: TableFrame[] = [];
      const c: (string | number | null)[][] = vals.map((v, i) => [v, i + 1 < n ? vals[i + 1] : "null", rnd[i] < 0 ? "null" : vals[rnd[i]], null, null, null]);
      const snap = () => c.map((r) => [...r]);
      frames.push({ note: "Original list: val, next and random of each node", cells: snap() });
      for (let i = 0; i < n; i++) { c[i][3] = `${vals[i]}'`; frames.push({ note: `Pass 1: create copy ${vals[i]}' and store ${vals[i]} → ${vals[i]}'`, cells: snap(), active: [i, 3] }); }
      for (let i = 0; i < n; i++) {
        c[i][4] = i + 1 < n ? `${vals[i + 1]}'` : "null"; c[i][5] = rnd[i] < 0 ? "null" : `${vals[rnd[i]]}'`;
        frames.push({ note: `Pass 2: ${vals[i]}'.next = map[${c[i][1]}] = ${c[i][4]}, ${vals[i]}'.random = map[${c[i][2]}] = ${c[i][5]}`, cells: snap(), active: [i, 5], deps: [[i, 1], [i, 2]] });
      }
      return { kind: "table", title: "Deep copy through an old → new map", rowHead: vals.map(String), colHead: ["val", "next", "random", "copy", "copy.next", "copy.random"], frames };
    },
  },

  "maximum-twin-sum-of-a-linked-list": {
    approach: "Reverse the second half, then walk the first half and the reversed half together: each step pairs node i with its twin n - 1 - i.",
    idea: ["Fast and slow pointers stop slow at the start of the second half.", "Reversing that half makes the last node come first.", "Sum the pairs while walking both halves and keep the maximum."],
    code: `def pairSum(head):
    slow = fast = head
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next
    prev = None
    while slow:
        slow.next, prev, slow = prev, slow, slow.next
    best = 0
    while prev:
        best = max(best, head.val + prev.val)
        head, prev = head.next, prev.next
    return best`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = [5, 4, 2, 1, 7, 3], next = chain(6), frames: ListFrame[] = []; let s = 0, f = 0;
      while (f !== -1 && next[f] !== -1) { s = next[s]; f = next[next[f]]; }
      frames.push(lf(`Fast and slow: second half starts at ${vals[s]}`, next, { slow: s }, all([3, 4, 5], "window")));
      let prev = -1, cur = s;
      while (cur !== -1) { const nx = next[cur]; next[cur] = prev; prev = cur; cur = nx; }
      frames.push(lf("Reverse the second half: 3 → 7 → 1", next, { prev }, all([3, 4, 5], "window")));
      let a = 0, b = prev, best = 0;
      while (b !== -1) { best = Math.max(best, vals[a] + vals[b]); frames.push(lf(`Twins ${vals[a]} + ${vals[b]} = ${vals[a] + vals[b]}, best = ${best}`, next, { head: a, prev: b }, { [a]: "found", [b]: "found" })); a = next[a]; b = next[b]; }
      return list(`pairSum([5,4,2,1,7,3]) = ${best}`, vals, frames);
    },
  },

  "remove-nodes-from-linked-list": {
    approach: "Monotonic stack: a node survives only if nothing greater comes after it, so pop smaller nodes whenever a larger value arrives.",
    idea: ["Walk left to right pushing nodes.", "Before pushing, pop every node with a smaller value: the new node is greater and to its right, so those must go.", "The stack is non-increasing; relink its nodes in order."],
    code: `def removeNodes(head):
    stack = []
    while head:
        while stack and stack[-1].val < head.val:
            stack.pop()
        stack.append(head)
        head = head.next
    for a, b in zip(stack, stack[1:]):
        a.next = b
    stack[-1].next = None
    return stack[0]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [5, 2, 13, 3, 8], st: number[] = [], frames: StackFrame[] = [];
      for (const v of a) {
        const popped: number[] = []; while (st.length && st[st.length - 1] < v) popped.push(st.pop()!);
        st.push(v);
        frames.push({ note: popped.length ? `${v} is greater than ${popped.join(", ")} on its left → remove them, push ${v}` : `Push ${v}; stack stays non-increasing`, items: [...st], incoming: v, popped });
      }
      frames.push({ note: `Relink the stack bottom to top → [${st.join(",")}]`, items: [...st] });
      return { kind: "stack", title: "removeNodes([5,2,13,3,8]) = [13,8]", input: a, frames };
    },
  },

  "n-th-tribonacci-number": {
    approach: "Bottom-up DP with only the last three values: T(n) = T(n-1) + T(n-2) + T(n-3).",
    idea: ["Start with T0 = 0, T1 = 1, T2 = 1.", "Each step shifts the window of three and appends their sum.", "After n shifts the first slot holds T(n). O(1) space."],
    code: `def tribonacci(n):
    a, b, c = 0, 1, 1
    for _ in range(n):
        a, b, c = b, c, a + b + c
    return a`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const n = 7, T: (string | number)[] = [0, 1, 1, ...Array(n - 2).fill("")], frames: CellsFrame[] = [];
      frames.push({ note: "Base values T0 = 0, T1 = 1, T2 = 1", rows: [[...T]], tones: range(0, 0 + 2) });
      for (let i = 3; i <= n; i++) { T[i] = (T[i - 1] as number) + (T[i - 2] as number) + (T[i - 3] as number); frames.push({ note: `T${i} = ${T[i - 3]} + ${T[i - 2]} + ${T[i - 1]} = ${T[i]}`, rows: [[...T]], tones: { ...range(i - 3, i - 3 + 2), [`0:${i}`]: "found" } }); }
      return cells(`tribonacci(${n}) = ${T[n]}`, [T.map(() => "")], frames);
    },
  },

  "reverse-string": {
    approach: "Two pointers from both ends swap and move inward until they meet.",
    idea: ["s[0] belongs at the end and s[-1] at the front, so swap them.", "Move both pointers one step inward and repeat.", "Stop when they meet: n/2 swaps, in place."],
    code: `def reverseString(s):
    l, r = 0, len(s) - 1
    while l < r:
        s[l], s[r] = s[r], s[l]
        l, r = l + 1, r - 1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => reverseString("hello"),
  },

  "unique-binary-search-trees-ii": {
    approach: "Pick each value as the root; every left subtree from the smaller values pairs with every right subtree from the larger ones. Memoise by (lo, hi).",
    idea: ["build(lo, hi) returns every BST holding exactly lo..hi; an empty range gives [None].", "For root r: left choices come from build(lo, r - 1), right choices from build(r + 1, hi).", "Each (left, right) pair makes one tree, so the count is a sum of products (the Catalan numbers).", "The same range is asked for many times, so cache it."],
    code: `from functools import lru_cache
def generateTrees(n):
    @lru_cache(None)
    def build(lo, hi):
        if lo > hi:
            return [None]
        out = []
        for root in range(lo, hi + 1):
            for left in build(lo, root - 1):
                for right in build(root + 1, hi):
                    out.append(TreeNode(root, left, right))
        return out
    return list(build(1, n))`,
    lang: "python", time: "O(Catalan(n) · n)", space: "O(Catalan(n) · n)",
    viz: () => {
      const n = 4, memo = new Map<string, number>(), cellsOf: (string | number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null)), frames: TableFrame[] = [];
      const go = (lo: number, hi: number): number => {
        if (lo > hi) return 1; const k = `${lo},${hi}`; if (memo.has(k)) return memo.get(k)!;
        const parts: string[] = []; let total = 0;
        for (let r = lo; r <= hi; r++) { const a = go(lo, r - 1), b = go(r + 1, hi); total += a * b; parts.push(`${a}×${b}`); }
        memo.set(k, total); cellsOf[lo - 1][hi - 1] = total;
        frames.push({ note: `build(${lo}, ${hi}): roots ${lo}..${hi} give ${parts.join(" + ")} = ${total} tree${total === 1 ? "" : "s"}`, cells: cellsOf.map((r) => [...r]), active: [lo - 1, hi - 1] });
        return total;
      };
      go(1, n);
      frames.push({ note: `build(1, ${n}) = ${memo.get(`1,${n}`)} trees; each smaller range was built once and shared`, cells: cellsOf.map((r) => [...r]), active: [0, n - 1] });
      return { kind: "table", title: "Trees per range: rows lo, columns hi", rowHead: ["lo 1", "lo 2", "lo 3", "lo 4"], colHead: ["hi 1", "hi 2", "hi 3", "hi 4"], frames };
    },
  },

  "permutations": {
    approach: "Backtracking: at each depth try every unused number, recurse, then undo the choice.",
    idea: ["path holds the numbers chosen so far, used marks which indices are taken.", "When path has every number, record a copy.", "Otherwise try each unused number: mark it, recurse, then unmark (backtrack).", "n choices, then n - 1, ... gives n! leaves."],
    code: `def permute(nums):
    out, path, used = [], [], [False] * len(nums)
    def dfs():
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True
                path.append(x)
                dfs()
                path.pop()
                used[i] = False
    dfs()
    return out`,
    lang: "python", time: "O(n · n!)", space: "O(n)",
    viz: () => {
      const a = [1, 2, 3], nodes: TNode[] = [], steps: Step[] = [], out: string[] = [];
      const go = (path: number[], parent: number | null) => {
        const id = nodes.length; nodes.push({ id, label: parent == null ? "[]" : String(path[path.length - 1]), parent });
        if (path.length === a.length) { out.push(path.join("")); steps.push({ id, tone: "found", note: `Full path [${path.join(",")}] → permutation #${out.length}` }); return; }
        steps.push({ id, tone: "active", note: parent == null ? "Start with an empty path" : `Path [${path.join(",")}]: try each unused number` });
        for (const x of a) if (!path.includes(x)) go([...path, x], id);
      };
      go([], null);
      return dfsTree(`permute([1,2,3]): ${out.length} leaves`, nodes, steps);
    },
  },

  "combinations": {
    approach: "Backtracking with a start index so each set is built in increasing order once; prune when too few numbers remain.",
    idea: ["Choose numbers in increasing order, so [1,2] is made but [2,1] never is.", "dfs(start) tries every next number from start upward.", "Prune: if fewer numbers remain than slots left to fill, stop early.", "When the path has k numbers, record it."],
    code: `def combine(n, k):
    out, path = [], []
    def dfs(start):
        if len(path) == k:
            out.append(path[:])
            return
        for x in range(start, n - (k - len(path)) + 2):
            path.append(x)
            dfs(x + 1)
            path.pop()
    dfs(1)
    return out`,
    lang: "python", time: "O(k · C(n, k))", space: "O(k)",
    viz: () => {
      const n = 4, k = 2, nodes: TNode[] = [], steps: Step[] = []; let cnt = 0;
      const go = (path: number[], start: number, parent: number | null) => {
        const id = nodes.length; nodes.push({ id, label: parent == null ? "[]" : String(path[path.length - 1]), parent });
        if (path.length === k) { cnt++; steps.push({ id, tone: "found", note: `[${path.join(",")}] has ${k} numbers → record (#${cnt})` }); return; }
        const last = n - (k - path.length) + 1;
        steps.push({ id, tone: "active", note: `Path [${path.join(",")}]: next number from ${start} to ${last}${last < n ? ` (higher leaves too few numbers)` : ""}` });
        for (let x = start; x <= last; x++) go([...path, x], x + 1, id);
      };
      go([], 1, null);
      return dfsTree(`combine(${n}, ${k}): ${cnt} sets`, nodes, steps);
    },
  },

  "combination-sum": {
    approach: "Backtracking over sorted candidates; reuse is allowed, so recurse from the same index, and stop the loop once a candidate exceeds what is left.",
    idea: ["dfs(start, remain): pick a candidate at index >= start so each multiset appears once.", "Recurse with the same index i because a number can be used again.", "remain == 0 records the path; a candidate larger than remain ends the loop (the rest are larger still)."],
    code: `def combinationSum(candidates, target):
    candidates.sort()
    out, path = [], []
    def dfs(start, remain):
        if remain == 0:
            out.append(path[:])
            return
        for i in range(start, len(candidates)):
            c = candidates[i]
            if c > remain:
                break
            path.append(c)
            dfs(i, remain - c)
            path.pop()
    dfs(0, target)
    return out`,
    lang: "python", time: "O(n^(target / min))", space: "O(target / min)",
    viz: () => {
      const cand = [2, 3, 6, 7], nodes: TNode[] = [], steps: Step[] = [], badges: Record<number, string> = {};
      const go = (path: number[], start: number, remain: number, parent: number | null) => {
        const id = nodes.length; nodes.push({ id, label: parent == null ? "7" : String(path[path.length - 1]), parent }); badges[id] = `left ${remain}`;
        if (remain === 0) { steps.push({ id, tone: "found", note: `[${path.join(",")}] sums to 7 → record` }); return; }
        let stop = "";
        for (let i = start; i < cand.length; i++) { if (cand[i] > remain) { stop = ` ${cand[i]} > ${remain} stops the loop.`; break; } }
        steps.push({ id, tone: path.length ? "active" : "active", note: `${path.length ? `Path [${path.join(",")}]` : "Start"}, ${remain} left: try candidates from ${cand[start]}.${stop}` });
        for (let i = start; i < cand.length && cand[i] <= remain; i++) go([...path, cand[i]], i, remain - cand[i], id);
        if (!nodes.some((x) => x.parent === id)) steps.push({ id, tone: "bad", note: `Nothing fits in ${remain} → dead end, backtrack` });
      };
      go([], 0, 7, null);
      const d = dfsTree("combinationSum([2,3,6,7], 7) = [[2,2,3],[7]]", nodes, steps);
      return d.kind === "tree" ? { ...d, frames: d.frames.map((f) => ({ ...f, badges })) } : d;
    },
  },

  "n-queens": {
    approach: "Place one queen per row; sets of used columns and both diagonals (r - c and r + c) make each safety check O(1); backtrack on a dead end.",
    idea: ["Every row gets exactly one queen, so recurse row by row.", "A square is attacked if its column, its r - c diagonal or its r + c anti-diagonal is taken.", "Place, recurse into the next row, then remove the queen and try the next column.", "Reaching row n means all queens are placed: record the board."],
    code: `def solveNQueens(n):
    out, cols, d1, d2 = [], set(), set(), set()
    board = [["."] * n for _ in range(n)]
    def place(r):
        if r == n:
            out.append(["".join(row) for row in board])
            return
        for c in range(n):
            if c in cols or r - c in d1 or r + c in d2:
                continue
            cols.add(c); d1.add(r - c); d2.add(r + c)
            board[r][c] = "Q"
            place(r + 1)
            board[r][c] = "."
            cols.remove(c); d1.remove(r - c); d2.remove(r + c)
    place(0)
    return out`,
    lang: "python", time: "O(n!)", space: "O(n)",
    viz: () => {
      const n = 4, b: (string | number | null)[][] = Array.from({ length: n }, () => Array(n).fill("")), frames: TableFrame[] = [], cols = new Set<number>(), d1 = new Set<number>(), d2 = new Set<number>();
      let solved = false;
      const snap = (note: string, active: [number, number], bad = false) => frames.push({ note, cells: b.map((r) => [...r]), active, tones: bad ? { [`${active[0]}:${active[1]}`]: "bad" } : undefined });
      const place = (r: number) => {
        if (r === n) { solved = true; return; }
        let tried = false;
        for (let c = 0; c < n && !solved; c++) {
          if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
          tried = true; cols.add(c); d1.add(r - c); d2.add(r + c); b[r][c] = "Q";
          snap(`Row ${r}: column ${c} is safe → place a queen`, [r, c]);
          place(r + 1);
          if (solved) return;
          b[r][c] = ""; cols.delete(c); d1.delete(r - c); d2.delete(r + c);
          snap(`Nothing works below row ${r} → remove the queen at (${r}, ${c}) and try the next column`, [r, c], true);
        }
        if (!tried) snap(`Row ${r}: every column or diagonal is attacked → dead end`, [r, 0], true);
      };
      place(0);
      frames.push({ note: "All 4 rows filled → first board [.Q.., ...Q, Q..., ..Q.]. Its mirror is the second answer.", cells: b.map((r) => [...r]), tones: Object.fromEntries(b.flatMap((r, i) => r.map((v, j) => [`${i}:${j}`, v ? "found" : "muted"]))) });
      return { kind: "table", title: "4-queens: backtracking row by row", rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3"], frames };
    },
  },

  "swap-nodes-in-pairs": {
    approach: "With prev before a pair (a, b), rewire prev → b → a → rest, then move prev to a.",
    idea: ["A dummy node gives the first pair a prev.", "Three pointer changes swap a pair: prev.next = b, a.next = b.next, b.next = a.", "a is now second in the pair, so it becomes prev for the next pair. Stop when fewer than two nodes remain."],
    code: `def swapPairs(head):
    dummy = prev = ListNode(0, head)
    while prev.next and prev.next.next:
        a, b = prev.next, prev.next.next
        prev.next, a.next, b.next = b, b.next, a
        prev = a
    return dummy.next`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const vals = ["d", 1, 2, 3, 4, 5], next = chain(6), frames: ListFrame[] = [], done: number[] = []; let prev = 0;
      frames.push(lf("Dummy d sits before the first pair", next, { prev }));
      while (next[prev] !== -1 && next[next[prev]] !== -1) {
        const a = next[prev], b = next[a];
        frames.push(lf(`Pair (${vals[a]}, ${vals[b]})`, next, { prev, a, b }, { ...all(done, "done"), [a]: "window", [b]: "window" }));
        next[prev] = b; next[a] = next[b]; next[b] = a; done.push(a, b);
        frames.push(lf(`prev → ${vals[b]} → ${vals[a]} → ${next[a] === -1 ? "null" : vals[next[a]]}; prev moves to ${vals[a]}`, next, { prev: a }, { ...all(done, "done"), [b]: "found" }));
        prev = a;
      }
      frames.push(lf("Only one node left → done: [2,1,4,3,5]", next, { prev }, all(done, "done")));
      return list("swapPairs([1,2,3,4,5])", vals, frames);
    },
  },

  "daily-temperatures": {
    approach: "Monotonic stack of days still waiting for a warmer day; a warmer temperature pops them and fills in their wait.",
    idea: ["Keep indices whose temperatures decrease from bottom to top.", "When today is warmer than the top, that day's answer is today - its index; pop and repeat.", "Push today. Days left on the stack never warm up, so they stay 0."],
    code: `def dailyTemperatures(temperatures):
    ans = [0] * len(temperatures)
    stack = []
    for i, t in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < t:
            j = stack.pop()
            ans[j] = i - j
        stack.append(i)
    return ans`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const T = [73, 74, 75, 71, 69, 72, 76, 73], ans = T.map(() => 0), st: number[] = [], frames: StackFrame[] = [];
      T.forEach((t, i) => {
        const popped: string[] = [];
        while (st.length && T[st[st.length - 1]] < t) { const j = st.pop()!; ans[j] = i - j; popped.push(`${T[j]}@${j}`); }
        st.push(i);
        frames.push({ note: popped.length ? `${t} is warmer than ${popped.join(", ")} → their waits are filled in` : `Push ${t}@${i}; nothing cooler on top`, items: st.map((j) => `${T[j]}@${j}`), incoming: t, popped, side: `answer [${ans.join(", ")}]` });
      });
      return { kind: "stack", title: "dailyTemperatures = [1,1,4,2,1,1,0,0]", input: T, frames };
    },
  },

  "online-stock-span": {
    approach: "Stack of (price, span) with decreasing prices: a new price absorbs every smaller-or-equal entry and adds their spans to its own.",
    idea: ["The span counts consecutive days back with price <= today.", "Any day with price <= today is covered by today for all future queries, so fold it into today's span and drop it.", "The stack keeps strictly decreasing prices; each day is pushed and popped at most once (amortised O(1))."],
    code: `class StockSpanner:
    def __init__(self):
        self.stack = []

    def next(self, price):
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span`,
    lang: "python", time: "O(1) amortised per call", space: "O(n)",
    viz: () => {
      const P = [100, 80, 60, 70, 60, 75, 85], st: [number, number][] = [], frames: StackFrame[] = [], out: number[] = [];
      for (const p of P) {
        let span = 1; const popped: string[] = [];
        while (st.length && st[st.length - 1][0] <= p) { const [q, s] = st.pop()!; span += s; popped.push(`${q} (span ${s})`); }
        st.push([p, span]); out.push(span);
        frames.push({ note: popped.length ? `next(${p}): absorb ${popped.join(", ")} → span ${span}` : `next(${p}): previous price is higher → span 1`, items: st.map(([q, s]) => `${q} | ${s}`), incoming: p, popped, side: `spans [${out.join(", ")}]` });
      }
      return { kind: "stack", title: "StockSpanner: (price | span) stack", input: P, frames };
    },
  },

  "asteroid-collision": {
    approach: "Stack of survivors; a left-moving asteroid fights right-moving ones on top until it dies, they die, or nothing is left to hit.",
    idea: ["Only a positive on the stack followed by a negative can collide.", "While the top is positive and smaller than |a|, it explodes: pop and keep going.", "Equal sizes destroy both; a bigger top destroys a.", "If a survives every fight (or never fights), push it."],
    code: `def asteroidCollision(asteroids):
    stack = []
    for a in asteroids:
        while a < 0 and stack and stack[-1] > 0:
            if stack[-1] < -a:
                stack.pop()
                continue
            if stack[-1] == -a:
                stack.pop()
            break
        else:
            stack.append(a)
    return stack`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const A = [5, 10, -5, -12, 3, -3], st: number[] = [], frames: StackFrame[] = [];
      for (const a of A) {
        const popped: number[] = []; let alive = true, why = "";
        while (a < 0 && st.length && st[st.length - 1] > 0) {
          const top = st[st.length - 1];
          if (top < -a) { popped.push(st.pop()!); continue; }
          if (top === -a) { popped.push(st.pop()!); why = `${top} and ${a} are the same size → both explode`; } else why = `${top} is bigger → ${a} explodes`;
          alive = false; break;
        }
        if (alive) st.push(a);
        frames.push({ note: why || (popped.length ? `${a} destroys ${popped.join(", ")} and survives` : a > 0 ? `${a} moves right → push` : `${a} moves left with nothing to hit → push`), items: [...st], incoming: a, popped });
      }
      return { kind: "stack", title: `asteroidCollision([${A.join(",")}]) = [${st.join(",")}]`, input: A, frames };
    },
  },

  "remove-k-digits": {
    approach: "Greedy monotonic stack: while the previous digit is larger than the current one and removals remain, drop it; the earliest digits weigh the most.",
    idea: ["A smaller digit earlier always beats a larger one, so a digit followed by something smaller should go.", "Keep the stack non-decreasing, spending one removal per pop.", "Removals left over come off the end (the largest tail).", "Strip leading zeros; an empty result is \"0\"."],
    code: `def removeKdigits(num, k):
    stack = []
    for d in num:
        while k and stack and stack[-1] > d:
            stack.pop()
            k -= 1
        stack.append(d)
    if k:
        stack = stack[:-k]
    return "".join(stack).lstrip("0") or "0"`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const num = "1432219", frames: StackFrame[] = [], st: string[] = []; let k = 3;
      for (const d of num) {
        const popped: string[] = []; while (k && st.length && st[st.length - 1] > d) { popped.push(st.pop()!); k--; }
        st.push(d);
        frames.push({ note: popped.length ? `${d} is smaller than ${popped.join(", ")} before it → remove them (k left ${k})` : `Push ${d}; stack stays non-decreasing (k left ${k})`, items: [...st], incoming: d, popped });
      }
      frames.push({ note: `No removals left. Result "${st.join("").replace(/^0+/, "") || "0"}"`, items: [...st] });
      return { kind: "stack", title: "removeKdigits(\"1432219\", 3) = \"1219\"", input: num.split(""), frames };
    },
  },

  "valid-parentheses": {
    approach: "Push openers on a stack; every closer must match the opener on top.",
    idea: ["The most recently opened bracket must close first: last in, first out.", "Opener: push it. Closer: the top must be its partner, so pop; otherwise the string is invalid.", "At the end the stack must be empty (nothing left unclosed)."],
    code: `def isValid(s):
    pair = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in pair:
            if not stack or stack.pop() != pair[ch]:
                return False
        else:
            stack.append(ch)
    return not stack`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => brackets("{[()]}"),
  },

  "evaluate-reverse-polish-notation": {
    approach: "Numbers go on a stack; an operator pops two, applies itself and pushes the result.",
    idea: ["In postfix notation an operator always works on the two most recent values.", "Pop b, then a, and push a op b (order matters for - and /).", "Division truncates toward zero, so use int(a / b) rather than //.", "The single value left is the answer."],
    code: `import operator
OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": lambda a, b: int(a / b)}
def evalRPN(tokens):
    stack = []
    for t in tokens:
        if t in OPS:
            b, a = stack.pop(), stack.pop()
            stack.append(OPS[t](a, b))
        else:
            stack.append(int(t))
    return stack[0]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => rpn(["4", "13", "5", "/", "+"]),
  },

  "simplify-path": {
    approach: "Split on '/', then use a stack of directory names: '..' pops, '.' and empty parts are skipped, anything else is pushed.",
    idea: ["Repeated slashes give empty parts and '.' means 'stay here': both are ignored.", "'..' goes to the parent, which is popping the last directory (if any).", "Every other name, even '...', is a real directory: push it.", "Join the stack with '/' after a leading slash."],
    code: `def simplifyPath(path):
    stack = []
    for part in path.split("/"):
        if part == "..":
            if stack:
                stack.pop()
        elif part and part != ".":
            stack.append(part)
    return "/" + "/".join(stack)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const path = "/home//user/./docs/../pics/", parts = path.split("/"), st: string[] = [], frames: StackFrame[] = [];
      for (const p of parts) {
        if (p === "..") { const popped = st.length ? [st.pop()!] : []; frames.push({ note: `".." → go up: pop ${popped.length ? `"${popped[0]}"` : "nothing (already at root)"}`, items: [...st], incoming: p, popped }); }
        else if (!p || p === ".") frames.push({ note: p ? `"." → stay in the same directory` : "Empty part (from a leading or doubled slash) → skip", items: [...st], incoming: p || "(empty)" });
        else { st.push(p); frames.push({ note: `"${p}" → push`, items: [...st], incoming: p }); }
      }
      frames.push({ note: `Join → "/${st.join("/")}"`, items: [...st] });
      return { kind: "stack", title: `simplifyPath("${path}")`, input: parts.map((p) => p || "∅"), frames };
    },
  },

  "decode-string": {
    approach: "Stack of (text so far, repeat count): '[' saves the context, ']' pops it and appends the inner text repeated.",
    idea: ["Digits build the repeat number (it can have several digits).", "'[' pushes (current text, number) and starts fresh inside the brackets.", "']' pops (prev, k): current = prev + current * k.", "Letters just extend the current text."],
    code: `def decodeString(s):
    stack, cur, num = [], "", 0
    for ch in s:
        if ch.isdigit():
            num = num * 10 + int(ch)
        elif ch == "[":
            stack.append((cur, num))
            cur, num = "", 0
        elif ch == "]":
            prev, k = stack.pop()
            cur = prev + cur * k
        else:
            cur += ch
    return cur`,
    lang: "python", time: "O(output length)", space: "O(output length)",
    viz: () => {
      const s = "3[a2[c]]b", st: [string, number][] = [], frames: StackFrame[] = []; let cur = "", num = 0;
      const show = () => st.map(([p, k]) => `"${p}" ×${k}`);
      for (const ch of s) {
        if (/\d/.test(ch)) { num = num * 10 + +ch; frames.push({ note: `Digit → repeat count ${num}`, items: show(), incoming: ch, side: `cur = "${cur}"` }); }
        else if (ch === "[") { st.push([cur, num]); cur = ""; num = 0; frames.push({ note: "'[' → save (text so far, count) and start fresh", items: show(), incoming: ch, side: `cur = "${cur}"` }); }
        else if (ch === "]") { const [p, k] = st.pop()!; const inner = cur; cur = p + cur.repeat(k); frames.push({ note: `']' → "${p}" + "${inner}" × ${k} = "${cur}"`, items: show(), incoming: ch, popped: [`"${p}" ×${k}`], side: `cur = "${cur}"` }); }
        else { cur += ch; frames.push({ note: `Letter → cur = "${cur}"`, items: show(), incoming: ch, side: `cur = "${cur}"` }); }
      }
      return { kind: "stack", title: `decodeString("${s}") = "${cur}"`, input: s.split(""), frames };
    },
  },

  "largest-rectangle-in-histogram": {
    approach: "Monotonic increasing stack of bar indices: when a shorter bar arrives, each taller bar popped knows both its walls, so its widest rectangle is final.",
    idea: ["For a bar of height h, the best rectangle using full height h stretches until a shorter bar on each side.", "Keep indices with increasing heights. A shorter bar i is the right wall for every taller bar it pops.", "After popping, the new top is the left wall, so width = i - top - 1.", "A 0 sentinel at the end flushes the stack."],
    code: `def largestRectangleArea(heights):
    stack, best = [], 0
    for i, h in enumerate(heights + [0]):
        while stack and heights[stack[-1]] > h:
            top = stack.pop()
            left = stack[-1] + 1 if stack else 0
            best = max(best, heights[top] * (i - left))
        stack.append(i)
    return best`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => histogram([2, 1, 5, 6, 2, 3]),
  },

  "sum-of-subarray-minimums": {
    approach: "Count, for each element, how many subarrays have it as their minimum: (distance to the previous smaller) × (distance to the next smaller or equal), using one monotonic stack.",
    idea: ["arr[j] is the minimum of every subarray that starts after the previous smaller element and ends before the next smaller one.", "That is (j - left) × (right - j) subarrays, each adding arr[j].", "A monotonic increasing stack finds both walls: when x pops j, x is j's right wall and the new top is its left wall.", "Popping on >= breaks ties so equal values are not counted twice."],
    code: `def sumSubarrayMins(arr):
    stack, total = [], 0
    for i, x in enumerate(arr + [0]):
        while stack and arr[stack[-1]] >= x:
            j = stack.pop()
            left = stack[-1] if stack else -1
            total += arr[j] * (j - left) * (i - j)
        stack.append(i)
    return total % (10**9 + 7)`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const a = [3, 1, 2, 4], ext = [...a, 0], st: number[] = [], frames: CellsFrame[] = [], contrib: (string | number)[] = a.map(() => ""); let total = 0;
      ext.forEach((x, i) => {
        while (st.length && ext[st[st.length - 1]] >= x) {
          const j = st.pop()!, left = st.length ? st[st.length - 1] : -1, c = a[j] * (j - left) * (i - j); total += c; contrib[j] = c;
          frames.push({ note: `${i < a.length ? `${x} at ${i}` : "End sentinel 0"} pops ${a[j]}: it is the min of ${j - left} × ${i - j} subarrays → adds ${a[j]} × ${(j - left) * (i - j)} = ${c}. Total ${total}`, rows: [a, [...contrib]], tones: { ...range(left + 1, i - 1), [`0:${j}`]: "active", [`1:${j}`]: "found" } });
        }
        st.push(i);
        if (i < a.length) frames.push({ note: `Push ${x}; stack values [${st.map((k) => ext[k]).join(", ")}] increase`, rows: [a, [...contrib]], tones: { [`0:${i}`]: "window" } });
      });
      return cells(`sumSubarrayMins([3,1,2,4]) = ${total}`, [a, a.map(() => "")], frames, ["arr", "adds"]);
    },
  },

  "min-stack": {
    approach: "Store each value together with the minimum of the stack at the moment it was pushed, so getMin is the top's stored minimum.",
    idea: ["The minimum only changes when the stack changes.", "Push (val, min(val, current min)).", "Pop removes the pair; the pair below already knows the older minimum.", "Every operation is O(1)."],
    code: `class MinStack:
    def __init__(self):
        self.stack = []

    def push(self, val):
        low = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, low))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]`,
    lang: "python", time: "O(1) per operation", space: "O(n)",
    viz: () => minStack(),
  },

  "implement-queue-using-stacks": {
    approach: "Push onto an in-stack; pop and peek from an out-stack, refilling it by reversing the in-stack only when it is empty.",
    idea: ["Pouring one stack into another reverses the order, so the oldest element ends up on top.", "Only pour when out is empty, otherwise newer elements would jump ahead of older ones.", "Each element moves at most once, so every operation is O(1) amortised."],
    code: `class MyQueue:
    def __init__(self):
        self.inp, self.out = [], []

    def push(self, x):
        self.inp.append(x)

    def _move(self):
        if not self.out:
            while self.inp:
                self.out.append(self.inp.pop())

    def pop(self):
        self._move()
        return self.out.pop()

    def peek(self):
        self._move()
        return self.out[-1]

    def empty(self):
        return not self.inp and not self.out`,
    lang: "python", time: "O(1) amortised", space: "O(n)",
    viz: () => {
      const ops: [string, number?][] = [["push", 1], ["push", 2], ["push", 3], ["peek"], ["pop"], ["push", 4], ["pop"], ["pop"], ["pop"]];
      const inp: number[] = [], out: number[] = [], frames: CellsFrame[] = [], W = 4;
      const rows = () => [[...inp, ...Array(W - inp.length).fill("")], [...out, ...Array(W - out.length).fill("")]];
      for (const [op, v] of ops) {
        if (op === "push") { inp.push(v!); frames.push({ note: `push(${v}) → onto in`, rows: rows(), tones: { [`0:${inp.length - 1}`]: "active" } }); continue; }
        let moved = "";
        if (!out.length) { moved = `out was empty → pour the in-stack into out (${inp.join(", ")} reversed). `; while (inp.length) out.push(inp.pop()!); }
        const top = out[out.length - 1];
        if (op === "pop") { out.pop(); frames.push({ note: `${moved}pop() → ${top}, the oldest element`, rows: rows(), tones: { [`1:${out.length}`]: "found" } }); }
        else frames.push({ note: `${moved}peek() → ${top} (top of out)`, rows: rows(), tones: { [`1:${out.length - 1}`]: "found" } });
      }
      return cells("Queue from two stacks (top is the right end)", [Array(W).fill(""), Array(W).fill("")], frames, ["in", "out"]);
    },
  },

  "maximum-frequency-stack": {
    approach: "Keep a stack per frequency level: the k-th copy of a value goes on stack k, so the top of the highest stack is the most frequent, most recent value.",
    idea: ["freq[x] counts copies currently in the structure.", "Pushing x makes its count f and appends x to group[f]; it still sits in the lower groups too.", "Pop takes from group[maxFreq]: highest count wins and, within it, the latest push wins.", "If that group empties, maxFreq drops by one. All O(1)."],
    code: `from collections import Counter, defaultdict
class FreqStack:
    def __init__(self):
        self.freq = Counter()
        self.group = defaultdict(list)
        self.top = 0

    def push(self, val):
        self.freq[val] += 1
        f = self.freq[val]
        self.top = max(self.top, f)
        self.group[f].append(val)

    def pop(self):
        val = self.group[self.top].pop()
        self.freq[val] -= 1
        if not self.group[self.top]:
            self.top -= 1
        return val`,
    lang: "python", time: "O(1) per operation", space: "O(n)",
    viz: () => {
      const ops: (number | null)[] = [5, 7, 5, 7, 4, 5, null, null, null, null], freq = new Map<number, number>(), g: number[][] = [[], [], []], frames: CellsFrame[] = [], W = 4; let top = 0;
      const rows = () => g.map((r) => [...r, ...Array(W - r.length).fill("")]);
      for (const v of ops) {
        if (v != null) { const f = (freq.get(v) || 0) + 1; freq.set(v, f); top = Math.max(top, f); g[f - 1].push(v); frames.push({ note: `push(${v}): its count is now ${f} → append to group ${f}`, rows: rows(), tones: { [`${f - 1}:${g[f - 1].length - 1}`]: "active" } }); }
        else { const x = g[top - 1].pop()!; freq.set(x, freq.get(x)! - 1); const was = top; if (!g[top - 1].length) top--; frames.push({ note: `pop() → ${x}, top of group ${was} (highest count, most recent)${top < was ? `; group ${was} is empty so maxFreq = ${top}` : ""}`, rows: rows(), tones: { [`${was - 1}:${g[was - 1].length}`]: "found" } }); }
      }
      return cells("FreqStack: one stack per frequency", [Array(W).fill(""), Array(W).fill(""), Array(W).fill("")], frames, ["count 1", "count 2", "count 3"]);
    },
  },

  "tag-validator": {
    approach: "Scan left to right with a stack of open tag names; CDATA blocks are skipped whole, and the stack may only be empty at the very start and the very end.",
    idea: ["The code must start inside a tag, so if the stack is empty anywhere after index 0 it is invalid.", "\"<![CDATA[\" jumps to the next \"]]>\": nothing inside is parsed.", "\"</NAME>\" must match the top of the stack; \"<NAME>\" must be 1 to 9 uppercase letters and is pushed.", "Any other character is plain content. At the end every tag must be closed."],
    code: `def isValid(code):
    stack, i, n = [], 0, len(code)
    while i < n:
        if i > 0 and not stack:
            return False
        if code.startswith("<![CDATA[", i):
            j = code.find("]]>", i + 9)
            if not stack or j < 0:
                return False
            i = j + 3
        elif code.startswith("</", i):
            j = code.find(">", i + 2)
            if j < 0 or not stack or stack[-1] != code[i + 2:j]:
                return False
            stack.pop()
            i = j + 1
        elif code[i] == "<":
            j = code.find(">", i + 1)
            name = code[i + 1:j]
            if j < 0 or not (1 <= len(name) <= 9 and name.isalpha() and name.isupper()):
                return False
            stack.append(name)
            i = j + 1
        else:
            i += 1
    return not stack`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const toks = ["<A>", "<B>", "x", "</B>", "<![CDATA[</A>]]>", "y", "</A>"], st: string[] = [], frames: StackFrame[] = [];
      for (const t of toks) {
        if (t.startsWith("<![CDATA[")) frames.push({ note: "CDATA block → skip to \"]]>\"; the </A> inside is just text", items: [...st], incoming: "CDATA" });
        else if (t.startsWith("</")) { const name = t.slice(2, -1); st.pop(); frames.push({ note: `Closing tag ${name} matches the top → pop${st.length ? "" : ". Stack empty exactly at the end → valid"}`, items: [...st], incoming: t, popped: [name] }); }
        else if (t.startsWith("<")) { const name = t.slice(1, -1); st.push(name); frames.push({ note: `Start tag ${name}: 1 to 9 uppercase letters → push`, items: [...st], incoming: t }); }
        else frames.push({ note: `"${t}" is plain content inside ${st[st.length - 1]}`, items: [...st], incoming: t });
      }
      return { kind: "stack", title: "isValid(\"<A><B>x</B><![CDATA[</A>]]>y</A>\") = true", input: toks, frames };
    },
  },

  "valid-palindrome-ii": {
    approach: "Two pointers from the ends; at the first mismatch, the string is fine only if skipping the left char or skipping the right char leaves a palindrome.",
    idea: ["Matching ends can be ignored, so move both pointers inward.", "At the first mismatch one of the two characters must be the deleted one.", "Check s[l+1..r] and s[l..r-1] as plain palindromes; either one passing means true.", "Only one deletion is allowed, so no further branching: O(n)."],
    code: `def validPalindrome(s):
    def is_pal(l, r):
        while l < r:
            if s[l] != s[r]:
                return False
            l, r = l + 1, r - 1
        return True
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return is_pal(l + 1, r) or is_pal(l, r - 1)
        l, r = l + 1, r - 1
    return True`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "abccdba", a = s.split(""), frames: CellsFrame[] = []; let l = 0, r = a.length - 1;
      const m = (x: number, y: number) => [{ i: x, label: "L" }, { i: y, label: "R" }];
      while (l < r && a[l] === a[r]) { frames.push({ note: `'${a[l]}' = '${a[r]}' → move both in`, tones: { [`0:${l}`]: "found", [`0:${r}`]: "found" }, marks: m(l, r) }); l++; r--; }
      frames.push({ note: `'${a[l]}' ≠ '${a[r]}' → one of them must be deleted`, tones: { [`0:${l}`]: "bad", [`0:${r}`]: "bad" }, marks: m(l, r) });
      const pal = (x: number, y: number) => { for (; x < y; x++, y--) if (a[x] !== a[y]) return false; return true; };
      const p1 = pal(l + 1, r);
      frames.push({ note: `Skip left: "${s.slice(l + 1, r + 1)}" ${p1 ? "is" : "is not"} a palindrome`, tones: { ...range(l + 1, r, 0, p1 ? "found" : "window"), [`0:${l}`]: "muted" }, marks: m(l + 1, r) });
      const p2 = pal(l, r - 1);
      if (!p1) frames.push({ note: `Skip right: "${s.slice(l, r)}" ${p2 ? "is a palindrome → true" : "is not either → false"}`, tones: { ...range(l, r - 1, 0, p2 ? "found" : "bad"), [`0:${r}`]: "muted" }, marks: m(l, r - 1) });
      return cells(`validPalindrome("${s}") = ${p1 || p2}`, [a], frames);
    },
  },

  "backspace-string-compare": {
    approach: "Read both strings backwards, skipping characters erased by '#', and compare the surviving characters one by one in O(1) space.",
    idea: ["Reading from the end, a '#' means the next real character is erased: count pending skips.", "A generator yields only the characters that survive.", "Compare the two streams pair by pair; zip_longest catches different lengths."],
    code: `from itertools import zip_longest
def backspaceCompare(s, t):
    def kept(x):
        skip = 0
        for ch in reversed(x):
            if ch == "#":
                skip += 1
            elif skip:
                skip -= 1
            else:
                yield ch
    return all(a == b for a, b in zip_longest(kept(s), kept(t)))`,
    lang: "python", time: "O(m + n)", space: "O(1)",
    viz: () => {
      const s = "ab#c#d", t = "ad#d", rows = [s.split(""), [...t.split(""), "", ""]], frames: CellsFrame[] = [], tones: Record<string, Tone> = {};
      const walk = (x: string, row: number, i: number): number => { let skip = 0; while (i >= 0) { if (x[i] === "#") { skip++; tones[`${row}:${i}`] = "muted"; } else if (skip) { skip--; tones[`${row}:${i}`] = "bad"; } else return i; i--; } return -1; };
      let i = s.length, j = t.length;
      frames.push({ note: "Read both strings from the right; each '#' erases the next real character to its left", tones: {} });
      for (;;) {
        i = walk(s, 0, i - 1); j = walk(t, 1, j - 1);
        if (i < 0 || j < 0) { frames.push({ note: i < 0 && j < 0 ? "Both strings ran out together → equal: true" : "One string ran out first → false", tones: { ...tones } }); break; }
        tones[`0:${i}`] = "found"; tones[`1:${j}`] = "found";
        frames.push({ note: `Survivors s[${i}] = '${s[i]}' and t[${j}] = '${t[j]}' → ${s[i] === t[j] ? "match" : "differ"} (red = erased by a '#')`, tones: { ...tones }, marks: [{ i, label: "i" }, { i: j, label: "j", row: 1 }] });
      }
      return cells(`backspaceCompare("${s}", "${t}") = true`, rows, frames, ["s", "t"]);
    },
  },

  "substrings-of-size-three-with-distinct-characters": {
    approach: "Slide a window of length 3 and count the windows whose three characters are all different.",
    idea: ["There are n - 2 windows of length 3.", "A window is good when a, b and c are pairwise different (a set of size 3).", "Fixed size, so each check is O(1)."],
    code: `def countGoodSubstrings(s):
    return sum(len({a, b, c}) == 3 for a, b, c in zip(s, s[1:], s[2:]))`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "aababcabc", a = s.split(""), frames: CellsFrame[] = []; let cnt = 0;
      for (let i = 0; i + 3 <= a.length; i++) { const w = s.slice(i, i + 3), good = new Set(w).size === 3; if (good) cnt++; frames.push({ note: `"${w}" ${good ? `has 3 distinct letters → count ${cnt}` : "repeats a letter → skip"}`, tones: range(i, i + 2, 0, good ? "found" : "window") }); }
      return cells(`countGoodSubstrings("${s}") = ${cnt}`, [a], frames);
    },
  },

  "minimum-window-substring": {
    approach: "Variable sliding window: grow right until every needed character is covered, then shrink left as far as it stays covered, recording the smallest window.",
    idea: ["need[c] counts how many more of c the window still needs; missing is the total still needed.", "Adding s[r]: if need[s[r]] was positive it fills a real requirement, so missing drops.", "While missing is 0 the window is valid: record it, then drop s[l] and move l; once a required char leaves, missing rises.", "Each index enters and leaves once: O(m + n)."],
    code: `from collections import Counter
def minWindow(s, t):
    need, missing = Counter(t), len(t)
    best, l = None, 0
    for r, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:
            if best is None or r - l < best[1] - best[0]:
                best = (l, r)
            need[s[l]] += 1
            if need[s[l]] > 0:
                missing += 1
            l += 1
    return s[best[0]:best[1] + 1] if best else ""`,
    lang: "python", time: "O(m + n)", space: "O(alphabet)",
    viz: () => {
      const s = "ADOBECODEBANC", t = "ABC", a = s.split(""), need = new Map<string, number>(), frames: CellsFrame[] = []; let missing = t.length, l = 0, best: [number, number] | null = null;
      for (const c of t) need.set(c, (need.get(c) || 0) + 1);
      const g = (c: string) => need.get(c) || 0;
      a.forEach((ch, r) => {
        const useful = g(ch) > 0; if (useful) missing--; need.set(ch, g(ch) - 1);
        frames.push({ note: `Add '${ch}'${useful ? `: needed, ${missing} still missing` : ": not needed"}`, tones: { ...range(l, r), [`0:${r}`]: "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
        while (missing === 0) {
          if (!best || r - l < best[1] - best[0]) best = [l, r];
          const out = a[l]; need.set(out, g(out) + 1); if (g(out) > 0) missing++;
          frames.push({ note: `"${s.slice(l, r + 1)}" covers ${t} (best "${s.slice(best[0], best[1] + 1)}"). Drop '${out}'${missing ? " → now missing one, stop shrinking" : " → still covered"}`, tones: { ...range(l, r, 0, "found"), [`0:${l}`]: missing ? "bad" : "muted" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
          l++;
        }
      });
      const b = best ?? [0, -1];
      frames.push({ note: `Smallest window = "${s.slice(b[0], b[1] + 1)}"`, tones: range(b[0], b[1], 0, "found") });
      return cells(`minWindow("${s}", "${t}")`, [a], frames);
    },
  },

  "permutation-in-string": {
    approach: "Fixed window of len(s1) over s2 with letter counts: some window having exactly s1's counts means a permutation of s1 is a substring.",
    idea: ["A permutation has the same letter counts, so compare 26-letter count arrays.", "Start with the first len(s1) letters of s2.", "Slide one step: add the new letter, remove the one leaving. Compare after each slide."],
    code: `def checkInclusion(s1, s2):
    k = len(s1)
    if k > len(s2):
        return False
    need, win = [0] * 26, [0] * 26
    for a, b in zip(s1, s2):
        need[ord(a) - 97] += 1
        win[ord(b) - 97] += 1
    for i in range(k, len(s2)):
        if win == need:
            return True
        win[ord(s2[i]) - 97] += 1
        win[ord(s2[i - k]) - 97] -= 1
    return win == need`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s1 = "ab", s2 = "eidbaooo", k = 2, a = s2.split(""), frames: CellsFrame[] = [];
      const key = (x: string) => x.split("").sort().join("");
      for (let i = 0; i + k <= a.length; i++) {
        const w = s2.slice(i, i + k), hit = key(w) === key(s1);
        frames.push({ note: `${i ? `Slide: add '${a[i + k - 1]}', drop '${a[i - 1]}'. ` : ""}Window "${w}" ${hit ? `has the same counts as "${s1}" → true` : "counts differ"}`, tones: range(i, i + k - 1, 0, hit ? "found" : "window") });
        if (hit) break;
      }
      return cells(`checkInclusion("${s1}", "${s2}") = true`, [a], frames);
    },
  },

  "longest-repeating-character-replacement": {
    approach: "Sliding window that stays valid while (length - count of its most common letter) <= k, because those other letters are the ones to replace.",
    idea: ["Inside a window, keep the most frequent letter and replace the rest: cost = length - maxCount.", "Grow right; if the cost exceeds k, move left one step (the window just slides, never shrinks).", "maxCount may be stale after a shrink, but a stale value never lets the answer grow wrongly: only a bigger real maxCount can grow the window.", "The answer is the largest window seen."],
    code: `def characterReplacement(s, k):
    count = {}
    best = maxf = l = 0
    for r, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1
        maxf = max(maxf, count[ch])
        if r - l + 1 - maxf > k:
            count[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best`,
    lang: "python", time: "O(n)", space: "O(alphabet)",
    viz: () => {
      const s = "AABABBA", k = 1, a = s.split(""), cnt = new Map<string, number>(), frames: CellsFrame[] = []; let best = 0, maxf = 0, l = 0;
      a.forEach((ch, r) => {
        cnt.set(ch, (cnt.get(ch) || 0) + 1); maxf = Math.max(maxf, cnt.get(ch)!);
        const cost = r - l + 1 - maxf, slide = cost > k;
        if (slide) { cnt.set(a[l], cnt.get(a[l])! - 1); l++; }
        best = Math.max(best, r - l + 1);
        frames.push({ note: `Add '${ch}': length ${r - l + 1 + (slide ? 1 : 0)} - maxCount ${maxf} = ${cost} replacement${cost === 1 ? "" : "s"}${slide ? ` > ${k} → slide left past '${a[l - 1]}'` : ` <= ${k}`}. best = ${best}`, tones: { ...range(l, r), ...(slide ? { [`0:${l - 1}`]: "bad" } : {}), [`0:${r}`]: "active" }, marks: [{ i: l, label: "L" }, { i: r, label: "R" }] });
      });
      return cells(`characterReplacement("${s}", ${k}) = ${best}`, [a], frames);
    },
  },

  "valid-anagram": {
    approach: "Count letters: add one for each letter of s, subtract one for each letter of t; anagrams leave every count at zero.",
    idea: ["Different lengths can never be anagrams.", "One pass over both strings updates a single counter: +1 for s[i], -1 for t[i].", "All counts zero means the same multiset of letters."],
    code: `from collections import Counter
def isAnagram(s, t):
    return len(s) == len(t) and Counter(s) == Counter(t)`,
    lang: "python", time: "O(n)", space: "O(alphabet)",
    viz: () => {
      const s = "anagram", t = "nagaram", letters = [...new Set(s + t)].sort(), cnt = letters.map(() => 0), frames: CellsFrame[] = [];
      for (let i = 0; i < s.length; i++) {
        cnt[letters.indexOf(s[i])]++; cnt[letters.indexOf(t[i])]--;
        frames.push({ note: `+1 for '${s[i]}' from s, -1 for '${t[i]}' from t`, rows: [letters, [...cnt]], tones: { [`1:${letters.indexOf(s[i])}`]: "found", [`1:${letters.indexOf(t[i])}`]: "bad" } });
      }
      frames.push({ note: "Every count is 0 → anagram: true", rows: [letters, [...cnt]], tones: Object.fromEntries(letters.map((_, i) => [`1:${i}`, "done"])) });
      return cells(`isAnagram("${s}", "${t}")`, [letters, cnt.map(() => 0)], frames, ["letter", "s - t"]);
    },
  },

  "group-anagrams": {
    approach: "Words that are anagrams share the same sorted letters, so use the sorted word as a dictionary key and collect each group.",
    idea: ["Sorting a word gives a canonical form: 'eat', 'tea' and 'ate' all become 'aet'.", "Append each word to the list under its key.", "The dictionary's values are the groups."],
    code: `from collections import defaultdict
def groupAnagrams(strs):
    groups = defaultdict(list)
    for w in strs:
        groups["".join(sorted(w))].append(w)
    return list(groups.values())`,
    lang: "python", time: "O(n · k log k)", space: "O(n · k)",
    viz: () => {
      const words = ["eat", "tea", "tan", "ate", "nat", "bat"], keys: string[] = [], c: (string | number | null)[][] = words.map((w) => [w, null, null]), frames: TableFrame[] = [];
      words.forEach((w, i) => {
        const k = w.split("").sort().join(""), isNew = !keys.includes(k); if (isNew) keys.push(k);
        c[i][1] = k; c[i][2] = `group ${keys.indexOf(k) + 1}`;
        frames.push({ note: `sorted("${w}") = "${k}" → ${isNew ? "new group" : `joins group ${keys.indexOf(k) + 1}`}`, cells: c.map((r) => [...r]), active: [i, 2], deps: words.slice(0, i).map((_, j) => j).filter((j) => c[j][1] === k).map((j) => [j, 2] as [number, number]) });
      });
      frames.push({ note: `${keys.length} groups: ${keys.map((k) => `[${words.filter((w) => w.split("").sort().join("") === k).join(", ")}]`).join(" ")}`, cells: c.map((r) => [...r]) });
      return { kind: "table", title: "Group anagrams by sorted key", rowHead: words.map((_, i) => String(i)), colHead: ["word", "key", "group"], frames };
    },
  },

  "first-unique-character-in-a-string": {
    approach: "Two passes: count every character, then return the first index whose character has count 1.",
    idea: ["Uniqueness depends on the whole string, so count first.", "Then scan left to right and stop at the first count of 1.", "Only 26 letters, so the counter is O(1) space."],
    code: `from collections import Counter
def firstUniqChar(s):
    count = Counter(s)
    for i, ch in enumerate(s):
        if count[ch] == 1:
            return i
    return -1`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "loveleetcode", a = s.split(""), cnt = a.map((c) => a.filter((x) => x === c).length), frames: CellsFrame[] = [];
      frames.push({ note: "Pass 1: count each character (shown under every copy)", rows: [a, cnt], tones: {} });
      for (let i = 0; i < a.length; i++) { const u = cnt[i] === 1; frames.push({ note: `Pass 2: '${a[i]}' appears ${cnt[i]} time${cnt[i] === 1 ? "" : "s"}${u ? ` → first unique at index ${i}` : ""}`, rows: [a, cnt], tones: { [`0:${i}`]: u ? "found" : "bad", [`1:${i}`]: u ? "found" : "bad", ...range(0, i - 1, 0, "muted") } }); if (u) break; }
      return cells(`firstUniqChar("${s}") = 2`, [a, a.map(() => "")], frames, ["s", "count"]);
    },
  },

  "find-all-anagrams-in-a-string": {
    approach: "Slide a window of len(p) over s keeping 26 letter counts; every window whose counts equal p's starts an anagram.",
    idea: ["An anagram of p is any window with exactly p's letter counts.", "Add the letter entering on the right, remove the one leaving on the left: O(1) per step.", "Record the window start whenever the counts match."],
    code: `def findAnagrams(s, p):
    k, out = len(p), []
    need, win = [0] * 26, [0] * 26
    for ch in p:
        need[ord(ch) - 97] += 1
    for i, ch in enumerate(s):
        win[ord(ch) - 97] += 1
        if i >= k:
            win[ord(s[i - k]) - 97] -= 1
        if win == need:
            out.append(i - k + 1)
    return out`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => anagramCount("cbaebabacd", "abc"),
  },

  "isomorphic-strings": {
    approach: "Map characters both ways: s[i] must always map to the same t[i], and no two characters of s may map to the same t character.",
    idea: ["Walk the strings in parallel.", "s → t map: once 'p' maps to 't' it must stay 't'.", "t → s map stops two different letters sharing a target ('ab' → 'aa' fails).", "Any conflict means false."],
    code: `def isIsomorphic(s, t):
    st, ts = {}, {}
    for a, b in zip(s, t):
        if st.setdefault(a, b) != b or ts.setdefault(b, a) != a:
            return False
    return True`,
    lang: "python", time: "O(n)", space: "O(alphabet)",
    viz: () => {
      const s = "paper", t = "title", st = new Map<string, string>(), ts = new Map<string, string>(), frames: CellsFrame[] = [];
      for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i], seen = st.has(a);
        if (!st.has(a)) st.set(a, b); if (!ts.has(b)) ts.set(b, a);
        frames.push({ note: `${seen ? `'${a}' already maps to '${st.get(a)}'` : `New pair '${a}' → '${b}'`}; maps so far ${[...st].map(([x, y]) => `${x}→${y}`).join(", ")}`, tones: { [`0:${i}`]: seen ? "found" : "active", [`1:${i}`]: seen ? "found" : "active" } });
      }
      frames.push({ note: "No letter changed its partner either way → true", tones: Object.fromEntries([...s].flatMap((_, i) => [[`0:${i}`, "done"], [`1:${i}`, "done"]])) });
      return cells(`isIsomorphic("${s}", "${t}") = true`, [s.split(""), t.split("")], frames, ["s", "t"]);
    },
  },

  "palindromic-substrings": {
    approach: "Expand around each of the 2n - 1 centres (letters and gaps); every successful expansion step is one more palindrome.",
    idea: ["Every palindrome has a centre: a letter (odd length) or the gap between two letters (even length).", "From a centre, grow l and r while s[l] == s[r]; each step finds a new palindrome.", "Sum over all centres. O(n²) time, O(1) space."],
    code: `def countSubstrings(s):
    count = 0
    for c in range(2 * len(s) - 1):
        l, r = c // 2, c // 2 + c % 2
        while l >= 0 and r < len(s) and s[l] == s[r]:
            count += 1
            l, r = l - 1, r + 1
    return count`,
    lang: "python", time: "O(n²)", space: "O(1)",
    viz: () => {
      const s = "abaa", a = s.split(""), frames: CellsFrame[] = []; let count = 0;
      for (let c = 0; c < 2 * s.length - 1; c++) {
        let l = c >> 1, r = (c >> 1) + (c % 2), any = false;
        const where = c % 2 ? `gap ${l}|${r}` : `letter ${l}`;
        while (l >= 0 && r < s.length && s[l] === s[r]) { count++; any = true; frames.push({ note: `Centre ${where}: "${s.slice(l, r + 1)}" is a palindrome → count ${count}`, tones: range(l, r, 0, "found") }); l--; r++; }
        if (!any) frames.push({ note: `Centre ${where}: '${s[l]}' ≠ '${s[r]}' → nothing here`, tones: { [`0:${l}`]: "bad", [`0:${r}`]: "bad" } });
      }
      return cells(`countSubstrings("${s}") = ${count}`, [a], frames);
    },
  },

  "palindrome-partitioning": {
    approach: "Backtracking: from position i try every palindromic prefix s[i:j], keep it, and partition the rest from j.",
    idea: ["A partition is a sequence of cuts; choose the first piece, then solve the rest.", "Only palindromic pieces may be chosen, which prunes the tree early.", "Reaching the end of the string records the current list of pieces."],
    code: `def partition(s):
    out, path = [], []
    def dfs(i):
        if i == len(s):
            out.append(path[:])
            return
        for j in range(i + 1, len(s) + 1):
            piece = s[i:j]
            if piece == piece[::-1]:
                path.append(piece)
                dfs(j)
                path.pop()
    dfs(0)
    return out`,
    lang: "python", time: "O(n · 2ⁿ)", space: "O(n)",
    viz: () => {
      const s = "aab", nodes: TNode[] = [], steps: Step[] = []; let found = 0;
      const go = (i: number, path: string[], parent: number | null) => {
        const id = nodes.length; nodes.push({ id, label: parent == null ? "aab" : path[path.length - 1], parent });
        if (i === s.length) { found++; steps.push({ id, tone: "found", note: `End of string → record [${path.map((p) => `"${p}"`).join(", ")}]` }); return; }
        steps.push({ id, tone: "active", note: parent == null ? "Choose the first piece" : `Kept "${path[path.length - 1]}"; partition "${s.slice(i)}"` });
        for (let j = i + 1; j <= s.length; j++) {
          const piece = s.slice(i, j);
          if (piece === [...piece].reverse().join("")) go(j, [...path, piece], id);
          else { const b = nodes.length; nodes.push({ id: b, label: piece, parent: id }); steps.push({ id: b, tone: "bad", note: `"${piece}" is not a palindrome → prune` }); }
        }
      };
      go(0, [], null);
      return dfsTree(`partition("${s}"): ${found} ways`, nodes, steps);
    },
  },

  "find-the-index-of-the-first-occurrence-in-a-string": {
    approach: "KMP: precompute for the needle the longest prefix that is also a suffix (lps), so after a mismatch the search continues without moving back in the haystack.",
    idea: ["lps[i] = length of the longest proper prefix of needle[0..i] that is also its suffix.", "Scan the haystack once with k = characters matched so far.", "On a mismatch fall back k = lps[k - 1] instead of restarting; on a match k grows.", "k == len(needle) means a match ending at i."],
    code: `def strStr(haystack, needle):
    lps, k = [0] * len(needle), 0
    for i in range(1, len(needle)):
        while k and needle[i] != needle[k]:
            k = lps[k - 1]
        if needle[i] == needle[k]:
            k += 1
        lps[i] = k
    k = 0
    for i, ch in enumerate(haystack):
        while k and ch != needle[k]:
            k = lps[k - 1]
        if ch == needle[k]:
            k += 1
        if k == len(needle):
            return i - k + 1
    return -1`,
    lang: "python", time: "O(m + n)", space: "O(n)",
    viz: () => {
      const h = "abababcab", p = "ababc", lps = [0, 0, 1, 2, 0], frames: CellsFrame[] = []; let k = 0;
      const row = (start: number) => h.split("").map((_, j) => (j >= start && j - start < p.length ? p[j - start] : ""));
      frames.push({ note: `lps of "${p}" = [${lps.join(", ")}]`, rows: [h.split(""), row(0)] });
      for (let i = 0; i < h.length; i++) {
        let fell = "";
        while (k && h[i] !== p[k]) { fell += ` fall back k = lps[${k - 1}] = ${lps[k - 1]};`; k = lps[k - 1]; }
        const hit = h[i] === p[k]; if (hit) k++;
        const start = i - k + 1;
        frames.push({ note: `h[${i}] = '${h[i]}':${fell} ${hit ? `matches, k = ${k}` : "no match, k = 0"}${k === p.length ? ` → found at ${start}` : ""}`, rows: [h.split(""), row(hit ? start : i + 1)], tones: { ...range(start, i, 0, k === p.length ? "found" : "window"), [`0:${i}`]: hit ? (k === p.length ? "found" : "active") : "bad" }, marks: [{ i, label: "i" }] });
        if (k === p.length) break;
      }
      return cells(`strStr("${h}", "${p}") = 2`, [h.split(""), row(0)], frames, ["haystack", "needle"]);
    },
  },

  "repeated-substring-pattern": {
    approach: "s is built from a repeated block exactly when s appears inside (s + s) with the first and last characters removed.",
    idea: ["If s = block × k (k >= 2), rotating s by one block gives s again.", "Every rotation of s is a substring of s + s; dropping the first and last characters removes the two trivial rotations (by 0 and by n).", "So a hit means a non-trivial rotation equals s, which happens only for a repeated block."],
    code: `def repeatedSubstringPattern(s):
    return s in (s + s)[1:-1]`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "abab", d = (s + s).split(""), n = s.length, frames: CellsFrame[] = [];
      frames.push({ note: `s + s = "${s + s}"; ignore the first and last character`, tones: { "0:0": "muted", [`0:${2 * n - 1}`]: "muted" } });
      for (let i = 1; i < n; i++) { const hit = (s + s).slice(i, i + n) === s; frames.push({ note: `Rotation by ${i}: "${(s + s).slice(i, i + n)}" ${hit ? `equals s → s repeats a block of length ${i}` : "differs"}`, tones: { "0:0": "muted", [`0:${2 * n - 1}`]: "muted", ...range(i, i + n - 1, 0, hit ? "found" : "window") } }); if (hit) break; }
      return cells(`repeatedSubstringPattern("${s}") = true`, [d], frames);
    },
  },

  "repeated-string-match": {
    approach: "b can only fit inside a repeated enough to cover it, plus one extra copy for a start in the middle of a; try exactly those two counts.",
    idea: ["Fewer than ceil(len(b) / len(a)) copies are too short to contain b.", "If b starts partway into a copy, it may spill into one more copy.", "So test q = ceil(len(b) / len(a)) and q + 1; if neither contains b, more copies will not help."],
    code: `def repeatedStringMatch(a, b):
    q = -(-len(b) // len(a))
    for times in (q, q + 1):
        if b in a * times:
            return times
    return -1`,
    lang: "python", time: "O(n · (m + n))", space: "O(m + n)",
    viz: () => {
      const a = "abcd", b = "cdabcdab", q = Math.ceil(b.length / a.length), frames: CellsFrame[] = []; let ans = -1;
      for (const t of [q, q + 1]) {
        const r = a.repeat(t);
        for (let i = 0; i + b.length <= r.length; i++) { const hit = r.slice(i, i + b.length) === b; frames.push({ note: `${t} copies "${r}": start ${i} → "${r.slice(i, i + b.length)}" ${hit ? "= b" : "≠ b"}`, rows: [r.split("")], tones: range(i, i + b.length - 1, 0, hit ? "found" : "window") }); if (hit) { ans = t; break; } }
        if (ans > 0) break;
      }
      frames.push({ note: `Answer ${ans} copies`, rows: [a.repeat(ans).split("")], tones: range(2, 2 + b.length - 1, 0, "found") });
      return cells(`repeatedStringMatch("${a}", "${b}") = ${ans}`, [a.repeat(q + 1).split("")], frames);
    },
  },

  "rotate-string": {
    approach: "Every rotation of s appears inside s + s, so goal is a rotation exactly when lengths match and goal is a substring of s + s.",
    idea: ["Rotating s by k gives s[k:] + s[:k], which is the slice of s + s starting at k.", "So the rotations are the n windows of length n in s + s.", "Equal lengths are required, otherwise a shorter goal would match by accident."],
    code: `def rotateString(s, goal):
    return len(s) == len(goal) and goal in s + s`,
    lang: "python", time: "O(n)", space: "O(n)",
    viz: () => {
      const s = "abcde", goal = "cdeab", d = (s + s).split(""), frames: CellsFrame[] = [];
      for (let k = 0; k < s.length; k++) { const w = (s + s).slice(k, k + s.length), hit = w === goal; frames.push({ note: `Rotation by ${k} = "${w}" ${hit ? "= goal → true" : "≠ goal"}`, tones: range(k, k + s.length - 1, 0, hit ? "found" : "window") }); if (hit) break; }
      return cells(`rotateString("${s}", "${goal}") = true`, [d], frames);
    },
  },

  "longest-common-prefix": {
    approach: "Vertical scan: compare column i of every string; the first column with a disagreement (or a string that ends) cuts the prefix.",
    idea: ["zip(*strs) yields column i of all strings and stops at the shortest string.", "If a column has more than one distinct character, the prefix is everything before it.", "If no column disagrees, the shortest string is the prefix."],
    code: `def longestCommonPrefix(strs):
    for i, column in enumerate(zip(*strs)):
        if len(set(column)) > 1:
            return strs[0][:i]
    return min(strs, key=len)`,
    lang: "python", time: "O(total characters)", space: "O(1)",
    viz: () => {
      const strs = ["flower", "flow", "flight"], W = 6, c = strs.map((w) => [...w.split(""), ...Array(W - w.length).fill(null)]), frames: TableFrame[] = [];
      for (let i = 0; i < 4; i++) {
        const col = strs.map((w) => w[i]), same = new Set(col).size === 1, t: Record<string, Tone> = {};
        strs.forEach((_, r) => { for (let j = 0; j < i; j++) t[`${r}:${j}`] = "found"; t[`${r}:${i}`] = same ? "active" : "bad"; });
        frames.push({ note: `Column ${i}: ${col.map((x) => `'${x}'`).join(", ")} → ${same ? "all equal, extend" : `mismatch → prefix "${strs[0].slice(0, i)}"`}`, cells: c, tones: t });
        if (!same) break;
      }
      return { kind: "table", title: "longestCommonPrefix = \"fl\"", rowHead: strs, colHead: Array.from({ length: W }, (_, i) => String(i)), frames };
    },
  },

  "compare-version-numbers": {
    approach: "Split both versions on '.', compare revisions as integers left to right, treating missing revisions as 0.",
    idea: ["int() drops leading zeros, so '01' and '001' are both 1.", "zip_longest pads the shorter version with '0'.", "The first revision that differs decides the answer; if none differ the versions are equal."],
    code: `from itertools import zip_longest
def compareVersion(version1, version2):
    for a, b in zip_longest(version1.split("."), version2.split("."), fillvalue="0"):
        x, y = int(a), int(b)
        if x != y:
            return 1 if x > y else -1
    return 0`,
    lang: "python", time: "O(m + n)", space: "O(m + n)",
    viz: () => {
      const v1 = "1.01.3", v2 = "1.001.10.0", A = v1.split("."), B = v2.split("."), W = Math.max(A.length, B.length), frames: CellsFrame[] = [];
      const pad = (x: string[]) => [...x, ...Array(W - x.length).fill("0")]; let ans = 0;
      for (let i = 0; i < W; i++) {
        const x = +(A[i] ?? "0"), y = +(B[i] ?? "0");
        if (x !== y) ans = x > y ? 1 : -1;
        frames.push({ note: `Revision ${i}: ${x} vs ${y}${A[i] == null ? " (missing → 0)" : ""} → ${x === y ? "equal, keep going" : `${x} ${x > y ? ">" : "<"} ${y} → return ${ans}`}`, tones: { [`0:${i}`]: x === y ? "found" : "bad", [`1:${i}`]: x === y ? "found" : "bad" } });
        if (ans) break;
      }
      return cells(`compareVersion("${v1}", "${v2}") = ${ans}`, [pad(A), pad(B)], frames, ["v1", "v2"]);
    },
  },

  "length-of-last-word": {
    approach: "Scan from the end: skip trailing spaces, then count letters until the next space or the start.",
    idea: ["Trailing spaces do not belong to any word, so skip them first.", "i now sits on the last letter of the last word.", "Walk j left until a space (or before index 0); the length is i - j."],
    code: `def lengthOfLastWord(s):
    i = len(s) - 1
    while s[i] == " ":
        i -= 1
    j = i
    while j >= 0 and s[j] != " ":
        j -= 1
    return i - j`,
    lang: "python", time: "O(n)", space: "O(1)",
    viz: () => {
      const s = "fly me to  moon  ", a = s.split("").map((c) => (c === " " ? "␣" : c)), frames: CellsFrame[] = []; let i = s.length - 1;
      while (s[i] === " ") { frames.push({ note: "Trailing space → skip", tones: { [`0:${i}`]: "muted" }, marks: [{ i, label: "i" }] }); i--; }
      let j = i;
      while (j >= 0 && s[j] !== " ") { frames.push({ note: `'${s[j]}' is part of the last word (length ${i - j + 1})`, tones: { ...range(j, i, 0, "window"), [`0:${j}`]: "active" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] }); j--; }
      frames.push({ note: `Space at ${j} ends the word → length ${i - j}`, tones: { ...range(j + 1, i, 0, "found"), [`0:${j}`]: "bad" }, marks: [{ i, label: "i" }, { i: j, label: "j" }] });
      return cells(`lengthOfLastWord = ${i - j}`, [a], frames);
    },
  },

  "multiply-strings": {
    approach: "Grade-school multiplication into an array of m + n digits: num1[i] × num2[j] lands on positions i + j and i + j + 1.",
    idea: ["The product of an m-digit and an n-digit number has at most m + n digits.", "Digit i of num1 times digit j of num2 contributes to place i + j + 1 (and its carry to i + j).", "Add the product to res[i + j + 1], keep its last digit there and push the carry left.", "Strip leading zeros; an empty string means the product is 0."],
    code: `def multiply(num1, num2):
    m, n = len(num1), len(num2)
    res = [0] * (m + n)
    for i in range(m - 1, -1, -1):
        for j in range(n - 1, -1, -1):
            p = int(num1[i]) * int(num2[j]) + res[i + j + 1]
            res[i + j + 1] = p % 10
            res[i + j] += p // 10
    return "".join(map(str, res)).lstrip("0") or "0"`,
    lang: "python", time: "O(m · n)", space: "O(m + n)",
    viz: () => {
      const a = "123", b = "45", res = Array(a.length + b.length).fill(0), frames: CellsFrame[] = [];
      for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
        const before = res[i + j + 1], p = +a[i] * +b[j] + before; res[i + j + 1] = p % 10; res[i + j] += Math.floor(p / 10);
        frames.push({ note: `${a[i]} × ${b[j]} + ${before} = ${p} → place ${i + j + 1} keeps ${p % 10}, carry ${Math.floor(p / 10)} to place ${i + j}`, rows: [[...res]], tones: { [`0:${i + j + 1}`]: "found", [`0:${i + j}`]: "active" } });
      }
      frames.push({ note: `Strip the leading zero → "${res.join("").replace(/^0+/, "")}" (123 × 45 = 5535)`, rows: [[...res]], tones: { "0:0": "muted", ...range(1, res.length - 1, 0, "done") } });
      return cells(`multiply("${a}", "${b}")`, [res.map(() => 0)], frames);
    },
  },

  "integer-to-english-words": {
    approach: "Split the number into groups of three digits (billions, millions, thousands, units); every group is spoken the same way, followed by its scale word.",
    idea: ["A three-digit group reads as: hundreds digit + 'Hundred', then a tens word for 20 and up, then a word for 1 to 19.", "Walk the scales from Billion down, taking num // scale as the group and keeping num % scale.", "Skip groups that are zero so 1000000 is not 'One Million Thousand'.", "0 is the only number that says 'Zero'."],
    code: `ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
def numberToWords(num):
    if num == 0:
        return "Zero"
    def three(n):
        out = []
        if n >= 100:
            out += [ONES[n // 100], "Hundred"]
            n %= 100
        if n >= 20:
            out.append(TENS[n // 10])
            n %= 10
        if n:
            out.append(ONES[n])
        return out
    words = []
    for scale, name in ((10**9, "Billion"), (10**6, "Million"), (1000, "Thousand"), (1, "")):
        if num >= scale:
            words += three(num // scale) + ([name] if name else [])
            num %= scale
    return " ".join(words)`,
    lang: "python", time: "O(1)", space: "O(1)",
    viz: () => {
      const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"], TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
      const three = (n: number) => { const o: string[] = []; if (n >= 100) { o.push(ONES[Math.floor(n / 100)], "Hundred"); n %= 100; } if (n >= 20) { o.push(TENS[Math.floor(n / 10)]); n %= 10; } if (n) o.push(ONES[n]); return o; };
      let num = 1234567; const scales: [number, string][] = [[1e9, "Billion"], [1e6, "Million"], [1000, "Thousand"], [1, ""]], c: (string | number | null)[][] = scales.map(([, n]) => [n || "(units)", null, null]), frames: TableFrame[] = [], words: string[] = [];
      scales.forEach(([sc], k) => {
        if (num < sc) { c[k][1] = 0; frames.push({ note: `${1234567} has no ${scales[k][1]} group → skip`, cells: c.map((r) => [...r]), active: [k, 1] }); return; }
        const g = Math.floor(num / sc), w = three(g); num %= sc; c[k][1] = g; c[k][2] = w.join(" "); words.push(...w, ...(scales[k][1] ? [scales[k][1]] : []));
        frames.push({ note: `Group ${g} → "${w.join(" ")}"${scales[k][1] ? ` + "${scales[k][1]}"` : ""}; ${num} left`, cells: c.map((r) => [...r]), active: [k, 2] });
      });
      frames.push({ note: `"${words.join(" ")}"`, cells: c.map((r) => [...r]) });
      return { kind: "table", title: "numberToWords(1234567)", rowHead: ["Billion", "Million", "Thousand", "units"], colHead: ["scale", "group", "words"], frames };
    },
  },

  "text-justification": {
    approach: "Greedily pack as many words as fit on each line, then spread the spare spaces round-robin over the gaps, giving extra spaces to the leftmost gaps; the last line is left-justified.",
    idea: ["A word fits if letters so far + one space per gap + the new word stay within maxWidth.", "When the next word does not fit, the line is final: maxWidth - letters spaces must be shared by the gaps.", "Handing them out one at a time from the left gives the left gaps the extra spaces, as required.", "A line with one word, and the last line, are padded on the right instead."],
    code: `def fullJustify(words, maxWidth):
    out, line, width = [], [], 0
    for w in words:
        if width + len(w) + len(line) > maxWidth:
            gaps = len(line) - 1 or 1
            for k in range(maxWidth - width):
                line[k % gaps] += " "
            out.append("".join(line))
            line, width = [], 0
        line.append(w)
        width += len(w)
    out.append(" ".join(line).ljust(maxWidth))
    return out`,
    lang: "python", time: "O(total characters)", space: "O(maxWidth)",
    viz: () => {
      const words = ["This", "is", "an", "example", "of", "text", "justification."], W = 16, out: string[] = [], frames: TableFrame[] = [];
      const show = (s: string) => s.replace(/ /g, "·");
      const c = (cur: string[]) => [0, 1, 2].map((k) => [k < out.length ? show(out[k]) : k === out.length ? cur.join(" ") : ""]);
      let line: string[] = [], width = 0;
      for (const w of words) {
        if (width + w.length + line.length > W) {
          const gaps = line.length - 1 || 1, spare = W - width, packed = [...line];
          for (let k = 0; k < spare; k++) packed[k % gaps] += " ";
          frames.push({ note: `"${w}" does not fit: ${line.length} words, ${width} letters → share ${spare} spaces over ${gaps} gap${gaps === 1 ? "" : "s"}, left gaps first`, cells: c(line), active: [out.length, 0] });
          out.push(packed.join("")); line = []; width = 0;
        }
        line.push(w); width += w.length;
        frames.push({ note: `Add "${w}" → ${width} letters + ${line.length - 1} gap${line.length === 2 ? "" : "s"} = ${width + line.length - 1} <= ${W}`, cells: c(line), active: [out.length, 0] });
      }
      out.push(line.join(" ").padEnd(W));
      frames.push({ note: "Last line: single spaces, padded on the right", cells: c([]), active: [2, 0] });
      return { kind: "table", title: `fullJustify(maxWidth = ${W}), · = space`, rowHead: ["line 1", "line 2", "line 3"], colHead: ["text"], frames };
    },
  },

  "implement-trie-prefix-tree": {
    approach: "A tree of nested dicts, one edge per character, with an end marker on nodes where a word finishes; every operation walks one node per character.",
    idea: ["insert walks the word, creating missing children, then marks the last node as a word end.", "search walks the word and needs the end marker on the final node.", "startsWith only needs the walk to succeed: any node reached is some word's prefix.", "All three are O(length of the string)."],
    code: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and "$" in node

    def startsWith(self, prefix):
        return self._walk(prefix) is not None`,
    lang: "python", time: "O(L) per call", space: "O(total characters)",
    viz: () => {
      const nodes: TNode[] = ["•", "a", "p", "p", "l", "e"].map((label, id) => ({ id, label, parent: id ? id - 1 : null })), path = (k: number) => Array.from({ length: k + 1 }, (_, i) => i);
      const T = (ids: number[], last: Tone): Record<number, Tone> => ({ ...all(path(5), "muted"), ...all(ids, "window"), [ids[ids.length - 1]]: last });
      const frames: TreeFrame[] = [
        { note: "insert(\"apple\"): create a, p, p, l, e and mark e as a word end", tones: T(path(5), "found"), badges: { 5: "end" } },
        { note: "search(\"apple\"): walk 5 nodes, e has the end mark → true", tones: T(path(5), "found"), badges: { 5: "end" } },
        { note: "search(\"app\"): the walk succeeds but the second p is not a word end → false", tones: T(path(3), "bad"), badges: { 5: "end" } },
        { note: "startsWith(\"app\"): the walk succeeds → true", tones: T(path(3), "found"), badges: { 5: "end" } },
        { note: "insert(\"app\"): every node exists, just add the end mark on the second p", tones: T(path(3), "found"), badges: { 3: "end", 5: "end" } },
        { note: "search(\"app\") → true now", tones: T(path(3), "found"), badges: { 3: "end", 5: "end" } },
      ];
      return tree("Trie: insert, search, startsWith", nodes, frames);
    },
  },

  "search-suggestions-system": {
    approach: "Sort the products; for each typed prefix, binary-search where the prefix would go and take up to three products from there that start with it.",
    idea: ["In sorted order, all words with a given prefix sit together, starting at bisect_left(prefix).", "The first three of them are the lexicographically smallest suggestions.", "Each prefix costs one binary search plus three checks."],
    code: `import bisect
def suggestedProducts(products, searchWord):
    products.sort()
    out, prefix = [], ""
    for ch in searchWord:
        prefix += ch
        i = bisect.bisect_left(products, prefix)
        out.append([p for p in products[i:i + 3] if p.startswith(prefix)])
    return out`,
    lang: "python", time: "O(n log n + L log n)", space: "O(1) besides the output",
    viz: () => {
      const P = ["mobile", "mouse", "moneypot", "monitor", "mousepad"].sort(), word = "mouse", frames: TableFrame[] = [];
      frames.push({ note: `Sorted: ${P.join(", ")}`, cells: P.map((p) => [p]) });
      for (let k = 1; k <= word.length; k++) {
        const pre = word.slice(0, k); let i = 0; while (i < P.length && P[i] < pre) i++;
        const picks = P.slice(i, i + 3).filter((p) => p.startsWith(pre)), t: Record<string, Tone> = {};
        P.forEach((p, r) => { if (r >= i && r < i + 3) t[`${r}:0`] = p.startsWith(pre) ? "found" : "bad"; });
        frames.push({ note: `"${pre}": bisect_left → ${i}; suggest [${picks.join(", ")}]`, cells: P.map((p) => [p]), active: [i, 0], tones: t });
      }
      return { kind: "table", title: `suggestedProducts(..., "${word}")`, rowHead: P.map((_, i) => String(i)), colHead: ["product"], frames };
    },
  },

  "remove-sub-folders-from-the-filesystem": {
    approach: "Sort the paths; a sub-folder then comes right after its parent, so keep a path only if it does not start with the last kept path plus '/'.",
    idea: ["After sorting, '/a' comes before '/a/b' and before any of its other sub-folders.", "Compare each path with the last one kept: starting with kept + '/' means it is inside it.", "The '/' matters: '/a/bc' is not inside '/a/b'."],
    code: `def removeSubfolders(folder):
    out = []
    for f in sorted(folder):
        if not out or not f.startswith(out[-1] + "/"):
            out.append(f)
    return out`,
    lang: "python", time: "O(n · L log n)", space: "O(n · L)",
    viz: () => {
      const F = ["/a", "/a/b", "/c/d", "/c/d/e", "/c/de", "/c/f"].sort(), frames: TableFrame[] = [], c: (string | number | null)[][] = F.map((f) => [f, null]), kept: string[] = [];
      F.forEach((f, r) => {
        const inside = kept.length > 0 && f.startsWith(kept[kept.length - 1] + "/");
        c[r][1] = inside ? "drop" : "keep";
        frames.push({ note: inside ? `"${f}" starts with "${kept[kept.length - 1]}/" → sub-folder, drop` : `"${f}" ${kept.length ? `does not start with "${kept[kept.length - 1]}/"` : "is first"} → keep`, cells: c.map((x) => [...x]), active: [r, 1], tones: { [`${r}:0`]: inside ? "bad" : "found" } });
        if (!inside) kept.push(f);
      });
      return { kind: "table", title: `removeSubfolders → [${kept.join(", ")}]`, rowHead: F.map((_, i) => String(i)), colHead: ["sorted path", "result"], frames };
    },
  },

  "design-add-and-search-words-data-structure": {
    approach: "Store words in a trie; search walks it with DFS, following one child for a letter and every child for '.'.",
    idea: ["addWord is a normal trie insert with an end marker.", "search(word, i): a letter must exist as a child; '.' tries all children.", "Reaching the end of the pattern succeeds only on a word end.", "Without dots it is O(L); dots branch at most 26 ways each."],
    code: `class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$"] = True

    def search(self, word):
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            ch = word[i]
            if ch == ".":
                return any(dfs(child, i + 1) for key, child in node.items() if key != "$")
            return ch in node and dfs(node[ch], i + 1)
        return dfs(self.root, 0)`,
    lang: "python", time: "O(L) to add, O(26^dots · L) to search", space: "O(total characters)",
    viz: () => trieWildcard(["bad", "dad", "mad"], ".ad"),
  },

  "camelcase-matching": {
    approach: "Two pointers per query: pattern letters must appear in order, and any uppercase letter of the query that is not the next pattern letter breaks the match.",
    idea: ["Lowercase letters may be inserted freely, uppercase ones may not.", "Walk the query: if the char equals pattern[j], advance j.", "Otherwise an uppercase char is an illegal insertion → false; lowercase is skipped.", "At the end the whole pattern must have been used."],
    code: `def camelMatch(queries, pattern):
    def match(q):
        j = 0
        for ch in q:
            if j < len(pattern) and ch == pattern[j]:
                j += 1
            elif ch.isupper():
                return False
        return j == len(pattern)
    return [match(q) for q in queries]`,
    lang: "python", time: "O(total length of queries)", space: "O(1) per query",
    viz: () => {
      const pat = "FoBa", frames: CellsFrame[] = [], W = 10;
      for (const q of ["FootBall", "FooBarTest"]) {
        const row = [...q.split(""), ...Array(W - q.length).fill("")], t: Record<string, Tone> = {}; let j = 0, ok = true;
        for (let i = 0; i < q.length; i++) {
          const ch = q[i];
          if (j < pat.length && ch === pat[j]) { j++; t[`0:${i}`] = "found"; frames.push({ note: `"${q}": '${ch}' matches pattern[${j - 1}]`, rows: [row], tones: { ...t } }); }
          else if (ch >= "A" && ch <= "Z") { t[`0:${i}`] = "bad"; ok = false; frames.push({ note: `"${q}": uppercase '${ch}' is not the next pattern letter → false`, rows: [row], tones: { ...t } }); break; }
          else { t[`0:${i}`] = "muted"; frames.push({ note: `"${q}": lowercase '${ch}' may be inserted → skip`, rows: [row], tones: { ...t } }); }
        }
        if (ok) frames.push({ note: `"${q}": all of "${pat}" used → ${j === pat.length}`, rows: [row], tones: { ...t } });
      }
      return cells(`camelMatch(..., "${pat}")`, [Array(W).fill("")], frames);
    },
  },

  "prefix-and-suffix-search": {
    approach: "Precompute every (prefix, suffix) pair of every word into one dictionary key 'prefix#suffix'; later words overwrite earlier ones, so a lookup returns the largest index.",
    idea: ["Words are at most 7 letters, so each has at most 8 × 8 = 64 pairs.", "Store key prefix + '#' + suffix → index, inserting words in order so the larger index wins.", "f(pref, suff) is a single dictionary lookup."],
    code: `class WordFilter:
    def __init__(self, words):
        self.index = {}
        for i, w in enumerate(words):
            for p in range(len(w) + 1):
                for s in range(len(w) + 1):
                    self.index[w[:p] + "#" + w[s:]] = i

    def f(self, pref, suff):
        return self.index.get(pref + "#" + suff, -1)`,
    lang: "python", time: "O(n · L³) to build, O(L) per query", space: "O(n · L³)",
    viz: () => {
      const w = "ape", L = w.length, c: (string | number | null)[][] = Array.from({ length: L + 1 }, () => Array(L + 1).fill(null)), frames: TableFrame[] = [];
      for (let p = 0; p <= L; p++) {
        for (let s = 0; s <= L; s++) c[p][s] = `${w.slice(0, p)}#${w.slice(s)}`;
        frames.push({ note: `Prefix "${w.slice(0, p)}": keys with every suffix → index 0`, cells: c.map((r) => [...r]), active: [p, L] });
      }
      frames.push({ note: "f(\"a\", \"e\") looks up \"a#e\" → 0. A later word with the same key would overwrite it with its larger index", cells: c.map((r) => [...r]), active: [1, 2] });
      return { kind: "table", title: `Keys for "${w}" (rows prefix length, columns suffix start)`, rowHead: ["0", "1", "2", "3"], colHead: ["0", "1", "2", "3"], frames };
    },
  },

  "word-search-ii": {
    approach: "Put all words in a trie, then DFS from every cell walking the grid and the trie together; a missing trie child prunes the path at once, and found words are removed from the trie.",
    idea: ["One DFS per start cell searches for every word at the same time, because the trie holds them all.", "Step to a neighbour only if its letter is a child of the current trie node.", "A node holding a word means that word is found: record it and delete the mark so it is reported once.", "Prune trie leaves after use so later searches skip dead branches."],
    code: `def findWords(board, words):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {})
        node["$"] = w
    m, n, out = len(board), len(board[0]), []
    def dfs(r, c, parent):
        ch = board[r][c]
        node = parent[ch]
        if "$" in node:
            out.append(node.pop("$"))
        board[r][c] = "#"
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < m and 0 <= nc < n and board[nr][nc] in node:
                dfs(nr, nc, node)
        board[r][c] = ch
        if not node:
            parent.pop(ch)
    for r in range(m):
        for c in range(n):
            if board[r][c] in root:
                dfs(r, c, root)
    return out`,
    lang: "python", time: "O(m · n · 4^L)", space: "O(total word length)",
    viz: () => wordSearchGrid(),
  },

  "longest-word-in-dictionary": {
    approach: "Sort the words; a word can be built one letter at a time exactly when its prefix without the last letter was buildable, which sorting guarantees was decided earlier.",
    idea: ["Sorted order puts every prefix before the longer words that extend it.", "Keep a set of buildable words, starting with the empty string.", "w is buildable if w[:-1] is in the set; add it.", "Equal lengths: the first one seen is lexicographically smallest, so only replace the best on a strictly longer word."],
    code: `def longestWord(words):
    built, best = {""}, ""
    for w in sorted(words):
        if w[:-1] in built:
            built.add(w)
            if len(w) > len(best):
                best = w
    return best`,
    lang: "python", time: "O(n log n · L)", space: "O(n · L)",
    viz: () => {
      const W = ["a", "banana", "app", "appl", "ap", "apply", "apple"].sort(), built = new Set([""]), c: (string | number | null)[][] = W.map((w) => [w, w.slice(0, -1) || "(empty)", null]), frames: TableFrame[] = []; let best = "";
      W.forEach((w, r) => {
        const ok = built.has(w.slice(0, -1)); if (ok) { built.add(w); if (w.length > best.length) best = w; }
        c[r][2] = ok ? "yes" : "no";
        frames.push({ note: ok ? `"${w.slice(0, -1)}" was buildable → "${w}" is too. best = "${best}"` : `"${w.slice(0, -1)}" was never built → "${w}" cannot be built letter by letter`, cells: c.map((x) => [...x]), active: [r, 2], tones: { [`${r}:0`]: ok ? "found" : "bad" } });
      });
      return { kind: "table", title: `longestWord = "${best}"`, rowHead: W.map((_, i) => String(i)), colHead: ["sorted word", "w[:-1]", "buildable"], frames };
    },
  },

  "concatenated-words": {
    approach: "Word break for every word: dp[i] is true when w[:i] splits into dictionary words, never using the whole word itself as one piece.",
    idea: ["Put all words in a set.", "dp[0] = true; dp[i] = some j < i with dp[j] true and w[j:i] in the set.", "Forbid the single piece (0, len(w)), otherwise every word would count itself.", "Words whose dp[len] is true are made of at least two shorter words."],
    code: `def findAllConcatenatedWordsInADict(words):
    vocab = set(words)
    def can(w):
        dp = [True] + [False] * len(w)
        for i in range(1, len(w) + 1):
            for j in range(i):
                if dp[j] and w[j:i] in vocab and (j, i) != (0, len(w)):
                    dp[i] = True
                    break
        return dp[-1]
    return [w for w in words if w and can(w)]`,
    lang: "python", time: "O(n · L³)", space: "O(n · L)",
    viz: () => {
      const vocab = new Set(["cat", "cats", "dog", "catsdogcats", "rat"]), w = "catsdogcats", dp = [true, ...Array(w.length).fill(false)], frames: CellsFrame[] = [];
      const row = () => ["T", ...dp.slice(1).map((v) => (v ? "T" : ""))];
      frames.push({ note: "dp[0] = true: the empty prefix splits trivially", rows: [["", ...w.split("")], row()], tones: { "1:0": "found" } });
      for (let i = 1; i <= w.length; i++) for (let j = 0; j < i; j++) {
        if (dp[j] && vocab.has(w.slice(j, i)) && !(j === 0 && i === w.length)) { dp[i] = true; frames.push({ note: `dp[${j}] is true and "${w.slice(j, i)}" is a word → dp[${i}] = true`, rows: [["", ...w.split("")], row()], tones: { ...range(j + 1, i, 0, "window"), [`1:${j}`]: "done", [`1:${i}`]: "found" } }); break; }
      }
      frames.push({ note: `dp[${w.length}] = ${dp[w.length]} → "${w}" = cats + dog + cats (the whole word alone is not allowed)`, rows: [["", ...w.split("")], row()], tones: { [`1:${w.length}`]: "found" } });
      return cells(`Is "${w}" concatenated?`, [["", ...w.split("")], ["", ...w.split("").map(() => "")]], frames, ["char", "dp"]);
    },
  },

  "maximum-xor-with-an-element-from-array": {
    approach: "Offline: sort queries by limit m and insert numbers into a bitwise trie only once they are <= m; then each query greedily takes the opposite bit from the top.",
    idea: ["Sorting nums and queries by m means the trie always holds exactly the allowed numbers.", "For x, walk from the highest bit and prefer the child with the opposite bit: that bit of the XOR becomes 1, which beats anything in lower bits.", "If the opposite child is missing, follow the same bit.", "An empty trie (nothing <= m) answers -1."],
    code: `def maximizeXor(nums, queries):
    nums.sort()
    order = sorted(range(len(queries)), key=lambda k: queries[k][1])
    root, ans, i = {}, [-1] * len(queries), 0
    for k in order:
        x, m = queries[k]
        while i < len(nums) and nums[i] <= m:
            node = root
            for b in range(29, -1, -1):
                node = node.setdefault((nums[i] >> b) & 1, {})
            i += 1
        if root:
            node, best = root, 0
            for b in range(29, -1, -1):
                bit = (x >> b) & 1
                if 1 - bit in node:
                    best |= 1 << b
                    node = node[1 - bit]
                else:
                    node = node[bit]
            ans[k] = best
    return ans`,
    lang: "python", time: "O((n + q) · 30 + sorting)", space: "O(n · 30)",
    viz: () => {
      const nums = [0, 1, 2, 3, 4], qs: [number, number][] = [[3, 1], [1, 3], [5, 6]], w = 3, nodes: TNode[] = [{ id: 0, label: "•", parent: null }], kid: Record<string, number> = {};
      for (const v of nums) { let p = 0, pre = ""; for (const b of bin(v, w)) { pre += b; if (!(pre in kid)) { kid[pre] = nodes.length; nodes.push({ id: nodes.length, label: b, parent: p, side: b === "0" ? "L" : "R" }); } p = kid[pre]; } }
      const live = new Set<number>([0]), frames: TreeFrame[] = []; let i = 0;
      const base = () => Object.fromEntries(nodes.map((n) => [n.id, live.has(n.id) ? "window" : "muted"])) as Record<number, Tone>;
      for (const [x, m] of qs) {
        const added: number[] = [];
        while (i < nums.length && nums[i] <= m) { let pre = ""; for (const b of bin(nums[i], w)) { pre += b; live.add(kid[pre]); } added.push(nums[i]); i++; }
        frames.push({ note: `Query (x = ${x}, m = ${m}): insert ${added.join(", ")} (every number <= ${m})`, tones: base() });
        let pre = "", best = 0; const path: number[] = [0];
        bin(x, w).forEach((b, k) => {
          const want = b === "0" ? "1" : "0", has = kid[pre + want] != null && live.has(kid[pre + want]);
          pre += has ? want : b; path.push(kid[pre]); best = best * 2 + (has ? 1 : 0);
          frames.push({ note: `bit ${w - 1 - k} of ${x} is ${b}: ${has ? `take ${want} → XOR bit 1` : `no ${want} branch → take ${b}, XOR bit 0`}${k === w - 1 ? ` → answer ${best}` : ""}`, tones: { ...base(), ...all(path, "found"), [path[path.length - 1]]: "active" } });
        });
      }
      return tree("maximizeXor([0,1,2,3,4], ...) = [3, 3, 7]", nodes, frames);
    },
  },

  "maximum-genetic-difference-query": {
    approach: "DFS from the root keeping a bitwise trie (with counts) of the values on the current root-to-node path; answer each node's queries when the DFS is at that node, and remove the node on the way out.",
    idea: ["A query at node v may only use v and its ancestors, which is exactly the DFS path.", "Insert v into the trie when entering it and decrement its counts when leaving, so the trie always matches the path.", "Best XOR with val: from the top bit, go to the opposite bit if that child still has a positive count.", "An explicit stack avoids recursion limits on deep trees."],
    code: `from collections import defaultdict
def maxGeneticDifference(parents, queries):
    B = 18
    kids, root = defaultdict(list), -1
    for v, p in enumerate(parents):
        if p == -1:
            root = v
        else:
            kids[p].append(v)
    at = defaultdict(list)
    for k, (node, val) in enumerate(queries):
        at[node].append((val, k))
    trie, ans = [[0, 0, 0]], [0] * len(queries)
    def update(x, d):
        cur = 0
        for b in range(B - 1, -1, -1):
            bit = (x >> b) & 1
            if not trie[cur][bit]:
                trie.append([0, 0, 0])
                trie[cur][bit] = len(trie) - 1
            cur = trie[cur][bit]
            trie[cur][2] += d
    def best(x):
        cur, res = 0, 0
        for b in range(B - 1, -1, -1):
            want = 1 - ((x >> b) & 1)
            nxt = trie[cur][want]
            if nxt and trie[nxt][2]:
                res |= 1 << b
                cur = nxt
            else:
                cur = trie[cur][1 - want]
        return res
    stack = [(root, False)]
    while stack:
        v, leaving = stack.pop()
        if leaving:
            update(v, -1)
            continue
        update(v, 1)
        for val, k in at[v]:
            ans[k] = best(val)
        stack.append((v, True))
        for c in kids[v]:
            stack.append((c, False))
    return ans`,
    lang: "python", time: "O((n + q) · 18)", space: "O(n · 18)",
    viz: () => {
      const parents = [3, 7, -1, 2, 0, 7, 0, 2], queries: [number, number][] = [[4, 6], [1, 15], [0, 5]];
      const nodes: TNode[] = parents.map((p, v) => ({ id: v, label: String(v), parent: p < 0 ? null : p }));
      const kids = (v: number) => parents.map((p, c) => [p, c]).filter(([p]) => p === v).map(([, c]) => c);
      const frames: TreeFrame[] = [], path: number[] = [], seen = new Set<number>(), badges: Record<number, string> = {};
      const go = (v: number) => {
        path.push(v); seen.add(v);
        const tones = (t: Tone) => ({ ...Object.fromEntries(parents.map((_, u) => [u, seen.has(u) ? "done" : "muted"])), ...all(path, "window"), [v]: t }) as Record<number, Tone>;
        const qs = queries.filter(([n]) => n === v);
        if (!qs.length) frames.push({ note: `Enter ${v}: trie now holds the path [${path.join(", ")}]`, tones: tones("active"), badges: { ...badges } });
        for (const [, val] of qs) { const b = Math.max(...path.map((u) => u ^ val)), who = path.find((u) => (u ^ val) === b)!; badges[v] = `q${val}: ${b}`; frames.push({ note: `Query (${v}, ${val}): trie of [${path.join(", ")}] gives ${val} XOR ${who} = ${b}`, tones: tones("found"), badges: { ...badges } }); }
        for (const c of kids(v)) go(c);
        path.pop();
      };
      go(parents.indexOf(-1));
      return tree("maxGeneticDifference = [6, 14, 7]", nodes, frames);
    },
  },

  "count-pairs-with-xor-in-a-range": {
    approach: "Count pairs with XOR < high + 1 minus pairs with XOR < low, using a bitwise trie with subtree counts that answers 'how many earlier y have x XOR y < limit'.",
    idea: ["Pairs in [low, high] = f(high + 1) - f(low), where f(L) counts pairs with XOR < L.", "Walk x and L bit by bit from the top. Where L has a 1, every y whose XOR bit here is 0 is already smaller: add the count of the child with x's bit, then continue down the other child.", "Where L has a 0 the XOR bit must be 0 too, so follow x's bit.", "Process numbers left to right, querying before inserting, so each pair is counted once."],
    code: `def countPairs(nums, low, high):
    B = 15
    trie = [[0, 0, 0]]
    def insert(x):
        cur = 0
        for b in range(B - 1, -1, -1):
            bit = (x >> b) & 1
            if not trie[cur][bit]:
                trie.append([0, 0, 0])
                trie[cur][bit] = len(trie) - 1
            cur = trie[cur][bit]
            trie[cur][2] += 1
    def less(x, limit):
        cur, total = 0, 0
        for b in range(B - 1, -1, -1):
            xb, lb = (x >> b) & 1, (limit >> b) & 1
            if lb:
                same = trie[cur][xb]
                if same:
                    total += trie[same][2]
                cur = trie[cur][1 - xb]
            else:
                cur = trie[cur][xb]
            if not cur:
                break
        return total
    ans = 0
    for x in nums:
        ans += less(x, high + 1) - less(x, low)
        insert(x)
    return ans`,
    lang: "python", time: "O(n · 15)", space: "O(n · 15)",
    viz: () => {
      const nums = [1, 4, 2, 7], low = 2, high = 6, B = 4, trie: number[][] = [[0, 0, 0]], frames: TableFrame[] = []; let ans = 0;
      const insert = (x: number) => { let cur = 0; for (let b = B - 1; b >= 0; b--) { const bit = (x >> b) & 1; if (!trie[cur][bit]) { trie.push([0, 0, 0]); trie[cur][bit] = trie.length - 1; } cur = trie[cur][bit]; trie[cur][2]++; } };
      const less = (x: number, lim: number) => { let cur = 0, total = 0; for (let b = B - 1; b >= 0; b--) { const xb = (x >> b) & 1, lb = (lim >> b) & 1; if (lb) { const s = trie[cur][xb]; if (s) total += trie[s][2]; cur = trie[cur][1 - xb]; } else cur = trie[cur][xb]; if (!cur) break; } return total; };
      const c: (string | number | null)[][] = nums.map(() => nums.map(() => null)), t: Record<string, Tone> = {};
      nums.forEach((x, i) => {
        const hi = less(x, high + 1), lo = less(x, low); ans += hi - lo;
        for (let j = 0; j < i; j++) { const v = x ^ nums[j]; c[i][j] = v; t[`${i}:${j}`] = v >= low && v <= high ? "found" : "muted"; }
        frames.push({ note: i ? `x = ${x}: earlier XORs < ${high + 1}: ${hi}, < ${low}: ${lo} → ${hi - lo} new pair${hi - lo === 1 ? "" : "s"} (total ${ans}); then insert ${x}` : `x = ${x}: trie is empty, nothing to pair with; insert ${x}`, cells: c.map((r) => [...r]), active: [i, Math.max(0, i - 1)], tones: { ...t } });
        insert(x);
      });
      frames.push({ note: `${ans} pairs have XOR in [${low}, ${high}] (green cells)`, cells: c.map((r) => [...r]), tones: { ...t } });
      return { kind: "table", title: `countPairs([1,4,2,7], ${low}, ${high}) = ${ans}`, rowHead: nums.map(String), colHead: nums.map(String), frames };
    },
  },
  // @@end
};

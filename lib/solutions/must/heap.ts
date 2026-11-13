// Solutions for the must-do "heap" questions that were new to the app (lib/patterns/overview/heap.problems.ts). See ../arrays.ts for the style.
import type { StackFrame } from "../../diagram";
import type { Solution } from "../types";

/** A priority queue drawn as a stack: the item that would be popped next is on top. */
const desc = (xs: number[]) => [...xs].sort((a, b) => b - a);
const asc = (xs: number[]) => [...xs].sort((a, b) => a - b);

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "seat-reservation-manager": {
    approach: "Seats from next upward are untouched, so only returned seats need a min-heap: reserve pops it when non-empty, otherwise hands out next.",
    idea: ["reserve must return the smallest free seat. Putting all n seats in a heap works, but costs O(n) up front.", "Notice that seats are handed out in order: every seat from next onward has never been reserved.", "So keep a min-heap only for seats given back with unreserve.", "reserve: if the heap is not empty, its top is smaller than next (it was handed out earlier), so pop it. Otherwise return next and add one.", "Each call is O(log m) where m is the number of returned seats, and the constructor is O(1)."],
    code: `import heapq
class SeatManager:
    def __init__(self, n):
        self.free = []        # min-heap of seats that were given back
        self.next = 1         # every seat from here on has never been taken

    def reserve(self):
        if self.free:
            return heapq.heappop(self.free)
        self.next += 1
        return self.next - 1

    def unreserve(self, seatNumber):
        heapq.heappush(self.free, seatNumber)`,
    lang: "python", time: "O(log n) per call", space: "O(n)",
    viz: () => {
      const free: number[] = [], frames: StackFrame[] = [];
      let next = 1;
      frames.push({ note: "SeatManager(5): no returned seats, next = 1. Seats 1 to 5 are all free", items: [], side: "next = 1" });
      const ops: [string, number?][] = [["reserve"], ["reserve"], ["unreserve", 2], ["reserve"], ["reserve"], ["reserve"], ["reserve"], ["unreserve", 5]];
      for (const [op, v] of ops) {
        if (op === "unreserve") { free.push(v!); frames.push({ note: `unreserve(${v}): push ${v} onto the min-heap of returned seats`, items: desc(free), incoming: v, side: `next = ${next}` }); continue; }
        if (free.length) { const s = Math.min(...free); free.splice(free.indexOf(s), 1); frames.push({ note: `reserve(): the heap is not empty, pop its minimum ${s}. It is below next = ${next}, so it is the smallest free seat`, items: desc(free), popped: [s], side: `next = ${next}` }); }
        else { frames.push({ note: `reserve(): no returned seats, so return next = ${next} and move next to ${next + 1}`, items: [], popped: [next], side: `next = ${next + 1}` }); next++; }
      }
      return { kind: "stack", title: "SeatManager: min-heap of returned seats", frames };
    },
  },

  "remove-stones-to-minimize-the-total": {
    approach: "Greedy with a max-heap: k times, take the largest pile and halve it (remove floor(x / 2)); the sum of the heap is the answer.",
    idea: ["One operation on a pile of x removes floor(x / 2) stones, so the biggest pile always removes the most.", "Choosing the biggest now never hurts later: halving a smaller pile instead would remove fewer stones, and the big pile would still be there.", "A max-heap gives the biggest pile in O(log n). Python's heapq is a min-heap, so store negated sizes.", "heapreplace pops the top and pushes the halved pile in one sift.", "Total O(n + k log n): heapify, then k operations."],
    code: `import heapq
def minStoneSum(piles, k):
    h = [-p for p in piles]   # max-heap through negation
    heapq.heapify(h)
    for _ in range(k):
        x = -h[0]
        heapq.heapreplace(h, -(x - x // 2))   # halve the biggest pile, rounding the removal down
    return -sum(h)`,
    lang: "python", time: "O(n + k log n)", space: "O(n)",
    viz: () => {
      const piles = [4, 3, 6, 7], k = 3, h = [...piles], frames: StackFrame[] = [];
      frames.push({ note: `piles [${piles.join(", ")}], k = ${k}. Total ${piles.reduce((a, b) => a + b, 0)}`, items: [], side: "heap empty" });
      frames.push({ note: "Heapify the piles into a max-heap in O(n): the largest pile is on top", items: asc(h), side: `total ${h.reduce((a, b) => a + b, 0)}` });
      for (let t = 0; t < k; t++) {
        const x = Math.max(...h); h.splice(h.indexOf(x), 1); const y = x - Math.floor(x / 2); h.push(y);
        frames.push({ note: `Operation ${t + 1}: the largest pile is ${x}; remove ${Math.floor(x / 2)} stones and push back ${y}`, items: asc(h), incoming: y, popped: [x], side: `total ${h.reduce((a, b) => a + b, 0)}` });
      }
      frames.push({ note: `${k} operations done. The remaining stones add up to ${h.reduce((a, b) => a + b, 0)}`, items: asc(h), side: `answer ${h.reduce((a, b) => a + b, 0)}` });
      return { kind: "stack", title: `minStoneSum([${piles.join(", ")}], ${k}) = ${h.reduce((a, b) => a + b, 0)}`, frames };
    },
  },

  "single-threaded-cpu": {
    approach: "Simulate the clock: sort task indexes by enqueue time, push every task that has arrived into a min-heap of (processing time, index), run its top.",
    idea: ["Sort the indexes by enqueue time so arrivals can be added in order with one pointer j.", "Keep a min-heap of the tasks that have arrived, keyed by (processing time, index): exactly the CPU's rule, ties going to the smaller index.", "Each step: if nothing is waiting and the next task arrives later, jump the clock to that arrival (the CPU is idle).", "Push every task with enqueue time <= t, pop the top, add its processing time to t and record its index.", "n pushes and n pops: O(n log n) with the sort."],
    code: `import heapq
def getOrder(tasks):
    order = sorted(range(len(tasks)), key=lambda i: tasks[i][0])   # by enqueue time
    ready, out, t, j = [], [], 0, 0      # ready: (processing time, index)
    while len(out) < len(tasks):
        if not ready and t < tasks[order[j]][0]:
            t = tasks[order[j]][0]       # idle: jump to the next arrival
        while j < len(order) and tasks[order[j]][0] <= t:
            i = order[j]
            heapq.heappush(ready, (tasks[i][1], i))
            j += 1
        p, i = heapq.heappop(ready)      # shortest task, smallest index on ties
        t += p
        out.append(i)
    return out`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const tasks = [[1, 2], [2, 4], [3, 2], [4, 1]], n = tasks.length, order = [...tasks.keys()].sort((a, b) => tasks[a][0] - tasks[b][0]);
      const ready: [number, number][] = [], out: number[] = [], frames: StackFrame[] = [];
      const show = () => [...ready].sort((a, b) => b[0] - a[0] || b[1] - a[1]).map(([p, i]) => `t${i} (${p})`);
      let t = 0, j = 0;
      frames.push({ note: "tasks as [enqueue, processing]: [1,2], [2,4], [3,2], [4,1]. The heap holds (processing time, index) of tasks that have arrived", items: [], side: "t = 0, order []" });
      while (out.length < n) {
        if (!ready.length && t < tasks[order[j]][0]) { t = tasks[order[j]][0]; }
        const came: number[] = [];
        while (j < n && tasks[order[j]][0] <= t) { const i = order[j]; ready.push([tasks[i][1], i]); came.push(i); j++; }
        if (came.length) frames.push({ note: `t = ${t}: task${came.length > 1 ? "s" : ""} ${came.join(", ")} ha${came.length > 1 ? "ve" : "s"} arrived, push ${came.length > 1 ? "them" : "it"} into the heap`, items: show(), side: `t = ${t}, order [${out.join(", ")}]` });
        ready.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const [p, i] = ready.shift()!;
        t += p; out.push(i);
        frames.push({ note: `Pop the shortest waiting task: task ${i} takes ${p}, so the CPU is busy until t = ${t}`, items: show(), popped: [`t${i} (${p})`], side: `t = ${t}, order [${out.join(", ")}]` });
      }
      return { kind: "stack", title: `getOrder = [${out.join(", ")}]`, frames };
    },
  },

  "ipo": {
    approach: "Sort projects by required capital; each round push every newly affordable profit into a max-heap and take the biggest one.",
    idea: ["Capital only grows, so a project that is affordable now stays affordable in every later round.", "Sort projects by capital and move a pointer forward, pushing each project that w can now afford into a max-heap of profits.", "Each round, the best choice is the largest affordable profit: it gives the most capital, and more capital can only unlock more projects.", "If the heap is empty, no project is affordable and w cannot grow any more: stop early.", "O(n log n) for the sort and O(k log n) for the rounds."],
    code: `import heapq
def findMaximizedCapital(k, w, profits, capital):
    projects = sorted(zip(capital, profits))   # by the capital they need
    ready, i = [], 0                           # max-heap (negated) of profits we can afford
    for _ in range(k):
        while i < len(projects) and projects[i][0] <= w:
            heapq.heappush(ready, -projects[i][1])
            i += 1
        if not ready:
            break                              # nothing affordable: capital cannot grow
        w -= heapq.heappop(ready)              # take the most profitable one
    return w`,
    lang: "python", time: "O(n log n + k log n)", space: "O(n)",
    viz: () => {
      const k = 3, profits = [1, 2, 3], capital = [0, 1, 2], projects = capital.map((c, i) => [c, profits[i]]).sort((a, b) => a[0] - b[0]);
      const ready: number[] = [], frames: StackFrame[] = [];
      let w = 0, i = 0;
      frames.push({ note: `k = ${k}, w = 0. Projects as (capital, profit), sorted by capital: ${projects.map((p) => `(${p[0]}, ${p[1]})`).join(", ")}`, items: [], side: "w = 0" });
      for (let r = 1; r <= k; r++) {
        const came: number[] = [];
        while (i < projects.length && projects[i][0] <= w) { ready.push(projects[i][1]); came.push(projects[i][1]); i++; }
        frames.push({ note: `Round ${r}, w = ${w}: ${came.length ? `newly affordable profit${came.length > 1 ? "s" : ""} ${came.join(", ")} ${came.length > 1 ? "go" : "goes"} into the max-heap` : "nothing new is affordable"}`, items: asc(ready), side: `w = ${w}` });
        if (!ready.length) { frames.push({ note: "The heap is empty: no project is affordable, so stop", items: [], side: `w = ${w}` }); break; }
        const best = Math.max(...ready); ready.splice(ready.indexOf(best), 1); w += best;
        frames.push({ note: `Take the largest profit, ${best}: w becomes ${w}`, items: asc(ready), popped: [best], side: `w = ${w}` });
      }
      frames.push({ note: `After ${k} projects the final capital is ${w}`, items: asc(ready), side: `answer ${w}` });
      return { kind: "stack", title: `findMaximizedCapital = ${w}`, frames };
    },
  },
};

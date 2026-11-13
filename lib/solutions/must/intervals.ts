// Solutions for the must-do "intervals" questions that were new to the app (lib/patterns/overview/intervals.problems.ts). See ../arrays.ts for the style.
import type { Diagram, IntervalsFrame, Tone } from "../../diagram";
import type { Solution } from "../types";

type Iv = [number, number];
const fmt = (a: Iv) => `[${a[0]},${a[1]}]`;
const ivs = (title: string, items: Iv[], frames: IntervalsFrame[]): Diagram => ({ kind: "intervals", title, items, frames });

export const MUST_SOLUTIONS: Record<string, Solution> = {
  "count-days-without-meetings": {
    approach: "Sort the meetings by start, merge overlapping (or touching) ones, and subtract the merged lengths from days.",
    idea: ["A day is busy if any meeting covers it, so overlapping meetings must not be counted twice.", "Sort by start and keep one open block [s, e].", "A meeting that starts by e + 1 joins the block (days are whole numbers, so touching blocks leave no gap); extend e to the larger end.", "Otherwise close the block, add its e - s + 1 days to the busy count, and open a new one.", "The answer is days minus the busy count. Sorting dominates: O(n log n), and days can be up to 10^9, so never mark days one by one."],
    code: `def countDays(days, meetings):
    covered, cur_s, cur_e = 0, None, None
    for s, e in sorted(meetings):
        if cur_e is not None and s <= cur_e + 1:   # overlaps or touches the open block
            cur_e = max(cur_e, e)
        else:
            if cur_e is not None:
                covered += cur_e - cur_s + 1
            cur_s, cur_e = s, e
    if cur_e is not None:
        covered += cur_e - cur_s + 1
    return days - covered`,
    lang: "python", time: "O(n log n)", space: "O(1) besides the sort",
    viz: () => {
      const days = 12, meetings: Iv[] = [[5, 7], [1, 3], [9, 10], [2, 4], [6, 6]], items = [...meetings].sort((a, b) => a[0] - b[0] || a[1] - b[1]), frames: IntervalsFrame[] = [], blocks: Iv[] = [], tones: Record<number, Tone> = {};
      let busy = 0;
      frames.push({ note: `${days} days and ${items.length} meetings, sorted by start`, tones: {} });
      items.forEach(([s, e], i) => {
        const last = blocks[blocks.length - 1];
        if (last && s <= last[1] + 1) { const was = last[1]; last[1] = Math.max(last[1], e); tones[i] = "active"; frames.push({ note: `${fmt([s, e])} starts by day ${was + 1}, so it joins the open block: now ${fmt(last)}`, tones: { ...tones }, result: blocks.map((b) => [...b] as Iv) }); }
        else { if (last) busy += last[1] - last[0] + 1; blocks.push([s, e]); tones[i] = "found"; frames.push({ note: `${fmt([s, e])} ${last ? `starts after a gap: close ${fmt(last)} (${last[1] - last[0] + 1} busy days, busy so far ${busy}) and open a new block` : "opens the first block"}`, tones: { ...tones }, result: blocks.map((b) => [...b] as Iv) }); }
      });
      const last = blocks[blocks.length - 1]; busy += last[1] - last[0] + 1;
      frames.push({ note: `Close the last block ${fmt(last)}: ${busy} busy days in total, so ${days} - ${busy} = ${days - busy} free days`, tones: { ...tones }, result: blocks });
      return ivs(`countDays(${days}) = ${days - busy}`, items, frames);
    },
  },

  "two-best-non-overlapping-events": {
    approach: "Sort by start and precompute the best value among events starting at or after each index; for every event, binary search the first event that starts after it ends.",
    idea: ["Pick the event that ends first in the pair; call it the left event. The right event must start after it ends (ends are inclusive, so start > end).", "Sort the events by start. Then the events that can follow a given event form a suffix of the list.", "best_after[i] = the largest value among events i to n - 1, filled from the right.", "For each event, bisect for the first start greater than its end, and try value + best_after[j]. best_after[n] = 0 covers taking a single event.", "O(n log n) for the sort and the n binary searches."],
    code: `from bisect import bisect_right
def maxTwoEvents(events):
    events = sorted(events)                     # by start
    starts = [s for s, _, _ in events]
    n = len(events)
    best_after = [0] * (n + 1)                  # best_after[i] = max value among events[i:]
    for i in range(n - 1, -1, -1):
        best_after[i] = max(best_after[i + 1], events[i][2])
    ans = 0
    for s, e, v in events:
        j = bisect_right(starts, e)             # first event that starts after this one ends
        ans = max(ans, v + best_after[j])
    return ans`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const events = [[1, 3, 2], [4, 5, 5], [2, 4, 3], [6, 8, 4], [5, 6, 1]].sort((a, b) => a[0] - b[0]), n = events.length, frames: IntervalsFrame[] = [];
      const items = events.map((x) => [x[0], x[1]] as Iv), best = Array(n + 1).fill(0);
      for (let i = n - 1; i >= 0; i--) best[i] = Math.max(best[i + 1], events[i][2]);
      frames.push({ note: `Sorted by start, values [${events.map((x) => x[2]).join(", ")}]. best_after from the right: [${best.slice(0, n).join(", ")}]`, tones: {} });
      let ans = 0;
      events.forEach(([s, e, v], i) => {
        let j = 0; while (j < n && events[j][0] <= e) j++;
        const total = v + best[j]; ans = Math.max(ans, total);
        frames.push({ note: `${fmt([s, e])} (value ${v}) ends on day ${e}. The first event starting after day ${e} is ${j < n ? `index ${j}` : "none"}, best value from there ${best[j]}: pair = ${v} + ${best[j]} = ${total}. Best ${ans}`, tones: Object.fromEntries(items.map((_, k) => [k, (k === i ? "active" : k >= j ? "found" : "muted") as Tone])) });
      });
      frames.push({ note: `The best two non-overlapping events are worth ${ans}`, tones: {} });
      return ivs(`maxTwoEvents = ${ans}`, items, frames);
    },
  },

  "data-stream-as-disjoint-intervals": {
    approach: "Keep the intervals sorted and disjoint; a new value either sits inside its left neighbour, extends one neighbour, bridges two, or becomes a new [v, v].",
    idea: ["Store the intervals sorted by start, never overlapping.", "For a new value v, binary search the first interval that starts after v; the one before it is the only one that can contain v.", "If that left neighbour already reaches v, nothing changes.", "If the left one ends at v - 1 and the right one starts at v + 1, v bridges them: merge the two into one.", "If only one of those holds, stretch that neighbour by one. Otherwise insert [v, v] at that position.", "getIntervals just copies the list. With a balanced tree (std::map) each add is O(log n); with a Python list the insert shifts, O(n)."],
    code: `from bisect import bisect_right
class SummaryRanges:
    def __init__(self):
        self.iv = []                            # sorted, disjoint [start, end] lists

    def addNum(self, value):
        iv = self.iv
        i = bisect_right(iv, value, key=lambda x: x[0])   # first interval starting after value
        if i and iv[i - 1][1] >= value:         # already inside the left neighbour
            return
        left = i > 0 and iv[i - 1][1] == value - 1
        right = i < len(iv) and iv[i][0] == value + 1
        if left and right:                      # value bridges two intervals
            iv[i - 1][1] = iv[i][1]
            del iv[i]
        elif left:
            iv[i - 1][1] = value
        elif right:
            iv[i][0] = value
        else:
            iv.insert(i, [value, value])

    def getIntervals(self):
        return [x[:] for x in self.iv]`,
    lang: "python", time: "O(log n) to find, O(n) to insert in a list", space: "O(n)",
    viz: () => {
      const adds = [1, 3, 7, 2, 6, 3, 9, 8], iv: Iv[] = [], frames: IntervalsFrame[] = [], items = adds.map((v) => [v, v] as Iv);
      adds.forEach((v, k) => {
        let i = 0; while (i < iv.length && iv[i][0] <= v) i++;
        let what: string;
        if (i && iv[i - 1][1] >= v) what = `${v} is already inside ${fmt(iv[i - 1])}: nothing changes`;
        else {
          const left = i > 0 && iv[i - 1][1] === v - 1, right = i < iv.length && iv[i][0] === v + 1;
          if (left && right) { what = `${v} bridges ${fmt(iv[i - 1])} and ${fmt(iv[i])}: merge them`; iv[i - 1][1] = iv[i][1]; iv.splice(i, 1); }
          else if (left) { what = `${v} is one past ${fmt(iv[i - 1])}: stretch its end`; iv[i - 1][1] = v; }
          else if (right) { what = `${v} is one before ${fmt(iv[i])}: stretch its start`; iv[i][0] = v; }
          else { what = `${v} touches nothing: insert ${fmt([v, v])} at position ${i}`; iv.splice(i, 0, [v, v]); }
        }
        frames.push({ note: `addNum(${v}): ${what}. getIntervals = [${iv.map(fmt).join(", ")}]`, tones: Object.fromEntries(adds.map((_, j) => [j, (j === k ? "active" : j < k ? "done" : "muted") as Tone])), result: iv.map((x) => [...x] as Iv) });
      });
      return ivs("SummaryRanges", items, frames);
    },
  },

  "maximum-profit-in-job-scheduling": {
    approach: "Weighted interval scheduling: sort jobs by end; dp[k] = max(skip job k, its profit + dp of the jobs that end by its start), found by binary search.",
    idea: ["Sort the jobs by end time and let dp[k] be the best profit using only the first k of them.", "Job k is either skipped, giving dp[k - 1], or taken.", "If it is taken, the other jobs must end by its start (a job may start the moment another ends). Those form a prefix of the sorted list, of length j found by binary search on the end times.", "So dp[k] = max(dp[k - 1], dp[j] + profit). Greedy by end fails here because profits differ; the DP keeps both choices.", "O(n log n): one sort and one binary search per job."],
    code: `from bisect import bisect_right
def jobScheduling(startTime, endTime, profit):
    jobs = sorted(zip(endTime, startTime, profit))   # by end
    ends = [e for e, _, _ in jobs]
    dp = [0] * (len(jobs) + 1)                  # dp[k] = best profit using the first k jobs by end
    for k, (e, s, p) in enumerate(jobs, 1):
        j = bisect_right(ends, s, 0, k - 1)     # jobs that end by this start
        dp[k] = max(dp[k - 1], dp[j] + p)
    return dp[-1]`,
    lang: "python", time: "O(n log n)", space: "O(n)",
    viz: () => {
      const st = [1, 2, 3, 4, 6], en = [3, 5, 10, 6, 9], pr = [20, 20, 100, 70, 60];
      const jobs = st.map((s, i) => [en[i], s, pr[i]]).sort((a, b) => a[0] - b[0]), n = jobs.length, dp: number[] = Array(n + 1).fill(0), frames: IntervalsFrame[] = [];
      const items = jobs.map(([e, s]) => [s, e] as Iv);
      const fits = (k: number) => { let j = 0; while (j < k - 1 && jobs[j][0] <= jobs[k - 1][1]) j++; return j; };   // jobs that end by job k's start
      frames.push({ note: `Jobs sorted by end, profits [${jobs.map((x) => x[2]).join(", ")}]. dp[0] = 0`, tones: {} });
      for (let k = 1; k <= n; k++) {
        const [e, s, p] = jobs[k - 1], j = fits(k), take = dp[j] + p;
        dp[k] = Math.max(dp[k - 1], take);
        frames.push({ note: `Job ${fmt([s, e])}, profit ${p}: ${j} job${j === 1 ? " ends" : "s end"} by ${s}, so taking it gives dp[${j}] + ${p} = ${take}; skipping gives dp[${k - 1}] = ${dp[k - 1]}. dp[${k}] = ${dp[k]}`, tones: Object.fromEntries(items.map((_, i) => [i, (i === k - 1 ? (take >= dp[k - 1] ? "found" : "bad") : i < j ? "window" : i < k - 1 ? "done" : "muted") as Tone])) });
      }
      const chosen: number[] = [];   // walk back to show which jobs were taken
      for (let k = n; k > 0; ) { const j = fits(k); if (dp[j] + jobs[k - 1][2] >= dp[k - 1]) { chosen.unshift(k - 1); k = j; } else k--; }
      frames.push({ note: `Best profit ${dp[n]}, from ${chosen.map((i) => fmt(items[i])).join(" and ")}`, tones: Object.fromEntries(chosen.map((i) => [i, "found" as Tone])), result: chosen.map((i) => items[i]) });
      return ivs(`jobScheduling = ${dp[n]}`, items, frames);
    },
  },
};

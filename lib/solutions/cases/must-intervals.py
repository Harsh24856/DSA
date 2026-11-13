# Example cases for lib/solutions/must/intervals.ts, merged into solutions_test.py.
CASES = {
 "count-days-without-meetings": [("countDays", (10, [[5,7],[1,3],[9,10]]), 2), ("countDays", (5, [[2,4],[1,3]]), 1), ("countDays", (6, [[1,6]]), 0), ("countDays", (7, [[3,3]]), 6), ("countDays", (8, [[1,2],[3,4],[7,8]]), 2)],
 "two-best-non-overlapping-events": [("maxTwoEvents", ([[1,3,2],[4,5,2],[2,4,3]],), 4), ("maxTwoEvents", ([[1,3,2],[4,5,2],[1,5,5]],), 5), ("maxTwoEvents", ([[1,5,3],[1,5,1],[6,6,5]],), 8), ("maxTwoEvents", ([[1,1,1]],), 1), ("maxTwoEvents", ([[1,3,5],[3,4,5]],), 5)],
 "maximum-profit-in-job-scheduling": [("jobScheduling", ([1,2,3,3], [3,4,5,6], [50,10,40,70]), 120), ("jobScheduling", ([1,2,3,4,6], [3,5,10,6,9], [20,20,100,70,60]), 150), ("jobScheduling", ([1,1,1], [2,3,4], [5,6,4]), 6), ("jobScheduling", ([1], [2], [5]), 5)],
}
TREE = {}

def _summary_ranges(load, check, h):
    def run(adds):
        r = load("data-stream-as-disjoint-intervals")["SummaryRanges"]()
        out = []
        for v in adds:
            r.addNum(v); out.append(r.getIntervals())
        return out
    check("SummaryRanges", run([1, 3, 7, 2, 6]), [[[1,1]],[[1,1],[3,3]],[[1,1],[3,3],[7,7]],[[1,3],[7,7]],[[1,3],[6,7]]])
    check("SummaryRanges repeats and bridge", run([5, 5, 0, 4, 6, 2, 1, 3])[-1], [[0,6]])

CUSTOM = [_summary_ranges]

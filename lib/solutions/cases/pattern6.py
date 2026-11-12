# Example cases for lib/solutions/pattern6.ts, merged into solutions_test.py.
CASES = {
 "minimum-edge-weight-equilibrium-queries-in-a-tree": [
  ("minOperationsQueries", (7, [[0,1,1],[1,2,1],[2,3,1],[3,4,2],[4,5,2],[5,6,2]], [[0,3],[3,6],[2,6],[0,6]]), [0,0,1,3]),
  ("minOperationsQueries", (8, [[1,2,6],[1,3,4],[2,4,6],[2,5,3],[3,6,6],[3,0,8],[7,0,2]], [[4,6],[0,4],[6,5],[7,4]]), [1,2,2,3]),
  ("minOperationsQueries", (1, [], [[0,0]]), [0]),
 ],
 "minimum-number-of-days-to-disconnect-island": [
  ("minDays", ([[0,1,1,0],[0,1,1,0],[0,0,0,0]],), 2),
  ("minDays", ([[1,1]],), 2),
  ("minDays", ([[1,1,0,0],[1,1,1,1],[0,0,1,1]],), 1),
  ("minDays", ([[1,0,1]],), 0),
  ("minDays", ([[0,0]],), 0),
  ("minDays", ([[1]],), 1),
  ("minDays", ([[1,1,1],[1,0,1],[1,1,1]],), 2),
 ],
 "maximum-employees-to-be-invited-to-a-meeting": [
  ("maximumInvitations", ([2,2,1,2],), 3),
  ("maximumInvitations", ([1,2,0],), 3),
  ("maximumInvitations", ([3,0,1,4,1],), 4),
  ("maximumInvitations", ([1,0,0,2,1,6,7,5,3],), 6),
  ("maximumInvitations", ([1,0,3,2],), 4),
 ],
 "minimum-cost-to-make-at-least-one-valid-path-in-a-grid": [
  ("minCost", ([[1,1,1,1],[2,2,2,2],[1,1,1,1],[2,2,2,2]],), 3),
  ("minCost", ([[1,1,3],[3,2,2],[1,1,4]],), 0),
  ("minCost", ([[1,2],[4,3]],), 1),
  ("minCost", ([[4]],), 0),
 ],
 "reconstruct-itinerary": [
  ("findItinerary", ([["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]],), ["JFK","MUC","LHR","SFO","SJC"]),
  ("findItinerary", ([["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]],), ["JFK","ATL","JFK","SFO","ATL","SFO"]),
  ("findItinerary", ([["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]],), ["JFK","NRT","JFK","KUL"]),
 ],
}
TREE = {}

def _tree_ancestor(load, check, h):
    T = load("kth-ancestor-of-a-tree-node")["TreeAncestor"]
    t = T(7, [-1,0,0,1,1,2,2])
    check("TreeAncestor", [t.getKthAncestor(3,1), t.getKthAncestor(5,2), t.getKthAncestor(6,3)], [1,0,-1])
    t = T(9, [-1,0,0,1,3,4,5,6,2])
    check("TreeAncestor chain", [t.getKthAncestor(7,5), t.getKthAncestor(8,3), t.getKthAncestor(7,6), t.getKthAncestor(7,7), t.getKthAncestor(0,1)], [1,-1,0,-1,-1])
    check("TreeAncestor single", T(1, [-1]).getKthAncestor(0, 1), -1)

def _arrangement_ok(pairs, got):
    return sorted(map(tuple, got)) == sorted(map(tuple, pairs)) and all(got[i][1] == got[i + 1][0] for i in range(len(got) - 1))

def _valid_arrangement(load, check, h):
    f = load("valid-arrangement-of-pairs")["validArrangement"]
    for pairs in ([[5,1],[4,5],[11,9],[9,4]], [[1,3],[3,2],[2,1]], [[1,2],[1,3],[2,1]], [[1,2],[2,3],[3,1],[1,4],[4,5]], [[7,7]]):
        check(f"validArrangement {pairs}", _arrangement_ok(pairs, f([p[:] for p in pairs])), True)

def _safe_ok(s, n, k):
    return len(s) == k ** n + n - 1 and len({s[i:i + n] for i in range(len(s) - n + 1)}) == k ** n and set(s) <= set(map(str, range(k)))

def _crack_safe(load, check, h):
    f = load("cracking-the-safe")["crackSafe"]
    for n, k in ((1, 2), (2, 2), (1, 1), (3, 2), (2, 10), (4, 4)):
        check(f"crackSafe({n}, {k})", _safe_ok(f(n, k), n, k), True)

CUSTOM = [_tree_ancestor, _valid_arrangement, _crack_safe]

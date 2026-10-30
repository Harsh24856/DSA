# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "minimum-path-sum": [("minPathSum", ([[1,3,1],[1,5,1],[4,2,1]],), 7), ("minPathSum", ([[1,2,3],[4,5,6]],), 12)],
 "unique-paths-ii": [("uniquePathsWithObstacles", ([[0,0,0],[0,1,0],[0,0,0]],), 2), ("uniquePathsWithObstacles", ([[0,1],[0,0]],), 1), ("uniquePathsWithObstacles", ([[1]],), 0)],
 "maximal-square": [("maximalSquare", ([["1","0","1","0","0"],["1","0","1","1","1"],["1","1","1","1","1"],["1","0","0","1","0"]],), 4), ("maximalSquare", ([["0","1"],["1","0"]],), 1), ("maximalSquare", ([["0"]],), 0)],
 "triangle": [("minimumTotal", ([[2],[3,4],[6,5,7],[4,1,8,3]],), 11), ("minimumTotal", ([[-10]],), -10)],
 "dungeon-game": [("calculateMinimumHP", ([[-2,-3,3],[-5,-10,1],[10,30,-5]],), 7), ("calculateMinimumHP", ([[0]],), 1)],
 "longest-palindromic-substring": [("longestPalindrome", ("babad",), "bab"), ("longestPalindrome", ("cbbd",), "bb"), ("longestPalindrome", ("a",), "a")],
 "minimum-cost-to-cut-a-stick": [("minCost", (7,[1,3,4,5]), 16), ("minCost", (9,[5,6,1,4,2]), 22)],
 "burst-balloons": [("maxCoins", ([3,1,5,8],), 167), ("maxCoins", ([1,5],), 10)],
 "palindrome-partitioning-ii": [("minCut", ("aab",), 1), ("minCut", ("a",), 0), ("minCut", ("ab",), 1)],
 "longest-palindromic-subsequence": [("longestPalindromeSubseq", ("bbbab",), 4), ("longestPalindromeSubseq", ("cbbd",), 2)],
}
TREE = {}
CUSTOM = []
CASES.update({
 "unique-binary-search-trees": [("numTrees", (3,), 5), ("numTrees", (1,), 1)],
 "super-egg-drop": [("superEggDrop", (1,2), 2), ("superEggDrop", (2,6), 3), ("superEggDrop", (3,14), 4)],
 "word-break": [("wordBreak", ("leetcode",["leet","code"]), True), ("wordBreak", ("applepenapple",["apple","pen"]), True), ("wordBreak", ("catsandog",["cats","dog","sand","and","cat"]), False)],
 "best-time-to-buy-and-sell-stock-with-cooldown": [("maxProfit", ([1,2,3,0,2],), 3), ("maxProfit", ([1],), 0)],
 "best-time-to-buy-and-sell-stock-iv": [("maxProfit", (2,[2,4,1]), 2), ("maxProfit", (2,[3,2,6,5,0,3]), 7)],
 "regular-expression-matching": [("isMatch", ("aa","a"), False), ("isMatch", ("aa","a*"), True), ("isMatch", ("ab",".*"), True), ("isMatch", ("aab","c*a*b"), True), ("isMatch", ("mississippi","mis*is*p*."), False)],
 "best-time-to-buy-and-sell-stock-ii": [("maxProfit", ([7,1,5,3,6,4],), 7), ("maxProfit", ([1,2,3,4,5],), 4), ("maxProfit", ([7,6,4,3,1],), 0)],
 "best-time-to-buy-and-sell-stock-with-transaction-fee": [("maxProfit", ([1,3,2,8,4,9],2), 8), ("maxProfit", ([1,3,7,5,10,3],3), 6)],
 "beautiful-arrangement": [("countArrangement", (2,), 2), ("countArrangement", (1,), 1), ("countArrangement", (3,), 3)],
})
TREE.update({
 "house-robber-iii": [("rob", ([3,2,3,None,3,None,1],), 7, None), ("rob", ([3,4,5,1,3,None,1],), 9, None)],
})
CASES.update({
 "shortest-path-visiting-all-nodes": [("shortestPathLength", ([[1,2,3],[0],[0],[0]],), 4), ("shortestPathLength", ([[1],[0,2,4],[1,3,4],[2],[1,2]],), 4), ("shortestPathLength", ([[]],), 0)],
 "minimum-number-of-work-sessions-to-finish-the-tasks": [("minSessions", ([1,2,3],3), 2), ("minSessions", ([3,1,3,1,1],8), 2), ("minSessions", ([1,2,3,4,5],15), 1)],
 "stickers-to-spell-word": [("minStickers", (["with","example","science"],"thehat"), 3), ("minStickers", (["notice","possible"],"basicbasic"), -1)],
 "flood-fill": [("floodFill", ([[1,1,1],[1,1,0],[1,0,1]],1,1,2), [[2,2,2],[2,2,0],[2,0,1]]), ("floodFill", ([[0,0,0],[0,0,0]],0,0,0), [[0,0,0],[0,0,0]])],
 "number-of-islands": [("numIslands", ([["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]],), 1), ("numIslands", ([["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]],), 3)],
 "max-area-of-island": [("maxAreaOfIsland", ([[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]],), 6), ("maxAreaOfIsland", ([[0,0,0,0,0,0,0,0]],), 0)],
 "find-if-path-exists-in-graph": [("validPath", (3,[[0,1],[1,2],[2,0]],0,2), True), ("validPath", (6,[[0,1],[0,2],[3,5],[5,4],[4,3]],0,5), False)],
 "rotting-oranges": [("orangesRotting", ([[2,1,1],[1,1,0],[0,1,1]],), 4), ("orangesRotting", ([[2,1,1],[0,1,1],[1,0,1]],), -1), ("orangesRotting", ([[0,2]],), 0)],
})

def _surrounded(load, check, h):
    f = load("surrounded-regions")["solve"]
    for b, exp in [([["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]], [["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]), ([["X"]], [["X"]])]:
        f(b); check("surrounded-regions", b, exp)

def _clone(load, check, h):
    g = load("clone-graph")
    class GNode:
        def __init__(s, val=0, neighbors=None): s.val, s.neighbors = val, neighbors if neighbors is not None else []
    g["Node"] = GNode
    def build(adj):
        ns = [GNode(i + 1) for i in range(len(adj))]
        for i, nb in enumerate(adj): ns[i].neighbors = [ns[j - 1] for j in nb]
        return ns
    def dump(node):
        seen, out, st = {}, {}, [node]
        while st:
            u = st.pop()
            if u.val in out: continue
            seen[u.val] = u; out[u.val] = [v.val for v in u.neighbors]; st.extend(u.neighbors)
        return [out[k] for k in sorted(out)], seen
    for adj in ([[2,4],[1,3],[2,4],[1,3]], [[]]):
        ns = build(adj); c = g["cloneGraph"](ns[0]); got, nodes = dump(c)
        check("cloneGraph", (got, any(n in ns for n in nodes.values())), (adj, False))
    check("cloneGraph empty", g["cloneGraph"](None), None)

CUSTOM += [_surrounded, _clone]
CASES.update({
 "word-ladder": [("ladderLength", ("hit","cog",["hot","dot","dog","lot","log","cog"]), 5), ("ladderLength", ("hit","cog",["hot","dot","dog","lot","log"]), 0)],
 "01-matrix": [("updateMatrix", ([[0,0,0],[0,1,0],[0,0,0]],), [[0,0,0],[0,1,0],[0,0,0]]), ("updateMatrix", ([[0,0,0],[0,1,0],[1,1,1]],), [[0,0,0],[0,1,0],[1,2,1]])],
 "course-schedule": [("canFinish", (2,[[1,0]]), True), ("canFinish", (2,[[1,0],[0,1]]), False)],
 "course-schedule-ii": [("findOrder", (2,[[1,0]]), [0,1]), ("findOrder", (4,[[1,0],[2,0],[3,1],[3,2]]), [0,1,2,3]), ("findOrder", (1,[]), [0]), ("findOrder", (2,[[1,0],[0,1]]), [])],
 "find-eventual-safe-states": [("eventualSafeNodes", ([[1,2],[2,3],[5],[0],[5],[],[]],), [2,4,5,6]), ("eventualSafeNodes", ([[1,2,3,4],[1,2],[3,4],[0,4],[]],), [4])],
 "redundant-connection": [("findRedundantConnection", ([[1,2],[1,3],[2,3]],), [2,3]), ("findRedundantConnection", ([[1,2],[2,3],[3,4],[1,4],[1,5]],), [1,4])],
 "network-delay-time": [("networkDelayTime", ([[2,1,1],[2,3,1],[3,4,1]],4,2), 2), ("networkDelayTime", ([[1,2,1]],2,1), 1), ("networkDelayTime", ([[1,2,1]],2,2), -1)],
 "path-with-minimum-effort": [("minimumEffortPath", ([[1,2,2],[3,8,2],[5,3,5]],), 2), ("minimumEffortPath", ([[1,2,3],[3,8,4],[5,3,5]],), 1), ("minimumEffortPath", ([[1,2,1,1,1],[1,2,1,2,1],[1,2,1,2,1],[1,2,1,2,1],[1,1,1,2,1]],), 0)],
 "swim-in-rising-water": [("swimInWater", ([[0,2],[1,3]],), 3), ("swimInWater", ([[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]],), 16)],
})

def _accounts(load, check, h):
    f = load("accounts-merge")["accountsMerge"]
    for a, exp in [([["John","johnsmith@mail.com","john_newyork@mail.com"],["John","johnsmith@mail.com","john00@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]], [["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],["Mary","mary@mail.com"],["John","johnnybravo@mail.com"]]),
                   ([["Gabe","Gabe0@m.co","Gabe3@m.co","Gabe1@m.co"],["Kevin","Kevin3@m.co","Kevin5@m.co","Kevin0@m.co"],["Ethan","Ethan5@m.co","Ethan4@m.co","Ethan0@m.co"],["Hanzo","Hanzo3@m.co","Hanzo1@m.co","Hanzo0@m.co"],["Fern","Fern5@m.co","Fern1@m.co","Fern0@m.co"]], [["Ethan","Ethan0@m.co","Ethan4@m.co","Ethan5@m.co"],["Gabe","Gabe0@m.co","Gabe1@m.co","Gabe3@m.co"],["Hanzo","Hanzo0@m.co","Hanzo1@m.co","Hanzo3@m.co"],["Kevin","Kevin0@m.co","Kevin3@m.co","Kevin5@m.co"],["Fern","Fern0@m.co","Fern1@m.co","Fern5@m.co"]])]:
        check("accountsMerge", sorted(f(a)), sorted(exp))

CUSTOM += [_accounts]
CASES.update({
 "path-with-maximum-probability": [("maxProbability", (3,[[0,1],[1,2],[0,2]],[0.5,0.5,0.2],0,2), 0.25), ("maxProbability", (3,[[0,1],[1,2],[0,2]],[0.5,0.5,0.3],0,2), 0.3), ("maxProbability", (3,[[0,1]],[0.5],0,2), 0.0)],
 "cheapest-flights-within-k-stops": [("findCheapestPrice", (4,[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],0,3,1), 700), ("findCheapestPrice", (3,[[0,1,100],[1,2,100],[0,2,500]],0,2,1), 200), ("findCheapestPrice", (3,[[0,1,100],[1,2,100],[0,2,500]],0,2,0), 500)],
 "evaluate-division": [("calcEquation", ([["a","b"],["b","c"]],[2.0,3.0],[["a","c"],["b","a"],["a","e"],["a","a"],["x","x"]]), [6.0,0.5,-1.0,1.0,-1.0]), ("calcEquation", ([["a","b"],["b","c"],["bc","cd"]],[1.5,2.5,5.0],[["a","c"],["c","b"],["bc","cd"],["cd","bc"]]), [3.75,0.4,5.0,0.2]), ("calcEquation", ([["a","b"]],[0.5],[["a","b"],["b","a"],["a","c"],["x","y"]]), [0.5,2.0,-1.0,-1.0])],
 "min-cost-to-connect-all-points": [("minCostConnectPoints", ([[0,0],[2,2],[3,10],[5,2],[7,0]],), 20), ("minCostConnectPoints", ([[3,12],[-2,5],[-4,1]],), 18)],
 "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree": [("findCriticalAndPseudoCriticalEdges", (5,[[0,1,1],[1,2,1],[2,3,2],[0,3,2],[0,4,3],[3,4,3],[1,4,6]]), [[0,1],[2,3,4,5]]), ("findCriticalAndPseudoCriticalEdges", (4,[[0,1,1],[1,2,1],[2,3,1],[0,3,1]]), [[],[0,1,2,3]])],
 "remove-max-number-of-edges-to-keep-graph-fully-traversable": [("maxNumEdgesToRemove", (4,[[3,1,2],[3,2,3],[1,1,3],[1,2,4],[1,1,2],[2,3,4]]), 2), ("maxNumEdgesToRemove", (4,[[3,1,2],[3,2,3],[1,1,4],[2,1,4]]), 0), ("maxNumEdgesToRemove", (4,[[3,2,3],[1,1,2],[2,3,4]]), -1)],
 "island-perimeter": [("islandPerimeter", ([[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]],), 16), ("islandPerimeter", ([[1]],), 4), ("islandPerimeter", ([[1,0]],), 4)],
 "word-search": [("exist", ([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCCED"), True), ("exist", ([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"SEE"), True), ("exist", ([["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]],"ABCB"), False)],
 "pacific-atlantic-water-flow": [("pacificAtlantic", ([[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]],), [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]), ("pacificAtlantic", ([[1]],), [[0,0]])],
 "shortest-path-in-binary-matrix": [("shortestPathBinaryMatrix", ([[0,1],[1,0]],), 2), ("shortestPathBinaryMatrix", ([[0,0,0],[1,1,0],[1,1,0]],), 4), ("shortestPathBinaryMatrix", ([[1,0,0],[1,1,0],[1,1,0]],), -1)],
})
CASES.update({
 "is-graph-bipartite": [("isBipartite", ([[1,2,3],[0,2],[0,1,3],[0,2]],), False), ("isBipartite", ([[1,3],[0,2],[1,3],[0,2]],), True)],
 "flower-planting-with-no-adjacent": [("gardenNoAdj", (3,[[1,2],[2,3],[3,1]]), [1,2,3]), ("gardenNoAdj", (4,[[1,2],[3,4]]), [1,2,1,2]), ("gardenNoAdj", (4,[[1,2],[2,3],[3,4],[4,1],[1,3],[2,4]]), [1,2,3,4])],
 "shortest-path-with-alternating-colors": [("shortestAlternatingPaths", (3,[[0,1],[1,2]],[]), [0,1,-1]), ("shortestAlternatingPaths", (3,[[0,1]],[[2,1]]), [0,1,-1])],
 "maximum-length-of-pair-chain": [("findLongestChain", ([[1,2],[2,3],[3,4]],), 2), ("findLongestChain", ([[1,2],[7,8],[4,5]],), 3)],
 "remove-covered-intervals": [("removeCoveredIntervals", ([[1,4],[3,6],[2,8]],), 2), ("removeCoveredIntervals", ([[1,4],[2,3]],), 1)],
 "jump-game": [("canJump", ([2,3,1,1,4],), True), ("canJump", ([3,2,1,0,4],), False)],
 "jump-game-ii": [("jump", ([2,3,1,1,4],), 2), ("jump", ([2,3,0,1,4],), 2), ("jump", ([0],), 0)],
 "gas-station": [("canCompleteCircuit", ([1,2,3,4,5],[3,4,5,1,2]), 3), ("canCompleteCircuit", ([2,3,4],[3,4,3]), -1)],
 "minimum-number-of-taps-to-open-to-water-a-garden": [("minTaps", (5,[3,4,1,1,0,0]), 1), ("minTaps", (3,[0,0,0,0]), -1)],
 "wiggle-subsequence": [("wiggleMaxLength", ([1,7,4,9,2,5],), 6), ("wiggleMaxLength", ([1,17,5,10,13,15,10,5,16,8],), 7), ("wiggleMaxLength", ([1,2,3,4,5,6,7,8,9],), 2)],
})
CASES.update({
 "partition-labels": [("partitionLabels", ("ababcbacadefegdehijhklij",), [9,7,8]), ("partitionLabels", ("eccbbbbdec",), [10])],
 "maximum-swap": [("maximumSwap", (2736,), 7236), ("maximumSwap", (9973,), 9973), ("maximumSwap", (1993,), 9913)],
 "candy": [("candy", ([1,0,2],), 5), ("candy", ([1,2,2],), 4)],
 "task-scheduler": [("leastInterval", (["A","A","A","B","B","B"],2), 8), ("leastInterval", (["A","C","A","B","D","B"],1), 6), ("leastInterval", (["A","A","A","B","B","B"],3), 10)],
 "hand-of-straights": [("isNStraightHand", ([1,2,3,6,2,3,4,7,8],3), True), ("isNStraightHand", ([1,2,3,4,5],4), False)],
 "longest-mountain-in-array": [("longestMountain", ([2,1,4,7,3,2,5],), 5), ("longestMountain", ([2,2,2],), 0)],
 "assign-cookies": [("findContentChildren", ([1,2,3],[1,1]), 1), ("findContentChildren", ([1,2],[1,2,3]), 2)],
 "two-city-scheduling": [("twoCitySchedCost", ([[10,20],[30,200],[400,50],[30,20]],), 110), ("twoCitySchedCost", ([[259,770],[448,54],[926,667],[184,139],[840,118],[577,469]],), 1859), ("twoCitySchedCost", ([[515,563],[451,713],[537,709],[343,819],[855,779],[457,60],[650,359],[631,42]],), 3086)],
 "boats-to-save-people": [("numRescueBoats", ([1,2],3), 1), ("numRescueBoats", ([3,2,2,1],3), 3), ("numRescueBoats", ([3,5,3,4],5), 4)],
})

def _reorganize(load, check, h):
    f = load("reorganize-string")["reorganizeString"]
    for s_ in ("aab", "aaabbc", "vvvlo", "a"):
        out = f(s_); check("reorganizeString " + s_, (sorted(out) == sorted(s_), all(x != y for x, y in zip(out, out[1:]))), (True, True))
    check("reorganizeString aaab", f("aaab"), "")

CUSTOM += [_reorganize]

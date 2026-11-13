# Example cases for lib/solutions/must/graph.ts, merged into solutions_test.py.
CASES = {
 "find-the-town-judge": [("findJudge", (2, [[1,2]]), 2), ("findJudge", (3, [[1,3],[2,3]]), 3), ("findJudge", (3, [[1,3],[2,3],[3,1]]), -1), ("findJudge", (1, []), 1)],
 "open-the-lock": [("openLock", (["0201","0101","0102","1212","2002"], "0202"), 6), ("openLock", (["8888"], "0009"), 1), ("openLock", (["8887","8889","8878","8898","8788","8988","7888","9888"], "8888"), -1), ("openLock", (["0000"], "8888"), -1)],
 "shortest-bridge": [("shortestBridge", ([[0,1],[1,0]],), 1), ("shortestBridge", ([[0,1,0],[0,0,0],[0,0,1]],), 2), ("shortestBridge", ([[1,1,1,1,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,1,1,1,1]],), 1), ("shortestBridge", ([[1,1,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[0,0,0,1,1],[0,0,0,1,1]],), 4)],
 "reorder-routes-to-make-all-paths-lead-to-the-city-zero": [("minReorder", (6, [[0,1],[1,3],[2,3],[4,0],[4,5]]), 3), ("minReorder", (5, [[1,0],[1,2],[3,2],[3,4]]), 2), ("minReorder", (3, [[1,0],[2,0]]), 0)],
}
TREE = {}
CUSTOM = []

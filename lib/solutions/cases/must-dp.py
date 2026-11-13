# Example cases for lib/solutions/must/dp.ts, merged into solutions_test.py.
CASES = {
 "fibonacci-number": [("fib", (2,), 1), ("fib", (3,), 2), ("fib", (4,), 3), ("fib", (0,), 0), ("fib", (30,), 832040)],
 "delete-and-earn": [("deleteAndEarn", ([3,4,2],), 6), ("deleteAndEarn", ([2,2,3,3,3,4],), 9), ("deleteAndEarn", ([1],), 1), ("deleteAndEarn", ([1,1,1,2,4,5,5,5,6],), 18)],
 "minimum-falling-path-sum": [("minFallingPathSum", ([[2,1,3],[6,5,4],[7,8,9]],), 13), ("minFallingPathSum", ([[-19,57],[-40,-5]],), -59), ("minFallingPathSum", ([[5]],), 5)],
 "ones-and-zeroes": [("findMaxForm", (["10","0001","111001","1","0"], 5, 3), 4), ("findMaxForm", (["10","0","1"], 1, 1), 2), ("findMaxForm", (["111"], 1, 1), 0)],
 "longest-increasing-path-in-a-matrix": [("longestIncreasingPath", ([[9,9,4],[6,6,8],[2,1,1]],), 4), ("longestIncreasingPath", ([[3,4,5],[3,2,6],[2,2,1]],), 4), ("longestIncreasingPath", ([[1]],), 1), ("longestIncreasingPath", ([[1,2,3,4,5,6,7,8,9]],), 9)],
}
TREE = {}
CUSTOM = []

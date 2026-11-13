# Example cases for lib/solutions/must/logic-to-code.ts, merged into solutions_test.py.
_SUDOKU_OK = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]
_SUDOKU_BAD = [["8"] + _SUDOKU_OK[0][1:]] + _SUDOKU_OK[1:]
CASES = {
 "valid-sudoku": [("isValidSudoku", (_SUDOKU_OK,), True), ("isValidSudoku", (_SUDOKU_BAD,), False), ("isValidSudoku", ([["."] * 9 for _ in range(9)],), True), ("isValidSudoku", ([[".", ".", ".", ".", ".", ".", ".", ".", "."] if r else ["1", ".", ".", ".", ".", ".", ".", ".", "1"] for r in range(9)],), False), ("isValidSudoku", ([["2" if (r, c) in ((0, 0), (2, 2)) else "." for c in range(9)] for r in range(9)],), False)],
 "spiral-matrix-ii": [("generateMatrix", (3,), [[1,2,3],[8,9,4],[7,6,5]]), ("generateMatrix", (1,), [[1]]), ("generateMatrix", (4,), [[1,2,3,4],[12,13,14,5],[11,16,15,6],[10,9,8,7]])],
 "robot-bounded-in-circle": [("isRobotBounded", ("GGLLGG",), True), ("isRobotBounded", ("GG",), False), ("isRobotBounded", ("GL",), True), ("isRobotBounded", ("GRGRGRG",), True), ("isRobotBounded", ("L",), True)],
 "walking-robot-simulation": [("robotSim", ([4,-1,3], []), 25), ("robotSim", ([4,-1,4,-2,4], [[2,4]]), 65), ("robotSim", ([6,-1,-1,6], [[0,0]]), 36), ("robotSim", ([-2,-2,3], []), 9)],
}
TREE = {}

# Example cases for lib/solutions/must/recursion-backtracking.ts, merged into solutions_test.py.
CASES = {
 "generate-parentheses": [("generateParenthesis", (3,), ["((()))","(()())","(())()","()(())","()()()"]), ("generateParenthesis", (1,), ["()"]), ("generateParenthesis", (2,), ["(())","()()"])],
 "letter-combinations-of-a-phone-number": [("letterCombinations", ("23",), ["ad","ae","af","bd","be","bf","cd","ce","cf"]), ("letterCombinations", ("",), []), ("letterCombinations", ("2",), ["a","b","c"]), ("letterCombinations", ("79",), ["pw","px","py","pz","qw","qx","qy","qz","rw","rx","ry","rz","sw","sx","sy","sz"])],
 "subsets-ii": [("subsetsWithDup", ([1,2,2],), [[],[1],[1,2],[1,2,2],[2],[2,2]]), ("subsetsWithDup", ([0],), [[],[0]]), ("subsetsWithDup", ([2,1,2],), [[],[1],[1,2],[1,2,2],[2],[2,2]])],
 "permutations-ii": [("permuteUnique", ([1,1,2],), [[1,1,2],[1,2,1],[2,1,1]]), ("permuteUnique", ([1,2,3],), [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]), ("permuteUnique", ([1],), [[1]])],
 "combination-sum-ii": [("combinationSum2", ([10,1,2,7,6,1,5], 8), [[1,1,6],[1,2,5],[1,7],[2,6]]), ("combinationSum2", ([2,5,2,1,2], 5), [[1,2,2],[5]]), ("combinationSum2", ([2], 1), [])],
}
TREE = {}
CUSTOM = []

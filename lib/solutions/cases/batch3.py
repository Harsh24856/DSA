# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "minimum-genetic-mutation": [("minMutation", ("AACCGGTT","AACCGGTA",["AACCGGTA"]), 1), ("minMutation", ("AACCGGTT","AAACGGTA",["AACCGGTA","AACCGCTA","AAACGGTA"]), 2), ("minMutation", ("AACCGGTT","AACCGGTA",[]), -1)],
 "interval-list-intersections": [("intervalIntersection", ([[0,2],[5,10],[13,23],[24,25]],[[1,5],[8,12],[15,24],[25,26]]), [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]), ("intervalIntersection", ([[1,3],[5,9]],[]), [])],
 "minimum-add-to-make-parentheses-valid": [("minAddToMakeValid", ("())",), 1), ("minAddToMakeValid", ("(((",), 3), ("minAddToMakeValid", ("()))((",), 4)],
 "the-k-th-lexicographical-string-of-all-happy-strings-of-length-n": [("getHappyString", (1,3), "c"), ("getHappyString", (1,4), ""), ("getHappyString", (3,9), "cab"), ("getHappyString", (2,1), "ab")],
 "find-minimum-in-rotated-sorted-array-ii": [("findMin", ([1,3,5],), 1), ("findMin", ([2,2,2,0,1],), 0), ("findMin", ([3,3,1,3],), 1), ("findMin", ([1],), 1)],
 "maximum-fruits-harvested-after-at-most-k-steps": [("maxTotalFruits", ([[2,8],[6,3],[8,6]],5,4), 9), ("maxTotalFruits", ([[0,9],[4,1],[5,7],[6,2],[7,4],[10,9]],5,4), 14), ("maxTotalFruits", ([[0,3],[6,4],[8,5]],3,2), 0), ("maxTotalFruits", ([[200000,10000]],0,1), 0)],
 "count-submatrices-with-all-ones": [("numSubmat", ([[1,0,1],[1,1,0],[1,1,0]],), 13), ("numSubmat", ([[0,1,1,0],[0,1,1,1],[1,1,1,0]],), 24), ("numSubmat", ([[0]],), 0)],
 "longest-cycle-in-a-graph": [("longestCycle", ([3,3,4,2,3],), 3), ("longestCycle", ([2,-1,3,1],), -1), ("longestCycle", ([1,0],), 2)],
 "watering-plants": [("wateringPlants", ([2,2,3,3],5), 14), ("wateringPlants", ([1,1,1,4,2,3],4), 30), ("wateringPlants", ([7,7,7,7,7,7,7],8), 49)],
 "longest-ideal-subsequence": [("longestIdealString", ("acfgbd",2), 4), ("longestIdealString", ("abcd",3), 4), ("longestIdealString", ("az",0), 1)],
 "minimized-maximum-of-products-distributed-to-any-store": [("minimizedMaximum", (6,[11,6]), 3), ("minimizedMaximum", (7,[15,10,10]), 5), ("minimizedMaximum", (1,[100000]), 100000)],
 "basic-calculator-ii": [("calculate", ("3+2*2",), 7), ("calculate", (" 3/2 ",), 1), ("calculate", (" 3+5 / 2 ",), 5), ("calculate", ("14-3/2",), 13)],
 "partition-array-into-disjoint-intervals": [("partitionDisjoint", ([5,0,3,8,6],), 3), ("partitionDisjoint", ([1,1,1,0,6,12],), 4), ("partitionDisjoint", ([1,2],), 1)],
 "kth-smallest-number-in-multiplication-table": [("findKthNumber", (3,3,5), 3), ("findKthNumber", (2,3,6), 6), ("findKthNumber", (1,1,1), 1)],
 "minimum-swaps-to-arrange-a-binary-grid": [("minSwaps", ([[0,0,1],[1,1,0],[1,0,0]],), 3), ("minSwaps", ([[0,1,1,0],[0,1,1,0],[0,1,1,0],[0,1,1,0]],), -1), ("minSwaps", ([[1,0,0],[1,1,0],[1,1,1]],), 0)],
 "find-two-non-overlapping-sub-arrays-each-with-target-sum": [("minSumOfLengths", ([3,2,2,4,3],3), 2), ("minSumOfLengths", ([7,3,4,7],7), 2), ("minSumOfLengths", ([4,3,2,6,2,3,4],6), -1), ("minSumOfLengths", ([3,1,1,1,5,1,2,1],3), 3)],
 "count-unguarded-cells-in-the-grid": [("countUnguarded", (4,6,[[0,0],[1,1],[2,3]],[[0,1],[2,2],[1,4]]), 7), ("countUnguarded", (3,3,[[1,1]],[[0,1],[1,0],[2,1],[1,2]]), 4)],
 "largest-component-size-by-common-factor": [("largestComponentSize", ([4,6,15,35],), 4), ("largestComponentSize", ([20,50,9,63],), 2), ("largestComponentSize", ([2,3,6,7,4,12,21,39],), 8), ("largestComponentSize", ([1],), 1)],
 "making-a-large-island": [("largestIsland", ([[1,0],[0,1]],), 3), ("largestIsland", ([[1,1],[1,0]],), 4), ("largestIsland", ([[1,1],[1,1]],), 4), ("largestIsland", ([[0,0],[0,0]],), 1)],
 "find-k-th-smallest-pair-distance": [("smallestDistancePair", ([1,3,1],1), 0), ("smallestDistancePair", ([1,1,1],2), 0), ("smallestDistancePair", ([1,6,1],3), 5)],
 "patching-array": [("minPatches", ([1,3],6), 1), ("minPatches", ([1,5,10],20), 2), ("minPatches", ([1,2,2],5), 0)],
 "minimum-score-after-removals-on-a-tree": [("minimumScore", ([1,5,5,4,11],[[0,1],[1,2],[1,3],[3,4]]), 9), ("minimumScore", ([5,5,2,4,4,2],[[0,1],[1,2],[5,2],[4,3],[1,3]]), 0)],
 "sum-of-distances-in-tree": [("sumOfDistancesInTree", (6,[[0,1],[0,2],[2,3],[2,4],[2,5]]), [8,12,6,10,10,10]), ("sumOfDistancesInTree", (1,[]), [0]), ("sumOfDistancesInTree", (2,[[1,0]]), [1,1])],
 "determine-if-two-strings-are-close": [("closeStrings", ("abc","bca"), True), ("closeStrings", ("a","aa"), False), ("closeStrings", ("cabbba","abbccc"), True), ("closeStrings", ("ab","cd"), False)],
 "k-th-smallest-prime-fraction": [("kthSmallestPrimeFraction", ([1,2,3,5],3), [2,5]), ("kthSmallestPrimeFraction", ([1,7],1), [1,7])],
 "minimum-cost-to-make-array-equal": [("minCost", ([1,3,5,2],[2,3,1,14]), 8), ("minCost", ([2,2,2,2,2],[4,2,8,1,3]), 0)],
 "find-original-array-from-doubled-array": [("findOriginalArray", ([1,3,4,2,6,8],), [1,3,4]), ("findOriginalArray", ([6,3,0,1],), []), ("findOriginalArray", ([1],), []), ("findOriginalArray", ([0,0,0,0],), [0,0])],
 "move-pieces-to-obtain-a-string": [("canChange", ("_L__R__R_","L______RR"), True), ("canChange", ("R_L_","__LR"), False), ("canChange", ("_R","R_"), False)],
 "bus-routes": [("numBusesToDestination", ([[1,2,7],[3,6,7]],1,6), 2), ("numBusesToDestination", ([[7,12],[4,5,15],[6],[15,19],[9,12,13]],15,12), -1), ("numBusesToDestination", ([[1,2]],1,1), 0)],
 "course-schedule-iii": [("scheduleCourse", ([[100,200],[200,1300],[1000,1250],[2000,3200]],), 3), ("scheduleCourse", ([[1,2]],), 1), ("scheduleCourse", ([[3,2],[4,3]],), 0)],
 "maximum-tastiness-of-candy-basket": [("maximumTastiness", ([13,5,1,8,21,2],3), 8), ("maximumTastiness", ([1,3,1],2), 2), ("maximumTastiness", ([7,7,7,7],2), 0)],
 "count-of-range-sum": [("countRangeSum", ([-2,5,-1],-2,2), 3), ("countRangeSum", ([0],0,0), 1)],
 "minimum-time-to-repair-cars": [("repairCars", ([4,2,3,1],10), 16), ("repairCars", ([5,1,8],6), 16)],
 "smallest-range-covering-elements-from-k-lists": [("smallestRange", ([[4,10,15,24,26],[0,9,12,20],[5,18,22,30]],), [20,24]), ("smallestRange", ([[1,2,3],[1,2,3],[1,2,3]],), [1,1])],
 "car-fleet-ii": [("getCollisionTimes", ([[1,2],[2,1],[4,3],[7,2]],), [1.0,-1.0,3.0,-1.0]), ("getCollisionTimes", ([[3,4],[5,4],[6,3],[9,1]],), [2.0,1.0,1.5,-1.0])],
 "non-decreasing-subsequences": [("findSubsequences", ([4,6,7,7],), [[4,6],[4,6,7],[4,6,7,7],[4,7],[4,7,7],[6,7],[6,7,7],[7,7]]), ("findSubsequences", ([4,4,3,2,1],), [[4,4]])],
 "find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance": [("findTheCity", (4,[[0,1,3],[1,2,1],[1,3,4],[2,3,1]],4), 3), ("findTheCity", (5,[[0,1,2],[0,4,8],[1,2,3],[1,4,2],[2,3,1],[3,4,1]],2), 0)],
 "three-equal-parts": [("threeEqualParts", ([1,0,1,0,1],), [0,3]), ("threeEqualParts", ([1,1,0,1,1],), [-1,-1]), ("threeEqualParts", ([1,1,0,0,1],), [0,2]), ("threeEqualParts", ([0,0,0],), [0,2])],
 "find-longest-awesome-substring": [("longestAwesome", ("3242415",), 5), ("longestAwesome", ("12345678",), 1), ("longestAwesome", ("213123",), 6)],
 "nth-magical-number": [("nthMagicalNumber", (1,2,3), 2), ("nthMagicalNumber", (4,2,3), 6), ("nthMagicalNumber", (1000000000,40000,40000), 999720007)],
 "broken-calculator": [("brokenCalc", (2,3), 2), ("brokenCalc", (5,8), 2), ("brokenCalc", (3,10), 3), ("brokenCalc", (5,2), 3)],
 "shifting-letters": [("shiftingLetters", ("abc",[3,5,9]), "rpl"), ("shiftingLetters", ("aaa",[1,2,3]), "gfd")],
 "sum-of-prefix-scores-of-strings": [("sumPrefixScores", (["abc","ab","bc","b"],), [5,4,3,2]), ("sumPrefixScores", (["abcd"],), [4])],
 "lexicographically-smallest-equivalent-string": [("smallestEquivalentString", ("parker","morris","parser"), "makkek"), ("smallestEquivalentString", ("hello","world","hold"), "hdld"), ("smallestEquivalentString", ("leetcode","programs","sourcecode"), "aauaaaaada")],
 "wildcard-matching": [("isMatch", ("aa","a"), False), ("isMatch", ("aa","*"), True), ("isMatch", ("cb","?a"), False), ("isMatch", ("adceb","*a*b"), True), ("isMatch", ("acdcb","a*c?b"), False), ("isMatch", ("",""), True)],
 "shortest-subarray-with-sum-at-least-k": [("shortestSubarray", ([1],1), 1), ("shortestSubarray", ([1,2],4), -1), ("shortestSubarray", ([2,-1,2],3), 3), ("shortestSubarray", ([84,-37,32,40,95],167), 3)],
 "put-marbles-in-bags": [("putMarbles", ([1,3,5,1],2), 4), ("putMarbles", ([1,3],2), 0), ("putMarbles", ([5],1), 0)],
 "minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix": [("minFlips", ([[0,0],[0,1]],), 3), ("minFlips", ([[0]],), 0), ("minFlips", ([[1,0,0],[1,0,0]],), -1)],
 "number-of-steps-to-reduce-a-number-in-binary-representation-to-one": [("numSteps", ("1101",), 6), ("numSteps", ("10",), 1), ("numSteps", ("1",), 0), ("numSteps", ("1111",), 5)],
 "largest-submatrix-with-rearrangements": [("largestSubmatrix", ([[0,0,1],[1,1,1],[1,0,1]],), 4), ("largestSubmatrix", ([[1,0,1,0,1]],), 3), ("largestSubmatrix", ([[1,1,0],[1,0,1]],), 2)],
 "furthest-building-you-can-reach": [("furthestBuilding", ([4,2,7,6,9,14,12],5,1), 4), ("furthestBuilding", ([4,12,2,7,3,18,20,3,19],10,2), 7), ("furthestBuilding", ([14,3,19,3],17,0), 3)],
 "count-all-possible-routes": [("countRoutes", ([2,3,6,8,4],1,3,5), 4), ("countRoutes", ([4,3,1],1,0,6), 5), ("countRoutes", ([5,2,1],0,2,3), 0)],
 "minimum-weighted-subgraph-with-the-required-paths": [("minimumWeight", (6,[[0,2,2],[0,5,6],[1,0,3],[1,4,5],[2,1,1],[2,3,3],[2,3,4],[3,4,2],[4,5,1]],0,1,5), 9), ("minimumWeight", (3,[[0,1,1],[2,1,1]],0,1,2), -1)],
 "substring-with-concatenation-of-all-words": [("findSubstring", ("barfoothefoobarman",["foo","bar"]), [0,9]), ("findSubstring", ("wordgoodgoodgoodbestword",["word","good","best","word"]), []), ("findSubstring", ("barfoofoobarthefoobarman",["bar","foo","the"]), [6,9,12]), ("findSubstring", ("aaa",["a","a"]), [0,1])],
 "couples-holding-hands": [("minSwapsCouples", ([0,2,1,3],), 1), ("minSwapsCouples", ([3,2,0,1],), 0), ("minSwapsCouples", ([0,3,4,1,2,5],), 2)],
 "meeting-rooms-iii": [("mostBooked", (2,[[0,10],[1,5],[2,7],[3,4]]), 0), ("mostBooked", (3,[[1,20],[2,10],[3,5],[4,9],[6,8]]), 1)],
 "4sum-ii": [("fourSumCount", ([1,2],[-2,-1],[-1,2],[0,2]), 2), ("fourSumCount", ([0],[0],[0],[0]), 1)],
 "maximum-score-of-a-good-subarray": [("maximumScore", ([1,4,3,7,4,5],3), 15), ("maximumScore", ([5,5,4,5,4,1,1,1],0), 20), ("maximumScore", ([7],0), 7)],
 "longest-path-with-different-adjacent-characters": [("longestPath", ([-1,0,0,1,1,2],"abacbe"), 3), ("longestPath", ([-1,0,0,0],"aabc"), 3), ("longestPath", ([-1],"z"), 1)],
 "single-number-ii": [("singleNumber", ([2,2,3,2],), 3), ("singleNumber", ([0,1,0,1,0,1,99],), 99), ("singleNumber", ([-2,-2,1,1,4,1,4,4,-4,-2],), -4)],
}
TREE = {
 "pseudo-palindromic-paths-in-a-binary-tree": [("pseudoPalindromicPaths", ([2,3,1,3,1,None,1],), 2, None), ("pseudoPalindromicPaths", ([2,1,1,1,3,None,None,None,None,None,1],), 1, None), ("pseudoPalindromicPaths", ([9],), 1, None)],
 "maximum-level-sum-of-a-binary-tree": [("maxLevelSum", ([1,7,0,7,-8,None,None],), 2, None), ("maxLevelSum", ([989,None,10250,98693,-89388,None,None,None,-32127],), 2, None)],
 "distribute-coins-in-binary-tree": [("distributeCoins", ([3,0,0],), 2, None), ("distributeCoins", ([0,3,0],), 3, None)],
}
def _lca(load, check, h):
    f = load("lowest-common-ancestor-of-a-binary-tree")["lowestCommonAncestor"]; r = h.tree([3,5,1,6,2,0,8,None,None,7,4])
    for p, q, exp in ((5,1,3), (5,4,5), (7,8,3)): check("LCA", f(r, h.find(r,p), h.find(r,q)).val, exp)
    r = h.tree([1,2]); check("LCA small", f(r, h.find(r,1), h.find(r,2)).val, 1)
def _prune(load, check, h):
    f = load("binary-tree-pruning")["pruneTree"]
    for a, exp in (([1,None,0,0,1], [1,None,0,None,1]), ([1,0,1,0,0,0,1], [1,None,1,None,1]), ([1,1,0,1,1,0,1,0], [1,1,0,1,1,None,1]), ([0], [])): check("pruneTree", h.level(f(h.tree(a))) if f(h.tree(a)) else [], exp)
def _sudoku(load, check, h):
    b = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]
    load("sudoku-solver")["solveSudoku"](b)
    check("solveSudoku", ["".join(r) for r in b], ["534678912","672195348","198342567","859761423","426853791","713924856","961537284","287419635","345286179"])
def _allone(load, check, h):
    a = load("all-oone-data-structure")["AllOne"]()
    check("AllOne", _ops(a, [("inc",("hello",)),("inc",("hello",)),("getMaxKey",()),("getMinKey",()),("inc",("leet",)),("getMaxKey",()),("getMinKey",())]), [None,None,"hello","hello",None,"hello","leet"])
    check("AllOne dec", _ops(a, [("dec",("hello",)),("dec",("hello",)),("getMaxKey",()),("dec",("leet",)),("getMaxKey",()),("getMinKey",())]), [None,None,"leet",None,"",""])
def _ops(obj, calls): return [getattr(obj, n)(*a) for n, a in calls]
def _deque(load, check, h):
    d = load("design-circular-deque")["MyCircularDeque"](3)
    check("MyCircularDeque", _ops(d, [("insertLast",(1,)),("insertLast",(2,)),("insertFront",(3,)),("insertFront",(4,)),("getRear",()),("isFull",()),("deleteLast",()),("insertFront",(4,)),("getFront",())]), [True,True,True,False,2,True,True,True,4])
    e = load("design-circular-deque")["MyCircularDeque"](1)
    check("MyCircularDeque empty", _ops(e, [("getFront",()),("deleteFront",()),("isEmpty",())]), [-1,False,True])
def _rand(load, check, h):
    c = load("insert-delete-getrandom-o1-duplicates-allowed")["RandomizedCollection"]()
    check("RandomizedCollection", _ops(c, [("insert",(1,)),("insert",(1,)),("insert",(2,))]) + [c.getRandom() in (1, 2)] + _ops(c, [("remove",(1,)),("remove",(3,))]) + [sorted(c.vals), c.getRandom() in (1, 2)], [True,False,True,True,True,False,[1,2],True])
    check("RandomizedCollection last", _ops(c, [("remove",(2,)),("remove",(1,)),("remove",(1,))]) + [c.vals], [True,True,False,[]])
def _food(load, check, h):
    f = load("design-a-food-rating-system")["FoodRatings"](["kimchi","miso","sushi","moussaka","ramen","bulgogi"],["korean","japanese","japanese","greek","japanese","korean"],[9,12,8,15,14,7])
    check("FoodRatings", _ops(f, [("highestRated",("korean",)),("highestRated",("japanese",)),("changeRating",("sushi",16)),("highestRated",("japanese",)),("changeRating",("ramen",16)),("highestRated",("japanese",))]), ["kimchi","ramen",None,"sushi",None,"ramen"])
def _magic(load, check, h):
    m = load("implement-magic-dictionary")["MagicDictionary"](); m.buildDict(["hello","leetcode"])
    check("MagicDictionary", [m.search(w) for w in ("hello","hhllo","hell","leetcoded")], [False,True,False,False])
    m.buildDict(["hello","hallo"]); check("MagicDictionary self", m.search("hello"), True)
CUSTOM = [_prune, _sudoku, _allone, _lca, _deque, _rand, _food, _magic]

# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "equal-row-and-column-pairs": [("equalPairs", ([[3,2,1],[1,7,6],[2,7,7]],), 1), ("equalPairs", ([[3,1,2,2],[1,4,4,5],[2,4,2,2],[2,4,2,2]],), 3), ("equalPairs", ([[5]],), 1)],
 "minimum-obstacle-removal-to-reach-corner": [("minimumObstacles", ([[0,1,1],[1,1,0],[1,1,0]],), 2), ("minimumObstacles", ([[0,1,0,0,0],[0,1,0,1,0],[0,0,0,1,0]],), 0), ("minimumObstacles", ([[0]],), 0)],
 "the-kth-factor-of-n": [("kthFactor", (12,3), 3), ("kthFactor", (7,2), 7), ("kthFactor", (4,4), -1), ("kthFactor", (16,3), 4), ("kthFactor", (1,1), 1)],
 "number-of-valid-words-for-each-puzzle": [("findNumOfValidWords", (["aaaa","asas","able","ability","actt","actor","access"],["aboveyz","abrodyz","abslute","absoryz","actresz","gaswxyz"]), [1,1,3,2,4,0]), ("findNumOfValidWords", (["apple","pleas","please"],["aelwxyz","aelpxyz","aelpsxy","saelpxy","xaelpsy"]), [0,1,3,2,0])],
 "minimum-rounds-to-complete-all-tasks": [("minimumRounds", ([2,2,3,3,2,4,4,4,4,4],), 4), ("minimumRounds", ([2,3,3],), -1), ("minimumRounds", ([5,5,5,5],), 2)],
 "minimum-cost-of-a-path-with-special-roads": [("minimumCost", ([1,1],[4,5],[[1,2,3,3,2],[3,4,4,5,1]]), 5), ("minimumCost", ([3,2],[5,7],[[5,7,3,2,1],[3,2,3,4,4],[3,3,5,5,5],[3,4,5,6,6]]), 7), ("minimumCost", ([1,1],[10,4],[[4,2,1,1,3],[1,2,7,4,4],[10,3,6,1,2],[6,1,1,2,3]]), 8), ("minimumCost", ([1,1],[1,1],[]), 0)],
 "minimum-cost-homecoming-of-a-robot-in-a-grid": [("minCost", ([1,0],[2,3],[5,4,3],[8,2,6,7]), 18), ("minCost", ([0,0],[0,0],[5],[26]), 0), ("minCost", ([2,3],[0,0],[1,2,3],[4,5,6,7]), 3+15)],
 "k-similar-strings": [("kSimilarity", ("ab","ba"), 1), ("kSimilarity", ("abc","bca"), 2), ("kSimilarity", ("abcd","badc"), 2), ("kSimilarity", ("aa","aa"), 0)],
 "sum-of-total-strength-of-wizards": [("totalStrength", ([1,3,1,2],), 44), ("totalStrength", ([5,4,6],), 213), ("totalStrength", ([7],), 49)],
 "evaluate-the-bracket-pairs-of-a-string": [("evaluate", ("(name)is(age)yearsold",[["name","bob"],["age","two"]]), "bobistwoyearsold"), ("evaluate", ("hi(name)",[["a","b"]]), "hi?"), ("evaluate", ("(a)(a)(a)aaa",[["a","yes"]]), "yesyesyesaaa")],
 "find-triangular-sum-of-an-array": [("triangularSum", ([1,2,3,4,5],), 8), ("triangularSum", ([5],), 5)],
 "maximum-score-from-removing-substrings": [("maximumGain", ("cdbcbbaaabab",4,5), 19), ("maximumGain", ("aabbaaxybbaabb",5,4), 20), ("maximumGain", ("xyz",3,3), 0)],
 "longest-valid-parentheses": [("longestValidParentheses", ("(()",), 2), ("longestValidParentheses", (")()())",), 4), ("longestValidParentheses", ("",), 0), ("longestValidParentheses", ("()(())",), 6)],
 "sliding-window-median": [("medianSlidingWindow", ([1,3,-1,-3,5,3,6,7],3), [1,-1,-1,3,5,6]), ("medianSlidingWindow", ([1,2,3,4,2,3,1,4,2],3), [2,3,3,3,2,3,2]), ("medianSlidingWindow", ([1,4,2,3],4), [2.5]), ("medianSlidingWindow", ([2147483647,2147483647],2), [2147483647.0])],
 "minimum-flips-to-make-a-or-b-equal-to-c": [("minFlips", (2,6,5), 3), ("minFlips", (4,2,7), 1), ("minFlips", (1,2,3), 0)],
}
TREE = {}

def _calendar(load, check, h):
    c = load("my-calendar-iii")["MyCalendarThree"]()
    check("MyCalendarThree", [c.book(s, e) for s, e in [[10,20],[50,60],[10,40],[5,15],[5,10],[25,55]]], [1,1,2,3,3,3])

def _middle(load, check, h):
    f = load("delete-the-middle-node-of-a-linked-list")["deleteMiddle"]
    for a, exp in [([1,3,4,7,1,2,6], [1,3,4,1,2,6]), ([1,2,3,4], [1,2,4]), ([2,1], [2]), ([1], [])]:
        check("deleteMiddle", h.arr(f(h.lst(a))), exp)

def _cousins(load, check, h):
    f = load("cousins-in-binary-tree-ii")["replaceValueInTree"]
    for a, exp in [([5,4,9,1,10,None,7], [0,0,0,7,7,None,11]), ([3,1,2], [0,0,0]), ([1], [0])]:
        check("replaceValueInTree", h.level(f(h.tree(a))), exp)

CUSTOM = [_calendar, _middle, _cousins]

CASES.update({
 "reachable-nodes-with-restrictions": [("reachableNodes", (7,[[0,1],[1,2],[3,1],[4,0],[0,5],[5,6]],[4,5]), 4), ("reachableNodes", (7,[[0,1],[0,2],[0,5],[0,4],[3,2],[6,5]],[4,2,1]), 3), ("reachableNodes", (2,[[0,1]],[1]), 1)],
 "all-ancestors-of-a-node-in-a-directed-acyclic-graph": [("getAncestors", (8,[[0,3],[0,4],[1,3],[2,4],[2,7],[3,5],[3,6],[3,7],[4,6]]), [[],[],[],[0,1],[0,2],[0,1,3],[0,1,2,3,4],[0,1,2,3]]), ("getAncestors", (5,[[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]), [[],[0],[0,1],[0,1,2],[0,1,2,3]]), ("getAncestors", (1,[]), [[]])],
 "minimum-sum-of-squared-difference": [("minSumSquareDiff", ([1,2,3,4],[2,10,20,19],0,0), 579), ("minSumSquareDiff", ([1,4,10,12],[5,8,6,9],1,1), 43), ("minSumSquareDiff", ([1,2],[3,4],5,0), 0), ("minSumSquareDiff", ([10,10,10],[0,0,0],2,2), 226), ("minSumSquareDiff", ([0,0,0,0],[9,7,4,2],4,2), 70)],
 "count-the-number-of-complete-components": [("countCompleteComponents", (6,[[0,1],[0,2],[1,2],[3,4]]), 3), ("countCompleteComponents", (6,[[0,1],[0,2],[1,2],[3,4],[3,5]]), 1), ("countCompleteComponents", (1,[]), 1)],
 "24-game": [("judgePoint24", ([4,1,8,7],), True), ("judgePoint24", ([1,2,1,2],), False), ("judgePoint24", ([3,3,8,8],), True), ("judgePoint24", ([1,5,9,1],), False)],
 "russian-doll-envelopes": [("maxEnvelopes", ([[5,4],[6,4],[6,7],[2,3]],), 3), ("maxEnvelopes", ([[1,1],[1,1],[1,1]],), 1), ("maxEnvelopes", ([[4,5],[4,6],[6,7],[2,3],[1,1]],), 4)],
 "race-car": [("racecar", (3,), 2), ("racecar", (6,), 5), ("racecar", (1,), 1), ("racecar", (4,), 5), ("racecar", (5,), 7)],
 "maximum-bags-with-full-capacity-of-rocks": [("maximumBags", ([2,3,4,5],[1,2,4,4],2), 3), ("maximumBags", ([10,2,2],[2,2,0],100), 3), ("maximumBags", ([5],[0],4), 0)],
 "palindrome-partitioning-iii": [("palindromePartition", ("abc",2), 1), ("palindromePartition", ("aabbc",3), 0), ("palindromePartition", ("leetcode",8), 0), ("palindromePartition", ("abcb",1), 2)],
 "last-day-where-you-can-still-cross": [("latestDayToCross", (2,2,[[1,1],[2,1],[1,2],[2,2]]), 2), ("latestDayToCross", (2,2,[[1,1],[1,2],[2,1],[2,2]]), 1), ("latestDayToCross", (3,3,[[1,2],[2,1],[3,3],[2,2],[1,1],[1,3],[2,3],[3,2],[3,1]]), 3)],
 "trapping-rain-water-ii": [("trapRainWater", ([[1,4,3,1,3,2],[3,2,1,3,2,4],[2,3,3,2,3,1]],), 4), ("trapRainWater", ([[3,3,3,3,3],[3,2,2,2,3],[3,2,1,2,3],[3,2,2,2,3],[3,3,3,3,3]],), 10), ("trapRainWater", ([[5]],), 0)],
 "contains-duplicate-iii": [("containsNearbyAlmostDuplicate", ([1,2,3,1],3,0), True), ("containsNearbyAlmostDuplicate", ([1,5,9,1,5,9],2,3), False), ("containsNearbyAlmostDuplicate", ([-3,3],2,4), False), ("containsNearbyAlmostDuplicate", ([-1,-1],1,0), True), ("containsNearbyAlmostDuplicate", ([4,1,6,3],1,2), False)],
 "number-of-ways-to-split-a-string": [("numWays", ("10101",), 4), ("numWays", ("1001",), 0), ("numWays", ("0000",), 3), ("numWays", ("100100010100110",), 12)],
 "minimum-number-of-k-consecutive-bit-flips": [("minKBitFlips", ([0,1,0],1), 2), ("minKBitFlips", ([1,1,0],2), -1), ("minKBitFlips", ([0,0,0,1,0,1,1,0],3), 3)],
 "number-of-smooth-descent-periods-of-a-stock": [("getDescentPeriods", ([3,2,1,4],), 7), ("getDescentPeriods", ([8,6,7,7],), 4), ("getDescentPeriods", ([1],), 1)],
})

def _gcd_list(load, check, h):
    f = load("insert-greatest-common-divisors-in-linked-list")["insertGreatestCommonDivisors"]
    check("insertGCD a", h.arr(f(h.lst([18,6,10,3]))), [18,6,6,2,10,1,3]); check("insertGCD b", h.arr(f(h.lst([7]))), [7])

def _divisible(load, check, h):
    f = load("largest-divisible-subset")["largestDivisibleSubset"]
    for a, size in [([1,2,3], 2), ([1,2,4,8], 4), ([3,4,16,8], 3), ([7], 1)]:
        got = f(a[:]); ok = len(got) == size and set(got) <= set(a) and all(max(x, y) % min(x, y) == 0 for x in got for y in got)
        check("largestDivisibleSubset " + str(a), ok, True)

def _infinite(load, check, h):
    s = load("smallest-number-in-infinite-set")["SmallestInfiniteSet"]()
    calls = [("addBack", (2,)), ("popSmallest", ()), ("popSmallest", ()), ("popSmallest", ()), ("addBack", (1,)), ("popSmallest", ()), ("popSmallest", ()), ("popSmallest", ())]
    check("SmallestInfiniteSet", [getattr(s, n)(*a) for n, a in calls], [None,1,2,3,None,1,4,5])

CUSTOM += [_gcd_list, _divisible, _infinite]

CASES.update({
 "maximum-number-of-k-divisible-components": [("maxKDivisibleComponents", (5,[[0,2],[1,2],[1,3],[2,4]],[1,8,1,4,4],6), 2), ("maxKDivisibleComponents", (7,[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]],[3,0,6,1,5,2,1],3), 3), ("maxKDivisibleComponents", (1,[],[0],1), 1)],
 "maximize-the-confusion-of-an-exam": [("maxConsecutiveAnswers", ("TTFF",2), 4), ("maxConsecutiveAnswers", ("TFFT",1), 3), ("maxConsecutiveAnswers", ("TTFTTFTT",1), 5)],
 "count-the-number-of-fair-pairs": [("countFairPairs", ([0,1,7,4,4,5],3,6), 6), ("countFairPairs", ([1,7,9,2,5],11,11), 1), ("countFairPairs", ([5],0,10), 0)],
 "rank-teams-by-votes": [("rankTeams", (["ABC","ACB","ABC","ACB","ACB"],), "ACB"), ("rankTeams", (["WXYZ","XYZW"],), "XWYZ"), ("rankTeams", (["ZMNAGUEDSJYLBOPHRQICWFXTVK"],), "ZMNAGUEDSJYLBOPHRQICWFXTVK")],
 "smallest-string-with-a-given-numeric-value": [("getSmallestString", (3,27), "aay"), ("getSmallestString", (5,73), "aaszz"), ("getSmallestString", (1,1), "a")],
 "sum-of-even-numbers-after-queries": [("sumEvenAfterQueries", ([1,2,3,4],[[1,0],[-3,1],[-4,0],[2,3]]), [8,6,2,4]), ("sumEvenAfterQueries", ([1],[[4,0]]), [0])],
 "count-vowel-strings-in-ranges": [("vowelStrings", (["aba","bcb","ece","aa","e"],[[0,2],[1,4],[1,1]]), [2,3,0]), ("vowelStrings", (["a","e","i"],[[0,2],[0,1],[2,2]]), [3,2,1])],
 "maximum-candies-allocated-to-k-children": [("maximumCandies", ([5,8,6],3), 5), ("maximumCandies", ([2,5],11), 0), ("maximumCandies", ([4,7,5],4), 3)],
 "array-nesting": [("arrayNesting", ([5,4,0,3,1,6,2],), 4), ("arrayNesting", ([0,1,2],), 1)],
 "minimum-sideway-jumps": [("minSideJumps", ([0,1,2,3,0],), 2), ("minSideJumps", ([0,1,1,3,3,0],), 0), ("minSideJumps", ([0,2,1,0,3,0],), 2)],
 "decoded-string-at-index": [("decodeAtIndex", ("leet2code3",10), "o"), ("decodeAtIndex", ("ha22",5), "h"), ("decodeAtIndex", ("a2345678999999999999999",1), "a")],
 "rotating-the-box": [("rotateTheBox", ([["#",".","#"]],), [["."],["#"],["#"]]), ("rotateTheBox", ([["#",".","*","."],["#","#","*","."]],), [["#","."],["#","#"],["*","*"],[".","."]]), ("rotateTheBox", ([["#","#","*",".","*","."],["#","#","#","*",".","."],["#","#","#",".","#","."]],), [[".","#","#"],[".","#","#"],["#","#","*"],["#","*","."],["#",".","*"],["#",".","."]])],
 "the-number-of-weak-characters-in-the-game": [("numberOfWeakCharacters", ([[5,5],[6,3],[3,6]],), 0), ("numberOfWeakCharacters", ([[2,2],[3,3]],), 1), ("numberOfWeakCharacters", ([[1,5],[10,4],[4,3]],), 1), ("numberOfWeakCharacters", ([[1,1],[2,1],[2,2],[1,2]],), 1)],
})
TREE.update({
 "binary-tree-level-order-traversal-ii": [("levelOrderBottom", ([3,9,20,None,None,15,7],), [[15,7],[9,20],[3]], None), ("levelOrderBottom", ([1],), [[1]], None), ("levelOrderBottom", ([],), [], None)],
})

def _ladder(load, check, h):
    f = load("word-ladder-ii")["findLadders"]
    check("findLadders a", sorted(f("hit","cog",["hot","dot","dog","lot","log","cog"])), [["hit","hot","dot","dog","cog"],["hit","hot","lot","log","cog"]])
    check("findLadders b", f("hit","cog",["hot","dot","dog","lot","log"]), [])

def _stream(load, check, h):
    s = load("stream-of-characters")["StreamChecker"](["cd","f","kl"])
    check("StreamChecker", [s.query(c) for c in "abcdefghijkl"], [False,False,False,True,False,True,False,False,False,False,False,True])

def _sort_items(load, check, h):
    f = load("sort-items-by-groups-respecting-dependencies")["sortItems"]
    def valid(n, m, group, before, out):
        if sorted(out) != list(range(n)): return False
        at = {x: i for i, x in enumerate(out)}
        if any(at[b] > at[a] for a in range(n) for b in before[a]): return False
        seen, last = set(), None
        for x in out:
            g = group[x] if group[x] != -1 else ("solo", x)
            if g != last and g in seen: return False
            seen.add(g); last = g
        return True
    g1 = [-1,-1,1,0,0,1,0,-1]; b1 = [[],[6],[5],[6],[3,6],[],[],[]]
    check("sortItems a", valid(8, 2, g1, b1, f(8, 2, g1[:], [x[:] for x in b1])), True)
    check("sortItems b", f(8, 2, [-1,-1,1,0,0,1,0,-1], [[],[6],[5],[6],[3],[],[4],[]]), [])

def _queens(load, check, h):
    f = load("queens-that-can-attack-the-king")["queensAttacktheKing"]
    check("queens a", sorted(f([[0,1],[1,0],[4,0],[0,4],[3,3],[2,4]],[0,0])), [[0,1],[1,0],[3,3]])
    check("queens b", sorted(f([[0,0],[1,1],[2,2],[3,4],[3,5],[4,4],[4,5]],[3,3])), [[2,2],[3,4],[4,4]])

CUSTOM += [_ladder, _stream, _sort_items, _queens]

CASES.update({
 "maximum-total-damage-with-spell-casting": [("maximumTotalDamage", ([1,1,3,4],), 6), ("maximumTotalDamage", ([7,1,6,6],), 13), ("maximumTotalDamage", ([5],), 5)],
 "most-profit-assigning-work": [("maxProfitAssignment", ([2,4,6,8,10],[10,20,30,40,50],[4,5,6,7]), 100), ("maxProfitAssignment", ([85,47,57],[24,66,99],[40,25,25]), 0), ("maxProfitAssignment", ([5,1],[1,9],[3]), 9)],
 "vowels-of-all-substrings": [("countVowels", ("aba",), 6), ("countVowels", ("abc",), 3), ("countVowels", ("ltcd",), 0)],
 "maximum-non-negative-product-in-a-matrix": [("maxProductPath", ([[-1,-2,-3],[-2,-3,-3],[-3,-3,-2]],), -1), ("maxProductPath", ([[1,-2,1],[1,-2,1],[3,-4,1]],), 8), ("maxProductPath", ([[1,3],[0,-4]],), 0)],
 "minimum-operations-to-make-array-equal": [("minOperations", (3,), 2), ("minOperations", (6,), 9), ("minOperations", (1,), 0)],
 "smallest-subarrays-with-maximum-bitwise-or": [("smallestSubarrays", ([1,0,2,1,3],), [3,3,2,2,1]), ("smallestSubarrays", ([1,2],), [2,1]), ("smallestSubarrays", ([0,0],), [1,1])],
 "count-unreachable-pairs-of-nodes-in-an-undirected-graph": [("countPairs", (3,[[0,1],[0,2],[1,2]]), 0), ("countPairs", (7,[[0,2],[0,5],[2,4],[1,6],[5,4]]), 14), ("countPairs", (1,[]), 0)],
 "separate-black-and-white-balls": [("minimumSteps", ("101",), 1), ("minimumSteps", ("100",), 2), ("minimumSteps", ("0111",), 0)],
 "number-of-good-ways-to-split-a-string": [("numSplits", ("aacaba",), 2), ("numSplits", ("abcd",), 1), ("numSplits", ("a",), 0)],
 "length-of-longest-subarray-with-at-most-k-frequency": [("maxSubarrayLength", ([1,2,3,1,2,3,1,2],2), 6), ("maxSubarrayLength", ([1,2,1,2,1,2,1,2],1), 2), ("maxSubarrayLength", ([5,5,5,5,5,5,5],4), 4)],
 "adding-spaces-to-a-string": [("addSpaces", ("LeetcodeHelpsMeLearn",[8,13,15]), "Leetcode Helps Me Learn"), ("addSpaces", ("icodeinpython",[1,5,7,9]), "i code in py thon"), ("addSpaces", ("spacing",[0,1,2,3,4,5,6]), " s p a c i n g")],
 "minimum-difference-between-largest-and-smallest-value-in-three-moves": [("minDifference", ([5,3,2,4],), 0), ("minDifference", ([1,5,0,10,14],), 1), ("minDifference", ([3,100,20],), 0), ("minDifference", ([6,6,0,1,1,4,6],), 2)],
 "number-of-subarrays-with-bounded-maximum": [("numSubarrayBoundedMax", ([2,1,4,3],2,3), 3), ("numSubarrayBoundedMax", ([2,9,2,5,6],2,8), 7), ("numSubarrayBoundedMax", ([9],1,2), 0)],
})
TREE.update({
 "path-sum-iii": [("pathSum", ([10,5,-3,3,2,None,11,3,-2,None,1], 8), 3, None), ("pathSum", ([5,4,8,11,None,13,4,7,2,None,None,5,1], 22), 3, None), ("pathSum", ([], 0), 0, None)],
})

def _ways(load, check, h):
    f = load("different-ways-to-add-parentheses")["diffWaysToCompute"]
    check("diffWays a", sorted(f("2-1-1")), [0,2]); check("diffWays b", sorted(f("2*3-4*5")), [-34,-14,-10,-10,10]); check("diffWays c", f("7"), [7])

def _comb(load, check, h):
    it = load("iterator-for-combination")["CombinationIterator"]("abc", 2)
    check("CombinationIterator", [it.next(), it.hasNext(), it.next(), it.hasNext(), it.next(), it.hasNext()], ["ab",True,"ac",True,"bc",False])

def _stock(load, check, h):
    s = load("stock-price-fluctuation")["StockPrice"]()
    calls = [("update",(1,10)),("update",(2,5)),("current",()),("maximum",()),("update",(1,3)),("maximum",()),("update",(4,2)),("minimum",())]
    check("StockPrice", [getattr(s, n)(*a) for n, a in calls], [None,None,5,10,None,5,None,2])

CUSTOM += [_ways, _comb, _stock]

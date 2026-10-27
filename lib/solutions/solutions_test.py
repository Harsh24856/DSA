"""Runs every hand-written Python solution against LeetCode's examples. Use: npm run check:solutions"""
import json, sys
from collections import deque
src = json.load(sys.stdin)
class TreeNode:
    def __init__(s, val=0, left=None, right=None): s.val, s.left, s.right = val, left, right
class Node:
    def __init__(s, val=0, prev=None, next=None, child=None): s.val, s.prev, s.next, s.child = val, prev, next, child
class ListNode:
    def __init__(s, val=0, next=None): s.val, s.next = val, next
def tree(a):
    if not a: return None
    it = iter(a); root = TreeNode(next(it)); q = deque([root])
    for v in it:
        n = q[0]
        if not hasattr(n, "_l"):
            n._l = 1
            if v is not None: n.left = TreeNode(v); q.append(n.left)
        else:
            q.popleft()
            if v is not None: n.right = TreeNode(v); q.append(n.right)
    return root
def level(r):
    out, q = [], deque([r])
    while q:
        n = q.popleft()
        if n: out.append(n.val); q.append(n.left); q.append(n.right)
        else: out.append(None)
    while out and out[-1] is None: out.pop()
    return out
def inorder(r): return inorder(r.left) + [r.val] + inorder(r.right) if r else []
def height(r): return 1 + max(height(r.left), height(r.right)) if r else 0
def balanced(r): return (not r) or (abs(height(r.left) - height(r.right)) <= 1 and balanced(r.left) and balanced(r.right))
def lst(a):
    d = ListNode(); c = d
    for v in a: c.next = ListNode(v); c = c.next
    return d.next
def arr(h):
    out = []
    while h: out.append(h.val); h = h.next
    return out
def multi(a):
    """LeetCode's multilevel list format: levels separated by nulls; k nulls put the next level under node k-1."""
    head, row, i = None, [], 0
    while i < len(a):
        nulls = 0
        while i < len(a) and a[i] is None: nulls += 1; i += 1
        level = []
        while i < len(a) and a[i] is not None: level.append(Node(a[i])); i += 1
        for x, y in zip(level, level[1:]): x.next, y.prev = y, x
        if head is None: head = level[0]
        else: row[nulls - 1].child = level[0]
        row = level
    return head
def flat(h):
    out, prev = [], None
    while h:
        assert h.prev is prev and h.child is None; out.append(h.val); prev, h = h, h.next
    return out
def ops(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]
def find(r, v):
    if not r: return None
    if r.val == v: return r
    return find(r.left, v) or find(r.right, v)
def load(slug):
    g = {"TreeNode": TreeNode, "ListNode": ListNode, "Node": Node}
    exec(src[slug], g); return g
CASES = {
 "count-triplets-that-can-form-two-arrays-of-equal-xor": [("countTriplets", ([2,3,1,6,7],), 4), ("countTriplets", ([1,1,1,1,1],), 10)],
 "longest-well-performing-interval": [("longestWPI", ([9,9,6,0,6,6,9],), 3), ("longestWPI", ([6,6,6],), 0)],
 "grumpy-bookstore-owner": [("maxSatisfied", ([1,0,1,2,1,1,7,5],[0,1,0,1,0,1,0,1],3), 16), ("maxSatisfied", ([1],[0],1), 1)],
 "valid-triangle-number": [("triangleNumber", ([2,2,3,4],), 3), ("triangleNumber", ([4,2,3,4],), 4)],
 "minimum-number-of-steps-to-make-two-strings-anagram": [("minSteps", ("bab","aba"), 1), ("minSteps", ("leetcode","practice"), 5), ("minSteps", ("anagram","mangaar"), 0)],
 "k-th-symbol-in-grammar": [("kthGrammar", (1,1), 0), ("kthGrammar", (2,1), 0), ("kthGrammar", (2,2), 1), ("kthGrammar", (4,6), 0)],
 "make-sum-divisible-by-p": [("minSubarray", ([3,1,4,2],6), 1), ("minSubarray", ([6,3,5,2],9), 2), ("minSubarray", ([1,2,3],3), 0), ("minSubarray", ([1,2,3],7), -1)],
 "maximum-value-at-a-given-index-in-a-bounded-array": [("maxValue", (4,2,6), 2), ("maxValue", (6,1,10), 3)],
 "number-of-substrings-with-only-1s": [("numSub", ("0110111",), 9), ("numSub", ("101",), 2), ("numSub", ("111111",), 21)],
 "minimum-deletions-to-make-array-beautiful": [("minDeletion", ([1,1,2,3,5],), 1), ("minDeletion", ([1,1,2,2,3,3],), 2)],
 "angle-between-hands-of-a-clock": [("angleClock", (12,30), 165), ("angleClock", (3,30), 75), ("angleClock", (3,15), 7.5)],
 "rearrange-array-elements-by-sign": [("rearrangeArray", ([3,1,-2,-5,2,-4],), [3,-2,1,-5,2,-4]), ("rearrangeArray", ([-1,1],), [1,-1])],
 "minimum-time-difference": [("findMinDifference", (["23:59","00:00"],), 1), ("findMinDifference", (["00:00","23:59","00:00"],), 0)],
 "increasing-triplet-subsequence": [("increasingTriplet", ([1,2,3,4,5],), True), ("increasingTriplet", ([5,4,3,2,1],), False), ("increasingTriplet", ([2,1,5,0,4,6],), True)],
 "number-of-ways-to-split-array": [("waysToSplitArray", ([10,4,-8,7],), 2), ("waysToSplitArray", ([2,3,1,0],), 2)],
 "maximum-product-of-word-lengths": [("maxProduct", (["abcw","baz","foo","bar","xtfn","abcdef"],), 16), ("maxProduct", (["a","aa","aaa","aaaa"],), 0)],
 "continuous-subarrays": [("continuousSubarrays", ([5,4,2,4],), 8), ("continuousSubarrays", ([1,2,3],), 6)],
 "binary-subarrays-with-sum": [("numSubarraysWithSum", ([1,0,1,0,1],2), 4), ("numSubarraysWithSum", ([0,0,0,0,0],0), 15)],
 "magnetic-force-between-two-balls": [("maxDistance", ([1,2,3,4,7],3), 3), ("maxDistance", ([5,4,3,2,1,1000000000],2), 999999999)],
 "longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit": [("longestSubarray", ([8,2,4,7],4), 2), ("longestSubarray", ([10,1,2,4,7,2],5), 4), ("longestSubarray", ([4,2,2,2,4,4,2,2],0), 3)],
 "make-string-a-subsequence-using-cyclic-increments": [("canMakeSubsequence", ("abc","ad"), True), ("canMakeSubsequence", ("zc","ad"), True), ("canMakeSubsequence", ("ab","d"), False)],
 "word-subsets": [("wordSubsets", (["amazon","apple","facebook","google","leetcode"],["e","o"]), ["facebook","google","leetcode"]), ("wordSubsets", (["amazon","apple","facebook","google","leetcode"],["l","e"]), ["apple","google","leetcode"])],
 "average-waiting-time": [("averageWaitingTime", ([[1,2],[2,5],[4,3]],), 5.0), ("averageWaitingTime", ([[5,2],[5,4],[10,3],[20,1]],), 3.25)],
 "majority-element-ii": [("majorityElement", ([3,2,3],), [3]), ("majorityElement", ([1],), [1]), ("majorityElement", ([1,2],), [1,2])],
 "find-all-duplicates-in-an-array": [("findDuplicates", ([4,3,2,7,8,2,3,1],), [2,3]), ("findDuplicates", ([1,1,2],), [1])],
 "remove-colored-pieces-if-both-neighbors-are-the-same-color": [("winnerOfGame", ("AAABABB",), True), ("winnerOfGame", ("AA",), False), ("winnerOfGame", ("ABBBBBBBAAA",), False)],
 "number-of-operations-to-make-network-connected": [("makeConnected", (4,[[0,1],[0,2],[1,2]]), 1), ("makeConnected", (6,[[0,1],[0,2],[0,3],[1,2],[1,3]]), 2), ("makeConnected", (6,[[0,1],[0,2],[0,3],[1,2]]), -1)],
 "score-of-parentheses": [("scoreOfParentheses", ("()",), 1), ("scoreOfParentheses", ("(())",), 2), ("scoreOfParentheses", ("()()",), 2), ("scoreOfParentheses", ("(()(()))",), 6)],
 "reverse-substrings-between-each-pair-of-parentheses": [("reverseParentheses", ("(abcd)",), "dcba"), ("reverseParentheses", ("(u(love)i)",), "iloveu"), ("reverseParentheses", ("(ed(et(oc))el)",), "leetcode")],
 "next-greater-node-in-linked-list": [("nextLargerNodes", (lambda: lst([2,1,5]),), [5,5,0]), ("nextLargerNodes", (lambda: lst([2,7,4,3,5]),), [7,0,5,5,0])],
 "nearest-exit-from-entrance-in-maze": [("nearestExit", ([["+","+",".","+"],[".",".",".","+"],["+","+","+","."]],[1,2]), 1), ("nearestExit", ([["+","+","+"],[".",".","."],["+","+","+"]],[1,0]), 2), ("nearestExit", ([[".","+"]],[0,0]), -1)],
 "where-will-the-ball-fall": [("findBall", ([[1,1,1,-1,-1],[1,1,1,-1,-1],[-1,-1,-1,1,1],[1,1,1,1,-1],[-1,-1,-1,-1,-1]],), [1,-1,-1,-1,-1]), ("findBall", ([[-1]],), [-1]), ("findBall", ([[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1],[1,1,1,1,1,1],[-1,-1,-1,-1,-1,-1]],), [0,1,2,3,4,-1])],
 "count-the-number-of-good-subarrays": [("countGood", ([1,1,1,1,1],10), 1), ("countGood", ([3,1,4,3,2,2,4],2), 4)],
 "find-the-smallest-divisor-given-a-threshold": [("smallestDivisor", ([1,2,5,9],6), 5), ("smallestDivisor", ([44,22,33,11,1],5), 44)],
 "number-of-laser-beams-in-a-bank": [("numberOfBeams", (["011001","000000","010100","001000"],), 8), ("numberOfBeams", (["000","111","000"],), 0)],
 "shortest-subarray-to-be-removed-to-make-array-sorted": [("findLengthOfShortestSubarray", ([1,2,3,10,4,2,3,5],), 3), ("findLengthOfShortestSubarray", ([5,4,3,2,1],), 4), ("findLengthOfShortestSubarray", ([1,2,3],), 0)],
 "subarray-product-less-than-k": [("numSubarrayProductLessThanK", ([10,5,2,6],100), 8), ("numSubarrayProductLessThanK", ([1,2,3],0), 0)],
 "combination-sum-iii": [("combinationSum3", (3,7), [[1,2,4]]), ("combinationSum3", (3,9), [[1,2,6],[1,3,5],[2,3,4]]), ("combinationSum3", (4,1), [])],
 "reduce-array-size-to-the-half": [("minSetSize", ([3,3,3,3,5,5,5,2,2,7],), 2), ("minSetSize", ([7,7,7,7,7,7],), 1)],
 "find-the-winner-of-the-circular-game": [("findTheWinner", (5,2), 3), ("findTheWinner", (6,5), 1)],
 "max-consecutive-ones-iii": [("longestOnes", ([1,1,1,0,0,0,1,1,1,1,0],2), 6), ("longestOnes", ([0,0,1,1,0,0,1,1,1,0,1,1,0,0,0,1,1,1,1],3), 10)],
 "maximum-gap": [("maximumGap", ([3,6,9,1],), 3), ("maximumGap", ([10],), 0)],
 "most-stones-removed-with-same-row-or-column": [("removeStones", ([[0,0],[0,1],[1,0],[1,2],[2,1],[2,2]],), 5), ("removeStones", ([[0,0],[0,2],[1,1],[2,0],[2,2]],), 3), ("removeStones", ([[0,0]],), 0)],
 "shortest-unsorted-continuous-subarray": [("findUnsortedSubarray", ([2,6,4,8,10,9,15],), 5), ("findUnsortedSubarray", ([1,2,3,4],), 0), ("findUnsortedSubarray", ([1],), 0)],
 "maximum-white-tiles-covered-by-a-carpet": [("maximumWhiteTiles", ([[1,5],[10,11],[12,18],[20,25],[30,32]],10), 9), ("maximumWhiteTiles", ([[10,11],[1,1]],2), 2)],
 "max-chunks-to-make-sorted": [("maxChunksToSorted", ([4,3,2,1,0],), 1), ("maxChunksToSorted", ([1,0,2,3,4],), 4)],
 "construct-smallest-number-from-di-string": [("smallestNumber", ("IIIDIDDD",), "123549876"), ("smallestNumber", ("DDD",), "4321")],
 "longest-nice-subarray": [("longestNiceSubarray", ([1,3,8,48,10],), 3), ("longestNiceSubarray", ([3,1,5,11,13],), 1)],
 "longest-subarray-with-maximum-bitwise-and": [("longestSubarray", ([1,2,3,3,2,2],), 2), ("longestSubarray", ([1,2,3,4],), 1)],
 "minimum-remove-to-make-valid-parentheses": [("minRemoveToMakeValid", ("lee(t(c)o)de)",), "lee(t(c)o)de"), ("minRemoveToMakeValid", ("a)b(c)d",), "ab(c)d"), ("minRemoveToMakeValid", ("))((",), "")],
 "next-greater-element-iii": [("nextGreaterElement", (12,), 21), ("nextGreaterElement", (21,), -1), ("nextGreaterElement", (2147483486,), -1)],
 "number-of-wonderful-substrings": [("wonderfulSubstrings", ("aba",), 4), ("wonderfulSubstrings", ("aabb",), 9), ("wonderfulSubstrings", ("he",), 2)],
 "find-the-minimum-and-maximum-number-of-nodes-between-critical-points": [("nodesBetweenCriticalPoints", (lambda: lst([3,1]),), [-1,-1]), ("nodesBetweenCriticalPoints", (lambda: lst([5,3,1,2,5,1,2]),), [1,3]), ("nodesBetweenCriticalPoints", (lambda: lst([1,3,2,2,3,2,2,2,7]),), [3,3])],
 "minimum-speed-to-arrive-on-time": [("minSpeedOnTime", ([1,3,2],6), 1), ("minSpeedOnTime", ([1,3,2],2.7), 3), ("minSpeedOnTime", ([1,3,2],1.9), -1)],
 "count-number-of-nice-subarrays": [("numberOfSubarrays", ([1,1,2,1,1],3), 2), ("numberOfSubarrays", ([2,4,6],1), 0), ("numberOfSubarrays", ([2,2,2,1,2,2,1,2,2,2],2), 16)],
 "flip-columns-for-maximum-number-of-equal-rows": [("maxEqualRowsAfterFlips", ([[0,1],[1,1]],), 1), ("maxEqualRowsAfterFlips", ([[0,1],[1,0]],), 2), ("maxEqualRowsAfterFlips", ([[0,0,0],[0,0,1],[1,1,0]],), 2)],
 "get-equal-substrings-within-budget": [("equalSubstring", ("abcd","bcdf",3), 3), ("equalSubstring", ("abcd","cdef",3), 1), ("equalSubstring", ("abcd","acde",0), 1)],
 "possible-bipartition": [("possibleBipartition", (4,[[1,2],[1,3],[2,4]]), True), ("possibleBipartition", (3,[[1,2],[1,3],[2,3]]), False)],
 "minimize-hamming-distance-after-swap-operations": [("minimumHammingDistance", ([1,2,3,4],[2,1,4,5],[[0,1],[2,3]]), 1), ("minimumHammingDistance", ([1,2,3,4],[1,3,2,4],[]), 2), ("minimumHammingDistance", ([5,1,2,4,3],[1,5,4,2,3],[[0,4],[4,2],[1,3],[1,4]]), 0)],
 "difference-between-ones-and-zeros-in-row-and-column": [("onesMinusZeros", ([[0,1,1],[1,0,1],[0,0,1]],), [[0,0,4],[0,0,4],[-2,-2,2]]), ("onesMinusZeros", ([[1,1,1],[1,1,1]],), [[5,5,5],[5,5,5]])],
 "pairs-of-songs-with-total-durations-divisible-by-60": [("numPairsDivisibleBy60", ([30,20,150,100,40],), 3), ("numPairsDivisibleBy60", ([60,60,60],), 3)],
 "find-the-safest-path-in-a-grid": [("maximumSafenessFactor", ([[1,0,0],[0,0,0],[0,0,1]],), 0), ("maximumSafenessFactor", ([[0,0,1],[0,0,0],[0,0,0]],), 2), ("maximumSafenessFactor", ([[0,0,0,1],[0,0,0,0],[0,0,0,0],[1,0,0,0]],), 2)],
 "search-a-2d-matrix-ii": [("searchMatrix", ([[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]],5), True), ("searchMatrix", ([[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]],20), False)],
 "custom-sort-string": [("customSortString", ("cba","abcd"), "cbad"), ("customSortString", ("bcafg","abcd"), "bcad")],
 "find-all-possible-recipes-from-given-supplies": [("findAllRecipes", (["bread"],[["yeast","flour"]],["yeast","flour","corn"]), ["bread"]), ("findAllRecipes", (["bread","sandwich"],[["yeast","flour"],["bread","meat"]],["yeast","flour","meat"]), ["bread","sandwich"]), ("findAllRecipes", (["bread","sandwich","burger"],[["yeast","flour"],["bread","meat"],["sandwich","meat","bread"]],["yeast","flour","meat"]), ["bread","sandwich","burger"])],
 "longest-palindrome-by-concatenating-two-letter-words": [("longestPalindrome", (["lc","cl","gg"],), 6), ("longestPalindrome", (["ab","ty","yt","lc","cl","ab"],), 8), ("longestPalindrome", (["cc","ll","xx"],), 2)],
 "all-paths-from-source-to-target": [("allPathsSourceTarget", ([[1,2],[3],[3],[]],), [[0,1,3],[0,2,3]]), ("allPathsSourceTarget", ([[4,3,1],[3,2,4],[3],[4],[]],), [[0,4],[0,3,4],[0,1,3,4],[0,1,2,3,4],[0,1,4]])],
}
TREE = {
 "path-sum-ii": [("pathSum", ([5,4,8,11,None,13,4,7,2,None,None,5,1], 22), [[5,4,11,2],[5,8,4,5]], None)],
 "most-frequent-subtree-sum": [("findFrequentTreeSum", ([5,2,-3],), [2,-3,4], sorted), ("findFrequentTreeSum", ([5,2,-5],), [2], sorted)],
 "kth-largest-sum-in-a-binary-tree": [("kthLargestLevelSum", ([5,8,9,2,1,3,7,4,6], 2), 13, None), ("kthLargestLevelSum", ([1,2,None,3], 1), 3, None)],
 "longest-univalue-path": [("longestUnivaluePath", ([5,4,5,1,1,None,5],), 2, None), ("longestUnivaluePath", ([1,4,5,4,4,None,5],), 2, None)],
 "maximum-difference-between-node-and-ancestor": [("maxAncestorDiff", ([8,3,10,1,6,None,14,None,None,4,7,13],), 7, None), ("maxAncestorDiff", ([1,None,2,None,0,3],), 3, None)],
 "maximum-product-of-splitted-binary-tree": [("maxProduct", ([1,2,3,4,5,6],), 110, None), ("maxProduct", ([1,None,2,3,4,None,None,5,6],), 90, None)],
 "count-complete-tree-nodes": [("countNodes", ([1,2,3,4,5,6],), 6, None), ("countNodes", ([],), 0, None), ("countNodes", ([1],), 1, None)],
 "number-of-good-leaf-nodes-pairs": [("countPairs", ([1,2,3,None,4], 3), 1, None), ("countPairs", ([1,2,3,4,5,6,7], 3), 2, None), ("countPairs", ([7,1,4,6,None,5,3,None,None,None,None,None,2], 3), 1, None)],
 "deepest-leaves-sum": [("deepestLeavesSum", ([1,2,3,4,5,None,6,7,None,None,None,None,8],), 15, None), ("deepestLeavesSum", ([6,7,8,2,7,1,3,9,None,1,4,None,None,None,5],), 19, None)],
}
ok = fail = 0
def check(name, got, exp):
    global ok, fail
    if got == exp: ok += 1
    else: fail += 1; print("FAIL", name, "got", got, "expected", exp)
for slug, cases in CASES.items():
    g = load(slug)
    for fn, args, exp in cases:
        args = tuple(a() if callable(a) else a for a in args)
        got = g[fn](*[json.loads(json.dumps(a)) if not isinstance(a, ListNode) else a for a in args])
        if isinstance(exp, list) and isinstance(got, list) and slug in ("majority-element-ii", "find-all-duplicates-in-an-array", "word-subsets"): got, exp = sorted(got), sorted(exp)
        if isinstance(exp, float): got = round(got, 5)
        check(f"{slug}{args!s:.40}", got, exp)
for slug, cases in TREE.items():
    g = load(slug)
    for fn, args, exp, post in cases:
        got = g[fn](tree(args[0]), *args[1:])
        if post: got, exp = post(got), post(exp)
        check(f"{slug}{args!s:.40}", got, exp)
# structural answers
g = load("construct-binary-search-tree-from-preorder-traversal"); r = g["bstFromPreorder"]([8,5,1,7,10,12]); check("bstFromPreorder", level(r), [8,5,10,1,7,None,12])
g = load("construct-binary-tree-from-preorder-and-postorder-traversal"); r = g["constructFromPrePost"]([1,2,4,5,3,6,7],[4,5,2,6,7,3,1]); check("constructFromPrePost", level(r), [1,2,3,4,5,6,7])
g = load("convert-sorted-list-to-binary-search-tree"); r = g["sortedListToBST"](lst([-10,-3,0,5,9])); check("sortedListToBST bst+balanced", (inorder(r), balanced(r)), ([-10,-3,0,5,9], True))
g = load("balance-a-binary-search-tree"); r = g["balanceBST"](tree([1,None,2,None,3,None,4])); check("balanceBST", (inorder(r), balanced(r)), ([1,2,3,4], True))
g = load("delete-leaves-with-a-given-value"); check("removeLeafNodes", level(g["removeLeafNodes"](tree([1,2,3,2,None,2,4]), 2)), [1,None,3,None,4]); check("removeLeafNodes all", level(g["removeLeafNodes"](tree([1,1,1]), 1)), [])
g = load("double-a-number-represented-as-a-linked-list"); check("doubleIt 189", arr(g["doubleIt"](lst([1,8,9]))), [3,7,8]); check("doubleIt 999", arr(g["doubleIt"](lst([9,9,9]))), [1,9,9,8])
g = load("remove-zero-sum-consecutive-nodes-from-linked-list"); check("removeZeroSum a", arr(g["removeZeroSumSublists"](lst([1,2,-3,3,1]))), [3,1]); check("removeZeroSum b", arr(g["removeZeroSumSublists"](lst([1,2,3,-3,4]))), [1,2,4]); check("removeZeroSum c", arr(g["removeZeroSumSublists"](lst([1,2,3,-3,-2]))), [1])
g = load("all-nodes-distance-k-in-binary-tree"); root = tree([3,5,1,6,2,0,8,None,None,7,4]); check("distanceK", sorted(g["distanceK"](root, find(root, 5), 2)), [1,4,7])
g = load("restore-the-array-from-adjacent-pairs")
for pairs, exp in [([[2,1],[3,4],[3,2]], [1,2,3,4]), ([[4,-2],[1,4],[-3,1]], [-2,4,1,-3]), ([[100000,-100000]], [100000,-100000])]:
    got = g["restoreArray"](pairs); check("restoreArray", got if got == exp else got[::-1], exp)
g = load("find-valid-matrix-given-row-and-column-sums")
for rs, cs in [([3,8],[4,7]), ([5,7,10],[8,6,8])]:
    m = g["restoreMatrix"](rs[:], cs[:]); check("restoreMatrix sums", ([sum(r) for r in m], [sum(c) for c in zip(*m)], min(min(r) for r in m) >= 0), (rs, cs, True))
g = load("sort-characters-by-frequency")
for s_, okset in [("tree", {"eert","eetr"}), ("cccaaa", {"cccaaa","aaaccc"}), ("Aabb", {"bbAa","bbaA"})]: check("frequencySort " + s_, g["frequencySort"](s_) in okset, True)
g = load("flatten-a-multilevel-doubly-linked-list"); check("flatten a", flat(g["flatten"](multi([1,2,3,4,5,6,None,None,None,7,8,9,10,None,None,11,12]))), [1,2,3,7,8,11,12,9,10,4,5,6]); check("flatten b", flat(g["flatten"](multi([1,2,None,3]))), [1,3,2]); check("flatten empty", g["flatten"](None), None)
g = load("recover-binary-search-tree")
for a, exp in [([1,3,None,None,2], [3,1,None,None,2]), ([3,1,4,None,None,2], [2,1,4,None,None,3])]:
    r = tree(a); g["recoverTree"](r); check("recoverTree", level(r), exp)
g = load("design-a-stack-with-increment-operation"); st = g["CustomStack"](3)
check("CustomStack", ops(st, [("push",(1,)),("push",(2,)),("pop",()),("push",(2,)),("push",(3,)),("push",(4,)),("increment",(5,100)),("increment",(2,100)),("pop",()),("pop",()),("pop",()),("pop",())]), [None,None,2,None,None,None,None,None,103,202,201,-1])
g = load("maximum-binary-tree"); check("constructMaximumBinaryTree a", level(g["constructMaximumBinaryTree"]([3,2,1,6,0,5])), [6,3,5,None,2,0,None,None,1]); check("constructMaximumBinaryTree b", level(g["constructMaximumBinaryTree"]([3,2,1])), [3,None,2,None,1])
g = load("snapshot-array"); sa = g["SnapshotArray"](3)
check("SnapshotArray", ops(sa, [("set",(0,5)),("snap",()),("set",(0,6)),("get",(0,0)),("set",(1,2)),("snap",()),("get",(0,1)),("get",(1,0)),("get",(1,1)),("get",(2,1))]), [None,0,None,5,None,1,6,0,2,0])
g = load("complete-binary-tree-inserter"); cb = g["CBTInserter"](tree([1,2])); check("CBTInserter", ops(cb, [("insert",(3,)),("insert",(4,))]) + [level(cb.get_root())], [1,2,[1,2,3,4]])
g = load("add-one-row-to-tree"); check("addOneRow a", level(g["addOneRow"](tree([4,2,6,3,1,5]), 1, 2)), [4,1,1,2,None,None,6,3,1,5]); check("addOneRow b", level(g["addOneRow"](tree([4,2,None,3,1]), 1, 3)), [4,2,None,1,1,3,None,None,1]); check("addOneRow root", level(g["addOneRow"](tree([1]), 5, 1)), [5,1])
g = load("binary-search-tree-to-greater-sum-tree"); check("bstToGst a", level(g["bstToGst"](tree([4,1,6,0,2,5,7,None,None,None,3,None,None,None,8]))), [30,36,21,36,35,26,15,None,None,None,33,None,None,None,8]); check("bstToGst b", level(g["bstToGst"](tree([0,None,1]))), [1,None,1])
g = load("serialize-and-deserialize-bst"); c = g["Codec"]()
for a in ([2,1,3], [], [5,3,7,2,4,None,8]): check("Codec", level(c.deserialize(c.serialize(tree(a)))) if a else c.deserialize(c.serialize(None)), a if a else None)
print(f"{ok} passed, {fail} failed, {len(src)} solutions loaded")
sys.exit(1 if fail else 0)

"""Runs every hand-written Python solution against LeetCode's examples. Use: npm run check:solutions"""
import json, sys
from collections import deque
src = json.load(sys.stdin)
class TreeNode:
    def __init__(s, val=0, left=None, right=None): s.val, s.left, s.right = val, left, right
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
def find(r, v):
    if not r: return None
    if r.val == v: return r
    return find(r.left, v) or find(r.right, v)
def load(slug):
    g = {"TreeNode": TreeNode, "ListNode": ListNode}
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
print(f"{ok} passed, {fail} failed, {len(src)} solutions loaded")
sys.exit(1 if fail else 0)

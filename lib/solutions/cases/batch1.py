# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "3sum-with-multiplicity": [("threeSumMulti", ([1,1,2,2,3,3,4,4,5,5],8), 20), ("threeSumMulti", ([1,1,2,2,2,2],5), 12), ("threeSumMulti", ([2,1,3],6), 1), ("threeSumMulti", ([0,0,0],0), 1)],
 "minimum-domino-rotations-for-equal-row": [("minDominoRotations", ([2,1,2,4,2,2],[5,2,6,2,3,2]), 2), ("minDominoRotations", ([3,5,1,2,3],[3,6,3,3,4]), -1), ("minDominoRotations", ([1],[1]), 0)],
 "sort-the-students-by-their-kth-score": [("sortTheStudents", ([[10,6,9,1],[7,5,11,2],[4,8,3,15]],2), [[7,5,11,2],[10,6,9,1],[4,8,3,15]]), ("sortTheStudents", ([[3,4],[5,6]],0), [[5,6],[3,4]])],
 "minimum-absolute-sum-difference": [("minAbsoluteSumDiff", ([1,7,5],[2,3,5]), 3), ("minAbsoluteSumDiff", ([2,4,6,8,10],[2,4,6,8,10]), 0), ("minAbsoluteSumDiff", ([1,10,4,4,2,7],[9,3,5,1,7,4]), 20)],
 "find-k-pairs-with-smallest-sums": [("kSmallestPairs", ([1,7,11],[2,4,6],3), [[1,2],[1,4],[1,6]]), ("kSmallestPairs", ([1,1,2],[1,2,3],2), [[1,1],[1,1]]), ("kSmallestPairs", ([1],[3],1), [[1,3]])],
 "stone-game-vi": [("stoneGameVI", ([1,3],[2,1]), 1), ("stoneGameVI", ([1,2],[3,1]), 0), ("stoneGameVI", ([2,4,3],[1,6,7]), -1)],
 "minimum-increment-to-make-array-unique": [("minIncrementForUnique", ([1,2,2],), 1), ("minIncrementForUnique", ([3,2,1,2,1,7],), 6), ("minIncrementForUnique", ([0],), 0)],
 "jump-game-iii": [("canReach", ([4,2,3,0,3,1,2],5), True), ("canReach", ([4,2,3,0,3,1,2],0), True), ("canReach", ([3,0,2,1,2],2), False)],
 "find-right-interval": [("findRightInterval", ([[1,2]],), [-1]), ("findRightInterval", ([[3,4],[2,3],[1,2]],), [-1,0,1]), ("findRightInterval", ([[1,4],[2,3],[3,4]],), [-1,2,-1])],
 "minimum-limit-of-balls-in-a-bag": [("minimumSize", ([9],2), 3), ("minimumSize", ([2,4,8,2],4), 2), ("minimumSize", ([7,17],2), 7)],
 "minimum-suffix-flips": [("minFlips", ("10111",), 3), ("minFlips", ("101",), 3), ("minFlips", ("00000",), 0)],
 "find-kth-bit-in-nth-binary-string": [("findKthBit", (3,1), "0"), ("findKthBit", (4,11), "1"), ("findKthBit", (1,1), "0"), ("findKthBit", (3,6), "0")],
 "maximum-subarray-sum-with-length-divisible-by-k": [("maxSubarraySum", ([1,2],1), 3), ("maxSubarraySum", ([-1,-2,-3,-4,-5],4), -10), ("maxSubarraySum", ([-5,1,2,-3,4],2), 4)],
 "count-servers-that-communicate": [("countServers", ([[1,0],[0,1]],), 0), ("countServers", ([[1,0],[1,1]],), 3), ("countServers", ([[1,1,0,0],[0,0,1,0],[0,0,1,0],[0,0,0,1]],), 4)],
 "sum-of-beauty-of-all-substrings": [("beautySum", ("aabcb",), 5), ("beautySum", ("aabcbaa",), 17), ("beautySum", ("a",), 0)],
 "k-radius-subarray-averages": [("getAverages", ([7,4,3,9,1,8,5,2,6],3), [-1,-1,-1,5,4,4,-1,-1,-1]), ("getAverages", ([100000],0), [100000]), ("getAverages", ([8],100000), [-1])],
 "minimum-cost-to-convert-string-i": [("minimumCost", ("abcd","acbe",["a","b","c","c","e","d"],["b","c","b","e","b","e"],[2,5,5,1,2,20]), 28), ("minimumCost", ("aaaa","bbbb",["a","c"],["c","b"],[1,2]), 12), ("minimumCost", ("abcd","abce",["a"],["e"],[10000]), -1)],
 "maximum-number-of-integers-to-choose-from-a-range-i": [("maxCount", ([1,6,5],5,6), 2), ("maxCount", ([1,2,3,4,5,6,7],8,1), 0), ("maxCount", ([11],7,50), 7)],
 "find-the-longest-substring-containing-vowels-in-even-counts": [("findTheLongestSubstring", ("eleetminicoworoep",), 13), ("findTheLongestSubstring", ("leetcodeisgreat",), 5), ("findTheLongestSubstring", ("bcbcbc",), 6), ("findTheLongestSubstring", ("a",), 0)],
 "minimum-number-of-operations-to-make-all-array-elements-equal-to-1": [("minOperations", ([2,6,3,4],), 4), ("minOperations", ([2,10,6,14],), -1), ("minOperations", ([1,1,2],), 1)],
 "remove-all-occurrences-of-a-substring": [("removeOccurrences", ("daabcbaabcbc","abc"), "dab"), ("removeOccurrences", ("axxxxyyyyb","xy"), "ab"), ("removeOccurrences", ("aaa","b"), "aaa")],
 "divide-intervals-into-minimum-number-of-groups": [("minGroups", ([[5,10],[6,8],[1,5],[2,3],[1,10]],), 3), ("minGroups", ([[1,3],[5,6],[8,10],[11,13]],), 1), ("minGroups", ([[1,1]],), 1)],
 "frog-jump-ii": [("maxJump", ([0,2,5,6,7],), 5), ("maxJump", ([0,3,9],), 9), ("maxJump", ([0,1],), 1)],
 "minimum-absolute-difference-between-elements-with-constraint": [("minAbsoluteDifference", ([4,3,2,4],2), 0), ("minAbsoluteDifference", ([5,3,2,10,15],1), 1), ("minAbsoluteDifference", ([1,2,3,4],3), 3)],
 "maximum-area-of-a-piece-of-cake-after-horizontal-and-vertical-cuts": [("maxArea", (5,4,[1,2,4],[1,3]), 4), ("maxArea", (5,4,[3,1],[1]), 6), ("maxArea", (5,4,[3],[3]), 9)],
 "bag-of-tokens": [("bagOfTokensScore", ([100],50), 0), ("bagOfTokensScore", ([200,100],150), 1), ("bagOfTokensScore", ([100,200,300,400],200), 2), ("bagOfTokensScore", ([],10), 0)],
 "find-players-with-zero-or-one-losses": [("findWinners", ([[1,3],[2,3],[3,6],[5,6],[5,7],[4,5],[4,8],[4,9],[10,4],[10,9]],), [[1,2,10],[4,5,7,8]]), ("findWinners", ([[2,3],[1,3],[5,4],[6,4]],), [[1,2,5,6],[]])],
 "minimum-number-of-operations-to-make-array-empty": [("minOperations", ([2,3,3,2,2,4,2,3,4],), 4), ("minOperations", ([2,1,2,2,3,3],), -1), ("minOperations", ([5,5,5,5],), 2)],
 "queue-reconstruction-by-height": [("reconstructQueue", ([[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]],), [[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]), ("reconstructQueue", ([[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]],), [[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]])],
 "sort-the-matrix-diagonally": [("diagonalSort", ([[3,3,1,1],[2,2,1,2],[1,1,1,2]],), [[1,1,1,1],[1,2,2,2],[1,2,3,3]]), ("diagonalSort", ([[11,25,66,1,69,7],[23,55,17,45,15,52],[75,31,36,44,58,8],[22,27,33,25,68,4],[84,28,14,11,5,50]],), [[5,17,4,1,52,7],[11,11,25,45,8,69],[14,23,25,44,58,15],[22,27,31,36,50,66],[84,28,75,33,55,68]])],
 "minimum-number-of-pushes-to-type-word-ii": [("minimumPushes", ("abcde",), 5), ("minimumPushes", ("xyzxyzxyzxyz",), 12), ("minimumPushes", ("aabbccddeeffgghhiiiiii",), 24)],
 "smallest-string-with-swaps": [("smallestStringWithSwaps", ("dcab",[[0,3],[1,2]]), "bacd"), ("smallestStringWithSwaps", ("dcab",[[0,3],[1,2],[0,2]]), "abcd"), ("smallestStringWithSwaps", ("cba",[[0,1],[1,2]]), "abc"), ("smallestStringWithSwaps", ("ba",[]), "ba")],
 "matrix-block-sum": [("matrixBlockSum", ([[1,2,3],[4,5,6],[7,8,9]],1), [[12,21,16],[27,45,33],[24,39,28]]), ("matrixBlockSum", ([[1,2,3],[4,5,6],[7,8,9]],2), [[45,45,45],[45,45,45],[45,45,45]])],
 "filling-bookcase-shelves": [("minHeightShelves", ([[1,1],[2,3],[2,3],[1,1],[1,1],[1,1],[1,2]],4), 6), ("minHeightShelves", ([[1,3],[2,4],[3,2]],6), 4)],
 "number-of-submatrices-that-sum-to-target": [("numSubmatrixSumTarget", ([[0,1,0],[1,1,1],[0,1,0]],0), 4), ("numSubmatrixSumTarget", ([[1,-1],[-1,1]],0), 5), ("numSubmatrixSumTarget", ([[904]],0), 0)],
 "count-subarrays-where-max-element-appears-at-least-k-times": [("countSubarrays", ([1,3,2,3,3],2), 6), ("countSubarrays", ([1,4,2,1],3), 0), ("countSubarrays", ([5],1), 1)],
 "longest-substring-with-at-least-k-repeating-characters": [("longestSubstring", ("aaabb",3), 3), ("longestSubstring", ("ababbc",2), 5), ("longestSubstring", ("abc",2), 0)],
 "contiguous-array": [("findMaxLength", ([0,1],), 2), ("findMaxLength", ([0,1,0],), 2), ("findMaxLength", ([0,1,1,1,1,1,0,0,0],), 6), ("findMaxLength", ([0],), 0)],
 "minimum-number-of-operations-to-make-array-continuous": [("minOperations", ([4,2,5,3],), 0), ("minOperations", ([1,2,3,5,6],), 1), ("minOperations", ([1,10,100,1000],), 3), ("minOperations", ([8,5,9,9,8,4],), 2)],
 "robot-collisions": [("survivedRobotsHealths", ([5,4,3,2,1],[2,17,9,15,10],"RRRRR"), [2,17,9,15,10]), ("survivedRobotsHealths", ([3,5,2,6],[10,10,15,12],"RLRL"), [14]), ("survivedRobotsHealths", ([1,2,5,6],[10,10,11,11],"RLRL"), [])],
 "array-of-doubled-pairs": [("canReorderDoubled", ([3,1,3,6],), False), ("canReorderDoubled", ([2,1,2,6],), False), ("canReorderDoubled", ([4,-2,2,-4],), True), ("canReorderDoubled", ([0,0],), True)],
 "find-all-groups-of-farmland": [("findFarmland", ([[1,0,0],[0,1,1],[0,1,1]],), [[0,0,0,0],[1,1,2,2]]), ("findFarmland", ([[1,1],[1,1]],), [[0,0,1,1]]), ("findFarmland", ([[0]],), [])],
 "number-of-substrings-containing-all-three-characters": [("numberOfSubstrings", ("abcabc",), 10), ("numberOfSubstrings", ("aaacb",), 3), ("numberOfSubstrings", ("abc",), 1)],
 "minimum-number-of-operations-to-move-all-balls-to-each-box": [("minOperations", ("110",), [1,1,3]), ("minOperations", ("001011",), [11,8,5,4,3,4])],
 "kth-smallest-element-in-a-sorted-matrix": [("kthSmallest", ([[1,5,9],[10,11,13],[12,13,15]],8), 13), ("kthSmallest", ([[-5]],1), -5), ("kthSmallest", ([[1,2],[1,3]],2), 1)],
 "maximum-length-of-repeated-subarray": [("findLength", ([1,2,3,2,1],[3,2,1,4,7]), 3), ("findLength", ([0,0,0,0,0],[0,0,0,0,0]), 5), ("findLength", ([1],[2]), 0)],
 "jump-game-iv": [("minJumps", ([100,-23,-23,404,100,23,23,23,3,404],), 3), ("minJumps", ([7],), 0), ("minJumps", ([7,6,9,6,9,6,9,7],), 1)],
 "bitwise-and-of-numbers-range": [("rangeBitwiseAnd", (5,7), 4), ("rangeBitwiseAnd", (0,0), 0), ("rangeBitwiseAnd", (1,2147483647), 0)],
 "replace-words": [("replaceWords", (["cat","bat","rat"],"the cattle was rattled by the battery"), "the cat was rat by the bat"), ("replaceWords", (["a","b","c"],"aadsfasf absbs bbab cadsfafs"), "a a b c")],
 "minimize-xor": [("minimizeXor", (3,5), 3), ("minimizeXor", (1,12), 3), ("minimizeXor", (25,72), 24)],
 "remove-duplicate-letters": [("removeDuplicateLetters", ("bcabc",), "abc"), ("removeDuplicateLetters", ("cbacdcbc",), "acdb"), ("removeDuplicateLetters", ("a",), "a")],
 "satisfiability-of-equality-equations": [("equationsPossible", (["a==b","b!=a"],), False), ("equationsPossible", (["b==a","a==b"],), True), ("equationsPossible", (["a==b","b==c","a!=c"],), False), ("equationsPossible", (["a!=a"],), False)],
 "minimum-operations-to-make-a-uni-value-grid": [("minOperations", ([[2,4],[6,8]],2), 4), ("minOperations", ([[1,5],[2,3]],1), 5), ("minOperations", ([[1,2],[3,4]],2), -1)],
 "equal-sum-arrays-with-minimum-number-of-operations": [("minOperations", ([1,2,3,4,5,6],[1,1,2,2,2,2]), 3), ("minOperations", ([1,1,1,1,1,1,1],[6]), -1), ("minOperations", ([6,6],[1]), 3)],
 "best-time-to-buy-and-sell-stock-iii": [("maxProfit", ([3,3,5,0,0,3,1,4],), 6), ("maxProfit", ([1,2,3,4,5],), 4), ("maxProfit", ([7,6,4,3,1],), 0)],
 "maximize-happiness-of-selected-children": [("maximumHappinessSum", ([1,2,3],2), 4), ("maximumHappinessSum", ([1,1,1,1],2), 1), ("maximumHappinessSum", ([2,3,4,5],1), 5)],
}
TREE = {
 "binary-tree-coloring-game": [("btreeGameWinningMove", ([1,2,3,4,5,6,7,8,9,10,11],11,3), True, None), ("btreeGameWinningMove", ([1,2,3],3,1), False, None), ("btreeGameWinningMove", ([1,2,3],3,2), True, None)],
 "count-nodes-equal-to-average-of-subtree": [("averageOfSubtree", ([4,8,5,0,1,None,6],), 5, None), ("averageOfSubtree", ([1],), 1, None)],
}

def _structural(load, check, h):
    g = load("reverse-odd-levels-of-binary-tree")
    for a, exp in [([2,3,5,8,13,21,34], [2,5,3,8,13,21,34]), ([7,13,11], [7,11,13]), ([0,1,2,0,0,0,0,1,1,1,1,2,2,2,2], [0,2,1,0,0,0,0,2,2,2,2,1,1,1,1])]:
        check("reverseOddLevels", h.level(g["reverseOddLevels"](h.tree(a))), exp)
    g = load("maximum-split-of-positive-even-integers")
    for n, size in [(12, 3), (7, 0), (28, 4), (2, 1)]:
        out = g["maximumEvenSplit"](n)
        check(f"maximumEvenSplit {n}", (sum(out), len(out), all(x > 0 and x % 2 == 0 for x in out), len(set(out)) == len(out)), (0 if n % 2 else n, size, True, True))
    g = load("range-sum-query-mutable"); na = g["NumArray"]([1,3,5])
    check("NumArray", [na.sumRange(0,2), na.update(1,2), na.sumRange(0,2)], [9, None, 8])
    na = g["NumArray"]([7,2,7,2,0]); na.update(4,6); na.update(0,2); na.update(0,9)
    check("NumArray b", [na.sumRange(4,4), na.sumRange(0,4), na.sumRange(1,3)], [6, 26, 11])
    g = load("find-elements-in-a-contaminated-binary-tree")
    fe = g["FindElements"](h.tree([-1,None,-1])); check("FindElements a", [fe.find(1), fe.find(2)], [False, True])
    fe = g["FindElements"](h.tree([-1,-1,-1,-1,-1])); check("FindElements b", [fe.find(1), fe.find(3), fe.find(5)], [True, True, False])
    fe = g["FindElements"](h.tree([-1,None,-1,-1,None,-1])); check("FindElements c", [fe.find(2), fe.find(3), fe.find(4), fe.find(5)], [True, False, False, True])
    g = load("design-graph-with-shortest-path-calculator"); gr = g["Graph"](4, [[0,2,5],[0,1,2],[1,2,1],[3,0,3]])
    check("Graph", [gr.shortestPath(3,2), gr.shortestPath(0,3), gr.addEdge([1,3,4]), gr.shortestPath(0,3)], [6, -1, None, 6])
    class N:
        def __init__(s, val=0, left=None, right=None, next=None): s.val, s.left, s.right, s.next = val, left, right, next
    def build(a):
        t = h.tree(a)
        def conv(x): return N(x.val, conv(x.left), conv(x.right)) if x else None
        return conv(t)
    def serial(r):
        out, lead = [], r
        while lead:
            n = lead; lead = None
            while n:
                out.append(n.val)
                lead = lead or n.left or n.right
                n = n.next
            out.append("#")
        return out
    g = load("populating-next-right-pointers-in-each-node-ii")
    check("connect a", serial(g["connect"](build([1,2,3,4,5,None,7]))), [1,"#",2,3,"#",4,5,7,"#"])
    check("connect b", serial(g["connect"](build([1,2,3,4,None,None,5,6,None,None,7]))), [1,"#",2,3,"#",4,5,"#",6,7,"#"])
    check("connect empty", g["connect"](None), None)
    g = load("merge-in-between-linked-lists")
    check("mergeInBetween a", h.arr(g["mergeInBetween"](h.lst([10,1,13,6,9,5]), 3, 4, h.lst([1000000,1000001,1000002]))), [10,1,13,1000000,1000001,1000002,5])
    check("mergeInBetween b", h.arr(g["mergeInBetween"](h.lst([0,1,2,3,4,5,6]), 2, 5, h.lst([1000000,1000001,1000002,1000003,1000004]))), [0,1,1000000,1000001,1000002,1000003,1000004,6])
    g = load("game-of-life")
    for b, exp in [([[0,1,0],[0,0,1],[1,1,1],[0,0,0]], [[0,0,0],[1,0,1],[0,1,1],[0,1,0]]), ([[1,1],[1,0]], [[1,1],[1,1]])]:
        g["gameOfLife"](b); check("gameOfLife", b, exp)
    class NN:
        def __init__(s, val=None, children=None): s.val, s.children = val, children or []
    def nary(a):
        if not a: return None
        root = NN(a[0]); q, cur, i = [root], None, 2
        k = 0
        while i < len(a):
            parent = q[k]; k += 1
            while i < len(a) and a[i] is not None:
                c = NN(a[i]); parent.children.append(c); q.append(c); i += 1
            i += 1
        return root
    g = load("n-ary-tree-level-order-traversal")
    check("levelOrder a", g["levelOrder"](nary([1,None,3,2,4,None,5,6])), [[1],[3,2,4],[5,6]])
    check("levelOrder b", g["levelOrder"](nary([1,None,2,3,4,5,None,None,6,7,None,8,None,9,10,None,None,11,None,12,None,13,None,None,14])), [[1],[2,3,4,5],[6,7,8,9,10],[11,12,13],[14]])
    check("levelOrder empty", g["levelOrder"](None), [])
    g = load("smallest-subtree-with-all-the-deepest-nodes")
    for a, exp in [([3,5,1,6,2,0,8,None,None,7,4], [2,7,4]), ([1], [1]), ([0,1,3,None,2], [2])]:
        check("subtreeWithAllDeepest", h.level(g["subtreeWithAllDeepest"](h.tree(a))), exp)
    g = load("single-number-iii")
    for a, exp in [([1,2,1,3,2,5], [3,5]), ([-1,0], [-1,0]), ([0,1], [0,1])]:
        check("singleNumber", sorted(g["singleNumber"](a)), exp)
    g = load("my-calendar-i"); cal = g["MyCalendar"]()
    check("MyCalendar", [cal.book(10,20), cal.book(15,25), cal.book(20,30), cal.book(5,10), cal.book(9,11)], [True, False, True, True, False])
    g = load("distant-barcodes")
    for a in ([1,1,1,2,2,2], [1,1,1,1,2,2,3,3], [7]):
        out = g["rearrangeBarcodes"](a[:])
        check("rearrangeBarcodes", (sorted(out), all(x != y for x, y in zip(out, out[1:]))), (sorted(a), True))
CUSTOM = [_structural]

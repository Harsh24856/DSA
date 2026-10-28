# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "count-square-submatrices-with-all-ones": [("countSquares", ([[0,1,1,1],[1,1,1,1],[0,1,1,1]],), 15), ("countSquares", ([[1,0,1],[1,1,0],[1,1,0]],), 7), ("countSquares", ([[0]],), 0)],
 "count-subarrays-with-fixed-bounds": [("countSubarrays", ([1,3,5,2,7,5],1,5), 2), ("countSubarrays", ([1,1,1,1],1,1), 10), ("countSubarrays", ([2,3],1,5), 0)],
 "maximize-distance-to-closest-person": [("maxDistToClosest", ([1,0,0,0,1,0,1],), 2), ("maxDistToClosest", ([1,0,0,0],), 3), ("maxDistToClosest", ([0,1],), 1), ("maxDistToClosest", ([0,1,0,0,0,0,0,1,0,0],), 3)],
 "subarray-sums-divisible-by-k": [("subarraysDivByK", ([4,5,0,-2,-3,1],5), 7), ("subarraysDivByK", ([5],9), 0), ("subarraysDivByK", ([-1,2,9],2), 2)],
 "find-and-replace-pattern": [("findAndReplacePattern", (["abc","deq","mee","aqq","dkd","ccc"],"abb"), ["mee","aqq"]), ("findAndReplacePattern", (["a","b","c"],"a"), ["a","b","c"]), ("findAndReplacePattern", (["ab","aa"],"ab"), ["ab"])],
 "apply-operations-to-maximize-score": [("maximumScore", ([8,3,9,3,8],2), 81), ("maximumScore", ([19,12,14,6,10,18],3), 4788), ("maximumScore", ([1],1), 1)],
 "keys-and-rooms": [("canVisitAllRooms", ([[1],[2],[3],[]],), True), ("canVisitAllRooms", ([[1,3],[3,0,1],[2],[0]],), False), ("canVisitAllRooms", ([[]],), True)],
 "top-k-frequent-words": [("topKFrequent", (["i","love","leetcode","i","love","coding"],2), ["i","love"]), ("topKFrequent", (["the","day","is","sunny","the","the","the","sunny","is","is"],4), ["the","is","sunny","day"]), ("topKFrequent", (["b","a"],2), ["a","b"])],
 "number-of-flowers-in-full-bloom": [("fullBloomFlowers", ([[1,6],[3,7],[9,12],[4,13]],[2,3,7,11]), [1,2,2,2]), ("fullBloomFlowers", ([[1,10],[3,3]],[3,3,2]), [2,2,1]), ("fullBloomFlowers", ([[5,5]],[4,5,6]), [0,1,0])],
 "number-of-provinces": [("findCircleNum", ([[1,1,0],[1,1,0],[0,0,1]],), 2), ("findCircleNum", ([[1,0,0],[0,1,0],[0,0,1]],), 3), ("findCircleNum", ([[1]],), 1)],
 "maximum-xor-of-two-numbers-in-an-array": [("findMaximumXOR", ([3,10,5,25,2,8],), 28), ("findMaximumXOR", ([14,70,53,83,49,91,36,80,92,51,66,70],), 127), ("findMaximumXOR", ([0],), 0)],
 "minimum-number-of-refueling-stops": [("minRefuelStops", (1,1,[]), 0), ("minRefuelStops", (100,1,[[10,100]]), -1), ("minRefuelStops", (100,10,[[10,60],[20,30],[30,30],[60,40]]), 2)],
 "the-skyline-problem": [("getSkyline", ([[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]],), [[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]]), ("getSkyline", ([[0,2,3],[2,5,3]],), [[0,3],[5,0]]), ("getSkyline", ([[1,2,1],[1,2,2],[1,2,3]],), [[1,3],[2,0]])],
 "reverse-pairs": [("reversePairs", ([1,3,2,3,1],), 2), ("reversePairs", ([2,4,3,5,1],), 3), ("reversePairs", ([2147483647,2147483647,2147483647],), 0)],
 "sort-the-jumbled-numbers": [("sortJumbled", ([8,9,4,0,2,1,3,5,7,6],[991,338,38]), [338,38,991]), ("sortJumbled", ([0,1,2,3,4,5,6,7,8,9],[789,456,123]), [123,456,789]), ("sortJumbled", ([9,8,7,6,5,4,3,2,1,0],[0,9]), [9,0])],
 "maximum-width-ramp": [("maxWidthRamp", ([6,0,8,2,1,5],), 4), ("maxWidthRamp", ([9,8,1,0,1,9,4,0,4,1],), 7), ("maxWidthRamp", ([3,2,1],), 0)],
 "subarrays-with-k-different-integers": [("subarraysWithKDistinct", ([1,2,1,2,3],2), 7), ("subarraysWithKDistinct", ([1,2,1,3,4],3), 3), ("subarraysWithKDistinct", ([1],1), 1)],
 "diagonal-traverse-ii": [("findDiagonalOrder", ([[1,2,3],[4,5,6],[7,8,9]],), [1,4,2,7,5,3,8,6,9]), ("findDiagonalOrder", ([[1,2,3,4,5],[6,7],[8],[9,10,11],[12,13,14,15,16]],), [1,6,2,8,7,3,9,4,12,10,5,13,11,14,15,16]), ("findDiagonalOrder", ([[7]],), [7])],
 "count-number-of-bad-pairs": [("countBadPairs", ([4,1,3,3],), 5), ("countBadPairs", ([1,2,3,4,5],), 0), ("countBadPairs", ([1],), 0)],
 "minimum-number-of-arrows-to-burst-balloons": [("findMinArrowShots", ([[10,16],[2,8],[1,6],[7,12]],), 2), ("findMinArrowShots", ([[1,2],[3,4],[5,6],[7,8]],), 4), ("findMinArrowShots", ([[1,2],[2,3],[3,4],[4,5]],), 2), ("findMinArrowShots", ([[-2147483648,2147483647]],), 1)],
 "next-greater-element-ii": [("nextGreaterElements", ([1,2,1],), [2,-1,2]), ("nextGreaterElements", ([1,2,3,4,3],), [2,3,4,-1,4]), ("nextGreaterElements", ([5,5],), [-1,-1])],
 "redundant-connection-ii": [("findRedundantDirectedConnection", ([[1,2],[1,3],[2,3]],), [2,3]), ("findRedundantDirectedConnection", ([[1,2],[2,3],[3,4],[4,1],[1,5]],), [4,1]), ("findRedundantDirectedConnection", ([[2,1],[3,1],[4,2],[1,4]],), [2,1])],
 "find-all-people-with-secret": [("findAllPeople", (6,[[1,2,5],[2,3,8],[1,5,10]],1), [0,1,2,3,5]), ("findAllPeople", (4,[[3,1,3],[1,2,2],[0,3,3]],3), [0,1,3]), ("findAllPeople", (5,[[3,4,2],[1,2,1],[2,3,1]],1), [0,1,2,3,4]), ("findAllPeople", (6,[[1,2,5],[2,3,8],[1,5,10],[4,5,2]],1), [0,1,2,3,5])],
 "construct-k-palindrome-strings": [("canConstruct", ("annabelle",2), True), ("canConstruct", ("leetcode",3), False), ("canConstruct", ("true",4), True), ("canConstruct", ("ab",3), False)],
 "find-all-lonely-numbers-in-the-array": [("findLonely", ([10,6,5,8],), [10,8]), ("findLonely", ([1,3,5,3],), [1,5]), ("findLonely", ([7],), [7])],
 "sort-vowels-in-a-string": [("sortVowels", ("lEetcOde",), "lEOtcede"), ("sortVowels", ("lYmpH",), "lYmpH"), ("sortVowels", ("uoA",), "Aou")],
 "maximum-erasure-value": [("maximumUniqueSubarray", ([4,2,4,5,6],), 17), ("maximumUniqueSubarray", ([5,2,1,2,5,2,1,2,5],), 8), ("maximumUniqueSubarray", ([3],), 3)],
 "max-sum-of-a-pair-with-equal-sum-of-digits": [("maximumSum", ([18,43,36,13,7],), 54), ("maximumSum", ([10,12,19,14],), -1), ("maximumSum", ([9,18,90,1],), 108)],
 "count-of-smaller-numbers-after-self": [("countSmaller", ([5,2,6,1],), [2,1,1,0]), ("countSmaller", ([-1],), [0]), ("countSmaller", ([-1,-1],), [0,0])],
 "count-sorted-vowel-strings": [("countVowelStrings", (1,), 5), ("countVowelStrings", (2,), 15), ("countVowelStrings", (33,), 66045)],
 "basic-calculator": [("calculate", ("1 + 1",), 2), ("calculate", (" 2-1 + 2 ",), 3), ("calculate", ("(1+(4+5+2)-3)+(6+8)",), 23), ("calculate", ("-(2+3)",), -5), ("calculate", ("2147483647",), 2147483647)],
 "lexicographical-numbers": [("lexicalOrder", (13,), [1,10,11,12,13,2,3,4,5,6,7,8,9]), ("lexicalOrder", (2,), [1,2]), ("lexicalOrder", (1,), [1])],
 "max-number-of-k-sum-pairs": [("maxOperations", ([1,2,3,4],5), 2), ("maxOperations", ([3,1,3,4,3],6), 1), ("maxOperations", ([5],5), 0)],
 "append-characters-to-string-to-make-subsequence": [("appendCharacters", ("coaching","coding"), 4), ("appendCharacters", ("abcde","a"), 0), ("appendCharacters", ("z","abcde"), 5)],
 "minimum-operations-to-make-a-subsequence": [("minOperations", ([5,1,3],[9,4,2,3,4]), 2), ("minOperations", ([6,4,8,1,3,2],[4,7,6,2,3,8,6,1]), 3), ("minOperations", ([1],[2]), 1)],
 "longest-duplicate-substring": [("longestDupSubstring", ("banana",), "ana"), ("longestDupSubstring", ("abcd",), ""), ("longestDupSubstring", ("aa",), "a")],
 "smallest-subsequence-of-distinct-characters": [("smallestSubsequence", ("bcabc",), "abc"), ("smallestSubsequence", ("cbacdcbc",), "acdb"), ("smallestSubsequence", ("a",), "a")],
 "total-hamming-distance": [("totalHammingDistance", ([4,14,2],), 6), ("totalHammingDistance", ([4,14,4],), 4), ("totalHammingDistance", ([7],), 0)],
 "number-of-ways-to-arrive-at-destination": [("countPaths", (7,[[0,6,7],[0,1,2],[1,2,3],[1,3,3],[6,3,3],[3,5,1],[6,5,1],[2,5,1],[0,4,5],[4,6,2]]), 4), ("countPaths", (2,[[1,0,10]]), 1), ("countPaths", (1,[]), 1)],
 "unique-paths-iii": [("uniquePathsIII", ([[1,0,0,0],[0,0,0,0],[0,0,2,-1]],), 2), ("uniquePathsIII", ([[1,0,0,0],[0,0,0,0],[0,0,0,2]],), 4), ("uniquePathsIII", ([[0,1],[2,0]],), 0)],
 "maximum-number-of-events-that-can-be-attended": [("maxEvents", ([[1,2],[2,3],[3,4]],), 3), ("maxEvents", ([[1,2],[2,3],[3,4],[1,2]],), 4), ("maxEvents", ([[1,1],[1,1]],), 1)],
 "minimum-time-to-complete-trips": [("minimumTime", ([1,2,3],5), 3), ("minimumTime", ([2],1), 2), ("minimumTime", ([5,10,10],9), 25)],
 "score-after-flipping-matrix": [("matrixScore", ([[0,0,1,1],[1,0,1,0],[1,1,0,0]],), 39), ("matrixScore", ([[0]],), 1)],
 "reduction-operations-to-make-the-array-elements-equal": [("reductionOperations", ([5,1,3],), 3), ("reductionOperations", ([1,1,1],), 0), ("reductionOperations", ([1,1,2,2,3],), 4)],
 "cherry-pickup": [("cherryPickup", ([[0,1,-1],[1,0,-1],[1,1,1]],), 5), ("cherryPickup", ([[1,1,-1],[1,-1,1],[-1,1,1]],), 0), ("cherryPickup", ([[1]],), 1)],
 "3sum-closest": [("threeSumClosest", ([-1,2,1,-4],1), 2), ("threeSumClosest", ([0,0,0],1), 0), ("threeSumClosest", ([1,1,1,0],-100), 2)],
 "find-the-original-array-of-prefix-xor": [("findArray", ([5,2,0,3,1],), [5,7,2,3,2]), ("findArray", ([13],), [13])],
 "minimum-average-difference": [("minimumAverageDifference", ([2,5,3,9,5,3],), 3), ("minimumAverageDifference", ([0],), 0), ("minimumAverageDifference", ([4,2,0],), 2)],
 "find-longest-special-substring-that-occurs-thrice-i": [("maximumLength", ("aaaa",), 2), ("maximumLength", ("abcdef",), -1), ("maximumLength", ("abcaba",), 1), ("maximumLength", ("aaabaacaa",), 2)],
 "shortest-palindrome": [("shortestPalindrome", ("aacecaaa",), "aaacecaaa"), ("shortestPalindrome", ("abcd",), "dcbabcd"), ("shortestPalindrome", ("",), "")],
 "minimum-number-of-days-to-make-m-bouquets": [("minDays", ([1,10,3,10,2],3,1), 3), ("minDays", ([1,10,3,10,2],3,2), -1), ("minDays", ([7,7,7,7,12,7,7],2,3), 12)],
 "shortest-path-in-a-grid-with-obstacles-elimination": [("shortestPath", ([[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]],1), 6), ("shortestPath", ([[0,1,1],[1,1,1],[1,0,0]],1), -1), ("shortestPath", ([[0]],0), 0)],
 "range-sum-of-sorted-subarray-sums": [("rangeSum", ([1,2,3,4],4,1,5), 13), ("rangeSum", ([1,2,3,4],4,3,4), 6), ("rangeSum", ([1,2,3,4],4,1,10), 50)],
 "maximum-running-time-of-n-computers": [("maxRunTime", (2,[3,3,3]), 4), ("maxRunTime", (2,[1,1,1,1]), 2), ("maxRunTime", (1,[5]), 5)],
}
TREE = {
 "find-largest-value-in-each-tree-row": [("largestValues", ([1,3,2,5,3,None,9],), [1,3,9], None), ("largestValues", ([1,2,3],), [1,3], None), ("largestValues", ([],), [], None)],
 "binary-tree-cameras": [("minCameraCover", ([0,0,None,0,0],), 1, None), ("minCameraCover", ([0,0,None,0,None,0,None,None,0],), 2, None), ("minCameraCover", ([0],), 1, None)],
 "sum-of-nodes-with-even-valued-grandparent": [("sumEvenGrandparent", ([6,7,8,2,7,1,3,9,None,1,4,None,None,None,5],), 18, None), ("sumEvenGrandparent", ([1],), 0, None)],
 "even-odd-tree": [("isEvenOddTree", ([1,10,4,3,None,7,9,12,8,6,None,None,2],), True, None), ("isEvenOddTree", ([5,4,2,3,3,7],), False, None), ("isEvenOddTree", ([5,9,1,3,5,7],), False, None), ("isEvenOddTree", ([1],), True, None)],
}
CUSTOM = [
 lambda load, check, h: check("getAllElements", [load("all-elements-in-two-binary-search-trees")["getAllElements"](h.tree(a), h.tree(b)) for a, b in [([2,1,4],[1,0,3]), ([1,None,8],[8,1]), ([],[5])]], [[0,1,1,2,3,4], [1,1,8,8], [5]]),
 lambda load, check, h: check("MyCalendarTwo", (lambda c: [c.book(a, b) for a, b in [(10,20),(50,60),(10,40),(5,15),(5,10),(25,55)]])(load("my-calendar-ii")["MyCalendarTwo"]()), [True,True,True,False,True,True]),
 lambda load, check, h: check("flatten", [(lambda r: (load("flatten-binary-tree-to-linked-list")["flatten"](r), h.level(r))[1])(h.tree(a)) for a in ([1,2,5,3,4,None,6], [0])], [[1,None,2,None,3,None,4,None,5,None,6], [0]]),
 lambda load, check, h: check("addTwoNumbers", [h.arr(load("add-two-numbers-ii")["addTwoNumbers"](h.lst(a), h.lst(b))) for a, b in [([7,2,4,3],[5,6,4]), ([2,4,3],[5,6,4]), ([0],[0]), ([9,9],[1])]], [[7,8,0,7], [8,0,7], [0], [1,0,0]]),
 lambda load, check, h: check("MapSum", (lambda m: [m.insert("apple",3), m.sum("ap"), m.insert("app",2), m.sum("ap"), m.insert("apple",1), m.sum("ap"), m.sum("b")])(load("map-sum-pairs")["MapSum"]()), [None,3,None,5,None,3,0]),
 lambda load, check, h: check("criticalConnections", [sorted(map(sorted, load("critical-connections-in-a-network")["criticalConnections"](n, e))) for n, e in [(4,[[0,1],[1,2],[2,0],[1,3]]), (2,[[0,1]]), (3,[[0,1],[1,2],[2,0]])]], [[[1,3]], [[0,1]], []]),
 lambda load, check, h: check("createBinaryTree", [h.level(load("create-binary-tree-from-descriptions")["createBinaryTree"](d)) for d in ([[20,15,1],[20,17,0],[50,20,1],[50,80,0],[80,19,1]], [[1,2,1],[2,3,0],[3,4,1]])], [[50,20,80,15,17,19], [1,2,None,None,3,4]]),
 lambda load, check, h: check("detectCycle", [(lambda head, nodes, pos: (lambda r: None if r is None else nodes.index(r))(load("linked-list-cycle-ii")["detectCycle"](head)))(*_cyc(v, p)) for v, p in [([3,2,0,-4],1), ([1,2],0), ([1],-1)]], [1, 0, None]),
 lambda load, check, h: check("delNodes", [sorted((h.level(t) for t in load("delete-nodes-and-return-forest")["delNodes"](h.tree(a), d)), key=lambda x: x[0]) for a, d in [([1,2,3,4,5,6,7],[3,5]), ([1,2,4,None,3],[3]), ([1],[1])]], [[[1,2,None,4],[6],[7]], [[1,2,4]], []]),
 lambda load, check, h: check("palindromePairs", [sorted(load("palindrome-pairs")["palindromePairs"](w)) for w in (["abcd","dcba","lls","s","sssll"], ["bat","tab","cat"], ["a",""])], [[[0,1],[1,0],[2,4],[3,2]], [[0,1],[1,0]], [[0,1],[1,0]]]),
 lambda load, check, h: check("removeInvalidParentheses", [sorted(load("remove-invalid-parentheses")["removeInvalidParentheses"](x)) for x in ("()())()", "(a)())()", ")(")], [["(())()","()()()"], ["(a())()","(a)()()"], [""]]),
 lambda load, check, h: check("letterCasePermutation", [sorted(load("letter-case-permutation")["letterCasePermutation"](x)) for x in ("a1b2", "3z4", "1")], [sorted(["a1b2","a1B2","A1b2","A1B2"]), sorted(["3z4","3Z4"]), ["1"]]),
 lambda load, check, h: check("findMinHeightTrees", [sorted(load("minimum-height-trees")["findMinHeightTrees"](n, e)) for n, e in [(4,[[1,0],[1,2],[1,3]]), (6,[[3,0],[3,1],[3,2],[3,4],[5,4]]), (1,[]), (2,[[0,1]])]], [[1], [3,4], [0], [0,1]]),
]

def _cyc(vals, pos):
    nodes = []
    head = lst(vals); n = head
    while n: nodes.append(n); n = n.next
    if pos >= 0: nodes[-1].next = nodes[pos]
    return head, nodes, pos

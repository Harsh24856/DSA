# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "pascals-triangle": [("generate", (5,), [[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]), ("generate", (1,), [[1]])],
 "diagonal-traverse": [("findDiagonalOrder", ([[1,2,3],[4,5,6],[7,8,9]],), [1,2,4,7,5,3,6,8,9]), ("findDiagonalOrder", ([[1,2],[3,4]],), [1,2,3,4])],
 "next-greater-element-i": [("nextGreaterElement", ([4,1,2],[1,3,4,2]), [-1,3,-1]), ("nextGreaterElement", ([2,4],[1,2,3,4]), [3,-1])],
 "spiral-matrix": [("spiralOrder", ([[1,2,3],[4,5,6],[7,8,9]],), [1,2,3,6,9,8,7,4,5]), ("spiralOrder", ([[1,2,3,4],[5,6,7,8],[9,10,11,12]],), [1,2,3,4,8,12,11,10,9,5,6,7])],
 "roman-to-integer": [("romanToInt", ("III",), 3), ("romanToInt", ("LVIII",), 58), ("romanToInt", ("MCMXCIV",), 1994)],
 "count-and-say": [("countAndSay", (4,), "1211"), ("countAndSay", (1,), "1")],
 "reverse-words-in-a-string": [("reverseWords", ("the sky is blue",), "blue is sky the"), ("reverseWords", ("  hello world  ",), "world hello"), ("reverseWords", ("a good   example",), "example good a")],
 "subarray-sum-equals-k": [("subarraySum", ([1,1,1],2), 2), ("subarraySum", ([1,2,3],3), 2)],
 "product-of-array-except-self": [("productExceptSelf", ([1,2,3,4],), [24,12,8,6]), ("productExceptSelf", ([-1,1,0,-3,3],), [0,0,9,0,0])],
 "continuous-subarray-sum": [("checkSubarraySum", ([23,2,4,6,7],6), True), ("checkSubarraySum", ([23,2,6,4,7],6), True), ("checkSubarraySum", ([23,2,6,4,7],13), False)],
 "find-pivot-index": [("pivotIndex", ([1,7,3,6,5,6],), 3), ("pivotIndex", ([1,2,3],), -1), ("pivotIndex", ([2,1,-1],), 0)],
 "majority-element": [("majorityElement", ([3,2,3],), 3), ("majorityElement", ([2,2,1,1,1,2,2],), 2)],
 "contains-duplicate": [("containsDuplicate", ([1,2,3,1],), True), ("containsDuplicate", ([1,2,3,4],), False), ("containsDuplicate", ([1,1,1,3,3,4,3,2,4,2],), True)],
 "longest-consecutive-sequence": [("longestConsecutive", ([100,4,200,1,3,2],), 4), ("longestConsecutive", ([0,3,7,2,5,8,4,6,0,1],), 9), ("longestConsecutive", ([1,0,1,2],), 3)],
 "two-sum": [("twoSum", ([2,7,11,15],9), [0,1]), ("twoSum", ([3,2,4],6), [1,2]), ("twoSum", ([3,3],6), [0,1])],
 "container-with-most-water": [("maxArea", ([1,8,6,2,5,4,8,3,7],), 49), ("maxArea", ([1,1],), 1)],
 "3sum": [("threeSum", ([-1,0,1,2,-1,-4],), [[-1,-1,2],[-1,0,1]]), ("threeSum", ([0,1,1],), []), ("threeSum", ([0,0,0],), [[0,0,0]])],
 "trapping-rain-water": [("trap", ([0,1,0,2,1,0,1,3,2,1,2,1],), 6), ("trap", ([4,2,0,3,2,5],), 9)],
 "valid-palindrome": [("isPalindrome", ("A man, a plan, a canal: Panama",), True), ("isPalindrome", ("race a car",), False), ("isPalindrome", (" ",), True)],
 "maximum-average-subarray-i": [("findMaxAverage", ([1,12,-5,-6,50,3],4), 12.75), ("findMaxAverage", ([5],1), 5.0)],
 "minimum-size-subarray-sum": [("minSubArrayLen", (7,[2,3,1,2,4,3]), 2), ("minSubArrayLen", (4,[1,4,4]), 1), ("minSubArrayLen", (11,[1,1,1,1,1,1,1,1]), 0)],
 "longest-substring-without-repeating-characters": [("lengthOfLongestSubstring", ("abcabcbb",), 3), ("lengthOfLongestSubstring", ("bbbbb",), 1), ("lengthOfLongestSubstring", ("pwwkew",), 3), ("lengthOfLongestSubstring", ("abba",), 2)],
 "sliding-window-maximum": [("maxSlidingWindow", ([1,3,-1,-3,5,3,6,7],3), [3,3,5,5,6,7]), ("maxSlidingWindow", ([1],1), [1])],
 "fruit-into-baskets": [("totalFruit", ([1,2,1],), 3), ("totalFruit", ([0,1,2,2],), 3), ("totalFruit", ([1,2,3,2,2],), 4)],
 "best-time-to-buy-and-sell-stock": [("maxProfit", ([7,1,5,3,6,4],), 5), ("maxProfit", ([7,6,4,3,1],), 0)],
 "maximum-subarray": [("maxSubArray", ([-2,1,-3,4,-1,2,1,-5,4],), 6), ("maxSubArray", ([1],), 1), ("maxSubArray", ([5,4,-1,7,8],), 23)],
 "maximum-product-subarray": [("maxProduct", ([2,3,-2,4],), 6), ("maxProduct", ([-2,0,-1],), 0), ("maxProduct", ([-2,3,-4],), 24)],
 "maximum-sum-circular-subarray": [("maxSubarraySumCircular", ([1,-2,3,-2],), 3), ("maxSubarraySumCircular", ([5,-3,5],), 10), ("maxSubarraySumCircular", ([-3,-2,-3],), -2)],
 "find-the-duplicate-number": [("findDuplicate", ([1,3,4,2,2],), 2), ("findDuplicate", ([3,1,3,4,2],), 3), ("findDuplicate", ([3,3,3,3,3],), 3)],
 "first-missing-positive": [("firstMissingPositive", ([1,2,0],), 3), ("firstMissingPositive", ([3,4,-1,1],), 2), ("firstMissingPositive", ([7,8,9,11,12],), 1)],
 "find-all-numbers-disappeared-in-an-array": [("findDisappearedNumbers", ([4,3,2,7,8,2,3,1],), [5,6]), ("findDisappearedNumbers", ([1,1],), [2])],
 "plus-one": [("plusOne", ([1,2,3],), [1,2,4]), ("plusOne", ([4,3,2,1],), [4,3,2,2]), ("plusOne", ([9],), [1,0])],
 "summary-ranges": [("summaryRanges", ([0,1,2,4,5,7],), ["0->2","4->5","7"]), ("summaryRanges", ([0,2,3,4,6,8,9],), ["0","2->4","6","8->9"])],
 "merge-intervals": [("merge", ([[1,3],[2,6],[8,10],[15,18]],), [[1,6],[8,10],[15,18]]), ("merge", ([[1,4],[4,5]],), [[1,5]]), ("merge", ([[4,7],[1,4]],), [[1,7]])],
 "insert-interval": [("insert", ([[1,3],[6,9]],[2,5]), [[1,5],[6,9]]), ("insert", ([[1,2],[3,5],[6,7],[8,10],[12,16]],[4,8]), [[1,2],[3,10],[12,16]]), ("insert", ([],[5,7]), [[5,7]])],
 "non-overlapping-intervals": [("eraseOverlapIntervals", ([[1,2],[2,3],[3,4],[1,3]],), 1), ("eraseOverlapIntervals", ([[1,2],[1,2],[1,2]],), 2), ("eraseOverlapIntervals", ([[1,2],[2,3]],), 0)],
 "search-insert-position": [("searchInsert", ([1,3,5,6],5), 2), ("searchInsert", ([1,3,5,6],2), 1), ("searchInsert", ([1,3,5,6],7), 4)],
 "binary-search": [("search", ([-1,0,3,5,9,12],9), 4), ("search", ([-1,0,3,5,9,12],2), -1)],
 "find-first-and-last-position-of-element-in-sorted-array": [("searchRange", ([5,7,7,8,8,10],8), [3,4]), ("searchRange", ([5,7,7,8,8,10],6), [-1,-1]), ("searchRange", ([],0), [-1,-1])],
 "search-in-rotated-sorted-array": [("search", ([4,5,6,7,0,1,2],0), 4), ("search", ([4,5,6,7,0,1,2],3), -1), ("search", ([1],0), -1)],
 "find-minimum-in-rotated-sorted-array": [("findMin", ([3,4,5,1,2],), 1), ("findMin", ([4,5,6,7,0,1,2],), 0), ("findMin", ([11,13,15,17],), 11)],
 "koko-eating-bananas": [("minEatingSpeed", ([3,6,7,11],8), 4), ("minEatingSpeed", ([30,11,23,4,20],5), 30), ("minEatingSpeed", ([30,11,23,4,20],6), 23)],
 "find-peak-element": [("findPeakElement", ([1,2,3,1],), 2), ("findPeakElement", ([1,2,1,3,5,6,4],), 5)],
 "find-k-closest-elements": [("findClosestElements", ([1,2,3,4,5],4,3), [1,2,3,4]), ("findClosestElements", ([1,1,2,3,4,5],4,-1), [1,1,2,3])],
 "sort-integers-by-the-number-of-1-bits": [("sortByBits", ([0,1,2,3,4,5,6,7,8],), [0,1,2,4,8,3,5,6,7]), ("sortByBits", ([1024,512,256,128,64,32,16,8,4,2,1],), [1,2,4,8,16,32,64,128,256,512,1024])],
 "largest-number": [("largestNumber", ([10,2],), "210"), ("largestNumber", ([3,30,34,5,9],), "9534330"), ("largestNumber", ([0,0],), "0")],
 "reorder-data-in-log-files": [("reorderLogFiles", (["dig1 8 1 5 1","let1 art can","dig2 3 6","let2 own kit dig","let3 art zero"],), ["let1 art can","let3 art zero","let2 own kit dig","dig1 8 1 5 1","dig2 3 6"]), ("reorderLogFiles", (["a1 9 2 3 1","g1 act car","zo4 4 7","ab1 off key dog","a8 act zoo"],), ["g1 act car","a8 act zoo","ab1 off key dog","a1 9 2 3 1","zo4 4 7"])],
 "sort-an-array": [("sortArray", ([5,2,3,1],), [1,2,3,5]), ("sortArray", ([5,1,1,2,0,0],), [0,0,1,1,2,5])],
 "kth-largest-element-in-an-array": [("findKthLargest", ([3,2,1,5,6,4],2), 5), ("findKthLargest", ([3,2,3,1,2,4,5,5,6],4), 4)],
 "check-if-all-the-integers-in-a-range-are-covered": [("isCovered", ([[1,2],[3,4],[5,6]],2,5), True), ("isCovered", ([[1,10],[10,20]],21,21), False)],
 "corporate-flight-bookings": [("corpFlightBookings", ([[1,2,10],[2,3,20],[2,5,25]],5), [10,55,45,25,25]), ("corpFlightBookings", ([[1,2,10],[2,2,15]],2), [10,25])],
 "car-pooling": [("carPooling", ([[2,1,5],[3,3,7]],4), False), ("carPooling", ([[2,1,5],[3,3,7]],5), True)],
 "shifting-letters-ii": [("shiftingLetters", ("abc",[[0,1,0],[1,2,1],[0,2,1]]), "ace"), ("shiftingLetters", ("dztz",[[0,0,0],[1,1,1]]), "catz")],
}
TREE = {
 "binary-tree-preorder-traversal": [("preorderTraversal", ([1,None,2,3],), [1,2,3], None), ("preorderTraversal", ([1,2,3,4,5,None,8,None,None,6,7,9],), [1,2,4,5,6,7,3,8,9], None), ("preorderTraversal", ([],), [], None)],
 "binary-tree-inorder-traversal": [("inorderTraversal", ([1,None,2,3],), [1,3,2], None), ("inorderTraversal", ([1,2,3,4,5,None,8,None,None,6,7,9],), [4,2,6,5,7,1,3,9,8], None), ("inorderTraversal", ([],), [], None)],
 "binary-tree-level-order-traversal": [("levelOrder", ([3,9,20,None,None,15,7],), [[3],[9,20],[15,7]], None), ("levelOrder", ([1],), [[1]], None), ("levelOrder", ([],), [], None)],
 "minimum-depth-of-binary-tree": [("minDepth", ([3,9,20,None,None,15,7],), 2, None), ("minDepth", ([2,None,3,None,4,None,5,None,6],), 5, None)],
 "maximum-depth-of-binary-tree": [("maxDepth", ([3,9,20,None,None,15,7],), 3, None), ("maxDepth", ([1,None,2],), 2, None)],
 "diameter-of-binary-tree": [("diameterOfBinaryTree", ([1,2,3,4,5],), 3, None), ("diameterOfBinaryTree", ([1,2],), 1, None)],
 "balanced-binary-tree": [("isBalanced", ([3,9,20,None,None,15,7],), True, None), ("isBalanced", ([1,2,2,3,3,None,None,4,4],), False, None), ("isBalanced", ([],), True, None)],
 "symmetric-tree": [("isSymmetric", ([1,2,2,3,4,4,3],), True, None), ("isSymmetric", ([1,2,2,None,3,None,3],), False, None)],
 "binary-tree-maximum-path-sum": [("maxPathSum", ([1,2,3],), 6, None), ("maxPathSum", ([-10,9,20,None,None,15,7],), 42, None), ("maxPathSum", ([-3],), -3, None)],
 "binary-tree-right-side-view": [("rightSideView", ([1,2,3,None,5,None,4],), [1,3,4], None), ("rightSideView", ([1,2,3,4,None,None,None,5],), [1,3,4,5], None), ("rightSideView", ([1,None,3],), [1,3], None), ("rightSideView", ([],), [], None)],
 "binary-tree-zigzag-level-order-traversal": [("zigzagLevelOrder", ([3,9,20,None,None,15,7],), [[3],[20,9],[15,7]], None), ("zigzagLevelOrder", ([1],), [[1]], None), ("zigzagLevelOrder", ([],), [], None)],
}
import copy

def _inplace(slug, fn, cases):
    """In-place answers: call, then compare the mutated first argument."""
    def run(load, check, h):
        g = load(slug)
        for args, exp in cases:
            args = copy.deepcopy(list(args))
            g[fn](*args); check(f"{slug} {args[0]!s:.40}", args[0], exp)
    return run

def _numarray(load, check, h):
    g = load("range-sum-query-immutable")
    a = g["NumArray"]([-2,0,3,-5,2,-1]); check("NumArray ex1", [a.sumRange(0,2), a.sumRange(2,5), a.sumRange(0,5)], [1,-1,-3])
    b = g["NumArray"]([5]); check("NumArray single", b.sumRange(0,0), 5)

CUSTOM = [
 _inplace("set-matrix-zeroes", "setZeroes", [(([[1,1,1],[1,0,1],[1,1,1]],), [[1,0,1],[0,0,0],[1,0,1]]), (([[0,1,2,0],[3,4,5,2],[1,3,1,5]],), [[0,0,0,0],[0,4,5,0],[0,3,1,0]])]),
 _inplace("rotate-image", "rotate", [(([[1,2,3],[4,5,6],[7,8,9]],), [[7,4,1],[8,5,2],[9,6,3]]), (([[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]],), [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]])]),
 _numarray,
 lambda load, check, h: [check("isSameTree", load("same-tree")["isSameTree"](h.tree(p), h.tree(q)), e) for p, q, e in [([1,2,3],[1,2,3],True), ([1,2],[1,None,2],False), ([1,2,1],[1,1,2],False)]],
 lambda load, check, h: [check("isSubtree", load("subtree-of-another-tree")["isSubtree"](h.tree(r), h.tree(s)), e) for r, s, e in [([3,4,5,1,2],[4,1,2],True), ([3,4,5,1,2,None,None,None,None,0],[4,1,2],False)]],
 lambda load, check, h: [check("invertTree", h.level(load("invert-binary-tree")["invertTree"](h.tree(a))), e) for a, e in [([4,2,7,1,3,6,9],[4,7,2,9,6,3,1]), ([2,1,3],[2,3,1]), ([],[])]],
 lambda load, check, h: [check("topKFrequent", sorted(load("top-k-frequent-elements")["topKFrequent"](a, k)), e) for a, k, e in [([1,1,1,2,2,3],2,[1,2]), ([1],1,[1]), ([1,2,1,2,1,2,3,1,3,2],2,[1,2])]],
 lambda load, check, h: [check("sortList", h.arr(load("sort-list")["sortList"](h.lst(a))), sorted(a)) for a in ([4,2,1,3], [-1,5,3,4,0], [])],
 lambda load, check, h: [check("kClosest", sorted(load("k-closest-points-to-origin")["kClosest"](p, k)), e) for p, k, e in [([[1,3],[-2,2]],1,[[-2,2]]), ([[3,3],[5,-1],[-2,4]],2,[[-2,4],[3,3]])]],
 _inplace("move-zeroes", "moveZeroes", [(([0,1,0,3,12],), [1,3,12,0,0]), (([0],), [0])]),
 _inplace("sort-colors", "sortColors", [(([2,0,2,1,1,0],), [0,0,1,1,2,2]), (([2,0,1],), [0,1,2])]),
 _inplace("rotate-array", "rotate", [(([1,2,3,4,5,6,7],3), [5,6,7,1,2,3,4]), (([-1,-100,3,99],2), [3,99,-1,-100])]),
 _inplace("next-permutation", "nextPermutation", [(([1,2,3],), [1,3,2]), (([3,2,1],), [1,2,3]), (([1,1,5],), [1,5,1]), (([2,4,7,6,3,1],), [2,6,1,3,4,7])]),
 lambda load, check, h: (lambda m: check("NumMatrix ex1", [m.sumRegion(2,1,4,3), m.sumRegion(1,1,2,2), m.sumRegion(1,2,2,4)], [8,11,12]))(load("range-sum-query-2d-immutable")["NumMatrix"]([[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]])),
 lambda load, check, h: (lambda m: check("NumMatrix 1x1", m.sumRegion(0,0,0,0), -4))(load("range-sum-query-2d-immutable")["NumMatrix"]([[-4]])),
]

# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {}
TREE = {
 "maximum-width-of-binary-tree": [("widthOfBinaryTree", ([1,3,2,5,3,None,9],), 4, None), ("widthOfBinaryTree", ([1,3,2,5,None,None,9,6,None,7],), 7, None), ("widthOfBinaryTree", ([1,3,2,5],), 2, None)],
 "average-of-levels-in-binary-tree": [("averageOfLevels", ([3,9,20,None,None,15,7],), [3.0,14.5,11.0], None), ("averageOfLevels", ([3,9,20,15,7],), [3.0,14.5,11.0], None)],
 "vertical-order-traversal-of-a-binary-tree": [("verticalTraversal", ([3,9,20,None,None,15,7],), [[9],[3,15],[20],[7]], None), ("verticalTraversal", ([1,2,3,4,5,6,7],), [[4],[2],[1,5,6],[3],[7]], None), ("verticalTraversal", ([1,2,3,4,6,5,7],), [[4],[2],[1,5,6],[3],[7]], None)],
 "binary-tree-paths": [("binaryTreePaths", ([1,2,3,None,5],), ["1->2->5","1->3"], None), ("binaryTreePaths", ([1],), ["1"], None)],
 "path-sum": [("hasPathSum", ([5,4,8,11,None,13,4,7,2,None,None,None,1], 22), True, None), ("hasPathSum", ([1,2,3], 5), False, None), ("hasPathSum", ([], 0), False, None)],
}

def _next_right(load, check, h):
    class N:
        def __init__(s, val, left=None, right=None): s.val, s.left, s.right, s.next = val, left, right, None
    def perfect(a, i=0): return N(a[i], perfect(a, 2 * i + 1), perfect(a, 2 * i + 2)) if i < len(a) else None
    f = load("populating-next-right-pointers-in-each-node")["connect"]
    r = f(perfect([1,2,3,4,5,6,7])); out, row = [], r
    while row:
        n = row
        while n: out.append(n.val); n = n.next
        out.append("#"); row = row.left
    check("connect", out, [1,"#",2,3,"#",4,5,6,7,"#"]); check("connect empty", f(None), None)

def _build(load, check, h):
    f = load("construct-binary-tree-from-preorder-and-inorder-traversal")["buildTree"]
    check("buildTree pre/in", h.level(f([3,9,20,15,7],[9,3,15,20,7])), [3,9,20,None,None,15,7]); check("buildTree pre/in single", h.level(f([-1],[-1])), [-1])
    g = load("construct-binary-tree-from-inorder-and-postorder-traversal")["buildTree"]
    check("buildTree in/post", h.level(g([9,3,15,20,7],[9,15,7,20,3])), [3,9,20,None,None,15,7]); check("buildTree in/post single", h.level(g([-1],[-1])), [-1])

def _codec(load, check, h):
    c = load("serialize-and-deserialize-binary-tree")["Codec"]()
    for a in ([1,2,3,None,None,4,5], [], [1,None,2,None,3]):
        r = c.deserialize(c.serialize(h.tree(a))); check("Codec " + str(a), h.level(r) if r else [], a)

def _sorted_bst(load, check, h):
    f = load("convert-sorted-array-to-binary-search-tree")["sortedArrayToBST"]
    for a in ([-10,-3,0,5,9], [1,3]):
        r = f(a); check("sortedArrayToBST " + str(a), (h.inorder(r), h.balanced(r)), (a, True))

CUSTOM = [_next_right, _build, _codec, _sorted_bst]

TREE.update({
 "validate-binary-search-tree": [("isValidBST", ([2,1,3],), True, None), ("isValidBST", ([5,1,4,None,None,3,6],), False, None), ("isValidBST", ([5,4,6,None,None,3,7],), False, None)],
 "kth-smallest-element-in-a-bst": [("kthSmallest", ([3,1,4,None,2], 1), 1, None), ("kthSmallest", ([5,3,6,2,4,None,None,1], 3), 3, None)],
 "two-sum-iv-input-is-a-bst": [("findTarget", ([5,3,6,2,4,None,7], 9), True, None), ("findTarget", ([5,3,6,2,4,None,7], 28), False, None)],
})

def _bst(load, check, h):
    f = load("lowest-common-ancestor-of-a-binary-search-tree")["lowestCommonAncestor"]
    for p, q, exp in [(2, 8, 6), (2, 4, 2), (3, 5, 4)]:
        r = h.tree([6,2,8,0,4,7,9,None,None,3,5]); check("lcaBST", f(r, h.find(r, p), h.find(r, q)).val, exp)
    r = h.tree([2,1]); check("lcaBST b", f(r, h.find(r, 2), h.find(r, 1)).val, 2)
    f = load("insert-into-a-binary-search-tree")["insertIntoBST"]
    check("insertIntoBST a", h.level(f(h.tree([4,2,7,1,3]), 5)), [4,2,7,1,3,5]); check("insertIntoBST b", h.level(f(h.tree([40,20,60,10,30,50,70]), 25)), [40,20,60,10,30,50,70,None,None,25]); check("insertIntoBST empty", h.level(f(None, 5)), [5])
    f = load("delete-node-in-a-bst")["deleteNode"]
    check("deleteNode a", h.level(f(h.tree([5,3,6,2,4,None,7]), 3)), [5,4,6,2,None,None,7]); check("deleteNode b", h.level(f(h.tree([5,3,6,2,4,None,7]), 0)), [5,3,6,2,4,None,7]); check("deleteNode c", f(None, 0), None)
    it = load("binary-search-tree-iterator")["BSTIterator"](h.tree([7,3,15,None,None,9,20]))
    check("BSTIterator", [getattr(it, c)() for c in ["next","next","hasNext","next","hasNext","next","hasNext","next","hasNext"]], [3,7,True,9,True,15,True,20,False])
    f = load("trim-a-binary-search-tree")["trimBST"]
    check("trimBST a", h.level(f(h.tree([1,0,2]), 1, 2)), [1,None,2]); check("trimBST b", h.level(f(h.tree([3,0,4,None,2,None,None,1]), 1, 3)), [3,2,None,1])
    f = load("convert-bst-to-greater-tree")["convertBST"]
    check("convertBST a", h.level(f(h.tree([4,1,6,0,2,5,7,None,None,None,3,None,None,None,8]))), [30,36,21,36,35,26,15,None,None,None,33,None,None,None,8]); check("convertBST b", h.level(f(h.tree([0,None,1]))), [1,None,1])

CUSTOM.append(_bst)

CASES.update({
 "number-of-1-bits": [("hammingWeight", (11,), 3), ("hammingWeight", (128,), 1), ("hammingWeight", (2147483645,), 30)],
 "counting-bits": [("countBits", (2,), [0,1,1]), ("countBits", (5,), [0,1,1,2,1,2])],
 "add-binary": [("addBinary", ("11","1"), "100"), ("addBinary", ("1010","1011"), "10101"), ("addBinary", ("0","0"), "0")],
 "hamming-distance": [("hammingDistance", (1,4), 2), ("hammingDistance", (3,1), 1)],
 "reverse-bits": [("reverseBits", (43261596,), 964176192), ("reverseBits", (2147483644,), 1073741822)],
 "single-number": [("singleNumber", ([2,2,1],), 1), ("singleNumber", ([4,1,2,1,2],), 4), ("singleNumber", ([1],), 1)],
 "missing-number": [("missingNumber", ([3,0,1],), 2), ("missingNumber", ([0,1],), 2), ("missingNumber", ([9,6,4,2,3,5,7,0,1],), 8)],
 "find-the-difference": [("findTheDifference", ("abcd","abcde"), "e"), ("findTheDifference", ("","y"), "y")],
 "subsets": [("subsets", ([1,2,3],), [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]), ("subsets", ([0],), [[],[0]])],
 "partition-to-k-equal-sum-subsets": [("canPartitionKSubsets", ([4,3,2,3,5,2,1],4), True), ("canPartitionKSubsets", ([1,2,3,4],3), False), ("canPartitionKSubsets", ([2,2,2,2,3,4,5],4), False)],
})

CASES.update({
 "repeated-dna-sequences": [("findRepeatedDnaSequences", ("AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT",), ["AAAAACCCCC","CCCCCAAAAA"]), ("findRepeatedDnaSequences", ("AAAAAAAAAAAAA",), ["AAAAAAAAAA"])],
 "maximum-length-of-a-concatenated-string-with-unique-characters": [("maxLength", (["un","iq","ue"],), 4), ("maxLength", (["cha","r","act","ers"],), 6), ("maxLength", (["abcdefghijklmnopqrstuvwxyz"],), 26), ("maxLength", (["aa","bb"],), 0)],
 "power-of-two": [("isPowerOfTwo", (1,), True), ("isPowerOfTwo", (16,), True), ("isPowerOfTwo", (3,), False), ("isPowerOfTwo", (0,), False)],
 "power-of-four": [("isPowerOfFour", (16,), True), ("isPowerOfFour", (5,), False), ("isPowerOfFour", (1,), True), ("isPowerOfFour", (8,), False)],
 "sum-of-two-integers": [("getSum", (1,2), 3), ("getSum", (2,3), 5), ("getSum", (-1,1), 0), ("getSum", (-2,-3), -5), ("getSum", (-12,5), -7)],
 "power-of-three": [("isPowerOfThree", (27,), True), ("isPowerOfThree", (0,), False), ("isPowerOfThree", (-1,), False), ("isPowerOfThree", (45,), False)],
 "divide-two-integers": [("divide", (10,3), 3), ("divide", (7,-3), -2), ("divide", (-2147483648,-1), 2147483647), ("divide", (-2147483648,1), -2147483648)],
 "xor-queries-of-a-subarray": [("xorQueries", ([1,3,4,8],[[0,1],[1,2],[0,3],[3,3]]), [2,7,14,8]), ("xorQueries", ([4,8,2,10],[[2,3],[1,3],[0,0],[0,3]]), [8,0,4,4])],
 "decode-xored-permutation": [("decode", ([3,1],), [1,2,3]), ("decode", ([6,5,4,6],), [2,4,1,5,3])],
 "find-greatest-common-divisor-of-array": [("findGCD", ([2,5,6,9,10],), 2), ("findGCD", ([7,5,6,8,3],), 1), ("findGCD", ([3,3],), 3)],
})

CASES.update({
 "x-of-a-kind-in-a-deck-of-cards": [("hasGroupsSizeX", ([1,2,3,4,4,3,2,1],), True), ("hasGroupsSizeX", ([1,1,1,2,2,2,3,3],), False), ("hasGroupsSizeX", ([1],), False)],
 "greatest-common-divisor-of-strings": [("gcdOfStrings", ("ABCABC","ABC"), "ABC"), ("gcdOfStrings", ("ABABAB","ABAB"), "AB"), ("gcdOfStrings", ("LEET","CODE"), "")],
 "count-primes": [("countPrimes", (10,), 4), ("countPrimes", (0,), 0), ("countPrimes", (1,), 0), ("countPrimes", (3,), 1)],
 "prime-arrangements": [("numPrimeArrangements", (5,), 12), ("numPrimeArrangements", (100,), 682289015)],
 "prime-number-of-set-bits-in-binary-representation": [("countPrimeSetBits", (6,10), 4), ("countPrimeSetBits", (10,15), 5)],
 "powx-n": [("myPow", (2.0,10), 1024.0), ("myPow", (2.1,3), 9.261), ("myPow", (2.0,-2), 0.25)],
 "super-pow": [("superPow", (2,[3]), 8), ("superPow", (2,[1,0]), 1024), ("superPow", (1,[4,3,3,8,5,2]), 1), ("superPow", (2147483647,[2,0,0]), 1198)],
 "xor-operation-in-an-array": [("xorOperation", (5,0), 8), ("xorOperation", (4,3), 8)],
 "count-good-numbers": [("countGoodNumbers", (1,), 5), ("countGoodNumbers", (4,), 400), ("countGoodNumbers", (50,), 564908303)],
 "palindrome-number": [("isPalindrome", (121,), True), ("isPalindrome", (-121,), False), ("isPalindrome", (10,), False), ("isPalindrome", (0,), True)],
})

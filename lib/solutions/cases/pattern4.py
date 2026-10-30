# Example cases for this batch, merged into solutions_test.py.
# CASES[slug] = [(function_name, (args...), expected), ...]   (callables in args are called first, e.g. lambda: lst([1,2]))
# TREE[slug]  = [(function_name, (level_order_list, *more_args), expected, post_or_None), ...]
# CUSTOM = [lambda load, check, h: ...]  for structural checks; h has tree, lst, arr, level, inorder, balanced, find
CASES = {
 "minimum-interval-to-include-each-query": [("minInterval", ([[1,4],[2,4],[3,6],[4,4]],[2,3,4,5]), [3,3,1,4]), ("minInterval", ([[2,3],[2,5],[1,8],[20,25]],[2,19,5,22]), [2,-1,4,6])],
 "video-stitching": [("videoStitching", ([[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]],10), 3), ("videoStitching", ([[0,1],[1,2]],5), -1), ("videoStitching", ([[0,1],[6,8],[0,2],[5,6],[0,4],[0,3],[6,7],[1,3],[4,7],[1,4],[2,5],[2,6],[3,4],[4,5],[5,7],[6,9]],9), 3)],
}
TREE = {}

def _ops(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]

def _cycle(vals, pos):
    head = lst(vals); tail = head; at = None; k = 0
    while tail and tail.next:
        if k == pos: at = tail
        tail = tail.next; k += 1
    if pos == k: at = tail
    if at: tail.next = at
    return head

def _lists(load, check, h):
    f = load("linked-list-cycle")["hasCycle"]
    check("hasCycle", [f(_cycle([3,2,0,-4], 1)), f(_cycle([1,2], 0)), f(_cycle([1], -1))], [True, True, False])
    f = load("middle-of-the-linked-list")["middleNode"]
    check("middleNode", [arr(f(lst([1,2,3,4,5]))), arr(f(lst([1,2,3,4,5,6])))], [[3,4,5], [4,5,6]])
    f = load("remove-nth-node-from-end-of-list")["removeNthFromEnd"]
    check("removeNthFromEnd", [arr(f(lst([1,2,3,4,5]), 2)), arr(f(lst([1]), 1)), arr(f(lst([1,2]), 1))], [[1,2,3,5], [], [1]])
    f = load("intersection-of-two-linked-lists")["getIntersectionNode"]
    for a, b, shared in [([4,1], [5,6,1], [8,4,5]), ([1,9,1], [3], [2,4]), ([2,6,4], [1,5], [])]:
        s = lst(shared); A = lst(a); B = lst(b)
        for x in (A, B):
            while x.next: x = x.next
            x.next = s
        check("getIntersectionNode", f(A, B) is s, True)
    f = load("reverse-linked-list")["reverseList"]
    check("reverseList", [arr(f(lst([1,2,3,4,5]))), arr(f(lst([1,2]))), arr(f(None))], [[5,4,3,2,1], [2,1], []])
    f = load("reverse-linked-list-ii")["reverseBetween"]
    check("reverseBetween", [arr(f(lst([1,2,3,4,5]), 2, 4)), arr(f(lst([5]), 1, 1))], [[1,4,3,2,5], [5]])
    f = load("reverse-nodes-in-k-group")["reverseKGroup"]
    check("reverseKGroup", [arr(f(lst([1,2,3,4,5]), 2)), arr(f(lst([1,2,3,4,5]), 3))], [[2,1,4,3,5], [3,2,1,4,5]])

def _range_module(load, check, h):
    rm = load("range-module")["RangeModule"]()
    check("RangeModule", _ops(rm, [("addRange",(10,20)),("removeRange",(14,16)),("queryRange",(10,14)),("queryRange",(13,15)),("queryRange",(16,17))]), [None,None,True,False,True])
    rm = load("range-module")["RangeModule"]()
    check("RangeModule merge", _ops(rm, [("addRange",(10,20)),("addRange",(20,30)),("queryRange",(10,30)),("removeRange",(5,40)),("queryRange",(10,11))]), [None,None,True,None,False])

CUSTOM = [_lists, _range_module]

CASES.update({
 "palindrome-linked-list": [("isPalindrome", (lambda: lst([1,2,2,1]),), True), ("isPalindrome", (lambda: lst([1,2]),), False), ("isPalindrome", (lambda: lst([1,2,1]),), True)],
 "maximum-twin-sum-of-a-linked-list": [("pairSum", (lambda: lst([5,4,2,1]),), 6), ("pairSum", (lambda: lst([4,2,2,3]),), 7), ("pairSum", (lambda: lst([1,100000]),), 100001)],
 "n-th-tribonacci-number": [("tribonacci", (4,), 4), ("tribonacci", (25,), 1389537), ("tribonacci", (0,), 0)],
})

def _lists2(load, check, h):
    f = load("reorder-list")["reorderList"]
    for a, exp in [([1,2,3,4], [1,4,2,3]), ([1,2,3,4,5], [1,5,2,4,3]), ([1], [1])]:
        x = lst(a); f(x); check("reorderList", arr(x), exp)
    f = load("partition-list")["partition"]
    check("partition", [arr(f(lst([1,4,3,2,5,2]), 3)), arr(f(lst([2,1]), 2))], [[1,2,2,4,3,5], [1,2]])
    f = load("remove-duplicates-from-sorted-list")["deleteDuplicates"]
    check("deleteDuplicates", [arr(f(lst([1,1,2]))), arr(f(lst([1,1,2,3,3])))], [[1,2], [1,2,3]])
    f = load("remove-duplicates-from-sorted-list-ii")["deleteDuplicates"]
    check("deleteDuplicates II", [arr(f(lst([1,2,3,3,4,4,5]))), arr(f(lst([1,1,1,2,3])))], [[1,2,5], [2,3]])
    f = load("add-two-numbers")["addTwoNumbers"]
    check("addTwoNumbers", [arr(f(lst([2,4,3]), lst([5,6,4]))), arr(f(lst([0]), lst([0]))), arr(f(lst([9,9,9,9,9,9,9]), lst([9,9,9,9])))], [[7,0,8], [0], [8,9,9,9,0,0,0,1]])
    f = load("remove-nodes-from-linked-list")["removeNodes"]
    check("removeNodes", [arr(f(lst([5,2,13,3,8]))), arr(f(lst([1,1,1,1])))], [[13,8], [1,1,1,1]])
    f = load("copy-list-with-random-pointer")["copyRandomList"]
    for spec in ([[7,None],[13,0],[11,4],[10,2],[1,0]], [[1,1],[2,1]], [[3,None],[3,0],[3,None]]):
        nodes = [ListNode(v) for v, _ in spec]
        for i, (_, r) in enumerate(spec):
            nodes[i].next = nodes[i + 1] if i + 1 < len(nodes) else None
            nodes[i].random = nodes[r] if r is not None else None
        out, c = [], f(nodes[0])
        seen = []
        while c: seen.append(c); c = c.next
        for c in seen: out.append([c.val, seen.index(c.random) if c.random else None])
        check("copyRandomList", (out, any(c is o for c in seen for o in nodes)), (spec, False))
    check("copyRandomList empty", f(None), None)

CUSTOM.append(_lists2)

CASES.update({
 "permutations": [("permute", ([1,2,3],), [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]), ("permute", ([0,1],), [[0,1],[1,0]]), ("permute", ([1],), [[1]])],
 "combinations": [("combine", (4,2), [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]), ("combine", (1,1), [[1]])],
 "combination-sum": [("combinationSum", ([2,3,6,7],7), [[2,2,3],[7]]), ("combinationSum", ([2,3,5],8), [[2,2,2,2],[2,3,3],[3,5]]), ("combinationSum", ([2],1), [])],
 "n-queens": [("solveNQueens", (4,), [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]), ("solveNQueens", (1,), [["Q"]])],
 "daily-temperatures": [("dailyTemperatures", ([73,74,75,71,69,72,76,73],), [1,1,4,2,1,1,0,0]), ("dailyTemperatures", ([30,40,50,60],), [1,1,1,0]), ("dailyTemperatures", ([30,60,90],), [1,1,0])],
 "asteroid-collision": [("asteroidCollision", ([5,10,-5],), [5,10]), ("asteroidCollision", ([8,-8],), []), ("asteroidCollision", ([10,2,-5],), [10]), ("asteroidCollision", ([5,10,-5,-12,3,-3],), [-12])],
})

def _chunk3(load, check, h):
    f = load("reverse-string")["reverseString"]
    for a, exp in [(list("hello"), list("olleh")), (list("Hannah"), list("hannaH"))]:
        f(a); check("reverseString", a, exp)
    f = load("unique-binary-search-trees-ii")["generateTrees"]
    key = lambda ts: sorted(str(level(t)) for t in ts)
    check("generateTrees 3", key(f(3)), sorted(str(x) for x in [[1,None,2,None,3],[1,None,3,2],[2,1,3],[3,1,None,None,2],[3,2,None,1]]))
    check("generateTrees 1", key(f(1)), ["[1]"])
    check("generateTrees 4 count", len(f(4)), 14)
    f = load("swap-nodes-in-pairs")["swapPairs"]
    check("swapPairs", [arr(f(lst([1,2,3,4]))), arr(f(None)), arr(f(lst([1]))), arr(f(lst([1,2,3])))], [[2,1,4,3], [], [1], [2,1,3]])
    sp = load("online-stock-span")["StockSpanner"]()
    check("StockSpanner", [sp.next(p) for p in [100,80,60,70,60,75,85]], [1,1,1,2,1,4,6])

CUSTOM.append(_chunk3)

CASES.update({
 "remove-k-digits": [("removeKdigits", ("1432219",3), "1219"), ("removeKdigits", ("10200",1), "200"), ("removeKdigits", ("10",2), "0")],
 "valid-parentheses": [("isValid", ("()",), True), ("isValid", ("()[]{}",), True), ("isValid", ("(]",), False), ("isValid", ("([])",), True), ("isValid", ("([)]",), False), ("isValid", ("]",), False)],
 "evaluate-reverse-polish-notation": [("evalRPN", (["2","1","+","3","*"],), 9), ("evalRPN", (["4","13","5","/","+"],), 6), ("evalRPN", (["10","6","9","3","+","-11","*","/","*","17","+","5","+"],), 22)],
 "simplify-path": [("simplifyPath", ("/home/",), "/home"), ("simplifyPath", ("/home//foo/",), "/home/foo"), ("simplifyPath", ("/home/user/Documents/../Pictures",), "/home/user/Pictures"), ("simplifyPath", ("/../",), "/"), ("simplifyPath", ("/.../a/../b/c/../d/./",), "/.../b/d")],
 "decode-string": [("decodeString", ("3[a]2[bc]",), "aaabcbc"), ("decodeString", ("3[a2[c]]",), "accaccacc"), ("decodeString", ("2[abc]3[cd]ef",), "abcabccdcdcdef")],
 "largest-rectangle-in-histogram": [("largestRectangleArea", ([2,1,5,6,2,3],), 10), ("largestRectangleArea", ([2,4],), 4)],
 "sum-of-subarray-minimums": [("sumSubarrayMins", ([3,1,2,4],), 17), ("sumSubarrayMins", ([11,81,94,43,3],), 444)],
})

def _chunk4(load, check, h):
    ms = load("min-stack")["MinStack"]()
    check("MinStack", _ops(ms, [("push",(-2,)),("push",(0,)),("push",(-3,)),("getMin",()),("pop",()),("top",()),("getMin",())]), [None,None,None,-3,None,0,-2])
    q = load("implement-queue-using-stacks")["MyQueue"]()
    check("MyQueue", _ops(q, [("push",(1,)),("push",(2,)),("peek",()),("pop",()),("empty",()),("pop",()),("empty",())]), [None,None,1,1,False,2,True])
    fs = load("maximum-frequency-stack")["FreqStack"]()
    check("FreqStack", _ops(fs, [("push",(5,)),("push",(7,)),("push",(5,)),("push",(7,)),("push",(4,)),("push",(5,)),("pop",()),("pop",()),("pop",()),("pop",())]), [None]*6 + [5,7,5,4])

CUSTOM.append(_chunk4)

CASES.update({
 "tag-validator": [("isValid", ("<DIV>This is the first line <![CDATA[<div>]]></DIV>",), True), ("isValid", ("<DIV>>>  ![cdata[]] <![CDATA[<div>]>]]>]]>>]</DIV>",), True), ("isValid", ("<A>  <B> </A>   </B>",), False), ("isValid", ("<DIV>  div tag is not closed  <DIV>",), False), ("isValid", ("<DIV>  unmatched <  </DIV>",), False), ("isValid", ("<A></A><B></B>",), False), ("isValid", ("<A><![CDATA[</A>]]></A>",), True)],
 "valid-palindrome-ii": [("validPalindrome", ("aba",), True), ("validPalindrome", ("abca",), True), ("validPalindrome", ("abc",), False), ("validPalindrome", ("abccdba",), True)],
 "backspace-string-compare": [("backspaceCompare", ("ab#c","ad#c"), True), ("backspaceCompare", ("ab##","c#d#"), True), ("backspaceCompare", ("a#c","b"), False), ("backspaceCompare", ("ab#c#d","ad#d"), True)],
 "substrings-of-size-three-with-distinct-characters": [("countGoodSubstrings", ("xyzzaz",), 1), ("countGoodSubstrings", ("aababcabc",), 4), ("countGoodSubstrings", ("ab",), 0)],
 "minimum-window-substring": [("minWindow", ("ADOBECODEBANC","ABC"), "BANC"), ("minWindow", ("a","a"), "a"), ("minWindow", ("a","aa"), "")],
 "permutation-in-string": [("checkInclusion", ("ab","eidbaooo"), True), ("checkInclusion", ("ab","eidboaoo"), False), ("checkInclusion", ("abc","ab"), False)],
 "longest-repeating-character-replacement": [("characterReplacement", ("ABAB",2), 4), ("characterReplacement", ("AABABBA",1), 4)],
 "valid-anagram": [("isAnagram", ("anagram","nagaram"), True), ("isAnagram", ("rat","car"), False)],
 "first-unique-character-in-a-string": [("firstUniqChar", ("leetcode",), 0), ("firstUniqChar", ("loveleetcode",), 2), ("firstUniqChar", ("aabb",), -1)],
})

def _chunk5(load, check, h):
    f = load("group-anagrams")["groupAnagrams"]
    norm = lambda g: sorted(sorted(x) for x in g)
    check("groupAnagrams", norm(f(["eat","tea","tan","ate","nat","bat"])), norm([["bat"],["nat","tan"],["ate","eat","tea"]]))
    check("groupAnagrams empty", f([""]), [[""]])
    check("groupAnagrams one", f(["a"]), [["a"]])

CUSTOM.append(_chunk5)

CASES.update({
 "find-all-anagrams-in-a-string": [("findAnagrams", ("cbaebabacd","abc"), [0,6]), ("findAnagrams", ("abab","ab"), [0,1,2])],
 "isomorphic-strings": [("isIsomorphic", ("egg","add"), True), ("isIsomorphic", ("foo","bar"), False), ("isIsomorphic", ("paper","title"), True), ("isIsomorphic", ("badc","baba"), False)],
 "palindromic-substrings": [("countSubstrings", ("abc",), 3), ("countSubstrings", ("aaa",), 6), ("countSubstrings", ("abaa",), 6)],
 "palindrome-partitioning": [("partition", ("aab",), [["a","a","b"],["aa","b"]]), ("partition", ("a",), [["a"]])],
 "find-the-index-of-the-first-occurrence-in-a-string": [("strStr", ("sadbutsad","sad"), 0), ("strStr", ("leetcode","leeto"), -1), ("strStr", ("abababcab","ababc"), 2), ("strStr", ("aaaaab","aab"), 3)],
 "repeated-substring-pattern": [("repeatedSubstringPattern", ("abab",), True), ("repeatedSubstringPattern", ("aba",), False), ("repeatedSubstringPattern", ("abcabcabcabc",), True)],
 "repeated-string-match": [("repeatedStringMatch", ("abcd","cdabcdab"), 3), ("repeatedStringMatch", ("a","aa"), 2), ("repeatedStringMatch", ("abc","wxyz"), -1)],
 "rotate-string": [("rotateString", ("abcde","cdeab"), True), ("rotateString", ("abcde","abced"), False)],
 "longest-common-prefix": [("longestCommonPrefix", (["flower","flow","flight"],), "fl"), ("longestCommonPrefix", (["dog","racecar","car"],), ""), ("longestCommonPrefix", (["ab","a"],), "a")],
 "compare-version-numbers": [("compareVersion", ("1.2","1.10"), -1), ("compareVersion", ("1.01","1.001"), 0), ("compareVersion", ("1.0","1.0.0.0"), 0), ("compareVersion", ("1.0.1","1"), 1)],
})

CASES.update({
 "length-of-last-word": [("lengthOfLastWord", ("Hello World",), 5), ("lengthOfLastWord", ("   fly me   to   the moon  ",), 4), ("lengthOfLastWord", ("luffy is still joyboy",), 6), ("lengthOfLastWord", ("a",), 1)],
 "multiply-strings": [("multiply", ("2","3"), "6"), ("multiply", ("123","456"), "56088"), ("multiply", ("0","52"), "0"), ("multiply", ("123","45"), "5535")],
 "integer-to-english-words": [("numberToWords", (123,), "One Hundred Twenty Three"), ("numberToWords", (12345,), "Twelve Thousand Three Hundred Forty Five"), ("numberToWords", (1234567,), "One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven"), ("numberToWords", (0,), "Zero"), ("numberToWords", (1000010,), "One Million Ten"), ("numberToWords", (2147483647,), "Two Billion One Hundred Forty Seven Million Four Hundred Eighty Three Thousand Six Hundred Forty Seven")],
 "text-justification": [("fullJustify", (["This","is","an","example","of","text","justification."],16), ["This    is    an","example  of text","justification.  "]), ("fullJustify", (["What","must","be","acknowledgment","shall","be"],16), ["What   must   be","acknowledgment  ","shall be        "]), ("fullJustify", (["Science","is","what","we","understand","well","enough","to","explain","to","a","computer.","Art","is","everything","else","we","do"],20), ["Science  is  what we","understand      well","enough to explain to","a  computer.  Art is","everything  else  we","do                  "])],
 "search-suggestions-system": [("suggestedProducts", (["mobile","mouse","moneypot","monitor","mousepad"],"mouse"), [["mobile","moneypot","monitor"],["mobile","moneypot","monitor"],["mouse","mousepad"],["mouse","mousepad"],["mouse","mousepad"]]), ("suggestedProducts", (["havana"],"havana"), [["havana"]]*6)],
 "remove-sub-folders-from-the-filesystem": [("removeSubfolders", (["/a","/a/b","/c/d","/c/d/e","/c/f"],), ["/a","/c/d","/c/f"]), ("removeSubfolders", (["/a","/a/b/c","/a/b/d"],), ["/a"]), ("removeSubfolders", (["/a/b/c","/a/b/ca","/a/b/d"],), ["/a/b/c","/a/b/ca","/a/b/d"])],
 "camelcase-matching": [("camelMatch", (["FooBar","FooBarTest","FootBall","FrameBuffer","ForceFeedBack"],"FB"), [True,False,True,True,False]), ("camelMatch", (["FooBar","FooBarTest","FootBall","FrameBuffer","ForceFeedBack"],"FoBa"), [True,False,True,False,False]), ("camelMatch", (["FooBar","FooBarTest","FootBall","FrameBuffer","ForceFeedBack"],"FoBaT"), [False,True,False,False,False])],
})

def _chunk7(load, check, h):
    t = load("implement-trie-prefix-tree")["Trie"]()
    check("Trie", _ops(t, [("insert",("apple",)),("search",("apple",)),("search",("app",)),("startsWith",("app",)),("insert",("app",)),("search",("app",))]), [None,True,False,True,None,True])
    wd = load("design-add-and-search-words-data-structure")["WordDictionary"]()
    check("WordDictionary", _ops(wd, [("addWord",("bad",)),("addWord",("dad",)),("addWord",("mad",)),("search",("pad",)),("search",("bad",)),("search",(".ad",)),("search",("b..",)),("search",("..",))]), [None,None,None,False,True,True,True,False])
    W = load("prefix-and-suffix-search")["WordFilter"]
    check("WordFilter", W(["apple"]).f("a", "e"), 0)
    wf = W(["apple", "ample", "bat"])
    check("WordFilter more", [wf.f("a", "le"), wf.f("ap", "e"), wf.f("b", "t"), wf.f("c", ""), wf.f("", "")], [1, 0, 2, -1, 2])

CUSTOM.append(_chunk7)

CASES.update({
 "longest-word-in-dictionary": [("longestWord", (["w","wo","wor","worl","world"],), "world"), ("longestWord", (["a","banana","app","appl","ap","apply","apple"],), "apple")],
 "concatenated-words": [("findAllConcatenatedWordsInADict", (["cat","cats","catsdogcats","dog","dogcatsdog","hippopotamuses","rat","ratcatdogcat"],), ["catsdogcats","dogcatsdog","ratcatdogcat"]), ("findAllConcatenatedWordsInADict", (["cat","dog","catdog"],), ["catdog"])],
 "maximum-xor-with-an-element-from-array": [("maximizeXor", ([0,1,2,3,4],[[3,1],[1,3],[5,6]]), [3,3,7]), ("maximizeXor", ([5,2,4,6,6,3],[[12,4],[8,1],[6,3]]), [15,-1,5])],
 "maximum-genetic-difference-query": [("maxGeneticDifference", ([-1,0,1,1],[[0,2],[3,2],[2,5]]), [2,3,7]), ("maxGeneticDifference", ([3,7,-1,2,0,7,0,2],[[4,6],[1,15],[0,5]]), [6,14,7])],
 "count-pairs-with-xor-in-a-range": [("countPairs", ([1,4,2,7],2,6), 6), ("countPairs", ([9,8,4,2,1],5,14), 8)],
})

def _chunk8(load, check, h):
    f = load("word-search-ii")["findWords"]
    check("findWords", sorted(f([["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], ["oath","pea","eat","rain"])), ["eat","oath"])
    check("findWords none", f([["a","b"],["c","d"]], ["abcb"]), [])
    check("findWords dup", sorted(f([["a","a"]], ["aaa","a","aa"])), ["a","aa"])
    import random
    g = load("count-pairs-with-xor-in-a-range")["countPairs"]
    rnd = random.Random(7)
    for _ in range(30):
        a = [rnd.randint(1, 60) for _ in range(rnd.randint(1, 12))]; lo = rnd.randint(1, 40); hi = rnd.randint(lo, 64)
        check("countPairs brute", g(a, lo, hi), sum(lo <= (a[i] ^ a[j]) <= hi for i in range(len(a)) for j in range(i)))

CUSTOM.append(_chunk8)

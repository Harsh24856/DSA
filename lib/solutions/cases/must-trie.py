# Example cases for lib/solutions/must/trie.ts, merged into solutions_test.py.
CASES = {
 "find-the-length-of-the-longest-common-prefix": [("longestCommonPrefix", ([1,10,100], [1000]), 3), ("longestCommonPrefix", ([1,2,3], [4,4,4]), 0), ("longestCommonPrefix", ([12345], [12346]), 4), ("longestCommonPrefix", ([5,655], [6,65]), 2)],
 "short-encoding-of-words": [("minimumLengthEncoding", (["time","me","bell"],), 10), ("minimumLengthEncoding", (["t"],), 2), ("minimumLengthEncoding", (["time","time","atime","btime"],), 12), ("minimumLengthEncoding", (["me","time"],), 5)],
 "extra-characters-in-a-string": [("minExtraChar", ("leetscode", ["leet","code","leetcode"]), 1), ("minExtraChar", ("sayhelloworld", ["hello","world"]), 3), ("minExtraChar", ("a", ["b"]), 1), ("minExtraChar", ("abc", ["abc","a"]), 0)],
 "word-break-ii": [("wordBreak", ("catsanddog", ["cat","cats","and","sand","dog"]), ["cat sand dog","cats and dog"]), ("wordBreak", ("pineapplepenapple", ["apple","pen","applepen","pine","pineapple"]), ["pine apple pen apple","pine applepen apple","pineapple pen apple"]), ("wordBreak", ("catsandog", ["cats","dog","sand","and","cat"]), []), ("wordBreak", ("aaaa", ["a","aa"]), ["a a a a","a a aa","a aa a","aa a a","aa aa"])],
}
TREE = {}
CUSTOM = []

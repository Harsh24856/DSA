# Example cases for lib/solutions/must/string.ts, merged into solutions_test.py.
CASES = {
 "integer-to-roman": [("intToRoman", (3749,), "MMMDCCXLIX"), ("intToRoman", (58,), "LVIII"), ("intToRoman", (1994,), "MCMXCIV"), ("intToRoman", (1,), "I"), ("intToRoman", (3999,), "MMMCMXCIX")],
 "zigzag-conversion": [("convert", ("PAYPALISHIRING", 3), "PAHNAPLSIIGYIR"), ("convert", ("PAYPALISHIRING", 4), "PINALSIGYAHRPI"), ("convert", ("A", 1), "A"), ("convert", ("AB", 1), "AB"), ("convert", ("ABC", 5), "ABC")],
 "string-compression": [("compress", (["a","a","b","b","c","c","c"],), 6), ("compress", (["a"],), 1), ("compress", (["a","b","b","b","b","b","b","b","b","b","b","b","b"],), 4)],
 "is-subsequence": [("isSubsequence", ("abc", "ahbgdc"), True), ("isSubsequence", ("axc", "ahbgdc"), False), ("isSubsequence", ("", "abc"), True), ("isSubsequence", ("abc", ""), False)],
}
TREE = {}

def _must_string(load, check, h):
    g = load("string-compression")
    for chars, exp in [(["a","a","b","b","c","c","c"], ["a","2","b","2","c","3"]), (["a"], ["a"]), (["a"] + ["b"] * 12, ["a","b","1","2"]), (["x"] * 100, ["x","1","0","0"])]:
        k = g["compress"](chars); check("compress prefix", chars[:k], exp)

CUSTOM = [_must_string]

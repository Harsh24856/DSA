# Example cases for lib/solutions/must/greedy.ts, merged into solutions_test.py.
CASES = {
 "valid-parenthesis-string": [("checkValidString", ("()",), True), ("checkValidString", ("(*)",), True), ("checkValidString", ("(*))",), True), ("checkValidString", ("((*)*))",), True), ("checkValidString", (")(",), False), ("checkValidString", ("(((*)",), False), ("checkValidString", ("*",), True)],
 "merge-triplets-to-form-target-triplet": [("mergeTriplets", ([[2,5,3],[1,8,4],[1,7,5]], [2,7,5]), True), ("mergeTriplets", ([[3,4,5],[4,5,6]], [3,2,5]), False), ("mergeTriplets", ([[2,5,3],[2,3,4],[1,2,5],[5,2,3]], [5,5,5]), True), ("mergeTriplets", ([[1,1,1]], [1,1,1]), True)],
 "monotone-increasing-digits": [("monotoneIncreasingDigits", (10,), 9), ("monotoneIncreasingDigits", (1234,), 1234), ("monotoneIncreasingDigits", (332,), 299), ("monotoneIncreasingDigits", (43221,), 39999), ("monotoneIncreasingDigits", (0,), 0), ("monotoneIncreasingDigits", (100,), 99)],
 "dota2-senate": [("predictPartyVictory", ("RD",), "Radiant"), ("predictPartyVictory", ("RDD",), "Dire"), ("predictPartyVictory", ("RDDRRD",), "Radiant"), ("predictPartyVictory", ("D",), "Dire")],
}
TREE = {}
CUSTOM = []

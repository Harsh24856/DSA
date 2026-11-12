# Example cases for lib/solutions/pattern5.ts, merged into solutions_test.py.
CASES = {
 "jump-game-vi": [("maxResult", ([1,-1,-2,4,-7,3], 2), 7), ("maxResult", ([10,-5,-2,4,0,3], 3), 17), ("maxResult", ([1,-5,-20,4,-1,3,-6,-3], 2), 0), ("maxResult", ([5], 1), 5)],
 "minimum-index-of-a-valid-split": [("minimumIndex", ([1,2,2,2],), 2), ("minimumIndex", ([2,1,3,1,1,1,7,1,2,1],), 4), ("minimumIndex", ([3,3,3,3,7,2,2],), -1), ("minimumIndex", ([1],), -1), ("minimumIndex", ([1,1],), 0)],
 "number-of-digit-one": [("countDigitOne", (13,), 6), ("countDigitOne", (0,), 0), ("countDigitOne", (100,), 21), ("countDigitOne", (1000000000,), 900000001)],
 "numbers-at-most-n-given-digit-set": [("atMostNGivenDigitSet", (["1","3","5","7"], 100), 20), ("atMostNGivenDigitSet", (["1","4","9"], 1000000000), 29523), ("atMostNGivenDigitSet", (["7"], 8), 1), ("atMostNGivenDigitSet", (["3","4","8"], 4), 2)],
 "count-numbers-with-unique-digits": [("countNumbersWithUniqueDigits", (2,), 91), ("countNumbersWithUniqueDigits", (0,), 1), ("countNumbersWithUniqueDigits", (3,), 739), ("countNumbersWithUniqueDigits", (8,), 2345851)],
 "count-special-integers": [("countSpecialNumbers", (20,), 19), ("countSpecialNumbers", (5,), 5), ("countSpecialNumbers", (135,), 110), ("countSpecialNumbers", (1,), 1), ("countSpecialNumbers", (2000000000,), 5974650)],
 "non-negative-integers-without-consecutive-ones": [("findIntegers", (5,), 5), ("findIntegers", (1,), 2), ("findIntegers", (2,), 3), ("findIntegers", (3,), 3), ("findIntegers", (1000000000,), 2178309)],
}
TREE = {}

def _ops5(obj, calls):
    return [getattr(obj, name)(*args) for name, args in calls]

def _caches5(load, check, h):
    c = load("lru-cache")["LRUCache"](2)
    check("LRUCache", _ops5(c, [("put",(1,1)),("put",(2,2)),("get",(1,)),("put",(3,3)),("get",(2,)),("put",(4,4)),("get",(1,)),("get",(3,)),("get",(4,))]), [None,None,1,None,-1,None,-1,3,4])
    c = load("lru-cache")["LRUCache"](1)
    check("LRUCache update", _ops5(c, [("put",(2,1)),("put",(2,2)),("get",(2,)),("put",(3,3)),("get",(2,)),("get",(3,))]), [None,None,2,None,-1,3])
    c = load("lfu-cache")["LFUCache"](2)
    check("LFUCache", _ops5(c, [("put",(1,1)),("put",(2,2)),("get",(1,)),("put",(3,3)),("get",(2,)),("get",(3,)),("put",(4,4)),("get",(1,)),("get",(3,)),("get",(4,))]), [None,None,1,None,-1,3,None,-1,3,4])
    c = load("lfu-cache")["LFUCache"](2)
    check("LFUCache tie and update", _ops5(c, [("put",(1,1)),("put",(2,2)),("put",(1,10)),("put",(3,3)),("get",(2,)),("get",(1,)),("get",(3,))]), [None,None,None,None,-1,10,3])
    c = load("lfu-cache")["LFUCache"](0)
    check("LFUCache zero", _ops5(c, [("put",(0,0)),("get",(0,))]), [None,-1])
    b = load("design-browser-history")["BrowserHistory"]("leetcode.com")
    check("BrowserHistory", _ops5(b, [("visit",("google.com",)),("visit",("facebook.com",)),("visit",("youtube.com",)),("back",(1,)),("back",(1,)),("forward",(1,)),("visit",("linkedin.com",)),("forward",(2,)),("back",(2,)),("back",(7,))]), [None,None,None,"facebook.com","google.com","facebook.com",None,"linkedin.com","google.com","leetcode.com"])

CUSTOM = [_caches5]

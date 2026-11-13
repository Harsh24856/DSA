# Example cases for lib/solutions/must/bit-and-math.ts, merged into solutions_test.py.
CASES = {
 "factorial-trailing-zeroes": [("trailingZeroes", (3,), 0), ("trailingZeroes", (5,), 1), ("trailingZeroes", (0,), 0), ("trailingZeroes", (25,), 6), ("trailingZeroes", (10000,), 2499)],
 "gray-code": [("grayCode", (2,), [0,1,3,2]), ("grayCode", (1,), [0,1])],
 "number-complement": [("findComplement", (5,), 2), ("findComplement", (1,), 0), ("findComplement", (37,), 26), ("findComplement", (2147483647,), 0)],
 "fraction-to-recurring-decimal": [("fractionToDecimal", (1, 2), "0.5"), ("fractionToDecimal", (2, 1), "2"), ("fractionToDecimal", (4, 333), "0.(012)"), ("fractionToDecimal", (1, 6), "0.1(6)"), ("fractionToDecimal", (-50, 8), "-6.25"), ("fractionToDecimal", (0, -5), "0"), ("fractionToDecimal", (-2147483648, -1), "2147483648"), ("fractionToDecimal", (22, 7), "3.(142857)")],
}
TREE = {}

def _gray(load, check, h):
    g = load("gray-code")["grayCode"](10)
    check("grayCode 10 one-bit steps", (sorted(g) == list(range(1024)), all(bin(g[i] ^ g[(i + 1) % 1024]).count("1") == 1 for i in range(1024))), (True, True))

CUSTOM = [_gray]

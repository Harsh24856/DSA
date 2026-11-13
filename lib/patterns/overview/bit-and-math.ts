// Overview of the "bit-and-math" topic: the data structure or technique itself. Shown on /patterns/bit-and-math before the patterns.
import type { CellsFrame, Diagram, TableFrame, Tone } from "../../diagram";
import type { TopicOverview } from "../types";

const W = 8;
const b8 = (x: number) => (x & 0xff).toString(2).padStart(W, "0").split("");
const signed8 = (x: number) => ((x & 0xff) >= 128 ? (x & 0xff) - 256 : x & 0xff);

/** -x = ~x + 1, with the carry rippling up from bit 0. */
function negate(x = 44): Diagram {
  const frames: CellsFrame[] = [], inv = ~x & 0xff;
  frames.push({ note: `x = ${x} in ${W} bits. To negate it in two's complement: flip every bit, then add 1`, rows: [b8(x), b8(0)] });
  frames.push({ note: `~x flips all ${W} bits: ${b8(inv).join("")}, which reads as ${signed8(inv)} = -x - 1`, rows: [b8(x), b8(inv)], tones: Object.fromEntries(b8(inv).map((_, i) => [`1:${i}`, "window" as Tone])) });
  let cur = inv, carry = 1;
  for (let i = 0; i < W && carry; i++) {
    const bit = (cur >> i) & 1, col = W - 1 - i;
    if (bit) { cur &= ~(1 << i); frames.push({ note: `Add 1 at bit ${i}: it is 1, so it becomes 0 and the carry moves to bit ${i + 1}`, rows: [b8(x), b8(cur)], tones: { [`1:${col}`]: "bad" } }); }
    else { cur |= 1 << i; carry = 0; frames.push({ note: `Bit ${i} is 0: it takes the carry and becomes 1. The carry stops here`, rows: [b8(x), b8(cur)], tones: { [`1:${col}`]: "found" } }); }
  }
  frames.push({ note: `~x + 1 = ${b8(cur).join("")}, which reads as ${signed8(cur)}. The top bit is worth -128, so this is -128 + ${(cur & 0x7f)}`, rows: [b8(x), b8(cur)], tones: { "1:0": "active" } });
  frames.push({ note: `Check: ${x} + (${signed8(cur)}) = ${b8(x + cur).join("")} in ${W} bits, the carry out of bit 7 is dropped. Adding a number and its negation gives 0, which is why the CPU can use one adder for both signs`, rows: [b8(x), b8(cur), b8(x + cur)], tones: Object.fromEntries(b8(0).map((_, i) => [`2:${i}`, "found" as Tone])) });
  return { kind: "cells", title: `Two's complement: -${x} = ~${x} + 1`, rowLabels: ["x", "-x", "sum"], rows: [b8(x), b8(0)], frames };
}

/** Kernighan's popcount: each x & (x - 1) clears the lowest set bit. */
function kernighan(x = 182): Diagram {
  const frames: CellsFrame[] = []; let cur = x, count = 0;
  frames.push({ note: `x = ${x} = ${b8(x).join("")}. Count its set bits without looking at every position`, rows: [b8(cur), b8(0)] });
  while (cur) {
    const low = cur & -cur, next = cur & (cur - 1), col = W - 1 - Math.log2(low);
    frames.push({ note: `x - 1 = ${b8(cur - 1).join("")}: subtracting 1 turns the lowest set bit (value ${low}) into 0 and every 0 below it into 1`, rows: [b8(cur), b8(cur - 1), b8(0)], tones: { [`0:${col}`]: "active", [`1:${col}`]: "bad" } });
    count++;
    frames.push({ note: `x & (x - 1) = ${b8(next).join("")} = ${next}: exactly that bit is gone. Count ${count}`, rows: [b8(cur), b8(cur - 1), b8(next)], tones: { [`2:${col}`]: "found" } });
    cur = next;
  }
  frames.push({ note: `x is 0 after ${count} rounds, one per set bit, so popcount(${x}) = ${count}. The same test x & (x - 1) == 0 says whether x is a power of two`, rows: [b8(0), b8(0), b8(0)] });
  return { kind: "cells", title: `popcount(${x}) = ${count}`, rowLabels: ["x", "x - 1", "x & (x - 1)"], rows: [b8(x), b8(x - 1), b8(0)], frames };
}

/** a^e mod m by squaring, one row per bit of e. */
function powMod(a = 3, e = 45, m = 1000): Diagram {
  const frames: TableFrame[] = [], rows: (string | number | null)[][] = [];
  let result = 1, base = a % m, k = e, i = 0;
  frames.push({ note: `${a}^${e} mod ${m}. ${e} = ${e.toString(2)} in binary, so ${a}^${e} is a product of ${a}^(2^i) over the set bits`, cells: [[0, k & 1, base, result]] });
  while (k) {
    const bit = k & 1;
    if (bit) result = (result * base) % m;
    rows.push([i, bit, base, result]);
    frames.push({ note: bit ? `Bit ${i} of ${e} is 1: multiply the result by ${a}^${2 ** i} mod ${m} = ${base}. Result ${result}` : `Bit ${i} is 0: the result stays ${result}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, bit ? 3 : 1] });
    base = (base * base) % m; k >>= 1; i++;
  }
  frames.push({ note: `Done after ${i} squarings instead of ${e - 1} multiplications. Reducing mod ${m} after every product keeps every number below ${m * m}`, cells: rows.map((r) => [...r]), active: [rows.length - 1, 3] });
  return { kind: "table", title: `${a}^${e} mod ${m} = ${result}`, rowHead: rows.map((_, j) => `bit ${j}`), colHead: ["i", "bit", "a^(2^i) mod m", "result"], frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "Every integer in a computer is a fixed row of **bits**, the binary digits of the number. Bit i (counted from 0 at the right) is worth 2^i, so 44 = 32 + 8 + 4 = `101100`. An `int` is usually 32 bits and a `long long` 64. Bit operations act on every position at once in one CPU instruction, which is why they are O(1) and why a 64-bit word can stand for a whole set of up to 64 items (a **bitmask**).",
    "Negative numbers use **two's complement**. In w bits the top bit is worth -2^(w - 1) instead of +2^(w - 1), so the range is -2^(w - 1) to 2^(w - 1) - 1 (for 32 bits, about plus or minus 2.1 x 10^9). To negate x, flip all bits and add 1: `-x == ~x + 1`. One adder then handles both signs, there is a single zero, and -1 is all ones. The range is lopsided: -2^31 has no positive partner, so `abs(INT_MIN)` and `-INT_MIN` overflow.",
    "The operators: `&` (AND, 1 only where both are 1, used to test or clear), `|` (OR, sets bits), `^` (XOR, 1 where they differ: toggles bits, and `a ^ a = 0`), `~` (NOT, flips every bit, `~x = -x - 1`), `<<` (shift left by k, multiplies by 2^k and drops bits that fall off the top) and `>>` (shift right by k, divides by 2^k rounding down; on signed values it copies the sign bit in, the arithmetic shift, while an unsigned or `>>>` shift fills with zeros). The identities that matter most: `x & (x - 1)` clears the lowest set bit, `x & -x` keeps only the lowest set bit, `x & (x - 1) == 0` tests for a power of two, and `(x >> i) & 1` reads bit i.",
    "**Integer overflow** happens when a result does not fit its type. In C++ and Java, signed overflow wraps (Java) or is undefined behaviour (C++), and it is silent in both. `int` times `int` stays `int` even when stored in a `long long`, so `1e5 * 1e5` must be computed as `1LL * a * b`. Python integers never overflow; they just grow, which is why Python answers to 'reverse an integer' must check the 32-bit range by hand.",
    "**Modular arithmetic** keeps numbers small when an answer is 'mod 10^9 + 7'. Addition, subtraction and multiplication can be reduced at every step: `(a + b) % m`, `(a - b + m) % m`, `(a * b) % m`. Division cannot: dividing by b means multiplying by its **inverse** b^(m - 2) mod m when m is prime (Fermat's little theorem). In C++ and Java `%` keeps the sign of the dividend, so `-7 % 3 == -1`; Python's `%` always returns a value in [0, m).",
    "The number theory that interviews use is small. **gcd** by Euclid, `gcd(a, b) = gcd(b, a mod b)`, runs in O(log min(a, b)), and `lcm(a, b) = a / gcd(a, b) * b`. A number n is **prime** if no d with d x d <= n divides it, an O(sqrt n) test; the **Sieve of Eratosthenes** finds every prime up to n in O(n log log n). **Fast power** computes a^e with O(log e) multiplications by reading the bits of e.",
  ],
  build: [
    "Single-bit operations are masks. Build the mask `1 << i`, then OR it to set the bit, AND its complement to clear it, XOR it to toggle it, and shift x right and AND with 1 to read it. For i of 31 or more in C++, write `1LL << i`, because `1 << 31` already overflows an `int`.",
    "Counting set bits by checking all 32 positions works, but Kernighan's loop is shorter: `x &= x - 1` removes the lowest set bit each time, so it runs once per set bit. Subtracting 1 turns the lowest 1 into 0 and every 0 below it into 1; ANDing with the original wipes exactly that region. Built-ins do it in one instruction: `__builtin_popcount` (and `popcountll`) in C++, `bin(x).count('1')` or `x.bit_count()` in Python.",
    "Two's complement is built so that ordinary binary addition just works when carries out of the top bit are dropped. To read a w-bit pattern as a signed number, take its unsigned value and subtract 2^w if the top bit is set. Python has no fixed width, so `x & 0xFFFFFFFF` gives the 32-bit pattern of x, and the reverse subtracts 2^32 when bit 31 is set.",
    "Fast power keeps a result and a base. While the exponent is positive: if its lowest bit is 1, multiply the result by the base; square the base; shift the exponent right. The base walks through a, a^2, a^4, a^8, and the result collects the powers whose bits are set. Under a modulus, reduce after every multiplication; with m below 2^31 every product fits in 64 bits.",
    "The sieve keeps a boolean array `is_prime[0..n]`. For each p from 2 while p x p <= n, if p is still marked prime, cross out p x p, p x p + p, and so on. Starting at p x p is safe because any smaller multiple k x p with k < p was already crossed out by k's smallest prime factor. Euclid's gcd loops `a, b = b, a % b` until b is 0; each two steps at least halve the larger number, which gives the O(log) bound.",
  ],
  code: `# Single bits (i counts from 0 at the right)
def get_bit(x, i):    return (x >> i) & 1
def set_bit(x, i):    return x | (1 << i)
def clear_bit(x, i):  return x & ~(1 << i)
def toggle_bit(x, i): return x ^ (1 << i)

def popcount(x):
    """Kernighan: x & (x - 1) clears the lowest set bit, so loop once per set bit."""
    count = 0
    while x:
        x &= x - 1
        count += 1
    return count

def lowest_bit(x):    return x & -x                  # the value of the lowest set bit
def is_pow2(x):       return x > 0 and x & (x - 1) == 0

def to_twos(x, w=8):
    """The w-bit pattern that stores x (negative x wraps to 2^w + x)."""
    return format(x & ((1 << w) - 1), f"0{w}b")

def from_twos(bits):
    """Read a w-bit pattern as signed: the top bit is worth -2^(w - 1)."""
    v = int(bits, 2)
    return v - (1 << len(bits)) if bits[0] == "1" else v

def gcd(a, b):
    while b:                                          # Euclid: gcd(a, b) = gcd(b, a mod b)
        a, b = b, a % b
    return abs(a)

def lcm(a, b):        return a // gcd(a, b) * b       # divide first to stay small

def sieve(n):
    """All primes up to n in O(n log log n)."""
    is_p = [True] * (n + 1)
    is_p[0:2] = [False, False]
    for p in range(2, int(n ** 0.5) + 1):
        if is_p[p]:
            for m in range(p * p, n + 1, p):          # smaller multiples were crossed already
                is_p[m] = False
    return [i for i in range(n + 1) if is_p[i]]

def is_prime(n):
    if n < 2:
        return False
    i = 2
    while i * i <= n:                                 # a factor above sqrt(n) pairs with one below
        if n % i == 0:
            return False
        i += 1
    return True

def pow_mod(a, e, m):
    """a^e mod m by repeated squaring: O(log e) multiplications."""
    result, a = 1 % m, a % m
    while e:
        if e & 1:
            result = result * a % m
        a = a * a % m
        e >>= 1
    return result

def mod_inverse(a, p):
    """a^-1 mod a prime p, by Fermat: a^(p - 2)."""
    return pow_mod(a, p - 2, p)

def wrap32(x):
    """What a 32-bit signed int holds after overflow (Python ints never overflow)."""
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x >> 31 else x

if __name__ == "__main__":
    x = 0b101100                                      # 44
    assert get_bit(x, 2) == 1 and get_bit(x, 0) == 0
    assert set_bit(x, 0) == 45 and clear_bit(x, 2) == 40 and toggle_bit(x, 5) == 12
    assert popcount(x) == 3 == bin(x).count("1") and popcount(0) == 0
    assert lowest_bit(x) == 4 and is_pow2(64) and not is_pow2(44) and not is_pow2(0)
    assert to_twos(-44) == "11010100" and from_twos("11010100") == -44 and to_twos(-1) == "11111111"
    assert (~x) == -x - 1 and (-x) == (~x) + 1
    assert -7 >> 1 == -4 and -7 // 2 == -4 and int(-7 / 2) == -3   # shifts and // round down
    assert gcd(252, 105) == 21 and gcd(0, 5) == 5 and lcm(4, 6) == 12
    assert sieve(30) == [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
    assert is_prime(97) and not is_prime(91) and not is_prime(1)
    assert pow_mod(3, 13, 1000) == 3 ** 13 % 1000 and pow_mod(2, 10, 1) == 0
    M = 10 ** 9 + 7
    assert mod_inverse(3, M) * 3 % M == 1
    assert (-7) % 3 == 2 and (5 - 7) % M == M - 2                 # Python's % is never negative
    assert wrap32(2 ** 31) == -2 ** 31 and wrap32(2 ** 31 - 1) == 2 ** 31 - 1
    print("ok")`,
  ops: [
    {
      title: "Bit operations (w-bit words, O(1) means one or a few instructions)",
      rows: [
        ["AND, OR, XOR, NOT of two words", "O(1)", "O(1)", "Every bit position at once"],
        ["Shift left or right by k", "O(1)", "O(1)", "x << k = x x 2^k (bits fall off the top); x >> k = floor(x / 2^k)"],
        ["Read bit i: (x >> i) & 1", "O(1)", "O(1)", "Shift it to position 0, mask it"],
        ["Set, clear, toggle bit i", "O(1)", "O(1)", "x | m, x & ~m, x ^ m with m = 1 << i"],
        ["Lowest set bit: x & -x", "O(1)", "O(1)", "-x = ~x + 1 matches x only at the lowest 1; Fenwick trees step by it"],
        ["Clear the lowest set bit: x & (x - 1)", "O(1)", "O(1)", "x - 1 flips the lowest 1 and the zeros below it"],
        ["Power of two test", "O(1)", "O(1)", "x > 0 and x & (x - 1) == 0: exactly one bit set"],
        ["Popcount, Kernighan loop", "O(set bits)", "O(w)", "One round per set bit; the built-in is one instruction"],
        ["Popcount, bit by bit", "O(w)", "O(w)", "Check all w positions"],
        ["Highest set bit, bit length", "O(1)", "O(1)", "`31 - __builtin_clz(x)` or `x.bit_length() - 1`; a loop is O(w)"],
        ["Negate in two's complement", "O(1)", "O(1)", "~x + 1"],
        ["Swap without a temporary (XOR swap)", "O(1)", "O(1)", "a ^= b; b ^= a; a ^= b; breaks if a and b are the same variable"],
        ["XOR of a whole array", "O(n)", "O(n)", "Pairs cancel because a ^ a = 0: finds the unpaired value"],
        ["Enumerate all subsets of n items", "O(2^n x n)", "O(2^n x n)", "mask from 0 to 2^n - 1, test each bit"],
        ["Enumerate the submasks of a mask", "O(2^k)", "O(2^k)", "s = (s - 1) & mask, k = popcount(mask); over all masks O(3^n)"],
      ],
    },
    {
      title: "Arithmetic and number theory",
      rows: [
        ["Add, subtract, multiply mod m", "O(1)", "O(1)", "Reduce after each step; (a - b + m) % m stays non-negative"],
        ["Fast power a^e (mod m)", "O(log e)", "O(log e)", "One squaring per bit of e"],
        ["Modular inverse, m prime", "O(log m)", "O(log m)", "Fermat: a^(m - 2) mod m"],
        ["Modular inverse, any m with gcd 1", "O(log m)", "O(log m)", "Extended Euclid finds x with a x + m y = 1"],
        ["gcd (Euclid), lcm", "O(log min(a, b))", "O(log min(a, b))", "Remainders shrink at least by half every two steps; lcm = a / gcd x b"],
        ["Primality, trial division", "O(sqrt n)", "O(sqrt n)", "A factor above sqrt n pairs with one below it"],
        ["Sieve of Eratosthenes up to n", "O(n log log n)", "O(n log log n)", "O(n) memory; start crossing at p x p"],
        ["Smallest prime factor sieve, then factorise", "O(n) build, O(log x) per query", "O(n log log n) build", "spf[x] lets you peel factors one by one"],
        ["Factorise by trial division", "O(sqrt n)", "O(sqrt n)", "Divide out each d while d x d <= n; what is left above 1 is prime"],
        ["Count or list divisors", "O(sqrt n)", "O(sqrt n)", "Divisors come in pairs d and n / d"],
        ["nCr mod p with precomputed factorials", "O(n) build, O(1) per query", "O(n) build", "fact[n] x inv(fact[r]) x inv(fact[n - r])"],
        ["Integer square root", "O(log n)", "O(log n)", "Binary search on the answer, or `math.isqrt`; floating sqrt can be off by one for big n"],
        ["Digits of n: peel with % 10 and // 10", "O(log10 n)", "O(log10 n)", "One step per digit"],
      ],
    },
  ],
  builtins: [
    ["Count set bits", "`__builtin_popcount(x)`, `__builtin_popcountll(x)`, `std::popcount` (C++20)", "`x.bit_count()` (3.10+) or `bin(x).count('1')`"],
    ["Bit length, highest bit", "`32 - __builtin_clz(x)` (x > 0), `std::bit_width`", "`x.bit_length()`"],
    ["Trailing zeros (index of the lowest set bit)", "`__builtin_ctz(x)`, `std::countr_zero`", "`(x & -x).bit_length() - 1`"],
    ["Binary text", "`bitset<32>(x).to_string()`", "`bin(x)`, `format(x, '032b')`"],
    ["Parse binary", "`stoi(s, nullptr, 2)`", "`int(s, 2)`"],
    ["gcd and lcm", "`std::gcd`, `std::lcm` in <numeric>", "`math.gcd`, `math.lcm` (3.9+)"],
    ["Fast modular power", "none: write the loop", "`pow(a, e, m)`, and `pow(a, -1, m)` for the inverse (3.8+)"],
    ["Integer square root", "`sqrtl` then fix by one, or binary search", "`math.isqrt(n)`"],
    ["Big integers", "none built in", "every `int` is arbitrary precision"],
    ["Limits", "`INT_MAX`, `LLONG_MAX`, `numeric_limits<int>::max()`", "none needed; use `2**31 - 1` for 32-bit checks"],
  ],
  when: [
    "'Without extra space' or 'in O(1) memory' with numbers that appear twice and one that does not: XOR.",
    "n up to about 20 and 'every subset' or 'which items are used': a bitmask of n bits.",
    "'Power of two', 'number of 1 bits', 'reverse the bits', 'Hamming distance': direct bit operations.",
    "'Return the answer modulo 10^9 + 7': modular arithmetic, and fast power or inverses for divisions.",
    "'Divisible', 'multiple', 'common factor', 'fraction in lowest terms': gcd and lcm.",
    "Counting primes or factoring many numbers up to 10^6 or 10^7: a sieve.",
    "Values up to 10^9 or 10^18, or 'fits in a 32-bit integer': think about overflow before writing the loop.",
  ],
  avoid: [
    "A set of items larger than 64: use a boolean array or a hash set, or `bitset<N>` in C++, not one integer mask.",
    "Readability matters more than a constant factor: `n % 2` and `n // 2` say the same as `n & 1` and `n >> 1`, and compilers emit the same code.",
    "Exact fractions or very large values: compare cross products in 64 bits or use Python ints, never floating point equality.",
    "A one-off primality test for one number: trial division up to sqrt n beats building a sieve.",
    "Probability or geometry with real numbers: bit tricks do not apply, and floating point needs a tolerance.",
  ],
  tips: [
    "Write `1LL << i` and `1LL * a * b` in C++ whenever the result can pass 2^31; the overflow is silent and the answer just comes out wrong.",
    "Operator precedence bites: `x & 1 == 0` parses as `x & (1 == 0)`. Always bracket bit expressions: `(x & 1) == 0`.",
    "Python's `~x` is `-x - 1` and its `>>` on negatives rounds toward minus infinity, while `int(-7 / 2)` truncates toward zero. Know which rounding the problem expects.",
    "Mod rules: reduce after every `+` and `*`, add m before taking `%` of a difference, and never divide directly; multiply by the inverse instead.",
    "abs(INT_MIN) does not fit in an int. Problems like 'divide two integers' and 'reverse integer' are mostly about that one value.",
    "For 'single number' variants, say why XOR works: it is associative and commutative, a ^ a = 0 and a ^ 0 = a, so order does not matter and pairs cancel.",
    "State costs in terms of the word size or the value: popcount is O(number of set bits), gcd is O(log min(a, b)), trial division is O(sqrt n), not O(n).",
  ],
  viz: [
    { name: "Two's complement negation", make: () => negate(), label: "Flip every bit, then add 1 and follow the carry" },
    { name: "Kernighan's bit count", make: () => kernighan(), label: "x & (x - 1) clears one set bit per round" },
    { name: "Fast power by squaring", make: () => powMod(), label: "Multiply in a^(2^i) for each set bit of the exponent" },
  ],
};

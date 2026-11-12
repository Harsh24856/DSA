// Deeper theory for the "bit-and-math" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, TableFrame } from "../../diagram";
import { bin } from "../../sim";
import { nums, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "Integers are stored in two's complement: -x is ~x + 1, all bits flipped plus one. Adding 1 to ~x turns its trailing ones back into zeros and the first zero into a one, so x and -x agree on the lowest set bit of x and every bit below it, and disagree on every bit above. That is why x & -x isolates the lowest set bit.",
    "x - 1 flips the lowest set bit of x to 0 and every zero below it to 1, leaving higher bits unchanged. So x & (x - 1) removes exactly the lowest set bit. Repeating it until x is 0 takes one step per set bit (Kernighan's method), which is faster than checking all 32 positions when few bits are set.",
    "Counting bits for every number from 0 to n is a tiny DP: i >> 1 drops the last bit, so bits[i] = bits[i >> 1] + (i & 1). Another form uses bits[i] = bits[i & (i - 1)] + 1. Both are O(n) and avoid calling popcount on each number.",
    "Sum over pairs can often be done per bit. The Hamming distance of two numbers is popcount(x ^ y). For the total Hamming distance over all pairs, count c, how many numbers have bit b set; that bit contributes c · (n - c) differing pairs. Summing over 32 bits gives O(32 · n) instead of O(n²).",
    "Language details matter. Python integers never overflow and have no fixed width, so `~x` is negative and results need `& 0xFFFFFFFF` to act like 32 bits. In C++ and Java, right-shifting a negative signed integer copies the sign bit (arithmetic shift); use unsigned types or `>>>` in Java for a logical shift. Built-ins save time: `int.bit_count()` in Python, `std::popcount` (C++20) or `__builtin_popcount`.",
    "These operations are the alphabet for the rest of the topic: masks for subsets, XOR for cancellation, power-of-two tests, and bitwise tries all reduce to set, clear, test and isolate.",
  ],
  2: [
    "XOR behaves like addition without carries, bit by bit, and it satisfies a ^ a = 0, a ^ 0 = a, and both commutativity and associativity. So in any XOR of a list, values can be reordered and pairs cancel. The XOR of a whole list equals the XOR of the values that appear an odd number of times, which is why 'every element twice except one' is solved by one pass and one variable.",
    "Missing number XORs every index 0..n with every value. Each present value cancels with its index, and the one index without a partner is left. The same works with sums (n(n + 1) / 2 minus the total), but XOR cannot overflow.",
    "Two unpaired numbers a and b: XOR of everything gives a ^ b, which is nonzero because a ≠ b. Any set bit of it (usually the lowest, `diff & -diff`) is a bit where a and b differ, so splitting the list by that bit puts a and b in different groups while every pair stays together. XOR each group to get a and b.",
    "When the others appear three times, XOR no longer cancels them. Count each bit's ones modulo 3 instead: bits of the unique number are exactly the positions whose count is not a multiple of 3. A compact version keeps two masks, ones and twos, that act as a per-bit counter modulo 3.",
    "Useful identities: the XOR of 0..n is n, 1, n + 1, 0 for n mod 4 equal to 0, 1, 2, 3, which gives range XORs in O(1). XOR-ing characters finds the extra letter in 'find the difference'. Decode XORed permutation uses the XOR of 1..n together with the XOR of every other encoded value to recover the first element.",
    "XOR is also the subtraction of prefix XOR (pattern 5), the distance in a bitwise trie (trie pattern 4), and the basis of Gray codes and parity checks. Whenever pairs should cancel, think XOR.",
  ],
  3: [
    "The integers from 0 to 2ⁿ - 1 are in one-to-one correspondence with the subsets of n items: bit i of the mask says whether item i is in. Counting from 0 to 2ⁿ - 1 therefore lists every subset exactly once, with no recursion and no duplicate handling.",
    "Masks are also compact sets for fast tests. A word's letters fit in a 26-bit mask; two words share no letter exactly when the AND of their masks is 0, an O(1) test. In 'maximum product of word lengths', keep only the longest word for each distinct mask, which can cut the number of pairs a lot.",
    "Encoding small symbols in bits turns strings into integers. DNA has 4 letters, so 2 bits each, and a 10-letter window fits in 20 bits. Sliding the window shifts in 2 new bits and masks off the old ones, giving an exact rolling key with no hash collisions for 'repeated DNA sequences'.",
    "Enumerating subsets of a given set uses `s = (s - 1) & mask`, which jumps directly from one submask to the next smaller one. Enumerating all submasks of all masks costs O(3ⁿ) in total, because each item is either out of the mask, in the mask but not the submask, or in both. This is the basis of the submask DP in pattern 11.",
    "Limits: 2ⁿ grows fast, so masks over all subsets are practical up to n of about 20 (about a million). For n near 40, use meet in the middle. Shifts like `1 << n` overflow a 32-bit int at n = 31; use `1LL << n` in C++.",
  ],
  4: [
    "A power of two has exactly one set bit. n - 1 then flips that bit to 0 and all lower bits to 1, so n & (n - 1) is 0. For any other positive n, the highest set bit survives the subtraction, so the AND is nonzero. The test needs n > 0, because 0 & -1 is also 0.",
    "Power of four adds a position check: the single bit must be at an even index, so n & 0x55555555 must be nonzero (or, equivalently, (n - 1) % 3 == 0 for a power of two). Power of three has no bit trick, but since 3 is prime, n is a power of three exactly when it divides the largest power of three that fits in 32 bits, 3¹⁹ = 1162261467.",
    "Addition without + mirrors a hardware adder. a ^ b adds each bit without carries, and (a & b) << 1 is the carry, which must still be added. Repeating with these two as the new pair terminates because the carry moves one position left each round, so after at most the word size rounds it falls off. In Python, mask to 32 bits and convert back to a signed value at the end, or negative inputs never terminate.",
    "Division without / subtracts shifted copies of the divisor. Find the largest divisor · 2^k that fits, subtract it, add 2^k to the quotient, and continue with smaller k. That is O(log n) steps of O(1) work (or O(log² n) if you re-search k each time). Watch the one overflowing case: -2³¹ / -1 does not fit in 32 bits, and problems say to return 2³¹ - 1. Working with negative numbers avoids overflow on the way.",
    "These tricks matter less for speed than for understanding: they show how arithmetic is built from bit operations, and they come up when a problem forbids the usual operators or when a power-of-two test is needed inside a bigger algorithm (segment tree sizes, Fenwick indexes).",
  ],
  5: [
    "Prefix XOR is prefix sums with XOR in place of addition. Let X[i] be the XOR of the first i elements. The XOR of a[l..r] is X[r + 1] ^ X[l], because the first l elements appear in both and cancel. XOR is its own inverse, so no subtraction is needed, and the table answers each range query in O(1) after O(n) work.",
    "Counting subarrays with XOR equal to k works like 'subarray sum equals k': walking from left to right, the current prefix X pairs with every earlier prefix equal to X ^ k. A hash map of how many times each prefix value appeared gives the count in O(n).",
    "Count triplets with equal XOR: a ^ b = 0 is the same as a = b, so the condition on (i, j, k) is that xor(i..k) is 0, which is X[i] == X[k + 1], and then every j between i + 1 and k works, giving k - i triplets. Summing k - i over equal pairs of prefixes can be done in O(n) by keeping, for each prefix value, its count and the sum of its indices.",
    "Bitwise AND of a range [m, n] keeps only the bits that never change between m and n. Every bit below the highest differing bit takes both values somewhere in the range, so it becomes 0. The result is the common binary prefix of m and n followed by zeros: shift both right until they are equal, then shift back. An equivalent loop clears the lowest set bit of n while n > m.",
    "The pattern generalises: any operation that is associative and has an inverse (addition, XOR, multiplication modulo a prime) supports prefix tables. Operations without an inverse (AND, OR, max) need sparse tables or segment trees for arbitrary ranges, or a special argument like the common prefix one.",
  ],
  6: [
    "Euclid's algorithm rests on one fact: a number divides both a and b exactly when it divides both b and a mod b, since a mod b = a - q · b. So the pair (a, b) and the pair (b, a mod b) have the same common divisors, and the same greatest one. The second number strictly decreases, and when it reaches 0, gcd(a, 0) = a.",
    "Speed: after two steps the first number is at least halved (if b ≤ a / 2, then a mod b < b ≤ a / 2; otherwise a mod b = a - b < a / 2). So the number of steps is O(log min(a, b)). The worst inputs are consecutive Fibonacci numbers, where every quotient is 1.",
    "The extended version also finds x and y with a · x + b · y = gcd(a, b) (Bezout's identity). When gcd(a, m) = 1, x is the modular inverse of a modulo m, which is how you divide in modular arithmetic when the modulus is not prime. The water jug problem is Bezout in disguise: the measurable amounts are exactly the multiples of gcd(x, y) up to x + y.",
    "LCM is a / gcd(a, b) · b, dividing first so the intermediate value does not overflow. For a whole array, fold: g = gcd(g, x) for every element (gcd(0, x) = x makes 0 a convenient start). 'X of a kind in a deck of cards' asks whether the gcd of all the counts is at least 2.",
    "Strings have a gcd too. If s + t == t + s, both are repetitions of one base string, and the longest common base has length gcd(len(s), len(t)); otherwise there is none. The check s + t == t + s is both necessary and sufficient.",
  ],
  7: [
    "The sieve works because every composite number c has a prime factor at most √c: if c = p · q with both factors above √c, their product would exceed c. So crossing out the multiples of every prime p ≤ √n marks every composite up to n, and what remains are exactly the primes.",
    "Starting at p² is safe: any smaller multiple k · p with k < p has a prime factor of k smaller than p, so it was already crossed out. The total work is the sum of n / p over primes p up to √n, which is O(n log log n), practically linear.",
    "A variant stores the smallest prime factor (spf) of every number instead of a yes or no. Then any number up to n can be factorised in O(log n) by dividing by spf repeatedly, which is the tool for problems with many factorisation queries. The linear sieve computes spf in exactly O(n) by crossing out each composite once, from its smallest prime factor.",
    "For primes in a range [L, R] with R up to about 10¹² and R - L up to about 10⁶, use a segmented sieve: find the primes up to √R with an ordinary sieve, then cross out their multiples inside [L, R] only. A single primality check on its own is trial division up to √n.",
    "Related problems. Prime arrangements counts p primes up to n and answers p! · (n - p)! modulo 10⁹ + 7. 'Prime number of set bits' only needs primes up to 32, so a small fixed set beats any sieve. Ugly numbers are not a sieve problem: ugly II merges the three sequences 2 · u, 3 · u and 5 · u with three pointers.",
  ],
  8: [
    "Fast exponentiation uses the binary digits of the exponent. Write n = sum of 2^i over its set bits; then aⁿ is the product of a^(2^i) over those bits, and each a^(2^i) is the square of the previous one. So about log₂ n squarings and at most as many multiplications compute the power, instead of n - 1 multiplications.",
    "A clean invariant proves the loop correct: res · base^e always equals aⁿ. At the start res = 1, base = a, e = n. If e is odd, moving one factor of base into res keeps it true; squaring base and halving e also keeps it true. When e reaches 0, res = aⁿ.",
    "Under a modulus, reduce after every multiplication; in C++ use 64-bit products for 32-bit moduli (values below 10⁹ + 7 multiply to below 2⁶³). Python's built-in `pow(a, n, m)` does the same. Super pow, where the exponent is a huge list of digits, uses a^(10x + d) = (a^x)^10 · a^d, processing one digit at a time.",
    "Matrix exponentiation applies the same squaring to matrices: a linear recurrence like Fibonacci, F(n + 1) = F(n) + F(n - 1), is one 2 × 2 matrix raised to the n-th power, so F(n) mod m takes O(log n) matrix products. Any k-term linear recurrence works with a k × k matrix in O(k³ log n).",
    "Edge cases: a negative exponent means computing (1 / x)^(-n), and in 32-bit languages -n overflows for n = -2³¹, so use a 64-bit copy. Count good numbers is 5^(ceil(n / 2)) · 4^(floor(n / 2)) modulo 10⁹ + 7 with n up to 10¹⁵, which only fast power can handle.",
  ],
  9: [
    "A non-negative integer is x = sum of d_i · 10^i. x % 10 reads the last digit and x // 10 removes it, so a loop peels digits from right to left in O(number of digits). Rebuilding with rev = rev · 10 + d pushes digits on from the right, which reverses their order.",
    "Overflow must be checked before it happens in fixed-width languages: rev · 10 + d exceeds 2³¹ - 1 exactly when rev > (2³¹ - 1 - d) / 10. In Python numbers never overflow, so compute and compare at the end, which is what the template does. The palindrome check avoids the issue by reversing only half the digits and comparing the halves.",
    "Negative numbers differ by language. Python's // and % round toward minus infinity (-7 % 10 is 3), while C++ and Java truncate toward zero (-7 % 10 is -7). Work with the absolute value and the sign separately to get the same result everywhere.",
    "Bases other than 10 follow the same loop. Excel columns are base 26 without a zero digit (A to Z stand for 1 to 26), so subtract 1 before taking % 26 when converting to a title. String to integer (atoi) is a small state machine: skip spaces, read one optional sign, read digits, stop at the first non-digit, and clamp to the 32-bit range.",
    "Grade-school arithmetic on strings handles numbers too big for any type: add strings from the right with a carry, multiply strings by adding a_i · b_j into position i + j + 1 of a result array and normalising carries at the end, O(m · n). Add digits has a closed form, the digital root 1 + (n - 1) % 9 for n > 0.",
  ],
  10: [
    "Repeatedly applying a function f to a value in a finite set must eventually repeat a value (pigeonhole), and after the first repeat it cycles forever. The path looks like the letter rho: a tail of length μ, then a cycle of length λ. Happy numbers are bounded because a number with d digits maps to at most 81 · d, so values quickly fall below a few hundred.",
    "Floyd's algorithm moves a slow pointer one step and a fast pointer two steps. Once both are on the cycle, the gap between them shrinks by one each step, so they meet within λ steps. They never skip past each other, so the meeting is guaranteed and needs only O(1) memory, compared with a hash set that stores every value seen.",
    "Finding where the cycle starts: at the meeting, slow has taken k steps and fast 2k, and the difference k is a multiple of λ. Put one pointer back at the start and move both one step at a time. After μ steps the restarted pointer reaches the cycle entry, and the other pointer, which is k + μ steps along, is also at the entry because k is a multiple of λ. So they meet exactly there.",
    "Find the duplicate number treats the array as a function i to nums[i]. With values in 1..n and n + 1 slots, index 0 is never a target, so it lies on the tail, and the duplicated value has two incoming arrows, which makes it the entry of the cycle. Floyd finds it without modifying the array and with O(1) extra space.",
    "Not every number property is a cycle problem. Ugly numbers divide out 2, 3 and 5 and check that 1 remains (0 is not ugly). Ugly number II generates the sequence with three pointers, each marking the next ugly number to multiply by 2, 3 or 5, which is a three-way merge in O(n). Add digits has a closed form.",
  ],
};

/* ---------- visualisers for the new patterns (real runs, one frame per step) ---------- */

function sosViz(a = [3, 1, 4, 1, 5, 9, 2, 6]): Diagram {
  const n = 3, F = a.slice(0, 1 << n), cols: (string | number | null)[][] = F.map((v, m) => [bin(m, n).join(""), v, null, null, null]);
  const frames: TableFrame[] = [{ note: `F starts as a. Goal: F[mask] = sum of a over every submask of mask. Process one bit at a time`, cells: cols.map((r) => [...r]) }];
  for (let i = 0; i < n; i++) {
    for (let m = 0; m < 1 << n; m++) {
      if ((m >> i) & 1) { const from = m ^ (1 << i); F[m] += F[from]; frames.push({ note: `bit ${i}: mask ${bin(m, n).join("")} has it, so add F[${bin(from, n).join("")}] = ${F[from]}. F[${bin(m, n).join("")}] = ${F[m]}`, cells: cols.map((r, k) => { const row = [...r]; row[2 + i] = k <= m || !((k >> i) & 1) ? F[k] : null; return row; }), active: [m, 2 + i], deps: [[from, 2 + i]] }); }
    }
    cols.forEach((r, k) => (r[2 + i] = F[k]));
  }
  frames.push({ note: `Done: F[111] = ${F[7]} = sum of all of a. ${n} bits × 2ⁿ masks = O(n · 2ⁿ), versus O(3ⁿ) for listing submasks of every mask`, cells: cols.map((r) => [...r]), active: [7, 4] });
  return { kind: "table", title: "SOS DP: subset sums, one bit at a time", rowHead: F.map((_, m) => String(m)), colHead: ["mask", "a", "after bit 0", "after bit 1", "after bit 2"], frames };
}

function invViz(n = 6, p = 13): Diagram {
  const fact = [1], inv: number[] = Array(n + 1).fill(0), rows: (string | number | null)[][] = Array.from({ length: n + 1 }, (_, i) => [i, null, null]), frames: TableFrame[] = [];
  for (let i = 0; i <= n; i++) { if (i) fact[i] = (fact[i - 1] * i) % p; rows[i][1] = fact[i]; frames.push({ note: i ? `fact[${i}] = fact[${i - 1}] · ${i} mod ${p} = ${fact[i]}` : `fact[0] = 1. Work modulo the prime ${p}`, cells: rows.map((r) => [...r]), active: [i, 1] }); }
  let r = 1, b = fact[n], e = p - 2; while (e) { if (e & 1) r = (r * b) % p; b = (b * b) % p; e >>= 1; }
  inv[n] = r; rows[n][2] = r;
  frames.push({ note: `Fermat: a^(p-2) is the inverse of a mod p. inv_fact[${n}] = ${fact[n]}^${p - 2} mod ${p} = ${r} (check: ${fact[n]} · ${r} mod ${p} = ${(fact[n] * r) % p})`, cells: rows.map((x) => [...x]), active: [n, 2] });
  for (let i = n; i > 0; i--) { inv[i - 1] = (inv[i] * i) % p; rows[i - 1][2] = inv[i - 1]; frames.push({ note: `inv_fact[${i - 1}] = inv_fact[${i}] · ${i} mod ${p} = ${inv[i - 1]}: one multiplication, no second power`, cells: rows.map((x) => [...x]), active: [i - 1, 2], deps: [[i, 2]] }); }
  const k = 2, c = (((fact[n] * inv[k]) % p) * inv[n - k]) % p;
  frames.push({ note: `C(${n}, ${k}) = fact[${n}] · inv_fact[${k}] · inv_fact[${n - k}] mod ${p} = ${c} (${(n * (n - 1)) / 2} mod ${p} = ${((n * (n - 1)) / 2) % p}). O(1) per query after O(n)`, cells: rows.map((x) => [...x]), active: [n, 1], deps: [[k, 2], [n - k, 2]] });
  return { kind: "table", title: `Factorials and inverse factorials modulo ${p}`, rowHead: Array.from({ length: n + 1 }, (_, i) => String(i)), colHead: ["i", "i! mod p", "(i!)⁻¹ mod p"], frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 11, name: "Submask enumeration and SOS DP", summary: "Walk every submask of a mask with s = (s - 1) & mask. To sum over all submasks of every mask at once, sum over subsets (SOS) DP adds one bit at a time in O(n · 2ⁿ).",
    signals: ["for every mask, combine values of all its submasks (or supermasks)", "split a set of n ≤ 16 items into groups, dp over submasks", "count pairs whose masks do not overlap (a & b == 0)", "words or numbers as letter or bit masks, n up to 20"],
    idea: ["(s - 1) & mask is the next smaller submask: subtracting 1 clears the lowest set bit of s and sets all bits below it, and & mask drops the bits outside mask.", "SOS DP: process bit i; every mask with bit i set adds the value of the same mask without bit i. After all n bits, F[mask] = sum of a[s] over all submasks s.", "Disjoint pairs: b fits with a exactly when b is a submask of the complement of a, so one SOS table answers all of them."],
    steps: ["submasks: s = mask; loop: use s; if s == 0 stop; s = (s - 1) & mask", "SOS: F = a copy", "for i in range(n): for mask: if mask has bit i: F[mask] += F[mask ^ (1 << i)]", "supersets: same loop with F[mask ^ (1 << i)] += F[mask] for masks WITHOUT bit i"],
    code: `def submasks(mask):                  # every submask, largest first, then 0
    s = mask
    while True:
        yield s
        if s == 0: return
        s = (s - 1) & mask

def sos(a, n):                       # F[mask] = sum of a[s] over submasks s
    F = a[:]
    for i in range(n):
        for mask in range(1 << n):
            if mask >> i & 1:
                F[mask] += F[mask ^ (1 << i)]
    return F`,
    complexity: { best: "O(n · 2ⁿ)", average: "O(n · 2ⁿ)", worst: "O(n · 2ⁿ)", space: "O(2ⁿ)", note: "SOS DP. Enumerating the submasks of every mask directly is O(3ⁿ) in total; one mask with k set bits has 2^k submasks." },
    traps: ["The loop must include s = 0 exactly once: test for 0 after using s, or the empty submask is skipped (or the loop never ends).", "Bit loop OUTSIDE, mask loop inside. Swapping them adds some submasks more than once.", "For 'sum over supersets', iterate the same way but add from mask | (1 << i) into masks without bit i."],
    viz: { make: (i) => sosViz(nums(i, [3, 1, 4, 1, 5, 9, 2, 6], 8).map((x) => Math.round(x)).concat(Array(8).fill(0)).slice(0, 8)), input: "3, 1, 4, 1, 5, 9, 2, 6", label: "8 values a[0..7] (masks 000 to 111)" },
    theory: [
      "Why (s - 1) & mask visits every submask in decreasing order. Treat the bits of mask as the only digits that exist, and squeeze them together into a k-bit number. Subtracting 1 from s and keeping only mask's bits behaves exactly like subtracting 1 from that k-bit number. So the loop counts down from mask to 0 through all 2^k submasks, each once.",
      "Total cost of enumerating the submasks of every mask is O(3ⁿ), not O(4ⁿ). Each of the n items is in one of three situations: outside the mask, in the mask but not the submask, or in both. Every pair (mask, submask) is one such choice per item, giving 3ⁿ pairs. For n = 16 that is about 43 million, fine; for n = 20 it is 3.5 billion, too slow, which is where SOS DP helps.",
      "SOS DP correctness. After processing bits 0..i, F[mask] holds the sum of a[s] over submasks s of mask that agree with mask on every bit above i. Processing bit i + 1 for a mask that has it adds the masks that differ only in that bit being 0, which extends the agreement to one fewer bit. After all n bits, no agreement is required, so F[mask] sums over all submasks. Each mask is touched once per bit: O(n · 2ⁿ).",
      "Uses. Count pairs (a, b) with a & b == 0: build cnt[mask], run SOS, then for each a add F[complement of a]. Maximum product of word lengths can store the longest word per mask, run SOS with max instead of sum, and look up the complement of each word's mask. Partitioning n ≤ 16 tasks into groups (work sessions, k equal subsets) runs dp over masks where each step removes one valid submask group, the O(3ⁿ) enumeration.",
      "The reverse direction, sum over supersets, uses the same loop with the roles swapped, and subtracting instead of adding inverts the transform (Möbius inversion), which turns 'sum over submasks' back into the original values. Max and min also work, since they are associative, but they cannot be inverted.",
      "This is bitmask enumeration (pattern 3) made efficient, and it is the inner loop of many bitmask DPs (DP pattern 8). Recognise it when n is at most about 20 and the question combines information across subsets of a mask.",
    ],
  },
  {
    n: 12, name: "Modular inverse and nCr", summary: "Dividing modulo a prime p means multiplying by an inverse: a⁻¹ = a^(p-2) mod p (Fermat). Precompute factorials and inverse factorials once, then C(n, k) is three multiplications.",
    signals: ["count ways modulo 10⁹ + 7 with a formula containing a division", "C(n, k) for n up to 10⁵ or 10⁶, many queries", "arrangements with repeated items: n! / (a! b! …)", "probability or expected value modulo a prime"],
    idea: ["Fermat's little theorem: for a prime p and a not divisible by p, a^(p-1) ≡ 1, so a · a^(p-2) ≡ 1. The inverse is one fast power.", "fact[i] = fact[i - 1] · i. Compute inv_fact[n] = fact[n]^(p-2) once, then inv_fact[i - 1] = inv_fact[i] · i, going down.", "C(n, k) = fact[n] · inv_fact[k] · inv_fact[n - k] mod p, or 0 when k is outside 0..n."],
    steps: ["MOD = 10⁹ + 7 (prime)", "fact[0..N] forward", "inv_fact[N] = pow(fact[N], MOD - 2, MOD); then backward", "C(n, k) in O(1)"],
    code: `MOD = 10**9 + 7
def pow_mod(a, e, m=MOD):
    r, a = 1, a % m
    while e:
        if e & 1: r = r * a % m
        a = a * a % m
        e >>= 1
    return r

class Binom:
    def __init__(self, n):
        self.f = [1] * (n + 1)
        for i in range(1, n + 1):
            self.f[i] = self.f[i - 1] * i % MOD
        self.inv = [1] * (n + 1)
        self.inv[n] = pow_mod(self.f[n], MOD - 2)   # Fermat inverse
        for i in range(n, 0, -1):
            self.inv[i - 1] = self.inv[i] * i % MOD
    def C(self, n, k):
        if k < 0 or k > n: return 0
        return self.f[n] * self.inv[k] % MOD * self.inv[n - k] % MOD`,
    complexity: { best: "O(1)", average: "O(1)", worst: "O(1)", space: "O(N)", note: "Per query, after O(N + log p) precomputation. Computing each inverse with its own power instead would cost O(log p) per value." },
    traps: ["Fermat needs a prime modulus and a value not divisible by it; for other moduli use the extended Euclidean algorithm, and an inverse exists only when gcd(a, m) = 1.", "Never reduce first and divide after: (n! mod p) / (k! mod p) with integer division is wrong.", "In C++ multiply in 64 bits: two values below 10⁹ + 7 overflow a 32-bit int but fit in a long long."],
    viz: { make: (i) => invViz(Math.max(3, Math.min(10, Math.round(nums(i, [6])[0])))), input: "6", label: "n (3 to 10), modulo 13" },
    theory: [
      "In modular arithmetic, addition, subtraction and multiplication can be reduced at every step, but division cannot: 6 / 2 = 3, yet (6 mod 4) / (2 mod 4) = 1. What replaces division by b is multiplication by an inverse, a number b⁻¹ with b · b⁻¹ ≡ 1 (mod p). It exists exactly when gcd(b, p) = 1, which for a prime p means b is not a multiple of p.",
      "Fermat's little theorem gives the inverse for a prime p: b^(p-1) ≡ 1 (mod p) when p does not divide b, so b^(p-2) is the inverse. With fast exponentiation that is about 30 squarings for p = 10⁹ + 7. For a non-prime modulus, the extended Euclidean algorithm finds x with b · x + m · y = 1, and x mod m is the inverse.",
      "Why the backward loop for inverse factorials works: inv_fact[i - 1] = 1 / (i - 1)! = i / i! = inv_fact[i] · i. So after one Fermat power for inv_fact[N], every other inverse factorial costs one multiplication. All inverses of 1..N can also be read off: 1 / i = inv_fact[i] · fact[i - 1].",
      "With these tables C(n, k) is three multiplications. Related counts follow: arrangements of a multiset are n! times the inverse factorials of each group's size; stars and bars is C(n + k - 1, k - 1); Catalan numbers are C(2n, n) · inv(n + 1). Probabilities 'modulo a prime' are numerator times inverse of denominator, computed the same way.",
      "Pitfalls. Precompute up to the largest n you will query (often 2N for Catalan or path counts). Lucas's theorem is needed when n can be as large as p or larger, because then n! is 0 mod p. In C++ every product of two residues must be done in 64 bits. Prime arrangements (count primes p up to n, answer p! · (n - p)!) needs only factorials, no inverses.",
      "Choose between this and Pascal's triangle (DP pattern 12) by size: Pascal needs no inverses and works for any modulus but costs O(n²) memory and time; factorials with inverses cost O(n) and need a prime modulus. Both rely on fast exponentiation and gcd from earlier patterns in this topic.",
    ],
  },
];

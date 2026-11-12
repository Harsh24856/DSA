// Deeper theory for the "string" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import * as S from "../../sim";
import { text, type Pattern } from "../types";

const { range } = S;

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "The palindrome check is correct because a string is a palindrome exactly when s[i] equals s[n - 1 - i] for every i below n / 2. Two pointers walk those pairs in order. The skipping loops only change which characters count; the pairing argument is the same once ignored characters are removed.",
    "Valid Palindrome II (delete at most one character) needs one more idea. Before the first mismatch every pair matched, so those characters can stay. At the mismatch, one of s[L] or s[R] must go, and nothing else may: try both, each as a plain palindrome check on the inner part. That is two O(n) checks, so O(n) overall, instead of trying all n deletions.",
    "Recognise the inward version by symmetry questions: palindromes, reversing words or vowels in place, comparing from both ends. The read and write version (same direction) is for filtering in place: remove characters, compress runs ('aaabb' to 'a3b2'), or apply backspaces. The writer never passes the reader, so overwriting is safe.",
    "Backspace String Compare is cleanest from the right: walk each string backwards with a skip counter, so a '#' tells you how many characters to ignore before the next real one. That gives O(1) extra space, where building both strings with a stack costs O(n).",
    "Complexity is O(n) time and O(1) extra space. In Python, the readable alternative cleaned = [c.lower() for c in s if c.isalnum()] followed by cleaned == cleaned[::-1] is O(n) space; fine to mention, but interviewers who ask for this problem usually want the pointer version.",
    "Edge cases: an empty or all-punctuation string (a palindrome), a single character, and mixed case. The common bug is leaving out the L < R guard inside the skip loops, which lets a pointer run off the end when the string has no alphanumerics.",
  ],
  2: [
    "A string window works exactly like an array window: grow on the right, shrink from the left, and keep a count of what is inside. What makes it a string pattern is the state. A 26 or 128 slot count array, or a map from character to count, lets each add and remove cost O(1).",
    "Minimum Window Substring keeps one extra number: how many distinct required characters currently have enough copies. It goes up by one at the moment a count reaches its need and down by one at the moment it drops below. Testing have == len(need) is then O(1), instead of comparing whole count arrays on every step.",
    "Why shrinking is safe for the minimum window: once [L, R] contains everything, any window that starts at L and ends after R is longer, so the best window starting at L has been found. L can move on. For the longest-window problems the mirror argument holds: once [L, R] is invalid, every window that starts at L and ends later is invalid too.",
    "Longest Repeating Character Replacement has a neat twist. The window is valid while its length minus the count of its most common letter is at most k. The stored maximum count never needs to decrease: a smaller maximum could only give a shorter window than one already found, so a stale maximum never produces a wrong larger answer.",
    "Complexity: O(n + m) time, since each index enters and leaves once and t is counted once. Space is O(alphabet). When the alphabet is unknown or large, a dictionary replaces the array with the same bounds on average.",
    "Edge cases: t longer than s, repeated characters in t (need counts, not a set), and characters in s that t does not use (they still enter the window but never change 'have'). For exactly-k-distinct questions, compute atMost(k) - atMost(k - 1) rather than fighting a window that is not monotonic.",
  ],
  3: [
    "Two strings are anagrams exactly when they use every letter the same number of times, because rearranging letters changes their order but not their counts. So the count vector is a complete signature: equal vectors mean anagrams, and different vectors mean not.",
    "For grouping, the signature has to be hashable. The sorted word costs O(k log k) per word; a tuple of 26 counts costs O(k + 26). Both work as dictionary keys, and the count tuple is faster for long words.",
    "Find All Anagrams slides a window of fixed length m over s. Moving the window changes one count up and one count down, so the window's vector stays current in O(1). Comparing two 26 vectors is O(26), a constant. A refinement keeps a 'matches' counter of letters whose counts agree, updated only for the two letters that changed, which brings each step to O(1).",
    "Recognise it by 'rearrange', 'permutation of', 'same letters', 'ransom note', 'first unique character' or 'isomorphic'. The last two use counts or position maps rather than full anagram checks. Isomorphic Strings needs maps in both directions, because two letters must not map to the same letter.",
    "Complexity: O(n x 26) for the plain sliding window, O(n) with the matches counter; grouping n words of length k is O(n x k). Space is O(26) per signature.",
    "Edge cases: uppercase letters or Unicode break a 26 array (use a Counter or a 128 array), the pattern can be longer than the text, and in Python a list cannot be a dict key (convert to a tuple). Off-by-one errors usually come from removing s[i - m + 1] instead of s[i - m].",
  ],
  4: [
    "Every palindrome is symmetric around its centre, and the centre is either a character (odd length) or the gap between two characters (even length). A string of length n has n + (n - 1) = 2n - 1 centres. If s[L..R] is a palindrome, then s[L - 1..R + 1] is one exactly when s[L - 1] == s[R + 1], so growing outward from each centre finds every palindrome around it.",
    "That is also the proof that expand around centre finds the longest palindrome: the longest one has some centre, and expansion from that centre reaches its full length. Counting palindromic substrings is the same loop with a counter that increases on every successful expansion step.",
    "Complexity: 2n - 1 centres and up to n / 2 expansion steps each, O(n²) in the worst case (a string of one repeated letter) and O(n) when no neighbours match. Space is O(1). Manacher's algorithm reuses mirror information to reach O(n); it is its own pattern below.",
    "The DP view: pal[i][j] = (s[i] == s[j]) and (j - i < 2 or pal[i + 1][j - 1]). It is O(n²) time and space, so worse than expansion for a single query, but it answers 'is s[i..j] a palindrome?' in O(1) afterwards. Palindrome Partitioning uses it inside backtracking, and Palindrome Partitioning II uses it inside a cut-count DP. Fill it by increasing length, or with i running from the end.",
    "Longest palindromic SUBSEQUENCE is a different problem: characters need not be contiguous, so expansion does not apply. It is the LCS of s and its reverse, or an interval DP on [i, j]. Mixing the two up is a classic interview mistake.",
    "Edge cases: an empty string, a single character, all characters equal, and even-length answers. Leaving out the even centres is the most common bug and fails on inputs like 'abba' or 'cbbd'.",
  ],
  5: [
    "KMP's failure table lps[i] is the length of the longest proper prefix of p[0..i] that is also a suffix of it. When a mismatch happens after matching j characters, those j text characters equal p[0..j-1]. The next possible alignment that still agrees with everything already read is the one where a prefix of p lines up with the end of that matched block, and the longest such prefix is lps[j - 1]. So j falls back to lps[j - 1] and the text pointer never moves backwards.",
    "The table is built by running the same matching logic on the pattern against itself. k is the length of the current border; if p[i] extends it, k grows by one, otherwise k falls back through shorter borders (k = lps[k - 1]) until it can be extended or reaches 0.",
    "Why O(n + m): in the search loop j increases by at most one per text character, and every fallback decreases j by at least one. j never goes below 0, so the total number of fallbacks is at most the total number of increases, which is at most n. The same argument bounds the table build by O(m).",
    "Rabin-Karp hashes each window of length m and compares hashes first. A rolling hash updates in O(1) when the window moves, so the expected time is O(n + m). It shines when you compare many substrings of the same length, as in Repeated DNA Sequences or binary search on a duplicated substring length. The Z-function is a third linear method; all three are covered as their own patterns.",
    "Recognise string matching by 'first occurrence', 'count occurrences', 'is s a repetition of a block', 'rotation of' (search b in a + a) and 'shortest palindrome by adding in front' (lps of s + '#' + reverse(s)). Repeated Substring Pattern follows from the table: with L = lps[n - 1], s is a repetition exactly when L > 0 and n % (n - L) == 0.",
    "Edge cases: an empty pattern (by convention found at 0), a pattern longer than the text, and all-equal strings, which are exactly where naive matching becomes O(n x m). The common bug in KMP is using 'if' instead of 'while' for the fallback, which misses shorter borders.",
  ],
  6: [
    "Parsing problems are small state machines. Write the states first, for atoi: leading spaces, an optional sign, digits, then stop. Each state is a short loop that consumes what belongs to it and hands over to the next. The code is correct when every character is handled by exactly one state, which is easy to check when the states are separate loops.",
    "Overflow must be caught before it happens in fixed-width languages. Either keep the value in a wider type and clamp at the end (stopping once it is clearly too large), or test x > (INT_MAX - d) / 10 before computing x * 10 + d. Python integers do not overflow, but the problem still asks for clamping to 32 bits.",
    "Digit arithmetic on strings mirrors arithmetic on paper. Add Strings and Add Binary walk both numbers from the right with a carry. Multiply Strings places the product of digits i and j at positions i + j and i + j + 1 of a result array, then resolves carries; that is O(a x b).",
    "Recognise parsing by input that is text with a grammar: numbers with signs, Roman numerals, version strings, expressions, file paths, or text layout. Roman to Integer subtracts a symbol when a larger one follows it. Compare Version Numbers splits on '.', compares parts as integers and treats missing parts as 0. Text Justification is a pure simulation: greedily fill each line, then distribute spaces with the remainder going to the leftmost gaps.",
    "Complexity is O(n) for a single pass parser. The risk is never speed; it is a missed case. Before coding, list the edge inputs: empty string, only spaces, a sign with no digits, leading zeros, and the exact boundary values such as -2147483648.",
    "When the grammar has nesting (parentheses, brackets), a plain state machine is not enough: add a stack, which turns the problem into expression evaluation. When it is flat, resist the urge to use split and regex for everything; the step-by-step version is easier to reason about under interview pressure.",
  ],
};

/* ---------- visualisers for the new patterns ---------- */

function zViz(s: string): Diagram {
  const n = s.length, chars = s.split(""), z: number[] = Array(n).fill(0), shown: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [];
  if (n) { z[0] = n; shown[0] = n; }
  frames.push({ note: `z[0] = ${n} by convention: the whole string matches itself. [l, r) will track the rightmost window known to equal a prefix.`, rows: [chars, [...shown]], tones: { "1:0": "done" } });
  let l = 0, r = 0;
  for (let i = 1; i < n; i++) {
    const inside = i < r, l0 = l, r0 = r;
    if (inside) z[i] = Math.min(r - i, z[i - l]);
    const start = z[i];
    while (i + z[i] < n && s[z[i]] === s[i + z[i]]) z[i]++;
    const ext = z[i] - start;
    if (i + z[i] > r) { l = i; r = i + z[i]; }
    shown[i] = z[i];
    const head = inside ? `i = ${i} lies inside [${l0}, ${r0}): the mirror z[${i - l0}] gives a head start of ${start}` : `i = ${i} is outside the window: compare from scratch`;
    const tail = ext ? `, then ${ext} new comparison${ext > 1 ? "s" : ""} match` : ", no new character matches";
    frames.push({ note: `${head}${tail}. z[${i}] = ${z[i]}${z[i] ? `: s[${i}..${i + z[i] - 1}] equals the prefix "${s.slice(0, z[i])}"` : ""}.`, rows: [chars, [...shown]], tones: { ...range(0, z[i] - 1, 0, "window"), ...range(i, i + z[i] - 1, 0, "found"), [`1:${i}`]: "active" } });
  }
  frames.push({ note: "Each comparison either fails once per i or pushes r right, and r never moves back, so the whole table costs O(n).", rows: [chars, [...shown]], tones: range(0, n - 1, 1, "done") });
  return { kind: "cells", title: "Z-function: longest prefix match at every position", rowLabels: ["s", "z"], rows: [chars, Array(n).fill("")], frames };
}

function rabinKarpViz(t: string, p: string): Diagram {
  const B = 31, M = 101, n = t.length, m = p.length, chars = t.split(""), frames: CellsFrame[] = [];
  const v = (c: string) => c.charCodeAt(0) - 96;
  let high = 1;
  for (let i = 0; i < m - 1; i++) high = (high * B) % M;
  let hp = 0, hw = 0;
  for (let i = 0; i < m; i++) { hp = (hp * B + v(p[i])) % M; hw = (hw * B + v(t[i])) % M; }
  frames.push({ note: `Hash = digits in base ${B} mod ${M}, with a = 1, b = 2, ... Pattern "${p}" hashes to ${hp}. First window "${t.slice(0, m)}" hashes to ${hw}.`, rows: [chars], tones: range(0, m - 1) });
  const found: number[] = [];
  for (let i = 0; i + m <= n; i++) {
    const w = t.slice(i, i + m), same = hw === hp, real = same && w === p;
    if (real) found.push(i);
    const note = same ? (real ? `"${w}": hash ${hw} equals ${hp}, compare the letters: a real match at ${i}.` : `"${w}": hash ${hw} equals ${hp}, but the letters differ: a collision, rejected by the check.`) : `"${w}": hash ${hw} is not ${hp}, skip without comparing letters.`;
    const next = i + m < n ? ` Roll: remove '${t[i]}', shift, add '${t[i + m]}'.` : "";
    frames.push({ note: note + next, rows: [chars], tones: { ...range(i, i + m - 1, 0, real ? "found" : same ? "bad" : "window"), ...Object.fromEntries(found.filter((f) => f !== i).map((f) => [`0:${f}`, "done" as Tone])) } });
    if (i + m < n) hw = (((hw - (v(t[i]) * high) % M + M) % M) * B + v(t[i + m])) % M;
  }
  frames.push({ note: found.length ? `Matches at ${found.join(", ")}. Each roll is O(1), so the scan is O(n + m) on average.` : `No match. Each roll is O(1), so the scan is O(n + m) on average.`, rows: [chars], tones: Object.fromEntries(found.flatMap((f) => Object.keys(range(f, f + m - 1)).map((k) => [k, "found" as Tone]))) });
  return { kind: "cells", title: `Rabin-Karp: rolling hash search for "${p}"`, rows: [chars], frames };
}

function manacherViz(s: string): Diagram {
  const t = ["^", "#", ...s.split("").flatMap((c) => [c, "#"]), "$"], n = t.length, p: number[] = Array(n).fill(0), shown: (string | number)[] = Array(n).fill(""), frames: CellsFrame[] = [];
  frames.push({ note: `Insert '#' between letters so every palindrome has odd length; '^' and '$' stop expansion at the ends. p[i] = radius around t[i] = its length in "${s}".`, rows: [t, [...shown]] });
  let c = 0, r = 0;
  for (let i = 1; i < n - 1; i++) {
    const inside = i < r, c0 = c, r0 = r;
    if (inside) p[i] = Math.min(r - i, p[2 * c - i]);
    const start = p[i];
    while (t[i + p[i] + 1] === t[i - p[i] - 1]) p[i]++;
    if (i + p[i] > r) { c = i; r = i + p[i]; }
    shown[i] = p[i];
    const head = inside ? `i = ${i} is inside the palindrome around ${c0} (reaching ${r0}): its mirror ${2 * c0 - i} gives p >= ${start}` : `i = ${i} is beyond the right edge: start from 0`;
    const grow = p[i] - start;
    frames.push({ note: `${head}${grow ? `, then expand ${grow} more` : ", no expansion"}. p[${i}] = ${p[i]}.`, rows: [t, [...shown]], tones: { ...range(i - p[i], i + p[i], 0, "window"), [`0:${i}`]: "active", [`1:${i}`]: "active" } });
  }
  const k = p.indexOf(Math.max(...p)), start = (k - p[k]) >> 1;
  frames.push({ note: `Largest radius ${p[k]} at ${k}: the longest palindrome is "${s.slice(start, start + p[k])}". The right edge only moves forward, so the total work is O(n).`, rows: [t, [...shown]], tones: { ...range(k - p[k], k + p[k], 0, "found"), [`1:${k}`]: "found" } });
  return { kind: "cells", title: "Manacher: palindrome radii in linear time", rowLabels: ["t", "p"], rows: [t, Array(n).fill("")], frames };
}

const letters = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 7, name: "Z-function", summary: "z[i] is the length of the longest prefix of s that starts again at i. A window of the rightmost known match lets most entries start from a mirror value, so the whole array costs O(n).",
    signals: ["find every occurrence of a pattern (z of p + '#' + text)", "how far does each suffix agree with the prefix", "string periods and repeated blocks", "count distinct borders or prefix matches"],
    idea: ["Keep [l, r): the match window that reaches furthest right, where s[l..r-1] equals s[0..r-l-1]. For i inside it, s[i..r-1] equals s[i-l..r-l-1], so z[i] is at least min(r - i, z[i - l]).", "From that head start, compare characters one by one. If the match goes past r, it becomes the new window."],
    steps: ["z = [0] * n; l = r = 0", "for i in 1..n-1: if i < r: z[i] = min(r - i, z[i - l])", "while s[z[i]] == s[i + z[i]]: z[i] += 1", "if i + z[i] > r: l, r = i, i + z[i]"],
    code: `def z_function(s):
    n = len(s)
    z = [0] * n
    l = r = 0                         # [l, r) = rightmost window known to equal a prefix
    for i in range(1, n):
        if i < r:
            z[i] = min(r - i, z[i - l])   # reuse the mirror inside the window
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] > r:
            l, r = i, i + z[i]
    if n:
        z[0] = n
    return z

def find_all(text, p):                # every start of p in text
    z = z_function(p + "\\x00" + text) # the separator is in neither string
    return [i - len(p) - 1 for i in range(len(p) + 1, len(z)) if z[i] == len(p)]`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "Searching p in text is O(n + m) on the joined string." },
    traps: ["The separator must not appear in either string, or a match can run across it.", "z[0] is a convention (n or 0); never use it as a match length by accident.", "Cap the head start at r - i: the mirror value can reach beyond what is known."],
    viz: { make: (i) => zViz(text(i, "aabxaabxcaab", 14)), input: "aabxaabxcaab", label: "string" },
    theory: [
      "Why the head start is valid: inside the window, s[l..r-1] is a copy of s[0..r-l-1]. Position i in the window corresponds to position i - l in the prefix, so the text starting at i agrees with the text starting at i - l at least until r. Whatever z[i - l] says about the prefix therefore holds at i too, but only up to r, because nothing past r is known yet. Hence min(r - i, z[i - l]).",
      "Why it is linear: for each i the inner while loop either fails at once (O(1)) or extends the match past r. Every successful comparison pushes r one step right, and r never moves left and never exceeds n. So all the successful comparisons together are at most n, and the failures are at most one per i. Total O(n).",
      "Pattern search uses the joined string p + sep + text. Any z value in the text part is at most len(p), because the separator stops it, and z[i] == len(p) means the pattern starts there. This gives the same O(n + m) as KMP with arguably simpler code.",
      "Z and KMP carry the same information in different forms: lps tells, for each END position, the longest border; z tells, for each START position, the longest prefix match. Either can be computed from the other in O(n). Pick whichever direction the question talks about. Rotate String is z or KMP on b + sep + a + a.",
      "Periods: s has period d (s[i] == s[i + d] for all valid i) exactly when z[d] == n - d. The smallest such d gives the shortest repeating block; Repeated Substring Pattern asks whether that d divides n and is less than n.",
      "Edge cases: the empty string, all-equal strings (z is n, n-1, ..., 1), and the separator. A common bug is forgetting to start i at 1, which lets z[0] define a window covering the whole string and breaks every later step.",
    ],
  },
  {
    n: 8, name: "Rolling hash (Rabin-Karp)", summary: "Treat a substring as a number in base B modulo M. Sliding the window removes the leading character and appends a new one in O(1), so equal substrings can be found by comparing numbers.",
    signals: ["find a pattern in text in expected O(n + m)", "repeated substrings of a fixed length (DNA sequences)", "longest duplicated substring (binary search on length)", "compare many substrings or subarrays quickly"],
    idea: ["hash(s[i..i+m-1]) = s[i] B^(m-1) + s[i+1] B^(m-2) + ... + s[i+m-1], all mod M. Moving right: subtract s[i] B^(m-1), multiply by B, add s[i+m].", "Equal strings always have equal hashes. Unequal strings rarely do, so a hash hit is confirmed with a direct comparison (or a second hash)."],
    steps: ["hp = hash(p), hw = hash(text[0..m-1])", "for each window i: if hw == hp and text[i:i+m] == p: record i", "roll: hw = ((hw - text[i] x high) x B + text[i+m]) mod M", "high = B^(m-1) mod M, computed once"],
    code: `def rabin_karp(text, p, base=256, mod=1_000_000_007):
    n, m = len(text), len(p)
    if m > n:
        return []
    high = pow(base, m - 1, mod)      # weight of the char that leaves
    hp = hw = 0
    for i in range(m):
        hp = (hp * base + ord(p[i])) % mod
        hw = (hw * base + ord(text[i])) % mod
    out = []
    for i in range(n - m + 1):
        if hw == hp and text[i:i + m] == p:   # confirm: hashes can collide
            out.append(i)
        if i + m < n:                 # roll: drop text[i], add text[i + m]
            hw = ((hw - ord(text[i]) * high) * base + ord(text[i + m])) % mod
    return out`,
    complexity: { best: "O(n + m)", average: "O(n + m)", worst: "O(n x m)", space: "O(1)", note: "The worst case needs a collision at almost every window, which a large prime modulus makes very unlikely." },
    traps: ["In C++ and Java the subtraction can go negative: add M before taking % M.", "Multiply in 64 bits: B x hash must not overflow before the modulo.", "Never trust a hash match without confirming it when wrong answers are costly; use two moduli otherwise."],
    viz: { make: (i) => { const [a, b] = (i ?? "abracadabra abra").trim().split(/\s+/); const t = letters(a ?? "").slice(0, 14) || "abracadabra", p = letters(b ?? "").slice(0, 5) || "abra"; return rabinKarpViz(t, p.length > t.length ? t.slice(0, 2) : p); }, input: "abracadabra abra", label: "text and pattern (letters), separated by a space" },
    theory: [
      "A rolling hash is a positional number system. The window s[i..i+m-1] is written as an m-digit number in base B, reduced mod M. Moving the window one step is the same as removing the top digit, shifting left by one place, and appending a new bottom digit, which is three arithmetic operations regardless of m.",
      "Correctness has two directions. Equal substrings always produce equal hashes, so no real match is ever missed. Different substrings can collide, so every hash hit is followed by a direct comparison. With a random-looking prime modulus near 10^9, the chance that two different strings collide is about 1 in 10^9 per comparison, so the expected number of wasted comparisons is tiny.",
      "Complexity: computing the first hashes is O(m), each roll is O(1), and each confirmed match costs O(m). On ordinary inputs that is O(n + m). An adversary who knows the base and modulus can force collisions at every window, giving O(n x m); a random base or a second modulus defeats that.",
      "Where it beats KMP and Z: when you must compare many substrings of one length against each other rather than against one pattern. Repeated DNA Sequences hashes every 10-letter window into a set. Longest Duplicate Substring binary searches the length and, for each length, looks for any repeated hash, O(n log n). Maximum Length of Repeated Subarray uses the same idea on integer arrays.",
      "Prefix hashes generalise it: store H[i] = hash of s[0..i-1] and powers of B, and the hash of any substring s[l..r-1] is H[r] - H[l] x B^(r-l), mod M. That answers 'are these two substrings equal?' in O(1) after O(n) preprocessing.",
      "Edge cases: an empty pattern, a pattern longer than the text, and characters mapped to 0 (with a = 0, 'a' and 'aa' can hash alike in some schemes, so map letters to 1..26 or use character codes). The classic bug is a negative value after the subtraction in languages where % keeps the sign.",
    ],
  },
  {
    n: 9, name: "Manacher (longest palindrome in O(n))", summary: "Expand around centre, but reuse the mirror image inside the rightmost palindrome found so far. Every palindrome radius is computed in linear total time.",
    signals: ["longest palindromic substring with n up to 10^5 or more", "count all palindromic substrings in O(n)", "O(1) 'is s[i..j] a palindrome?' after preprocessing", "palindrome partitioning where the table is the bottleneck"],
    idea: ["Insert '#' between characters so every palindrome has odd length and one centre. p[i] is the radius around t[i]; it equals the palindrome's length in the original string.", "Keep the palindrome with the rightmost right edge (centre c, edge r). For i < r, the mirror 2c - i already knows its radius, and inside c's palindrome the text around i is the mirror of the text around 2c - i. So p[i] starts at min(r - i, p[2c - i]) and only expands from there."],
    steps: ["t = '^#' + '#'.join(s) + '#$'", "for i: if i < r: p[i] = min(r - i, p[2c - i])", "while t[i + p[i] + 1] == t[i - p[i] - 1]: p[i] += 1", "if i + p[i] > r: c, r = i, i + p[i]"],
    code: `def radii(s):
    t = "^#" + "#".join(s) + "#$"     # gaps become '#', so every palindrome has odd length in t
    p = [0] * len(t)                  # p[i] = radius around t[i] = length of that palindrome in s
    c = r = 0                         # centre and right edge of the rightmost palindrome so far
    for i in range(1, len(t) - 1):
        if i < r:
            p[i] = min(r - i, p[2 * c - i])   # the mirror around c gives a head start
        while t[i + p[i] + 1] == t[i - p[i] - 1]:
            p[i] += 1
        if i + p[i] > r:
            c, r = i, i + p[i]
    return p

def longest_pal(s):
    p = radii(s)
    k = max(range(len(p)), key=p.__getitem__)
    start = (k - p[k]) // 2
    return s[start:start + p[k]]

def count_pal(s):
    return sum((x + 1) // 2 for x in radii(s))`,
    complexity: { best: "O(n)", average: "O(n)", worst: "O(n)", space: "O(n)", note: "The transformed string has 2n + 3 characters; the right edge r only moves forward." },
    traps: ["The sentinels '^' and '$' must differ from each other and from every character, or expansion runs off the ends.", "Cap the mirror value at r - i; past r nothing is known.", "Map back carefully: the start in s is (k - p[k]) // 2."],
    viz: { make: (i) => manacherViz(text(i, "babad", 6)), input: "babad", label: "string (up to 6 characters)" },
    theory: [
      "The mirror argument: suppose the palindrome centred at c spans t[c - R'..c + R'] with right edge r = c + R'. A position i inside it has a mirror j = 2c - i. Because the big palindrome reads the same in both directions, the characters around i are the reverse of the characters around j, as far as the big palindrome reaches. So the palindrome around j, clipped to stay inside the big one, is also a palindrome around i. That is the head start min(r - i, p[j]).",
      "There are three cases. If the mirror palindrome ends strictly inside the big one, p[i] equals p[j] exactly and no expansion succeeds. If it reaches past the big one's left edge, p[i] is exactly r - i, again with no successful expansion. Only when it ends exactly on the edge can p[i] grow, and then every successful step pushes r further right.",
      "Why linear: every successful character comparison in the while loop increases r by one, r only grows, and r is at most the length of t. Unsuccessful comparisons happen once per i. So the total work is O(n). The padding with '#' only doubles n.",
      "Using the radii: the longest palindrome is the largest p[i]. The number of palindromic substrings is the sum of (p[i] + 1) // 2, since a radius of p around one centre contains that many palindromes of the original string. And s[l..r] is a palindrome exactly when the radius at its centre in t (index l + r + 2 with this padding) is at least r - l + 1, an O(1) check after O(n) preprocessing.",
      "When to reach for it: expand around centre is O(n²) and already passes most interview limits for n up to a few thousand. Manacher is the answer when the follow-up asks for linear time, or when an O(n²) palindrome table is the bottleneck inside a larger DP such as minimum palindrome cuts.",
      "Edge cases: an empty string, one character, and all-equal strings (where expand around centre is slowest and Manacher shines). Most bugs are index mapping between t and s; checking 'babad' and 'cbbd' by hand catches nearly all of them.",
    ],
  },
];

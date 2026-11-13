// Overview of the "string" topic: the data structure or technique itself. Shown on /patterns/string before the patterns.
import type { CellsFrame, Diagram, Tone } from "../../diagram";
import { type TopicOverview } from "../types.ts";

const tonesOf = (pairs: [string, Tone][]) => Object.fromEntries(pairs) as Record<string, Tone>;
const words = (s: string | undefined, a: string, b: string): [string, string] => {
  const w = (s ?? "").trim().split(/[\s,]+/).filter(Boolean);
  return w.length >= 2 ? [w[0].slice(0, 9), w[1].slice(0, 9)] : [a, b];
};

/** Lexicographic comparison: walk both strings until the first differing character, else the shorter one is first. */
function compareViz(a: string, b: string): Diagram {
  const frames: CellsFrame[] = [], rows = [a.split(""), b.split("")], n = Math.min(a.length, b.length);
  frames.push({ note: `Compare "${a}" and "${b}" in dictionary order: walk both from index 0 and stop at the first character that differs`, rows });
  let i = 0;
  for (; i < n; i++) {
    const same = a[i] === b[i];
    frames.push({ note: same ? `Index ${i}: '${a[i]}' and '${b[i]}' are equal (code ${a.charCodeAt(i)}), keep going` : `Index ${i}: '${a[i]}' is code ${a.charCodeAt(i)} and '${b[i]}' is code ${b.charCodeAt(i)}. They differ, so this index decides`, rows, tones: tonesOf([...Array(i)].flatMap((_, k) => [[`0:${k}`, "done"], [`1:${k}`, "done"]] as [string, Tone][]).concat([[`0:${i}`, same ? "found" : "active"], [`1:${i}`, same ? "found" : "active"]])), marks: [{ i, label: "i" }] });
    if (!same) break;
  }
  const res = a < b ? -1 : a > b ? 1 : 0;
  const why = i < n ? `'${a[i]}' ${res < 0 ? "<" : ">"} '${b[i]}'` : a.length === b.length ? "every character matched and the lengths are equal" : `one is a prefix of the other, so the shorter one comes first`;
  frames.push({ note: `Result: ${res < 0 ? `"${a}" comes first` : res > 0 ? `"${b}" comes first` : "the strings are equal"}, because ${why}. Later characters and the lengths ${i < n ? "never mattered" : "decided it"}`, rows, tones: i < n ? { [`0:${i}`]: res < 0 ? "found" : "bad", [`1:${i}`]: res < 0 ? "bad" : "found" } : {} });
  frames.push({ note: `The cost is O(min(n, m)) = ${Math.min(i + 1, n)} character comparisons here, not O(1). Sorting k strings therefore costs O(k log k) comparisons of up to L characters each`, rows, tones: tonesOf([...Array(Math.min(i + 1, n))].flatMap((_, k) => [[`0:${k}`, "window"], [`1:${k}`, "window"]] as [string, Tone][])) });
  return { kind: "cells", title: `compare "${a}" and "${b}" = ${res}`, rowLabels: ["a", "b"], rows, frames };
}

/** Anagram check with a count per letter: +1 for each letter of s, -1 for each letter of t, all zero at the end. */
function anagramViz(s: string, t: string): Diagram {
  const letters = [...new Set((s + t).split(""))].sort(), frames: CellsFrame[] = [];
  const count: Record<string, number> = Object.fromEntries(letters.map((c) => [c, 0]));
  const rows = () => [letters, letters.map((c) => count[c])];
  frames.push({ note: `Are "${s}" and "${t}" anagrams? Keep one counter per letter (an array of 26 for a to z; only the letters used are shown)`, rows: rows() });
  if (s.length !== t.length) {
    frames.push({ note: `The lengths differ (${s.length} vs ${t.length}), so they cannot be anagrams. The check stops in O(1)`, rows: rows() });
  }
  for (const [w, d] of [[s, 1], [t, -1]] as [string, number][]) {
    for (let i = 0; i < w.length; i += Math.max(1, Math.ceil(w.length / 4))) {
      const chunk = w.slice(i, i + Math.max(1, Math.ceil(w.length / 4)));
      for (const c of chunk) count[c] += d;
      frames.push({ note: `${d > 0 ? "Add 1" : "Subtract 1"} for "${chunk}" from ${d > 0 ? "the first" : "the second"} word. count[c - 'a'] is an array index, so each letter costs O(1)`, rows: rows(), tones: tonesOf([...new Set(chunk.split(""))].map((c) => [`1:${letters.indexOf(c)}`, "active"] as [string, Tone])) });
    }
  }
  const off = letters.filter((c) => count[c] !== 0);
  frames.push({ note: off.length ? `Not anagrams: ${off.map((c) => `'${c}' is off by ${count[c]}`).join(", ")}` : `Every counter is back to 0, so "${s}" and "${t}" are anagrams. O(n) time, O(26) space`, rows: rows(), tones: tonesOf(letters.map((c, k) => [`1:${k}`, count[c] ? "bad" : "found"] as [string, Tone])) });
  return { kind: "cells", title: `anagram("${s}", "${t}") = ${off.length === 0}`, rowLabels: ["letter", "count"], rows: rows(), frames };
}

/** Polynomial hash with prefix hashes: H[i + 1] = H[i] * B + code, then any substring's hash in O(1). Small B and M so the numbers fit. */
function hashViz(s: string, B = 31, M = 101): Diagram {
  const n = s.length, H = [0], P = [1], frames: CellsFrame[] = [];
  for (let i = 0; i < n; i++) { H.push((H[i] * B + (s.charCodeAt(i) - 96)) % M); P.push((P[i] * B) % M); }
  const codes = s.split("").map((c) => c.charCodeAt(0) - 96);
  const row = (k: number) => H.slice(1).map((h, i) => (i < k ? h : ""));
  frames.push({ note: `Hash "${s}" with letter codes a = 1 to z = 26, base ${B}, mod ${M} (real code uses a huge prime). Prefix hash H[i + 1] = (H[i] * ${B} + code) mod ${M}`, rows: [s.split(""), codes, row(0)] });
  for (let i = 0; i < n; i++) frames.push({ note: `H[${i + 1}] = (${H[i]} * ${B} + ${codes[i]}) mod ${M} = ${H[i + 1]}`, rows: [s.split(""), codes, row(i + 1)], tones: { [`2:${i}`]: "found", [`0:${i}`]: "active" } });
  const sub = (l: number, r: number) => (((H[r] - H[l] * P[r - l]) % M) + M) % M;
  let shown = 0;
  for (let len = Math.min(3, n - 1); len >= 1 && shown < 2; len--) {
    for (let l = 0; l + len <= n && shown < 2; l++) {
      const l2 = s.indexOf(s.slice(l, l + len), l + 1);
      if (l2 < 0) continue;
      const a = sub(l, l + len), b = sub(l2, l2 + len);
      frames.push({ note: `"${s.slice(l, l + len)}" at ${l} and at ${l2}: hash(l, r) = H[r] - H[l] * ${B}^(r - l). Both give ${a} and ${b} in O(1), so equal substrings are found without comparing characters`, rows: [s.split(""), codes, row(n)], tones: tonesOf([...Array(len)].flatMap((_, k) => [[`0:${l + k}`, "window"], [`0:${l2 + k}`, "found"]] as [string, Tone][])) });
      shown++;
    }
  }
  frames.push({ note: `Equal strings always hash equal, but different strings can collide, especially with a small mod like ${M}. A match of hashes means "probably equal": compare the characters to be sure`, rows: [s.split(""), codes, row(n)] });
  return { kind: "cells", title: `prefix hashes of "${s}"`, rowLabels: ["char", "code", "H"], rows: [s.split(""), codes, row(n)], frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **string** is a sequence of characters, and in memory it is an array of character codes. Everything about arrays carries over: `s[i]` is O(1), walking it is O(n) and cache-friendly, and inserting or deleting in the middle shifts everything after it. Most string problems are array problems over a small alphabet.",
    "Characters are stored as numbers. **ASCII** uses 7 bits for 128 characters: `'0'` is 48, `'A'` is 65 and `'a'` is 97, and each range is consecutive, so `c - 'a'` maps a lowercase letter to 0 to 25 and `c - '0'` turns a digit character into its value. **Unicode** gives every character a **code point** (up to U+10FFFF) and stores it with an **encoding**: UTF-8 uses 1 to 4 bytes per character, UTF-16 (Java, JavaScript) uses 2 or 4. Python's `str` indexes by code point; a C++ `std::string` holds bytes, so a non-ASCII character can take several slots. Interview problems usually say \"lowercase English letters\"; if not, ask.",
    "In Python, Java, JavaScript and C#, strings are **immutable**: once made, they never change. `s[0] = 'x'` is not allowed, and `s += t` builds a brand new string and copies both parts. Doing that in a loop of n steps copies 1 + 2 + ... + n characters, O(n²). The fix is a **builder**: a list of characters or pieces (`StringBuilder` in Java, a list plus `\"\".join` in Python) that grows like a dynamic array and is turned into a string once. C++ `std::string` is **mutable** and `+=` is amortised O(1), like `vector`.",
    "Immutability has upsides. A string can be shared safely without copying, its hash can be computed once and cached, and that is why strings make good hash map keys. The price is that every \"change\" is a new string.",
    "**Comparing** strings is not O(1). `a == b` checks characters until one differs, and `a < b` is **lexicographic** (dictionary) order: the first differing character decides, and if one string is a prefix of the other, the shorter comes first. So `\"apple\" < \"apply\"` and `\"app\" < \"apple\"`, and uppercase letters sort before lowercase ones in ASCII. In Java, `==` compares references; use `.equals`.",
    "**Hashing** a string reads every character, so it is O(L) for length L. A **polynomial hash** treats the string as a number in some base: `h = s[0] * B^(L-1) + ... + s[L-1]`, taken mod a large prime. With prefix hashes, the hash of any substring comes out in O(1), and a fixed-length window can **roll** one character at a time. That is the idea behind Rabin-Karp search and many \"find a repeated substring\" solutions.",
    "Vocabulary: **substring** (contiguous) vs **subsequence** (keeps order, may skip), **prefix**, **suffix**, **palindrome** (reads the same both ways), **anagram** (same letters, same counts), **lexicographic order**, **alphabet size** (26, 52, 128), **code point**, **encoding**, **immutable**, **builder**.",
  ],
  build: [
    "A string builder is a dynamic array of characters: a buffer, a length and a capacity. `append` copies the new characters into the free part of the buffer, doubling the capacity first if they do not fit, so appending k characters costs O(k) amortised. `toString` copies the used part out once, O(n).",
    "Because the buffer is mutable, the builder can also set a character, reverse in place with two pointers, or delete from the end in O(1). Insert at the front still shifts everything, O(n), exactly as for an array.",
    "Lexicographic comparison loops over `min(len(a), len(b))` positions and returns at the first difference by comparing character codes. If the loop ends, the shorter string is smaller, and equal lengths mean the strings are equal.",
    "A polynomial hash keeps `h = (h * B + code(c)) mod M` for each character. Store the prefix hashes `H[0] = 0, H[i + 1] = H[i] * B + code(s[i])` and the powers of B; then `hash(s[l..r)) = H[r] - H[l] * B^(r - l)` (mod M). Pick M as a large prime (or two different moduli) to make collisions rare, and on a hash match compare the characters if a false positive matters.",
    "For a small fixed alphabet, a **count array** (`int count[26]`) replaces a hash map: index it with `c - 'a'`. Two strings are anagrams exactly when their count arrays are equal. A 26-bit **mask** records which letters appear at all, and a tuple of the 26 counts is a hashable key for grouping anagrams.",
  ],
  code: String.raw`class StringBuilder:
    """A growable buffer of characters. Strings are immutable, so build into this and convert once."""

    def __init__(self, s=""):
        self.cap = max(8, len(s))
        self.buf = [""] * self.cap   # one character per slot
        self.n = 0
        self.append(s)

    def append(self, s):
        while self.n + len(s) > self.cap:
            self.buf += [""] * self.cap  # double the capacity: O(1) amortised per character
            self.cap *= 2
        for ch in s:
            self.buf[self.n] = ch
            self.n += 1
        return self

    def char_at(self, i):
        if not 0 <= i < self.n:
            raise IndexError(i)
        return self.buf[i]

    def set_char(self, i, ch):       # allowed here, impossible on an immutable str
        if not 0 <= i < self.n:
            raise IndexError(i)
        self.buf[i] = ch

    def reverse(self):
        i, j = 0, self.n - 1
        while i < j:                 # two pointers swap toward the middle
            self.buf[i], self.buf[j] = self.buf[j], self.buf[i]
            i, j = i + 1, j - 1
        return self

    def __len__(self):
        return self.n

    def __str__(self):
        return "".join(self.buf[:self.n])   # one O(n) copy at the end


def compare(a, b):
    """Lexicographic order: -1, 0 or 1. The first differing character decides; else the shorter one is first."""
    for x, y in zip(a, b):
        if x != y:
            return -1 if ord(x) < ord(y) else 1
    return (len(a) > len(b)) - (len(a) < len(b))


def poly_hash(s, base=131, mod=(1 << 61) - 1):
    """h = s[0] * base^(n-1) + ... + s[n-1], mod a large prime. Equal strings always get equal hashes."""
    h = 0
    for ch in s:
        h = (h * base + ord(ch)) % mod
    return h


def is_anagram(a, b):
    """Same letters with the same counts: a count array of 26 for lowercase English."""
    if len(a) != len(b):
        return False
    count = [0] * 26
    for x, y in zip(a, b):
        count[ord(x) - ord("a")] += 1
        count[ord(y) - ord("a")] -= 1
    return all(c == 0 for c in count)


def find(text, pat):
    """Naive substring search: try every start, O(n * m) worst case. Return the first index or -1."""
    for i in range(len(text) - len(pat) + 1):
        j = 0
        while j < len(pat) and text[i + j] == pat[j]:
            j += 1
        if j == len(pat):
            return i
    return -1`,
  ops: [
    {
      title: "Immutable string (Python str, Java String), length n",
      rows: [
        ["Read s[i]", "O(1)", "O(1)", "an array of character codes underneath"],
        ["Length", "O(1)", "O(1)", "stored with the string (C strlen is O(n): it looks for the 0 byte)"],
        ["Change one character", "O(n)", "O(n)", "not allowed in place: build a new string"],
        ["Concatenate a + b", "O(n + m)", "O(n + m)", "both parts are copied into a new string"],
        ["s += c inside a loop, k times", "O(k²)", "O(k²)", "each step copies the whole string so far; use a builder"],
        ["Slice / substring of length k", "O(k)", "O(k)", "a copy in Python and Java; std::string_view avoids it"],
        ["Compare a == b or a < b", "O(min(n, m))", "O(min(n, m))", "stops at the first differing character"],
        ["Hash", "O(n)", "O(n)", "reads every character; Python and Java cache it"],
        ["Search a pattern of length m", "O(n + m) typical", "O(n m)", "library dependent; KMP or the Z-function guarantee O(n + m)"],
        ["Count or replace every occurrence", "O(n)", "O(n m)", "one scan, plus the search cost"],
        ["Split / join", "O(n)", "O(n)", "every character is copied once"],
        ["Reverse", "O(n)", "O(n)", "a new string"],
        ["Upper / lower case", "O(n)", "O(n)", "a new string"],
        ["Sort the characters", "O(n log n)", "O(n log n)", "or O(n + 26) with a count array"],
        ["Integer to string and back", "O(digits)", "O(digits)", "one digit at a time"],
      ],
    },
    {
      title: "Mutable string (StringBuilder, list of chars, std::string)",
      rows: [
        ["Append a character", "O(1) amortised", "O(n)", "the buffer doubles when full, like a dynamic array"],
        ["Append k characters", "O(k) amortised", "O(n + k)", "copy into the free part of the buffer"],
        ["Set s[i]", "O(1)", "O(1)", "the buffer is mutable"],
        ["Insert or delete at the front", "O(n)", "O(n)", "shifts every later character"],
        ["Delete the last character", "O(1)", "O(1)", "pop_back, or deleteCharAt(len - 1)"],
        ["Reverse in place", "O(n)", "O(n)", "two pointers swap toward the middle"],
        ["Turn into a string", "O(n)", "O(n)", "one copy at the end"],
      ],
    },
    {
      title: "Common string algorithms (text n, pattern m, alphabet σ)",
      rows: [
        ["Palindrome check", "O(n)", "O(n)", "two pointers from both ends"],
        ["Letter frequencies", "O(n)", "O(n)", "O(σ) extra space with a count array"],
        ["Anagram check", "O(n)", "O(n)", "compare count arrays"],
        ["Group anagrams of k words, length L", "O(k L)", "O(k L)", "key = tuple of 26 counts (O(k L log L) with sorted keys)"],
        ["Longest common prefix of k strings", "O(total length)", "O(total length)", "compare column by column, stop at the first mismatch"],
        ["KMP or Z-function search", "O(n + m)", "O(n + m)", "a prefix table means the text is never re-read"],
        ["Rabin-Karp (rolling hash)", "O(n + m)", "O(n m)", "worst case when many windows collide and must be verified"],
        ["Longest palindromic substring", "O(n²)", "O(n²)", "expand around each centre; Manacher does it in O(n)"],
        ["Edit distance / LCS", "O(n m)", "O(n m)", "a DP table over both strings"],
        ["Sort k strings of length L", "O(k log k * L)", "O(k log k * L)", "each comparison can read L characters"],
        ["Trie insert or lookup of a word", "O(L)", "O(L)", "one node per character"],
      ],
    },
  ],
  builtins: [
    ["Mutable string / builder", "`std::string` is mutable", "a `list` of pieces, then `\"\".join(parts)`"],
    ["Length, character at", "`s.size()`, `s[i]`", "`len(s)`, `s[i]`"],
    ["Append", "`s += t`, `s.push_back(c)`", "`parts.append(t)`; `s += t` copies"],
    ["Substring", "`s.substr(pos, len)` (start and LENGTH)", "`s[l:r]` (start and end)"],
    ["Find", "`s.find(t)`, `string::npos` if absent", "`s.find(t)` (-1 if absent), `t in s`"],
    ["Starts / ends with", "`s.starts_with(t)`, `s.ends_with(t)` (C++20)", "`s.startswith(t)`, `s.endswith(t)`"],
    ["Split", "`stringstream ss(s); getline(ss, part, ',')`", "`s.split(\",\")`, `s.split()` on whitespace"],
    ["Join", "a loop with `+=`", "`\",\".join(parts)`"],
    ["Replace", "`s.replace(pos, len, t)` (one range)", "`s.replace(a, b)` (every occurrence)"],
    ["Reverse", "`reverse(s.begin(), s.end())`", "`s[::-1]`"],
    ["Character tests and case", "`isalnum`, `isdigit`, `isalpha`, `tolower`, `toupper`", "`c.isalnum()`, `c.isdigit()`, `s.lower()`, `s.upper()`"],
    ["Character to code and back", "`c - 'a'`, `char('a' + k)`", "`ord(c) - ord(\"a\")`, `chr(ord(\"a\") + k)`"],
    ["Number to string and back", "`to_string(x)`, `stoi(s)`, `stoll(s)`", "`str(x)`, `int(s)`, `int(s, 2)` for binary"],
    ["Count letters", "`array<int, 26> cnt{}; cnt[c - 'a']++`", "`collections.Counter(s)`"],
    ["Sort the characters", "`sort(s.begin(), s.end())`", "`\"\".join(sorted(s))`"],
    ["Compare, lexicographic", "`a < b`, `a.compare(b)`", "`a < b`"],
    ["View without copying", "`string_view`", "pass indices instead of slices"],
  ],
  when: [
    "\"Anagram\", \"permutation of\", \"same letters\": count letters with an array of 26 or a Counter.",
    "\"Lowercase English letters only\": a fixed-size count array or a 26-bit mask instead of a hash map.",
    "You build the answer piece by piece: a builder (list of parts, then join), never `+=` in a loop in Python or Java.",
    "\"Reverse\", \"palindrome\", \"compare from both ends\": two pointers on the character array.",
    "\"Find the pattern\", \"repeated substring\", \"occurs twice\": KMP, the Z-function or a rolling hash.",
    "The input mixes digits, letters and symbols (a parser, \"decode\", \"atoi\"): one index scanning left to right with character tests.",
    "Strings as keys (\"group words\", \"seen this word\"): a hash map keyed by the string or by a signature such as sorted letters.",
  ],
  avoid: [
    "Many prefix lookups over a word list (autocomplete, \"starts with\"): a trie, not repeated string comparisons.",
    "Heavy edits in the middle of a long text: a rope or a gap buffer; an array of characters shifts everything on each edit.",
    "Comparing many substrings for equality: prefix hashes or a suffix array, not slicing, since each slice copies.",
    "Numbers given as strings that fit in 64 bits: convert and use arithmetic, unless the problem forbids it.",
  ],
  tips: [
    "Ask about the character set early: lowercase only, ASCII, or Unicode. It decides between a count array and a hash map.",
    "In Python and Java, `s += c` in a loop is O(n²). Collect pieces in a list and join once.",
    "C++ `s.substr(pos, len)` takes a length, not an end index, and copies. Python slicing also copies, so slicing in a loop adds a factor of n.",
    "`c - 'a'` only works for lowercase letters; check `isalpha` or `isdigit` before mapping, and remember uppercase sorts before lowercase.",
    "In Java compare strings with `.equals`, not `==`. In C++, `s.find` returns `string::npos`, not -1, when nothing is found.",
    "A hash match is only probable equality. Say so, and verify characters, or use two moduli.",
    "Watch the empty string and single characters: many loops with `s[i + 1]` or `s[0]` break on them.",
    "Comparing or sorting strings costs time per character. Include the length L in the complexity you state.",
  ],
  viz: [
    { name: "Lexicographic compare", make: (i) => { const [a, b] = words(i, "banana", "bandit"); const d = compareViz(a, b); return d.frames.length >= 6 ? d : compareViz("banana", "bandit"); }, input: "banana bandit", label: "two words" },
    { name: "Anagram by counting", make: (i) => { const [a, b] = words(i, "listen", "silent"); const ok = /^[a-z]+$/.test(a + b); return anagramViz(ok ? a : "listen", ok ? b : "silent"); }, input: "listen silent", label: "two lowercase words" },
    { name: "Polynomial and rolling hash", make: (i) => { const w = (i ?? "").trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 9); return hashViz(w.length >= 5 ? w : "abcabd"); }, input: "abcabd", label: "a lowercase word (5 to 9 letters)" },
  ],
};

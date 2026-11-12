// Deeper theory for the "trie" patterns, and patterns added after the first 85. Merged into TOPICS by lib/patterns/index.ts.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import type { TNode } from "../../sim";
import { text, type Pattern } from "../types";

/** Pattern n -> paragraphs of theory: why it works, the invariant, variants, how to prove it, how it fails. */
export const THEORY: Record<number, string[]> = {
  1: [
    "The invariant of a trie: the path from the root to any node spells one string, a node exists exactly when some inserted word starts with that string, and the end flag is set exactly when that string is itself an inserted word. Insert keeps all three true by creating missing nodes along the word and setting the flag on the last one. Search and startsWith only read the path, so they are correct by the same invariant.",
    "Every operation walks one edge per character, so insert, search and startsWith cost O(L) for a string of length L, no matter how many words are stored. A hash set also checks a whole word in O(L) (hashing reads every character), but it cannot answer 'does any word start with this?' without scanning. A sorted list answers prefix queries with binary search in O(L log n). The trie wins when there are many prefix queries.",
    "Memory is the cost. The number of nodes is at most the total number of characters plus one, and each node holds its children. A fixed array of 26 child slots is fast and simple, but uses 26 pointers per node even when most are empty. A hash map per node is compact for sparse alphabets but slower. In C++ a common choice is one big vector of `array<int, 26>` nodes, using indices instead of pointers.",
    "Recognise a trie when the input is a dictionary and the questions are about prefixes: autocomplete, 'replace each word with its shortest root', the longest common prefix of many strings, or 'is this a prefix of any word'. For 'replace words', walk the trie along the word and stop at the first node with the end flag; that node is the shortest root.",
    "Edge cases: the empty string (it marks the root as a word end), repeated inserts of the same word (keep a count instead of a flag if duplicates matter), and alphabets bigger than lowercase letters (use a map, or a larger array). Deleting a word means clearing the flag and then removing nodes that no longer lead to any word, working back from the end.",
    "The next patterns build on this one. A wildcard search is a DFS over the trie. Word Search II walks the trie and a grid together. The bitwise trie is the same structure with the alphabet {0, 1}. Adding a counter to each node gives prefix counting, and adding failure links (Aho-Corasick) gives multi-pattern matching in a text.",
  ],
  2: [
    "A pattern with '.' describes a set of strings. The words in the trie that match it are found by a DFS whose state is (trie node, index in the pattern). A normal character allows one move, to that child. A '.' allows a move to every child. The search accepts when the index reaches the end of the pattern at a node with the end flag. Each accepted path spells a matching word and each matching word has such a path, so the DFS is exact.",
    "The worst case looks like 26 to the power of the number of dots, but it is also bounded by the size of the trie. For one search, a trie node at depth i can only be reached with pattern index i, so each node is visited at most once. The real cost is O(min(26^d · L, number of trie nodes)). When most patterns are long and full of dots, grouping words by length and comparing directly can be as fast and simpler.",
    "Variants change what the DFS carries. 'Magic dictionary' (exactly one character changed) carries a flag for whether the change has been used; a mismatch is allowed only when the flag is free. Camelcase matching lets the DFS skip lowercase letters freely but never skip an uppercase one. Prefix and suffix search inserts every 'suffix#word' combination so that one prefix walk answers both conditions.",
    "Other variants store answers on the nodes instead of searching. Map sum pairs keeps the sum of values of the words below each node, updated by the change in value on every insert. Search suggestions keeps the three smallest words passing through each node; inserting words in sorted order makes this a simple append when the list is short.",
    "Typical mistakes: returning true when the pattern ends at a node without the end flag, not short-circuiting after a branch succeeds, and recursing into a child before checking that it exists. When the problem gives one big batch of patterns, consider whether building the trie from the patterns instead of the words is cheaper.",
    "Wildcard search is backtracking with the trie as the decision tree. The same structure, a DFS that branches only at special characters, appears in regular expression matching, where DP replaces the trie because the text is a single string.",
  ],
  3: [
    "Searching each word separately repeats the same grid walks many times: two words that share a prefix explore the same cells for that prefix twice. Putting all words into one trie merges the shared prefixes. A single DFS from each cell, whose state is (cell, trie node), then follows every word at once and stops the moment the letters spelled so far are not a prefix of any word.",
    "Correctness. A word is on the board exactly when there is a path of distinct, adjacent cells spelling it. The DFS enumerates every such path whose letters form a prefix of some word, because it extends a path only into an unused neighbour whose letter is a child of the current trie node. Every word is therefore found at the node where its path ends, and nothing outside the dictionary is reported.",
    "Pruning is what makes it fast in practice. When a word is found, remove its end marker so it is reported once. When a node has no children and no word left, delete it from its parent. Later searches then stop earlier, and a large dictionary shrinks as words are found. Without pruning, the DFS keeps walking branches that can no longer produce anything new.",
    "Complexity. Building the trie costs the total length of the words. Each of the R · C start cells can begin a walk whose first step has 4 choices and each later step at most 3 (it cannot go back), so a path of length L costs up to 4 · 3^(L-1). The trie cuts most of these walks short, so the bound is loose, but it is the one to quote.",
    "Common bugs: forgetting to restore the cell after the DFS, which corrupts later searches; marking a cell visited but checking the old letter; and pushing the same word twice when it can be spelled by two different paths. Store the whole word at its end node so you do not need to rebuild the string from the path.",
    "The same 'trie plus another search' idea appears in concatenated words (trie plus word-break DP over positions), the longest word built one letter at a time (DFS only through end nodes), and a stream checker, which inserts reversed words and walks the trie backwards from the newest character.",
  ],
  4: [
    "The greedy step is correct because of how binary numbers compare. A number with bit b set is larger than any number that agrees on the higher bits and has bit b clear, since 2^b is larger than 2^(b-1) + … + 2^0. So to maximise x XOR y, the highest bit decides first: if some stored y has the opposite bit there, choosing it is always better than anything the lower bits could add. Repeating this from the top bit down is optimal.",
    "Store every number with the same fixed width W, from the most significant bit down. Each insert and each query walks exactly W levels, so the total cost is O(n · W) for n numbers and the memory is up to n · W nodes. For values below 2³¹, W = 31 levels (bits 30 to 0) are enough, which gives about 31 · 10⁵ nodes for n = 10⁵; use arrays of child indices in C++ rather than heap-allocated nodes.",
    "Maximum XOR of a subarray reduces to the same problem with prefix XORs: the XOR of a[l..r] is P[r+1] XOR P[l], so insert P[0], then for each new prefix query the best partner among earlier ones before inserting it. This is the prefix-sum trick with XOR in place of subtraction.",
    "Counting pairs with XOR below a limit K adds a counter to every node (how many numbers pass through). Walk x and K together from the top bit. Where K has a 1, every stored number that matches x's bit here gives XOR bit 0, which is already smaller than K, so add that child's count and continue down the opposite child. Where K has a 0, you must follow the child that keeps the XOR bit 0. Counting 'in a range [lo, hi]' is count(hi + 1) minus count(lo).",
    "Queries with an extra condition, such as 'only numbers at most m', are answered offline: sort the numbers and the queries by the limit, insert numbers as the limit grows, and answer each query when its turn comes. When numbers must also leave (a path in a tree, a sliding window), keep counts on nodes and decrement them on removal, treating a count of 0 as a missing child.",
    "Negative numbers need care: in two's complement the sign bit is the highest bit, so either offset all values to make them non-negative or treat the sign bit specially. The bitwise trie is pattern 1 with a two-letter alphabet, and its counting form is pattern 5 applied to bits.",
  ],
};

/* ---------- visualiser for the new pattern ---------- */

function countTrieViz(words = ["apple", "app", "apt", "bat"], query = "ap"): Diagram {
  const nodes: TNode[] = [{ id: 0, label: "•", parent: null }], child: Record<string, number> = { "": 0 };
  for (const w of words) for (let k = 1; k <= w.length; k++) { const pre = w.slice(0, k); if (!(pre in child)) { child[pre] = nodes.length; nodes.push({ id: nodes.length, label: w[k - 1], parent: child[w.slice(0, k - 1)] }); } }
  const cnt = nodes.map(() => 0), end = nodes.map(() => 0), shown = new Set<number>([0]), frames: TreeFrame[] = [];
  const badges = () => Object.fromEntries(nodes.filter((nd) => shown.has(nd.id)).map((nd) => [nd.id, `${cnt[nd.id]}${end[nd.id] ? "•" : ""}`]));
  const muted = () => Object.fromEntries(nodes.filter((nd) => !shown.has(nd.id)).map((nd) => [nd.id, "muted"])) as Record<number, Tone>;
  frames.push({ note: `Start with only the root. Every node will keep a counter of the words that pass through it`, tones: muted(), badges: badges() });
  for (const w of words) {
    const path = [0, ...Array.from({ length: w.length }, (_, k) => child[w.slice(0, k + 1)])];
    path.forEach((x) => { cnt[x]++; shown.add(x); }); end[path[path.length - 1]]++;
    frames.push({ note: `insert "${w}": add 1 to the counter of every node on its path (badge = words passing through, • = a word ends here)`, tones: { ...muted(), ...Object.fromEntries(path.map((x) => [x, "active"])) }, badges: badges() });
  }
  let at = 0; const walked = [0];
  for (const c of query) {
    const nx = child[query.slice(0, walked.length)];
    if (nx === undefined) { frames.push({ note: `No child '${c}': no word starts with "${query}", the count is 0`, tones: { ...muted(), ...Object.fromEntries(walked.map((x) => [x, "done"])) }, badges: badges() }); at = -1; break; }
    at = nx; walked.push(nx);
    frames.push({ note: `countPrefix("${query}"): follow '${c}' (letter ${walked.length - 1} of ${query.length}). The walk costs O(length of the prefix)`, tones: { ...muted(), ...Object.fromEntries(walked.map((x) => [x, "done"])), [nx]: "active" }, badges: badges() });
  }
  if (at >= 0) frames.push({ note: `The node for "${query}" says ${cnt[at]}: that many words start with "${query}", read in one step without visiting the words below`, tones: { ...muted(), ...Object.fromEntries(walked.map((x) => [x, "done"])), [at]: "found" }, badges: badges() });
  return { kind: "tree", title: "Trie with counts: words passing through each node", nodes, frames };
}

/** New patterns for this topic, numbered after the existing ones. */
export const MORE: Pattern[] = [
  {
    n: 5, name: "Trie with counts (prefix counting)", summary: "Store on every node how many words pass through it, and how many end there. Prefix counts, deletions and duplicate words become O(L).",
    signals: ["how many words start with this prefix", "sum of prefix scores of every word", "insert and erase words, count prefixes (Trie II)", "count pairs with XOR below a limit (counts in a bit trie)"],
    idea: ["Insert walks the word and adds 1 to a pass counter on every node it touches, plus 1 to an end counter at the last node.", "countPrefix(p) walks p and returns the pass counter of the last node (0 if the walk falls off).", "Erase walks the word and subtracts 1 from the same counters; a node whose pass counter is 0 is as good as deleted."],
    steps: ["node fields: kids, cnt (words through), end (words ending)", "insert: for each char, step and cnt += 1; end += 1", "countPrefix: walk; missing child → 0; else node.cnt", "erase (word present): walk and cnt -= 1; end -= 1"],
    code: `class CountTrie:
    def __init__(self):
        self.kids, self.cnt, self.end = {}, 0, 0

    def insert(self, w):
        n = self
        for c in w:
            n = n.kids.setdefault(c, CountTrie())
            n.cnt += 1                 # one more word passes here
        n.end += 1

    def _walk(self, w):
        n = self
        for c in w:
            n = n.kids.get(c)
            if n is None or n.cnt == 0: return None
        return n

    def count_prefix(self, p):
        n = self._walk(p)
        return n.cnt if n else 0

    def count_word(self, w):
        n = self._walk(w)
        return n.end if n else 0

    def erase(self, w):                # assumes w was inserted
        n = self
        for c in w:
            n = n.kids[c]
            n.cnt -= 1
        n.end -= 1`,
    complexity: { best: "O(L)", average: "O(L)", worst: "O(L)", space: "O(total characters)", note: "Every operation walks one path. Without the counters, counting a prefix would need a DFS over the whole subtree below it." },
    traps: ["Update the counter on the child you step INTO, so the root does not count as a prefix of length 1 (or keep a root counter for the empty prefix on purpose).", "Erasing a word that was never inserted corrupts the counts; check count_word first if the input allows it.", "A node with cnt 0 still exists after erasing; treat it as missing in every walk."],
    viz: { make: (i) => countTrieViz(undefined, text(i, "ap", 6).toLowerCase()), input: "ap", label: "prefix to count (words: apple, app, apt, bat)" },
    theory: [
      "A plain trie can tell whether a prefix exists. Counting how many words share it would need a DFS over the whole subtree below the prefix node. Counters move that work to insertion time: every word adds 1 to each node on its path, so a node's counter is exactly the number of words in its subtree (counted with repeats). The invariant is cnt(node) = number of inserted words, minus erased ones, that start with the node's string.",
      "Proof that the invariant holds. Insert of w increases by one the number of words starting with each prefix of w, and it adds 1 to exactly the nodes for those prefixes. Erase does the reverse. No other node's count of matching words changes. So every operation keeps cnt correct, and countPrefix just reads it in O(L).",
      "Sum of prefix scores (the score of a prefix is how many words start with it, and each word's total is the sum over its prefixes) is the classic use: insert all words, then walk each word adding the counters along its path. Total time O(total characters), compared with O(n² · L) for comparing every pair of words.",
      "The same counters power the bitwise trie's counting problems. Counting pairs with XOR less than K walks a number and K together and adds the counter of a whole subtree whenever every number in it is known to give a smaller XOR. Removing numbers when they leave a window or a tree path is a decrement, which is why tries with counts support deletion cheaply while plain tries do not.",
      "Edge cases: duplicate words count twice (that is usually wanted), the empty prefix should return the total number of words (keep a counter on the root if needed), and erase must stay consistent with insert. With a fixed array of children, memory is 26 integers per node; for 10⁵ words of length 10 that is about 26 million slots, so a map per node or arena arrays sized to the total length are safer.",
      "Counting on a trie is the string version of a frequency map over prefixes. When the queries are only about full words, a hash map of counts is simpler; the trie is needed when prefixes matter.",
    ],
  },
];

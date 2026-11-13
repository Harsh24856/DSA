// Overview of the "trie" topic: the data structure or technique itself. Shown on /patterns/trie before the patterns.
import type { Diagram, Tone, TreeFrame } from "../../diagram";
import type { TNode } from "../../sim";
import type { TopicOverview } from "../types";

/** A real trie whose nodes have fixed ids (creation order), so every frame can point at them. */
class VizTrie {
  nodes: TNode[] = [{ id: 0, label: "root", parent: null }];
  kid = new Map<string, number>();       // `${node}:${char}` -> child id
  end = new Set<number>();
  count = [0];
  gone = new Set<number>();
  child(n: number, c: string) { const k = this.kid.get(`${n}:${c}`); return k != null && !this.gone.has(k) ? k : undefined; }
  insert(w: string) {
    const path = [0], made: number[] = []; let n = 0; this.count[0]++;
    for (const c of w) {
      let k = this.child(n, c);
      if (k == null) { k = this.nodes.length; this.nodes.push({ id: k, label: c, parent: n }); this.kid.set(`${n}:${c}`, k); this.count.push(0); made.push(k); }
      n = k; this.count[n]++; path.push(n);
    }
    this.end.add(n);
    return { path, made };
  }
  walk(s: string) { const path = [0]; let n: number | undefined = 0; for (const c of s) { n = this.child(n, c); if (n == null) return { path, node: undefined }; path.push(n); } return { path, node: n }; }
  /** Every live node below (and including) id. */
  below(id: number): number[] { return [id, ...this.nodes.filter((x) => x.parent === id && !this.gone.has(x.id)).flatMap((x) => this.below(x.id))]; }
  badges() { return Object.fromEntries(this.nodes.filter((x) => !this.gone.has(x.id) && x.id).map((x) => [x.id, `${this.count[x.id]}${this.end.has(x.id) ? " end" : ""}`])); }
  base(extra: Record<number, Tone> = {}) { return { ...Object.fromEntries([...this.gone].map((g) => [g, "muted" as Tone])), ...extra }; }
}
const words = (s: string | undefined, fb: string[]) => { const w = (s ?? "").toLowerCase().split(/[\s,]+/).map((x) => x.replace(/[^a-z]/g, "").slice(0, 8)).filter(Boolean).slice(0, 8); return w.length ? w : fb; };

function trieInsertViz(input?: string): Diagram {
  const list = words(input, ["car", "cat", "cart", "care", "dog", "do"]), t = new VizTrie(), frames: TreeFrame[] = [], seen = new Set<string>();
  const snaps: { path: number[]; made: number[]; w: string; dup: boolean; badges: Record<number, string>; upto: number }[] = [];
  for (const w of list) {
    const dup = seen.has(w); seen.add(w);
    if (dup) { snaps.push({ path: t.walk(w).path, made: [], w, dup, badges: t.badges(), upto: t.nodes.length }); continue; }
    const { path, made } = t.insert(w); snaps.push({ path, made, w, dup, badges: t.badges(), upto: t.nodes.length });
  }
  for (const s of snaps) {
    const shared = s.path.length - 1 - s.made.length;
    const tones: Record<number, Tone> = { ...Object.fromEntries(t.nodes.filter((x) => x.id >= s.upto).map((x) => [x.id, "muted" as Tone])), ...Object.fromEntries(s.path.map((p) => [p, "active" as Tone])), ...Object.fromEntries(s.made.map((m) => [m, "found" as Tone])) };
    frames.push({ note: s.dup ? `"${s.w}" is already stored: the walk ends on a node marked end, so nothing changes` : `insert "${s.w}": ${shared ? `reuse ${shared} existing node${shared > 1 ? "s" : ""} for "${s.w.slice(0, shared)}"` : "no shared prefix"}${s.made.length ? `, create ${s.made.length} new (${s.made.map((m) => t.nodes[m].label).join(", ")})` : ", create nothing"}, mark the last node as a word end and add 1 to every count on the path. O(${s.w.length})`, tones, badges: s.badges });
  }
  const chars = [...seen].reduce((a, w) => a + w.length, 0);
  frames.push({ note: `${seen.size} words with ${chars} letters in total need only ${t.nodes.length - 1} nodes, because shared prefixes are stored once. Each badge is the number of words through that node`, tones: {}, badges: t.badges() });
  return { kind: "tree", title: "Trie insert: shared prefixes are stored once", nodes: t.nodes, frames };
}

function trieSearchViz(): Diagram {
  const t = new VizTrie(); for (const w of ["car", "cat", "cart", "dog"]) t.insert(w);
  const frames: TreeFrame[] = [], badges = t.badges();
  const queries: [string, string][] = [["search", "car"], ["search", "ca"], ["search", "cab"], ["startsWith", "ca"], ["countPrefix", "ca"], ["startsWith", "do"], ["search", "cart"]];
  for (const [op, q] of queries) {
    const { path, node } = t.walk(q), tones: Record<number, Tone> = Object.fromEntries(path.map((p) => [p, "active" as Tone]));
    let note: string;
    if (node == null) { tones[path[path.length - 1]] = "bad"; note = `${op}("${q}"): after "${q.slice(0, path.length - 1)}" there is no child '${q[path.length - 1]}', so the walk falls off: ${op === "countPrefix" ? 0 : false}`; }
    else if (op === "search") { const ok = t.end.has(node); tones[node] = ok ? "found" : "bad"; note = `search("${q}"): the path exists${ok ? " and its last node is marked end: true" : `, but its last node is not a word end, so "${q}" is only a prefix: false`}`; }
    else if (op === "startsWith") { tones[node] = "found"; note = `startsWith("${q}"): the whole path exists, so some word starts with "${q}": true. No end mark needed`; }
    else { tones[node] = "found"; note = `countPrefix("${q}"): walk to the prefix node and read its count: ${t.count[node]} words, without visiting any of them`; }
    frames.push({ note: `${note}. Cost O(${q.length}), whatever the number of words`, tones, badges });
  }
  return { kind: "tree", title: "Search, prefix search and prefix count", nodes: t.nodes, frames };
}

function trieDeleteViz(): Diagram {
  const t = new VizTrie(); for (const w of ["car", "cat", "cart", "care", "dog", "do"]) t.insert(w);
  const frames: TreeFrame[] = [{ note: "Six words. Each badge is how many words pass through the node; end marks a word end", tones: {}, badges: t.badges() }];
  for (const w of ["cart", "car", "dog", "do"]) {
    const { path } = t.walk(w); t.count[0]--;
    let cut: number | undefined;
    for (const p of path.slice(1)) { t.count[p]--; if (t.count[p] === 0) { cut = p; break; } }
    const walked = Object.fromEntries(path.slice(0, cut != null ? path.indexOf(cut) : path.length).map((p) => [p, "active" as Tone]));
    if (cut != null) {
      const branch = t.below(cut);
      frames.push({ note: `delete "${w}": subtract 1 along the path. At '${t.nodes[cut].label}' the count drops to 0: no other word uses this node, so cut it off with everything below (${branch.length} node${branch.length > 1 ? "s" : ""})`, tones: t.base({ ...walked, ...Object.fromEntries(branch.map((b) => [b, "bad" as Tone])) }), badges: t.badges() });
      branch.forEach((b) => { t.gone.add(b); t.end.delete(b); });
    } else {
      const last = path[path.length - 1];
      frames.push({ note: `delete "${w}": subtract 1 along the path. Every node is still used by another word, so only clear the end mark on '${t.nodes[last].label}'`, tones: t.base({ ...walked, [last]: "bad" }), badges: t.badges() });
      t.end.delete(last);
    }
    frames.push({ note: `After deleting "${w}": ${t.nodes.length - 1 - t.gone.size} nodes left. Pruning keeps the trie as small as the words it still holds`, tones: t.base(), badges: t.badges() });
  }
  return { kind: "tree", title: "Trie delete: unmark, then prune unused nodes", nodes: t.nodes, frames };
}

export const OVERVIEW: TopicOverview = {
  what: [
    "A **trie** (also called a prefix tree; say \"try\") stores a set of strings as a tree of characters. The root stands for the empty string. Each edge adds one character, so every node stands for exactly one prefix: the characters on the path from the root to it. Words that share a prefix share that path, and each node carries an **end** flag that says whether a stored word stops there.",
    "The end flag is what separates a word from a prefix. With \"cart\" stored, the path c, a, r exists, but \"car\" is a word only if the r node is marked end. Forgetting this is the single most common trie bug.",
    "Every operation walks one character at a time from the root, so insert, search and prefix search cost O(L), where L is the length of the string. That cost does not depend on how many words are stored, which is the trie's main selling point over a sorted list (O(L log n)) and its advantage over a hash set for prefixes, which a hash set cannot answer without scanning every word.",
    "There are two common node layouts. **Array of 26** (or of the alphabet size): child c lives at `kids[c - 'a']`. Lookup is a single index with no hashing, and iterating the children in order gives words in sorted order for free, but every node pays for 26 slots even when it has one child. **Hash map** children (`dict` in Python, `unordered_map` in C++): memory grows only with the edges that exist and any character set works, but each step costs a hash and the children come out unordered.",
    "The price of a trie is memory. In the worst case (no shared prefixes) it has one node per character of input, and each array node holds 26 pointers, so 1 MB of text can turn into hundreds of MB of nodes. Real systems use **compressed tries** (radix trees, Patricia tries): a chain of single-child nodes collapses into one edge labelled with a whole substring, so a trie of n words has at most 2n nodes. A **suffix trie** (and its compressed form, the suffix tree) stores every suffix of one text, which answers \"is p a substring\" in O(|p|).",
    "Common add-ons: a `count` on each node (how many words pass through, for prefix counting), the stored `word` at end nodes (so a DFS can report it without rebuilding the string), and a **bitwise trie**, where each number is a string of bits from the highest down and every node has two children, 0 and 1, used for maximum XOR questions.",
  ],
  build: [
    "A node needs two things: its children and the end flag. Add `count` if you will count prefixes or delete words. The trie object holds the root node, which is never deleted and never marked end unless the empty string is a word.",
    "**Insert.** Start at the root. For each character, follow the child if it exists, else create it, then move into it. After the last character, set `end = True`. If you keep counts, add 1 to the count of every node on the path (only when the word was not already present, or counts drift).",
    "**Search and prefix search** share one helper that walks the string and returns the node it reaches, or nothing if a child is missing. `search` needs that node to exist and be marked end; `startsWith` only needs it to exist; `countPrefix` returns its count.",
    "**Delete.** First check the word is stored. Then walk down subtracting 1 from each count. The first node whose count reaches 0 is used by no other word, so cut the link to it and the whole branch below goes with it. If no count reaches 0, the word is a prefix of another word: just clear its end flag. Without counts, delete recursively and, on the way back up, remove a child that is not an end and has no children of its own.",
    "**Listing words with a prefix** (autocomplete): walk to the prefix node, then DFS below it, appending a character on the way down and popping it on the way back, and record the path at each end node. With array children visited from a to z, the words come out sorted.",
    "**Memory tricks.** Store all nodes in one array and use integer indices instead of pointers (fewer allocations, easy to reset between test cases, and the usual competitive programming layout). Count the nodes you will need up front: at most the total number of characters plus one.",
  ],
  code: `class TrieNode:
    __slots__ = ("kids", "end", "count")
    def __init__(self):
        self.kids = {}        # char -> TrieNode; the array version uses [None] * 26 and kids[ord(c) - 97]
        self.end = False      # a word stops here
        self.count = 0        # how many words pass through (or stop at) this node

class Trie:
    def __init__(self):
        self.root = TrieNode()
        self.size = 0

    def _walk(self, s):                 # node for s, or None; O(len(s))
        node = self.root
        for c in s:
            node = node.kids.get(c)
            if node is None:
                return None
        return node

    def insert(self, word):             # O(L): reuse the shared prefix, create the rest
        if self.search(word):
            return False
        node = self.root
        node.count += 1
        for c in word:
            node = node.kids.setdefault(c, TrieNode())
            node.count += 1
        node.end = True
        self.size += 1
        return True

    def search(self, word):             # whole word: the path exists AND ends on a word end
        node = self._walk(word)
        return node is not None and node.end

    def starts_with(self, prefix):      # prefix: the path exists
        return self._walk(prefix) is not None

    def count_prefix(self, prefix):     # words that start with prefix, O(L) thanks to count
        node = self._walk(prefix)
        return node.count if node else 0

    def words_with_prefix(self, prefix):  # DFS under the prefix node, sorted
        node, out = self._walk(prefix), []
        def dfs(n, path):
            if n.end:
                out.append(path)
            for c in sorted(n.kids):
                dfs(n.kids[c], path + c)
        if node:
            dfs(node, prefix)
        return out

    def delete(self, word):             # O(L): unmark the end, prune nodes no word uses any more
        if not self.search(word):
            return False
        node = self.root
        node.count -= 1
        for c in word:
            nxt = node.kids[c]
            nxt.count -= 1
            if nxt.count == 0:          # nothing else passes through: cut the whole branch
                del node.kids[c]
                break
            node = nxt
        else:
            node.end = False
        self.size -= 1
        return True`,
  ops: [
    { title: "Trie (L = length of the string, n = words, N = total characters, σ = alphabet size)", rows: [
      ["Insert a word", "O(L)", "O(L)", "follow or create one child per character"],
      ["Search a whole word", "O(L)", "O(L)", "walk the path, then check the end flag"],
      ["Prefix exists (startsWith)", "O(L)", "O(L)", "walk the path; no end flag needed"],
      ["Count words with a prefix", "O(L)", "O(L)", "read the count stored on the prefix node"],
      ["List words with a prefix", "O(L + K)", "O(L + K)", "DFS below the prefix node; K = characters in the output"],
      ["Delete a word", "O(L)", "O(L)", "decrement counts, prune the first node that drops to 0"],
      ["Build from n words", "O(N)", "O(N)", "one insert per word"],
      ["All words in sorted order", "O(N)", "O(N)", "DFS with children in letter order (array layout; sort map keys otherwise)"],
      ["Longest common prefix of all words", "O(N)", "O(N)", "walk down while a node has exactly one child and is not an end"],
      ["Wildcard search ('.' = any letter)", "O(L)", "O(N)", "each '.' branches into every child, so it can touch the whole trie"],
      ["Memory, array of σ children", "O(N σ)", "O(N σ)", "σ pointers per node, mostly empty"],
      ["Memory, hash map children", "O(N)", "O(N)", "one entry per edge, but hashing overhead per node"],
      ["Memory, compressed (radix) trie", "O(n) nodes", "O(n) nodes", "single-child chains merged into one edge; edge labels still hold N characters"],
    ] },
    { title: "The same jobs with a hash set or a sorted array (n words, length L)", rows: [
      ["Hash set: exact lookup", "O(L)", "O(n L)", "hash the word; collisions make the worst case"],
      ["Hash set: does any word start with p", "O(n L)", "O(n L)", "no order, so scan every word (or also store every prefix: O(L^2) memory per word)"],
      ["Hash set: insert or delete", "O(L)", "O(n L)", "hash the word"],
      ["Sorted array: exact lookup", "O(L log n)", "O(L log n)", "binary search, each comparison costs up to L"],
      ["Sorted array: words with prefix p", "O(L log n)", "O(L log n)", "two binary searches give the range [p, p + highest char)"],
      ["Sorted array: insert or delete", "O(n L)", "O(n L)", "shifts every later string"],
      ["Sorted array: memory", "O(N)", "O(N)", "just the strings, contiguous and cache friendly"],
    ] },
  ],
  builtins: [
    ["Trie", "none in std; GCC has `__gnu_pbds::trie` with prefix search (rarely used)", "none: a `dict` of `dict`s or a small class"],
    ["Child map", "`array<int, 26>` or `unordered_map<char, int>`", "`dict`, or `defaultdict(TrieNode)`"],
    ["Prefix test on one string", "`s.starts_with(p)` (C++20), or `s.compare(0, p.size(), p) == 0`", "`s.startswith(p)`"],
    ["Prefix range in a sorted list", "`lower_bound(v.begin(), v.end(), p)`", "`bisect_left(words, p)`"],
    ["Longest common prefix of a list", "`mismatch` on pairs, or sort and compare first and last", "`os.path.commonprefix(words)` (character based)"],
    ["Set of all prefixes", "`unordered_set<string>`", "`set` filled with `w[:i]` for every i"],
  ],
  when: [
    "The problem talks about prefixes: \"starts with\", autocomplete, \"search suggestions\", \"longest common prefix\" across many strings.",
    "Many words are checked against the same dictionary, and each check walks a string character by character (word break, word search in a grid, stream of characters).",
    "You must stop early when a partial string cannot become a word: the trie tells you after one missing child, a hash set cannot.",
    "Wildcard matching where `.` stands for any letter, against a stored set of words.",
    "Maximum or minimum XOR of pairs, or XOR queries with a limit: a bitwise trie over the binary digits.",
    "Counting how many words share each prefix, or summing prefix scores: a trie with counts.",
    "Replacing words by their shortest root or prefix from a dictionary.",
  ],
  avoid: [
    "Only exact lookups, never prefixes: a hash set is simpler and uses far less memory.",
    "The dictionary is fixed and memory is tight: sort it once and binary search for prefix ranges.",
    "Substring (not prefix) search in one long text: KMP, Z-function or rolling hash, or a suffix array or suffix tree for many queries.",
    "Very long strings with few shared prefixes: an uncompressed trie has a node per character and wins nothing.",
  ],
  tips: [
    "Keep the end flag separate from \"has children\". A word can be a prefix of another word (\"car\" and \"cart\"), and a node with no children is not always an end in a broken insert.",
    "Write one `walk(s)` helper and build `search`, `startsWith` and `countPrefix` on top of it; it removes three copies of the same loop.",
    "Increment counts only when the word is new, or a repeated insert makes every prefix count wrong.",
    "Store the whole word at its end node when a DFS must report it (Word Search II): no need to rebuild the string from the path.",
    "In grid or backtracking searches, move the trie pointer along with the DFS and stop as soon as the child is missing; that pruning is the whole point.",
    "With an array-of-26 layout in Python, use `[None] * 26`, never `[TrieNode()] * 26`, which makes 26 references to one node.",
    "Quote the cost as O(L) per operation and O(total characters) memory, and mention the alphabet factor for the array layout.",
    "For a reversed lookup (\"does the stream end with a word\"), insert every word reversed and walk the latest characters backwards.",
  ],
  viz: [
    { name: "Insert", make: trieInsertViz, input: "car, cat, cart, care, dog, do", label: "words to insert, comma separated (a to z)" },
    { name: "Search vs prefix", make: () => trieSearchViz() },
    { name: "Delete and prune", make: () => trieDeleteViz() },
  ],
};

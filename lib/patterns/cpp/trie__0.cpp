// Trie from scratch, array-of-26 children (lowercase words). count = words that pass through or stop at a node.
class Trie {
    struct Node {
        array<unique_ptr<Node>, 26> kids;            // null = no child; the hash map version uses unordered_map<char, Node*>
        bool end = false;
        int count = 0;
    };
    Node root;
    int words = 0;

    const Node* walk(const string& s) const {         // node for s, or nullptr; O(len)
        const Node* n = &root;
        for (char c : s) {
            n = n->kids[c - 'a'].get();
            if (!n) return nullptr;
        }
        return n;
    }
    static void collect(const Node* n, string& path, vector<string>& out) {
        if (n->end) out.push_back(path);
        for (int c = 0; c < 26; c++)                  // children in letter order, so the output is sorted
            if (n->kids[c]) {
                path.push_back('a' + c);
                collect(n->kids[c].get(), path, out);
                path.pop_back();
            }
    }

public:
    int size() const { return words; }

    bool insert(const string& w) {                    // O(L): reuse the shared prefix, create the rest
        if (search(w)) return false;
        Node* n = &root;
        n->count++;
        for (char c : w) {
            auto& next = n->kids[c - 'a'];
            if (!next) next = make_unique<Node>();
            n = next.get();
            n->count++;
        }
        n->end = true;
        words++;
        return true;
    }
    bool search(const string& w) const { const Node* n = walk(w); return n && n->end; }
    bool startsWith(const string& p) const { return walk(p) != nullptr; }
    int countPrefix(const string& p) const { const Node* n = walk(p); return n ? n->count : 0; }

    vector<string> wordsWithPrefix(const string& p) const {
        vector<string> out;
        string path = p;
        if (const Node* n = walk(p)) collect(n, path, out);
        return out;
    }
    bool erase(const string& w) {                     // O(L): unmark the end, prune the branch nobody uses
        if (!search(w)) return false;
        Node* n = &root;
        n->count--;
        for (char c : w) {
            auto& next = n->kids[c - 'a'];
            if (--next->count == 0) { next.reset(); words--; return true; }   // frees the whole branch
            n = next.get();
        }
        n->end = false;
        words--;
        return true;
    }
};
// @test
    Trie t;
    for (string w : {"car", "cat", "cart", "care", "dog", "do"}) t.insert(w);
    H::check(t.insert("cat"), false, "duplicate refused");
    H::check(t.size(), 6, "size");
    H::check(t.search("car"), true, "search word");
    H::check(t.search("ca"), false, "prefix is not a word");
    H::check(t.startsWith("ca"), true, "startsWith");
    H::check(t.startsWith("cab"), false, "missing prefix");
    H::check(t.countPrefix("ca"), 4, "countPrefix ca");
    H::check(t.countPrefix(""), 6, "countPrefix empty");
    H::check(t.wordsWithPrefix("car"), vector<string>{"car", "care", "cart"}, "wordsWithPrefix sorted");
    H::check(t.erase("cart"), true, "erase leaf word");
    H::check(t.search("car"), true, "prefix word survives");
    H::check(t.erase("car"), true, "erase word in the middle");
    H::check(t.countPrefix("car"), 1, "count after erase");
    H::check(t.erase("dog"), true, "erase dog");
    H::check(t.search("do"), true, "do survives");
    H::check(t.erase("ca"), false, "erase non-word");
    H::check(t.erase("do"), true, "erase do");
    H::check(t.startsWith("d"), false, "branch pruned");
    H::check(t.wordsWithPrefix(""), vector<string>{"care", "cat"}, "what is left");

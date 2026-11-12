// array-of-26 trie: nodes live in one vector and children are indices (0 = no child)
class Trie {
    struct Node { array<int, 26> kids{}; bool end = false; };
    vector<Node> t{Node{}};                       // t[0] is the root

    int walk(const string& w) const {             // node index of w, or -1
        int n = 0;
        for (char c : w) {
            n = t[n].kids[c - 'a'];
            if (!n) return -1;
        }
        return n;
    }

public:
    void insert(const string& w) {
        int n = 0;
        for (char c : w) {
            if (!t[n].kids[c - 'a']) { t[n].kids[c - 'a'] = t.size(); t.emplace_back(); }
            n = t[n].kids[c - 'a'];
        }
        t[n].end = true;
    }
    bool search(const string& w) const { int n = walk(w); return n >= 0 && t[n].end; }
    bool startsWith(const string& p) const { return walk(p) >= 0; }
};
// @test
    Trie t;
    t.insert("apple");
    H::check(t.search("apple"), true, "search word");
    H::check(t.search("app"), false, "prefix is not a word");
    H::check(t.startsWith("app"), true, "startsWith");
    t.insert("app");
    H::check(t.search("app"), true, "search after insert");
    H::check(t.startsWith("b"), false, "missing prefix");

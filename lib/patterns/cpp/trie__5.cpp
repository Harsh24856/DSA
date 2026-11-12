// every node counts the words passing through it (cnt) and ending at it (end)
class CountTrie {
    struct Node { array<int, 26> kids{}; int cnt = 0, end = 0; };
    vector<Node> t{Node{}};

    int walk(const string& w) const {            // node of w, or -1 if no live path
        int n = 0;
        for (char c : w) {
            n = t[n].kids[c - 'a'];
            if (!n || !t[n].cnt) return -1;
        }
        return n;
    }

public:
    void insert(const string& w) {
        int n = 0;
        for (char c : w) {
            if (!t[n].kids[c - 'a']) { t[n].kids[c - 'a'] = t.size(); t.emplace_back(); }
            n = t[n].kids[c - 'a'];
            t[n].cnt++;                          // one more word passes here
        }
        t[n].end++;
    }
    int countPrefix(const string& p) const { int n = walk(p); return n < 0 ? 0 : t[n].cnt; }
    int countWord(const string& w) const { int n = walk(w); return n < 0 ? 0 : t[n].end; }
    void erase(const string& w) {                // assumes w was inserted
        int n = 0;
        for (char c : w) { n = t[n].kids[c - 'a']; t[n].cnt--; }
        t[n].end--;
    }
};
// @test
    CountTrie t;
    for (string w : {"apple", "app", "apt", "bat", "app"}) t.insert(w);
    H::check(t.countPrefix("ap"), 4, "count prefix");
    H::check(t.countWord("app"), 2, "duplicates counted");
    H::check(t.countPrefix("b"), 1, "other branch");
    H::check(t.countPrefix("c"), 0, "missing");
    t.erase("app"); t.erase("apt");
    H::check(t.countPrefix("ap"), 2, "after erase");
    H::check(t.countWord("app"), 1, "word after erase");
    H::check(t.countPrefix("apt"), 0, "erased branch");

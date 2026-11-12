class Trie {
    struct TrieNode {
        TrieNode* kids[26] = {};
        bool end = false;                                // a word ends here
    };
    TrieNode* root = new TrieNode();

    TrieNode* walk(const string& s) {                    // node for s, or nullptr if no word starts with s
        TrieNode* node = root;
        for (char ch : s) {
            node = node->kids[ch - 'a'];
            if (!node) return nullptr;
        }
        return node;
    }

public:
    Trie() {}

    void insert(string word) {
        TrieNode* node = root;
        for (char ch : word) {
            if (!node->kids[ch - 'a']) node->kids[ch - 'a'] = new TrieNode();
            node = node->kids[ch - 'a'];
        }
        node->end = true;
    }

    bool search(string word) {
        TrieNode* node = walk(word);
        return node && node->end;
    }

    bool startsWith(string prefix) { return walk(prefix) != nullptr; }
};
// @test
    Trie t;
    t.insert("apple");
    H::check(t.search("apple"), true, "Trie search apple");
    H::check(t.search("app"), false, "Trie search app");
    H::check(t.startsWith("app"), true, "Trie startsWith app");
    t.insert("app");
    H::check(t.search("app"), true, "Trie search app again");

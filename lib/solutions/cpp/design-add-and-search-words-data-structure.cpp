class WordDictionary {
    struct TrieNode {
        TrieNode* kids[26] = {};
        bool end = false;
    };
    TrieNode* root = new TrieNode();

    bool dfs(TrieNode* node, const string& word, int i) {
        if (i == (int)word.size()) return node->end;
        if (word[i] == '.') {                            // a dot tries every child
            for (TrieNode* kid : node->kids)
                if (kid && dfs(kid, word, i + 1)) return true;
            return false;
        }
        TrieNode* kid = node->kids[word[i] - 'a'];
        return kid && dfs(kid, word, i + 1);
    }

public:
    WordDictionary() {}

    void addWord(string word) {
        TrieNode* node = root;
        for (char ch : word) {
            if (!node->kids[ch - 'a']) node->kids[ch - 'a'] = new TrieNode();
            node = node->kids[ch - 'a'];
        }
        node->end = true;
    }

    bool search(string word) { return dfs(root, word, 0); }
};
// @test
    WordDictionary wd;
    wd.addWord("bad"); wd.addWord("dad"); wd.addWord("mad");
    vector<bool> got;
    for (string w : {"pad", "bad", ".ad", "b..", ".."}) got.push_back(wd.search(w));
    H::check(got, vector<bool>{false, true, true, true, false}, "WordDictionary");

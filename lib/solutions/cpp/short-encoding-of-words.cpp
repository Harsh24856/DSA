class Solution {
public:
    int minimumLengthEncoding(vector<string>& words) {
        vector<array<int, 26>> trie(1, array<int, 26>{});
        unordered_set<string> distinct(words.begin(), words.end());
        vector<pair<int, int>> ends;                     // (node where the reversed word ends, its length)
        for (const string& w : distinct) {
            int n = 0;
            for (int i = w.size() - 1; i >= 0; i--) {
                int c = w[i] - 'a';
                if (!trie[n][c]) { trie[n][c] = trie.size(); trie.push_back({}); }
                n = trie[n][c];
            }
            ends.push_back({n, (int)w.size()});
        }
        int total = 0;
        for (auto [n, len] : ends) {
            bool leaf = true;
            for (int c : trie[n]) if (c) { leaf = false; break; }
            if (leaf) total += len + 1;                  // not a suffix of a longer word
        }
        return total;
    }
};

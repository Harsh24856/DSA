class Solution {
    vector<array<int, 26>> trie{array<int, 26>{}};
    vector<bool> end{false};
    unordered_map<int, vector<string>> memo;
    string s;

    const vector<string>& go(int i) {                     // every sentence that spells s[i:]
        if (auto it = memo.find(i); it != memo.end()) return it->second;
        vector<string> out;
        if (i == (int)s.size()) out.push_back("");
        int node = 0;
        for (int j = i; j < (int)s.size(); j++) {
            node = trie[node][s[j] - 'a'];
            if (!node) break;
            if (!end[node]) continue;
            string word = s.substr(i, j - i + 1);
            for (const string& rest : go(j + 1)) out.push_back(rest.empty() ? word : word + " " + rest);
        }
        return memo[i] = out;
    }
public:
    vector<string> wordBreak(string s, vector<string>& wordDict) {
        this->s = s;
        for (const string& w : wordDict) {
            int n = 0;
            for (char ch : w) {
                if (!trie[n][ch - 'a']) { trie[n][ch - 'a'] = trie.size(); trie.push_back({}); end.push_back(false); }
                n = trie[n][ch - 'a'];
            }
            end[n] = true;
        }
        return go(0);
    }
};

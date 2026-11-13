class Solution {
public:
    int minExtraChar(string s, vector<string>& dictionary) {
        vector<array<int, 26>> trie(1, array<int, 26>{});
        vector<bool> end(1, false);
        for (const string& w : dictionary) {
            int n = 0;
            for (char ch : w) {
                if (!trie[n][ch - 'a']) { trie[n][ch - 'a'] = trie.size(); trie.push_back({}); end.push_back(false); }
                n = trie[n][ch - 'a'];
            }
            end[n] = true;
        }
        int n = s.size();
        vector<int> dp(n + 1, 0);                        // dp[i] = fewest extra characters in s[i:]
        for (int i = n - 1; i >= 0; i--) {
            dp[i] = 1 + dp[i + 1];                       // leave s[i] over
            int node = 0;
            for (int j = i; j < n; j++) {
                node = trie[node][s[j] - 'a'];
                if (!node) break;
                if (end[node]) dp[i] = min(dp[i], dp[j + 1]);   // s[i..j] is a word
            }
        }
        return dp[0];
    }
};

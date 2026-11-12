class Solution {
public:
    vector<string> findAllConcatenatedWordsInADict(vector<string>& words) {
        unordered_set<string> vocab(words.begin(), words.end());
        // can w be split into at least two words of the list?
        auto can = [&](const string& w) -> bool {
            int n = w.size();
            vector<bool> dp(n + 1, false);
            dp[0] = true;
            for (int i = 1; i <= n; i++)
                for (int j = 0; j < i; j++)
                    if (dp[j] && !(j == 0 && i == n) && vocab.count(w.substr(j, i - j))) { dp[i] = true; break; }
            return dp[n];
        };
        vector<string> out;
        for (auto& w : words) if (!w.empty() && can(w)) out.push_back(w);
        return out;
    }
};

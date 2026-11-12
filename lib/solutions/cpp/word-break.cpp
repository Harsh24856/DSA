class Solution {
public:
    bool wordBreak(string s, vector<string>& wordDict) {
        unordered_set<string> words(wordDict.begin(), wordDict.end());
        int n = s.size();
        vector<bool> dp(n + 1, false);                   // dp[i]: s[:i] splits into words
        dp[0] = true;
        for (int i = 1; i <= n; i++)
            for (int j = 0; j < i && !dp[i]; j++)
                if (dp[j] && words.count(s.substr(j, i - j))) dp[i] = true;
        return dp[n];
    }
};

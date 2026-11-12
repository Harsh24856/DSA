class Solution {
public:
    int numDistinct(string s, string t) {
        // unsigned: middle cells can pass int range on LeetCode's tests; the answer itself fits
        vector<unsigned long long> dp(t.size() + 1, 0);
        dp[0] = 1;
        for (char ch : s)
            for (size_t i = t.size(); i > 0; i--)            // backwards so each s char is used once
                if (t[i - 1] == ch) dp[i] += dp[i - 1];
        return (int)dp[t.size()];
    }
};

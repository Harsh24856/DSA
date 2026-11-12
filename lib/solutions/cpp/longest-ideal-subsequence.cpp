class Solution {
public:
    int longestIdealString(string s, int k) {
        array<int, 26> dp{};   // dp[c] = longest ideal subsequence ending in letter c
        for (char ch : s) {
            int c = ch - 'a';
            int best = 0;
            for (int d = max(0, c - k); d <= min(25, c + k); d++) best = max(best, dp[d]);
            dp[c] = best + 1;
        }
        return *max_element(dp.begin(), dp.end());
    }
};

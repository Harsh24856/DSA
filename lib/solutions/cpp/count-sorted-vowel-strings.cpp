class Solution {
public:
    int countVowelStrings(int n) {
        int dp[5] = {1, 1, 1, 1, 1};   // dp[v]: strings that start with vowel v
        for (int k = 0; k < n - 1; k++)
            for (int v = 3; v >= 0; v--) dp[v] += dp[v + 1];
        return accumulate(dp, dp + 5, 0);
    }
};

class Solution {
public:
    int palindromePartition(string s, int k) {
        int n = s.size();
        vector<vector<int>> cost(n, vector<int>(n, 0));   // changes to make s[i..j] a palindrome
        for (int len = 2; len <= n; len++)
            for (int i = 0; i + len - 1 < n; i++) {
                int j = i + len - 1;
                cost[i][j] = (len > 2 ? cost[i + 1][j - 1] : 0) + (s[i] != s[j]);
            }
        const int INF = INT_MAX / 2;
        vector<vector<int>> dp(n + 1, vector<int>(k + 1, INF));
        dp[0][0] = 0;
        for (int i = 1; i <= n; i++)
            for (int p = 1; p <= min(k, i); p++)
                for (int j = p - 1; j < i; j++)               // the last part is s[j..i-1]
                    dp[i][p] = min(dp[i][p], dp[j][p - 1] + cost[j][i - 1]);
        return dp[n][k];
    }
};

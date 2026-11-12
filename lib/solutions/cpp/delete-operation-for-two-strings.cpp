class Solution {
public:
    int minDistance(string word1, string word2) {
        int m = word1.size(), n = word2.size();
        vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));   // LCS lengths
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                dp[i + 1][j + 1] = word1[i] == word2[j] ? dp[i][j] + 1 : max(dp[i][j + 1], dp[i + 1][j]);
        return m + n - 2 * dp[m][n];                         // delete everything outside the LCS
    }
};

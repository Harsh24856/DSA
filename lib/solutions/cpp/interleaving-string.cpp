class Solution {
public:
    bool isInterleave(string s1, string s2, string s3) {
        int m = s1.size(), n = s2.size();
        if (m + n != (int)s3.size()) return false;
        vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));   // dp[i][j]: s1[:i] and s2[:j] make s3[:i+j]
        dp[0][0] = true;
        for (int i = 0; i <= m; i++)
            for (int j = 0; j <= n; j++) {
                if (i && s1[i - 1] == s3[i + j - 1] && dp[i - 1][j]) dp[i][j] = true;
                if (j && s2[j - 1] == s3[i + j - 1] && dp[i][j - 1]) dp[i][j] = true;
            }
        return dp[m][n];
    }
};

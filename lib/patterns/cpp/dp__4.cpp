// dp[i][j] = LCS of the first i chars of a and the first j of b
int lcs(const string& a, const string& b) {
    int m = a.size(), n = b.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);
    return dp[m][n];
}
// @test
    H::check(lcs("abcde", "ace"), 3, "lcs");
    H::check(lcs("abc", "abc"), 3, "same");
    H::check(lcs("abc", "def"), 0, "nothing shared");
    H::check(lcs("", "a"), 0, "empty");

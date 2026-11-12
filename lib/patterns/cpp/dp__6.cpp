// dp[i][j] = cheapest way to multiply matrices i..j; fill by increasing range length
long long matrixChain(const vector<int>& d) {           // matrix i is d[i] x d[i + 1]
    int n = d.size() - 1;
    vector<vector<long long>> dp(n, vector<long long>(n, 0));
    for (int len = 2; len <= n; len++)
        for (int i = 0; i + len - 1 < n; i++) {
            int j = i + len - 1;
            dp[i][j] = LLONG_MAX;
            for (int k = i; k < j; k++)                  // last multiplication splits at k
                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k + 1][j] + 1LL * d[i] * d[k + 1] * d[j + 1]);
        }
    return dp[0][n - 1];
}
// @test
    H::check(matrixChain({10, 30, 5, 60}), 4500LL, "three matrices");
    H::check(matrixChain({40, 20, 30, 10, 30}), 26000LL, "four matrices");
    H::check(matrixChain({5, 10}), 0LL, "one matrix");

// dp[p][i] = best split of the first i elements into p parts; the last part is a[j..i)
long long splitK(const vector<int>& a, int k) {          // minimise the largest part sum
    int n = a.size();
    vector<long long> pre(n + 1, 0);
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];
    const long long INF = LLONG_MAX;
    vector<vector<long long>> dp(k + 1, vector<long long>(n + 1, INF));
    dp[0][0] = 0;
    for (int p = 1; p <= k; p++)
        for (int i = p; i <= n; i++)
            for (int j = p - 1; j < i; j++)              // earlier parts are non-empty
                if (dp[p - 1][j] < INF) dp[p][i] = min(dp[p][i], max(dp[p - 1][j], pre[i] - pre[j]));
    return dp[k][n];
}

// fewest cuts so every piece is a palindrome; pal[l][r] is filled just before it is needed
int minPalindromeCuts(const string& s) {
    int n = s.size();
    vector<vector<bool>> pal(n, vector<bool>(n, false));
    vector<int> dp(n + 1, n);
    dp[0] = -1;                                          // one piece costs zero cuts
    for (int r = 0; r < n; r++)
        for (int l = r; l >= 0; l--)
            if (s[l] == s[r] && (r - l < 2 || pal[l + 1][r - 1])) {
                pal[l][r] = true;
                dp[r + 1] = min(dp[r + 1], dp[l] + 1);
            }
    return dp[n];
}
// @test
    H::check(splitK({7, 2, 5, 10, 8}, 2), 18LL, "split into 2");
    H::check(splitK({7, 2, 5, 10, 8}, 3), 14LL, "split into 3");
    H::check(splitK({1, 4, 4}, 3), 4LL, "one each");
    H::check(minPalindromeCuts("aab"), 1, "aab");
    H::check(minPalindromeCuts("a"), 0, "single");
    H::check(minPalindromeCuts("abccbc"), 2, "abccbc");

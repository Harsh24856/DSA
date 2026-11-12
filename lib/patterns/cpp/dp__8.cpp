// dp[mask] = cheapest way to give the jobs in mask to the first popcount(mask) people
int minAssign(const vector<vector<int>>& cost) {
    int n = cost.size();
    vector<int> dp(1 << n, INT_MAX);
    dp[0] = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] == INT_MAX) continue;
        int i = popcount((unsigned)mask);                // next person to assign
        if (i == n) continue;
        for (int j = 0; j < n; j++)
            if (!(mask & (1 << j))) {
                int nm = mask | (1 << j);
                dp[nm] = min(dp[nm], dp[mask] + cost[i][j]);
            }
    }
    return dp[(1 << n) - 1];
}
// @test
    H::check(minAssign({{9, 2, 7}, {6, 4, 3}, {5, 8, 1}}), 9, "assignment");
    H::check(minAssign({{1}}), 1, "one person");
    H::check(minAssign({{1, 100}, {100, 1}}), 2, "diagonal");

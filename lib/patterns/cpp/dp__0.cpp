// Dynamic programming from scratch: top-down memo, bottom-up table, rolling rows, rebuilding the answer.
const int INF_DP = INT_MAX / 2;

// top-down: plain recursion plus a cache; -1 marks a state not solved yet
int coinTopDown(const vector<int>& coins, int a, vector<int>& memo) {
    if (a == 0) return 0;                                  // base case
    if (memo[a] != -1) return memo[a];                     // solved before
    int best = INF_DP;
    for (int c : coins)                                    // transition: the last coin
        if (c <= a) best = min(best, coinTopDown(coins, a - c, memo) + 1);
    return memo[a] = best;
}
int coinChangeTopDown(const vector<int>& coins, int amount) {
    vector<int> memo(amount + 1, -1);
    int ans = coinTopDown(coins, amount, memo);
    return ans >= INF_DP ? -1 : ans;
}

// bottom-up: fill smaller amounts first, so every dp[a - c] is ready when read
int coinChangeBottomUp(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, INF_DP);
    dp[0] = 0;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);
    return dp[amount] >= INF_DP ? -1 : dp[amount];
}

// full table, then walk back from dp[m][n] to rebuild one LCS
vector<vector<int>> lcsTable(const string& a, const string& b) {
    vector<vector<int>> dp(a.size() + 1, vector<int>(b.size() + 1, 0));
    for (size_t i = 1; i <= a.size(); i++)
        for (size_t j = 1; j <= b.size(); j++)
            dp[i][j] = a[i - 1] == b[j - 1] ? dp[i - 1][j - 1] + 1 : max(dp[i - 1][j], dp[i][j - 1]);
    return dp;
}
string lcsString(const string& a, const string& b) {
    auto dp = lcsTable(a, b);
    size_t i = a.size(), j = b.size();
    string out;
    while (i && j) {
        if (a[i - 1] == b[j - 1]) { out += a[i - 1]; i--; j--; }
        else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
        else j--;
    }
    reverse(out.begin(), out.end());
    return out;
}

// rolling rows: row i reads only row i - 1
int lcsTwoRows(const string& a, const string& b) {
    vector<int> prev(b.size() + 1, 0), cur(b.size() + 1, 0);
    for (size_t i = 1; i <= a.size(); i++) {
        for (size_t j = 1; j <= b.size(); j++)
            cur[j] = a[i - 1] == b[j - 1] ? prev[j - 1] + 1 : max(prev[j], cur[j - 1]);
        swap(prev, cur);
    }
    return prev[b.size()];
}

// 0/1 knapsack in one row: capacity goes down so each item is used once
int knapsack01(const vector<int>& w, const vector<int>& v, int cap) {
    vector<int> dp(cap + 1, 0);
    for (size_t i = 0; i < w.size(); i++)
        for (int c = cap; c >= w[i]; c--) dp[c] = max(dp[c], dp[c - w[i]] + v[i]);
    return dp[cap];
}

// counting: coins outside, amounts inside counts combinations (not orderings)
long long countWays(const vector<int>& coins, int amount) {
    vector<long long> dp(amount + 1, 0);
    dp[0] = 1;
    for (int c : coins)
        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
    return dp[amount];
}
// @test
    H::check(coinChangeTopDown({1, 2, 5}, 11), 3, "top-down 11");
    H::check(coinChangeTopDown({2}, 3), -1, "top-down impossible");
    H::check(coinChangeBottomUp({1, 2, 5}, 11), 3, "bottom-up 11");
    H::check(coinChangeBottomUp({1, 3, 4}, 6), 2, "bottom-up 6 = 3 + 3");
    H::check(coinChangeBottomUp({1}, 0), 0, "amount 0");
    H::check(lcsTable("abcde", "ace")[5][3], 3, "lcs table");
    H::check(lcsString("abcde", "ace"), string("ace"), "lcs rebuilt");
    H::check(lcsString("", "abc"), string(""), "lcs empty");
    H::check(lcsTwoRows("abcde", "ace"), 3, "lcs two rows");
    H::check(lcsTwoRows("abc", "def"), 0, "lcs none");
    H::check(knapsack01({1, 3, 4}, {15, 20, 30}, 4), 35, "knapsack");
    H::check(countWays({1, 2, 5}, 5), 4LL, "count ways");
    H::check(countWays({2}, 3), 0LL, "count none");

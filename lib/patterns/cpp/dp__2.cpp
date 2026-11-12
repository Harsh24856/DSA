// 0/1 knapsack on sums: loop capacity DOWN so each number is used at most once
bool canPartition(const vector<int>& nums) {
    int total = accumulate(nums.begin(), nums.end(), 0);
    if (total % 2) return false;
    int T = total / 2;
    vector<bool> dp(T + 1, false);
    dp[0] = true;
    for (int x : nums)
        for (int c = T; c >= x; c--)       // downward: dp[c - x] is still the old row
            dp[c] = dp[c] || dp[c - x];
    return dp[T];
}
// @test
    H::check(canPartition({1, 5, 11, 5}), true, "partition");
    H::check(canPartition({1, 2, 3, 5}), false, "no partition");
    H::check(canPartition({2, 2}), true, "two equal");
    H::check(canPartition({1, 1, 1}), false, "odd total");

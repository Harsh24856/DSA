class Solution {
public:
    int change(int amount, vector<int>& coins) {
        // unsigned: middle cells can pass int range on LeetCode's tests; the answer itself fits
        vector<unsigned long long> dp(amount + 1, 0);
        dp[0] = 1;
        for (int c : coins)                                  // coins outside: each combination counted once
            for (int a = c; a <= amount; a++) dp[a] += dp[a - c];
        return (int)dp[amount];
    }
};

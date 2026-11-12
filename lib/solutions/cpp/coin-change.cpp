class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        int INF = amount + 1;                                // more coins than any real answer
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
        return dp[amount] <= amount ? dp[amount] : -1;
    }
};

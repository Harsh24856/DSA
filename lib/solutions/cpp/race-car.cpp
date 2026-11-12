class Solution {
public:
    int racecar(int target) {
        vector<int> dp(target + 1, INT_MAX);
        dp[0] = 0;
        for (int t = 1; t <= target; t++) {
            int k = bit_width((unsigned)t);                // k A's from rest reach 2^k - 1
            if (t == (1 << k) - 1) { dp[t] = k; continue; }
            dp[t] = k + 1 + dp[(1 << k) - 1 - t];          // overshoot, reverse, come back
            for (int j = 0; j < k - 1; j++)                // stop short, back up j, reverse again
                dp[t] = min(dp[t], k - 1 + j + 2 + dp[t - (1 << (k - 1)) + (1 << j)]);
        }
        return dp[target];
    }
};

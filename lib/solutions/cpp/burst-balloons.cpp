class Solution {
public:
    int maxCoins(vector<int>& nums) {
        vector<int> a = {1};                         // pad with a 1 on each side
        a.insert(a.end(), nums.begin(), nums.end());
        a.push_back(1);
        int n = a.size();
        vector<vector<int>> dp(n, vector<int>(n, 0));    // dp[i][j]: best for balloons strictly between i and j
        for (int gap = 2; gap < n; gap++)
            for (int i = 0; i + gap < n; i++) {
                int j = i + gap;
                for (int k = i + 1; k < j; k++)          // k is the last balloon burst between i and j
                    dp[i][j] = max(dp[i][j], dp[i][k] + a[i] * a[k] * a[j] + dp[k][j]);
            }
        return dp[0][n - 1];
    }
};

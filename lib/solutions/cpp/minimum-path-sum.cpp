class Solution {
public:
    int minPathSum(vector<vector<int>>& grid) {
        int R = grid.size(), C = grid[0].size();
        vector<int> dp(C, INT_MAX);                      // one row of best sums
        dp[0] = 0;
        for (int i = 0; i < R; i++) {
            dp[0] += grid[i][0];
            for (int j = 1; j < C; j++) dp[j] = grid[i][j] + min(dp[j], dp[j - 1]);
        }
        return dp[C - 1];
    }
};

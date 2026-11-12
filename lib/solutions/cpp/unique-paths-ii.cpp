class Solution {
public:
    int uniquePathsWithObstacles(vector<vector<int>>& obstacleGrid) {
        int C = obstacleGrid[0].size();
        vector<long long> dp(C, 0);                      // paths to each cell of the current row
        dp[0] = 1;
        for (auto& row : obstacleGrid)
            for (int j = 0; j < C; j++) {
                if (row[j]) dp[j] = 0;                   // blocked
                else if (j) dp[j] += dp[j - 1];
            }
        return dp[C - 1];
    }
};

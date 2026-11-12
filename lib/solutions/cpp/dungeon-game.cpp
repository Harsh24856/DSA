class Solution {
public:
    int calculateMinimumHP(vector<vector<int>>& dungeon) {
        int R = dungeon.size(), C = dungeon[0].size();
        vector<vector<int>> dp(R + 1, vector<int>(C + 1, INT_MAX));   // health needed on entering (i, j)
        dp[R][C - 1] = dp[R - 1][C] = 1;
        for (int i = R - 1; i >= 0; i--)
            for (int j = C - 1; j >= 0; j--) {
                int need = min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];
                dp[i][j] = max(1, need);
            }
        return dp[0][0];
    }
};

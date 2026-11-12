class Solution {
public:
    int countSquares(vector<vector<int>>& matrix) {
        int R = matrix.size(), C = matrix[0].size(), total = 0;
        vector<vector<int>> dp(R + 1, vector<int>(C + 1, 0));   // dp: largest square ending here
        for (int i = 0; i < R; i++)
            for (int j = 0; j < C; j++)
                if (matrix[i][j]) {
                    dp[i + 1][j + 1] = 1 + min({dp[i][j + 1], dp[i + 1][j], dp[i][j]});
                    total += dp[i + 1][j + 1];
                }
        return total;
    }
};

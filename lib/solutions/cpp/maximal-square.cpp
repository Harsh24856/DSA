class Solution {
public:
    int maximalSquare(vector<vector<char>>& matrix) {
        int R = matrix.size(), C = matrix[0].size(), best = 0;
        vector<vector<int>> dp(R + 1, vector<int>(C + 1, 0));   // side of the largest square ending at (i, j)
        for (int i = 0; i < R; i++)
            for (int j = 0; j < C; j++)
                if (matrix[i][j] == '1') {
                    dp[i + 1][j + 1] = 1 + min({dp[i][j], dp[i][j + 1], dp[i + 1][j]});
                    best = max(best, dp[i + 1][j + 1]);
                }
        return best * best;
    }
};

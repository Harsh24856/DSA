class Solution {
public:
    vector<vector<int>> matrixBlockSum(vector<vector<int>>& mat, int k) {
        int m = mat.size(), n = mat[0].size();
        vector<vector<int>> P(m + 1, vector<int>(n + 1, 0));   // P[i][j] = sum of mat[0..i-1][0..j-1]
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) P[i + 1][j + 1] = mat[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
        vector<vector<int>> out(m, vector<int>(n));
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++) {
                int r1 = max(0, i - k), c1 = max(0, j - k);           // block clipped to the grid
                int r2 = min(m, i + k + 1), c2 = min(n, j + k + 1);
                out[i][j] = P[r2][c2] - P[r1][c2] - P[r2][c1] + P[r1][c1];
            }
        return out;
    }
};
